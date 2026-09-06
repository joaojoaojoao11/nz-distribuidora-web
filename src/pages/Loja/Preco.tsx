// Preço na loja — o que aparece depende do papel, decidido no servidor.
//
// Este componente só desenha o que /api/nz/precos devolveu (src/lib/shop/precos.ts):
//   anônimo             → "Entre para ver o preço" (link para login com retorno)
//   aguardando aprovação→ "Cadastro em análise"
//   cliente / lojista   → rolo fechado + metro linear
//   admin               → também os mínimos, em cinza
// Se o servidor não mandou o item (SKU sem preço, produto sem conexão), some.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adicionarAoCarrinho } from '../../lib/shop/carrinho';
import { BRL, usePreco } from '../../lib/shop/precos';
import styles from './Preco.module.css';

interface Props {
  slug: string;
  /** `card` = uma linha compacta; `pagina` = bloco completo com unidades. */
  variante: 'card' | 'pagina';
  /** Só na página: o que o carrinho guarda para mostrar o item. */
  produto?: { nome: string; codigo: string | null; imagem: string | null; hex: string | null };
}

export default function Preco({ slug, variante, produto }: Props) {
  const { estado, item } = usePreco(slug);
  const location = useLocation();
  const [rolos, setRolos] = useState(1);
  const [metros, setMetros] = useState(1);
  const [adicionado, setAdicionado] = useState<string | null>(null);

  const adicionar = (unidade: 'rolo' | 'metro') => {
    if (!produto) return;
    adicionarAoCarrinho({ slug, nome: produto.nome, codigo: produto.codigo, imagem: produto.imagem, hex: produto.hex, unidade, qtd: unidade === 'rolo' ? rolos : metros });
    setAdicionado(unidade);
    setTimeout(() => setAdicionado(null), 1800);
  };
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

      {produto && (rolo || metro) && (
        <div className={styles.comprar}>
          {rolo && (
            <div className={styles.comprarLinha}>
              <input type="number" min={1} max={50} step={1} value={rolos} onChange={(e) => setRolos(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} aria-label="Rolos fechados" />
              <button type="button" onClick={() => adicionar('rolo')}>
                {adicionado === 'rolo' ? 'Adicionado ✓' : `Adicionar rolo${rolos > 1 ? 's' : ''} fechado${rolos > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
          {metro && (
            <div className={styles.comprarLinha}>
              <input type="number" min={0.5} max={500} step={0.5} value={metros} onChange={(e) => setMetros(Math.max(0.5, Math.min(500, Number(e.target.value) || 0.5)))} aria-label="Metros" />
              <button type="button" onClick={() => adicionar('metro')}>
                {adicionado === 'metro' ? 'Adicionado ✓' : 'Adicionar metros'}
              </button>
            </div>
          )}
          <Link to="/carrinho" className={styles.verCarrinho}>
            Ver carrinho
          </Link>
        </div>
      )}
      <p className={styles.nota}>
        Preço de tabela, sincronizado do NZERP
        {item.atualizadoEm ? ` em ${new Date(item.atualizadoEm).toLocaleDateString('pt-BR')}` : ''}. Frete à parte.
      </p>
    </div>
  );
}
