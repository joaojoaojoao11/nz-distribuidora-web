// Duas bolinhas: o que dá para vender AGORA, sem abrir a página do produto.
//
// Verde  = existe rolo fechado no pátio (dá para vender rolo).
// Laranja= existe rolo aberto, isto é, ponta (dá para vender fracionado).
//
// Pedido do João (2026-09-08): "assim vamos saber rapidamente o que tem em
// estoque". Vendedor no balcão percorrendo o mostruário não pode abrir 60
// páginas para descobrir o que sai hoje.
//
// SÓ ADMIN, e quem decide isso é o SERVIDOR: o campo `estoque` só é montado
// para o papel admin em api/_lib/handlers/precos.ts. Aqui não há checagem de
// papel nenhuma — se houvesse, bastaria o DevTools para burlar. O componente
// simplesmente não recebe o dado quando não deve.
//
// O número vem junto do preço (uma requisição por página de cards) e não de
// /api/nz/estoque, que consulta o ERP ao vivo por SKU: 60 cards seriam 60
// consultas ao ERP para desenhar duas bolinhas.

import { usePreco } from '../../lib/shop/precos';
import styles from './EstoqueDots.module.css';

interface Contagem {
  rolosFechados: number;
  rolosAbertos: number;
}

/** Versão que já tem os números (página do produto, que os busca por outro caminho). */
export function BolinhasDeEstoque({ estoque }: { estoque: Contagem | undefined }) {
  if (!estoque) return null;
  const { rolosFechados, rolosAbertos } = estoque;
  if (rolosFechados <= 0 && rolosAbertos <= 0) return null;

  return (
    <span className={styles.grupo}>
      {rolosFechados > 0 && (
        <span
          className={`${styles.bolinha} ${styles.fechado}`}
          title={`${rolosFechados} rolo${rolosFechados > 1 ? 's' : ''} fechado${rolosFechados > 1 ? 's' : ''} no pátio`}
          aria-label={`${rolosFechados} rolo${rolosFechados > 1 ? 's' : ''} fechado${rolosFechados > 1 ? 's' : ''} no pátio`}
          role="img"
        />
      )}
      {rolosAbertos > 0 && (
        <span
          className={`${styles.bolinha} ${styles.aberto}`}
          title={`${rolosAbertos} rolo${rolosAbertos > 1 ? 's' : ''} aberto${rolosAbertos > 1 ? 's' : ''} · fracionado`}
          aria-label={`${rolosAbertos} rolo${rolosAbertos > 1 ? 's' : ''} aberto${rolosAbertos > 1 ? 's' : ''}, fracionado`}
          role="img"
        />
      )}
    </span>
  );
}

/** Versão do card: lê o mesmo cache de preço que o card já usa. */
export default function EstoqueDots({ slug }: { slug: string }) {
  const { item } = usePreco(slug);
  return <BolinhasDeEstoque estoque={item?.estoque} />;
}
