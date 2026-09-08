// Preço na loja — o que aparece depende do papel, decidido no servidor.
//
// Este componente só desenha o que /api/nz/precos devolveu (src/lib/shop/precos.ts):
//   anônimo             → "Entre para ver o preço" (link para login com retorno)
//   aguardando aprovação→ "Cadastro em análise"
//   cliente / lojista   → rolo fechado + metro linear, a preço de ATACADO
//   admin               → também a tabela de varejo, em cinza
// Se o servidor não mandou o item (SKU sem preço, produto sem conexão), some.
//
// A parte de COMPRAR (unidade, quantidade, subtotal, botão) mora em
// `Comprar.tsx`: aqui é só a tabela de preço.

import { Link, useLocation } from 'react-router-dom';
import { BRL, usePreco } from '../../lib/shop/precos';
import { whatsappDaSelecao } from '../../lib/shop/selecoes';
import Comprar, { type ProdutoDoCarrinho } from './Comprar';
import styles from './Preco.module.css';

interface Props {
  slug: string;
  /** `card` = uma linha compacta; `pagina` = bloco completo com unidades. */
  variante: 'card' | 'pagina';
  /** Só na página: o que o carrinho guarda para mostrar o item. */
  produto?: ProdutoDoCarrinho;
  /**
   * Token da seleção que liberou este preço. Muda duas coisas: o preço vem do
   * contexto daquela seleção (com o acréscimo já aplicado pelo servidor) e a
   * compra sai do carrinho e vai para o WhatsApp — ver `viaSelecao` abaixo.
   */
  selecao?: string;
}

export default function Preco({ slug, variante, produto, selecao }: Props) {
  const { estado, papel, item } = usePreco(slug, selecao);
  const location = useLocation();
  const next = encodeURIComponent(`${location.pathname}${location.search}`);

  // Um produto que não está na seleção (um "relacionado", por exemplo) não tem
  // preço para quem entrou só pelo link. Sem esta linha o bloco sumiria
  // inteiro, e a página ficaria sem explicar por que aquele produto não mostra
  // valor enquanto o vizinho mostra.
  const foraDaSelecao = Boolean(item?.foraDaSelecao) && papel === 'anonimo';

  if (estado === 'anonimo' || foraDaSelecao) {
    return variante === 'card' ? (
      <span className={`${styles.card} ${styles.mudo}`}>Entre para ver o preço</span>
    ) : (
      <div className={styles.bloco}>
        <Link to={`/login?next=${next}`} className={styles.entrar} onClick={(e) => e.stopPropagation()}>
          Entre para ver o preço
        </Link>
        <p className={styles.nota}>Cliente final e lojista cadastrados veem preço de rolo fechado e de metro.</p>
      </div>
    );
  }

  if (estado === 'aguardando-aprovacao') {
    return variante === 'card' ? (
      <span className={`${styles.card} ${styles.mudo}`}>Cadastro em análise</span>
    ) : (
      <div className={styles.bloco}>
        <span className={styles.analise}>Cadastro em análise</span>
        <p className={styles.nota}>Assim que a NZ aprovar seu cadastro, os preços aparecem aqui.</p>
      </div>
    );
  }

  if (estado !== 'ok' || !item || !item.disponivel) return null;

  const rolo = item.rolo != null ? BRL.format(Number(item.rolo)) : null;
  const metro = item.metro != null ? BRL.format(Number(item.metro)) : null;

  if (variante === 'card') {
    return (
      <span className={styles.card}>
        {rolo && <strong>{rolo}</strong>}
        {rolo && metro && <span className={styles.sep}>·</span>}
        {metro && <span>{metro}/m</span>}
      </span>
    );
  }

  // Dentro de uma seleção o preço é negociado, não é a tabela do site: quem
  // fecha é o vendedor. Deixar "Adicionar ao carrinho" aqui faria o cliente ver
  // um valor no card e outro no checkout — o carrinho cobra sempre a tabela
  // (decisão do João: "esse manejo de preço é algo manual ali na hora").
  const viaSelecao = Boolean(item.viaSelecao);

  // Com as duas unidades, quem mostra o preço é o seletor de `Comprar` — repetir
  // a tabela em cima dele só faria o mesmo número aparecer duas vezes na tela.
  const mostrarTabela = !produto || viaSelecao || !(rolo && metro);

  return (
    <div className={styles.bloco}>
      {mostrarTabela && rolo && (
        <div className={styles.linha}>
          <span className={styles.rotulo}>
            Rolo fechado{item.metragemPadrao ? ` · ${item.metragemPadrao} m` : ''}
            {item.larguraM ? ` × ${item.larguraM} m` : ''}
          </span>
          <span className={styles.valor}>{rolo}</span>
          {item.roloVarejo != null && <span className={styles.minimo}>varejo {BRL.format(Number(item.roloVarejo))}</span>}
        </div>
      )}
      {mostrarTabela && metro && (
        <div className={styles.linha}>
          <span className={styles.rotulo}>Metro linear (fracionado)</span>
          <span className={styles.valor}>{metro}</span>
          {item.metroVarejo != null && <span className={styles.minimo}>varejo {BRL.format(Number(item.metroVarejo))}</span>}
        </div>
      )}
      {(item.roloVarejo != null || item.metroVarejo != null) && !mostrarTabela && (
        <p className={styles.minimoAdmin}>
          Tabela de varejo: {item.roloVarejo != null ? `${BRL.format(Number(item.roloVarejo))} o rolo` : ''}
          {item.roloVarejo != null && item.metroVarejo != null ? ' · ' : ''}
          {item.metroVarejo != null ? `${BRL.format(Number(item.metroVarejo))} o metro` : ''}
        </p>
      )}
      {/* Só admin recebe `usandoVarejo`. O número acima não é o preço praticado:
          é a tabela, porque o ERP não precificou o atacado deste SKU. */}
      {item.usandoVarejo && (
        <p className={styles.semAtacado}>⚠ Sem atacado no ERP — mostrando a tabela de varejo</p>
      )}
      {/* Só admin. A conta que o cliente não vê: de onde saiu o número. */}
      {viaSelecao && item.acrescimoPct != null && item.base && (
        <p className={styles.minimoAdmin}>
          Base {item.base.rolo != null ? `${BRL.format(Number(item.base.rolo))} o rolo` : ''}
          {item.base.rolo != null && item.base.metro != null ? ' · ' : ''}
          {item.base.metro != null ? `${BRL.format(Number(item.base.metro))} o metro` : ''} · +{item.acrescimoPct}%
          nesta seleção
        </p>
      )}
      {item.promocao && <span className={styles.promo}>Promoção</span>}

      {/* Fora de seleção: carrinho. Dentro: WhatsApp — o preço daqui foi
          negociado e o checkout cobraria a tabela. */}
      {produto && (rolo || metro) && !viaSelecao && (
        <Comprar
          slug={slug}
          produto={produto}
          preco={item}
          separador={
            mostrarTabela || Boolean(item.promocao) || Boolean(item.usandoVarejo) || item.roloVarejo != null || item.metroVarejo != null
          }
        />
      )}

      {produto && (rolo || metro) && viaSelecao && selecao && (
        <a
          className={styles.pedirSelecao}
          href={whatsappDaSelecao(selecao, null, produto.nome)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          PEDIR PELO WHATSAPP
        </a>
      )}

      <p className={styles.nota}>
        {viaSelecao ? (
          'Valor desta seleção. O pedido é fechado com a equipe NZ. Frete à parte.'
        ) : (
          <>
            Preço de tabela
            {item.atualizadoEm ? `, atualizado em ${new Date(item.atualizadoEm).toLocaleDateString('pt-BR')}` : ''}.
            Frete à parte.
          </>
        )}
      </p>
    </div>
  );
}
