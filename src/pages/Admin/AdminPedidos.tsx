// Aba Pedidos & Pagamentos do painel admin.
//
//   · configuração do checkout (loja_config): ligar/desligar, Pix, boleto,
//     parcelas, retirada, mínimos;
//   · saúde da integração Asaas: chave, webhook, último evento, eventos com
//     erro — e o botão que cria o webhook na conta (a chave só existe no
//     servidor, então é a API que cria);
//   · lista de pedidos com o estado do pagamento; detalhe com a cobrança e o
//     botão de estorno (Pix e cartão; boleto pago se devolve pelo painel Asaas).
//
// Leitura por RLS de admin direto no Supabase; ações pela API (/api/nz/checkout).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { chamarCheckout, textoDoErro, STATUS_PAGAMENTO_LABEL, FORMA_LABEL, type Forma, type StatusPagamento } from '../../lib/shop/checkout';
import styles from './Admin.module.css';

interface Config {
  checkout_ativo: boolean;
  pix_expira_min: number;
  boleto_vencimento_dias: number;
  boleto_multa_pct: number;
  boleto_juros_mes_pct: number;
  boleto_minimo: number;
  cartao_max_parcelas: number;
  cartao_parcela_minima: number;
  retirada_ativa: boolean;
  retirada_endereco: string;
  pedido_minimo: number;
  frete_gratis_acima: number | null;
}

interface Pedido {
  id: string;
  numero: number;
  status: string;
  pagamento_status: StatusPagamento;
  forma_pagamento: Forma | null;
  total_final: number | null;
  total_estimado: number | null;
  valor_frete: number;
  desconto: number;
  cupom: string | null;
  frete: { nome?: string; retirada?: boolean; dias?: number } | null;
  erp_quote_number: number | null;
  erp_pago_em: string | null;
  criado_em: string;
  pago_em: string | null;
  observacoes: string | null;
  user_profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

interface Pagamento {
  id: string;
  pedido_id: string;
  asaas_payment_id: string | null;
  forma: Forma;
  status: StatusPagamento;
  status_asaas: string | null;
  valor: number;
  valor_liquido: number | null;
  parcelas: number;
  vencimento: string | null;
  expira_em: string | null;
  cartao_bandeira: string | null;
  cartao_final: string | null;
  invoice_url: string | null;
  boleto_url: string | null;
  pago_em: string | null;
  estornado_valor: number;
  ultimo_evento: string | null;
  criado_em: string;
}

interface Evento {
  id: string;
  evento: string;
  asaas_payment_id: string | null;
  pedido_id: string | null;
  recebido_em: string;
  processado_em: string | null;
  erro: string | null;
}

interface Saude {
  ambiente: string;
  hasAsaasKey: boolean;
  hasWebhookToken: boolean;
  chaveOk: boolean;
  chaveErro: string | null;
  webhook: { id: string; enabled: boolean; interrupted: boolean; eventos: number } | null;
  outrosWebhooks: { name: string; url: string; enabled: boolean; interrupted: boolean }[];
  ultimoEvento: { id: string; evento: string; recebido_em: string; processado_em: string | null; erro: string | null } | null;
  eventosComErro: number;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('pt-BR') : '—');

export default function AdminPedidos() {
  const [config, setConfig] = useState<Config | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [saude, setSaude] = useState<Saude | null>(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pagos' | 'aguardando' | 'problema' | 'orcamento'>('todos');
  const [aberto, setAberto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const [c, p, g, e] = await Promise.all([
      supabase.from('loja_config').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('pedidos')
        .select('id, numero, status, pagamento_status, forma_pagamento, total_final, total_estimado, valor_frete, desconto, cupom, frete, erp_quote_number, erp_pago_em, criado_em, pago_em, observacoes, user_profiles(full_name, email, phone)')
        .order('criado_em', { ascending: false })
        .limit(300),
      supabase.from('pagamentos').select('*').order('criado_em', { ascending: false }).limit(600),
      supabase.from('asaas_eventos').select('id, evento, asaas_payment_id, pedido_id, recebido_em, processado_em, erro').order('recebido_em', { ascending: false }).limit(100),
    ]);
    const err = c.error ?? p.error ?? g.error ?? e.error;
    setErro(err ? `${err.message} — a migration migrations/2026-09-07_checkout_asaas.sql já foi aplicada?` : '');
    if (c.data) setConfig(c.data as Config);
    setPedidos((p.data ?? []) as unknown as Pedido[]);
    setPagamentos((g.data ?? []) as Pagamento[]);
    setEventos((e.data ?? []) as Evento[]);
    setLoading(false);
  }, []);

  const carregarSaude = useCallback(async () => {
    try {
      setSaude(await chamarCheckout<Saude>({ op: 'saude' }));
    } catch (e) {
      setSaude(null);
      setMsg(`Saúde do Asaas: ${textoDoErro(e)}`);
    }
  }, []);

  useEffect(() => {
    void carregar();
    void carregarSaude();
  }, [carregar, carregarSaude]);

  const salvarConfig = async (patch: Partial<Config>) => {
    const { error } = await supabase.from('loja_config').update({ ...patch, atualizado_em: new Date().toISOString() }).eq('id', 1);
    if (error) setErro(error.message);
    await carregar();
  };

  const acao = async (body: Record<string, unknown>, okMsg: (r: Record<string, unknown>) => string) => {
    setOcupado(true);
    setMsg('');
    try {
      const r = await chamarCheckout<Record<string, unknown>>(body);
      setMsg(okMsg(r));
      await Promise.all([carregar(), carregarSaude()]);
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const pagsPorPedido = useMemo(() => {
    const m = new Map<string, Pagamento[]>();
    for (const p of pagamentos) m.set(p.pedido_id, [...(m.get(p.pedido_id) ?? []), p]);
    return m;
  }, [pagamentos]);

  const visiveis = useMemo(() => {
    switch (filtro) {
      case 'pagos':
        return pedidos.filter((p) => p.pagamento_status === 'pago' || p.pagamento_status === 'estornado');
      case 'aguardando':
        return pedidos.filter((p) => p.pagamento_status === 'aguardando' || p.pagamento_status === 'em_analise');
      case 'problema':
        return pedidos.filter((p) => ['recusado', 'expirado', 'vencido', 'cancelado'].includes(p.pagamento_status) || (p.pagamento_status === 'pago' && !p.erp_pago_em));
      case 'orcamento':
        return pedidos.filter((p) => p.pagamento_status === 'nenhum');
      default:
        return pedidos;
    }
  }, [pedidos, filtro]);

  const badge = (s: StatusPagamento) =>
    s === 'pago' ? styles.badgeApproved : s === 'aguardando' || s === 'em_analise' ? styles.badgePending : s === 'nenhum' ? '' : styles.badgeAdmin;

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando pedidos…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Pedidos da loja e os pagamentos feitos pelo site via <strong>Asaas</strong> (Pix, cartão e boleto). O pagamento
        confirmado marca o orçamento como <strong>APROVADO</strong> no NZERP; o financeiro vê "PAGO ONLINE" na nota do orçamento.
      </p>
      {erro && <p style={{ color: '#ff6b6b' }}>{erro}</p>}
      {msg && <p style={{ color: '#a1a1a6' }}>{msg}</p>}

      {/* --------------------------------------------------------- saúde */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Asaas</h3>
        {saude ? (
          <div className={styles.adminFormRow3}>
            <div>
              <span className={`${styles.badge} ${saude.hasAsaasKey && saude.chaveOk ? styles.badgeApproved : styles.badgeAdmin}`}>
                chave {saude.hasAsaasKey ? (saude.chaveOk ? 'OK' : `inválida: ${saude.chaveErro}`) : 'ausente'}
              </span>{' '}
              <span className={styles.badge}>{saude.ambiente}</span>
            </div>
            <div>
              {saude.webhook ? (
                <span className={`${styles.badge} ${saude.webhook.enabled && !saude.webhook.interrupted ? styles.badgeApproved : styles.badgeAdmin}`}>
                  webhook {saude.webhook.interrupted ? 'FILA PAUSADA — religar no painel Asaas' : saude.webhook.enabled ? `ativo · ${saude.webhook.eventos} eventos` : 'desligado'}
                </span>
              ) : (
                <>
                  <span className={`${styles.badge} ${styles.badgePending}`}>webhook não cadastrado</span>{' '}
                  <button type="button" className={styles.actionBtn} disabled={ocupado || !saude.hasWebhookToken} onClick={() => void acao({ op: 'webhook' }, (r) => (r.criado ? 'Webhook criado na conta Asaas.' : 'Webhook já existia.'))}>
                    Cadastrar webhook
                  </button>
                </>
              )}
            </div>
            <div style={{ color: '#a1a1a6', fontSize: '0.8rem' }}>
              último evento: {saude.ultimoEvento ? `${saude.ultimoEvento.evento} · ${dt(saude.ultimoEvento.recebido_em)}` : 'nenhum'}
              {saude.eventosComErro > 0 && <> · <span style={{ color: '#ff6b6b' }}>{saude.eventosComErro} com erro</span></>}
              <br />
              <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void acao({ op: 'manutencao' }, (r) => `Manutenção: ${r.eventosReprocessados} eventos, ${r.pixExpirados} Pix expirados, ${r.pagamentosConsultados} consultados, ${r.erpReenviados} reenviados ao ERP${Array.isArray(r.erros) && r.erros.length ? ` · ${r.erros.length} erro(s)` : ''}.`)}>
                Rodar manutenção agora
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#a1a1a6' }}>Consultando o Asaas…</p>
        )}
      </div>

      {/* -------------------------------------------------------- config */}
      {config && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Checkout</h3>
          <div className={styles.adminFormRow3}>
            <div className={styles.createField}>
              <label>Pagamento online aberto ao público</label>
              <button
                type="button"
                className={`${styles.actionBtn} ${config.checkout_ativo ? styles.actionBtnDeny : styles.actionBtnApprove}`}
                onClick={() => void salvarConfig({ checkout_ativo: !config.checkout_ativo })}
              >
                {config.checkout_ativo ? 'LIGADO — desligar' : 'DESLIGADO — ligar'}
              </button>
              <small style={{ color: '#a1a1a6' }}>Desligado, só o admin vê o botão "Fechar pedido e pagar".</small>
            </div>
            <div className={styles.createField}>
              <label>Pix expira em (min)</label>
              <input type="number" defaultValue={config.pix_expira_min} onBlur={(e) => void salvarConfig({ pix_expira_min: Math.max(5, Number(e.target.value) || 30) })} />
            </div>
            <div className={styles.createField}>
              <label>Boleto vence em (dias úteis)</label>
              <input type="number" defaultValue={config.boleto_vencimento_dias} onBlur={(e) => void salvarConfig({ boleto_vencimento_dias: Math.max(1, Number(e.target.value) || 3) })} />
            </div>
            <div className={styles.createField}>
              <label>Boleto: multa % / juros % a.m.</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" step="0.5" defaultValue={config.boleto_multa_pct} onBlur={(e) => void salvarConfig({ boleto_multa_pct: Number(e.target.value) || 0 })} />
                <input type="number" step="0.5" defaultValue={config.boleto_juros_mes_pct} onBlur={(e) => void salvarConfig({ boleto_juros_mes_pct: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className={styles.createField}>
              <label>Boleto só a partir de (R$)</label>
              <input type="number" defaultValue={config.boleto_minimo} onBlur={(e) => void salvarConfig({ boleto_minimo: Number(e.target.value) || 0 })} />
            </div>
            <div className={styles.createField}>
              <label>Cartão: parcelas sem juros / parcela mínima (R$)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" defaultValue={config.cartao_max_parcelas} onBlur={(e) => void salvarConfig({ cartao_max_parcelas: Math.min(21, Math.max(1, Number(e.target.value) || 1)) })} />
                <input type="number" defaultValue={config.cartao_parcela_minima} onBlur={(e) => void salvarConfig({ cartao_parcela_minima: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className={styles.createField}>
              <label>Retirada em São Paulo</label>
              <button type="button" className={styles.actionBtn} onClick={() => void salvarConfig({ retirada_ativa: !config.retirada_ativa })}>
                {config.retirada_ativa ? 'oferecida — desligar' : 'desligada — ligar'}
              </button>
              <input defaultValue={config.retirada_endereco} placeholder="endereço mostrado ao cliente" onBlur={(e) => void salvarConfig({ retirada_endereco: e.target.value })} />
            </div>
            <div className={styles.createField}>
              <label>Pedido mínimo (R$)</label>
              <input type="number" defaultValue={config.pedido_minimo} onBlur={(e) => void salvarConfig({ pedido_minimo: Number(e.target.value) || 0 })} />
            </div>
            <div className={styles.createField}>
              <label>Frete grátis acima de (R$, vazio = nunca)</label>
              <input type="number" defaultValue={config.frete_gratis_acima ?? ''} onBlur={(e) => void salvarConfig({ frete_gratis_acima: e.target.value === '' ? null : Number(e.target.value) || null })} />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- pedidos */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Pedidos</h3>
        <div className={styles.periodFilters}>
          {(['todos', 'aguardando', 'pagos', 'problema', 'orcamento'] as const).map((f) => (
            <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todos' : f === 'aguardando' ? 'Aguardando pagamento' : f === 'pagos' ? 'Pagos' : f === 'problema' ? 'Com problema' : 'Orçamento (sem pagamento)'}
            </button>
          ))}
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Quando</th>
                <th>Pagamento</th>
                <th>ERP</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => {
                const pags = pagsPorPedido.get(p.id) ?? [];
                const atual = pags[0];
                const abertoAqui = aberto === p.id;
                return (
                  <>
                    <tr key={p.id}>
                      <td>#{p.numero}</td>
                      <td>
                        {p.user_profiles?.full_name ?? '—'}
                        <br />
                        <small style={{ color: '#a1a1a6' }}>{p.user_profiles?.email ?? ''}</small>
                      </td>
                      <td>{dt(p.criado_em)}</td>
                      <td>
                        <span className={`${styles.badge} ${badge(p.pagamento_status)}`}>{STATUS_PAGAMENTO_LABEL[p.pagamento_status] ?? p.pagamento_status}</span>
                        {p.forma_pagamento && (
                          <>
                            <br />
                            <small style={{ color: '#a1a1a6' }}>
                              {FORMA_LABEL[p.forma_pagamento]}
                              {atual?.parcelas && atual.parcelas > 1 ? ` ${atual.parcelas}x` : ''}
                              {atual?.cartao_bandeira ? ` · ${atual.cartao_bandeira} ${atual.cartao_final}` : ''}
                            </small>
                          </>
                        )}
                      </td>
                      <td>
                        {p.erp_quote_number ? `nº ${p.erp_quote_number} · ${p.status}` : <span className={`${styles.badge} ${styles.badgePending}`}>não enviado</span>}
                        {p.pagamento_status === 'pago' && !p.erp_pago_em && (
                          <>
                            <br />
                            <span className={`${styles.badge} ${styles.badgePending}`}>ERP não avisado</span>
                          </>
                        )}
                      </td>
                      <td>{p.total_final != null ? BRL.format(Number(p.total_final)) : p.total_estimado != null ? `~${BRL.format(Number(p.total_estimado))}` : '—'}</td>
                      <td>
                        <button type="button" className={styles.actionBtn} onClick={() => setAberto(abertoAqui ? null : p.id)}>
                          {abertoAqui ? 'fechar' : 'detalhe'}
                        </button>
                      </td>
                    </tr>
                    {abertoAqui && (
                      <tr key={`${p.id}-d`}>
                        <td colSpan={7} style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem', color: '#d4d4d8' }}>
                            <div>
                              Frete: {p.frete?.retirada ? 'retirada em SP' : `${p.frete?.nome ?? '—'}${p.frete?.dias ? ` · ${p.frete.dias} d.ú.` : ''}`} · {BRL.format(Number(p.valor_frete ?? 0))}
                              {p.desconto > 0 ? ` · cupom ${p.cupom ?? ''} −${BRL.format(Number(p.desconto))}` : ''}
                              {' · '}tel {p.user_profiles?.phone ?? '—'}
                            </div>
                            {p.observacoes && <div style={{ whiteSpace: 'pre-wrap', color: '#a1a1a6' }}>{p.observacoes}</div>}
                            {pags.length === 0 ? (
                              <div style={{ color: '#a1a1a6' }}>Sem cobrança no Asaas (pedido enviado como orçamento).</div>
                            ) : (
                              <table className={styles.table} style={{ fontSize: '0.8rem' }}>
                                <thead>
                                  <tr>
                                    <th>Cobrança</th>
                                    <th>Forma</th>
                                    <th>Status</th>
                                    <th>Valor / líquido</th>
                                    <th>Vencimento / expira</th>
                                    <th>Pago em</th>
                                    <th>Último evento</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pags.map((g) => (
                                    <tr key={g.id}>
                                      <td>
                                        {g.invoice_url ? (
                                          <a href={g.invoice_url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>
                                            {g.asaas_payment_id}
                                          </a>
                                        ) : (
                                          g.asaas_payment_id
                                        )}
                                      </td>
                                      <td>
                                        {FORMA_LABEL[g.forma]}
                                        {g.parcelas > 1 ? ` ${g.parcelas}x` : ''}
                                        {g.cartao_bandeira ? ` · ${g.cartao_bandeira} ${g.cartao_final}` : ''}
                                      </td>
                                      <td>
                                        <span className={`${styles.badge} ${badge(g.status)}`}>{STATUS_PAGAMENTO_LABEL[g.status]}</span>
                                        <br />
                                        <small style={{ color: '#a1a1a6' }}>{g.status_asaas}</small>
                                      </td>
                                      <td>
                                        {BRL.format(Number(g.valor))}
                                        {g.valor_liquido != null ? ` / ${BRL.format(Number(g.valor_liquido))}` : ''}
                                        {Number(g.estornado_valor) > 0 ? ` · estornado ${BRL.format(Number(g.estornado_valor))}` : ''}
                                      </td>
                                      <td>{g.forma === 'PIX' ? dt(g.expira_em) : g.vencimento ?? '—'}</td>
                                      <td>{dt(g.pago_em)}</td>
                                      <td>{g.ultimo_evento ?? '—'}</td>
                                      <td>
                                        {g.status === 'pago' && g.forma !== 'BOLETO' && (
                                          <button
                                            type="button"
                                            className={`${styles.actionBtn} ${styles.actionBtnDeny}`}
                                            disabled={ocupado}
                                            onClick={() => {
                                              const v = window.prompt(`Estornar o pedido #${p.numero}. Valor (vazio = total ${BRL.format(Number(g.valor))}):`, '');
                                              if (v === null) return;
                                              const valor = v.trim() ? Number(v.replace(',', '.')) : undefined;
                                              if (!window.confirm(`Confirmar estorno de ${valor != null ? BRL.format(valor) : 'TODO o valor'}? Não dá para desfazer.`)) return;
                                              void acao({ op: 'estornar', numero: p.numero, valor }, (r) => (r.total ? 'Estorno total solicitado ao Asaas.' : 'Estorno parcial solicitado ao Asaas.'));
                                            }}
                                          >
                                            estornar
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: '#a1a1a6' }}>
                    Nenhum pedido neste filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------- eventos */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Eventos do webhook (últimos 100)</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Cobrança</th>
                <th>Processado</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id}>
                  <td>{dt(e.recebido_em)}</td>
                  <td>{e.evento}</td>
                  <td>{e.asaas_payment_id ?? '—'}</td>
                  <td>{e.processado_em ? dt(e.processado_em) : <span className={`${styles.badge} ${styles.badgePending}`}>pendente</span>}</td>
                  <td style={{ color: e.erro ? '#ff6b6b' : undefined }}>{e.erro ?? ''}</td>
                </tr>
              ))}
              {eventos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: '#a1a1a6' }}>
                    Nenhum evento recebido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
