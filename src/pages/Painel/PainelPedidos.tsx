// /painel/pedidos — a lista, com "comprar de novo".
//
// "Últimas compras" não virou tela separada de propósito: seria esta mesma
// lista filtrada por faturado. O que o cliente quer de verdade quando olha uma
// compra antiga é REPETIR — então o botão está em cada linha, e ele repõe o
// carrinho com os mesmos itens e as mesmas quantidades.
//
// Os itens vêm da RPC `itens_dos_meus_pedidos`, com os números de TODOS os
// pedidos da tela de uma vez — uma chamada, não uma por pedido. `produtos` é
// tabela de admin, então o cliente não pode ler dela direto; a RPC devolve só o
// que é dele e já marca o que saiu de linha.
//
// As miniaturas existem para reconhecer o pedido sem abrir: quem comprou três
// vezes no mês não distingue "#5, #6, #7" por número nenhum.
//
// Cancelar: só aparece enquanto o pedido não foi pago nem entrou na operação.
// Quem decide de verdade é o servidor (e, no fim, o ERP) — o botão aqui só
// evita oferecer o que seria recusado.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { adicionarAoCarrinho, type UnidadeCarrinho } from '../../lib/shop/carrinho';
import { abrirPainelCarrinho } from '../../lib/shop/painelCarrinho';
import { chamarCheckout, textoDoErro } from '../../lib/shop/checkout';
import { BRL } from '../../lib/shop/precos';
import { PAGAMENTO_LABEL, STATUS_LABEL, podeCancelar, tomDoPagamento, type PedidoResumo } from './pedidoRotulos';
import styles from './Painel.module.css';

interface ItemDoPedido {
  pedido_numero: number;
  slug: string;
  nome: string;
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
  qtd: number;
  unidade: string;
  disponivel: boolean;
}

export default function PainelPedidos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [repondo, setRepondo] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [itens, setItens] = useState<Map<number, ItemDoPedido[]>>(new Map());
  const [cancelando, setCancelando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero, status, pagamento_status, total_estimado, total_final, criado_em')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(100);
    const lista = (data ?? []) as PedidoResumo[];
    setPedidos(lista);
    setCarregando(false);

    if (lista.length) {
      const { data: linhas } = await supabase.rpc('itens_dos_meus_pedidos', { p_numeros: lista.map((p) => p.numero) });
      const mapa = new Map<number, ItemDoPedido[]>();
      for (const l of (linhas ?? []) as ItemDoPedido[]) {
        const atual = mapa.get(l.pedido_numero);
        if (atual) atual.push(l);
        else mapa.set(l.pedido_numero, [l]);
      }
      setItens(mapa);
    }
  }, [user]);

  useEffect(() => {
    // Carga da lista.
    void carregar();
  }, [carregar]);

  const comprarDeNovo = (numero: number) => {
    setAviso(null);
    setRepondo(numero);
    // Os itens já estão em mãos: a lista os carregou para desenhar as fotos.
    const doPedido = itens.get(numero) ?? [];
    setRepondo(null);
    if (doPedido.length === 0) {
      setAviso('Não consegui recuperar os itens deste pedido.');
      return;
    }
    const bons = doPedido.filter((i) => i.disponivel);
    if (bons.length === 0) {
      setAviso('Nenhum item deste pedido está disponível na loja hoje.');
      return;
    }
    for (const i of bons) {
      adicionarAoCarrinho({
        slug: i.slug,
        nome: i.nome,
        codigo: i.codigo,
        imagem: i.imagem,
        hex: i.hex,
        unidade: (i.unidade === 'rolo' ? 'rolo' : 'metro') as UnidadeCarrinho,
        qtd: Number(i.qtd),
      });
    }
    const fora = doPedido.length - bons.length;
    if (fora > 0) {
      setAviso(`${fora} ${fora > 1 ? 'itens saíram' : 'item saiu'} de linha e ${fora > 1 ? 'ficaram' : 'ficou'} de fora.`);
    }
    abrirPainelCarrinho();
  };

  const cancelar = async (numero: number) => {
    if (!window.confirm(`Cancelar o pedido #${numero}? Se houver cobrança em aberto, ela também é cancelada.`)) return;
    setAviso(null);
    setCancelando(numero);
    try {
      await chamarCheckout({ op: 'cancelar', numero, pedidoTambem: true });
      await carregar();
      setAviso(`Pedido #${numero} cancelado.`);
    } catch (e) {
      const msg = textoDoErro(e);
      setAviso(
        msg.includes('fase-avancada')
          ? 'Este pedido já entrou em separação — fale com o vendedor para cancelar.'
          : msg.includes('ja-pago')
            ? 'Este pedido já consta pago. Para devolução, fale com a NZ.'
            : msg
      );
    } finally {
      setCancelando(null);
    }
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;

  if (pedidos.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Você ainda não fez nenhum pedido pelo site. Os pedidos feitos aqui aparecem com o mesmo status
          que o vendedor enxerga.
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <>
      {aviso && <p className={styles.aviso}>{aviso}</p>}
      <ul className={styles.cartoes}>
        {pedidos.map((p) => {
          const tom = tomDoPagamento(p.pagamento_status);
          return (
            <li key={p.id} className={styles.cartaoPedido}>
              <div className={styles.cartaoTopo}>
                <Link to={`/painel/pedido/${p.numero}`} className={styles.cartaoNumero}>
                  Pedido #{p.numero}
                </Link>
                <span className={styles.cartaoData}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className={styles.cartaoStatus}>
                {tom && (
                  <span
                    className={`${styles.pagChip} ${tom === 'ok' ? styles.pagOk : tom === 'pendente' ? styles.pagPendente : styles.pagRuim}`}
                  >
                    {PAGAMENTO_LABEL[p.pagamento_status!] ?? p.pagamento_status}
                  </span>
                )}
                <span>{STATUS_LABEL[p.status] ?? p.status}</span>
              </div>

              {(() => {
                const doPedido = itens.get(p.numero) ?? [];
                if (!doPedido.length) return null;
                const mostra = doPedido.slice(0, 5);
                return (
                  <div className={styles.miniaturas}>
                    {mostra.map((i) => (
                      <span key={`${i.slug}|${i.unidade}`} className={styles.mini} title={i.nome}>
                        {i.imagem ? (
                          <img src={i.imagem} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.miniCor} style={{ background: i.hex ?? '#222' }} />
                        )}
                      </span>
                    ))}
                    <span className={styles.miniTexto}>
                      {doPedido[0].nome}
                      {doPedido.length > 1 ? ` e mais ${doPedido.length - 1}` : ''}
                    </span>
                  </div>
                );
              })()}

              <div className={styles.cartaoRodape}>
                <span className={styles.cartaoTotal}>
                  {p.total_final != null
                    ? BRL.format(Number(p.total_final))
                    : p.total_estimado != null
                      ? BRL.format(Number(p.total_estimado))
                      : '—'}
                </span>
                <div className={styles.cartaoAcoes}>
                  <button
                    type="button"
                    className={styles.botaoSecundario}
                    onClick={() => comprarDeNovo(p.numero)}
                    disabled={repondo === p.numero}
                  >
                    {repondo === p.numero ? 'Repondo…' : 'Comprar de novo'}
                  </button>
                  <button type="button" className={styles.botaoSecundario} onClick={() => navigate(`/painel/pedido/${p.numero}`)}>
                    Ver pedido
                  </button>
                  {podeCancelar(p) && (
                    <button
                      type="button"
                      className={styles.botaoPerigo}
                      onClick={() => void cancelar(p.numero)}
                      disabled={cancelando === p.numero}
                    >
                      {cancelando === p.numero ? 'Cancelando…' : 'Cancelar'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
