// /admin/precos/:papel — a configuração de UM tipo de acesso, em duas abas:
//
//   Preço         base do ERP (atacado ou varejo), percentual geral e, por
//                 linha comercial, um percentual só daquela linha (vazio
//                 herda o geral). Dá para marcar várias linhas e aplicar um
//                 percentual em lote, e clicar numa linha para abrir os
//                 produtos dela e ajustar um item específico (também com
//                 seleção e lote). Três níveis: produto > linha > geral.
//                 Simulador com o preço que este tipo vê.
//   Visibilidade  o que este tipo vê na loja: linhas comerciais (marcar
//                 = visível), rolo fechado, metro fracionado, estoque
//                 detalhado, Promoção Moto e pagamento online.
//
// Tudo é salvo de uma vez pelo botão Salvar: precos_acesso (linhas deste
// papel, nos três níveis), acesso_config (uma linha por papel) e
// precos_acesso_log com o de → para. Quem calcula é o servidor
// (api/_lib/precos/regraAcesso.ts); o simulador chama /api/nz/precos com
// `simular` e mostra a resposta dele.
//
// FAIXAS (Fase 1 do plano de indicação, 21/10/2026): dentro do tipo existem
// faixas (Gold, Platinum, ou uma faixa só de uma pessoa). O seletor no topo
// troca entre "Padrão" (as regras do tipo, como sempre) e cada faixa, que tem
// os mesmos três níveis. O que a faixa deixa vazio cai na regra do tipo; a
// base é sempre a do tipo; a visibilidade é do tipo, não da faixa. Quem está
// em qual faixa se escolhe em Admin → Clientes.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import { esquecerAcessoConfig } from '../../lib/shop/acesso';
import { TIPO_DESCRICAO, TIPO_LABEL } from '../../lib/shop/papeis';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

type PapelPreco = 'reseller' | 'lojista' | 'client';
type Base = 'atacado' | 'varejo';
type Aba = 'preco' | 'visibilidade';
const PAPEIS: PapelPreco[] = ['reseller', 'lojista', 'client'];

interface RegraRow {
  id: number;
  papel: PapelPreco;
  linha_key: string | null;
  produto_slug: string | null;
  base: Base;
  percentual: number;
  /** nulo = Padrão do tipo; preenchido = regra desta faixa */
  faixa_id: number | null;
}

interface FaixaRow {
  id: number;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativa: boolean;
}

interface LinhaLoja {
  linha_key: string;
  label: string;
  produtos: number;
}

interface ProdutoLinha {
  slug: string;
  nome: string;
  codigo: string | null;
}

interface Vis {
  linhasOcultas: Set<string>;
  veRolo: boolean;
  veMetro: boolean;
  veEstoque: boolean;
  vePromocao: boolean;
  pagamentoOnline: boolean;
}

interface Simulado {
  slug: string;
  nome: string;
  rolo: number | null;
  metro: number | null;
  roloVarejo: number | null;
  metroVarejo: number | null;
  metragemPadrao: number | null;
  linhaKey: string | null;
  doTipo: { rolo: number | null; metro: number | null } | null;
  oculto: boolean;
}

interface Mudanca {
  nivel: 'geral' | 'linha' | 'produto';
  linha: string | null;
  slug: string | null;
  de: RegraRow | null;
  para: { base: Base; percentual: number } | null;
}

const visPadrao = (papel: PapelPreco): Vis => ({ linhasOcultas: new Set(), veRolo: true, veMetro: true, veEstoque: papel !== 'client', vePromocao: true, pagamentoOnline: true });
const pctTexto = (v: number) => (Number.isFinite(v) ? String(v).replace('.', ',') : '');
const pctNumero = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
};
const campo: React.CSSProperties = { width: '7rem', background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.4rem 0.55rem', fontSize: '0.85rem', borderRadius: 4, textAlign: 'right' };
const seletor: React.CSSProperties = { background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4 };
const caixa: React.CSSProperties = { width: 16, height: 16, cursor: 'pointer' };
const linhaOpcao: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' };
const barraLote: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0.75rem', border: '1px solid rgba(212,168,83,0.35)', background: 'rgba(212,168,83,0.06)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.85rem' };
const botaoLinha: React.CSSProperties = { background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' };

const OPCOES: { k: keyof Omit<Vis, 'linhasOcultas'>; titulo: string; texto: string }[] = [
  { k: 'veRolo', titulo: 'Rolo fechado', texto: 'Vê o preço do rolo fechado e pode comprar rolo. Desligado, só o metro fracionado aparece.' },
  { k: 'veMetro', titulo: 'Metro fracionado', texto: 'Vê o preço por metro e pode comprar fracionado. Desligado, só o rolo fechado aparece.' },
  { k: 'veEstoque', titulo: 'Estoque detalhado', texto: 'Vê metros, rolos fechados e pontas no card. Desligado, vê só "disponível / últimas unidades".' },
  { k: 'vePromocao', titulo: 'Promoção Moto', texto: 'Vê o botão da promoção e paga o preço de saída (com o seu percentual). Desligado, paga a tabela.' },
  { k: 'pagamentoOnline', titulo: 'Pagamento online', texto: 'Fecha pedido com Pix, cartão ou boleto no site. Desligado, só envia o pedido como orçamento para um vendedor.' },
];

export default function AdminAcessoConfig() {
  const { papel: papelParam } = useParams();
  const papel = PAPEIS.includes(papelParam as PapelPreco) ? (papelParam as PapelPreco) : null;
  const [aba, setAba] = useState<Aba>('preco');
  const [regras, setRegras] = useState<RegraRow[]>([]);
  // Faixas do tipo. `faixaSel` nulo = Padrão (as regras do tipo).
  const [regrasTodas, setRegrasTodas] = useState<RegraRow[]>([]);
  const [faixas, setFaixas] = useState<FaixaRow[]>([]);
  const [faixaSel, setFaixaSel] = useState<number | null>(null);
  const [contasPorFaixa, setContasPorFaixa] = useState<Record<string, number>>({});
  const [faixaForm, setFaixaForm] = useState<{ nome: string; descricao: string; ordem: string; ativa: boolean }>({ nome: '', descricao: '', ordem: '0', ativa: true });
  const [novaFaixa, setNovaFaixa] = useState('');
  const [salvandoFaixa, setSalvandoFaixa] = useState(false);
  const [linhas, setLinhas] = useState<LinhaLoja[]>([]);
  const [visSalva, setVisSalva] = useState<Vis | null>(null);
  const [existeVis, setExisteVis] = useState(false);
  const [geral, setGeral] = useState<{ base: Base; pct: string }>({ base: 'atacado', pct: '0' });
  const [celulas, setCelulas] = useState<Record<string, string>>({});
  const [celulasProduto, setCelulasProduto] = useState<Record<string, string>>({});
  const [linhaDoProduto, setLinhaDoProduto] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<Vis>(visPadrao('client'));
  const [contas, setContas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  // Lote nas linhas.
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [loteLinhas, setLoteLinhas] = useState('');
  // Linha aberta (produtos dela) e lote nos produtos.
  const [aberta, setAberta] = useState<string | null>(null);
  const [produtosPorLinha, setProdutosPorLinha] = useState<Record<string, ProdutoLinha[]>>({});
  const [carregandoProdutos, setCarregandoProdutos] = useState<string | null>(null);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [selecionadosProd, setSelecionadosProd] = useState<Set<string>>(new Set());
  const [loteProd, setLoteProd] = useState('');
  // Simulador.
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<{ slug: string; nome: string; linha_key: string | null }[]>([]);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [simulando, setSimulando] = useState(false);

  /** Põe na tela as regras de UMA faixa (ou do Padrão, f = null). */
  const aplicarRegras = useCallback(
    (rows: RegraRow[], f: number | null) => {
      const minhas = rows.filter((x) => (x.faixa_id ?? null) === f);
      setRegras(minhas);
      // A base é sempre a do tipo (regra geral do Padrão), mesmo numa faixa.
      const gPadrao = rows.find((x) => !x.faixa_id && !x.linha_key && !x.produto_slug);
      const basePapel: Base = gPadrao?.base ?? (papel === 'client' ? 'varejo' : 'atacado');
      const g = minhas.find((x) => !x.linha_key && !x.produto_slug);
      // Padrão: o geral sempre existe (0 quando não há linha). Faixa: vazio = cai na regra do tipo.
      setGeral({ base: basePapel, pct: g ? pctTexto(Number(g.percentual)) : f ? '' : '0' });
      const c: Record<string, string> = {};
      const cp: Record<string, string> = {};
      const ldp: Record<string, string> = {};
      for (const row of minhas) {
        if (row.produto_slug) {
          cp[row.produto_slug] = pctTexto(Number(row.percentual));
          if (row.linha_key) ldp[row.produto_slug] = row.linha_key;
        } else if (row.linha_key) c[row.linha_key] = pctTexto(Number(row.percentual));
      }
      setCelulas(c);
      setCelulasProduto(cp);
      setLinhaDoProduto((atual) => ({ ...atual, ...ldp }));
    },
    [papel]
  );

  const carregar = useCallback(async () => {
    if (!papel) return;
    const [r, l, v, u, fx, uf] = await Promise.all([
      supabase.from('precos_acesso').select('*').eq('papel', papel).order('linha_key'),
      supabase.rpc('linhas_da_loja'),
      supabase.from('acesso_config').select('*').eq('papel', papel).maybeSingle(),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', papel),
      supabase.from('faixas_preco').select('id, nome, descricao, ordem, ativa').eq('papel', papel).order('ordem').order('nome'),
      supabase.from('user_profiles').select('faixa_id').eq('role', papel).not('faixa_id', 'is', null).limit(1000),
    ]);
    const err = r.error ?? l.error ?? v.error ?? fx.error;
    setErro(err ? `Não carregou: ${err.message} — as migrations 2026-10-20b/c/d e 2026-10-21b já foram aplicadas?` : '');
    const rows = (r.data ?? []) as RegraRow[];
    setRegrasTodas(rows);
    const listaFaixas = (fx.data ?? []) as FaixaRow[];
    setFaixas(listaFaixas);
    const cpf: Record<string, number> = {};
    for (const p of (uf.data ?? []) as { faixa_id: number | null }[]) if (p.faixa_id) cpf[String(p.faixa_id)] = (cpf[String(p.faixa_id)] ?? 0) + 1;
    setContasPorFaixa(cpf);
    const fAtual = listaFaixas.find((f) => f.id === faixaSel) ?? null;
    setFaixaForm(fAtual ? { nome: fAtual.nome, descricao: fAtual.descricao ?? '', ordem: String(fAtual.ordem), ativa: fAtual.ativa } : { nome: '', descricao: '', ordem: '0', ativa: true });
    setLinhas((l.data ?? []) as LinhaLoja[]);
    setContas(u.count ?? 0);
    aplicarRegras(rows, faixaSel && fAtual ? faixaSel : null);
    const vr = v.data as { linhas_ocultas: string[] | null; ve_rolo: boolean; ve_metro: boolean; ve_estoque: boolean; ve_promocao: boolean; pagamento_online: boolean } | null;
    const vInicial: Vis = vr
      ? { linhasOcultas: new Set(vr.linhas_ocultas ?? []), veRolo: vr.ve_rolo, veMetro: vr.ve_metro, veEstoque: vr.ve_estoque, vePromocao: vr.ve_promocao, pagamentoOnline: vr.pagamento_online }
      : visPadrao(papel);
    setExisteVis(Boolean(vr));
    setVisSalva(vInicial);
    setVis({ ...vInicial, linhasOcultas: new Set(vInicial.linhasOcultas) });
    setSelecionadas(new Set());
    setSelecionadosProd(new Set());
    setCarregando(false);
  }, [papel, faixaSel, aplicarRegras]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ------------------------------------------------------------- faixas
  const faixaAtual = faixaSel ? faixas.find((f) => f.id === faixaSel) ?? null : null;
  const nomeDoAlvo = faixaAtual ? `${TIPO_LABEL[papel ?? 'client']} · ${faixaAtual.nome}` : `${TIPO_LABEL[papel ?? 'client']} · Padrão`;

  const criarFaixa = async () => {
    const nome = novaFaixa.trim();
    if (!papel || !nome) return;
    setSalvandoFaixa(true);
    setErro('');
    const { data: s } = await supabase.auth.getSession();
    const ordem = faixas.length ? Math.max(...faixas.map((f) => f.ordem)) + 1 : 1;
    const { data, error } = await supabase.from('faixas_preco').insert({ papel, nome, ordem, ativa: true, atualizado_por: s.session?.user.id ?? null }).select('id').single();
    setSalvandoFaixa(false);
    if (error) {
      setErro(error.message.includes('duplicate') ? `Já existe a faixa "${nome}" neste tipo.` : `Não criou a faixa: ${error.message}`);
      return;
    }
    setNovaFaixa('');
    setMsg(`Faixa "${nome}" criada. Agora defina os percentuais dela e salve.`);
    setFaixaSel((data as { id: number }).id);
  };

  const salvarFaixa = async () => {
    if (!faixaAtual) return;
    const nome = faixaForm.nome.trim();
    if (!nome) {
      setErro('A faixa precisa de um nome.');
      return;
    }
    setSalvandoFaixa(true);
    setErro('');
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('faixas_preco')
      .update({ nome, descricao: faixaForm.descricao.trim() || null, ordem: Number(faixaForm.ordem) || 0, ativa: faixaForm.ativa, atualizado_em: new Date().toISOString(), atualizado_por: s.session?.user.id ?? null })
      .eq('id', faixaAtual.id);
    setSalvandoFaixa(false);
    if (error) setErro(`Não salvou a faixa: ${error.message}`);
    else {
      setMsg('Faixa salva.');
      await carregar();
    }
  };

  const excluirFaixa = async () => {
    if (!faixaAtual) return;
    const n = contasPorFaixa[String(faixaAtual.id)] ?? 0;
    if (n > 0) {
      setErro(`A faixa "${faixaAtual.nome}" tem ${n} conta${n > 1 ? 's' : ''}. Mude essas contas de faixa em Clientes antes de excluir.`);
      return;
    }
    if (!window.confirm(`Excluir a faixa "${faixaAtual.nome}" e as regras de preço dela? Isso não tem volta.`)) return;
    setSalvandoFaixa(true);
    const { error } = await supabase.from('faixas_preco').delete().eq('id', faixaAtual.id);
    setSalvandoFaixa(false);
    if (error) setErro(`Não excluiu: ${error.message}`);
    else {
      setMsg(`Faixa "${faixaAtual.nome}" excluída.`);
      esquecerAcessoConfig();
      setFaixaSel(null);
    }
  };

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 3) {
      setSugestoes([]);
      return;
    }
    const t = setTimeout(() => {
      void supabase
        .from('produtos')
        .select('slug, nome, linha_key')
        .ilike('nome', `%${termo.replace(/[%_]/g, '')}%`)
        .limit(8)
        .then(({ data }) => setSugestoes((data ?? []) as { slug: string; nome: string; linha_key: string | null }[]));
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  // ------------------------------------------------------- abrir uma linha
  const abrirLinha = async (k: string) => {
    if (aberta === k) {
      setAberta(null);
      return;
    }
    setAberta(k);
    setBuscaProduto('');
    setSelecionadosProd(new Set());
    setLoteProd('');
    if (produtosPorLinha[k]) return;
    setCarregandoProdutos(k);
    const { data, error } = await supabase.from('produtos').select('slug, nome, codigo').eq('linha_key', k).order('nome').range(0, 999);
    if (error) setErro(`Produtos da linha: ${error.message}`);
    const lista = (data ?? []) as ProdutoLinha[];
    setProdutosPorLinha((m) => ({ ...m, [k]: lista }));
    setLinhaDoProduto((m) => {
      const n = { ...m };
      for (const p of lista) n[p.slug] = k;
      return n;
    });
    setCarregandoProdutos(null);
  };

  const simular = async (p: { slug: string; nome: string }) => {
    if (!papel) return;
    setSimulando(true);
    setSugestoes([]);
    setBusca(p.nome);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const r = await fetch('/api/nz/precos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        // Com faixa escolhida, o servidor simula o tipo COM a regra dela.
        body: JSON.stringify({ slugs: [p.slug], simular: true, faixaId: faixaSel }),
      });
      const j = (await r.json()) as { itens?: Record<string, Record<string, unknown>> };
      const it = j.itens?.[p.slug];
      const porTipo = it?.porTipo as { rolo: Record<PapelPreco, number | null>; metro: Record<PapelPreco, number | null> } | undefined;
      setSimulado({
        slug: p.slug,
        nome: p.nome,
        rolo: (it?.rolo as number | null) ?? null,
        metro: (it?.metro as number | null) ?? null,
        roloVarejo: (it?.roloVarejo as number | null) ?? null,
        metroVarejo: (it?.metroVarejo as number | null) ?? null,
        metragemPadrao: (it?.metragemPadrao as number | null) ?? null,
        linhaKey: (it?.linhaKey as string | null) ?? null,
        doTipo: porTipo ? { rolo: porTipo.rolo[papel], metro: porTipo.metro[papel] } : null,
        oculto: Boolean(it?.linhaKey && vis.linhasOcultas.has(String(it.linhaKey))),
      });
    } catch (e) {
      setErro(`Simulação: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSimulando(false);
    }
  };

  // ------------------------------------------------------------ cálculos
  // Numa faixa, o que fica vazio cai na regra do TIPO (Padrão): geral vazio →
  // a linha/geral do Padrão; linha vazia → o geral da faixa, se houver, senão
  // a linha/geral do Padrão. É a mesma ordem do servidor (regraPara).
  const padraoGeralPct = useMemo(() => Number(regrasTodas.find((x) => !x.faixa_id && !x.linha_key && !x.produto_slug)?.percentual ?? 0), [regrasTodas]);
  const padraoLinhaPct = (k: string): number => {
    const row = regrasTodas.find((x) => !x.faixa_id && x.linha_key === k && !x.produto_slug);
    return row ? Number(row.percentual) : padraoGeralPct;
  };
  const geralVazio = pctNumero(geral.pct) === null;
  const pctGeral = pctNumero(geral.pct) ?? (faixaSel ? padraoGeralPct : 0);
  const pctDaLinha = (k: string): number => {
    const v = pctNumero(celulas[k] ?? '');
    if (v !== null) return v;
    return faixaSel && geralVazio ? padraoLinhaPct(k) : pctGeral;
  };
  const pctDoProduto = (slug: string, k: string): number => pctNumero(celulasProduto[slug] ?? '') ?? pctDaLinha(k);
  const produtosComRegra = useMemo(() => {
    const por: Record<string, number> = {};
    for (const [slug, txt] of Object.entries(celulasProduto)) {
      if (txt.trim() === '') continue;
      const k = linhaDoProduto[slug];
      if (k) por[k] = (por[k] ?? 0) + 1;
    }
    return por;
  }, [celulasProduto, linhaDoProduto]);

  const mudancasPreco = useMemo<Mudanca[]>(() => {
    if (!papel) return [];
    const lista: Mudanca[] = [];
    const atual = regras.find((r) => !r.linha_key && !r.produto_slug) ?? null;
    const g = pctNumero(geral.pct);
    if (faixaSel) {
      // Faixa: o geral é opcional (vazio = apaga a regra geral da faixa).
      if (g === null) {
        if (atual) lista.push({ nivel: 'geral', linha: null, slug: null, de: atual, para: null });
      } else if (!atual || Number(atual.percentual) !== g) {
        lista.push({ nivel: 'geral', linha: null, slug: null, de: atual, para: { base: geral.base, percentual: g } });
      }
    } else if (!atual || atual.base !== geral.base || Number(atual.percentual) !== pctGeral) {
      lista.push({ nivel: 'geral', linha: null, slug: null, de: atual, para: { base: geral.base, percentual: pctGeral } });
    }
    for (const l of linhas) {
      const row = regras.find((r) => r.linha_key === l.linha_key && !r.produto_slug) ?? null;
      const n = pctNumero(celulas[l.linha_key] ?? '');
      if (n === null) {
        if (row) lista.push({ nivel: 'linha', linha: l.linha_key, slug: null, de: row, para: null });
      } else if (!row || Number(row.percentual) !== n) {
        lista.push({ nivel: 'linha', linha: l.linha_key, slug: null, de: row, para: { base: geral.base, percentual: n } });
      }
    }
    const slugs = new Set<string>([...regras.filter((r) => r.produto_slug).map((r) => r.produto_slug as string), ...Object.keys(celulasProduto)]);
    for (const slug of slugs) {
      const row = regras.find((r) => r.produto_slug === slug) ?? null;
      const n = pctNumero(celulasProduto[slug] ?? '');
      const linha = linhaDoProduto[slug] ?? row?.linha_key ?? null;
      if (n === null) {
        if (row) lista.push({ nivel: 'produto', linha, slug, de: row, para: null });
      } else if (!row || Number(row.percentual) !== n) {
        lista.push({ nivel: 'produto', linha, slug, de: row, para: { base: geral.base, percentual: n } });
      }
    }
    return lista;
  }, [papel, faixaSel, regras, linhas, geral, pctGeral, celulas, celulasProduto, linhaDoProduto]);

  const visMudou = useMemo(() => {
    if (!visSalva) return false;
    if (!existeVis) return true;
    const a = [...vis.linhasOcultas].sort().join(',');
    const b = [...visSalva.linhasOcultas].sort().join(',');
    return a !== b || vis.veRolo !== visSalva.veRolo || vis.veMetro !== visSalva.veMetro || vis.veEstoque !== visSalva.veEstoque || vis.vePromocao !== visSalva.vePromocao || vis.pagamentoOnline !== visSalva.pagamentoOnline;
  }, [vis, visSalva, existeVis]);

  const invalidas = useMemo(() => {
    const ruins: string[] = [];
    const g = pctNumero(geral.pct);
    // No Padrão o geral é obrigatório; na faixa, vazio significa "cai no tipo".
    if ((g === null && !faixaSel) || (g !== null && (Number.isNaN(g) || g < 0))) ruins.push('percentual geral');
    for (const l of linhas) {
      const v = pctNumero(celulas[l.linha_key] ?? '');
      if (v !== null && (Number.isNaN(v) || v < 0)) ruins.push(l.label);
    }
    for (const [slug, txt] of Object.entries(celulasProduto)) {
      const v = pctNumero(txt);
      if (v !== null && (Number.isNaN(v) || v < 0)) ruins.push(`produto ${slug}`);
    }
    if (!vis.veRolo && !vis.veMetro) ruins.push('rolo e metro desligados ao mesmo tempo (ninguém conseguiria comprar)');
    return ruins;
  }, [geral, celulas, celulasProduto, linhas, vis, faixaSel]);

  const totalMudancas = mudancasPreco.length + (visMudou ? 1 : 0);

  // ---------------------------------------------------------------- lote
  const aplicarLoteLinhas = (valor: string) => {
    if (!selecionadas.size) return;
    setCelulas((c) => {
      const n = { ...c };
      for (const k of selecionadas) n[k] = valor;
      return n;
    });
  };
  const aplicarLoteProdutos = (valor: string) => {
    if (!selecionadosProd.size) return;
    setCelulasProduto((c) => {
      const n = { ...c };
      for (const s of selecionadosProd) n[s] = valor;
      return n;
    });
  };
  const alternar = (set: Set<string>, k: string) => {
    const n = new Set(set);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    return n;
  };

  // ---------------------------------------------------------------- salvar
  const salvar = async () => {
    if (!papel) return;
    if (invalidas.length) {
      setErro(`Confira: ${invalidas.join(', ')}.`);
      return;
    }
    if (!totalMudancas) {
      setMsg('Nada mudou.');
      return;
    }
    const alvo = faixaAtual ? `${TIPO_LABEL[papel]} · faixa ${faixaAtual.nome}` : TIPO_LABEL[papel];
    if (!window.confirm(`Salvar as alterações de ${alvo}? Valem para todo mundo ${faixaAtual ? 'dessa faixa' : 'desse tipo'} no próximo carregamento da loja.`)) return;
    setSalvando(true);
    setErro('');
    setMsg('');
    const { data: s } = await supabase.auth.getSession();
    const quem = s.session?.user.id ?? null;
    const agora = new Date().toISOString();
    const falhas: string[] = [];
    for (const m of mudancasPreco) {
      let error: { message: string } | null = null;
      if (m.para === null && m.de) ({ error } = await supabase.from('precos_acesso').delete().eq('id', m.de.id));
      else if (m.para && m.de) ({ error } = await supabase.from('precos_acesso').update({ base: m.para.base, percentual: m.para.percentual, atualizado_em: agora, atualizado_por: quem }).eq('id', m.de.id));
      else if (m.para) ({ error } = await supabase.from('precos_acesso').insert({ papel, faixa_id: faixaSel, linha_key: m.linha, produto_slug: m.slug, base: m.para.base, percentual: m.para.percentual, atualizado_em: agora, atualizado_por: quem }));
      if (error) {
        falhas.push(`${m.slug ?? m.linha ?? 'geral'}: ${error.message}`);
        continue;
      }
      await supabase.from('precos_acesso_log').insert({ quem, papel, faixa_id: faixaSel, linha_key: m.linha, produto_slug: m.slug, de: m.de ? { base: m.de.base, percentual: Number(m.de.percentual) } : null, para: m.para });
    }
    if (visMudou) {
      const para = { papel, linhas_ocultas: [...vis.linhasOcultas], ve_rolo: vis.veRolo, ve_metro: vis.veMetro, ve_estoque: vis.veEstoque, ve_promocao: vis.vePromocao, pagamento_online: vis.pagamentoOnline, atualizado_em: agora, atualizado_por: quem };
      const { error } = await supabase.from('acesso_config').upsert(para, { onConflict: 'papel' });
      if (error) falhas.push(`visibilidade: ${error.message}`);
      else {
        await supabase.from('precos_acesso_log').insert({
          quem,
          papel,
          linha_key: 'visibilidade',
          de: visSalva ? { linhas_ocultas: [...visSalva.linhasOcultas], ve_rolo: visSalva.veRolo, ve_metro: visSalva.veMetro, ve_estoque: visSalva.veEstoque, ve_promocao: visSalva.vePromocao, pagamento_online: visSalva.pagamentoOnline } : null,
          para: { linhas_ocultas: para.linhas_ocultas, ve_rolo: para.ve_rolo, ve_metro: para.ve_metro, ve_estoque: para.ve_estoque, ve_promocao: para.ve_promocao, pagamento_online: para.pagamento_online },
        });
      }
    }
    setSalvando(false);
    esquecerAcessoConfig();
    if (falhas.length) setErro(`Não salvou tudo: ${falhas.join(' · ')}`);
    else setMsg('Salvo. Já vale na loja.');
    await carregar();
    if (simulado) void simular({ slug: simulado.slug, nome: simulado.nome });
  };

  if (!papel) {
    return (
      <div>
        <Link to="/admin/precos" className={ped.voltar}>
          ← Tipos de acesso
        </Link>
        <p className={ped.aviso}>Tipo de acesso desconhecido.</p>
      </div>
    );
  }
  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando…</p>;

  const metroDe = (v: number | null) => (v != null ? `${BRL.format(v)}/m` : '—');
  const roloDe = (v: number | null) => (v != null ? `${BRL.format(v)}/rolo` : '—');
  const todasSelecionadas = linhas.length > 0 && selecionadas.size === linhas.length;
  const produtosAbertos = aberta ? produtosPorLinha[aberta] ?? [] : [];
  const termoProd = buscaProduto.trim().toLowerCase();
  const produtosFiltrados = termoProd ? produtosAbertos.filter((p) => p.nome.toLowerCase().includes(termoProd) || (p.codigo ?? '').toLowerCase().includes(termoProd) || p.slug.includes(termoProd)) : produtosAbertos;
  const todosProdSelecionados = produtosFiltrados.length > 0 && produtosFiltrados.every((p) => selecionadosProd.has(p.slug));

  return (
    <div>
      <header className={ped.topo}>
        <div>
          <Link to="/admin/precos" className={ped.voltar}>
            ← Tipos de acesso
          </Link>
          <h2 className={ped.titulo}>{nomeDoAlvo}</h2>
          <p className={ped.mudo}>
            {faixaAtual
              ? `${faixaAtual.descricao || 'Faixa dentro do tipo.'} · ${contasPorFaixa[String(faixaAtual.id)] ?? 0} conta${(contasPorFaixa[String(faixaAtual.id)] ?? 0) === 1 ? '' : 's'} nesta faixa`
              : `${TIPO_DESCRICAO[papel]} · ${contas} conta${contas === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className={ped.topoDireita}>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={salvando || totalMudancas === 0} onClick={() => void salvar()}>
            {salvando ? 'Salvando…' : totalMudancas ? `Salvar ${totalMudancas} alteração(ões)` : 'Nada para salvar'}
          </button>
          {totalMudancas > 0 && (
            <button type="button" className={styles.actionBtn} disabled={salvando} onClick={() => void carregar()}>
              Descartar
            </button>
          )}
        </div>
      </header>
      {erro && <p className={ped.aviso}>{erro}</p>}
      {msg && <p className={ped.msg}>{msg}</p>}

      {/* ------------------------------------------------------------ faixas */}
      <div className={styles.tableSection} style={{ marginBottom: '1rem' }}>
        <h3 className={styles.tableSectionTitle}>Faixas de {TIPO_LABEL[papel].toLowerCase()}</h3>
        <p className={styles.tabDescription}>
          <strong>Padrão</strong> é a regra do tipo, para quem não tem faixa. Cada faixa (Gold, Platinum, ou uma faixa criada para um único cliente) tem os mesmos
          três níveis; o que a faixa deixar vazio cai na regra do tipo. A base é sempre a do tipo. Quem está em qual faixa se escolhe em{' '}
          <Link to="/admin/clientes" style={{ color: '#fff' }}>Clientes</Link>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {[{ id: null as number | null, nome: 'Padrão', ativa: true }, ...faixas].map((f) => {
            const ativo = (f.id ?? null) === faixaSel;
            const n = f.id ? contasPorFaixa[String(f.id)] ?? 0 : Math.max(0, contas - Object.values(contasPorFaixa).reduce((s, x) => s + x, 0));
            return (
              <button
                key={f.id ?? 'padrao'}
                type="button"
                className={`${styles.periodBtn} ${ativo ? styles.periodBtnActive : ''}`}
                style={f.ativa ? undefined : { opacity: 0.5 }}
                title={f.ativa ? undefined : 'faixa desativada'}
                onClick={() => {
                  if ((f.id ?? null) === faixaSel) return;
                  if (totalMudancas > 0 && !window.confirm('Há alterações não salvas. Trocar de faixa descarta essas alterações. Continuar?')) return;
                  if (f.id && aba === 'visibilidade') setAba('preco');
                  setFaixaSel(f.id ?? null);
                }}
              >
                {f.nome} <small style={{ opacity: 0.7 }}>· {n}</small>
              </button>
            );
          })}
          <span className={ped.mudo} style={{ marginLeft: '0.25rem' }}>+ nova faixa:</span>
          <input value={novaFaixa} placeholder="ex.: Diamond, ou o nome do cliente" style={{ ...seletor, width: '16rem' }} onChange={(e) => setNovaFaixa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void criarFaixa()} />
          <button type="button" className={styles.actionBtn} disabled={salvandoFaixa || !novaFaixa.trim()} onClick={() => void criarFaixa()}>
            Criar
          </button>
        </div>
        {faixaAtual && (
          <div style={{ marginTop: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
            <div className={styles.createField} style={{ minWidth: 180 }}>
              <label>Nome da faixa</label>
              <input value={faixaForm.nome} onChange={(e) => setFaixaForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className={styles.createField} style={{ minWidth: 280, flex: 1 }}>
              <label>Descrição (só a equipe vê)</label>
              <input value={faixaForm.descricao} placeholder="quem entra aqui e por quê" onChange={(e) => setFaixaForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className={styles.createField} style={{ width: 90 }}>
              <label>Ordem</label>
              <input value={faixaForm.ordem} inputMode="numeric" onChange={(e) => setFaixaForm((f) => ({ ...f, ordem: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingBottom: '0.55rem', cursor: 'pointer' }}>
              <input type="checkbox" style={caixa} checked={faixaForm.ativa} onChange={(e) => setFaixaForm((f) => ({ ...f, ativa: e.target.checked }))} />
              <span>ativa</span>
            </label>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={salvandoFaixa} onClick={() => void salvarFaixa()}>
              Salvar faixa
            </button>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDeny}`} disabled={salvandoFaixa} onClick={() => void excluirFaixa()}>
              Excluir
            </button>
          </div>
        )}
      </div>

      <div className={styles.periodFilters} style={{ marginBottom: '1.25rem' }}>
        {(
          [
            ['preco', `Preço${mudancasPreco.length ? ` (${mudancasPreco.length})` : ''}`],
            // A visibilidade é do TIPO: numa faixa a aba some.
            ...(faixaSel ? [] : [['visibilidade', `Visibilidade${visMudou ? ' (•)' : ''}`]]),
          ] as [Aba, string][]
        ).map(([id, rotulo]) => (
          <button key={id} type="button" className={`${styles.periodBtn} ${aba === id ? styles.periodBtnActive : ''}`} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- preço */}
      {aba === 'preco' && (
        <>
          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>Regra geral{faixaAtual ? ` da faixa ${faixaAtual.nome}` : ''}</h3>
            <p className={styles.tabDescription}>
              preço = base do ERP × (1 + percentual). Três níveis, do mais específico ao mais geral: <strong>produto</strong> (abra a linha e ajuste um item)
              &gt; <strong>linha comercial</strong> &gt; <strong>geral</strong>. Vazio herda o nível de cima
              {faixaAtual ? ` — e o que a faixa inteira deixar vazio cai na regra do tipo (Padrão: ${pctTexto(padraoGeralPct)}% geral)` : ''}. A base é sempre a do tipo.
            </p>
            <div className={styles.adminFormRow3}>
              <div className={styles.createField}>
                <label>Base (tabela do ERP){faixaAtual ? ' — a do tipo' : ''}</label>
                <select value={geral.base} disabled={Boolean(faixaAtual)} style={{ ...seletor, width: '100%', opacity: faixaAtual ? 0.6 : 1 }} onChange={(e) => setGeral((g) => ({ ...g, base: e.target.value as Base }))}>
                  <option value="atacado">atacado (mínimo)</option>
                  <option value="varejo">varejo (publicado)</option>
                </select>
              </div>
              <div className={styles.createField}>
                <label>Percentual geral (%)</label>
                <input value={geral.pct} placeholder={faixaAtual ? `vazio = do tipo (${pctTexto(padraoGeralPct)})` : undefined} inputMode="decimal" onChange={(e) => setGeral((g) => ({ ...g, pct: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>Por linha comercial</h3>
            <p className={styles.tabDescription}>
              Marque linhas para aplicar um percentual em lote. Clique no nome da linha para abrir os produtos dela e ajustar um item específico.
            </p>

            {selecionadas.size > 0 && (
              <div style={barraLote}>
                <strong style={{ color: '#D4A853' }}>
                  {selecionadas.size} linha{selecionadas.size > 1 ? 's' : ''} selecionada{selecionadas.size > 1 ? 's' : ''}
                </strong>
                <span className={ped.mudo}>→ aplicar</span>
                <input value={loteLinhas} placeholder="%" style={campo} inputMode="decimal" onChange={(e) => setLoteLinhas(e.target.value)} />
                <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={pctNumero(loteLinhas) === null || Number.isNaN(pctNumero(loteLinhas))} onClick={() => aplicarLoteLinhas(loteLinhas.trim())}>
                  Aplicar às selecionadas
                </button>
                <button type="button" className={styles.actionBtn} onClick={() => aplicarLoteLinhas('')}>
                  Limpar (herdar o geral)
                </button>
                <button type="button" className={styles.actionBtn} onClick={() => setSelecionadas(new Set())}>
                  Desmarcar
                </button>
              </div>
            )}

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" style={caixa} checked={todasSelecionadas} onChange={(e) => setSelecionadas(e.target.checked ? new Set(linhas.map((l) => l.linha_key)) : new Set())} title="Marcar todas" />
                    </th>
                    <th>Linha</th>
                    <th>Produtos</th>
                    <th>Percentual (%)</th>
                    <th>Vale</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => {
                    const k = l.linha_key;
                    const txt = celulas[k] ?? '';
                    const efetivo = pctDaLinha(k);
                    const oculta = vis.linhasOcultas.has(k);
                    const comRegra = produtosComRegra[k] ?? 0;
                    const estaAberta = aberta === k;
                    return (
                      <>
                        <tr key={k} style={oculta ? { opacity: 0.45 } : undefined}>
                          <td>
                            <input type="checkbox" style={caixa} checked={selecionadas.has(k)} onChange={() => setSelecionadas((s) => alternar(s, k))} />
                          </td>
                          <td>
                            <button type="button" style={botaoLinha} onClick={() => void abrirLinha(k)} title="Abrir os produtos desta linha">
                              <span style={{ display: 'inline-block', width: '1.1em', color: '#D4A853' }}>{estaAberta ? '▾' : '▸'}</span>
                              {l.label}
                            </button>
                            <br />
                            <small className={ped.mudo} style={{ paddingLeft: '1.1em' }}>
                              {k}
                              {comRegra ? ` · ${comRegra} produto${comRegra > 1 ? 's' : ''} com % próprio` : ''}
                            </small>
                          </td>
                          <td className={ped.mudo}>{l.produtos}</td>
                          <td>
                            <input value={txt} placeholder={faixaSel && geralVazio ? `tipo ${pctTexto(padraoLinhaPct(k))}` : `geral ${pctTexto(pctGeral)}`} style={campo} inputMode="decimal" onChange={(e) => setCelulas((c) => ({ ...c, [k]: e.target.value }))} />
                          </td>
                          <td className={ped.mudo}>
                            {oculta ? 'linha oculta para este tipo' : `${geral.base} + ${Number.isNaN(efetivo) ? '?' : pctTexto(efetivo)}%`}
                            {!oculta && faixaSel && txt.trim() === '' && geralVazio ? ' · do tipo' : ''}
                          </td>
                        </tr>
                        {estaAberta && (
                          <tr key={`${k}-produtos`}>
                            <td colSpan={5} style={{ background: 'rgba(255,255,255,0.025)', padding: '0.9rem 1rem 1rem 2.2rem' }}>
                              {carregandoProdutos === k ? (
                                <p className={ped.mudo}>Carregando produtos…</p>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                                    <strong style={{ color: '#fff' }}>
                                      {l.label} · {produtosAbertos.length} produto{produtosAbertos.length === 1 ? '' : 's'}
                                    </strong>
                                    <input className={ped.busca} style={{ maxWidth: 320, padding: '0.45rem 0.7rem' }} placeholder="Filtrar por nome, código ou slug" value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} />
                                    <span className={ped.mudo}>vazio = herda a linha ({pctTexto(efetivo)}%)</span>
                                  </div>
                                  {selecionadosProd.size > 0 && (
                                    <div style={barraLote}>
                                      <strong style={{ color: '#D4A853' }}>
                                        {selecionadosProd.size} produto{selecionadosProd.size > 1 ? 's' : ''} selecionado{selecionadosProd.size > 1 ? 's' : ''}
                                      </strong>
                                      <span className={ped.mudo}>→ aplicar</span>
                                      <input value={loteProd} placeholder="%" style={campo} inputMode="decimal" onChange={(e) => setLoteProd(e.target.value)} />
                                      <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={pctNumero(loteProd) === null || Number.isNaN(pctNumero(loteProd))} onClick={() => aplicarLoteProdutos(loteProd.trim())}>
                                        Aplicar aos selecionados
                                      </button>
                                      <button type="button" className={styles.actionBtn} onClick={() => aplicarLoteProdutos('')}>
                                        Limpar (herdar a linha)
                                      </button>
                                      <button type="button" className={styles.actionBtn} onClick={() => setSelecionadosProd(new Set())}>
                                        Desmarcar
                                      </button>
                                    </div>
                                  )}
                                  <table className={styles.table} style={{ fontSize: '0.82rem' }}>
                                    <thead>
                                      <tr>
                                        <th style={{ width: 36 }}>
                                          <input
                                            type="checkbox"
                                            style={caixa}
                                            checked={todosProdSelecionados}
                                            onChange={(e) =>
                                              setSelecionadosProd((s) => {
                                                const n = new Set(s);
                                                for (const p of produtosFiltrados) {
                                                  if (e.target.checked) n.add(p.slug);
                                                  else n.delete(p.slug);
                                                }
                                                return n;
                                              })
                                            }
                                            title="Marcar os produtos listados"
                                          />
                                        </th>
                                        <th>Produto</th>
                                        <th>Percentual (%)</th>
                                        <th>Vale</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {produtosFiltrados.map((p) => {
                                        const t = celulasProduto[p.slug] ?? '';
                                        const ef = pctDoProduto(p.slug, k);
                                        return (
                                          <tr key={p.slug}>
                                            <td>
                                              <input type="checkbox" style={caixa} checked={selecionadosProd.has(p.slug)} onChange={() => setSelecionadosProd((s) => alternar(s, p.slug))} />
                                            </td>
                                            <td>
                                              {p.nome}
                                              <br />
                                              <small className={ped.mudo}>
                                                {p.codigo ? `${p.codigo} · ` : ''}
                                                {p.slug}
                                              </small>
                                            </td>
                                            <td>
                                              <input value={t} placeholder={`linha ${pctTexto(efetivo)}`} style={campo} inputMode="decimal" onChange={(e) => setCelulasProduto((c) => ({ ...c, [p.slug]: e.target.value }))} />
                                            </td>
                                            <td className={ped.mudo}>
                                              {Number.isNaN(ef) ? '?' : `${geral.base} + ${pctTexto(ef)}%`}
                                              {t.trim() !== '' ? ' · próprio' : ''}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {produtosFiltrados.length === 0 && (
                                        <tr>
                                          <td colSpan={4} className={ped.mudo}>
                                            {produtosAbertos.length === 0 ? 'Nenhum produto nesta linha.' : 'Nada com esse filtro.'}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>Simulador</h3>
            <p className={styles.tabDescription}>
              Escolha um produto e veja o que {TIPO_LABEL[papel].toLowerCase()}
              {faixaAtual ? ` na faixa ${faixaAtual.nome}` : ''} vê — calculado pelo servidor com as regras já salvas.
            </p>
            <div style={{ position: 'relative', maxWidth: 520 }}>
              <input className={ped.busca} style={{ maxWidth: 'none', width: '100%' }} placeholder="Nome do produto (3 letras ou mais)…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              {sugestoes.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, background: '#141417', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, marginTop: 2 }}>
                  {sugestoes.map((s) => (
                    <button key={s.slug} type="button" onClick={() => void simular(s)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, color: '#ddd', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      {s.nome} <small className={ped.mudo}>· {s.linha_key ?? '—'}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {simulando && <p className={ped.mudo}>Consultando…</p>}
            {simulado && !simulando && (
              <div className={styles.tableScroll} style={{ marginTop: '1rem' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{simulado.nome}</th>
                      <th>Rolo fechado{simulado.metragemPadrao ? ` (${simulado.metragemPadrao} m)` : ''}</th>
                      <th>Metro linear</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={ped.mudo}>Atacado do ERP · linha {simulado.linhaKey ?? '—'}</td>
                      <td>{roloDe(simulado.rolo)}</td>
                      <td>{metroDe(simulado.metro)}</td>
                    </tr>
                    <tr>
                      <td className={ped.mudo}>Varejo do ERP</td>
                      <td>{roloDe(simulado.roloVarejo)}</td>
                      <td>{metroDe(simulado.metroVarejo)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>
                          {TIPO_LABEL[papel]}
                          {faixaAtual ? ` · ${faixaAtual.nome}` : ''} vê
                        </strong>
                      </td>
                      <td>{roloDe(simulado.doTipo?.rolo ?? null)}</td>
                      <td>{metroDe(simulado.doTipo?.metro ?? null)}</td>
                    </tr>
                    {simulado.oculto && (
                      <tr>
                        <td colSpan={3} className={ped.mudo}>
                          Esta linha está marcada como oculta para {TIPO_LABEL[papel].toLowerCase()}: o produto não aparece na loja dele.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------ visibilidade */}
      {aba === 'visibilidade' && (
        <>
          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>O que {TIPO_LABEL[papel].toLowerCase()} vê e pode fazer</h3>
            {OPCOES.map((o) => (
              <label key={o.k} style={linhaOpcao}>
                <input type="checkbox" checked={vis[o.k]} onChange={(e) => setVis((v) => ({ ...v, [o.k]: e.target.checked }))} style={{ marginTop: '0.25rem', width: 18, height: 18 }} />
                <span>
                  <strong style={{ color: '#fff' }}>{o.titulo}</strong>
                  <br />
                  <small className={ped.mudo}>{o.texto}</small>
                </span>
              </label>
            ))}
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>
              Linhas comerciais visíveis ({linhas.length - vis.linhasOcultas.size} de {linhas.length})
            </h3>
            <p className={styles.tabDescription}>
              Desmarcada = oculta para este tipo: os produtos saem da loja dele, ficam sem preço e não entram em pedido. Quem não está logado continua vendo o
              catálogo sem preço, como sempre.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button type="button" className={styles.actionBtn} onClick={() => setVis((v) => ({ ...v, linhasOcultas: new Set() }))}>
                marcar todas
              </button>
              <button type="button" className={styles.actionBtn} onClick={() => setVis((v) => ({ ...v, linhasOcultas: new Set(linhas.map((l) => l.linha_key)) }))}>
                desmarcar todas
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.35rem 1rem' }}>
              {linhas.map((l) => (
                <label key={l.linha_key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!vis.linhasOcultas.has(l.linha_key)} onChange={() => setVis((v) => ({ ...v, linhasOcultas: alternar(v.linhasOcultas, l.linha_key) }))} style={caixa} />
                  <span>
                    {l.label} <small className={ped.mudo}>· {l.produtos}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
