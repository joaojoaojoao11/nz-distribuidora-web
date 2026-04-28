import { useState, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import CatalogDocument from '../../components/Catalog/CatalogDocument';
import {
  generateCatalogPdf,
  type ProgressInfo,
  type CatalogOutputMode
} from '../../components/Catalog/generateCatalogPdf';
import {
  TOTAL_PAGES,
  TOTAL_PAGES_COMPLETE,
  catalogMeta,
  productLines,
  productUrl,
  totalPagesFor,
  type CatalogMode
} from '../../components/Catalog/data/catalogData';
import styles from './AdminCatalog.module.css';

const standardSections = [
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

const completeSections = [
  { num: '01', label: 'Capa Editorial' },
  { num: '02', label: 'Manifesto NZPPF' },
  { num: '03', label: 'Visão Geral das 6 Linhas' },
  { num: '04', label: 'NZPPF Luxury Gloss' },
  { num: '05', label: 'Acabamentos Luxury' },
  { num: '06', label: 'NZPPF Prime Gloss' },
  { num: '07', label: 'Acabamentos Prime' },
  { num: '08', label: 'NZPPF Flow Gloss' },
  { num: '09', label: 'Acabamentos Flow' },
  { num: '10', label: 'NZPPF Core Gloss' },
  { num: '11', label: 'Acabamentos Core' },
  { num: '12', label: 'NZPPF Headlight' },
  { num: '13', label: 'Tonalidades Headlight' },
  { num: '14', label: 'NZPPF Windshield' },
  { num: '15', label: 'Comparativo de Performance' },
  { num: '16', label: 'Diferenciais Exclusivos' },
  { num: '17', label: 'Garantia · Certificado' },
  { num: '18', label: 'Posicionamento de Marca' },
  { num: '19', label: 'Contra-capa · QR' }
];

export default function AdminCatalog() {
  const [mode, setMode] = useState<CatalogMode>('standard');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [productQrs, setProductQrs] = useState<Record<string, string>>({});
  const docRef = useRef<HTMLDivElement>(null);

  const totalPages = totalPagesFor(mode);
  const sectionList = useMemo(
    () => (mode === 'complete' ? completeSections : standardSections),
    [mode]
  );

  const handleGenerate = async (outputMode: CatalogOutputMode = 'print') => {
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

      await new Promise((r) => setTimeout(r, 250));

      if (!docRef.current) {
        throw new Error('Documento não montado.');
      }

      await generateCatalogPdf(docRef.current, {
        outputMode,
        onProgress: (info) => setProgress(info)
      });

      const modeLabel =
        outputMode === 'print'   ? 'PRINT (gráfica)'
      : outputMode === 'digital' ? 'DIGITAL (envio)'
      :                            'PROOF (prova)';
      setFeedback({
        type: 'success',
        msg: `PDF ${modeLabel} de ${totalPages} páginas gerado. Verifique sua pasta de Downloads.`
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
          Produza um PDF A5 (148 × 210 mm) de alta resolução pronto para impressão
          profissional, com sangria de 3 mm e marcas de corte. Três versões disponíveis:
          PRINT (gráfica), DIGITAL (envio) e PROOF (aprovação).
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

      {/* Seletor de modo — Padrão (14) vs Completo (19) */}
      <div className={styles.modeSelector}>
        <div className={styles.modeSelectorLabel}>MODO DE GERAÇÃO</div>
        <div className={styles.modeOptions}>
          <label className={`${styles.modeOption} ${mode === 'standard' ? styles.modeOptionActive : ''}`}>
            <input
              type="radio"
              name="catalog-mode"
              value="standard"
              checked={mode === 'standard'}
              onChange={() => setMode('standard')}
              disabled={generating}
            />
            <div className={styles.modeOptionTitle}>CATÁLOGO PADRÃO</div>
            <div className={styles.modeOptionMeta}>{TOTAL_PAGES} páginas · Técnico essencial</div>
            <div className={styles.modeOptionDesc}>
              Apresentação direta das 6 linhas NZPPF com ficha técnica, arquitetura do filme
              e comparativo de performance.
            </div>
          </label>

          <label className={`${styles.modeOption} ${mode === 'complete' ? styles.modeOptionActive : ''}`}>
            <input
              type="radio"
              name="catalog-mode"
              value="complete"
              checked={mode === 'complete'}
              onChange={() => setMode('complete')}
              disabled={generating}
            />
            <div className={styles.modeOptionTitle}>COMPLETO COM ACABAMENTOS</div>
            <div className={styles.modeOptionMeta}>{TOTAL_PAGES_COMPLETE} páginas · Venda emocional</div>
            <div className={styles.modeOptionDesc}>
              Inclui página de acabamentos após cada linha (Luxury, Prime, Flow, Core, Headlight)
              com imagens e copy persuasiva por tonalidade.
            </div>
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.generateBtn}
          onClick={() => handleGenerate('print')}
          disabled={generating}
          title="A5 + sangria 3mm + crop marks. Para enviar à gráfica."
        >
          <span className={styles.btnIcon}>{generating ? '⌛' : '🖨️'}</span>
          {generating ? 'Gerando…' : `Gerar PRINT (${totalPages}p)`}
        </button>
        <button
          className={styles.generateBtn}
          onClick={() => handleGenerate('digital')}
          disabled={generating}
          title="A5 trim only, sem sangria/marcas, hyperlinks ativos. Para envio digital."
        >
          <span className={styles.btnIcon}>{generating ? '⌛' : '📱'}</span>
          {generating ? 'Gerando…' : `Gerar DIGITAL (${totalPages}p)`}
        </button>
        <button
          className={styles.generateBtn}
          onClick={() => handleGenerate('proof')}
          disabled={generating}
          title="Como PRINT mas com legenda 'NÃO PARA PRODUÇÃO'. Para aprovação."
        >
          <span className={styles.btnIcon}>{generating ? '⌛' : '🔍'}</span>
          {generating ? 'Gerando…' : `Gerar PROOF (${totalPages}p)`}
        </button>
      </div>
      <div className={styles.actions}>
        <span className={styles.hint}>
          Tempo estimado: {mode === 'complete' ? '25–45' : '15–30'} segundos por versão.
          PRINT/PROOF ~{mode === 'complete' ? '18–35' : '12–25'} MB · DIGITAL ~30% menor.
        </span>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? styles.successBox : styles.errorBox}>
          <strong>{feedback.type === 'success' ? 'CATÁLOGO GERADO' : 'FALHA NA GERAÇÃO'}</strong>
          {feedback.msg}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryTitle}>SEÇÕES INCLUÍDAS · {totalPages} PÁGINAS</div>
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
      <CatalogDocument ref={docRef} qrDataUrl={qrDataUrl} productQrs={productQrs} mode={mode} />

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
    </div>
  );
}
