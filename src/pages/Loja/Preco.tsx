// Preço na loja — o que aparece depende do papel, decidido no servidor.
//
// Este componente só desenha o que /api/nz/precos devolveu (src/lib/shop/precos.ts):
//   anônimo             → "Entre para ver o preço" (link para login com retorno)
//   aguardando aprovação→ "Cadastro em análise"
//   cliente / lojista   → rolo fechado + metro linear
//   admin               → também os mínimos, em cinza
// Se o servidor não mandou o item (SKU sem preço, produto sem conexão), some.

import { Link, useLocation } from 'react-router-dom';
import { BRL, usePreco } from '../../lib/shop/precos';
import styles from './Preco.module.css';

interface Props {
  slug: string;
  /** `card` = uma linha compacta; `pagina` = bloco completo com unidades. */
  variante: 'card' | 'pagina';
}

export default function Preco({ slug, variante }: Props) {
  const { estado, item } = usePreco(slug);
  const location = useLocation();
  const next = encodeURIComponent(`${location.pathname}${location.search}`);

  if (estado === 'anonimo') {
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

  return (
    <div className={styles.bloco}>
      {rolo && (
        <div className={styles.linha}>
          <span className={styles.rotulo}>
            Rolo fechado{item.metragemPadrao ? ` · ${item.metragemPadrao} m` : ''}
            {item.larguraM ? ` × ${item.larguraM} m` : ''}
          </span>
          <span className={styles.valor}>{rolo}</span>
          {item.roloMin != null && <span className={styles.minimo}>mín. {BRL.format(Number(item.roloMin))}</span>}
        </div>
      )}
      {metro && (
        <div className={styles.linha}>
          <span className={styles.rotulo}>Metro linear (fracionado)</span>
          <span className={styles.valor}>{metro}</span>
          {item.metroMin != null && <span className={styles.minimo}>mín. {BRL.format(Number(item.metroMin))}</span>}
        </div>
      )}
      {item.promocao && <span className={styles.promo}>Promoção</span>}
      <p className={styles.nota}>
        Preço de tabela, sincronizado do NZERP
        {item.atualizadoEm ? ` em ${new Date(item.atualizadoEm).toLocaleDateString('pt-BR')}` : ''}. Frete à parte.
      </p>
    </div>
  );
}
