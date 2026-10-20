// /admin/precos/:papel — a configuração de UM tipo de acesso, em duas abas:
//
//   Preço         base do ERP (atacado ou varejo), percentual geral e, por
//                 linha comercial, um percentual só daquela linha (vazio
//                 herda o geral); simulador com o preço que este tipo vê.
//   Visibilidade  o que este tipo vê na loja: linhas comerciais (marcar
//                 = visível), rolo fechado, metro fracionado, estoque
//                 detalhado, Promoção Moto e pagamento online.
//
// Tudo é salvo de uma vez pelo botão Salvar: precos_acesso (linhas deste
// papel), acesso_config (uma linha por papel) e precos_acesso_log com o
// de → para. Quem calcula é o servidor (api/_lib/precos/regraAcesso.ts); o
// simulador chama /api/nz/precos com `simular` e mostra a resposta dele.

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
  base: Base;
  percentual: number;
}

interface LinhaLoja {
  linha_key: string;
  label: string;
  produtos: number;
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

const visPadrao = (papel: PapelPreco): Vis => ({ linhasOcultas: new Set(), veRolo: true, veMetro: true, veEstoque: papel !== 'client', vePromocao: true, pagamentoOnline: true });
const pctTexto = (v: number) => (Number.isFinite(v) ? String(v).replace('.', ',') : '');
const pctNumero = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
};
const campo: React.CSSProperties = { width: '7.5rem', background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4, textAlign: 'right' };
const seletor: React.CSSProperties = { background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4 };
const linhaOpcao: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' };

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
  const [linhas, setLinhas] = useState<LinhaLoja[]>([]);
  const [visSalva, setVisSalva] = useState<Vis | null>(null);
  const [existeVis, setExisteVis] = useState(false);
  const [geral, setGeral] = useState<{ base: Base; pct: string }>({ base: 'atacado', pct: '0' });
  const [celulas, setCelulas] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<Vis>(visPadrao('client'));
  const [contas, setContas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<{ slug: string; nome: string; linha_key: string | null }[]>([]);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [simulando, setSimulando] = useState(false);

  const carregar = useCallback(async () => {
    if (!papel) return;
    const [r, l, v, u] = await Promise.all([
      supabase.from('precos_acesso').select('*').eq('papel', papel).order('linha_key'),
      supabase.rpc('linhas_da_loja'),
      supabase.from('acesso_config').select('*').eq('papel', papel).maybeSingle(),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', papel),
    ]);
    const err = r.error ?? l.error ?? v.error;
    setErro(err ? `Não carregou: ${err.message} — as migrations 2026-10-20b/c já foram aplicadas?` : '');
    const rows = (r.data ?? []) as RegraRow[];
    setRegras(rows);
    setLinhas((l.data ?? []) as LinhaLoja[]);
    setContas(u.count ?? 0);
    const g = rows.find((x) => !x.linha_key);
    setGeral({ base: g?.base ?? (papel === 'client' ? 'varejo' : 'atacado'), pct: pctTexto(Number(g?.percentual ?? 0)) });
    const c: Record<string, string> = {};
    for (const row of rows) if (row.linha_key) c[row.linha_key] = pctTexto(Number(row.percentual));
    setCelulas(c);
    const vr = v.data as { linhas_ocultas: string[] | null; ve_rolo: boolean; ve_metro: boolean; ve_estoque: boolean; ve_promocao: boolean; pagamento_online: boolean } | null;
    const vInicial: Vis = vr
      ? { linhasOcultas: new Set(vr.linhas_ocultas ?? []), veRolo: vr.ve_rolo, veMetro: vr.ve_metro, veEstoque: vr.ve_estoque, vePromocao: vr.ve_promocao, pagamentoOnline: vr.pagamento_online }
      : visPadrao(papel);
    setExisteVis(Boolean(vr));
    setVisSalva(vInicial);
    setVis({ ...vInicial, linhasOcultas: new Set(vInicial.linhasOcultas) });
    setCarregando(false);
  }, [papel]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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
        body: JSON.stringify({ slugs: [p.slug], simular: true }),
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

  // ------------------------------------------------------------ mudanças
  const mudancasPreco = useMemo(() => {
    if (!papel) return [];
    const lista: { linha: string | null; de: RegraRow | null; para: { base: Base; percentual: number } | null }[] = [];
    const atual = regras.find((r) => !r.linha_key) ?? null;
    const g = pctNumero(geral.pct) ?? 0;
    if (!atual || atual.base !== geral.base || Number(atual.percentual) !== g) lista.push({ linha: null, de: atual, para: { base: geral.base, percentual: g } });
    for (const l of linhas) {
      const row = regras.find((r) => r.linha_key === l.linha_key) ?? null;
      const n = pctNumero(celulas[l.linha_key] ?? '');
      if (n === null) {
        if (row) lista.push({ linha: l.linha_key, de: row, para: null });
      } else if (!row || Number(row.percentual) !== n) {
        lista.push({ linha: l.linha_key, de: row, para: { base: geral.base, percentual: n } });
      }
    }
    return lista;
  }, [papel, regras, linhas, geral, celulas]);

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
    if (g === null || Number.isNaN(g) || g < 0) ruins.push('percentual geral');
    for (const l of linhas) {
      const v = pctNumero(celulas[l.linha_key] ?? '');
      if (v !== null && (Number.isNaN(v) || v < 0)) ruins.push(l.label);
    }
    if (!vis.veRolo && !vis.veMetro) ruins.push('rolo e metro desligados ao mesmo tempo (ninguém conseguiria comprar)');
    return ruins;
  }, [geral, celulas, linhas, vis]);

  const totalMudancas = mudancasPreco.length + (visMudou ? 1 : 0);

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
    if (!window.confirm(`Salvar as alterações de ${TIPO_LABEL[papel]}? Valem para todo mundo desse tipo no próximo carregamento da loja.`)) return;
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
      else if (m.para) ({ error } = await supabase.from('precos_acesso').insert({ papel, linha_key: m.linha, base: m.para.base, percentual: m.para.percentual, atualizado_em: agora, atualizado_por: quem }));
      if (error) {
        falhas.push(`${m.linha ?? 'geral'}: ${error.message}`);
        continue;
      }
      await supabase.from('precos_acesso_log').insert({ quem, papel, linha_key: m.linha, de: m.de ? { base: m.de.base, percentual: Number(m.de.percentual) } : null, para: m.para });
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
  const alternarLinha = (k: string) =>
    setVis((v) => {
      const s = new Set(v.linhasOcultas);
      if (s.has(k)) s.delete(k);
      else s.add(k);
      return { ...v, linhasOcultas: s };
    });

  return (
    <div>
      <header className={ped.topo}>
        <div>
          <Link to="/admin/precos" className={ped.voltar}>
            ← Tipos de acesso
          </Link>
          <h2 className={ped.titulo}>{TIPO_LABEL[papel]}</h2>
          <p className={ped.mudo}>
            {TIPO_DESCRICAO[papel]} · {contas} conta{contas === 1 ? '' : 's'}
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

      <div className={styles.periodFilters} style={{ marginBottom: '1.25rem' }}>
        {(
          [
            ['preco', `Preço${mudancasPreco.length ? ` (${mudancasPreco.length})` : ''}`],
            ['visibilidade', `Visibilidade${visMudou ? ' (•)' : ''}`],
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
            <h3 className={styles.tableSectionTitle}>Regra geral</h3>
            <p className={styles.tabDescription}>
              preço = base do ERP × (1 + percentual). A base é o atacado (tabela mínima do NZERP) ou o varejo que o ERP publica. Hoje o ERP publica as
              duas iguais; o percentual é o que diferencia este tipo.
            </p>
            <div className={styles.adminFormRow3}>
              <div className={styles.createField}>
                <label>Base (tabela do ERP)</label>
                <select value={geral.base} style={{ ...seletor, width: '100%' }} onChange={(e) => setGeral((g) => ({ ...g, base: e.target.value as Base }))}>
                  <option value="atacado">atacado (mínimo)</option>
                  <option value="varejo">varejo (publicado)</option>
                </select>
              </div>
              <div className={styles.createField}>
                <label>Percentual geral (%)</label>
                <input value={geral.pct} inputMode="decimal" onChange={(e) => setGeral((g) => ({ ...g, pct: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>Por linha comercial (vazio = usa o geral)</h3>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Produtos</th>
                    <th>Percentual (%)</th>
                    <th>Vale</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => {
                    const txt = celulas[l.linha_key] ?? '';
                    const efetivo = pctNumero(txt) ?? pctNumero(geral.pct) ?? 0;
                    const oculta = vis.linhasOcultas.has(l.linha_key);
                    return (
                      <tr key={l.linha_key} style={oculta ? { opacity: 0.45 } : undefined}>
                        <td>
                          {l.label}
                          <br />
                          <small className={ped.mudo}>{l.linha_key}</small>
                        </td>
                        <td className={ped.mudo}>{l.produtos}</td>
                        <td>
                          <input value={txt} placeholder={`geral ${geral.pct || '0'}`} style={campo} inputMode="decimal" onChange={(e) => setCelulas((c) => ({ ...c, [l.linha_key]: e.target.value }))} />
                        </td>
                        <td className={ped.mudo}>{oculta ? 'linha oculta para este tipo' : `${geral.base} + ${Number.isNaN(efetivo) ? '?' : pctTexto(efetivo)}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.tableSectionTitle}>Simulador</h3>
            <p className={styles.tabDescription}>Escolha um produto e veja o que {TIPO_LABEL[papel].toLowerCase()} vê — calculado pelo servidor com as regras já salvas.</p>
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
                        <strong>{TIPO_LABEL[papel]} vê</strong>
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
                  <input type="checkbox" checked={!vis.linhasOcultas.has(l.linha_key)} onChange={() => alternarLinha(l.linha_key)} style={{ width: 16, height: 16 }} />
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
