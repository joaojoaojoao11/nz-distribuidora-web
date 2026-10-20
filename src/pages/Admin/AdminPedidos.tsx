// Aba Pedidos do admin — só pedidos.
//
// Até 20/10/2026 esta rota empilhava cinco assuntos (fila do ERP, carrinhos
// parados, saúde do Asaas, configuração do checkout, eventos do webhook), e a
// lista em si mostrava um chip de pagamento ao lado do status cru do ERP.
// Agora:
//   · a lista é organizada por FILAS (lib/shop/situacaoPedido.ts): o que pede
//     um clique, o que está pago esperando separação, o que depende do
//     cliente, o que anda sozinho no NZERP, o que acabou, o que não deu certo;
//   · cada linha abre /admin/pedidos/:numero — itens, cliente, cobranças,
//     linha do tempo e os botões;
//   · configuração do checkout e Asaas foram para /admin/pagamentos; retirada
//     e frete grátis para /admin/logistica; carrinhos parados e cartões
//     recusados viraram sub-abas aqui, porque são "venda que não aconteceu".
//
// E o motivo de a lista ter ficado vazia de 07/09 a 20/10: o embed
// `user_profiles(...)` exigia uma FK que não existia (migration
// 2026-10-20_pedidos_fk_perfil.sql), o PostgREST errava e a tela escondia a
// mensagem no topo. Agora o erro de carga, se houver, aparece dentro da seção.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { chamarCheckout, textoDoErro, FORMA_LABEL, type Forma } from '../../lib/shop/checkout';
import { BRL } from '../../lib/shop/precos';
import { FILAS, contarFilas, situacaoDoPedido, type Fila, type PedidoSituacao } from '../../lib/shop/situacaoPedido';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Perfil {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

interface PedidoLinha extends PedidoSituacao {
  id: string;
  numero: number;
  total_final: number | null;
  total_estimado: number | null;
  cupom: string | null;
  criado_em: string;
  pago_em: string | null;
  user_profiles: Perfil | null;
}

interface PagamentoResumo {
  pedido_id: string;
  forma: Forma;
  status: string;
  parcelas: number;
  cartao_bandeira: string | null;
  cartao_final: string | null;
  expira_em: string | null;
  vencimento: string | null;
  criado_em: string;
}

/** Carrinho parado há N horas, sem pedido depois. O valor é somado no servidor
 *  a partir do preço do ERP — não é um número mandado pelo navegador. */
interface Abandonado {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  itens: number;
  valor_estimado: number | null;
  atualizado_em: string;
}

/** Cartão recusado: o pedido é apagado na recusa, então o rastro é este. */
interface Recusa {
  id: number;
  user_id: string | null;
  valor: number | null;
  motivo: string | null;
  criado_em: string;
  perfil: Perfil | null;
}

interface ContextoAdmin {
  recarregarBadges: () => Promise<void> | void;
}

type Aba = 'pedidos' | 'carrinhos' | 'recusados';
type FiltroFila = Fila | 'todos';

const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const nomeDo = (p: Perfil | null | undefined) => p?.company_name || p?.full_name || p?.email || '—';
const SELECT_PEDIDOS =
  'id, numero, status, pagamento_status, forma_pagamento, erp_envio, erp_envio_erro, erp_pago_em, erp_quote_number, total_final, total_estimado, cupom, criado_em, pago_em, user_profiles(full_name, company_name, email, phone)';

export default function AdminPedidos() {
  const navigate = useNavigate();
  const contexto = useOutletContext<ContextoAdmin | undefined>();
  const [pedidos, setPedidos] = useState<PedidoLinha[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoResumo[]>([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>('pedidos');
  // `null` = a fila ainda não foi escolhida: cai na primeira que tem alguma coisa.
  const [fila, setFila] = useState<FiltroFila | null>(null);
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [abandonados, setAbandonados] = useState<Abandonado[]>([]);
  const [horasAbandono, setHorasAbandono] = useState(24);
  const [recusas, setRecusas] = useState<Recusa[]>([]);

  const carregar = useCallback(async () => {
    const [p, g] = await Promise.all([
      supabase.from('pedidos').select(SELECT_PEDIDOS).order('criado_em', { ascending: false }).limit(300),
      supabase.from('pagamentos').select('pedido_id, forma, status, parcelas, cartao_bandeira, cartao_final, expira_em, vencimento, criado_em').order('criado_em', { ascending: false }).limit(600),
    ]);
    const err = p.error ?? g.error;
    setErro(err ? `A lista não carregou: ${err.message}` : '');
    setPedidos((p.data ?? []) as unknown as PedidoLinha[]);
    setPagamentos((g.data ?? []) as PagamentoResumo[]);
    setLoading(false);
  }, []);

  const carregarAbandonados = useCallback(async () => {
    const { data } = await supabase.rpc('carrinhos_abandonados', { p_horas: horasAbandono });
    setAbandonados((data ?? []) as Abandonado[]);
  }, [horasAbandono]);

  const carregarRecusas = useCallback(async () => {
    const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data } = await supabase
      .from('checkout_tentativas')
      .select('id, user_id, valor, motivo, criado_em')
      .eq('resultado', 'recusado')
      .gte('criado_em', desde)
      .order('criado_em', { ascending: false })
      .limit(50);
    const linhas = (data ?? []) as Omit<Recusa, 'perfil'>[];
    const ids = [...new Set(linhas.map((l) => l.user_id).filter(Boolean))] as string[];
    const { data: perfis } = ids.length ? await supabase.from('user_profiles').select('id, full_name, company_name, email, phone').in('id', ids) : { data: [] };
    const porId = new Map(((perfis ?? []) as (Perfil & { id: string })[]).map((x) => [x.id, x]));
    setRecusas(linhas.map((l) => ({ ...l, perfil: l.user_id ? porId.get(l.user_id) ?? null : null })));
  }, []);

  useEffect(() => {
    void carregar();
    void carregarRecusas();
  }, [carregar, carregarRecusas]);

  useEffect(() => {
    void carregarAbandonados();
  }, [carregarAbandonados]);

  // Cobrança atual de cada pedido (a mais recente): dá o prazo do Pix/boleto
  // para a situação e a forma/parcelas/bandeira para a coluna Pagamento.
  const pagAtual = useMemo(() => {
    const m = new Map<string, PagamentoResumo>();
    for (const g of pagamentos) if (!m.has(g.pedido_id)) m.set(g.pedido_id, g);
    return m;
  }, [pagamentos]);

  const linhas = useMemo(
    () =>
      pedidos.map((p) => {
        const g = pagAtual.get(p.id);
        const comPrazo: PedidoLinha = { ...p, expira_em: g?.expira_em ?? null, vencimento: g?.vencimento ?? null };
        return { pedido: comPrazo, pagamento: g ?? null, situacao: situacaoDoPedido(comPrazo) };
      }),
    [pedidos, pagAtual]
  );

  const contagens = useMemo(() => contarFilas(linhas.map((l) => l.pedido)), [linhas]);
  const filaAtiva: FiltroFila = fila ?? (contagens.acao > 0 ? 'acao' : contagens.novos > 0 ? 'novos' : 'todos');

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter(({ pedido, situacao }) => {
      if (filaAtiva !== 'todos' && situacao.fila !== filaAtiva) return false;
      if (!termo) return true;
      const u = pedido.user_profiles;
      return [String(pedido.numero), u?.full_name, u?.company_name, u?.email, u?.phone, pedido.erp_quote_number ? String(pedido.erp_quote_number) : '', situacao.rotulo]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(termo));
    });
  }, [linhas, filaAtiva, busca]);

  const enviarErp = async (numero: number) => {
    setOcupado(numero);
    setMsg('');
    try {
      const r = await chamarCheckout<{ estado: string; erpQuoteNumber?: number | null; pagamentoConfirmado?: boolean }>({ op: 'enviar-erp', numero });
      setMsg(r.estado === 'enviado' ? `Pedido #${numero} virou o orçamento ${r.erpQuoteNumber ?? ''} no NZERP.` : r.pagamentoConfirmado ? `NZERP avisado do pagamento do pedido #${numero}.` : `Pedido #${numero} já estava no NZERP.`);
      await carregar();
      await contexto?.recarregarBadges();
    } catch (e) {
      setMsg(`Pedido #${numero}: ${textoDoErro(e)}`);
    } finally {
      setOcupado(null);
    }
  };

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando pedidos…</p>;

  const descricaoFila = filaAtiva === 'todos' ? 'Todos os pedidos, do mais novo ao mais antigo.' : FILAS.find((f) => f.id === filaAtiva)?.descricao;

  return (
    <div>
      <p className={styles.tabDescription}>
        Pedidos feitos no site, pagos online (Asaas) ou enviados como orçamento. Configuração de Pix, boleto e cartão em{' '}
        <Link to="/admin/pagamentos" style={{ color: '#fff' }}>Pagamento online</Link>; retirada e frete grátis em{' '}
        <Link to="/admin/logistica" style={{ color: '#fff' }}>Logística</Link>.
      </p>

      <div className={styles.periodFilters} style={{ marginBottom: '1.25rem' }}>
        {(
          [
            ['pedidos', `Pedidos (${pedidos.length})`],
            ['carrinhos', `Carrinhos parados (${abandonados.length})`],
            ['recusados', `Cartões recusados (${recusas.length})`],
          ] as [Aba, string][]
        ).map(([id, rotulo]) => (
          <button key={id} type="button" className={`${styles.periodBtn} ${aba === id ? styles.periodBtnActive : ''}`} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {msg && <p className={ped.msg}>{msg}</p>}

      {/* ------------------------------------------------------- pedidos */}
      {aba === 'pedidos' && (
        <div className={styles.tableSection}>
          {erro && <p className={ped.aviso}>{erro}</p>}

          <div className={ped.filas}>
            {FILAS.map((f) => (
              <button key={f.id} type="button" className={`${ped.fila} ${filaAtiva === f.id ? ped.filaAtiva : ''}`} onClick={() => setFila(f.id)} title={f.descricao}>
                {f.rotulo}
                <span className={`${ped.contagem} ${f.id === 'acao' && contagens.acao > 0 && filaAtiva !== 'acao' ? ped.contagemAlerta : ''}`}>{contagens[f.id]}</span>
              </button>
            ))}
            <button type="button" className={`${ped.fila} ${filaAtiva === 'todos' ? ped.filaAtiva : ''}`} onClick={() => setFila('todos')}>
              Todos<span className={ped.contagem}>{pedidos.length}</span>
            </button>
          </div>
          <p className={ped.filaDescricao}>{descricaoFila}</p>

          <div className={ped.barra}>
            <input className={ped.busca} placeholder="Buscar por nº, cliente, e-mail, telefone ou nº do orçamento" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <span className={ped.mudo}>
              {visiveis.length} de {pedidos.length}
            </span>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Quando</th>
                  <th>Situação</th>
                  <th>Pagamento</th>
                  <th>NZERP</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map(({ pedido: p, pagamento: g, situacao: s }) => (
                  <tr key={p.id} className={ped.linha} onClick={() => navigate(`/admin/pedidos/${p.numero}`)}>
                    <td>#{p.numero}</td>
                    <td>
                      {nomeDo(p.user_profiles)}
                      <br />
                      <small className={ped.mudo}>{p.user_profiles?.email ?? ''}</small>
                    </td>
                    <td>{dt(p.criado_em)}</td>
                    <td>
                      <span className={`${ped.chip} ${ped[s.tom]}`}>{s.rotulo}</span>
                      {s.detalhe && <span className={ped.detalhe}>{s.detalhe}</span>}
                    </td>
                    <td>
                      {p.forma_pagamento ? (
                        <>
                          {FORMA_LABEL[p.forma_pagamento as Forma] ?? p.forma_pagamento}
                          {g && g.parcelas > 1 ? ` ${g.parcelas}x` : ''}
                          {g?.cartao_bandeira ? (
                            <>
                              <br />
                              <small className={ped.mudo}>
                                {g.cartao_bandeira} {g.cartao_final}
                              </small>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <span className={ped.mudo}>orçamento</span>
                      )}
                    </td>
                    <td>
                      {p.erp_quote_number ? (
                        <>
                          nº {p.erp_quote_number}
                          <br />
                          <small className={ped.mudo}>{p.status}</small>
                        </>
                      ) : (
                        <span className={ped.mudo}>—</span>
                      )}
                    </td>
                    <td>{p.total_final != null ? BRL.format(Number(p.total_final)) : p.total_estimado != null ? `~${BRL.format(Number(p.total_estimado))}` : '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {s.acao === 'enviar-erp' && (
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} disabled={ocupado === p.numero} onClick={() => void enviarErp(p.numero)}>
                          {ocupado === p.numero ? 'Enviando…' : 'Enviar ao NZERP'}
                        </button>
                      )}
                      <Link to={`/admin/pedidos/${p.numero}`} className={styles.actionBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
                        abrir
                      </Link>
                    </td>
                  </tr>
                ))}
                {visiveis.length === 0 && (
                  <tr>
                    <td colSpan={8} className={ped.mudo}>
                      {pedidos.length === 0 ? 'Nenhum pedido ainda.' : busca ? 'Nada com esse termo nesta fila.' : 'Nenhum pedido nesta fila.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------- carrinhos parados */}
      {aba === 'carrinhos' && (
        <div className={styles.tableSection}>
          <p className={styles.tabDescription}>
            Cliente que montou carrinho e não fechou pedido depois. O valor é somado no servidor com o preço do ERP.
            Existe desde 10/09/2026, quando o carrinho deixou de viver só no navegador.
          </p>
          <div className={styles.createField} style={{ maxWidth: 260 }}>
            <label>Parado há mais de (horas)</label>
            <input type="number" min={0} value={horasAbandono} onChange={(e) => setHorasAbandono(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          {abandonados.length === 0 ? (
            <p className={ped.mudo}>Nenhum carrinho parado nesse intervalo.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contato</th>
                    <th>Itens</th>
                    <th>Valor estimado</th>
                    <th>Parado desde</th>
                  </tr>
                </thead>
                <tbody>
                  {abandonados.map((a) => (
                    <tr key={a.user_id}>
                      <td>{a.nome ?? '—'}</td>
                      <td>
                        {a.email ?? '—'}
                        {a.telefone ? (
                          <>
                            <br />
                            {a.telefone}
                          </>
                        ) : null}
                      </td>
                      <td>{a.itens}</td>
                      <td>{BRL.format(Number(a.valor_estimado ?? 0))}</td>
                      <td>{dt(a.atualizado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------- cartões recusados */}
      {aba === 'recusados' && (
        <div className={styles.tableSection}>
          <p className={styles.tabDescription}>
            Últimos 7 dias. Cartão recusado apaga o pedido (o cliente tenta de novo no checkout), mas quem tentou e
            não conseguiu fica aqui — vale ligar e oferecer Pix ou boleto.
          </p>
          {recusas.length === 0 ? (
            <p className={ped.mudo}>Nenhuma recusa nos últimos 7 dias.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Cliente</th>
                    <th>Contato</th>
                    <th>Valor</th>
                    <th>Motivo (Asaas)</th>
                  </tr>
                </thead>
                <tbody>
                  {recusas.map((r) => (
                    <tr key={r.id}>
                      <td>{dt(r.criado_em)}</td>
                      <td>{nomeDo(r.perfil)}</td>
                      <td>
                        {r.perfil?.email ?? '—'}
                        {r.perfil?.phone ? (
                          <>
                            <br />
                            {r.perfil.phone}
                          </>
                        ) : null}
                      </td>
                      <td>{r.valor != null ? BRL.format(Number(r.valor)) : '—'}</td>
                      <td className={ped.mudo}>{r.motivo ?? 'sem detalhe (recusa anterior a 20/10)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
