import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PROMO_PAGES, PERFIL_LABELS, formatarEndereco, etiquetaEnvio,
  type PromoPage, type PromoLead, type PromoColuna,
} from '../../lib/promoPages';
import styles from './Admin.module.css';

const SITE_URL = 'https://www.nzgroup.com.br';

function formatarData(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatarTelefone(e164: string): string {
  // +5511999998888 -> (11) 99999-8888
  const d = String(e164 || '').replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164 || '—';
}

/** Valor de uma coluna já formatado como texto (usado na tabela e no CSV). */
function valorTexto(lead: PromoLead, col: PromoColuna): string {
  if (col.tipo === 'endereco') return formatarEndereco(lead);
  const raw = lead[col.key];
  if (raw === null || raw === undefined || raw === '') return '—';
  switch (col.tipo) {
    case 'data': return formatarData(String(raw));
    case 'telefone': return formatarTelefone(String(raw));
    case 'instagram': return `@${raw}`;
    case 'bool': return raw ? 'Sim' : 'Não';
    default:
      return col.key === 'perfil' ? (PERFIL_LABELS[String(raw)] || String(raw)) : String(raw);
  }
}

/** Resultado de uma busca, carimbado com a campanha — evita mostrar os leads
 *  de uma campanha enquanto a outra ainda está carregando. */
interface Carga {
  campanhaId: string;
  leads: PromoLead[];
  erro: string;
}

export default function AdminPromoPages() {
  const [campanhaId, setCampanhaId] = useState<string>(PROMO_PAGES[0]?.id ?? '');
  const [carga, setCarga] = useState<Carga | null>(null);
  const [contagens, setContagens] = useState<Record<string, number>>({});
  const [recarregar, setRecarregar] = useState(0);
  const [erroAcao, setErroAcao] = useState('');
  const [copiado, setCopiado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const campanha: PromoPage | undefined = useMemo(
    () => PROMO_PAGES.find(p => p.id === campanhaId),
    [campanhaId],
  );

  /* ── Contagem de cadastros por campanha (para os cards) ── */
  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const entradas = await Promise.all(
        PROMO_PAGES.map(async p => {
          const { count } = await supabase
            .from(p.tabela)
            .select('id', { count: 'exact', head: true });
          return [p.id, count ?? 0] as const;
        }),
      );
      if (!cancelado) setContagens(Object.fromEntries(entradas));
    })();
    return () => { cancelado = true; };
  }, [recarregar]);

  /* ── Cadastros da campanha selecionada ── */
  useEffect(() => {
    if (!campanha) return;
    let cancelado = false;
    void (async () => {
      const { data, error } = await supabase
        .from(campanha.tabela)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (cancelado) return;
      setCarga({
        campanhaId: campanha.id,
        leads: (data as PromoLead[]) || [],
        // Sem policy de leitura o Supabase devolve lista vazia em vez de erro,
        // então só mostramos aviso quando vier erro de verdade.
        erro: error ? `Não foi possível ler os cadastros: ${error.message}` : '',
      });
    })();
    return () => { cancelado = true; };
  }, [campanha, recarregar]);

  /* ── Derivados (sem setState) ── */
  const pronta = carga?.campanhaId === campanhaId;
  const loading = !pronta;
  const leads = useMemo(() => (pronta ? carga.leads : []), [pronta, carga]);
  const erro = erroAcao || (pronta ? carga.erro : '');

  const leadsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const statusCol = campanha?.statusColuna;
    return leads.filter(l => {
      if (statusCol && filtroStatus !== 'todos') {
        if (String(l[statusCol] ?? '') !== filtroStatus) return false;
      }
      if (!termo) return true;
      return ['nome', 'telefone', 'instagram', 'email', 'cidade'].some(k =>
        String(l[k] ?? '').toLowerCase().includes(termo),
      );
    });
  }, [leads, busca, filtroStatus, campanha]);

  const colunasVisiveis = useMemo(
    () => campanha?.colunas.filter(c => !c.soCsv) ?? [],
    [campanha],
  );

  const resumoStatus = useMemo(() => {
    const statusCol = campanha?.statusColuna;
    if (!statusCol) return null;
    const acc: Record<string, number> = {};
    for (const v of campanha.statusValores ?? []) acc[v] = 0;
    for (const l of leads) {
      const s = String(l[statusCol] ?? '');
      if (s in acc) acc[s]++;
    }
    return acc;
  }, [leads, campanha]);

  /* ── Ações ── */
  const copiar = async (texto: string, marca: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(marca);
      setTimeout(() => setCopiado(''), 1800);
    } catch {
      setErroAcao('O navegador bloqueou a cópia. Selecione o texto manualmente.');
    }
  };

  const mudarStatus = async (leadId: string, novo: string) => {
    const statusCol = campanha?.statusColuna;
    if (!campanha || !statusCol) return;
    const anterior = carga;
    setErroAcao('');
    setCarga(c => (c ? { ...c, leads: c.leads.map(l => (l.id === leadId ? { ...l, [statusCol]: novo } : l)) } : c));

    const { error } = await supabase
      .from(campanha.tabela)
      .update({ [statusCol]: novo })
      .eq('id', leadId);

    if (error) {
      setCarga(anterior); // desfaz o otimismo se o banco recusou
      setErroAcao(`Não foi possível salvar o status: ${error.message}`);
    }
  };

  const exportarCsv = () => {
    if (!campanha) return;
    const statusCol = campanha.statusColuna;
    const escapar = (s: string) => `"${s.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

    const cabecalho = campanha.colunas.map(c => escapar(c.label));
    if (statusCol) cabecalho.push(escapar('Status do brinde'));

    const linhas = leadsFiltrados.map(l => {
      const celulas = campanha.colunas.map(c => escapar(valorTexto(l, c)));
      if (statusCol) celulas.push(escapar(String(l[statusCol] ?? '')));
      return celulas.join(';');
    });

    // BOM para o Excel abrir os acentos corretamente.
    const csv = '﻿' + [cabecalho.join(';'), ...linhas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campanha.id}-cadastros.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.tableSection}>
      <p className={styles.tabDescription}>
        Landing pages de campanha e os cadastros que elas geram. Cada campanha grava
        numa tabela própria no Supabase — os leads do site continuam na aba Leads.
      </p>

      {/* ═══ Cards das campanhas ═══ */}
      <div className={styles.promoGrid}>
        {PROMO_PAGES.map(p => {
          const selecionada = p.id === campanhaId;
          const url = `${SITE_URL}${p.path}`;
          return (
            <div
              key={p.id}
              className={`${styles.promoCard} ${selecionada ? styles.promoCardActive : ''}`}
            >
              <div className={styles.promoCardHead}>
                <span className={p.ativa ? styles.badgeApproved : styles.badgePending}>
                  {p.ativa ? 'No ar' : 'Encerrada'}
                </span>
                <span className={styles.promoCount}>
                  {contagens[p.id] ?? 0} <small>cadastros</small>
                </span>
              </div>

              <h3 className={styles.promoTitle}>{p.nome}</h3>
              <p className={styles.promoDesc}>{p.descricao}</p>
              <p className={styles.promoMeta}>{p.periodo}<br />{p.local}</p>

              <div className={styles.promoLinks}>
                <code className={styles.promoUrl}>{url}</code>
                {p.aliases.map(a => (
                  <code key={a} className={styles.promoUrlAlias}>{SITE_URL}{a} →</code>
                ))}
              </div>

              <div className={styles.promoActions}>
                <a href={p.path} target="_blank" rel="noreferrer" className={styles.promoBtnPrimary}>
                  Abrir página
                </a>
                <button className={styles.promoBtn} onClick={() => void copiar(url, `link-${p.id}`)}>
                  {copiado === `link-${p.id}` ? 'Copiado' : 'Copiar link'}
                </button>
                <button className={styles.promoBtn} onClick={() => void copiar(p.qrUrl, `qr-${p.id}`)}>
                  {copiado === `qr-${p.id}` ? 'Copiado' : 'Link do QR'}
                </button>
                {!selecionada && (
                  <button className={styles.promoBtn} onClick={() => setCampanhaId(p.id)}>
                    Ver cadastros
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {campanha && (
        <>
          {/* ═══ Resumo por status (clicável, vira filtro) ═══ */}
          {resumoStatus && (
            <div className={styles.promoStatusRow}>
              {Object.entries(resumoStatus).map(([valor, qtd]) => (
                <button
                  key={valor}
                  className={filtroStatus === valor ? styles.promoStatusChipActive : styles.promoStatusChip}
                  onClick={() => setFiltroStatus(filtroStatus === valor ? 'todos' : valor)}
                >
                  <strong>{qtd}</strong> {campanha.statusLabels?.[valor] ?? valor}
                </button>
              ))}
            </div>
          )}

          {/* ═══ Barra de ferramentas ═══ */}
          <div className={styles.promoToolbar}>
            <input
              className={styles.adminInput}
              placeholder="Buscar por nome, WhatsApp, Instagram, cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <button className={styles.promoBtn} onClick={() => setRecarregar(n => n + 1)}>
              Atualizar
            </button>
            <button
              className={styles.promoBtnPrimary}
              onClick={exportarCsv}
              disabled={leadsFiltrados.length === 0}
            >
              Exportar CSV ({leadsFiltrados.length})
            </button>
          </div>

          {erro && <div className={styles.promoError}>{erro}</div>}

          {/* ═══ Tabela de cadastros ═══ */}
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {colunasVisiveis.map(c => <th key={c.key}>{c.label}</th>)}
                  {campanha.statusColuna && <th>Brinde</th>}
                  <th>Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(l => (
                  <tr key={l.id}>
                    {colunasVisiveis.map(c => (
                      <td
                        key={c.key}
                        className={c.tipo === 'endereco' ? styles.promoCellAddress : undefined}
                      >
                        {valorTexto(l, c)}
                      </td>
                    ))}
                    {campanha.statusColuna && (
                      <td>
                        <select
                          className={styles.adminSelect}
                          value={String(l[campanha.statusColuna] ?? 'pendente')}
                          onChange={e => void mudarStatus(l.id, e.target.value)}
                        >
                          {campanha.statusValores?.map(v => (
                            <option key={v} value={v}>{campanha.statusLabels?.[v] ?? v}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => void copiar(etiquetaEnvio(l), `etq-${l.id}`)}
                        title="Copiar nome + endereço + telefone para colar na etiqueta"
                      >
                        {copiado === `etq-${l.id}` ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={colunasVisiveis.length + 2} className={styles.emptyState}>
                      Carregando...
                    </td>
                  </tr>
                )}
                {!loading && leadsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={colunasVisiveis.length + 2} className={styles.emptyState}>
                      {leads.length === 0
                        ? 'Nenhum cadastro ainda nesta campanha.'
                        : 'Nenhum cadastro bate com o filtro.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
