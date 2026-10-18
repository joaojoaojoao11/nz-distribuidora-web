// Seletor de tamanho da peça (camisetas da Coleção NZPPF 2026).
//
// Cada tamanho é um produto com SKU próprio; a página mostra a VITRINE (o M) e
// este seletor troca qual SKU o preço, a disponibilidade e o carrinho usam. Não
// vem nada pré-selecionado de propósito: comprar camiseta no tamanho errado é a
// troca mais cara que existe — o botão de compra espera a escolha.
//
// A escolha mora na URL (`?tam=G`): sobrevive ao F5, dá para mandar o link
// do tamanho, e é para onde o slug de um tamanho redireciona.

import type { ShopItem } from '../../lib/shop/types';
import styles from './SeletorTamanho.module.css';

interface Props {
  variantes: ShopItem[];
  /** Slug do tamanho escolhido, ou `null` enquanto ninguém escolheu. */
  escolhido: string | null;
  onEscolher: (item: ShopItem) => void;
}

export default function SeletorTamanho({ variantes, escolhido, onEscolher }: Props) {
  if (variantes.length < 2) return null;
  const atual = variantes.find((v) => v.slug === escolhido);
  return (
    <div className={styles.bloco}>
      <div className={styles.cabeca}>
        <span className={styles.rotulo} id="seletor-tamanho">
          Tamanho
        </span>
        <span className={styles.escolha} aria-live="polite">
          {atual ? atual.variante : 'escolha um'}
        </span>
      </div>
      <div className={styles.opcoes} role="radiogroup" aria-labelledby="seletor-tamanho">
        {variantes.map((v) => {
          const ativo = v.slug === escolhido;
          return (
            <button
              key={v.slug}
              type="button"
              role="radio"
              aria-checked={ativo}
              className={ativo ? styles.opcaoAtiva : styles.opcao}
              onClick={() => onEscolher(v)}
            >
              {v.variante ?? v.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
