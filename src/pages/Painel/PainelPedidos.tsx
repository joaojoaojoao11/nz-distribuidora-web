// /painel/pedidos — a lista, com "comprar de novo".
//
// "Últimas compras" não virou tela separada de propósito: seria esta mesma
// lista filtrada por faturado. O que o cliente quer de verdade quando olha uma
// compra antiga é REPETIR — então o botão está em cada linha, e ele repõe o
// carrinho com os mesmos itens e as mesmas quantidades.
//
// Os dados do item vêm da RPC `itens_do_meu_pedido`: `produtos` é uma tabela de
// admin, e o carrinho precisa de slug, nome e imagem. A RPC devolve só os itens
// de um pedido do próprio chamador e já marca o que saiu de linha.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { adicionarAoCarrinho, type UnidadeCarrinho } from '../../lib/shop/carrinho';
import { abrirPainelCarrinho } from '../../lib/shop/painelCarrinho';
import { BRL } from '../../lib/shop/precos';
import { PAGAMENTO_LABEL, STATUS_LABEL, tomDoPagamento, type PedidoResumo } from './pedidoRotulos';
import styles from './Painel.module.css';

interface ItemDoPedido {
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

  const carregar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero, status, pagamento_status, total_estimado, total_final, criado_em')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(100);
    setPedidos((data ?? []) as PedidoResumo[]);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    // Carga da lista.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const comprarDeNovo = async (numero: number) => {
    setAviso(null);
    setRepondo(numero);
    const { data, error } = await supabase.rpc('itens_do_meu_pedido', { p_numero: numero });
    setRepondo(null);
    const itens = (data ?? []) as ItemDoPedido[];
    if (error || itens.length === 0) {
      setAviso('Não consegui recuperar os itens deste pedido.');
      return;
    }
    const bons = itens.filter((i) => i.disponivel);
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
    const fora = itens.length - bons.length;
    if (fora > 0) {
      setAviso(`${fora} ${fora > 1 ? 'itens saíram' : 'item saiu'} de linha e ${fora > 1 ? 'ficaram' : 'ficou'} de fora.`);
    }
    abrirPainelCarrinho();
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
                    onClick={() => void comprarDeNovo(p.numero)}
                    disabled={repondo === p.numero}
                  >
                    {repondo === p.numero ? 'Repondo…' : 'Comprar de novo'}
                  </button>
                  <button type="button" className={styles.botaoSecundario} onClick={() => navigate(`/painel/pedido/${p.numero}`)}>
                    Ver pedido
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
