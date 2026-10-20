// /admin/pagamentos — Pagamento online (Asaas): a configuração do checkout e a
// saúde da integração, separadas da lista de pedidos desde 20/10/2026.
//
//   · ligar/desligar o pagamento online e os parâmetros de Pix, boleto e
//     cartão (loja_config) — num formulário com Salvar, não campo a campo no
//     blur sem feedback, como era;
//   · saúde do Asaas: chave, ambiente, webhook (e o botão que o cadastra: a
//     chave só existe no servidor), último evento DA LOJA, eventos com erro;
//   · eventos do webhook: por padrão só os da loja. A conta Asaas é a mesma do
//     NZERP, então os boletos dele também chegam aqui e são ignorados — 510
//     de 518 eventos em 20/10 eram do ERP, e a lista antiga mostrava eles;
//   · manutenção (reprocessa erros, expira Pix, reconsulta, reenvia ao ERP,
//     corrige parcelado) e remoção de cobrança órfã.
//
// Retirada em SP e frete grátis ficam em Logística.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { chamarCheckout, textoDoErro } from '../../lib/shop/checkout';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Config {
  checkout_ativo: boolean;
  pix_expira_min: number;
  boleto_vencimento_dias: number;
  boleto_multa_pct: number;
  boleto_juros_mes_pct: number;
  boleto_minimo: number;
  cartao_max_parcelas: number;
  cartao_parcela_minima: number;
  pedido_minimo: number;
}

type Form = Record<keyof Omit<Config, 'checkout_ativo'>, string>;

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

interface Evento {
  id: string;
  evento: string;
  asaas_payment_id: string | null;
  pedido_id: string | null;
  recebido_em: string;
  processado_em: string | null;
  erro: string | null;
  resolvido_em: string | null;
}

const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const CAMPOS: { k: keyof Form; rotulo: string; step?: string; min?: number }[] = [
  { k: 'pix_expira_min', rotulo: 'Pix expira em (minutos)', min: 5 },
  { k: 'boleto_vencimento_dias', rotulo: 'Boleto vence em (dias úteis)', min: 1 },
  { k: 'boleto_multa_pct', rotulo: 'Boleto: multa (%)', step: '0.5', min: 0 },
  { k: 'boleto_juros_mes_pct', rotulo: 'Boleto: juros (% ao mês)', step: '0.5', min: 0 },
  { k: 'boleto_minimo', rotulo: 'Boleto só a partir de (R$)', min: 0 },
  { k: 'cartao_max_parcelas', rotulo: 'Cartão: parcelas sem juros (máx.)', min: 1 },
  { k: 'cartao_parcela_minima', rotulo: 'Cartão: parcela mínima (R$)', min: 0 },
  { k: 'pedido_minimo', rotulo: 'Pedido mínimo (R$, 0 = sem mínimo)', min: 0 },
];

export default function AdminPagamentos() {
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saude, setSaude] = useState<Saude | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [numeros, setNumeros] = useState<Map<string, number>>(new Map());
  const [todos, setTodos] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [cobrancaOrfa, setCobrancaOrfa] = useState('');

  const carregarConfig = useCallback(async () => {
    const { data, error } = await supabase.from('loja_config').select('checkout_ativo, pix_expira_min, boleto_vencimento_dias, boleto_multa_pct, boleto_juros_mes_pct, boleto_minimo, cartao_max_parcelas, cartao_parcela_minima, pedido_minimo').eq('id', 1).maybeSingle();
    if (error) {
      setErro(error.message);
      return;
    }
    const c = data as Config | null;
    if (!c) return;
    setConfig(c);
    setForm({
      pix_expira_min: String(c.pix_expira_min),
      boleto_vencimento_dias: String(c.boleto_vencimento_dias),
      boleto_multa_pct: String(c.boleto_multa_pct),
      boleto_juros_mes_pct: String(c.boleto_juros_mes_pct),
      boleto_minimo: String(c.boleto_minimo),
      cartao_max_parcelas: String(c.cartao_max_parcelas),
      cartao_parcela_minima: String(c.cartao_parcela_minima),
      pedido_minimo: String(c.pedido_minimo),
    });
  }, []);

  const carregarEventos = useCallback(async () => {
    const { data } = await supabase.from('asaas_eventos').select('id, evento, asaas_payment_id, pedido_id, recebido_em, processado_em, erro, resolvido_em').order('recebido_em', { ascending: false }).limit(todos ? 200 : 400);
    const lista = (data ?? []) as Evento[];
    setEventos(lista);
    const ids = [...new Set(lista.map((e) => e.pedido_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: peds } = await supabase.from('pedidos').select('id, numero').in('id', ids);
      setNumeros(new Map(((peds ?? []) as { id: string; numero: number }[]).map((p) => [p.id, p.numero])));
    }
  }, [todos]);

  const carregarSaude = useCallback(async () => {
    try {
      setSaude(await chamarCheckout<Saude>({ op: 'saude' }));
    } catch (e) {
      setSaude(null);
      setMsg(`Saúde do Asaas: ${textoDoErro(e)}`);
    }
  }, []);

  useEffect(() => {
    void carregarConfig();
    void carregarSaude();
  }, [carregarConfig, carregarSaude]);

  useEffect(() => {
    void carregarEventos();
  }, [carregarEventos]);

  const gravar = async (patch: Partial<Config>) => {
    setSalvando(true);
    setMsg('');
    const { error } = await supabase.from('loja_config').update({ ...patch, atualizado_em: new Date().toISOString() }).eq('id', 1);
    setSalvando(false);
    if (error) {
      setMsg(`Não salvou: ${error.message}`);
      return;
    }
    setMsg('Configuração salva.');
    await carregarConfig();
  };

  const salvarForm = () => {
    if (!form) return;
    const num = (k: keyof Form, min: number, padrao: number) => {
      const v = Number(String(form[k]).replace(',', '.'));
      return Number.isFinite(v) ? Math.max(min, v) : padrao;
    };
    void gravar({
      pix_expira_min: Math.round(num('pix_expira_min', 5, 30)),
      boleto_vencimento_dias: Math.round(num('boleto_vencimento_dias', 1, 3)),
      boleto_multa_pct: num('boleto_multa_pct', 0, 2),
      boleto_juros_mes_pct: num('boleto_juros_mes_pct', 0, 1),
      boleto_minimo: num('boleto_minimo', 0, 0),
      cartao_max_parcelas: Math.min(21, Math.round(num('cartao_max_parcelas', 1, 6))),
      cartao_parcela_minima: num('cartao_parcela_minima', 0, 100),
      pedido_minimo: num('pedido_minimo', 0, 0),
    });
  };

  const acao = async (body: Record<string, unknown>, okMsg: (r: Record<string, unknown>) => string) => {
    setOcupado(true);
    setMsg('');
    try {
      const r = await chamarCheckout<Record<string, unknown>>(body);
      setMsg(okMsg(r));
      await Promise.all([carregarSaude(), carregarEventos()]);
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const eventosVisiveis = useMemo(() => (todos ? eventos : eventos.filter((e) => e.pedido_id || e.erro)).slice(0, 100), [eventos, todos]);
  const foraDaLoja = eventos.length - eventos.filter((e) => e.pedido_id || e.erro).length;

  return (
    <div>
      <p className={styles.tabDescription}>
        Pagamento online da loja via <strong>Asaas</strong> (Pix, cartão até 6x, boleto). Os pedidos estão em{' '}
        <Link to="/admin/pedidos" style={{ color: '#fff' }}>Pedidos</Link>; retirada em SP e frete grátis em{' '}
        <Link to="/admin/logistica" style={{ color: '#fff' }}>Logística</Link>.
      </p>
      {erro && <p className={ped.aviso}>{erro}</p>}
      {msg && <p className={ped.msg}>{msg}</p>}

      {/* ----------------------------------------------------- liga/desliga */}
      {config && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Pagamento online</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <span className={`${ped.chip} ${config.checkout_ativo ? ped.ok : ped.erro}`}>{config.checkout_ativo ? 'ABERTO AO PÚBLICO' : 'DESLIGADO'}</span>
            <button
              type="button"
              className={`${styles.actionBtn} ${config.checkout_ativo ? styles.actionBtnDeny : styles.actionBtnApprove}`}
              disabled={salvando}
              onClick={() => {
                if (config.checkout_ativo && !window.confirm('Desligar o pagamento online? O cliente volta a só poder enviar o pedido como orçamento.')) return;
                void gravar({ checkout_ativo: !config.checkout_ativo });
              }}
            >
              {config.checkout_ativo ? 'Desligar' : 'Ligar'}
            </button>
            <span className={ped.mudo}>Desligado, só o admin vê "Ir para entrega e pagamento" no carrinho; o cliente envia como orçamento.</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- parâmetros */}
      {form && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Pix, boleto e cartão</h3>
          <div className={styles.adminFormRow3}>
            {CAMPOS.map((c) => (
              <div key={c.k} className={styles.createField}>
                <label>{c.rotulo}</label>
                <input type="number" step={c.step} min={c.min} value={form[c.k]} onChange={(e) => setForm((f) => (f ? { ...f, [c.k]: e.target.value } : f))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={salvando} onClick={salvarForm}>
              {salvando ? 'Salvando…' : 'Salvar parâmetros'}
            </button>
            <span className={ped.mudo}>Vale para o próximo pedido; cobranças já criadas não mudam.</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ saúde */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Integração Asaas</h3>
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
                  webhook {saude.webhook.interrupted ? 'FILA PAUSADA — religar no painel Asaas' : saude.webhook.enabled ? `ativo · ${saude.webhook.eventos} tipos de evento` : 'desligado'}
                </span>
              ) : (
                <>
                  <span className={`${styles.badge} ${styles.badgePending}`}>webhook não cadastrado</span>{' '}
                  <button type="button" className={styles.actionBtn} disabled={ocupado || !saude.hasWebhookToken} onClick={() => void acao({ op: 'webhook' }, (r) => (r.criado ? 'Webhook criado na conta Asaas.' : 'Webhook já existia.'))}>
                    Cadastrar webhook
                  </button>
                </>
              )}
              {saude.outrosWebhooks.length > 0 && (
                <>
                  <br />
                  <small className={ped.mudo}>outros na conta: {saude.outrosWebhooks.map((w) => `${w.name}${w.interrupted ? ' (pausado)' : ''}`).join(', ')}</small>
                </>
              )}
            </div>
            <div className={ped.mudo}>
              último evento da loja: {saude.ultimoEvento ? `${saude.ultimoEvento.evento} · ${dt(saude.ultimoEvento.recebido_em)}` : 'nenhum'}
              {saude.eventosComErro > 0 && (
                <>
                  {' '}
                  · <span style={{ color: '#ff6b6b' }}>{saude.eventosComErro} com erro</span>
                </>
              )}
              <br />
              <button
                type="button"
                className={styles.actionBtn}
                disabled={ocupado}
                style={{ marginTop: '0.4rem' }}
                onClick={() =>
                  void acao(
                    { op: 'manutencao' },
                    (r) =>
                      `Manutenção: ${r.eventosReprocessados} evento(s) reprocessado(s), ${r.pixExpirados} Pix expirado(s), ${r.pagamentosConsultados} consultado(s), ${r.erpReenviados} reenviado(s) ao ERP, ${r.parceladosCorrigidos ?? 0} parcelado(s) corrigido(s)${Array.isArray(r.erros) && r.erros.length ? ` · ${r.erros.length} erro(s): ${(r.erros as string[]).slice(0, 2).join('; ')}` : ''}.`
                  )
                }
              >
                {ocupado ? 'Rodando…' : 'Rodar manutenção agora'}
              </button>
            </div>
          </div>
        ) : (
          <p className={ped.mudo}>Consultando o Asaas…</p>
        )}
      </div>

      {/* ---------------------------------------------------------- eventos */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Eventos do webhook</h3>
        <div className={ped.barra}>
          <span className={ped.mudo}>
            {todos ? 'Todos os eventos da conta, inclusive os boletos do NZERP.' : `Só os da loja${foraDaLoja > 0 ? ` — ${foraDaLoja} do NZERP escondidos` : ''}.`}
          </span>
          <button type="button" className={styles.actionBtn} onClick={() => setTodos((t) => !t)}>
            {todos ? 'mostrar só os da loja' : 'mostrar todos'}
          </button>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Pedido</th>
                <th>Cobrança</th>
                <th>Processado</th>
                <th>Erro</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {eventosVisiveis.map((e) => (
                <tr key={e.id}>
                  <td>{dt(e.recebido_em)}</td>
                  <td>{e.evento}</td>
                  <td>
                    {e.pedido_id && numeros.get(e.pedido_id) ? (
                      <Link to={`/admin/pedidos/${numeros.get(e.pedido_id)}`} style={{ color: '#fff' }}>
                        #{numeros.get(e.pedido_id)}
                      </Link>
                    ) : (
                      <span className={ped.mudo}>{e.pedido_id ? '…' : 'NZERP'}</span>
                    )}
                  </td>
                  <td className={ped.mudo}>{e.asaas_payment_id ?? '—'}</td>
                  <td>{e.processado_em ? dt(e.processado_em) : <span className={`${styles.badge} ${styles.badgePending}`}>pendente</span>}</td>
                  <td style={{ color: e.erro ? (e.resolvido_em ? '#8a8a8a' : '#ff6b6b') : undefined }}>
                    {e.erro ?? ''}
                    {e.erro && e.resolvido_em ? ' (resolvido)' : ''}
                  </td>
                  <td>
                    {e.erro && !e.resolvido_em && (
                      <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void acao({ op: 'resolver-evento', eventoId: e.id }, () => 'Evento marcado como resolvido.')}>
                        resolvido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {eventosVisiveis.length === 0 && (
                <tr>
                  <td colSpan={7} className={ped.mudo}>
                    Nenhum evento da loja ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------- cobrança órfã */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Remover cobrança órfã</h3>
        <p className={styles.tabDescription}>
          Cobrança que ficou no Asaas sem pedido (teste, pedido apagado). Só remove se não estiver paga — cobrança paga se devolve por estorno, no pedido.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className={ped.busca} placeholder="pay_xxxxxxxxxxxx" value={cobrancaOrfa} onChange={(e) => setCobrancaOrfa(e.target.value)} style={{ maxWidth: 280 }} />
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDeny}`}
            disabled={ocupado || !/^pay_[a-z0-9]+$/i.test(cobrancaOrfa.trim())}
            onClick={() => {
              if (!window.confirm(`Remover a cobrança ${cobrancaOrfa.trim()} no Asaas?`)) return;
              void acao({ op: 'remover-cobranca', asaasPaymentId: cobrancaOrfa.trim() }, (r) => (r.removida ? `Cobrança removida (estava ${r.statusAntes}, R$ ${r.valor}).` : `Cobrança já estava removida (${r.statusAntes}).`));
              setCobrancaOrfa('');
            }}
          >
            Remover no Asaas
          </button>
        </div>
      </div>
    </div>
  );
}
