import { forwardRef } from 'react';
import styles from './Catalog.module.css';
import CoverPage from './pages/CoverPage';
import ManifestPage from './pages/ManifestPage';
import LinesOverviewPage from './pages/LinesOverviewPage';
import ProductDetailPage from './pages/ProductDetailPage';
import FinishesPage from './pages/FinishesPage';
import BenchmarkPage from './pages/BenchmarkPage';
import DifferentiatorsPage from './pages/DifferentiatorsPage';
import GuaranteePage from './pages/GuaranteePage';
import ClosingPage from './pages/ClosingPage';
import BackCoverPage from './pages/BackCoverPage';
import CEOLetterPage from './pages/CEOLetterPage';
import { productLines, totalPagesFor, type CatalogMode } from './data/catalogData';

interface CatalogDocumentProps {
  qrDataUrl: string;
  productQrs: Record<string, string>;
  mode?: CatalogMode;
}

const CatalogDocument = forwardRef<HTMLDivElement, CatalogDocumentProps>(
  ({ qrDataUrl, productQrs, mode = 'standard' }, ref) => {
    const complete = mode === 'complete';
    const totalPages = totalPagesFor(mode);

    // Numeração dinâmica: cada página consome um slot sequencial
    let p = 0;
    const nextPage = () => ++p;

    const coverN = nextPage();
    const manifestN = nextPage();
    const linesN = nextPage();

    // Páginas de produto (+ acabamentos entre cada linha no modo completo)
    const productBlocks = productLines.map((product, idx) => {
      const techN = nextPage();
      const hasFinishes = complete && !!product.finishes?.items?.length;
      const finishN = hasFinishes ? nextPage() : null;

      return (
        <div key={product.slug} style={{ display: 'contents' }}>
          <ProductDetailPage
            pageNumber={techN}
            totalPages={totalPages}
            product={product}
            imageSide={idx % 2 === 0 ? 'left' : 'right'}
            qrDataUrl={productQrs[product.slug] || ''}
          />
          {hasFinishes && finishN !== null && (
            <FinishesPage
              pageNumber={finishN}
              totalPages={totalPages}
              lineIndex={idx + 1}
              product={product}
            />
          )}
        </div>
      );
    });

    const benchmarkN = nextPage();
    const diffN = nextPage();
    const guaranteeN = nextPage();
    const closingN = nextPage();
    const backN = nextPage();
    // Carta do CEO — fechamento interior pós-contracapa.
    // Conta como página final do catálogo em ambos os modos
    // (TOTAL_PAGES = 15 / TOTAL_PAGES_COMPLETE = 20).
    const ceoLetterN = nextPage();

    return (
      // lang="pt-BR" ativa o dicionário de hifenização do Chromium
      // para os parágrafos com `hyphens: auto` (ETAPA 7.2).
      // Sem isso o navegador aplica regras de hifenização do idioma
      // padrão do sistema, que pode quebrar palavras pt-BR de forma errada.
      <div ref={ref} className={styles.documentRoot} lang="pt-BR">
        <CoverPage pageNumber={coverN} totalPages={totalPages} />
        <ManifestPage pageNumber={manifestN} totalPages={totalPages} />
        <LinesOverviewPage pageNumber={linesN} totalPages={totalPages} />

        {productBlocks}

        <BenchmarkPage pageNumber={benchmarkN} totalPages={totalPages} />
        <DifferentiatorsPage pageNumber={diffN} totalPages={totalPages} />
        <GuaranteePage pageNumber={guaranteeN} totalPages={totalPages} qrDataUrl={qrDataUrl} />
        <ClosingPage pageNumber={closingN} totalPages={totalPages} />
        <BackCoverPage pageNumber={backN} totalPages={totalPages} qrDataUrl={qrDataUrl} />
        <CEOLetterPage pageNumber={ceoLetterN} totalPages={totalPages} />
      </div>
    );
  }
);

CatalogDocument.displayName = 'CatalogDocument';

export default CatalogDocument;
