// Onde a pessoa está no processo de compra.
//
// Existe porque o caminho carrinho → entrega e pagamento → confirmação não se
// anunciava em lugar nenhum: quem chegava no carrinho não sabia se o botão ia
// cobrar na hora ou abrir mais uma tela. Três passos, o atual marcado, os
// anteriores clicáveis quando fazem sentido.

import { Link } from 'react-router-dom';
import styles from './PassosCompra.module.css';

interface Passo {
  rotulo: string;
  para?: string;
}

export default function PassosCompra({ passos, atual }: { passos: Passo[]; atual: number }) {
  return (
    <nav className={styles.trilha} aria-label="Etapas da compra">
      <ol className={styles.lista}>
        {passos.map((p, i) => {
          const estado = i < atual ? 'feito' : i === atual ? 'atual' : 'futuro';
          const conteudo = (
            <>
              <span className={styles.numero} aria-hidden="true">
                {estado === 'feito' ? '✓' : i + 1}
              </span>
              <span className={styles.rotulo}>{p.rotulo}</span>
            </>
          );
          return (
            <li key={p.rotulo} className={styles[estado]} aria-current={estado === 'atual' ? 'step' : undefined}>
              {estado === 'feito' && p.para ? (
                <Link to={p.para} className={styles.link}>
                  {conteudo}
                </Link>
              ) : (
                conteudo
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
