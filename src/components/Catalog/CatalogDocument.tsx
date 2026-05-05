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
import { productLines, TOTAL_PAGES } from './data/catalogData';

interface CatalogDocumentProps {
  qrDataUrl: string;
  productQrs: Record<string, string>;
  /**
   * QRs editoriais (manifesto, comparativo, diferenciais) que apontam
   * para as páginas aprofundadas do site. Introduzidos junto com a
   * refundação tipográfica A5: o catálogo impresso ficou em 12 pt
   * mínimo (Clear Print 50+) e o conteúdo cortado vive online.
   */
  manifestQrDataUrl?: string;
  benchmarkQrDataUrl?: string;
  differentialsQrDataUrl?: string;
  guaranteeQrDataUrl?: string;
}

/**
 * Renderiza o catálogo NZPPF de 20 páginas em sequência fixa:
 *
 *   1  Cover
 *   2  Manifesto
 *   3  Lines Overview
 *   4–14  6 produtos × (Detail + Finishes), exceto Windshield que tem
 *         só Detail (sem dados de acabamentos cadastrados)
 *   15 Benchmark
 *   16 Diferenciais
 *   17 Garantia
 *   18 Closing
 *   19 Back Cover
 *   20 CEO Letter
 */
const CatalogDocument = forwardRef<HTMLDivElement, CatalogDocumentProps>(
  (
    {
      qrDataUrl,
      productQrs,
      manifestQrDataUrl,
      benchmarkQrDataUrl,
      differentialsQrDataUrl,
      guaranteeQrDataUrl,
    },
    ref
  ) => {
    let p = 0;
    const nextPage = () => ++p;

    const coverN = nextPage();
    const manifestN = nextPage();
    const linesN = nextPage();

    // Para cada produto: página de detalhe + (opcional) página de
    // estrutura/acabamentos. Windshield não tem `finishes`, então só
    // renderiza a detalhe e a Arquitetura/Estrutura volta a ser exibida
    // dentro da própria página de detalhe (controlado pelo
    // ProductDetailPage via a presença de `product.finishes`).
    const productBlocks = productLines.map((product, idx) => {
      const techN = nextPage();
      const hasFinishes = !!product.finishes?.items?.length;
      const finishN = hasFinishes ? nextPage() : null;

      return (
        <div key={product.slug} style={{ display: 'contents' }}>
          <ProductDetailPage
            pageNumber={techN}
            totalPages={TOTAL_PAGES}
            product={product}
            imageSide={idx % 2 === 0 ? 'left' : 'right'}
            qrDataUrl={productQrs[product.slug] || ''}
          />
          {hasFinishes && finishN !== null && (
            <FinishesPage
              pageNumber={finishN}
              totalPages={TOTAL_PAGES}
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
    const ceoLetterN = nextPage();

    return (
      <div ref={ref} className={styles.documentRoot} lang="pt-BR">
        <CoverPage pageNumber={coverN} totalPages={TOTAL_PAGES} />
        <ManifestPage
          pageNumber={manifestN}
          totalPages={TOTAL_PAGES}
          qrDataUrl={manifestQrDataUrl}
        />
        <LinesOverviewPage pageNumber={linesN} totalPages={TOTAL_PAGES} />

        {productBlocks}

        <BenchmarkPage
          pageNumber={benchmarkN}
          totalPages={TOTAL_PAGES}
          qrDataUrl={benchmarkQrDataUrl}
        />
        <DifferentiatorsPage
          pageNumber={diffN}
          totalPages={TOTAL_PAGES}
          qrDataUrl={differentialsQrDataUrl}
        />
        <GuaranteePage
          pageNumber={guaranteeN}
          totalPages={TOTAL_PAGES}
          qrDataUrl={guaranteeQrDataUrl || qrDataUrl}
        />
        <ClosingPage pageNumber={closingN} totalPages={TOTAL_PAGES} />
        <BackCoverPage pageNumber={backN} totalPages={TOTAL_PAGES} qrDataUrl={qrDataUrl} />
        <CEOLetterPage pageNumber={ceoLetterN} totalPages={TOTAL_PAGES} />
      </div>
    );
  }
);

CatalogDocument.displayName = 'CatalogDocument';

export default CatalogDocument;
