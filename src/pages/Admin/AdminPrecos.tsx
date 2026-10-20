// /admin/precos — Preços por tipo de acesso (decisão do João, 20/10/2026).
//
//   preço = base do ERP × (1 + percentual ÷ 100)
//
// Um percentual GERAL por tipo (revendedor, lojista, cliente final) e, por
// linha comercial, um percentual que vale só ali (vazio = herda o geral). A
// base de cada tipo é o atacado do ERP ou, se o tipo pedir, o varejo que o
// ERP já publica. Admin vê tudo e compra pela base.
//
// A regra que calcula mora NO SERVIDOR (api/_lib/precos/regraAcesso.ts) e é a
// mesma da vitrine e do checkout. O simulador desta tela chama /api/nz/precos
// com `simular` — é o servidor respondendo, não uma conta refeita aqui.
//
// Escrita direto em precos_acesso (RLS de admin) + precos_acesso_log com o
// de → para de cada célula. Vale no próximo carregamento de preço.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BRL } from '../../lib/shop/precos';
import { TIPO_LABEL } from '../../lib/shop/papeis';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

type PapelPreco = 'reseller' | 'lojista' | 'client';
type Base = 'atacado' | 'varejo';
const PAPEIS: PapelPreco[] = ['reseller', 'lojista', 'client'];

interface RegraRow {
  id: number;
  papel: PapelPreco;
  linha_key: string | null;
  base: Base;
  percentual: number;
  atualizado_em: string;
}

interface LinhaLoja {
  linha_key: string;
  label: string;
  produtos: number;
}

interface LogRow {
  id: number;
  quando: string;
  quem: string | null;
  papel: string;
  linha_key: string | null;
  de: { base?: string; percentual?: number } | null;
  para: { base?: string; percentual?: number } | null;
}

interface Simulado {
  slug: string;
  nome: string;
  linhaKey: string | null;
  rolo: number | null;
  metro: number | null;
  roloVarejo: number | null;
  metroVarejo: number | null;
  metragemPadrao: number | null;
  porTipo: { rolo: Record<PapelPreco, number | null>; metro: Record<PapelPreco, number | null> } | null;
}

const chave = (papel: PapelPreco, linha: string) => `${papel}|${linha}`;
const pctTexto = (v: number) => (Number.isFinite(v) ? String(v).replace('.', ',') : '');
const pctNumero = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
};
const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const campo: React.CSSProperties = { width: '7.5rem', background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4, textAlign: 'right' };
const seletor: React.CSSProperties = { background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4 };

export default function AdminPrecos() {
  const [regras, setRegras] = useState<RegraRow[]>([]);
  const [linhas, setLinhas] = useState<LinhaLoja[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [quemEmail, setQuemEmail] = useState<Map<string, string>>(new Map());
  const [geral, setGeral] = useState<Record<PapelPreco, { base: Base; pct: string }>>({
    reseller: { base: 'atacado', pct: '0' },
    lojista: { base: 'atacado', pct: '0' },
    client: { base: 'varejo', pct: '0' },
  });
  const [celulas, setCelulas] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<{ slug: string; nome: string; linha_key: string | null }[]>([]);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [simulando, setSimulando] = useState(false);

  const carregar = useCallback(async () => {
    const [r, l, g] = await Promise.all([
      supabase.from('precos_acesso').select('*').order('papel').order('linha_key'),
      supabase.rpc('linhas_da_loja'),
      supabase.from('precos_acesso_log').select('*').order('quando', { ascending: false }).limit(25),
    ]);
    const err = r.error ?? l.error ?? g.error;
    setErro(err ? `Não carregou: ${err.message} — a migration 2026-10-20b já foi aplicada?` : '');
    const rows = (r.data ?? []) as RegraRow[];
    setRegras(rows);
    setLinhas((l.data ?? []) as LinhaLoja[]);
    const lg = (g.data ?? []) as LogRow[];
    setLogs(lg);
    const ids = [...new Set(lg.map((x) => x.quem).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: perfis } = await supabase.from('user_profiles').select('id, email, full_name').in('id', ids);
      setQuemEmail(new Map(((perfis ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((p) => [p.id, p.full_name || p.email || p.id])));
    }
    const g2 = { reseller: { base: 'atacado' as Base, pct: '0' }, lojista: { base: 'atacado' as Base, pct: '0' }, client: { base: 'varejo' as Base, pct: '0' } };
    const c2: Record<string, string> = {};
    for (const row of rows) {
      if (!PAPEIS.includes(row.papel)) continue;
      if (row.linha_key) c2[chave(row.papel, row.linha_key)] = pctTexto(Number(row.percentual));
      else g2[row.papel] = { base: row.base, pct: pctTexto(Number(row.percentual)) };
    }
    setGeral(g2);
    setCelulas(c2);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Busca de produto para o simulador (debounce curto).
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
      if (!it || !it.disponivel) {
        setSimulado({ slug: p.slug, nome: p.nome, linhaKey: null, rolo: null, metro: null, roloVarejo: null, metroVarejo: null, metragemPadrao: null, porTipo: null });
        return;
      }
      setSimulado({
        slug: p.slug,
        nome: p.nome,
        linhaKey: (it.linhaKey as string | null) ?? null,
        rolo: (it.rolo as number | null) ?? null,
        metro: (it.metro as number | null) ?? null,
        roloVarejo: (it.roloVarejo as number | null) ?? null,
        metroVarejo: (it.metroVarejo as number | null) ?? null,
        metragemPadrao: (it.metragemPadrao as number | null) ?? null,
        porTipo: (it.porTipo as Simulado['porTipo']) ?? null,
      });
    } catch (e) {
      setErro(`Simulação: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSimulando(false);
    }
  };

  const mudancas = useMemo(() => {
    const lista: { papel: PapelPreco; linha: string | null; de: RegraRow | null; para: { base: Base; percentual: number } | null }[] = [];
    for (const papel of PAPEIS) {
      const atual = regras.find((r) => r.papel === papel && !r.linha_key) ?? null;
      const pct = pctNumero(geral[papel].pct) ?? 0;
      if (!atual || atual.base !== geral[papel].base || Number(atual.percentual) !== pct) lista.push({ papel, linha: null, de: atual, para: { base: geral[papel].base, percentual: pct } });
      for (const l of linhas) {
        const row = regras.find((r) => r.papel === papel && r.linha_key === l.linha_key) ?? null;
        const txt = celulas[chave(papel, l.linha_key)] ?? '';
        const n = pctNumero(txt);
        if (n === null) {
          if (row) lista.push({ papel, linha: l.linha_key, de: row, para: null });
        } else if (!row || Number(row.percentual) !== n) {
          lista.push({ papel, linha: l.linha_key, de: row, para: { base: geral[papel].base, percentual: n } });
        }
      }
    }
    return lista;
  }, [regras, linhas, geral, celulas]);

  const invalidas = useMemo(() => {
    const ruins: string[] = [];
    for (const papel of PAPEIS) {
      const n = pctNumero(geral[papel].pct);
      if (n === null || Number.isNaN(n) || n < 0) ruins.push(`${TIPO_LABEL[papel]} (geral)`);
      for (const l of linhas) {
        const v = pctNumero(celulas[chave(papel, l.linha_key)] ?? '');
        if (v !== null && (Number.isNaN(v) || v < 0)) ruins.push(`${TIPO_LABEL[papel]} · ${l.label}`);
      }
    }
    return ruins;
  }, [geral, celulas, linhas]);

  const salvar = async () => {
    if (invalidas.length) {
      setErro(`Percentual inválido (use número ≥ 0): ${invalidas.join(', ')}.`);
      return;
    }
    if (!mudancas.length) {
      setMsg('Nada mudou.');
      return;
    }
    if (!window.confirm(`Salvar ${mudancas.length} alteração(ões) de preço? Vale para todo mundo no próximo carregamento da loja.`)) return;
    setSalvando(true);
    setErro('');
    setMsg('');
    const { data: s } = await supabase.auth.getSession();
    const quem = s.session?.user.id ?? null;
    const agora = new Date().toISOString();
    const falhas: string[] = [];
    for (const m of mudancas) {
      let error: { message: string } | null = null;
      if (m.para === null && m.de) {
        ({ error } = await supabase.from('precos_acesso').delete().eq('id', m.de.id));
      } else if (m.para && m.de) {
        ({ error } = await supabase.from('precos_acesso').update({ base: m.para.base, percentual: m.para.percentual, atualizado_em: agora, atualizado_por: quem }).eq('id', m.de.id));
      } else if (m.para) {
        ({ error } = await supabase.from('precos_acesso').insert({ papel: m.papel, linha_key: m.linha, base: m.para.base, percentual: m.para.percentual, atualizado_em: agora, atualizado_por: quem }));
      }
      if (error) {
        falhas.push(`${TIPO_LABEL[m.papel]}${m.linha ? ` · ${m.linha}` : ''}: ${error.message}`);
        continue;
      }
      await supabase.from('precos_acesso_log').insert({ quem, papel: m.papel, linha_key: m.linha, de: m.de ? { base: m.de.base, percentual: Number(m.de.percentual) } : null, para: m.para });
    }
    setSalvando(false);
    if (falhas.length) setErro(`Não salvou: ${falhas.join(' · ')}`);
    else setMsg(`${mudancas.length} alteração(ões) salva(s). Já vale na loja.`);
    await carregar();
    if (simulado) void simular({ slug: simulado.slug, nome: simulado.nome });
  };

  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando preços por acesso…</p>;

  const metroDe = (v: number | null) => (v != null ? `${BRL.format(v)}/m` : '—');
  const roloDe = (v: number | null) => (v != null ? `${BRL.format(v)}/rolo` : '—');

  return (
    <div>
      <p className={styles.tabDescription}>
        O preço que cada tipo de acesso vê: <strong>base do ERP × (1 + percentual)</strong>. Base = atacado (a tabela mínima do NZERP) ou o varejo que o
        ERP já publica. Por linha comercial dá para ter um percentual só daquela linha; vazio herda o geral. Quem é de cada tipo se decide em{' '}
        <Link to="/admin/clientes" style={{ color: '#fff' }}>Clientes</Link>. Admin vê e compra pela base.
      </p>
      {erro && <p className={ped.aviso}>{erro}</p>}
      {msg && <p className={ped.msg}>{msg}</p>}

      <div className={ped.acoes}>
        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={salvando || mudancas.length === 0} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : mudancas.length ? `Salvar ${mudancas.length} alteração(ões)` : 'Nada para salvar'}
        </button>
        {mudancas.length > 0 && (
          <button type="button" className={styles.actionBtn} disabled={salvando} onClick={() => void carregar()}>
            Descartar
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------ geral */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Percentual geral por tipo de acesso</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                {PAPEIS.map((p) => (
                  <th key={p}>{TIPO_LABEL[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base (tabela do ERP)</td>
                {PAPEIS.map((p) => (
                  <td key={p}>
                    <select value={geral[p].base} style={seletor} onChange={(e) => setGeral((g) => ({ ...g, [p]: { ...g[p], base: e.target.value as Base } }))}>
                      <option value="atacado">atacado (mínimo)</option>
                      <option value="varejo">varejo (publicado)</option>
                    </select>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Percentual geral (%)</td>
                {PAPEIS.map((p) => (
                  <td key={p}>
                    <input value={geral[p].pct} style={campo} inputMode="decimal" onChange={(e) => setGeral((g) => ({ ...g, [p]: { ...g[p], pct: e.target.value } }))} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------- por categoria */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Por linha comercial (vazio = usa o geral)</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Linha</th>
                <th>Produtos</th>
                {PAPEIS.map((p) => (
                  <th key={p}>{TIPO_LABEL[p]} (%)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.linha_key}>
                  <td>
                    {l.label}
                    <br />
                    <small className={ped.mudo}>{l.linha_key}</small>
                  </td>
                  <td className={ped.mudo}>{l.produtos}</td>
                  {PAPEIS.map((p) => {
                    const k = chave(p, l.linha_key);
                    return (
                      <td key={p}>
                        <input value={celulas[k] ?? ''} placeholder={`geral ${geral[p].pct || '0'}`} style={campo} inputMode="decimal" onChange={(e) => setCelulas((c) => ({ ...c, [k]: e.target.value }))} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={2 + PAPEIS.length} className={ped.mudo}>
                    Nenhuma linha comercial encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------- simulador */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Simulador</h3>
        <p className={styles.tabDescription}>Escolha um produto e veja o que cada tipo de acesso vê — calculado pelo servidor, com as regras já salvas.</p>
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
                  <td className={ped.mudo}>Atacado do ERP (base) · linha {simulado.linhaKey ?? '—'}</td>
                  <td>{roloDe(simulado.rolo)}</td>
                  <td>{metroDe(simulado.metro)}</td>
                </tr>
                <tr>
                  <td className={ped.mudo}>Varejo do ERP (publicado)</td>
                  <td>{roloDe(simulado.roloVarejo)}</td>
                  <td>{metroDe(simulado.metroVarejo)}</td>
                </tr>
                {PAPEIS.map((p) => (
                  <tr key={p}>
                    <td>
                      <strong>{TIPO_LABEL[p]}</strong>
                    </td>
                    <td>{roloDe(simulado.porTipo?.rolo[p] ?? null)}</td>
                    <td>{metroDe(simulado.porTipo?.metro[p] ?? null)}</td>
                  </tr>
                ))}
                {!simulado.porTipo && (
                  <tr>
                    <td colSpan={3} className={ped.mudo}>
                      Produto sem preço no ERP (ou fora do ar).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- histórico */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Histórico de alterações</h3>
        {logs.length === 0 ? (
          <p className={ped.mudo}>Nenhuma alteração ainda — valem os valores de partida.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Quem</th>
                  <th>Tipo</th>
                  <th>Linha</th>
                  <th>De</th>
                  <th>Para</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{dt(l.quando)}</td>
                    <td className={ped.mudo}>{l.quem ? quemEmail.get(l.quem) ?? l.quem.slice(0, 8) : '—'}</td>
                    <td>{TIPO_LABEL[l.papel as PapelPreco] ?? l.papel}</td>
                    <td className={ped.mudo}>{l.linha_key ?? 'geral'}</td>
                    <td className={ped.mudo}>{l.de ? `${l.de.percentual ?? 0}%${l.linha_key ? '' : ` · ${l.de.base}`}` : '—'}</td>
                    <td>{l.para ? `${l.para.percentual ?? 0}%${l.linha_key ? '' : ` · ${l.para.base}`}` : 'removido (herda o geral)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
