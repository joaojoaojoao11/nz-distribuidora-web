import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import CatalogDocument from '../../components/Catalog/CatalogDocument';
import {
  generateCatalogPdf,
  type ProgressInfo
} from '../../components/Catalog/generateCatalogPdf';
import {
  TOTAL_PAGES,
  catalogMeta,
  productLines,
  productUrl,
} from '../../components/Catalog/data/catalogData';
import {
  CatalogOverridesProvider,
} from '../../components/Catalog/useCatalogOverrides';
import PageEditor, { type PageEditorContext } from '../../components/Catalog/PageEditor';
import styles from './AdminCatalog.module.css';

interface SectionEntry {
  num: string;
  label: string;
  /** ID usado pelo PageEditor para abrir o registro correto. */
  pageId: string;
}

// Catálogo único de 20 páginas (modo "standard" de 15 foi descontinuado —
// a Estrutura do PPF foi realocada da página de detalhe para a página de
// acabamentos, então cada linha que tem acabamentos cadastrados precisa
// dos 2 spreads).
const sectionList: SectionEntry[] = [
  { num: '01', label: 'Capa Editorial',              pageId: 'cover' },
  { num: '02', label: 'Manifesto NZPPF',             pageId: 'manifest' },
  { num: '03', label: 'Visão Geral das 6 Linhas',    pageId: 'lines-overview' },
  { num: '04', label: 'NZPPF Luxury Gloss',          pageId: 'product:luxury-gloss' },
  { num: '05', label: 'Estrutura + Acabamentos Luxury', pageId: 'finishes:luxury-gloss' },
  { num: '06', label: 'NZPPF Prime Gloss',           pageId: 'product:prime-gloss' },
  { num: '07', label: 'Estrutura + Acabamentos Prime',  pageId: 'finishes:prime-gloss' },
  { num: '08', label: 'NZPPF Flow Gloss',            pageId: 'product:flow-gloss' },
  { num: '09', label: 'Estrutura + Acabamentos Flow',   pageId: 'finishes:flow-gloss' },
  { num: '10', label: 'NZPPF Core Gloss',            pageId: 'product:core-gloss' },
  { num: '11', label: 'Estrutura + Acabamentos Core',   pageId: 'finishes:core-gloss' },
  { num: '12', label: 'NZPPF Headlight',             pageId: 'product:headlight' },
  { num: '13', label: 'Estrutura + Tonalidades Headlight', pageId: 'finishes:headlight' },
  { num: '14', label: 'NZPPF Windshield',            pageId: 'product:windshield' },
  { num: '15', label: 'Comparativo de Performance',  pageId: 'benchmark' },
  { num: '16', label: 'Diferenciais Exclusivos',     pageId: 'differentials' },
  { num: '17', label: 'Garantia · Certificado',      pageId: 'guarantee' },
  { num: '18', label: 'Posicionamento de Marca',     pageId: 'closing' },
  { num: '19', label: 'Contra-capa · QR',            pageId: 'backcover' },
  { num: '20', label: 'Palavra Final',               pageId: 'ceoletter' },
];

export default function AdminCatalog() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [productQrs, setProductQrs] = useState<Record<string, string>>({});
  // QRs editoriais — apontam para versões aprofundadas no site das
  // páginas que tiveram copy cortado pela refundação tipográfica A5.
  const [manifestQr, setManifestQr] = useState<string>('');
  const [benchmarkQr, setBenchmarkQr] = useState<string>('');
  const [differentialsQr, setDifferentialsQr] = useState<string>('');
  const [guaranteeQr, setGuaranteeQr] = useState<string>('');
  // pageId atualmente aberto no editor (ou null se nenhum).
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const totalPages = TOTAL_PAGES;

  /**
   * Gera todos os QR codes na montagem da tela — antes precisava clicar
   * "Gerar Catálogo" pra eles aparecerem, mas o PageEditor já mostra o
   * preview vivo e o usuário precisa ver os QRs lá. Os mesmos QRs são
   * reutilizados quando o usuário gera o PDF.
   *
   * Roda uma vez por sessão (sem deps); QRCode.toDataURL é determinístico
   * pra mesma URL, então não há motivo pra regenerar a cada render.
   */
  useEffect(() => {
    let cancelled = false;
    const qrOpts = {
      errorCorrectionLevel: 'H' as const,
      margin: 1,
      width: 600,
      color: { dark: '#050505', light: '#ffffff' },
    };
    (async () => {
      try {
        const qrMain = await QRCode.toDataURL(catalogMeta.baseUrl, qrOpts);
        if (cancelled) return;
        setQrDataUrl(qrMain);

        const productEntries = await Promise.all(
          productLines.map(async (line) => [
            line.slug,
            await QRCode.toDataURL(productUrl(line.slug), qrOpts),
          ] as const)
        );
        if (cancelled) return;
        setProductQrs(Object.fromEntries(productEntries));

        const [manifestData, benchmarkData, diffData, guaranteeData] = await Promise.all([
          QRCode.toDataURL(catalogMeta.manifestUrl, qrOpts),
          QRCode.toDataURL(catalogMeta.benchmarkUrl, qrOpts),
          QRCode.toDataURL(catalogMeta.differentialsUrl, qrOpts),
          QRCode.toDataURL(`${catalogMeta.baseUrl}/garantia`, qrOpts),
        ]);
        if (cancelled) return;
        setManifestQr(manifestData);
        setBenchmarkQr(benchmarkData);
        setDifferentialsQr(diffData);
        setGuaranteeQr(guaranteeData);
      } catch (err) {
        console.error('Falha ao pré-gerar QR codes:', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setFeedback(null);
    setProgress({ current: 0, total: totalPages, label: 'Gerando QR codes…' });

    try {
      // QR codes para impressão A5 (ETAPA 6 do checklist gráfico):
      //   errorCorrectionLevel: 'H' = 30% de recuperação. Default da
      //     biblioteca é 'M' (15%). Em catálogo impresso, manuseado,
      //     dobrado ou riscado, EC H sobrevive a falhas de impressão
      //     que destruiriam um QR EC M. Trade-off: ~30% mais módulos
      //     por mesma URL, padrão visual mais denso.
      //   margin: 1 = 1 módulo de quiet zone NO PNG. Os 4mm de quiet
      //     zone que a ISO/IEC 18004 recomenda são entregues via CSS
      //     padding 48px nos containers (.qrImg, .certQr, .backCoverQr,
      //     .backCoverCtaQr — ver ETAPA 2). Combinado dá ~5mm.
      //   width: 600 = oversampling. PNG 600px renderizado nos
      //     containers 144-316px no catálogo dá nitidez extra na
      //     rasterização do html2canvas.
      //   color dark #050505 (não puro #000) reduz halo no anti-alias
      //     ao redor dos módulos no JPEG do PDF; contraste sobre
      //     fundo #ffffff continua ~19:1 (WCAG AAA).
      const qrOpts = {
        errorCorrectionLevel: 'H',
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

      // QRs editoriais (manifesto, comparativo, diferenciais, garantia).
      const [manifestData, benchmarkData, diffData, guaranteeData] = await Promise.all([
        QRCode.toDataURL(catalogMeta.manifestUrl, qrOpts),
        QRCode.toDataURL(catalogMeta.benchmarkUrl, qrOpts),
        QRCode.toDataURL(catalogMeta.differentialsUrl, qrOpts),
        QRCode.toDataURL(`${catalogMeta.baseUrl}/garantia`, qrOpts),
      ]);
      setManifestQr(manifestData);
      setBenchmarkQr(benchmarkData);
      setDifferentialsQr(diffData);
      setGuaranteeQr(guaranteeData);

      await new Promise((r) => setTimeout(r, 250));

      if (!docRef.current) {
        throw new Error('Documento não montado.');
      }

      await generateCatalogPdf(docRef.current, {
        onProgress: (info) => setProgress(info)
      });

      setFeedback({
        type: 'success',
        msg: `PDF de ${totalPages} páginas gerado. Verifique sua pasta de Downloads.`
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

  // Contexto compartilhado com o PageEditor — o editor passa esses
  // valores adiante para os componentes de página renderizados no preview
  // (que precisam dos mesmos QRs e total de páginas que a versão final).
  const editorCtx: PageEditorContext = {
    qrDataUrl,
    productQrs,
    manifestQr,
    benchmarkQr,
    differentialsQr,
    guaranteeQr,
    totalPages,
  };

  return (
    <CatalogOverridesProvider>
    <div className={styles.wrap}>
      <div className={styles.heroCard}>
        <div className={styles.eyebrow}>FERRAMENTA INTERNA · PROVISÓRIA</div>
        <h2 className={styles.title}>
          GERADOR DE<br />
          CATÁLOGO FÍSICO NZPPF
        </h2>
        <p className={styles.subtitle}>
          Produza um PDF A5 (148 × 210 mm) de alta resolução pronto para impressão
          profissional, com sangria de 3 mm e marcas de corte. Clique em qualquer
          seção abaixo para editar texto, ocultar elementos e ajustar a escala da página.
        </p>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Formato</div>
            <div className={styles.metaValue}>A5 · 148 × 210 <strong>mm</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Sangria</div>
            <div className={styles.metaValue}>3 <strong>mm</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Resolução</div>
            <div className={styles.metaValue}>300 <strong>DPI</strong></div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Páginas</div>
            <div className={styles.metaValue}>{totalPages} <strong>pgs</strong></div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.generateBtn}
          onClick={() => handleGenerate()}
          disabled={generating}
          title="A5 + sangria 3 mm + marcas de corte + QRs clicáveis. Pronto para impressão e envio digital."
        >
          <span className={styles.btnIcon}>{generating ? '⌛' : '🖨️'}</span>
          {generating ? 'Gerando…' : `Gerar Catálogo (${totalPages}p)`}
        </button>
      </div>
      <div className={styles.actions}>
        <span className={styles.hint}>
          A5 · 300 DPI · sangria 3 mm · marcas de corte · QRs clicáveis.
          Tempo estimado: 25–45 segundos.
        </span>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? styles.successBox : styles.errorBox}>
          <strong>{feedback.type === 'success' ? 'CATÁLOGO GERADO' : 'FALHA NA GERAÇÃO'}</strong>
          {feedback.msg}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryTitle}>
          SEÇÕES INCLUÍDAS · {totalPages} PÁGINAS
          <span style={{
            fontSize: 11,
            opacity: 0.55,
            marginLeft: 12,
            letterSpacing: 1,
            textTransform: 'none',
            fontWeight: 400,
          }}>
            (clique para editar)
          </span>
        </div>
        <div className={styles.sectionList}>
          {sectionList.map((s) => (
            <button
              key={s.num}
              className={styles.sectionRow}
              type="button"
              onClick={() => setEditingPageId(s.pageId)}
              style={{
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                width: '100%',
                color: 'inherit',
                font: 'inherit',
              }}
              title={`Editar página ${s.num} · ${s.label}`}
            >
              <span><span className={styles.num}>{s.num}</span>{s.label}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 14 }}>›</span>
            </button>
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
      <CatalogDocument
        ref={docRef}
        qrDataUrl={qrDataUrl}
        productQrs={productQrs}
        manifestQrDataUrl={manifestQr}
        benchmarkQrDataUrl={benchmarkQr}
        differentialsQrDataUrl={differentialsQr}
        guaranteeQrDataUrl={guaranteeQr}
      />

      {generating && progress && (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayLabel}>Gerando catálogo NZPPF</div>
            <div className={styles.overlayDesc}>
              Renderizando cada página em 1819 × 2551 px (A5 + sangria 3 mm @ 300 DPI)
              e compondo o PDF. Por favor, aguarde — não feche esta aba.
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

      {/* Editor modal — abre quando o usuário clica numa seção. */}
      {editingPageId && (
        <PageEditor
          pageId={editingPageId}
          ctx={editorCtx}
          onClose={() => setEditingPageId(null)}
        />
      )}
    </div>
    </CatalogOverridesProvider>
  );
}
