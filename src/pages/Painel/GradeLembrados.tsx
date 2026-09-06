// Grade de produtos guardados — serve Favoritos e Vistos recentemente.
//
// Não reusa o `ShopCard` da loja de propósito: aquele espera um `ShopItem`
// inteiro do catálogo, e aqui só temos o que foi lembrado no navegador (slug,
// nome, foto, cor). Buscar o catálogo inteiro para desenhar seis cards seria
// pior. O preço vem do mesmo `<Preco variante="card">` da loja, então respeita
// o papel de quem está olhando.

import { Link } from 'react-router-dom';
import Preco from '../Loja/Preco';
import { usePrecosLote } from '../../lib/shop/precos';
import type { ProdutoLembrado } from '../../lib/shop/listasPessoais';
import styles from './GradeLembrados.module.css';

interface Props {
  itens: ProdutoLembrado[];
  /** Texto do botão de remover. Sem ele, o card não tem ação de remover. */
  remover?: { rotulo: string; ao: (slug: string) => void };
}

export default function GradeLembrados({ itens, remover }: Props) {
  usePrecosLote(itens.map((i) => i.slug));

  return (
    <ul className={styles.grade}>
      {itens.map((i) => (
        <li key={i.slug} className={styles.card}>
          <Link to={`/loja/${i.slug}`} className={styles.foto}>
            {i.imagem ? (
              <img src={i.imagem} alt="" loading="lazy" />
            ) : (
              <span className={styles.amostra} style={{ background: i.hex ?? '#222' }} />
            )}
          </Link>
          <div className={styles.corpo}>
            <Link to={`/loja/${i.slug}`} className={styles.nome}>
              {i.nome}
            </Link>
            {i.codigo && <span className={styles.codigo}>{i.codigo}</span>}
            <Preco slug={i.slug} variante="card" />
          </div>
          {remover && (
            <button type="button" className={styles.remover} onClick={() => remover.ao(i.slug)}>
              {remover.rotulo}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
