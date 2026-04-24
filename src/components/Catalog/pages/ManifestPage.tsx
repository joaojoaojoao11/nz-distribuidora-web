import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import { safeSpacing } from '../textHelpers';

const paragraphs = [
  'A maioria dos PPFs nasce em laboratório, longe da realidade de quem protege um carro de verdade.',
  'A NZ PPF nasceu diferente. No chão de estúdio, sob o calor de 40 graus, no detalhe invisível que separa o comum do impecável — no carro que vai voltar pra casa carregando a expectativa do dono.',
  'Cada rolo é validado em veículos reais, em condições reais, antes de encostar no seu carro. Sem atalhos. Sem suposições.'
];

export default function ManifestPage() {
  return (
    <CatalogPage pageNumber={2} className={styles.manifestPage}>
      <div className={styles.manifestContent}>
        <div className={styles.eyebrow}>MANIFESTO  ·  NZPPF</div>

        <div className={styles.manifestTitle}>
          NASCEU<br />
          NA <span>PRÁTICA.</span>
        </div>

        <div className={styles.manifestText}>
          {paragraphs.map((p, i) => (
            <p key={i}>{safeSpacing(p)}</p>
          ))}
          <p>
            {safeSpacing('Por isso o NZ PPF entrega')}{' '}
            <em>{safeSpacing('exatamente o que promete')}</em>
            {safeSpacing(': proteção que você não vê, acabamento que você sente, e a tranquilidade de saber que escolheu quem entende do assunto.')}
          </p>
        </div>

        <div className={styles.manifestSignature}>
          {catalogMeta.company}  —  {catalogMeta.url}
        </div>
      </div>
    </CatalogPage>
  );
}
