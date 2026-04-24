import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import CatalogDocument from '../../components/Catalog/CatalogDocument';
import { generateCatalogPdf, type ProgressInfo } from '../../components/Catalog/generateCatalogPdf';
import { TOTAL_PAGES, catalogMeta, productLines, productUrl } from '../../components/Catalog/data/catalogData';
import styles from './AdminCatalog.module.css';

const sectionList = [
  { num: '01', label: 'Capa Editorial' },
  { num: '02', label: 'Manifesto NZPPF' },
  { num: '03', label: 'Visão Geral das 6 Linhas' },
  { num: '04', label: 'NZPPF Luxury Gloss' },
  { num: '05', label: 'NZPPF Prime Gloss' },
  { num: '06', label: 'NZPPF Flow Gloss' },
  { num: '07', label: 'NZPPF Core Gloss' },
  { num: '08', label: 'NZPPF Headlight' },
  { num: '09', label: 'NZPPF Windshield' },
  { num: '10', label: 'Comparativo de Performance' },
  { num: '11', label: 'Diferenciais Exclusivos' },
  { num: '12', label: 'Garantia · Certificado' },
  { num: '13', label: 'Posicionamento de Marca' },
  { num: '14', label: 'Contra-capa · QR' }
];

export default function AdminCatalog() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [productQrs, setProductQrs] = useState<Record<string, string>>({});
  const docRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setFeedback(null);
    setProgress({ current: 0, total: TOTAL_PAGES, label: 'Gerando QR codes…' });

    try {
      const qrOpts = {
        margin: 1,
        width: 600,
        color: { dark: '#050505', light: '#ffffff' }
      } as const;

      const qrMain = await QRCode.toDataURL(catalogMeta.baseUrl, qrOpts);
      setQrDataUrl(qrMain);

      const qrEntries = await Promise.all(
        productLines.map(async (line) => [
          line.slug,
          await QRCode.toDataURL(productUrl(line.slug), qrOpts)
        ] as const)
      );
      setProductQrs(Object.fromEntries(qrEntries));

      await new Promise((r) => setTimeout(r, 250));

      if (!docRef.current) {
        throw new Error('Documento não montado.');
      }

      await generateCatalogPdf(docRef.current, (info) => setProgress(info));

      setFeedback({
        type: 'success',
        msg: 'PDF gerado com sucesso. Verifique sua pasta de Downloads.'
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Erro inesperado ao gerar o catálogo.'
      });
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.heroCard}>
        <div className={styles.eyebrow}>FERRAMENTA INTERNA · PROVISÓRIA</div>
        <h2 className={styles.title}>
          GERADOR DE<br />
          CATÁLOGO FÍSICO NZPPF
        </h2>
        <p className={styles.subtitle}>
          Produza um PDF de alta resolução pronto para impressão profissional, no formato
          15 × 20 cm, contendo as 6 linhas NZPPF com o mesmo padrão visual do site.
          Ideal para envio à gráfica ou apresentação a clientes.
        </p>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Formato</div>
            <div className={styles.metaValue}>150 × 200 <strong>mm</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Resolução</div>
            <div className={styles.metaValue}>300 <strong>DPI</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Páginas</div>
            <div className={styles.metaValue}>{TOTAL_PAGES} <strong>pgs</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Saída</div>
            <div className={styles.metaValue}>PDF · <strong>JPEG 94</strong></div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={generating}
        >
          <span className={styles.btnIcon}>{generating ? '⌛' : '📕'}</span>
          {generating ? 'Gerando catálogo…' : 'Gerar catálogo PDF'}
        </button>
        <span className={styles.hint}>
          Tempo estimado: 15–30 segundos · Tamanho final ~12–25 MB
        </span>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? styles.successBox : styles.errorBox}>
          <strong>{feedback.type === 'success' ? 'CATÁLOGO GERADO' : 'FALHA NA GERAÇÃO'}</strong>
          {feedback.msg}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryTitle}>SEÇÕES INCLUÍDAS · 14 PÁGINAS</div>
        <div className={styles.sectionList}>
          {sectionList.map((s) => (
            <div key={s.num} className={styles.sectionRow}>
              <span><span className={styles.num}>{s.num}</span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.notice}>
        <strong>NOTA TÉCNICA</strong>
        Geração 100% no navegador (jsPDF + html2canvas). Não consome função serverless.
        Para máxima fidelidade visual, mantenha esta aba ativa durante o processo —
        o navegador desacelera renderizações em abas em segundo plano.
      </div>

      {/* Documento off-screen renderizado para captura */}
      <CatalogDocument ref={docRef} qrDataUrl={qrDataUrl} productQrs={productQrs} />

      {generating && progress && (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayLabel}>Gerando catálogo NZPPF</div>
            <div className={styles.overlayDesc}>
              Renderizando cada página em 1772 × 2362 px (300 DPI) e compondo o PDF.
              Por favor, aguarde — não feche esta aba.
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressMeta}>
              <span>{progress.label}</span>
              <span>{pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
