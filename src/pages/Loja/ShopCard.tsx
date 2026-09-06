// Card de produto da LOJA.
//
// A exigência de "todos os produtos do mesmo tamanho" é resolvida por duas
// travas no CSS, sem altura fixa em px: mídia em `aspect-ratio: 1/1` e nome com
// `line-clamp: 2` num bloco de altura fixa. Assim o card tem exatamente a mesma
// altura em qualquer viewport, e o CLS fica em zero.
//
// Metade do catálogo é cor sem foto (as 116 do banco e as 92 da M7 não têm
// imagem), então o mesmo quadrado ora recebe uma textura fotografada, ora um
// swatch gerado do hex.

import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ShopItem } from '../../lib/shop/types';
import styles from './ShopCard.module.css';

interface Props {
  item: ShopItem;
  /** As primeiras imagens carregam sem lazy, para o LCP do mobile. */
  eager?: boolean;
  /**
   * Quando presente, o card ganha um × para tirar o item da lista. Só é
   * passado no modo curadoria — um × sempre visível seria ruído para quem só
   * está navegando, e "remover" não é uma ação que faça sentido oferecer a um
   * visitante qualquer.
   */
  onRemove?: (slug: string) => void;
  /**
   * De onde o visitante veio (pathname + search da lista). Vai no `state` do
   * Link: é o que permite ao "VOLTAR" do produto usar o histórico e devolver o
   * usuário à mesma posição, com os mesmos filtros.
   */
  from?: string;
}

function swatchBackground(hex: string): string {
  // Gradiente sutil: um retângulo chapado ao lado de texturas fotografadas
  // parece falha de carregamento.
  return `linear-gradient(145deg, ${hex} 0%, ${hex} 55%, color-mix(in srgb, ${hex} 78%, #000) 100%)`;
}

function ShopCardBase({ item, eager = false, onRemove, from }: Props) {
  const hasImage = Boolean(item.image);

  return (
    <Link
      to={`/loja/${item.slug}`}
      state={from ? { from } : undefined}
      className={styles.card}
      aria-label={item.name}
    >
      <div className={styles.media}>
        {hasImage ? (
          <img
            src={item.image as string}
            alt={item.name}
            className={styles.image}
            loading={eager ? undefined : 'lazy'}
            decoding="async"
            {...(eager ? { fetchPriority: 'high' as const } : {})}
          />
        ) : item.hex ? (
          <span
            className={styles.swatch}
            style={{ background: swatchBackground(item.hex) }}
            aria-hidden="true"
          />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">
            {item.brand}
          </span>
        )}

        {/* Nível público de estoque, já embutido no catálogo — sem request. */}
        {item.nivelEstoque === 'pronta-entrega' && (
          <span className={`${styles.estoque} ${styles.estoquePronta}`}>Pronta entrega</span>
        )}
        {item.nivelEstoque === 'ultimas-unidades' && (
          <span className={`${styles.estoque} ${styles.estoqueUltimas}`}>Últimas unidades</span>
        )}

        {onRemove && (
          <button
            type="button"
            className={styles.remove}
            aria-label={`Tirar ${item.name} da seleção`}
            title="Tirar da seleção"
            onClick={(e) => {
              // O card inteiro é um <Link>: sem isso, remover navegaria.
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.slug);
            }}
          >
            ✕
          </button>
        )}

        {!onRemove && (
          <span className={styles.hoverCta} aria-hidden="true">
            VER PRODUTO →
          </span>
        )}
      </div>

      <div className={styles.info}>
        <span className={styles.line}>{item.line ?? item.brand}</span>
        <h3 className={styles.name}>{item.name}</h3>
        {/* SKU fica fora da foto: a capa é o que vende o produto, e o chip sobre
            a imagem cobria justamente o canto onde o rolo aparece. */}
        {item.code && <span className={styles.code}>{item.code}</span>}
        <span className={styles.meta}>{item.finishLabel ?? item.subtitle ?? item.brand}</span>
      </div>
    </Link>
  );
}

// O grid renderiza centenas de cards e re-renderiza a cada tecla digitada na
// busca; memo corta o trabalho para os que não mudaram.
export const ShopCard = memo(ShopCardBase);
