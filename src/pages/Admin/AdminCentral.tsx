// Admin → Sistema → Central de erros e mudanças.
//
// A caixa de entrada da equipe NZ. Até aqui o site guardava o que dava errado
// em quatro logs sem tela (erp_sync_log, equipe_log, erp_atribuicao_log,
// blog_ai_run_log): um SKU sem preço de atacado ficava sem preço na loja e
// ninguém ficava sabendo.
//
// Três categorias, cada uma com uma pergunta diferente:
//   Erros    — "o que está quebrado agora?" (atacado zerado, sync caiu)
//   Mudanças — "o que o ERP mexeu que eu preciso saber?" (SKU novo/removido,
//              preço que variou muito). Aqui a ação é *marcar como visto*, não
//              consertar — por isso o botão tem outro nome.
//   Problemas— o que cliente e vendedor informaram pela página do produto.
//
// A tabela é escrita SÓ pelo servidor; esta tela lê e resolve (RLS de admin em
// migrations/2026-09-11_central_ocorrencias.sql). A imagem de um relato vive em
// bucket privado e só aparece por URL assinada, gerada no clique.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import admin from './Admin.module.css';
import styles from './AdminCentral.module.css';

type Categoria = 'erro' | 'mudanca' | 'problema';
type Aba = Categoria | 'resolvida';

interface Ocorrencia {
  id: string;
  categoria: Categoria;
  tipo: string;
  status: 'aberta' | 'resolvida';
  titulo: string;
  detalhe: Record<string, unknown> | null;
  produto_slug: string | null;
  erp_sku: string | null;
  user_id: string | null;
  contato: string | null;
  mensagem: string | null;
  imagem_path: string | null;
  url: string | null;
  user_agent: string | null;
  criado_em: string;
  resolvido_em: string | null;
  nota_resolucao: string | null;
}

interface ContextoAdmin {
  recarregarBadges: () => Promise<void> | void;
}

/** Ícone e rótulo por tipo — o mesmo par usado na linha e no filtro. */
const TIPO: Record<string, { icone: string; rotulo: string }> = {
  'preco-zerado': { icone: '💸', rotulo: 'Atacado zerado' },
  'sync-erro': { icone: '⛔', rotulo: 'Sync falhou' },
  'sku-novo': { icone: '🆕', rotulo: 'SKU novo' },
  'sku-removido': { icone: '🗑️', rotulo: 'SKU removido' },
  'preco-mudou': { icone: '📈', rotulo: 'Preço mudou' },
  'problema-produto': { icone: '🗣️', rotulo: 'Informado por usuário' },
};

const MOTIVO: Record<string, string> = {
  preco: 'Preço não aparece ou está errado',
  foto: 'Foto errada ou faltando',
  estoque: 'Estoque / disponibilidade',
  descricao: 'Descrição ou ficha técnica',
  outro: 'Outro',
};

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'erro', rotulo: 'Erros' },
  { id: 'mudanca', rotulo: 'Mudanças' },
  { id: 'problema', rotulo: 'Problemas informados' },
  { id: 'resolvida', rotulo: 'Resolvidas' },
];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const CHAVE_ABA = 'nz:admin:central:aba';
/** As resolvidas são histórico, não fila: 30 dias bastam para conferir. */
const DIAS_RESOLVIDAS = 30;

function quando(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  const dias = Math.round(min / 1440);
  if (dias <= 30) return `há ${dias} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function AdminCentral() {
  const contexto = useOutletContext<ContextoAdmin | undefined>();
  const [aba, setAba] = useState<Aba>(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_ABA);
      return ABAS.some((a) => a.id === salvo) ? (salvo as Aba) : 'erro';
    } catch {
      return 'erro';
    }
  });
  const [itens, setItens] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [imagens, setImagens] = useState<Record<string, string>>({});
  const [sincronizando, setSincronizando] = useState(false);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    const desde = new Date(Date.now() - DIAS_RESOLVIDAS * 86400000).toISOString();
    // Uma consulta só: as abertas inteiras + as resolvidas recentes. São
    // dezenas de linhas, não milhares — paginar aqui seria complicar de graça.
    const { data, error } = await supabase
      .from('ocorrencias')
      .select(
        'id, categoria, tipo, status, titulo, detalhe, produto_slug, erp_sku, user_id, contato, mensagem, imagem_path, url, user_agent, criado_em, resolvido_em, nota_resolucao'
      )
      .or(`status.eq.aberta,and(status.eq.resolvida,resolvido_em.gte.${desde})`)
      .order('criado_em', { ascending: false })
      .limit(500);
    if (error) setErro(error.message);
    setItens((data ?? []) as Ocorrencia[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    // Carga inicial da lista.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const trocarAba = (id: Aba) => {
    setAba(id);
    setTipoFiltro('');
    try {
      sessionStorage.setItem(CHAVE_ABA, id);
    } catch {
      /* modo privado: só não lembra */
    }
  };

  const abertas = useMemo(() => itens.filter((o) => o.status === 'aberta'), [itens]);
  const contagem = useMemo(
    () => ({
      erro: abertas.filter((o) => o.categoria === 'erro').length,
      mudanca: abertas.filter((o) => o.categoria === 'mudanca').length,
      problema: abertas.filter((o) => o.categoria === 'problema').length,
      resolvida: itens.filter((o) => o.status === 'resolvida').length,
    }),
    [abertas, itens]
  );

  const daAba = useMemo(
    () => (aba === 'resolvida' ? itens.filter((o) => o.status === 'resolvida') : abertas.filter((o) => o.categoria === aba)),
    [aba, abertas, itens]
  );

  const tiposDaAba = useMemo(() => [...new Set(daAba.map((o) => o.tipo))], [daAba]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return daAba.filter((o) => {
      if (tipoFiltro && o.tipo !== tipoFiltro) return false;
      if (!q) return true;
      return [o.titulo, o.erp_sku, o.produto_slug, o.mensagem, o.contato]
        .filter(Boolean)
        .some((c) => (c as string).toLowerCase().includes(q));
    });
  }, [daAba, busca, tipoFiltro]);

  const marcar = async (o: Ocorrencia, status: 'aberta' | 'resolvida') => {
    setOcupado(o.id);
    setMsg('');
    const { data: sessao } = await supabase.auth.getUser();
    const patch =
      status === 'resolvida'
        ? {
            status,
            resolvido_em: new Date().toISOString(),
            resolvido_por: sessao.user?.id ?? null,
            nota_resolucao: notas[o.id]?.trim() || null,
          }
        : { status, resolvido_em: null, resolvido_por: null, nota_resolucao: null };
    const { error } = await supabase.from('ocorrencias').update(patch).eq('id', o.id);
    if (error) setMsg(`Não consegui salvar: ${error.message}`);
    else {
      setItens((lista) => lista.map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
      setNotas((n) => ({ ...n, [o.id]: '' }));
      await contexto?.recarregarBadges();
    }
    setOcupado(null);
  };

  /** Cadastro em massa no ERP vira dezenas de "SKU novo" de uma vez. */
  const verTodasAsMudancas = async () => {
    const ids = abertas.filter((o) => o.categoria === 'mudanca').map((o) => o.id);
    if (!ids.length) return;
    setOcupado('todas');
    const { data: sessao } = await supabase.auth.getUser();
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from('ocorrencias')
      .update({ status: 'resolvida', resolvido_em: agora, resolvido_por: sessao.user?.id ?? null, nota_resolucao: 'visto em lote' })
      .in('id', ids);
    if (error) setMsg(`Não consegui salvar: ${error.message}`);
    else {
      setItens((lista) =>
        lista.map((x) => (ids.includes(x.id) ? { ...x, status: 'resolvida' as const, resolvido_em: agora, nota_resolucao: 'visto em lote' } : x))
      );
      await contexto?.recarregarBadges();
    }
    setOcupado(null);
  };

  /** O bucket é privado: a URL nasce no clique e vale uma hora. */
  const verImagem = async (o: Ocorrencia) => {
    if (!o.imagem_path || imagens[o.id]) return;
    const { data, error } = await supabase.storage.from('ocorrencias').createSignedUrl(o.imagem_path, 3600);
    if (error || !data) setMsg(`Não consegui abrir a imagem: ${error?.message ?? 'sem URL'}`);
    else setImagens((m) => ({ ...m, [o.id]: data.signedUrl }));
  };

  const rodarSync = async () => {
    setSincronizando(true);
    setMsg('');
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/nz/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        body: JSON.stringify({ gatilho: 'manual' }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      setMsg(res.ok ? `Sync concluído: ${json.lidos ?? 0} SKUs lidos.` : `Sync falhou: ${JSON.stringify(json)}`);
    } catch (err) {
      setMsg(`Não consegui acionar o sync: ${err instanceof Error ? err.message : String(err)}`);
    }
    setSincronizando(false);
    await carregar();
    await contexto?.recarregarBadges();
  };

  return (
    <div className={admin.tableSection}>
      <h3 className={admin.tableSectionTitle}>Central de erros e mudanças</h3>
      <p className={admin.tabDescription}>
        O que o site precisa te contar: preço que o ERP não precificou, SKU que entrou ou sumiu, preço que
        deu um salto, e o que clientes e vendedores informaram pela página do produto. Resolver aqui é dizer
        "já tratei" — nada é apagado.
      </p>

      <div className={styles.resumo}>
        {(['erro', 'mudanca', 'problema'] as Categoria[]).map((c) => (
          <button
            key={c}
            type="button"
            className={`${styles.cartao} ${aba === c ? styles.cartaoAtivo : ''}`}
            onClick={() => trocarAba(c)}
          >
            <span className={styles.cartaoNumero}>{contagem[c]}</span>
            <span className={styles.cartaoRotulo}>
              {c === 'erro' ? 'Erros' : c === 'mudanca' ? 'Mudanças' : 'Problemas'}
            </span>
          </button>
        ))}
        <button type="button" className={admin.actionBtn} disabled={sincronizando} onClick={() => void rodarSync()}>
          {sincronizando ? 'Sincronizando…' : 'Rodar sync agora'}
        </button>
      </div>

      {msg && <p className={styles.aviso}>{msg}</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.abas} role="tablist">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            className={`${styles.aba} ${aba === a.id ? styles.abaAtiva : ''}`}
            onClick={() => trocarAba(a.id)}
          >
            {a.rotulo}
            {contagem[a.id] > 0 && <span className={styles.abaContador}>{contagem[a.id]}</span>}
          </button>
        ))}
      </div>

      <div className={styles.filtros}>
        <input
          type="search"
          className={admin.adminInput}
          placeholder="Buscar por título, SKU, slug, mensagem…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {tiposDaAba.length > 1 && (
          <select className={admin.adminInput} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos os tipos</option>
            {tiposDaAba.map((t) => (
              <option key={t} value={t}>
                {TIPO[t]?.rotulo ?? t}
              </option>
            ))}
          </select>
        )}
        {aba === 'mudanca' && contagem.mudanca > 0 && (
          <button type="button" className={admin.actionBtn} disabled={ocupado === 'todas'} onClick={() => void verTodasAsMudancas()}>
            {ocupado === 'todas' ? 'Marcando…' : `Marcar as ${contagem.mudanca} como vistas`}
          </button>
        )}
      </div>

      {carregando ? (
        <p className={styles.aviso}>Carregando…</p>
      ) : visiveis.length === 0 ? (
        <p className={styles.vazio}>
          {daAba.length === 0 ? 'Nada aberto aqui 🎉' : 'Nenhuma ocorrência com esse filtro.'}
        </p>
      ) : (
        <ul className={styles.lista}>
          {visiveis.map((o) => (
            <li key={o.id} className={`${styles.item} ${styles[`cat_${o.categoria}`]}`}>
              <div className={styles.itemTopo}>
                <span className={styles.itemIcone} aria-hidden="true">
                  {TIPO[o.tipo]?.icone ?? '•'}
                </span>
                <div className={styles.itemCabecalho}>
                  <strong className={styles.itemTitulo}>{o.titulo}</strong>
                  <span className={styles.itemMeta}>
                    {TIPO[o.tipo]?.rotulo ?? o.tipo} · {quando(o.criado_em)}
                    {o.erp_sku && <> · SKU {o.erp_sku}</>}
                  </span>
                </div>
              </div>

              <Detalhe o={o} />

              {o.mensagem && <p className={styles.mensagem}>“{o.mensagem}”</p>}

              {o.imagem_path && (
                imagens[o.id] ? (
                  <a href={imagens[o.id]} target="_blank" rel="noopener noreferrer" className={styles.miniatura}>
                    <img src={imagens[o.id]} alt="Imagem enviada por quem informou o problema" />
                  </a>
                ) : (
                  <button type="button" className={styles.linkBtn} onClick={() => void verImagem(o)}>
                    📎 Ver a imagem enviada
                  </button>
                )
              )}

              <div className={styles.links}>
                {o.produto_slug && (
                  <>
                    <Link to={`/loja/${o.produto_slug}`} target="_blank" className={styles.link}>
                      Ver na loja ↗
                    </Link>
                    <Link to={`/admin/produtos/${o.produto_slug}`} className={styles.link}>
                      Editar produto
                    </Link>
                  </>
                )}
                {o.contato && (
                  <a
                    className={styles.link}
                    href={o.contato.includes('@') ? `mailto:${o.contato}` : `https://wa.me/55${o.contato.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {o.contato}
                  </a>
                )}
                {o.url && (
                  <a className={styles.linkFraco} href={o.url} target="_blank" rel="noopener noreferrer">
                    página de origem
                  </a>
                )}
                {o.user_id && <span className={styles.linkFraco}>enviado por usuário logado</span>}
              </div>

              {o.status === 'aberta' ? (
                <div className={styles.acoes}>
                  <input
                    type="text"
                    className={admin.adminInput}
                    placeholder="Nota (opcional): o que foi feito"
                    value={notas[o.id] ?? ''}
                    onChange={(e) => setNotas((n) => ({ ...n, [o.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className={admin.actionBtnApprove}
                    disabled={ocupado === o.id}
                    onClick={() => void marcar(o, 'resolvida')}
                  >
                    {ocupado === o.id ? '…' : o.categoria === 'mudanca' ? 'Marcar como visto' : 'Resolver'}
                  </button>
                </div>
              ) : (
                <div className={styles.acoes}>
                  <span className={styles.resolvida}>
                    Resolvida {o.resolvido_em ? quando(o.resolvido_em) : ''}
                    {o.nota_resolucao ? ` — ${o.nota_resolucao}` : ''}
                  </span>
                  <button type="button" className={admin.actionBtn} disabled={ocupado === o.id} onClick={() => void marcar(o, 'aberta')}>
                    Reabrir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** O corpo de cada tipo. Sem isto a linha é só um título e uma data. */
function Detalhe({ o }: { o: Ocorrencia }) {
  const d = (o.detalhe ?? {}) as Record<string, unknown>;

  if (o.tipo === 'preco-zerado') {
    const semPreco = Boolean(d.semPreco);
    return (
      <div className={styles.detalhe}>
        <span className={semPreco ? styles.chipRuim : styles.chipAtencao}>
          {semPreco ? 'Sem preço nenhum — o produto aparece sem valor' : 'Usando a tabela de varejo'}
        </span>
        <span className={styles.par}>
          rolo: atacado {valor(d.roloAtacado)} · varejo {valor(d.roloVarejo)}
        </span>
        <span className={styles.par}>
          metro: atacado {valor(d.metroAtacado)} · varejo {valor(d.metroVarejo)}
        </span>
      </div>
    );
  }

  if (o.tipo === 'preco-mudou') {
    const pct = num(d.variacaoPct);
    return (
      <div className={styles.detalhe}>
        <span className={styles.par}>
          {String(d.campo ?? 'preço')}: {valor(d.antes)} → <strong>{valor(d.depois)}</strong>
        </span>
        {pct != null && (
          <span className={pct >= 0 ? styles.chipAtencao : styles.chipInfo}>
            {pct >= 0 ? '+' : ''}
            {pct.toFixed(1)} %
          </span>
        )}
      </div>
    );
  }

  if (o.tipo === 'sync-erro') {
    return <p className={styles.detalheTexto}>{String(d.mensagem ?? 'sem detalhe')}</p>;
  }

  if (o.tipo === 'sku-novo') {
    return (
      <div className={styles.detalhe}>
        {d.slug ? <span className={styles.par}>slug {String(d.slug)}</span> : null}
        {d.vertical ? <span className={styles.chipInfo}>{String(d.vertical)}</span> : null}
        {d.linha_key ? <span className={styles.par}>linha {String(d.linha_key)}</span> : null}
      </div>
    );
  }

  if (o.tipo === 'problema-produto') {
    return (
      <div className={styles.detalhe}>
        <span className={styles.chipInfo}>{MOTIVO[String(d.motivo)] ?? String(d.motivo ?? 'Outro')}</span>
      </div>
    );
  }

  return null;
}

function valor(v: unknown): string {
  const n = num(v);
  return n != null && n > 0 ? BRL.format(n) : '—';
}
