// Aba Integração ERP do painel admin.
//
// Três coisas: a fila de conferência do mapa de SKU, o status do sync e a
// configuração do badge de disponibilidade.
//
// A fila é o coração desta aba. O site identifica produto por slug ou código de
// mostruário; o NZERP usa master_catalog.sku em uppercase, com histórico de
// importação do Tiny/Olist. O migrador (scripts/migrar-catalogo-editorial.mjs) propõe os pares, mas
// só uma pessoa conferindo transforma a proposta em verdade — um match errado
// faz o site anunciar o estoque de outro produto.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Admin.module.css';

interface Mapa {
  id: string;
  shop_slug: string;
  erp_sku: string;
  origem: 'auto' | 'manual';
  confianca: number | null;
  conferido_em: string | null;
  observacao: string | null;
}

interface SyncLog {
  id: string;
  iniciado_em: string;
  concluido_em: string | null;
  gatilho: string;
  lidos: number;
  atualizados: number;
  desativados: number;
  erro: string | null;
}

interface Config {
  limite_ultimas_unidades_ml: number;
  sync_ativo: boolean;
}

export default function AdminErp() {
  const [mapa, setMapa] = useState<Mapa[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [espelhoTotal, setEspelhoTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [filtro, setFiltro] = useState<'pendentes' | 'conferidos' | 'todos'>('pendentes');

  // Nenhum setState antes do primeiro await: `loading` já nasce true e é
  // desligado no fim. Recarregar depois de uma alteração acontece em silêncio,
  // sem piscar o spinner — as tabelas são pequenas e a troca é instantânea.
  const carregar = useCallback(async () => {
    const [m, l, c, e] = await Promise.all([
      supabase.from('erp_sku_map').select('*').order('confianca', { ascending: false }).limit(500),
      supabase.from('erp_sync_log').select('*').order('iniciado_em', { ascending: false }).limit(10),
      supabase.from('loja_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('erp_produtos').select('sku', { count: 'exact', head: true }),
    ]);

    setErro('');

    if (m.error) {
      setErro(
        `Não consegui ler erp_sku_map: ${m.error.message}. A migration migrations/2026-09-06_loja_ecommerce.sql já foi aplicada?`
      );
      setLoading(false);
      return;
    }

    setMapa((m.data ?? []) as unknown as Mapa[]);
    setLogs((l.data ?? []) as unknown as SyncLog[]);
    setConfig((c.data ?? null) as unknown as Config | null);
    setEspelhoTotal(e.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    // A regra do React Compiler marca qualquer setState alcançável a partir de
    // um efeito, mesmo depois de await, e não distingue o padrão canônico de
    // buscar dados no mount. Não há setState síncrono em `carregar`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  /**
   * Conferir é o que transforma proposta em verdade: além de carimbar a fila,
   * grava produtos.erp_sku e publica. Sem isto o item continuaria 'pendente'
   * e invisível na loja.
   */
  const vincularProduto = async (slug: string, sku: string) => {
    const { error } = await supabase
      .from('produtos')
      .update({ erp_sku: sku, tipo_vinculo: 'proprio', publicado: true })
      .eq('slug', slug)
      .neq('tipo_vinculo', 'alias');
    if (error) setErro(`produtos: ${error.message}`);
  };

  const conferir = async (item: Mapa) => {
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('erp_sku_map')
      .update({
        origem: 'manual',
        conferido_em: new Date().toISOString(),
        conferido_por: data.user?.id ?? null,
      })
      .eq('id', item.id);
    if (error) setErro(error.message);
    else await vincularProduto(item.shop_slug, item.erp_sku);
    await carregar();
  };

  const corrigirSku = async (item: Mapa, novoSku: string) => {
    const sku = novoSku.trim().toUpperCase();
    if (!sku || sku === item.erp_sku) return;
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('erp_sku_map')
      .update({
        erp_sku: sku,
        origem: 'manual',
        conferido_em: new Date().toISOString(),
        conferido_por: data.user?.id ?? null,
      })
      .eq('id', item.id);
    if (error) setErro(error.message);
    else await vincularProduto(item.shop_slug, sku);
    await carregar();
  };

  const descartar = async (item: Mapa) => {
    if (!window.confirm(`Remover o vínculo de ${item.shop_slug}? O produto sai da loja até ganhar outro SKU.`))
      return;
    await supabase.from('erp_sku_map').delete().eq('id', item.id);
    // Sem SKU não publica — é a regra do cadastro, e o check do banco a impõe.
    const { error } = await supabase
      .from('produtos')
      .update({ erp_sku: null, tipo_vinculo: 'pendente', publicado: false })
      .eq('slug', item.shop_slug)
      .neq('tipo_vinculo', 'familia');
    if (error) setErro(`produtos: ${error.message}`);
    await carregar();
  };

  const sincronizarAgora = async () => {
    setSincronizando(true);
    setErro('');
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/nz/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ gatilho: 'manual' }),
      });
      const json = await res.json();
      if (!res.ok) setErro(`Sync falhou: ${JSON.stringify(json)}`);
    } catch (err) {
      setErro(
        `Não consegui acionar o sync: ${err instanceof Error ? err.message : String(err)}. Em "npm run dev" as rotas /api devolvem 503 — use "vercel dev".`
      );
    }
    setSincronizando(false);
    await carregar();
  };

  const salvarConfig = async (patch: Partial<Config>) => {
    const { error } = await supabase
      .from('loja_config')
      .update({ ...patch, atualizado_em: new Date().toISOString() })
      .eq('id', 1);
    if (error) setErro(error.message);
    await carregar();
  };

  const visiveis = useMemo(() => {
    if (filtro === 'pendentes') return mapa.filter((m) => !m.conferido_em);
    if (filtro === 'conferidos') return mapa.filter((m) => m.conferido_em);
    return mapa;
  }, [mapa, filtro]);

  const pendentes = mapa.filter((m) => !m.conferido_em).length;
  const ultimo = logs[0];

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando integração…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Espelha o catálogo ativo e o saldo de estoque do <strong>NZERP</strong> para a LOJA. Custo,
        preço e margem <strong>não são transferidos</strong> — as views do lado do ERP já os
        excluem na origem.
      </p>

      {erro && (
        <div className={styles.createError} style={{ marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      {/* ------------------------------------------------------- status */}
      <div className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.tableSectionTitle}>Sincronização</h3>
          <button
            type="button"
            className={styles.createBtn}
            onClick={sincronizarAgora}
            disabled={sincronizando}
          >
            {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          </button>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>SKUs no espelho</span>
            <span className={styles.metricValue}>{espelhoTotal}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Vínculos conferidos</span>
            <span className={styles.metricValue}>{mapa.length - pendentes}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Aguardando conferência</span>
            <span className={pendentes > 0 ? styles.metricValueWarning : styles.metricValue}>
              {pendentes}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Último sync</span>
            <span className={styles.metricValue} style={{ fontSize: '0.9rem' }}>
              {ultimo ? new Date(ultimo.iniciado_em).toLocaleString('pt-BR') : '—'}
            </span>
          </div>
        </div>

        {logs.length > 0 && (
          <div className={styles.tableScroll} style={{ marginTop: '1rem' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Gatilho</th>
                  <th>Lidos</th>
                  <th>Atualizados</th>
                  <th>Desativados</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.iniciado_em).toLocaleString('pt-BR')}</td>
                    <td>{l.gatilho}</td>
                    <td>{l.lidos}</td>
                    <td>{l.atualizados}</td>
                    <td>{l.desativados}</td>
                    <td>
                      {l.erro ? (
                        <span style={{ color: '#ff4444' }}>{l.erro}</span>
                      ) : l.concluido_em ? (
                        'ok'
                      ) : (
                        'em andamento'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------- mapa de SKU */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Mapa de SKU ({mapa.length})</h3>
        <p style={{ color: '#6b6b70', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
          Gere as propostas com <code>node scripts/propose-sku-map.mjs --write</code>. Um vínculo
          errado faz o site anunciar o estoque de outro produto — confira antes de aceitar.
        </p>

        <div className={styles.periodFilters}>
          {(['pendentes', 'conferidos', 'todos'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item do site</th>
                <th>SKU no ERP</th>
                <th>Confiança</th>
                <th>Origem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.slice(0, 200).map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.78rem' }}>{m.shop_slug}</td>
                  <td>
                    <input
                      className={styles.adminInput}
                      defaultValue={m.erp_sku}
                      onBlur={(e) => corrigirSku(m, e.target.value)}
                      style={{ maxWidth: 160, fontFamily: 'monospace' }}
                    />
                  </td>
                  <td>
                    {m.confianca != null ? `${Math.round(m.confianca * 100)}%` : '—'}
                  </td>
                  <td>
                    <span className={styles.badge}>
                      {m.conferido_em ? 'conferido' : m.origem}
                    </span>
                  </td>
                  <td>
                    {!m.conferido_em && (
                      <button type="button" className={styles.actionBtn} onClick={() => conferir(m)}>
                        Confirmar
                      </button>
                    )}
                    <button type="button" className={styles.actionBtn} onClick={() => descartar(m)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    {filtro === 'pendentes'
                      ? 'Nada aguardando conferência.'
                      : 'Nenhum vínculo. Rode scripts/propose-sku-map.mjs.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visiveis.length > 200 && (
          <p style={{ color: '#6b6b70', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Mostrando 200 de {visiveis.length}.
          </p>
        )}
      </div>

      {/* ---------------------------------------------------- config */}
      {config && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Configuração</h3>
          <div className={styles.adminFormRow2}>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>
                Limite de &ldquo;últimas unidades&rdquo; (metros lineares)
              </label>
              <input
                className={styles.adminInput}
                type="number"
                min={0}
                defaultValue={config.limite_ultimas_unidades_ml}
                onBlur={(e) =>
                  salvarConfig({ limite_ultimas_unidades_ml: Number(e.target.value) || 0 })
                }
              />
              <span style={{ color: '#6b6b70', fontSize: '0.72rem' }}>
                Usado quando o SKU não tem estoque mínimo próprio no ERP.
              </span>
            </div>
            <div className={styles.adminFormGroup}>
              <label className={styles.adminLabel}>Sincronização automática</label>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => salvarConfig({ sync_ativo: !config.sync_ativo })}
              >
                {config.sync_ativo ? 'Ativa — desativar' : 'Desativada — ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
