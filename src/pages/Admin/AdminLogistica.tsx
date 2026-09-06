// Aba Logística do painel admin.
//
// Três seções: perfis de embalagem (com atribuição às linhas do catálogo),
// transportadoras e diagnóstico.
//
// Decisão de modelagem visível aqui: peso e medida são cadastrados por PERFIL e
// ligados a uma LINHA, não por produto. As 92 cores Metamark 7 Series são o
// mesmo filme físico, e 320 dos 505 itens do catálogo vivem em arquivo .ts,
// fora do banco — cadastrar item a item não os alcançaria.
//
// As credenciais das transportadoras NÃO aparecem nem são editáveis aqui: são
// variáveis de ambiente lidas só em api/. O painel exibe apenas se existem.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LINHA_LABEL } from '../../lib/shop/erp/mapa';
import styles from './Admin.module.css';

/** Linhas do catálogo — a lista canônica é LINHA_LABEL em src/lib/shop/erp/mapa.ts. */
const LINE_KEYS: { key: string; label: string }[] = Object.entries(LINHA_LABEL).map(
  ([key, label]) => ({ key, label })
);

interface Perfil {
  id: string;
  nome: string;
  formato: 'rolo' | 'caixa' | 'tubo';
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
  valor_declarado: number | null;
  observacao: string | null;
  ativo: boolean;
}

interface PerfilLinha {
  id: string;
  profile_id: string;
  line_key: string;
  is_default: boolean;
}

interface Transportadora {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  cep_origem: string;
  dias_manuseio: number;
  modalidade: string | null;
  ordem: number;
  /** Ajustes de contrato editáveis sem deploy: fator de cubagem, serviços. */
  config: { fator_cubagem?: number; servicos?: (string | number)[] } | null;
}

interface StatusCredencial {
  slug: string;
  configurada: boolean;
  modo: string;
  /** Só Melhor Envio: validade do token pessoal, lida do próprio JWT. */
  tokenExpiraEm?: string | null;
}

/** Uma linha do resultado do teste: uma opção de frete. */
interface TesteOpcao {
  servico: string;
  servicoNome: string;
  transportadora: string;
  diasTransporte: number;
  diasTotal: number;
  valorFrete: number | null;
  modalidade?: string;
}

interface TesteResultado {
  carrier: string;
  nome?: string;
  ok: boolean;
  erro?: string;
  opcoes?: TesteOpcao[];
  pesoEnviadoKg?: number;
  pesoRealKg?: number;
  pesoCubadoKg?: number;
  fatorCubagem?: number;
  ms?: number;
}

interface TesteResposta {
  modo?: string;
  perfil?: { id: string; nome: string };
  cep?: string;
  quantidade?: number;
  resultados?: TesteResultado[];
  erro?: string;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Dias até a data, para o aviso de token perto de vencer. */
function diasAte(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 86_400_000);
}

const FORM_VAZIO = {
  nome: '',
  formato: 'rolo' as Perfil['formato'],
  peso_kg: '',
  comprimento_cm: '',
  largura_cm: '',
  altura_cm: '',
  valor_declarado: '100',
  observacao: '',
};

export default function AdminLogistica() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [vinculos, setVinculos] = useState<PerfilLinha[]>([]);
  const [carriers, setCarriers] = useState<Transportadora[]>([]);
  const [credenciais, setCredenciais] = useState<StatusCredencial[]>([]);
  const [modo, setModo] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  // Diagnóstico
  const [testeCep, setTesteCep] = useState('');
  const [testePerfil, setTestePerfil] = useState('');
  const [testeQtd, setTesteQtd] = useState('1');
  const [testeResultado, setTesteResultado] = useState<unknown>(null);
  const [testando, setTestando] = useState(false);
  const [limpandoCache, setLimpandoCache] = useState(false);
  const [cacheMsg, setCacheMsg] = useState('');
  const [servicosMe, setServicosMe] = useState<
    { id: string; nome: string; transportadora: string }[] | null
  >(null);
  const [servicosMsg, setServicosMsg] = useState('');

  // Nenhum setState antes do primeiro await: `loading` já nasce true e é
  // desligado no fim. Recarregar depois de uma alteração acontece em silêncio,
  // sem piscar o spinner — as tabelas são pequenas e a troca é instantânea.
  const carregar = useCallback(async () => {
    const [p, v, c] = await Promise.all([
      supabase.from('shipping_profiles').select('*').order('nome'),
      supabase.from('shipping_profile_lines').select('*'),
      supabase.from('shipping_carriers').select('*').order('ordem'),
    ]);

    setErro('');

    // A tabela pode ainda não existir se a migration não tiver sido aplicada —
    // dizer isso é mais útil do que uma tela vazia sem explicação.
    if (p.error) {
      setErro(
        `Não consegui ler shipping_profiles: ${p.error.message}. A migration migrations/2026-09-03_logistica_transportadoras.sql já foi aplicada?`
      );
      setLoading(false);
      return;
    }

    setPerfis((p.data ?? []) as unknown as Perfil[]);
    setVinculos((v.data ?? []) as unknown as PerfilLinha[]);
    setCarriers((c.data ?? []) as unknown as Transportadora[]);
    setLoading(false);
  }, []);

  const carregarCredenciais = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/nz/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { modo: string; carriers: StatusCredencial[] };
      setModo(json.modo);
      setCredenciais(json.carriers ?? []);
    } catch {
      // `npm run dev` devolve 503 em /api/*: sem diagnóstico, mas a aba funciona.
    }
  }, []);

  useEffect(() => {
    // A regra do React Compiler marca qualquer setState alcançável a partir de
    // um efeito, mesmo depois de await, e não distingue o padrão canônico de
    // buscar dados no mount. Não há setState síncrono em `carregar`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
    void carregarCredenciais();
  }, [carregar, carregarCredenciais]);

  const abrirModal = (perfil?: Perfil) => {
    if (perfil) {
      setEditando(perfil);
      setForm({
        nome: perfil.nome,
        formato: perfil.formato,
        peso_kg: String(perfil.peso_kg),
        comprimento_cm: String(perfil.comprimento_cm),
        largura_cm: String(perfil.largura_cm),
        altura_cm: String(perfil.altura_cm),
        valor_declarado: String(perfil.valor_declarado ?? 100),
        observacao: perfil.observacao ?? '',
      });
    } else {
      setEditando(null);
      setForm(FORM_VAZIO);
    }
    setErro('');
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const payload = {
      nome: form.nome.trim(),
      formato: form.formato,
      peso_kg: parseFloat(form.peso_kg) || 0,
      comprimento_cm: parseFloat(form.comprimento_cm) || 0,
      largura_cm: parseFloat(form.largura_cm) || 0,
      altura_cm: parseFloat(form.altura_cm) || 0,
      valor_declarado: parseFloat(form.valor_declarado) || 100,
      observacao: form.observacao.trim() || null,
    };

    const { error } = editando
      ? await supabase.from('shipping_profiles').update(payload).eq('id', editando.id)
      : await supabase.from('shipping_profiles').insert([payload]);

    if (error) setErro(error.message);
    else {
      setModalAberto(false);
      await carregar();
    }
    setSalvando(false);
  };

  const remover = async (perfil: Perfil) => {
    if (!window.confirm(`Remover o perfil "${perfil.nome}"? As linhas ligadas a ele ficam sem prazo.`))
      return;
    const { error } = await supabase.from('shipping_profiles').delete().eq('id', perfil.id);
    if (error) setErro(error.message);
    await carregar();
  };

  const alternarLinha = async (perfilId: string, lineKey: string) => {
    const existente = vinculos.find((v) => v.profile_id === perfilId && v.line_key === lineKey);
    if (existente) {
      await supabase.from('shipping_profile_lines').delete().eq('id', existente.id);
    } else {
      // O primeiro perfil de uma linha vira o padrão automaticamente — senão a
      // linha ficaria com perfil cadastrado e nenhum default, e o endpoint teria
      // que escolher arbitrariamente.
      const jaTemPadrao = vinculos.some((v) => v.line_key === lineKey && v.is_default);
      const { error } = await supabase
        .from('shipping_profile_lines')
        .insert([{ profile_id: perfilId, line_key: lineKey, is_default: !jaTemPadrao }]);
      if (error) setErro(error.message);
    }
    await carregar();
  };

  const definirPadrao = async (perfilId: string, lineKey: string) => {
    // Índice único parcial no banco garante um padrão por linha; limpar antes
    // evita bater na constraint.
    const atuais = vinculos.filter((v) => v.line_key === lineKey && v.is_default);
    for (const v of atuais) {
      await supabase.from('shipping_profile_lines').update({ is_default: false }).eq('id', v.id);
    }
    const alvo = vinculos.find((v) => v.profile_id === perfilId && v.line_key === lineKey);
    if (alvo) {
      await supabase.from('shipping_profile_lines').update({ is_default: true }).eq('id', alvo.id);
    }
    await carregar();
  };

  const alternarCarrier = async (c: Transportadora) => {
    await supabase.from('shipping_carriers').update({ ativo: !c.ativo }).eq('id', c.id);
    await carregar();
  };

  // `valor` aceita objeto porque `config` é jsonb — é como a lista de serviços
  // do Melhor Envio é gravada.
  const atualizarCarrier = async (c: Transportadora, campo: string, valor: unknown) => {
    await supabase.from('shipping_carriers').update({ [campo]: valor }).eq('id', c.id);
    await carregar();
  };

  /**
   * Catálogo de serviços do Melhor Envio. A doc é explícita: identificar
   * serviço pelo `id`, nunca pelo nome — então o admin precisa ver a lista
   * antes de restringir. O servidor busca; aqui só exibimos.
   */
  const listarServicos = async () => {
    setServicosMsg('Consultando…');
    setServicosMe(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/nz/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listarServicos: true }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        servicos?: { id: string; nome: string; transportadora: string }[];
        erro?: string;
      };
      if (json.ok && json.servicos) {
        setServicosMe(json.servicos);
        setServicosMsg(`${json.servicos.length} serviço(s) disponíveis na conta.`);
      } else {
        setServicosMsg(json.erro ?? 'Não foi possível listar.');
      }
    } catch (err) {
      setServicosMsg(err instanceof Error ? err.message : String(err));
    }
  };

  /** Lista de ids em `config.servicos`. Vazio = todos os serviços da conta. */
  const salvarServicos = async (c: Transportadora, texto: string) => {
    const ids = texto
      .split(/[,\s]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x));
    await atualizarCarrier(c, 'config', { ...(c.config ?? {}), servicos: ids });
  };

  const testar = async () => {
    setTestando(true);
    setTesteResultado(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch('/api/nz/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({
          cep: testeCep.replace(/\D/g, ''),
          profileId: testePerfil,
          qtd: Number(testeQtd) || 1,
        }),
      });
      setTesteResultado(await res.json());
    } catch (err) {
      setTesteResultado({ erro: err instanceof Error ? err.message : String(err) });
    }
    setTestando(false);
  };

  /**
   * O cache guarda prazo e valor por 7 dias. Ao ligar a transportadora real,
   * o que estiver gravado ainda é resposta do simulador — e continuaria sendo
   * servido até expirar. Este botão é o passo obrigatório da virada mock → real.
   */
  const limparCache = async () => {
    if (
      !window.confirm(
        'Apagar todas as cotações em cache? As próximas consultas voltam a chamar a transportadora.'
      )
    )
      return;
    setLimpandoCache(true);
    setCacheMsg('');
    // Sem filtro o PostgREST recusa o DELETE; o gte casa qualquer CEP de 8
    // dígitos e é a forma de dizer "todas as linhas".
    const { error } = await supabase
      .from('shipping_quote_cache')
      .delete()
      .gte('cep_destino', '0');
    setCacheMsg(error ? `Falhou: ${error.message}` : 'Cache limpo.');
    setLimpandoCache(false);
  };

  // Cobertura: sem isso ninguém percebe que metade do catálogo não mostra prazo.
  const linhasSemPerfil = LINE_KEYS.filter((l) => !vinculos.some((v) => v.line_key === l.key));

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando logística…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Peso e medidas são cadastrados por <strong>perfil de embalagem</strong> e ligados a uma
        linha do catálogo — não produto a produto. A página de produto multiplica esse perfil pela
        quantidade escolhida e cota o frete. <strong>O valor em R$ só aparece para quem está
        logado como admin</strong>; lojista, cliente e visitante veem apenas o prazo em dias úteis.
      </p>

      {erro && (
        <div className={styles.createError} style={{ marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      {/* ---------------------------------------------------- cobertura */}
      {linhasSemPerfil.length > 0 && (
        <div
          className={styles.tableSection}
          style={{ borderLeft: '3px solid #ff4444', marginBottom: '1.5rem' }}
        >
          <h3 className={styles.tableSectionTitle}>
            {linhasSemPerfil.length} linha(s) sem perfil de embalagem
          </h3>
          <p style={{ color: '#a1a1a6', fontSize: '0.85rem' }}>
            Produtos destas linhas não mostram prazo de entrega:{' '}
            {linhasSemPerfil.map((l) => l.label).join(', ')}.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------ perfis */}
      <div className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.tableSectionTitle}>Perfis de embalagem ({perfis.length})</h3>
          <button type="button" className={styles.createBtn} onClick={() => abrirModal()}>
            + Novo perfil
          </button>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Formato</th>
                <th>Peso</th>
                <th>C × L × A (cm)</th>
                <th>Vl. declarado</th>
                <th>Linhas do catálogo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {perfis.map((p) => {
                const meus = vinculos.filter((v) => v.profile_id === p.id);
                return (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.formato}</td>
                    <td>{p.peso_kg} kg</td>
                    <td>
                      {p.comprimento_cm} × {p.largura_cm} × {p.altura_cm}
                    </td>
                    <td>R$ {Number(p.valor_declarado ?? 100).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {LINE_KEYS.map((l) => {
                          const vinculo = meus.find((v) => v.line_key === l.key);
                          const ativo = Boolean(vinculo);
                          return (
                            <button
                              key={l.key}
                              type="button"
                              onClick={() => alternarLinha(p.id, l.key)}
                              onDoubleClick={() => ativo && definirPadrao(p.id, l.key)}
                              title={
                                ativo
                                  ? vinculo?.is_default
                                    ? 'Padrão da linha. Clique para desvincular.'
                                    : 'Vinculado. Duplo clique para tornar padrão.'
                                  : 'Clique para vincular'
                              }
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '99px',
                                fontSize: '0.68rem',
                                cursor: 'pointer',
                                border: `1px solid ${ativo ? '#d11e1e' : 'rgba(255,255,255,0.15)'}`,
                                background: vinculo?.is_default
                                  ? 'rgba(209,30,30,0.25)'
                                  : ativo
                                    ? 'rgba(209,30,30,0.1)'
                                    : 'transparent',
                                color: ativo ? '#f5f5f7' : '#6b6b70',
                              }}
                            >
                              {l.label}
                              {vinculo?.is_default ? ' ★' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <button type="button" className={styles.actionBtn} onClick={() => abrirModal(p)}>
                        Editar
                      </button>
                      <button type="button" className={styles.actionBtn} onClick={() => remover(p)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
              {perfis.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Nenhum perfil cadastrado. Sem perfil, nenhum produto mostra prazo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------- transportadoras */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Transportadoras — modo: {modo}</h3>
        <p style={{ color: '#6b6b70', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
          Credenciais ficam em variável de ambiente do servidor e não são editáveis aqui. Enquanto
          o modo for <code>mock</code>, os prazos e valores são simulados e não devem ser
          divulgados.
        </p>

        {/* O passo que trava a integração não é código: é o credenciamento. Fica
            escrito aqui para quem for atrás não depender de lembrar da conversa. */}
        <details style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#a1a1a6' }}>
          <summary style={{ cursor: 'pointer', color: '#f5f5f7', marginBottom: '0.5rem' }}>
            Como habilitar a cotação real da Jadlog
          </summary>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.7 }}>
            <li>
              Não existe cadastro self-service. Falar com a <strong>franquia Jadlog que atende a
              NZ</strong> (ou o comercial da matriz da região) e pedir os dados de integração da
              API do Embarcador, vinculados ao CNPJ/conta.
            </li>
            <li>
              Anotar: <strong>Token</strong>, Usuário (CNPJ), Código do Cliente, Conta Corrente (se
              correntista), Código da Franquia, <strong>modalidade negociada</strong> (o padrão
              daqui é 3 = .Package) e o <strong>fator de cubagem</strong> do contrato (o padrão
              daqui é 3333).
            </li>
            <li>
              Na Vercel, em Environment Variables de Production:{' '}
              <code>LOGISTICA_MODO=real</code>, <code>JADLOG_TOKEN</code>,{' '}
              <code>JADLOG_CNPJ</code>, <code>JADLOG_CONTA</code> (se correntista),{' '}
              <code>JADLOG_CONTRATO</code> e <code>JADLOG_MODALIDADE</code> (só se for diferente de
              3). Nunca com prefixo <code>VITE_</code>: isso publicaria a credencial no bundle.
            </li>
            <li>Redeploy — variável de ambiente só vale no próximo deploy.</li>
            <li>
              Voltar aqui: ativar a Jadlog, conferir o CEP de origem,{' '}
              <strong>limpar o cache</strong> e rodar o teste abaixo com um CEP conhecido,
              comparando o valor com o simulador do portal Jadlog.
            </li>
          </ol>
        </details>

        <details style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#a1a1a6' }}>
          <summary style={{ cursor: 'pointer', color: '#f5f5f7', marginBottom: '0.5rem' }}>
            Como habilitar o Melhor Envio
          </summary>
          <p style={{ lineHeight: 1.7 }}>
            O Melhor Envio não é transportadora: é intermediador. Uma cotação devolve{' '}
            <strong>várias opções de uma vez</strong> (Jadlog, Azul, Buslog, Correios…), com preço
            já negociado por eles e sem contrato próprio com cada uma.
          </p>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.7 }}>
            <li>
              Criar conta em <code>melhorenvio.com.br</code> com o CNPJ da NZ (cadastro é
              self-service e gratuito — não há taxa de uso da API).
            </li>
            <li>
              No painel: <strong>Integrações → Permissões de Acesso → Gerar novo token</strong>.
              Nomear <code>NZSTORE</code> e marcar <code>shipping-calculate</code> e{' '}
              <code>shipping-companies</code>. O token aparece <strong>uma única vez</strong> —
              copiar na hora.
            </li>
            <li>
              Na Vercel, em Environment Variables de Production:{' '}
              <code>MELHORENVIO_TOKEN</code> e <code>MELHORENVIO_UA_EMAIL</code> (e-mail de contato
              técnico, exigido pela API no header User-Agent). Nunca com prefixo{' '}
              <code>VITE_</code>. Para testar sem custo, apontar{' '}
              <code>MELHORENVIO_ENDPOINT</code> para <code>https://sandbox.melhorenvio.com.br</code>{' '}
              (conta e token do sandbox são separados).
            </li>
            <li>Redeploy — variável de ambiente só vale no próximo deploy.</li>
            <li>
              Voltar aqui: rodar o teste abaixo <strong>com a transportadora ainda inativa</strong>,
              conferir as opções, então ativar e <strong>limpar o cache</strong>.
            </li>
          </ol>
          <p style={{ lineHeight: 1.7 }}>
            <strong>Sobre os rolos:</strong> os Correios limitam o maior lado a 100 cm e nossos
            rolos têm 152 cm — PAC e SEDEX vão voltar recusados por dimensão, e é o esperado. Quem
            atende rolo é Jadlog, Azul Cargo e afins. O token vale 30 dias e{' '}
            <strong>não se renova sozinho</strong>: a coluna Credencial avisa a validade.
          </p>
        </details>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transportadora</th>
                <th>Credencial</th>
                <th>CEP origem</th>
                <th>Dias de manuseio</th>
                <th>Serviços</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((c) => {
                const cred = credenciais.find((k) => k.slug === c.slug);
                return (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>
                      <span className={styles.badge}>
                        {cred ? (cred.configurada ? '✓ configurada' : '✗ ausente') : '—'}
                      </span>
                      {/* O token do Melhor Envio vale 30 dias e não se renova
                          sozinho. Avisar antes de quebrar é o ponto. */}
                      {cred?.tokenExpiraEm != null &&
                        (() => {
                          const d = diasAte(cred.tokenExpiraEm);
                          if (d == null) return null;
                          return (
                            <>
                              <br />
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: d < 0 ? '#ff4444' : d <= 7 ? '#f5a623' : '#6b6b70',
                                }}
                              >
                                {d < 0 ? 'token expirado' : `token expira em ${d} dia(s)`}
                              </span>
                            </>
                          );
                        })()}
                    </td>
                    <td>
                      <input
                        className={styles.adminInput}
                        defaultValue={c.cep_origem}
                        onBlur={(e) =>
                          atualizarCarrier(c, 'cep_origem', e.target.value.replace(/\D/g, ''))
                        }
                        style={{ maxWidth: 120 }}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.adminInput}
                        type="number"
                        min={0}
                        defaultValue={c.dias_manuseio}
                        onBlur={(e) =>
                          atualizarCarrier(c, 'dias_manuseio', Number(e.target.value) || 0)
                        }
                        style={{ maxWidth: 80 }}
                      />
                    </td>
                    <td>
                      {c.slug === 'melhorenvio' ? (
                        <>
                          <input
                            className={styles.adminInput}
                            defaultValue={(c.config?.servicos ?? []).join(', ')}
                            placeholder="todos"
                            onBlur={(e) => salvarServicos(c, e.target.value)}
                            style={{ maxWidth: 140 }}
                          />
                          <br />
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ marginTop: '0.3rem', fontSize: '0.68rem' }}
                            onClick={listarServicos}
                          >
                            Listar serviços
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#6b6b70', fontSize: '0.78rem' }}>
                          {c.modalidade ?? '—'}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => alternarCarrier(c)}
                      >
                        {c.ativo ? 'Ativa — desativar' : 'Inativa — ativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------- diagnóstico */}
      <div className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.tableSectionTitle}>Teste de cotação</h3>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={limparCache}
            disabled={limpandoCache}
          >
            {limpandoCache ? 'Limpando…' : 'Limpar cache de cotações'}
          </button>
        </div>
        <p style={{ color: '#6b6b70', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
          Mostra a resposta crua da transportadora, com o peso real e o cubado lado a lado — o
          maior dos dois é o que ela cobra. Ao trocar o modo de <code>mock</code> para{' '}
          <code>real</code>, limpe o cache: as cotações simuladas valem 7 dias e continuariam
          aparecendo.
        </p>
        {cacheMsg && (
          <p style={{ color: '#a1a1a6', fontSize: '0.8rem', marginBottom: '0.8rem' }}>{cacheMsg}</p>
        )}
        <div className={styles.adminFormRow3}>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Perfil</label>
            <select
              className={styles.adminInput}
              value={testePerfil}
              onChange={(e) => setTestePerfil(e.target.value)}
            >
              <option value="">Selecione…</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>CEP de destino</label>
            <input
              className={styles.adminInput}
              value={testeCep}
              onChange={(e) => setTesteCep(e.target.value)}
              placeholder="01310100"
            />
          </div>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>Quantidade</label>
            <input
              className={styles.adminInput}
              type="number"
              min={1}
              max={50}
              value={testeQtd}
              onChange={(e) => setTesteQtd(e.target.value)}
            />
          </div>
          <div className={styles.adminFormGroup}>
            <label className={styles.adminLabel}>&nbsp;</label>
            <button
              type="button"
              className={styles.createBtnConfirm}
              onClick={testar}
              disabled={testando || !testePerfil || testeCep.replace(/\D/g, '').length !== 8}
            >
              {testando ? 'Consultando…' : 'Consultar'}
            </button>
          </div>
        </div>

        {servicosMsg && (
          <p style={{ color: '#a1a1a6', fontSize: '0.8rem', marginTop: '0.8rem' }}>{servicosMsg}</p>
        )}
        {servicosMe && servicosMe.length > 0 && (
          <div className={styles.tableScroll} style={{ marginTop: '0.5rem' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>id</th>
                  <th>Serviço</th>
                  <th>Transportadora</th>
                </tr>
              </thead>
              <tbody>
                {servicosMe.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.id}</code>
                    </td>
                    <td>{s.nome}</td>
                    <td>{s.transportadora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {testeResultado != null && (
          <>
            {/* Tabela primeiro: é o que responde "quanto custa e em quantos
                dias". O JSON cru fica ao lado, para conferir a integração. */}
            {(testeResultado as TesteResposta).resultados?.map((r) => (
              <div key={r.carrier} style={{ marginTop: '1rem' }}>
                <h4
                  style={{
                    color: '#f5f5f7',
                    fontSize: '0.85rem',
                    margin: '0 0 0.4rem',
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'baseline',
                  }}
                >
                  {r.nome ?? r.carrier}
                  {r.ok ? (
                    <span style={{ color: '#6b6b70', fontSize: '0.72rem', fontWeight: 400 }}>
                      peso enviado {r.pesoEnviadoKg} kg (real {r.pesoRealKg} · cubado{' '}
                      {r.pesoCubadoKg}, fator {r.fatorCubagem}) · {r.ms} ms
                    </span>
                  ) : (
                    <span style={{ color: '#ff4444', fontSize: '0.75rem', fontWeight: 400 }}>
                      {r.erro}
                    </span>
                  )}
                </h4>
                {r.ok && r.opcoes && (
                  <div className={styles.tableScroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Serviço</th>
                          <th>Transportadora</th>
                          <th>Transporte</th>
                          <th>Com manuseio</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.opcoes.map((o) => (
                          <tr key={`${r.carrier}:${o.servico}`}>
                            <td>
                              {o.servicoNome}
                              {o.servico && (
                                <span style={{ color: '#6b6b70' }}> (id {o.servico})</span>
                              )}
                            </td>
                            <td>{o.transportadora}</td>
                            <td>{o.diasTransporte} d</td>
                            <td>{o.diasTotal} d</td>
                            <td>{o.valorFrete != null ? BRL.format(o.valorFrete) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#a1a1a6', fontSize: '0.8rem' }}>
                Resposta crua
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: '#0a0a0c',
                  borderRadius: 8,
                  color: '#a1a1a6',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(testeResultado, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>

      {/* ------------------------------------------------------- modal */}
      {modalAberto && (
        <div className={styles.modalOverlay} onClick={() => setModalAberto(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.createModalTitle}>
              {editando ? 'Editar perfil' : 'Novo perfil de embalagem'}
            </h3>
            {erro && <div className={styles.createError}>{erro}</div>}
            <form onSubmit={salvar} className={styles.createGrid}>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Nome</label>
                <input
                  className={styles.adminInput}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Rolo Etherna 1,22 × 25 m"
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Formato</label>
                <select
                  className={styles.adminInput}
                  value={form.formato}
                  onChange={(e) =>
                    setForm({ ...form, formato: e.target.value as Perfil['formato'] })
                  }
                >
                  <option value="rolo">Rolo</option>
                  <option value="caixa">Caixa</option>
                  <option value="tubo">Tubo</option>
                </select>
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Peso (kg)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={form.peso_kg}
                  onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Comprimento (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.comprimento_cm}
                  onChange={(e) => setForm({ ...form, comprimento_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Largura (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.largura_cm}
                  onChange={(e) => setForm({ ...form, largura_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Altura (cm)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.altura_cm}
                  onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
                  required
                />
              </div>
              <div className={styles.createField}>
                <label className={styles.adminLabel}>Valor declarado (R$ / unid.)</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valor_declarado}
                  onChange={(e) => setForm({ ...form, valor_declarado: e.target.value })}
                  required
                />
                <small style={{ color: '#6b6b70', fontSize: '0.72rem' }}>
                  Valor de NF aproximado de UMA unidade. A transportadora usa isso para o seguro
                  embutido no frete. Não é preço de venda e não sai do ERP.
                </small>
              </div>
              <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.adminLabel}>Observação</label>
                <textarea
                  className={styles.adminTextarea}
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                />
              </div>
              <div className={styles.createActions}>
                <button
                  type="button"
                  className={styles.createBtnCancel}
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.createBtnConfirm} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
