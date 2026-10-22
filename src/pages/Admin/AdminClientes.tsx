// Aba Clientes do painel admin.
//
// Antes era uma tabela crua com 12 colunas e dois botões. Com cadastro de
// verdade entrando pelo site, o que a equipe precisa é: achar alguém, ver o que
// falta no cadastro, aprovar com contexto (como quê? por quê?) e saber se a
// pessoa já é cliente no NZERP.
//
// Desde 20/10/2026 NINGUÉM nasce aprovado e existem três tipos de acesso
// (cliente final, lojista/aplicador, revendedor) — o tipo decide o preço que a
// pessoa vê (Admin → Preços por acesso). Aprovar, revogar e mudar o tipo passam
// pelo servidor (/api/nz/conta): ficam no equipe_log e o cliente recebe e-mail
// quando é liberado. Leitura por RLS de admin direto no Supabase.
//
// Fase 1 do plano de indicação (21/10/2026): dentro do tipo existe a FAIXA de
// preço (Padrão, Gold, Platinum ou uma faixa só da pessoa), escolhida aqui na
// aprovação ou depois (op mudar-faixa). Quem chegou por indicação aparece com a
// etiqueta "indicação de NZ-XXXXX", e o consultor registra a PRÉ-ANÁLISE
// (perfil, volume, concorrência, faixa sugerida) na linha aberta do cliente.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { chamarConta, faltasDoCadastro, textoDoErroConta } from '../../lib/shop/conta';
import { formatarCpfCnpj } from '../../lib/documento';
import { TIPO_LABEL, TIPOS_CLIENTE, type TipoAcesso } from '../../lib/shop/papeis';
import AdminTitulosErp from './AdminTitulosErp';
import styles from './Admin.module.css';
import cl from './AdminClientes.module.css';
import type { PedidoErp, TituloErp } from '../../lib/shop/historicoErp';
import { STATUS_LABEL } from '../Painel/pedidoRotulos';
import { BRL } from './comuns/formato';

interface Cliente {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  role: TipoAcesso;
  is_approved: boolean;
  aprovado_em: string | null;
  aprovado_motivo: string | null;
  origem: string;
  erp_client_id: string | null;
  erp_candidato_id: string | null;
  erp_candidato_motivo: string | null;
  /** Central do cliente (Fase A): último convite para definir a senha (contas vindas do ERP). */
  convite_enviado_em: string | null;
  cadastro_completo_em: string | null;
  ultimo_acesso_em: string | null;
  created_at: string;
  address_street: string | null;
  address_number: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  /** Faixa de preço dentro do tipo (faixas_preco.id). Nulo = Padrão. */
  faixa_id: number | null;
  /** Quem indicou (user_profiles.id do afiliado), resolvido no cadastro. */
  indicado_por: string | null;
}

interface FaixaRow {
  id: number;
  papel: TipoAcesso;
  nome: string;
  ordem: number;
  ativa: boolean;
}

interface PreAnalise {
  id: number;
  user_id: string;
  consultor: string | null;
  origem: string | null;
  volume_mensal_estimado: number | null;
  perfil: string | null;
  linhas_interesse: string[] | null;
  preco_atual_concorrente: string | null;
  obs: string | null;
  faixa_sugerida: number | null;
  faixa_definida: number | null;
  criado_em: string;
}

interface FormPre {
  volume: string;
  perfil: string;
  linhas: string;
  concorrente: string;
  obs: string;
  faixa: string;
}

const PERFIS_PRE: { id: string; label: string }[] = [
  { id: 'aplicador', label: 'Aplicador' },
  { id: 'loja', label: 'Loja / revenda local' },
  { id: 'frota', label: 'Frota / empresa' },
  { id: 'revenda', label: 'Revendedor / distribuidor' },
  { id: 'consumidor', label: 'Consumidor final' },
  { id: 'outro', label: 'Outro' },
];

interface ContextoAdmin {
  recarregarBadges: () => Promise<void> | void;
}

const CAMPOS =
  'id, email, full_name, company_name, phone, cpf_cnpj, ie, role, is_approved, aprovado_em, aprovado_motivo, origem, erp_client_id, erp_candidato_id, erp_candidato_motivo, cadastro_completo_em, ultimo_acesso_em, created_at, address_street, address_number, address_city, address_state, address_zip, faixa_id, indicado_por, convite_enviado_em';

type Filtro = 'todos' | 'pendentes' | 'indicados' | 'erp' | 'sem-convite' | 'client' | 'lojista' | 'reseller' | 'sem-erp' | 'incompletos';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendentes', label: 'Aguardando aprovação' },
  { id: 'indicados', label: 'Indicados' },
  { id: 'erp', label: 'Vindos do ERP' },
  { id: 'sem-convite', label: 'ERP sem convite' },
  { id: 'client', label: 'Clientes finais' },
  { id: 'lojista', label: 'Lojistas' },
  { id: 'reseller', label: 'Revendedores' },
  { id: 'sem-erp', label: 'Sem cliente no ERP' },
  { id: 'incompletos', label: 'Cadastro incompleto' },
];

/** Cliente do NZERP que o job não conseguiu transformar em conta (fila do admin). */
interface PendenteErp {
  erp_client_id: string;
  nome: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  motivo: string;
  atualizado_em: string;
}

const selectEstilo: React.CSSProperties = { background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '0.3rem 0.4rem', fontSize: '0.78rem' };

function data(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
}

function endereco(c: Cliente): string {
  if (!c.address_street) return '—';
  return `${c.address_street}, ${c.address_number ?? 's/n'} — ${c.address_city ?? ''}/${c.address_state ?? ''}`;
}

export default function AdminClientes() {
  const contexto = useOutletContext<ContextoAdmin | undefined>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  // O tipo escolhido para aprovar alguém pendente (padrão: o que a pessoa pediu).
  const [tipoParaAprovar, setTipoParaAprovar] = useState<Record<string, TipoAcesso>>({});
  // A faixa escolhida para aprovar ('' = Padrão do tipo).
  const [faixaParaAprovar, setFaixaParaAprovar] = useState<Record<string, string>>({});
  const [faixas, setFaixas] = useState<FaixaRow[]>([]);
  // Código do afiliado que indicou cada conta (só o código, nunca o nome do indicado para o indicador).
  const [codigoIndicador, setCodigoIndicador] = useState<Record<string, string>>({});
  const [preAnalises, setPreAnalises] = useState<Record<string, PreAnalise[]>>({});
  const [formPre, setFormPre] = useState<Record<string, FormPre>>({});
  const [salvandoPre, setSalvandoPre] = useState('');
  // Central do cliente (Fase A): fila do ERP e o link do último convite gerado.
  const [pendentesErp, setPendentesErp] = useState<PendenteErp[]>([]);
  // Central do cliente (D12): pedidos e parcelas do ERP do cliente aberto, carregados ao expandir.
  const [historicoAdmin, setHistoricoAdmin] = useState<Record<string, { pedidos: PedidoErp[]; titulos: TituloErp[] }>>({});
  const abrirHistorico = useCallback(async (c: Cliente) => {
    if (!c.erp_client_id || historicoAdmin[c.id] !== undefined) return;
    try {
      const r = await chamarConta<{ pedidos: PedidoErp[]; titulos: TituloErp[] }>({ op: 'historico-erp', userId: c.id });
      setHistoricoAdmin((m) => ({ ...m, [c.id]: { pedidos: r.pedidos ?? [], titulos: r.titulos ?? [] } }));
    } catch {
      setHistoricoAdmin((m) => ({ ...m, [c.id]: { pedidos: [], titulos: [] } }));
    }
  }, [historicoAdmin]);
  const [criandoContas, setCriandoContas] = useState(false);
  const [linkConvite, setLinkConvite] = useState<{ email: string; link: string } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [{ data: linhas, error }, fx, pre, pend] = await Promise.all([
      supabase.from('user_profiles').select(CAMPOS).neq('role', 'admin').order('created_at', { ascending: false }).limit(1000),
      supabase.from('faixas_preco').select('id, papel, nome, ordem, ativa').order('ordem').order('nome'),
      supabase.from('pre_analises').select('*').order('criado_em', { ascending: false }).limit(500),
      supabase.from('erp_clientes_pendentes').select('*').order('atualizado_em', { ascending: false }).limit(500),
    ]);
    if (error) setErro(error.message);
    const lista = (linhas ?? []) as Cliente[];
    setClientes(lista);
    setFaixas((fx.data ?? []) as FaixaRow[]);
    setPendentesErp((pend.data ?? []) as PendenteErp[]);
    const porUser: Record<string, PreAnalise[]> = {};
    for (const p of (pre.data ?? []) as PreAnalise[]) (porUser[p.user_id] ??= []).push(p);
    setPreAnalises(porUser);
    // Quem indicou: o código NZ-XXXXX do afiliado (tabela afiliados, RLS de admin).
    const ids = [...new Set(lista.map((c) => c.indicado_por).filter((x): x is string => Boolean(x)))];
    if (ids.length) {
      const { data: afs } = await supabase.from('afiliados').select('user_id, codigo').in('user_id', ids);
      const m: Record<string, string> = {};
      for (const a of (afs ?? []) as { user_id: string; codigo: string }[]) m[a.user_id] = a.codigo;
      setCodigoIndicador(m);
    } else setCodigoIndicador({});
    setCarregando(false);
  }, []);

  const faixasDoTipo = useCallback((tipo: TipoAcesso, incluir?: number | null) => faixas.filter((f) => f.papel === tipo && (f.ativa || f.id === incluir)), [faixas]);
  const nomeFaixa = (id: number | null) => (id ? faixas.find((f) => f.id === id)?.nome ?? `#${id}` : 'Padrão');

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    return clientes.filter((c) => {
      if (filtro === 'pendentes' && c.is_approved) return false;
      if (filtro === 'indicados' && !c.indicado_por) return false;
      if (filtro === 'erp' && c.origem !== 'erp') return false;
      if (filtro === 'sem-convite' && (c.origem !== 'erp' || c.convite_enviado_em || c.ultimo_acesso_em)) return false;
      if ((filtro === 'client' || filtro === 'lojista' || filtro === 'reseller') && c.role !== filtro) return false;
      if (filtro === 'sem-erp' && c.erp_client_id) return false;
      if (filtro === 'incompletos' && c.cadastro_completo_em) return false;
      if (!termo) return true;
      return (
        (c.full_name ?? '').toLowerCase().includes(termo) ||
        (c.email ?? '').toLowerCase().includes(termo) ||
        (c.company_name ?? '').toLowerCase().includes(termo) ||
        (digitos.length >= 3 && (c.cpf_cnpj ?? '').includes(digitos)) ||
        (digitos.length >= 3 && (c.phone ?? '').replace(/\D/g, '').includes(digitos))
      );
    });
  }, [clientes, busca, filtro]);

  const acao = async (c: Cliente, body: Record<string, unknown>, okMsg: (r: Record<string, unknown>) => string) => {
    setOcupado(c.id);
    setErro('');
    setMsg('');
    try {
      const r = await chamarConta<Record<string, unknown>>({ ...body, userId: c.id });
      setMsg(okMsg(r));
      await carregar();
      await contexto?.recarregarBadges();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  // Central do cliente (Fase A): cria as contas da base do ERP agora (o sync
  // diário faz o mesmo) e convida quem veio do ERP a definir a senha.
  const criarContasErp = async () => {
    setCriandoContas(true);
    setErro('');
    setMsg('');
    try {
      const r = await chamarConta<{ lidos: number; criadas: number; vinculadas: number; pendentes: number; erros: string[] }>({ op: 'erp-criar-contas' });
      setMsg(`ERP: ${r.lidos} cliente(s) lido(s) · ${r.criadas} conta(s) criada(s) · ${r.vinculadas} vinculada(s) a contas que já existiam · ${r.pendentes} na fila${r.erros.length ? ` · ${r.erros.length} erro(s)` : ''}.`);
      await carregar();
      await contexto?.recarregarBadges();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setCriandoContas(false);
    }
  };

  const convidar = async (c: Cliente) => {
    const porEmail = window.confirm(`Convidar ${c.full_name || c.email} a definir a senha.\n\nOK = enviar por e-mail.\nCancelar = gerar o link para você mandar no WhatsApp.`);
    setOcupado(c.id);
    setErro('');
    setMsg('');
    setLinkConvite(null);
    try {
      const r = await chamarConta<{ status: string; email: string; link?: string | null; porEmail?: boolean }>({ op: 'convidar-cliente', userId: c.id, enviarEmail: porEmail });
      if (r.link) {
        await navigator.clipboard?.writeText(r.link).catch(() => undefined);
        setLinkConvite({ email: r.email, link: r.link });
        setMsg(`Link de convite gerado para ${r.email} (copiado). Vale uma vez.`);
      } else setMsg(`Convite enviado por e-mail para ${r.email}.`);
      await carregar();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  const aprovar = (c: Cliente) => {
    const tipo = tipoParaAprovar[c.id] ?? c.role;
    const faixaTxt = faixaParaAprovar[c.id] ?? '';
    const faixaId = faixaTxt ? Number(faixaTxt) : null;
    void acao(
      c,
      { op: 'aprovar', tipo, faixaId },
      (r) => `${c.full_name || c.email} liberado como ${TIPO_LABEL[tipo].toLowerCase()} · faixa ${nomeFaixa(faixaId)}${r.emailEnviado ? ' — e-mail enviado ao cliente.' : ' (o e-mail não saiu; avise pelo WhatsApp).'}`
    );
  };

  const mudarFaixa = (c: Cliente, faixaTxt: string) => {
    const faixaId = faixaTxt ? Number(faixaTxt) : null;
    if ((c.faixa_id ?? null) === faixaId) return;
    void acao(c, { op: 'mudar-faixa', faixaId }, (r) => `${c.full_name || c.email} agora está na faixa ${nomeFaixa(faixaId)}.${r.faixaNoErp ? ' Espelhado no NZERP.' : ''}`);
  };

  const salvarPreAnalise = async (c: Cliente) => {
    const f = formPre[c.id];
    if (!f) return;
    setSalvandoPre(c.id);
    setErro('');
    try {
      const { data: s } = await supabase.auth.getSession();
      const codigo = c.indicado_por ? codigoIndicador[c.indicado_por] : null;
      const volume = f.volume.trim() ? Number(f.volume.replace(/\./g, '').replace(',', '.')) : null;
      const { error } = await supabase.from('pre_analises').insert({
        user_id: c.id,
        consultor: s.session?.user.email ?? null,
        origem: codigo ? `indicação de ${codigo}` : c.indicado_por ? 'indicação' : c.origem,
        volume_mensal_estimado: volume != null && Number.isFinite(volume) ? volume : null,
        perfil: f.perfil || null,
        linhas_interesse: f.linhas.split(',').map((x) => x.trim()).filter(Boolean),
        preco_atual_concorrente: f.concorrente.trim() || null,
        obs: f.obs.trim() || null,
        faixa_sugerida: f.faixa ? Number(f.faixa) : null,
        faixa_definida: c.is_approved ? c.faixa_id : null,
      });
      if (error) throw new Error(error.message);
      // A faixa sugerida vira a escolhida para aprovar (quem aprova ainda pode mudar).
      if (!c.is_approved) setFaixaParaAprovar((m) => ({ ...m, [c.id]: f.faixa }));
      setMsg(`Pré-análise de ${c.full_name || c.email} registrada.`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvandoPre('');
    }
  };

  const formPreDe = (c: Cliente): FormPre => formPre[c.id] ?? { volume: '', perfil: '', linhas: '', concorrente: '', obs: '', faixa: faixaParaAprovar[c.id] ?? (c.faixa_id ? String(c.faixa_id) : '') };
  const setCampoPre = (c: Cliente, campo: keyof FormPre, valor: string) => setFormPre((m) => ({ ...m, [c.id]: { ...formPreDe(c), [campo]: valor } }));

  const revogar = (c: Cliente) => {
    const motivo = window.prompt(`Revogar o acesso de ${c.full_name || c.email}? A pessoa deixa de ver preços e comprar. Motivo (opcional):`, '');
    if (motivo === null) return;
    void acao(c, { op: 'revogar', motivo }, () => `Acesso de ${c.full_name || c.email} revogado.`);
  };

  const mudarTipo = (c: Cliente, tipo: TipoAcesso) => {
    if (tipo === c.role) return;
    void acao(c, { op: 'mudar-tipo', tipo }, () => `${c.full_name || c.email} agora é ${TIPO_LABEL[tipo].toLowerCase()}.`);
  };

  const procurarNoErp = async (c: Cliente) => {
    setOcupado(c.id);
    setErro('');
    try {
      const r = await chamarConta<{ jaCliente: boolean; aprovouAgora: boolean; motivo: string | null }>({ op: 'reavaliar', userId: c.id });
      if (!r.jaCliente) setErro(`Nenhum cliente no NZERP com este documento ou e-mail (${c.email}).`);
      await carregar();
    } catch (e) {
      setErro(textoDoErroConta(e));
    } finally {
      setOcupado('');
    }
  };

  const exportarCsv = () => {
    const cab = ['nome', 'email', 'telefone', 'documento', 'empresa', 'tipo', 'aprovado', 'cadastro_completo', 'erp', 'criado_em'];
    const linhas = lista.map((c) => [
      c.full_name ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.cpf_cnpj ?? '',
      c.company_name ?? '',
      TIPO_LABEL[c.role] ?? c.role,
      c.is_approved ? 'sim' : 'nao',
      c.cadastro_completo_em ? 'sim' : 'nao',
      c.erp_client_id ? 'sim' : 'nao',
      c.created_at,
    ]);
    const csv = [cab, ...linhas].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-nz-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendentes = clientes.filter((c) => !c.is_approved).length;
  const indicadosPendentes = clientes.filter((c) => !c.is_approved && c.indicado_por).length;

  return (
    <>
      <div className={styles.tableSection}>
        <p className={styles.tabDescription}>
          Contas criadas no site. <strong>Ninguém vê preço nem compra antes de você aprovar.</strong> Ao aprovar, escolha o tipo de acesso — é ele que
          decide a tabela que a pessoa vê (<Link to="/admin/precos" style={{ color: '#fff' }}>Preços por acesso</Link>). O cliente recebe um e-mail
          quando é liberado. Combinado com quem se cadastra: até 1 dia útil.
        </p>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Contas</div>
            <div className={styles.metricValue}>{clientes.length}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Aguardando aprovação</div>
            <div className={`${styles.metricValue} ${pendentes ? styles.metricValueWarning : ''}`}>{pendentes}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Indicados aguardando</div>
            <div className={`${styles.metricValue} ${indicadosPendentes ? styles.metricValueWarning : ''}`}>{indicadosPendentes}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Vinculadas ao ERP</div>
            <div className={styles.metricValue}>{clientes.filter((c) => c.erp_client_id).length}</div>
          </div>
        </div>

        {/* Busca e CSV numa linha; os filtros numa linha própria, que quebra sem deixar órfão. */}
        <div className={cl.buscaLinha}>
          <div className={styles.createField}>
            <input placeholder="Buscar por nome, e-mail, empresa, documento ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <button className={styles.createBtn} onClick={exportarCsv}>
            ↓ CSV
          </button>
        </div>
        <div className={cl.filtros}>
          {FILTROS.map((f) => (
            <button key={f.id} type="button" className={`${styles.periodBtn} ${filtro === f.id ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Central do cliente (Fase A): contas vindas da base do NZERP. */}
        <div className={cl.filtros} style={{ alignItems: 'center' }}>
          <button type="button" className={styles.actionBtn} disabled={criandoContas} onClick={() => void criarContasErp()}>
            {criandoContas ? 'Criando…' : '⟳ Criar contas do ERP agora'}
          </button>
          <span style={{ color: '#888', fontSize: '0.78rem' }}>
            Cliente qualificado no CRM ou com pedido entregue ganha conta bloqueada (lojista), já vinculada. Roda sozinho uma vez por dia; "Convidar" manda o link da senha.
          </span>
        </div>
        {linkConvite && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 0.75rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: '0.8rem', color: '#ccc', wordBreak: 'break-all' }}>
            Link de convite para <strong>{linkConvite.email}</strong> (uso único):
            <div style={{ marginTop: '0.3rem' }}>
              <code style={{ fontSize: '0.75rem' }}>{linkConvite.link}</code>
            </div>
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
              <button type="button" className={styles.actionBtn} onClick={() => void navigator.clipboard?.writeText(linkConvite.link)}>
                Copiar
              </button>
              <button type="button" className={styles.actionBtn} onClick={() => setLinkConvite(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}
        {pendentesErp.length > 0 && (
          <details style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
            <summary style={{ cursor: 'pointer', color: '#f5a623', fontSize: '0.85rem' }}>
              ERP sem conta: {pendentesErp.length} cliente(s) — o que falta arrumar no NZERP
            </summary>
            <div className={styles.tableScroll} style={{ marginTop: '0.5rem' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente no ERP</th>
                    <th>Documento</th>
                    <th>E-mail</th>
                    <th>Motivo</th>
                    <th>Visto em</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentesErp.map((p) => (
                    <tr key={p.erp_client_id}>
                      <td>{p.nome || '—'}</td>
                      <td className={cl.colDoc}>{p.cpf_cnpj ? formatarCpfCnpj(p.cpf_cnpj) : '—'}</td>
                      <td>{p.email || '—'}</td>
                      <td>{p.motivo}</td>
                      <td>{data(p.atualizado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {erro && <div className={styles.createError}>{erro}</div>}
        {msg && <p style={{ color: '#a1a1a6', fontSize: '0.85rem' }}>{msg}</p>}

        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${cl.tabela}`}>
            <thead>
              <tr>
                <th className={cl.colNome}>Nome</th>
                <th className={cl.colContato}>Contato</th>
                <th className={cl.colDoc}>Documento</th>
                <th className={cl.colTipo}>Tipo de acesso</th>
                <th>Cadastro</th>
                <th>ERP</th>
                <th>Status</th>
                <th className={cl.colAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const faltas = faltasDoCadastro(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => {
                      const vaiAbrir = aberto !== c.id;
                      setAberto(vaiAbrir ? c.id : null);
                      if (vaiAbrir) void abrirHistorico(c);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={cl.colNome}>
                      {c.full_name || '—'}
                      {c.company_name && <div style={{ fontSize: '0.72rem', color: '#777' }}>{c.company_name}</div>}
                      {c.origem === 'erp' && (
                        <span className={styles.badge} style={{ marginTop: '0.25rem', display: 'inline-block' }} title="Conta criada a partir da base do NZERP; entra só com o link do convite ou 'esqueci minha senha'">
                          do ERP{c.ultimo_acesso_em ? ' · já entrou' : c.convite_enviado_em ? ` · convite ${data(c.convite_enviado_em)}` : ' · sem convite'}
                        </span>
                      )}
                      {c.indicado_por && (
                        <span className={`${styles.badge} ${styles.badgePending}`} style={{ marginTop: '0.25rem', display: 'inline-block' }} title="Chegou pelo link ou cupom de um afiliado">
                          indicação de {codigoIndicador[c.indicado_por] ?? 'afiliado'}
                        </span>
                      )}
                      {aberto === c.id && (
                        <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.35rem', lineHeight: 1.6 }} onClick={(e) => e.stopPropagation()}>
                          {endereco(c)}
                          {c.address_zip ? ` · CEP ${c.address_zip}` : ''}
                          <br />
                          Origem: {c.origem} · criado em {data(c.created_at)} · último acesso {data(c.ultimo_acesso_em)}
                          {/* Central do cliente (D12): o consultor vê os pedidos que o cliente vê. */}
                          {c.erp_client_id && (
                            <div style={{ marginTop: '0.5rem', color: '#bbb' }}>
                              <strong style={{ color: '#fff' }}>Pedidos com a NZ</strong>
                              {historicoAdmin[c.id] === undefined ? (
                                <span> · carregando…</span>
                              ) : historicoAdmin[c.id].pedidos.length === 0 ? (
                                <span> · nenhum pedido visível para o cliente</span>
                              ) : (
                                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem' }}>
                                  {historicoAdmin[c.id].pedidos.slice(0, 8).map((p) => (
                                    <li key={p.quoteId}>
                                      #{p.numero ?? '—'} · {data(p.criadoEm)} · {STATUS_LABEL[p.status] ?? p.status} · {p.total != null ? BRL.format(Number(p.total)) : '—'}
                                      {p.notas.length ? ` · NF ${p.notas.map((n) => n.numero).filter(Boolean).join(', ')}` : ''}
                                    </li>
                                  ))}
                                  {historicoAdmin[c.id].pedidos.length > 8 && <li>e mais {historicoAdmin[c.id].pedidos.length - 8}</li>}
                                </ul>
                              )}
                            </div>
                          )}
                          {/* Central do cliente (Fase C): o que o cliente vê na aba Pagamentos. */}
                          {c.erp_client_id && (
                            <div style={{ marginTop: '0.5rem', color: '#bbb' }}>
                              <strong style={{ color: '#fff' }}>Pagamentos com a NZ</strong>
                              {historicoAdmin[c.id] === undefined ? <span> · carregando…</span> : <ResumoTitulos titulos={historicoAdmin[c.id].titulos} />}
                            </div>
                          )}
                          {c.aprovado_motivo && (
                            <>
                              <br />
                              Aprovação: {c.aprovado_motivo}
                              {c.aprovado_em ? ` (${data(c.aprovado_em)})` : ''}
                            </>
                          )}
                          {/* ------------------------------------------- pré-análise */}
                          <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(255,255,255,0.03)', color: '#bbb' }}>
                            <strong style={{ color: '#fff' }}>Pré-análise do consultor</strong>
                            {(preAnalises[c.id] ?? []).slice(0, 1).map((p) => (
                              <div key={p.id} style={{ marginTop: '0.3rem' }}>
                                Última: {data(p.criado_em)} por {p.consultor ?? '—'} · perfil {PERFIS_PRE.find((x) => x.id === p.perfil)?.label ?? p.perfil ?? '—'} · volume{' '}
                                {p.volume_mensal_estimado != null ? `R$ ${Number(p.volume_mensal_estimado).toLocaleString('pt-BR')}/mês` : '—'} · faixa sugerida {nomeFaixa(p.faixa_sugerida)}
                                {p.linhas_interesse?.length ? ` · linhas: ${p.linhas_interesse.join(', ')}` : ''}
                                {p.preco_atual_concorrente ? ` · concorrente: ${p.preco_atual_concorrente}` : ''}
                                {p.obs ? ` · ${p.obs}` : ''}
                                {(preAnalises[c.id]?.length ?? 0) > 1 ? ` (+${(preAnalises[c.id]?.length ?? 1) - 1} anterior)` : ''}
                              </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.45rem', marginTop: '0.5rem' }}>
                              <input placeholder="Volume estimado R$/mês" value={formPreDe(c).volume} inputMode="decimal" style={selectEstilo} onChange={(e) => setCampoPre(c, 'volume', e.target.value)} />
                              <select value={formPreDe(c).perfil} style={selectEstilo} onChange={(e) => setCampoPre(c, 'perfil', e.target.value)}>
                                <option value="">perfil…</option>
                                {PERFIS_PRE.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                              <input placeholder="Linhas de interesse (vírgula)" value={formPreDe(c).linhas} style={selectEstilo} onChange={(e) => setCampoPre(c, 'linhas', e.target.value)} />
                              <input placeholder="Preço atual do concorrente" value={formPreDe(c).concorrente} style={selectEstilo} onChange={(e) => setCampoPre(c, 'concorrente', e.target.value)} />
                              <select value={formPreDe(c).faixa} style={selectEstilo} onChange={(e) => setCampoPre(c, 'faixa', e.target.value)} title="Faixa sugerida">
                                <option value="">faixa sugerida: Padrão</option>
                                {faixasDoTipo(tipoParaAprovar[c.id] ?? c.role).map((f) => (
                                  <option key={f.id} value={String(f.id)}>
                                    faixa sugerida: {f.nome}
                                  </option>
                                ))}
                              </select>
                              <input placeholder="Observações" value={formPreDe(c).obs} style={{ ...selectEstilo, gridColumn: 'span 2' }} onChange={(e) => setCampoPre(c, 'obs', e.target.value)} />
                              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={salvandoPre === c.id} onClick={() => void salvarPreAnalise(c)}>
                                {salvandoPre === c.id ? 'Salvando…' : 'Registrar pré-análise'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={cl.colContato}>
                      {/* E-mail longo quebra antes do @ (e não no meio de uma palavra). */}
                      {c.email ? (
                        <>
                          {c.email.split('@')[0]}
                          <wbr />@{c.email.split('@').slice(1).join('@')}
                        </>
                      ) : (
                        '—'
                      )}
                      <div style={{ fontSize: '0.72rem', color: '#777' }}>{c.phone || '—'}</div>
                    </td>
                    <td className={cl.colDoc}>{c.cpf_cnpj ? formatarCpfCnpj(c.cpf_cnpj) : '—'}</td>
                    <td className={cl.colTipo} onClick={(e) => e.stopPropagation()}>
                      {c.is_approved ? (
                        // Aprovado: trocar o tipo ou a faixa vale na hora (muda o preço que a pessoa vê).
                        <div className={cl.pilha}>
                          <select value={c.role} disabled={ocupado === c.id} onChange={(e) => mudarTipo(c, e.target.value as TipoAcesso)} style={selectEstilo}>
                            {TIPOS_CLIENTE.map((t) => (
                              <option key={t} value={t}>
                                {TIPO_LABEL[t]}
                              </option>
                            ))}
                          </select>
                          <select value={c.faixa_id ? String(c.faixa_id) : ''} disabled={ocupado === c.id} onChange={(e) => mudarFaixa(c, e.target.value)} style={selectEstilo} title="Faixa de preço dentro do tipo">
                            <option value="">faixa: Padrão</option>
                            {faixasDoTipo(c.role, c.faixa_id).map((f) => (
                              <option key={f.id} value={String(f.id)}>
                                faixa: {f.nome}
                                {f.ativa ? '' : ' (desativada)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        // Pendente: o tipo e a faixa com que a pessoa SERÁ aprovada (valem no "Aprovar").
                        <div className={cl.pilha}>
                          <select
                            value={tipoParaAprovar[c.id] ?? c.role}
                            onChange={(e) => {
                              const t = e.target.value as TipoAcesso;
                              setTipoParaAprovar((m) => ({ ...m, [c.id]: t }));
                              // A faixa é do tipo: trocou o tipo, volta para Padrão.
                              setFaixaParaAprovar((m) => ({ ...m, [c.id]: '' }));
                            }}
                            style={selectEstilo}
                            title="Aprovar como"
                          >
                            {TIPOS_CLIENTE.map((t) => (
                              <option key={t} value={t}>
                                {TIPO_LABEL[t]}
                              </option>
                            ))}
                          </select>
                          <select value={faixaParaAprovar[c.id] ?? ''} onChange={(e) => setFaixaParaAprovar((m) => ({ ...m, [c.id]: e.target.value }))} style={selectEstilo} title="Faixa de preço dentro do tipo (a pré-análise sugere)">
                            <option value="">faixa: Padrão</option>
                            {faixasDoTipo(tipoParaAprovar[c.id] ?? c.role).map((f) => (
                              <option key={f.id} value={String(f.id)}>
                                faixa: {f.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td>
                      {c.cadastro_completo_em ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>completo</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`} title={faltas.join(', ')}>
                          falta {faltas.length}
                        </span>
                      )}
                    </td>
                    <td>
                      {c.erp_client_id ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>vinculado</span>
                      ) : c.erp_candidato_id ? (
                        <span
                          className={`${styles.badge} ${styles.badgePending}`}
                          title={`Parece ser cliente do NZERP (achado por ${c.erp_candidato_motivo === 'email' ? 'e-mail' : 'documento'}). O e-mail ainda não foi verificado: confirme antes de liberar histórico e preço.`}
                        >
                          candidato
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {c.is_approved ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprovado</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`}>Pendente</span>
                      )}
                    </td>
                    <td className={cl.colAcoes} onClick={(e) => e.stopPropagation()}>
                      {/* Só botões aqui, empilhados na mesma largura; o tipo e a faixa ficam na coluna deles. */}
                      <div className={cl.pilha}>
                        {!c.is_approved ? (
                          <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => aprovar(c)} disabled={ocupado === c.id}>
                            ✅ Aprovar
                          </button>
                        ) : (
                          <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => revogar(c)} disabled={ocupado === c.id}>
                            🔒 Revogar
                          </button>
                        )}
                        {c.origem === 'erp' && !c.ultimo_acesso_em && (
                          <button className={styles.actionBtn} onClick={() => void convidar(c)} disabled={ocupado === c.id} title="Link ou e-mail para a pessoa definir a senha">
                            {c.convite_enviado_em ? '🔗 Reenviar convite' : '🔗 Convidar'}
                          </button>
                        )}
                        {!c.erp_client_id && (
                          <button className={styles.actionBtn} onClick={() => void procurarNoErp(c)} disabled={ocupado === c.id}>
                            {c.erp_candidato_id ? '✔ Confirmar vínculo' : '🔎 Procurar no ERP'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!carregando && lista.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    Nenhuma conta com esse filtro.
                  </td>
                </tr>
              )}
              {carregando && (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminTitulosErp contas={clientes} />
    </>
  );
}

/** Central do cliente (D12): o que o cliente vê na aba Pagamentos, resumido para o consultor. */
function ResumoTitulos({ titulos }: { titulos: TituloErp[] }) {
  const fmt = (v: string | null) => (v ? new Date(v.length === 10 ? `${v}T12:00:00` : v).toLocaleDateString('pt-BR') : '—');
  const soma = (l: TituloErp[]) => BRL.format(l.reduce((s, t) => s + (t.saldo ?? t.valor ?? 0), 0));
  const vencidos = titulos.filter((t) => t.bloco === 'vencido');
  const aVencer = titulos.filter((t) => t.bloco === 'a_vencer');
  const pagos = titulos.filter((t) => t.bloco === 'pago');
  if (!titulos.length) return <span> · nenhuma parcela visível para o cliente</span>;
  const abertos = [...vencidos, ...aVencer];
  return (
    <>
      <span>
        {' '}
        · {vencidos.length} vencido(s) ({soma(vencidos)}) · {aVencer.length} a vencer ({soma(aVencer)}) · {pagos.length} pago(s) em 12 meses
      </span>
      {abertos.length > 0 && (
        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem' }}>
          {abertos.slice(0, 6).map((t) => (
            <li key={t.id}>
              {fmt(t.vencimento)} · {t.documento ?? 'parcela'}
              {t.parcela ? ` ${t.parcela}` : ''} · {BRL.format(t.saldo ?? t.valor ?? 0)} ·{' '}
              {t.combinado ? 'combinado com a NZ' : t.cobrancaViva ? 'cobrança no Asaas' : t.bloco === 'vencido' ? 'vencido sem cobrança' : 'sem cobrança (o cliente pode gerar)'}
            </li>
          ))}
          {abertos.length > 6 && <li>e mais {abertos.length - 6}</li>}
        </ul>
      )}
    </>
  );
}
