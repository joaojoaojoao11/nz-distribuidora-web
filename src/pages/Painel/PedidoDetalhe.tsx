// /painel/pedido/:numero — acompanhamento do pedido e do pagamento.
//
// É para onde o checkout leva e para onde o cliente volta pelo painel ou pelo
// e-mail. Enquanto o pagamento está aguardando, a página consulta o servidor a
// cada 5 s (op status) e troca sozinha para "pago" — sem recarregar. O polling
// para quando o pagamento chega a um estado final ou depois de 40 min.
//
// Pix no celular: ninguém escaneia a própria tela, então o botão "Copiar
// código" vem primeiro e o QR fica menor. No desktop, o QR grande e o código
// ao lado.

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BRL } from '../../lib/shop/precos';
import {
  cartaoParaEnvio,
  chamarCheckout,
  copiar,
  textoDoErro,
  FORMA_LABEL,
  STATUS_PAGAMENTO_LABEL,
  CARTAO_VAZIO,
  errosDoCartao,
  type PagamentoPublico,
  type PedidoStatus,
  type Resumo,
} from '../../lib/shop/checkout';
import FormaPagamento, { type EscolhaPagamento } from '../Loja/FormaPagamento';
import styles from './PedidoDetalhe.module.css';

const STATUS_PEDIDO: Record<string, string> = {
  RASCUNHO: 'Registrado',
  ABERTO: 'Recebido pela NZ',
  AGUARDANDO: 'Aguardando',
  APROVADO: 'Aprovado — em separação',
  FATURADO: 'Faturado',
  FATURADO_PARCIAL: 'Faturado parcialmente',
  PREPARANDO_ENVIO: 'Preparando envio',
  PRONTO_ENVIO: 'Pronto para envio',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  NAO_ENTREGUE: 'Não entregue',
  DADOS_INCOMPLETOS: 'Dados incompletos',
  NAO_APROVADO: 'Não aprovado',
  CANCELADO: 'Cancelado',
};

const POLL_MS = 5000;
const POLL_MAX_MS = 40 * 60_000;
const ABERTOS = new Set(['aguardando', 'em_analise']);
const REABRIVEIS = new Set(['expirado', 'recusado', 'vencido', 'cancelado']);

export default function PedidoDetalhe() {
  const { numero } = useParams();
  const { user, loading } = useAuth();
  const location = useLocation();
  const recemCriado = Boolean((location.state as { recemCriado?: boolean } | null)?.recemCriado);

  const [dados, setDados] = useState<PedidoStatus | null>(null);
  const [erro, setErro] = useState('');
  const [agora, setAgora] = useState(() => Date.now());
  const [inicio] = useState(() => Date.now());

  const carregar = useCallback(async () => {
    try {
      const r = await chamarCheckout<PedidoStatus>({ op: 'status', numero: Number(numero) });
      setDados(r);
      setErro('');
    } catch (e) {
      setErro(textoDoErro(e));
    }
  }, [numero]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [user, carregar]);

  // Polling enquanto está aguardando.
  const statusPag = dados?.pagamento?.status ?? dados?.pedido.pagamentoStatus ?? null;
  useEffect(() => {
    if (!statusPag || !ABERTOS.has(statusPag)) return;
    if (Date.now() - inicio > POLL_MAX_MS) return;
    const t = setInterval(() => void carregar(), POLL_MS);
    return () => clearInterval(t);
  }, [statusPag, carregar, inicio]);

  // Relógio do contador de expiração do Pix.
  useEffect(() => {
    if (statusPag !== 'aguardando' || dados?.pagamento?.forma !== 'PIX') return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [statusPag, dados?.pagamento?.forma]);

  if (loading) return null;
  if (!user) return <Navigate to={`/login?next=/painel/pedido/${numero ?? ''}`} replace />;

  if (erro && !dados) {
    return (
      <div className={`container ${styles.pagina}`}>
        <p className={styles.erro}>{erro}</p>
        <Link to="/painel">Voltar ao painel</Link>
      </div>
    );
  }
  if (!dados) {
    return (
      <div className={`container ${styles.pagina}`}>
        <p className={styles.mudo}>Carregando pedido…</p>
      </div>
    );
  }

  const { pedido, pagamento } = dados;
  const pago = pedido.pagamentoStatus === 'pago' || pagamento?.status === 'pago';

  return (
    <div className={`container ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div>
          <Link to="/painel" className={styles.voltar}>
            ← Minha conta
          </Link>
          <h1 className={styles.titulo}>Pedido #{pedido.numero}</h1>
          <p className={styles.mudo}>
            {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
            {pedido.erpQuoteNumber ? ` · nº ${pedido.erpQuoteNumber} no NZERP` : ''}
          </p>
        </div>
        <div className={styles.chips}>
          <span className={`${styles.chip} ${pago ? styles.chipOk : ABERTOS.has(pedido.pagamentoStatus) ? styles.chipPendente : styles.chipRuim}`}>
            {STATUS_PAGAMENTO_LABEL[pedido.pagamentoStatus] ?? pedido.pagamentoStatus}
          </span>
          <span className={styles.chip}>{STATUS_PEDIDO[pedido.status] ?? pedido.status}</span>
        </div>
      </header>

      {recemCriado && pagamento?.status === 'aguardando' && pagamento.forma !== 'CREDIT_CARD' && (
        <p className={styles.aviso}>Pedido registrado. Falta só o pagamento — os dados estão abaixo.</p>
      )}

      {/* ------------------------------------------------------ pagamento */}
      {pagamento && <BlocoPagamento p={pagamento} agora={agora} />}

      {pagamento && REABRIVEIS.has(pagamento.status) && <NovoPagamento numero={pedido.numero} total={pedido.total ?? 0} onFeito={carregar} />}

      {!pagamento && pedido.pagamentoStatus === 'nenhum' && (
        <section className={styles.bloco}>
          <p className={styles.mudo}>Este pedido foi enviado como orçamento: o vendedor confirma estoque, frete e condição e fecha com você.</p>
        </section>
      )}

      {/* --------------------------------------------------------- itens */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Itens</h2>
        <ul className={styles.itens}>
          {pedido.itens.map((i, idx) => (
            <li key={idx}>
              <span className={styles.thumb} aria-hidden="true">
                {i.imagem ? <img src={i.imagem} alt="" loading="lazy" /> : <span style={{ background: i.hex ?? '#222' }} />}
              </span>
              <span className={styles.itemNome}>
                {i.slug ? <Link to={`/loja/${i.slug}`}>{i.nome}</Link> : i.nome}
                <small>
                  {i.qtd} {i.unidade === 'rolo' ? (i.qtd === 1 ? 'rolo fechado' : 'rolos fechados') : 'm'}
                  {i.unit != null ? ` · ${BRL.format(i.unit)} / ${i.unidade === 'rolo' ? 'rolo' : 'm'}` : ''}
                </small>
              </span>
              <span className={styles.itemTotal}>{i.unit != null ? BRL.format(i.unit * i.qtd) : ''}</span>
            </li>
          ))}
        </ul>
        <div className={styles.totais}>
          {pedido.desconto > 0 && (
            <div>
              <span>Cupom {pedido.cupom ?? ''}</span>
              <strong>− {BRL.format(pedido.desconto)}</strong>
            </div>
          )}
          {pedido.frete && (
            <div>
              <span>{pedido.frete.retirada ? 'Retirada em São Paulo' : `Entrega · ${pedido.frete.nome ?? ''}${pedido.frete.dias ? ` · ${pedido.frete.dias} dias úteis` : ''}`}</span>
              <strong>{pedido.valorFrete === 0 ? 'grátis' : BRL.format(pedido.valorFrete)}</strong>
            </div>
          )}
          <div className={styles.totalFinal}>
            <span>Total</span>
            <strong>{pedido.total != null ? BRL.format(pedido.total) : '—'}</strong>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ endereço */}
      {pedido.endereco && !pedido.frete?.retirada && (
        <section className={styles.bloco}>
          <h2 className={styles.subtitulo}>Entrega em</h2>
          <p className={styles.endereco}>
            {pedido.endereco.rua}, {pedido.endereco.numero ?? 's/n'}
            {pedido.endereco.complemento ? ` — ${pedido.endereco.complemento}` : ''}
            <br />
            {pedido.endereco.bairro ? `${pedido.endereco.bairro}, ` : ''}
            {pedido.endereco.cidade}/{pedido.endereco.uf} · CEP {pedido.endereco.cep}
          </p>
        </section>
      )}
    </div>
  );
}

// ================================================================ pagamento

function BlocoPagamento({ p, agora }: { p: PagamentoPublico; agora: number }) {
  const [copiado, setCopiado] = useState(false);
  const copiarTexto = async (t: string) => {
    if (await copiar(t)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };
  const restante = p.expiraEm ? Math.max(0, Math.floor((new Date(p.expiraEm).getTime() - agora) / 1000)) : null;
  const mmss = restante != null ? `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}` : null;

  if (p.status === 'pago') {
    return (
      <section className={`${styles.bloco} ${styles.blocoOk}`}>
        <h2 className={styles.subtitulo}>Pagamento confirmado ✓</h2>
        <p>
          {FORMA_LABEL[p.forma]}
          {p.cartao?.bandeira ? ` ${p.cartao.bandeira} final ${p.cartao.final}` : ''}
          {p.parcelas > 1 ? ` em ${p.parcelas}x` : ''} · {BRL.format(p.valor)}
          {p.pagoEm ? ` · ${new Date(p.pagoEm).toLocaleString('pt-BR')}` : ''}
        </p>
        <p className={styles.mudo}>Seu pedido entrou na fila de separação. Você acompanha o andamento aqui e recebe os avisos por e-mail.</p>
        {p.reciboUrl && (
          <a className={styles.link} href={p.reciboUrl} target="_blank" rel="noreferrer">
            Ver comprovante
          </a>
        )}
      </section>
    );
  }

  if (p.status === 'em_analise') {
    return (
      <section className={`${styles.bloco} ${styles.blocoPendente}`}>
        <h2 className={styles.subtitulo}>Pagamento em análise</h2>
        <p className={styles.mudo}>O cartão foi aceito e está em análise de segurança. Costuma levar minutos; avisamos por e-mail assim que aprovar.</p>
      </section>
    );
  }

  if (p.status !== 'aguardando') {
    return (
      <section className={`${styles.bloco} ${styles.blocoRuim}`}>
        <h2 className={styles.subtitulo}>{STATUS_PAGAMENTO_LABEL[p.status]}</h2>
        <p className={styles.mudo}>
          {p.status === 'expirado' && 'O código Pix passou do prazo. Gere um novo abaixo ou pague de outra forma.'}
          {p.status === 'recusado' && 'O cartão foi recusado pelo emissor. Tente outro cartão ou pague com Pix.'}
          {p.status === 'vencido' && 'O boleto venceu. Gere um novo abaixo ou pague com Pix.'}
          {p.status === 'cancelado' && 'Este pagamento foi cancelado. Você pode gerar outro abaixo.'}
          {p.status === 'estornado' && `Valor estornado: ${BRL.format(p.estornadoValor || p.valor)}.`}
        </p>
      </section>
    );
  }

  // ------------------------------------------------------- aguardando
  if (p.forma === 'PIX') {
    return (
      <section className={`${styles.bloco} ${styles.blocoPendente}`}>
        <h2 className={styles.subtitulo}>Pague com Pix</h2>
        <div className={styles.pix}>
          <div className={styles.pixAcoes}>
            <p className={styles.pixValor}>{BRL.format(p.valor)}</p>
            {mmss && <p className={styles.mudo}>Código válido por {mmss}</p>}
            {p.pix?.payload ? (
              <>
                <button type="button" className={styles.botao} onClick={() => void copiarTexto(p.pix!.payload)}>
                  {copiado ? 'Código copiado ✓' : 'Copiar código Pix'}
                </button>
                <p className={styles.mudoPequeno}>Abra o app do seu banco, escolha Pix → "Pix copia e cola" e cole o código. A confirmação aparece aqui sozinha.</p>
                <details className={styles.detalhes}>
                  <summary>Ver o código</summary>
                  <code className={styles.codigo}>{p.pix.payload}</code>
                </details>
              </>
            ) : (
              <p className={styles.mudo}>Gerando o código Pix…</p>
            )}
          </div>
          {p.pix?.qrBase64 && (
            <div className={styles.pixQr}>
              <img src={`data:image/png;base64,${p.pix.qrBase64}`} alt="QR Code Pix" width={220} height={220} />
              <small>Ou aponte a câmera do app do banco</small>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (p.forma === 'BOLETO') {
    return (
      <section className={`${styles.bloco} ${styles.blocoPendente}`}>
        <h2 className={styles.subtitulo}>Pague o boleto</h2>
        <p className={styles.pixValor}>{BRL.format(p.valor)}</p>
        {p.vencimento && <p className={styles.mudo}>Vencimento: {new Date(`${p.vencimento}T12:00:00-03:00`).toLocaleDateString('pt-BR')}</p>}
        {p.boleto?.linhaDigitavel && (
          <>
            <code className={styles.codigo}>{p.boleto.linhaDigitavel}</code>
            <div className={styles.linhaBotoes}>
              <button type="button" className={styles.botao} onClick={() => void copiarTexto(p.boleto!.linhaDigitavel!)}>
                {copiado ? 'Copiado ✓' : 'Copiar linha digitável'}
              </button>
              {p.boleto.url && (
                <a className={styles.botaoSecundario} href={p.boleto.url} target="_blank" rel="noreferrer">
                  Abrir boleto (PDF)
                </a>
              )}
            </div>
          </>
        )}
        <p className={styles.mudoPequeno}>O boleto também vai por e-mail. Depois de pago, o banco leva até 3 dias úteis para compensar; o pedido é separado em seguida.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.bloco} ${styles.blocoPendente}`}>
      <h2 className={styles.subtitulo}>Processando o cartão…</h2>
      <p className={styles.mudo}>Aguarde alguns segundos.</p>
    </section>
  );
}

// ============================================================ novo pagamento

function NovoPagamento({ numero, total, onFeito }: { numero: number; total: number; onFeito: () => Promise<void> }) {
  const [aberto, setAberto] = useState(false);
  const [pag, setPag] = useState<EscolhaPagamento>({ forma: 'PIX', parcelas: 1, cartao: CARTAO_VAZIO });
  const [cfg, setCfg] = useState<Resumo['config'] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto || cfg) return;
    // Config (parcelas, prazos) vem do resumo; sem itens não dá para chamar
    // "resumo", então usa padrões e o servidor valida ao criar.
    setCfg({ pixExpiraMin: 30, boletoVencimentoDias: 3, boletoMinimo: 0, cartaoMaxParcelas: 6, cartaoParcelaMinima: 100, retiradaEndereco: '', pedidoMinimo: 0, freteGratisAcima: null });
  }, [aberto, cfg]);

  const parcelas = (() => {
    const lista: { n: number; valor: number }[] = [];
    const max = cfg?.cartaoMaxParcelas ?? 6;
    const min = cfg?.cartaoParcelaMinima ?? 100;
    for (let n = 1; n <= max; n++) {
      const v = Math.round((total / n) * 100) / 100;
      if (n > 1 && v < min) break;
      lista.push({ n, valor: v });
    }
    return lista;
  })();

  const cartaoOk = pag.forma !== 'CREDIT_CARD' || Object.keys(errosDoCartao(pag.cartao)).length === 0;

  const gerar = async () => {
    setErro('');
    setEnviando(true);
    try {
      await chamarCheckout({
        op: 'novo-pagamento',
        numero,
        forma: pag.forma,
        parcelas: pag.forma === 'CREDIT_CARD' ? pag.parcelas : 1,
        cartao: pag.forma === 'CREDIT_CARD' ? cartaoParaEnvio(pag.cartao) : undefined,
      });
      setAberto(false);
      setPag({ forma: 'PIX', parcelas: 1, cartao: CARTAO_VAZIO });
      await onFeito();
    } catch (e) {
      setErro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={styles.bloco}>
      {!aberto ? (
        <button type="button" className={styles.botao} onClick={() => setAberto(true)}>
          Pagar de novo · {BRL.format(total)}
        </button>
      ) : (
        <>
          <h2 className={styles.subtitulo}>Novo pagamento · {BRL.format(total)}</h2>
          <FormaPagamento
            valor={pag}
            onChange={setPag}
            parcelas={parcelas}
            total={total}
            pixExpiraMin={cfg?.pixExpiraMin ?? 30}
            boletoVencimentoDias={cfg?.boletoVencimentoDias ?? 3}
            boletoMinimo={cfg?.boletoMinimo ?? 0}
            desabilitado={enviando}
          />
          {erro && <p className={styles.erro}>{erro}</p>}
          <div className={styles.linhaBotoes}>
            <button type="button" className={styles.botao} onClick={gerar} disabled={enviando || !cartaoOk}>
              {enviando ? 'Processando…' : pag.forma === 'PIX' ? 'Gerar Pix' : pag.forma === 'BOLETO' ? 'Gerar boleto' : 'Pagar com cartão'}
            </button>
            <button type="button" className={styles.botaoSecundario} onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
