// Os pedaços da Promoção Moto com o valor de venda FECHADO de cada um.
//
// Pedido do João (2026-10-03): no lugar de um selo genérico, "as medidas
// fracionadas com o valor de venda fechado" — o cliente vê 7 m e quanto custa
// levar os 7 m, sem fazer conta.
//
// Valor fechado = metros × preço do metro que o /api/nz/precos devolve PARA
// ESTE PAPEL (atacado para cliente/lojista, o da seleção quando houver). Quem
// não entrou vê só os metros: a regra de preço da loja não muda na promoção.

import { BRL, usePreco } from '../../lib/shop/precos';
import { metrosTexto } from '../../lib/shop/promoMoto';
import styles from './PecasPromo.module.css';

interface Props {
  slug: string;
  pecas: number[];
  /** `card` = chips sobre a foto; `pagina` = lista na página do produto. */
  variante: 'card' | 'pagina';
  selecao?: string;
}

/** No card cabem três chips sobre a foto sem cobrir a moto. */
const MAX_NO_CARD = 3;

export function valorFechado(metros: number, precoMetro: number | null | undefined): number | null {
  if (!precoMetro || !(precoMetro > 0)) return null;
  return Math.round(metros * precoMetro * 100) / 100;
}

export default function PecasPromo({ slug, pecas, variante, selecao }: Props) {
  const { item } = usePreco(slug, selecao);
  const metro = item?.disponivel ? item.metro : null;

  if (variante === 'card') {
    const visiveis = pecas.slice(0, MAX_NO_CARD);
    const resto = pecas.length - visiveis.length;
    return (
      <span className={styles.chips}>
        {visiveis.map((m, i) => {
          const v = valorFechado(m, metro);
          return (
            <span key={i} className={styles.chip}>
              <strong>{metrosTexto(m)}</strong>
              {v != null && <span className={styles.valor}>{BRL.format(v)}</span>}
            </span>
          );
        })}
        {resto > 0 && (
          <span className={`${styles.chip} ${styles.mais}`}>
            +{resto} {resto === 1 ? 'pedaço' : 'pedaços'}
          </span>
        )}
      </span>
    );
  }

  return (
    <section className={styles.bloco} aria-labelledby="pecas-promo-titulo">
      <h2 id="pecas-promo-titulo" className={styles.titulo}>
        Promoção moto · pedaços disponíveis
      </h2>
      <ul className={styles.lista}>
        {pecas.map((m, i) => {
          const v = valorFechado(m, metro);
          return (
            <li key={i} className={styles.linha}>
              <span className={styles.metros}>{metrosTexto(m)}</span>
              <span className={styles.preco}>{v != null ? BRL.format(v) : '—'}</span>
            </li>
          );
        })}
      </ul>
      <p className={styles.nota}>
        {metro
          ? `Valor do pedaço inteiro, a ${BRL.format(metro)} o metro linear${
              item?.larguraM ? `, largura ${item.larguraM.toLocaleString('pt-BR')} m` : ''
            }.`
          : 'Entre com seu cadastro para ver o valor de cada pedaço.'}
      </p>
    </section>
  );
}
