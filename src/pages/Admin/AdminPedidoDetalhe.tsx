// /admin/pedidos/:numero — o pedido inteiro numa tela: cliente, entrega,
// itens com foto, cobranças do Asaas, o que o NZERP sabe e a linha do tempo.
//
// Duas fontes, de propósito:
//   · `op: 'status'` do checkout — a mesma chamada da página do cliente. Além
//     dos itens com foto, ela reconsulta o Asaas se o pagamento está em aberto
//     e tenta o despacho ao ERP se ficou para trás. Abrir o pedido já "cutuca"
//     o que estiver atrasado;
//   · leitura direta (RLS de admin) de `pedidos`, `pagamentos` e
//     `asaas_eventos`, que têm o que o cliente não vê: perfil, erro do envio
//     ao ERP, líquido, status cru do Asaas, eventos.
//
// Os botões são os que já existiam na lista antiga (estornar, enviar ao NZERP,
// cancelar), só que no lugar onde fazem sentido.

import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { normalizarDocumento, tipoDocumento } from '../../lib/documento';
import { chamarCheckout, textoDoErro, FORMA_LABEL, STATUS_PAGAMENTO_LABEL, type Forma, type PedidoStatus, type StatusPagamento } from '../../lib/shop/checkout';
import { BRL } from '../../lib/shop/precos';
import { rotuloQtd, type UnidadeVenda } from '../../lib/shop/unidade';
import { situacaoDoPedido, type PedidoSituacao } from '../../lib/shop/situacaoPedido';
import { STATUS_LABEL } from '../Painel/pedidoRotulos';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';
import TituloComTutorial from '../../components/Tutorial/TituloComTutorial';

interface Perfil {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  erp_client_id: string | null;
  created_at: string | null;
}

interface PedidoRow extends PedidoSituacao {
  id: string;
  numero: number;
  user_id: string | null;
  erp_envio_em: string | null;
  erp_quote_id: string | null;
  total_final: number | null;
  total_estimado: number | null;
  total_erp: number | null;
  /** Fase 3: parte do pedido paga com o saldo da carteira. */
  saldo_usado: number | null;
  valor_frete: number;
  desconto: number;
  cupom: string | null;
  frete: { nome?: string; retirada?: boolean; dias?: number; valor?: number; transportadora?: string } | null;
  endereco: { rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string } | null;
  observacoes: string | null;
  criado_em: string;
  pago_em: string | null;
  enviado_em: string | null;
  status_atualizado_em: string | null;
  user_profiles: Perfil | null;
}

interface PagamentoRow {
  id: string;
  asaas_payment_id: string | null;
  asaas_installment_id: string | null;
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
  recibo_url: string | null;
  pago_em: string | null;
  estornado_valor: number;
  ultimo_evento: string | null;
  criado_em: string;
  atualizado_em: string;
}

interface Evento {
  id: string;
  evento: string;
  asaas_payment_id: string | null;
  recebido_em: string;
  processado_em: string | null;
  erro: string | null;
  resolvido_em: string | null;
}

interface ContextoAdmin {
  recarregarBadges: () => Promise<void> | void;
}

const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const dia = (ymd: string | null) => {
  if (!ymd) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ymd;
};
const cpfMascarado = (v: string | null) => {
  const d = normalizarDocumento(v ?? '');
  const tipo = tipoDocumento(d);
  if (tipo === 'cpf') return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
  if (tipo === 'cnpj') return `${d.slice(0, 2)}.${d.slice(2, 5)}.***/****-${d.slice(12)}`;
  return v ? '•••' : '—'; // fora do formato: não mostra o documento inteiro
};
const RUINS = new Set<string>(['recusado', 'expirado', 'vencido', 'cancelado', 'estornado']);

export default function AdminPedidoDetalhe() {
  const { numero } = useParams();
  const n = Number(numero);
  const contexto = useOutletContext<ContextoAdmin | undefined>();
  const [pedido, setPedido] = useState<PedidoRow | null>(null);
  const [vivo, setVivo] = useState<PedidoStatus | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoRow[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!Number.isFinite(n) || n <= 0) {
      setErro('Número de pedido inválido.');
      setCarregando(false);
      return;
    }
    const { data: p, error } = await supabase
      .from('pedidos')
      .select(
        'id, numero, user_id, status, pagamento_status, forma_pagamento, erp_envio, erp_envio_em, erp_envio_erro, erp_pago_em, erp_quote_number, erp_quote_id, total_final, total_estimado, total_erp, saldo_usado, valor_frete, desconto, cupom, frete, endereco, observacoes, criado_em, pago_em, enviado_em, status_atualizado_em, user_profiles(full_name, company_name, email, phone, cpf_cnpj, erp_client_id, created_at)'
      )
      .eq('numero', n)
      .maybeSingle();
    if (error || !p) {
      setErro(error ? error.message : `Pedido #${n} não encontrado.`);
      setCarregando(false);
      return;
    }
    const row = p as unknown as PedidoRow;
    setPedido(row);
    const [{ data: pags }, { data: evs }] = await Promise.all([
      supabase.from('pagamentos').select('*').eq('pedido_id', row.id).order('criado_em', { ascending: false }),
      supabase.from('asaas_eventos').select('id, evento, asaas_payment_id, recebido_em, processado_em, erro, resolvido_em').eq('pedido_id', row.id).order('recebido_em', { ascending: false }).limit(60),
    ]);
    setPagamentos((pags ?? []) as PagamentoRow[]);
    setEventos((evs ?? []) as Evento[]);
    setCarregando(false);
    // Itens com foto + sincronização com Asaas/ERP, em segundo plano.
    try {
      const v = await chamarCheckout<PedidoStatus>({ op: 'status', numero: n });
      setVivo(v);
      if (v.pedido.pagamentoStatus !== row.pagamento_status || v.pedido.status !== row.status) {
        // A chamada mexeu em alguma coisa (marcou pago, despachou ao ERP): relê.
        const { data: p2 } = await supabase.from('pedidos').select('status, pagamento_status, erp_envio, erp_envio_erro, erp_pago_em, erp_quote_number, erp_envio_em, enviado_em, pago_em, status_atualizado_em').eq('id', row.id).maybeSingle();
        if (p2) setPedido((atual) => (atual ? { ...atual, ...(p2 as Partial<PedidoRow>) } : atual));
        const { data: pags2 } = await supabase.from('pagamentos').select('*').eq('pedido_id', row.id).order('criado_em', { ascending: false });
        setPagamentos((pags2 ?? []) as PagamentoRow[]);
      }
    } catch (e) {
      setMsg(`Itens e sincronização: ${textoDoErro(e)}`);
    }
  }, [n]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const acao = async (body: Record<string, unknown>, okMsg: (r: Record<string, unknown>) => string) => {
    setOcupado(true);
    setMsg('');
    try {
      const r = await chamarCheckout<Record<string, unknown>>(body);
      setMsg(okMsg(r));
      await carregar();
      await contexto?.recarregarBadges();
    } catch (e) {
      setMsg(textoDoErro(e));
    } finally {
      setOcupado(false);
    }
  };

  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando pedido…</p>;
  if (erro || !pedido) {
    return (
      <div>
        <Link to="/admin/pedidos" className={ped.voltar}>
          ← Pedidos
        </Link>
        <p className={ped.aviso}>{erro || 'Pedido não encontrado.'}</p>
      </div>
    );
  }

  const atual = pagamentos[0] ?? null;
  const situacao = situacaoDoPedido({ ...pedido, expira_em: atual?.expira_em ?? null, vencimento: atual?.vencimento ?? null });
  const u = pedido.user_profiles;
  const total = pedido.total_final ?? pedido.total_estimado;
  const pago = pedido.pagamento_status === 'pago';
  const podeEnviarErp = pedido.status !== 'CANCELADO' && (pedido.erp_envio !== 'enviado' || (pago && !pedido.erp_pago_em));
  const podeCancelar = !pago && pedido.status !== 'CANCELADO';
  const pagoEstornavel = pagamentos.find((g) => g.status === 'pago' && g.forma !== 'BOLETO') ?? null;
  const itens = vivo?.pedido.itens ?? [];
  const end = pedido.endereco;

  const estornar = () => {
    if (!pagoEstornavel) return;
    const v = window.prompt(`Estornar o pedido #${pedido.numero}. Valor (vazio = total ${BRL.format(Number(pagoEstornavel.valor))}):`, '');
    if (v === null) return;
    const valor = v.trim() ? Number(v.replace(',', '.')) : undefined;
    if (!window.confirm(`Confirmar estorno de ${valor != null ? BRL.format(valor) : 'TODO o valor'}? Não dá para desfazer.`)) return;
    void acao({ op: 'estornar', numero: pedido.numero, valor }, (r) => (r.total ? 'Estorno total solicitado ao Asaas.' : 'Estorno parcial solicitado ao Asaas.'));
  };

  const cancelar = () => {
    const motivo = window.prompt(`Cancelar o pedido #${pedido.numero}? Cobrança em aberto é removida no Asaas e o orçamento é cancelado no NZERP. Motivo (opcional):`, '');
    if (motivo === null) return;
    void acao({ op: 'cancelar', numero: pedido.numero, pedidoTambem: true, motivo }, (r) => (r.pedido === 'CANCELADO' ? `Pedido #${pedido.numero} cancelado${r.semErp ? ' (nunca chegou ao NZERP)' : ''}.` : `Cobranças canceladas: ${String(r.cancelados ?? 0)}.`));
  };

  // ---------------------------------------------------------- linha do tempo
  const passos: { quando: string | null; texto: string; sub?: string | null; estado: 'feito' | 'ruim' | 'pendente' }[] = [];
  passos.push({ quando: pedido.criado_em, texto: `Pedido #${pedido.numero} criado no site`, sub: pedido.forma_pagamento ? `pagamento online por ${FORMA_LABEL[pedido.forma_pagamento as Forma] ?? pedido.forma_pagamento}` : 'enviado como orçamento (sem pagamento online)', estado: 'feito' });
  for (const g of [...pagamentos].reverse()) {
    passos.push({ quando: g.criado_em, texto: `Cobrança ${FORMA_LABEL[g.forma]}${g.parcelas > 1 ? ` em ${g.parcelas}x` : ''} criada no Asaas`, sub: g.asaas_payment_id, estado: 'feito' });
    if (g.status === 'pago' || g.status === 'estornado') passos.push({ quando: g.pago_em, texto: 'Pagamento confirmado', sub: g.valor_liquido != null ? `líquido ${BRL.format(Number(g.valor_liquido))}` : null, estado: 'feito' });
    if (RUINS.has(g.status) && g.status !== 'estornado') passos.push({ quando: g.atualizado_em, texto: STATUS_PAGAMENTO_LABEL[g.status], estado: 'ruim' });
    if (g.status === 'estornado') passos.push({ quando: g.atualizado_em, texto: 'Estornado', sub: BRL.format(Number(g.estornado_valor || g.valor)), estado: 'ruim' });
  }
  if (pedido.erp_quote_number) {
    passos.push({ quando: pedido.enviado_em ?? pedido.erp_envio_em, texto: `Orçamento ${pedido.erp_quote_number} criado no NZERP`, estado: 'feito' });
    if (pago) passos.push({ quando: pedido.erp_pago_em, texto: pedido.erp_pago_em ? 'NZERP avisado do pagamento' : 'NZERP ainda não sabe do pagamento', estado: pedido.erp_pago_em ? 'feito' : 'ruim' });
    passos.push({ quando: pedido.status_atualizado_em, texto: `Status no NZERP: ${STATUS_LABEL[pedido.status] ?? pedido.status}`, estado: pedido.status === 'CANCELADO' || pedido.status === 'NAO_APROVADO' || pedido.status === 'NAO_ENTREGUE' ? 'ruim' : 'feito' });
  } else if (pedido.status === 'CANCELADO') {
    passos.push({ quando: pedido.status_atualizado_em, texto: 'Cancelado antes de ir ao NZERP', estado: 'ruim' });
  } else {
    passos.push({ quando: null, texto: 'Ainda não foi ao NZERP', sub: pedido.erp_envio_erro ?? (pago ? 'o cron tenta de novo sozinho' : 'o vendedor envia quando quiser'), estado: pago ? 'ruim' : 'pendente' });
  }
  passos.sort((a, b) => (a.quando ? new Date(a.quando).getTime() : Number.MAX_SAFE_INTEGER) - (b.quando ? new Date(b.quando).getTime() : Number.MAX_SAFE_INTEGER));

  return (
    <div>
      <header className={ped.topo}>
        <div>
          <Link to="/admin/pedidos" className={ped.voltar}>
            ← Pedidos
          </Link>
          <TituloComTutorial tutorial="admin.pedido-detalhe">
            <h2 className={ped.titulo}>Pedido #{pedido.numero}</h2>
          </TituloComTutorial>
          <span className={`${ped.chip} ${ped[situacao.tom]}`}>{situacao.rotulo}</span>
          {situacao.detalhe && <span className={ped.detalhe}>{situacao.detalhe}</span>}
          <p className={ped.mudo} style={{ marginTop: '0.5rem' }}>
            criado {dt(pedido.criado_em)}
            {pedido.pago_em ? ` · pago ${dt(pedido.pago_em)}` : ''}
          </p>
        </div>
        <div className={ped.topoDireita}>
          <div className={ped.total}>{total != null ? BRL.format(Number(total)) : '—'}</div>
          <span className={ped.mudo}>
            {pedido.total_final != null ? 'total cobrado' : 'estimado (orçamento)'}
            {pedido.desconto > 0 ? ` · cupom ${pedido.cupom ?? ''} −${BRL.format(Number(pedido.desconto))}` : ''}
            {Number(pedido.valor_frete) > 0 ? ` · frete ${BRL.format(Number(pedido.valor_frete))}` : ''}
            {Number(pedido.saldo_usado) > 0 ? ` · saldo da carteira −${BRL.format(Number(pedido.saldo_usado))} (Asaas cobrou ${BRL.format(Number(pedido.total_final ?? 0) - Number(pedido.saldo_usado))})` : ''}
          </span>
        </div>
      </header>

      <div className={ped.acoes}>
        {podeEnviarErp && (
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={ocupado} onClick={() => void acao({ op: 'enviar-erp', numero: pedido.numero }, (r) => (r.estado === 'enviado' ? `Virou o orçamento ${r.erpQuoteNumber ?? ''} no NZERP.` : r.pagamentoConfirmado ? 'NZERP avisado do pagamento.' : 'Já estava no NZERP.'))}>
            {pedido.erp_envio === 'enviado' ? 'Avisar o NZERP do pagamento' : 'Enviar ao NZERP'}
          </button>
        )}
        {pagoEstornavel && (
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDeny}`} disabled={ocupado} onClick={estornar}>
            Estornar
          </button>
        )}
        {podeCancelar && (
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDeny}`} disabled={ocupado} onClick={cancelar}>
            Cancelar pedido
          </button>
        )}
        <button type="button" className={styles.actionBtn} disabled={ocupado} onClick={() => void carregar()}>
          Atualizar
        </button>
      </div>
      {msg && <p className={ped.msg}>{msg}</p>}

      <div className={ped.cards}>
        <div className={ped.card}>
          <h3 className={ped.cardTitulo}>Cliente</h3>
          <strong>{u?.company_name || u?.full_name || '—'}</strong>
          {u?.company_name && u.full_name ? <><br />{u.full_name}</> : null}
          <br />
          {u?.email ?? '—'}
          <br />
          {u?.phone ?? '—'}
          <br />
          <small>
            {cpfMascarado(u?.cpf_cnpj ?? null)}
            {u?.created_at ? ` · cadastro ${dia(u.created_at)}` : ''}
            {u?.erp_client_id ? ' · ligado ao cliente do NZERP' : ' · ainda sem vínculo no NZERP'}
          </small>
        </div>

        <div className={ped.card}>
          <h3 className={ped.cardTitulo}>Entrega</h3>
          {pedido.frete?.retirada ? (
            <strong>Retirada em São Paulo</strong>
          ) : (
            <>
              <strong>{pedido.frete?.nome ?? '—'}</strong>
              {pedido.frete?.dias ? ` · ${pedido.frete.dias} dias úteis` : ''}
              {typeof pedido.frete?.valor === 'number' ? ` · ${BRL.format(pedido.frete.valor)}` : ''}
            </>
          )}
          {end ? (
            <>
              <br />
              {end.rua ?? ''}
              {end.numero ? `, ${end.numero}` : ''}
              {end.complemento ? ` — ${end.complemento}` : ''}
              <br />
              {end.bairro ? `${end.bairro} · ` : ''}
              {end.cidade ?? ''}
              {end.uf ? `/${end.uf}` : ''}
              {end.cep ? ` · CEP ${end.cep}` : ''}
            </>
          ) : (
            <>
              <br />
              <small>sem endereço gravado</small>
            </>
          )}
        </div>

        <div className={ped.card}>
          <h3 className={ped.cardTitulo}>Pagamento</h3>
          {atual ? (
            <>
              <strong>{FORMA_LABEL[atual.forma]}</strong>
              {atual.parcelas > 1 ? ` em ${atual.parcelas}x de ${BRL.format(Math.round((Number(atual.valor) / atual.parcelas) * 100) / 100)}` : ''}
              {atual.cartao_bandeira ? ` · ${atual.cartao_bandeira} ${atual.cartao_final ?? ''}` : ''}
              <br />
              <span className={`${ped.chip} ${atual.status === 'pago' ? ped.ok : RUINS.has(atual.status) ? ped.erro : ped.atencao}`}>{STATUS_PAGAMENTO_LABEL[atual.status]}</span>{' '}
              <small>{atual.status_asaas ?? ''}</small>
              <br />
              <small>
                {atual.valor_liquido != null ? `líquido ${BRL.format(Number(atual.valor_liquido))}` : 'líquido ainda não apurado'}
                {Number(atual.estornado_valor) > 0 ? ` · estornado ${BRL.format(Number(atual.estornado_valor))}` : ''}
              </small>
              {atual.invoice_url && (
                <>
                  <br />
                  <a href={atual.invoice_url} target="_blank" rel="noreferrer">
                    abrir cobrança no Asaas ↗
                  </a>
                </>
              )}
            </>
          ) : (
            <span className={ped.mudo}>Sem cobrança online — pedido enviado como orçamento.</span>
          )}
        </div>

        <div className={ped.card}>
          <h3 className={ped.cardTitulo}>NZERP</h3>
          {pedido.erp_quote_number ? (
            <>
              <strong>Orçamento {pedido.erp_quote_number}</strong>
              <br />
              {STATUS_LABEL[pedido.status] ?? pedido.status}
              <br />
              <small>
                {pedido.total_erp != null ? `total no ERP ${BRL.format(Number(pedido.total_erp))} · ` : ''}
                {pago ? (pedido.erp_pago_em ? `avisado do pagamento ${dt(pedido.erp_pago_em)}` : 'NÃO avisado do pagamento') : 'sem pagamento online'}
              </small>
            </>
          ) : (
            <>
              <strong>Ainda não está no NZERP</strong>
              <br />
              <small>{pedido.erp_envio_erro ?? (pedido.status === 'SOLICITADO' ? 'orçamento esperando o vendedor enviar' : pago ? 'o cron tenta de novo sozinho' : `envio: ${pedido.erp_envio ?? '—'}`)}</small>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- itens */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Itens</h3>
        {itens.length === 0 ? (
          <p className={ped.mudo}>{vivo ? 'Nenhum item gravado.' : 'Carregando itens…'}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>Produto</th>
                  <th>Código</th>
                  <th>Quantidade</th>
                  <th>Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i, idx) => {
                  const qtd = Number(i.qtd);
                  const unit = i.unit != null ? Number(i.unit) : null;
                  return (
                    <tr key={idx}>
                      <td>
                        <span className={ped.thumb} aria-hidden="true">
                          {i.imagem ? <img src={i.imagem} alt="" loading="lazy" /> : <span style={{ background: i.hex ?? '#222' }} />}
                        </span>
                      </td>
                      <td>{i.slug ? <Link to={`/loja/${i.slug}`} style={{ color: '#fff' }}>{i.nome}</Link> : i.nome}</td>
                      <td className={ped.mudo}>{i.codigo ?? '—'}</td>
                      <td>
                        {qtd} {rotuloQtd(i.unidade as UnidadeVenda, qtd)}
                      </td>
                      <td>{unit != null ? BRL.format(unit) : '—'}</td>
                      <td>{unit != null ? BRL.format(Math.round(unit * qtd * 100) / 100) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- cobranças */}
      {pagamentos.length > 0 && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Cobranças no Asaas</h3>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cobrança</th>
                  <th>Forma</th>
                  <th>Status</th>
                  <th>Valor / líquido</th>
                  <th>Vencimento / expira</th>
                  <th>Pago em</th>
                  <th>Último evento</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((g) => (
                  <tr key={g.id}>
                    <td>
                      {g.invoice_url ? (
                        <a href={g.invoice_url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>
                          {g.asaas_payment_id}
                        </a>
                      ) : (
                        g.asaas_payment_id
                      )}
                      {g.asaas_installment_id ? (
                        <>
                          <br />
                          <small className={ped.mudo}>parcelamento {g.asaas_installment_id}</small>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {FORMA_LABEL[g.forma]}
                      {g.parcelas > 1 ? ` ${g.parcelas}x` : ''}
                      {g.cartao_bandeira ? ` · ${g.cartao_bandeira} ${g.cartao_final ?? ''}` : ''}
                    </td>
                    <td>
                      <span className={`${ped.chip} ${g.status === 'pago' ? ped.ok : RUINS.has(g.status) ? ped.erro : ped.atencao}`}>{STATUS_PAGAMENTO_LABEL[g.status]}</span>
                      <br />
                      <small className={ped.mudo}>{g.status_asaas}</small>
                    </td>
                    <td>
                      {BRL.format(Number(g.valor))}
                      {g.valor_liquido != null ? ` / ${BRL.format(Number(g.valor_liquido))}` : ''}
                      {Number(g.estornado_valor) > 0 ? ` · estornado ${BRL.format(Number(g.estornado_valor))}` : ''}
                    </td>
                    <td>{g.forma === 'PIX' ? dt(g.expira_em) : dia(g.vencimento)}</td>
                    <td>{dt(g.pago_em)}</td>
                    <td className={ped.mudo}>{g.ultimo_evento ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- linha do tempo */}
      <div className={styles.tableSection}>
        <h3 className={styles.tableSectionTitle}>Linha do tempo</h3>
        <ul className={ped.timeline}>
          {passos.map((p, i) => (
            <li key={i} className={p.estado === 'feito' ? ped.feito : p.estado === 'ruim' ? ped.ruim : ''}>
              {p.texto}
              <small>
                {p.quando ? dt(p.quando) : 'pendente'}
                {p.sub ? ` · ${p.sub}` : ''}
              </small>
            </li>
          ))}
        </ul>
      </div>

      {pedido.observacoes && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Observações</h3>
          <p className={ped.pre}>{pedido.observacoes}</p>
        </div>
      )}

      {/* ----------------------------------------------------------- eventos */}
      {eventos.length > 0 && (
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Eventos do webhook deste pedido</h3>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Evento</th>
                  <th>Cobrança</th>
                  <th>Erro</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td>{dt(e.recebido_em)}</td>
                    <td>{e.evento}</td>
                    <td className={ped.mudo}>{e.asaas_payment_id ?? '—'}</td>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
