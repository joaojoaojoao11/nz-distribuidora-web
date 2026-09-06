// /painel/favoritos — as cores que o cliente separou.
//
// Numa loja com 1.292 produtos e centenas de tons parecidos, o instalador acha
// a cor, não compra naquele dia e perde. Favoritar é o marcador que faltava.
// Fica no navegador (ver `listasPessoais.ts`): é preferência de leitura, não
// dado de negócio.

import { Link } from 'react-router-dom';
import { removerFavorito, useFavoritos } from '../../lib/shop/listasPessoais';
import GradeLembrados from './GradeLembrados';
import styles from './Painel.module.css';

export default function PainelFavoritos() {
  const favoritos = useFavoritos();

  if (favoritos.length === 0) {
    return (
      <div className={styles.vazio}>
        <p className={styles.mudo}>
          Você ainda não separou nenhuma cor. Na página de um produto, toque no coração para guardar
          aqui — os favoritos ficam neste navegador, ligados à sua conta.
        </p>
        <Link to="/loja" className={styles.botaoSecundario}>
          Ir para a loja
        </Link>
      </div>
    );
  }

  return <GradeLembrados itens={favoritos} remover={{ rotulo: 'Remover', ao: removerFavorito }} />;
}
