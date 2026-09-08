// Card de produto da LOJA.
//
// A exigência de "todos os produtos do mesmo tamanho" é resolvida por duas
// travas no CSS, sem altura fixa em px: mídia em `aspect-ratio: 1/1` e rodapé
// de altura fixa. Assim o card tem exatamente a mesma altura em qualquer
// viewport, e o CLS fica em zero.
//
// Metade do catálogo é cor sem foto (as 116 do banco e as 92 da M7 não têm
// imagem), então o mesmo quadrado ora recebe uma textura fotografada, ora um
// swatch gerado do hex.

import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ShopItem } from '../../lib/shop/types';
import EstoqueDots from './EstoqueDots';
import Preco from './Preco';
import { cortarNome } from './useLimiteNome';
import styles from './ShopCard.module.css';

interface Props {
  item: ShopItem;
  /**
   * Máximo de caracteres do nome, medido a partir da largura real da coluna
   * (ver `useLimiteNome`). Sem ele o nome vai inteiro e quem corta é o CSS.
   */
  limiteNome?: number | null;
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
  /**
   * Token da seleção que liberou o preço. Vai para o `usePreco` (que sem ele
   * leria o preço da loja) e para a URL do produto, para o preço continuar
   * aparecendo depois do clique.
   */
  selecao?: string;
}

function swatchBackground(hex: string): string {
  // Gradiente sutil: um retângulo chapado ao lado de texturas fotografadas
  // parece falha de carregamento.
  return `linear-gradient(145deg, ${hex} 0%, ${hex} 55%, color-mix(in srgb, ${hex} 78%, #000) 100%)`;
}

/** Compara os dois rótulos ignorando caixa e espaço: a linha de cima é
 *  maiúscula só por CSS, então "Speed Wrapping" e "SPEED WRAPPING" são o mesmo
 *  texto para o visitante. */
const mesmoRotulo = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

function ShopCardBase({ item, eager = false, onRemove, from, limiteNome, selecao }: Props) {
  const hasImage = Boolean(item.image);

  // Boa parte do catálogo não tem acabamento nem subtítulo próprios, e as duas
  // linhas caíam no mesmo `brand`: o card repetia "Speed Wrapping" embaixo de
  // "SPEED WRAPPING". Sem a repetição sobra a folga que o nome precisa.
  const linha = item.line ?? item.brand;
  const rotuloMeta = item.finishLabel ?? item.subtitle ?? item.brand;
  const meta = rotuloMeta && !mesmoRotulo(rotuloMeta, linha) ? rotuloMeta : null;

  return (
    <Link
      // `?s=` na URL, não no `state` do Link: um F5 na página do produto perde
      // o state e o preço da seleção sumiria no meio da conversa.
      to={`/loja/${item.slug}${selecao ? `?s=${selecao}` : ''}`}
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
        <span className={styles.line}>{linha}</span>
        {/* Cortado na contagem de caracteres da coluna, para todos os cards
            caírem no mesmo comprimento. O `white-space: nowrap` do CSS segue
            como rede para um nome de letras largas demais. O texto inteiro
            continua no `title` e no `aria-label` do card. */}
        <h3 className={styles.name} title={item.name}>
          {cortarNome(item.name, limiteNome ?? null)}
        </h3>
        {/* SKU fica fora da foto: a capa é o que vende o produto, e o chip sobre
            a imagem cobria justamente o canto onde o rolo aparece. As bolinhas
            de estoque dividem esta linha — sobre a foto elas sumiriam no meio
            do badge de disponibilidade e do × da curadoria. Só admin as recebe
            (a decisão é do servidor, ver EstoqueDots). */}
        {item.code ? (
          <span className={styles.codeLinha}>
            <span className={styles.code}>{item.code}</span>
            {item.kind !== 'linha' && <EstoqueDots slug={item.slug} selecao={selecao} />}
          </span>
        ) : (
          item.kind !== 'linha' && (
            <span className={styles.codeLinha}>
              <EstoqueDots slug={item.slug} selecao={selecao} />
            </span>
          )
        )}
        {meta && <span className={styles.meta}>{meta}</span>}
        {/* Preço por papel: o servidor decide o que este card pode mostrar. */}
        {item.kind !== 'linha' && <Preco slug={item.slug} variante="card" selecao={selecao} />}
      </div>
    </Link>
  );
}

// O grid renderiza centenas de cards e re-renderiza a cada tecla digitada na
// busca; memo corta o trabalho para os que não mudaram.
export const ShopCard = memo(ShopCardBase);
