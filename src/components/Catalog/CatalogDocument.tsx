import { forwardRef } from 'react';
import styles from './Catalog.module.css';
import CoverPage from './pages/CoverPage';
import ManifestPage from './pages/ManifestPage';
import LinesOverviewPage from './pages/LinesOverviewPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BenchmarkPage from './pages/BenchmarkPage';
import DifferentiatorsPage from './pages/DifferentiatorsPage';
import GuaranteePage from './pages/GuaranteePage';
import ClosingPage from './pages/ClosingPage';
import BackCoverPage from './pages/BackCoverPage';
import { productLines } from './data/catalogData';

interface CatalogDocumentProps {
  qrDataUrl: string;
  productQrs: Record<string, string>;
}

const CatalogDocument = forwardRef<HTMLDivElement, CatalogDocumentProps>(({ qrDataUrl, productQrs }, ref) => {
  return (
    <div ref={ref} className={styles.documentRoot}>
      <CoverPage />
      <ManifestPage />
      <LinesOverviewPage />

      {productLines.map((product, idx) => (
        <ProductDetailPage
          key={product.slug}
          pageNumber={4 + idx}
          product={product}
          imageSide={idx % 2 === 0 ? 'left' : 'right'}
          qrDataUrl={productQrs[product.slug] || ''}
        />
      ))}

      <BenchmarkPage />
      <DifferentiatorsPage />
      <GuaranteePage qrDataUrl={qrDataUrl} />
      <ClosingPage />
      <BackCoverPage qrDataUrl={qrDataUrl} />
    </div>
  );
});

CatalogDocument.displayName = 'CatalogDocument';

export default CatalogDocument;
