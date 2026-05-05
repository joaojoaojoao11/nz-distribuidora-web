import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import styles from './PageEditor.module.css';
import catalogStyles from './Catalog.module.css';
import {
  getEditablePageById,
  type EditableField,
} from './pageEditableConfig';
import {
  useCatalogOverrides,
  type ElementOverride,
} from './useCatalogOverrides';
import { productLines } from './data/catalogData';
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

export interface PageEditorContext {
  qrDataUrl: string;
  productQrs: Record<string, string>;
  manifestQr: string;
  benchmarkQr: string;
  differentialsQr: string;
  guaranteeQr: string;
  totalPages: number;
}

interface PageEditorProps {
  pageId: string;
  ctx: PageEditorContext;
  onClose: () => void;
}

/** Mapeia pageId → JSX da página correspondente para o preview do editor. */
function renderPagePreview(pageId: string, ctx: PageEditorContext) {
  const { totalPages, qrDataUrl, productQrs, manifestQr, benchmarkQr, differentialsQr, guaranteeQr } = ctx;

  const productMatch = pageId.match(/^product:(.+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    const product = productLines.find((p) => p.slug === slug);
    if (!product) return null;
    const idx = productLines.indexOf(product);
    return (
      <ProductDetailPage
        pageNumber={4 + idx}
        totalPages={totalPages}
        product={product}
        imageSide={idx % 2 === 0 ? 'left' : 'right'}
        qrDataUrl={productQrs[slug] || ''}
      />
    );
  }

  const finishesMatch = pageId.match(/^finishes:(.+)$/);
  if (finishesMatch) {
    const slug = finishesMatch[1];
    const product = productLines.find((p) => p.slug === slug);
    if (!product) return null;
    const idx = productLines.indexOf(product);
    return (
      <FinishesPage
        pageNumber={5 + idx * 2}
        totalPages={totalPages}
        lineIndex={idx + 1}
        product={product}
      />
    );
  }

  switch (pageId) {
    case 'cover':
      return <CoverPage pageNumber={1} totalPages={totalPages} />;
    case 'manifest':
      return <ManifestPage pageNumber={2} totalPages={totalPages} qrDataUrl={manifestQr} />;
    case 'lines-overview':
      return <LinesOverviewPage pageNumber={3} totalPages={totalPages} />;
    case 'benchmark':
      return <BenchmarkPage pageNumber={10} totalPages={totalPages} qrDataUrl={benchmarkQr} />;
    case 'differentials':
      return <DifferentiatorsPage pageNumber={11} totalPages={totalPages} qrDataUrl={differentialsQr} />;
    case 'guarantee':
      return <GuaranteePage pageNumber={12} totalPages={totalPages} qrDataUrl={guaranteeQr || qrDataUrl} />;
    case 'closing':
      return <ClosingPage pageNumber={13} totalPages={totalPages} />;
    case 'backcover':
      return <BackCoverPage pageNumber={14} totalPages={totalPages} qrDataUrl={qrDataUrl} />;
    case 'ceoletter':
      return <CEOLetterPage pageNumber={15} totalPages={totalPages} />;
    default:
      return null;
  }
}

// Dimensões da página real (1819×2551 px @ 300 DPI = A5 + sangria 3 mm).
// O preview escala dinamicamente pra caber no previewCol sem rolar.
const PAGE_PX_W = 1819;
const PAGE_PX_H = 2551;

export default function PageEditor({ pageId, ctx, onClose }: PageEditorProps) {
  const config = useMemo(() => getEditablePageById(pageId), [pageId]);
  const { getPage, setElement, setPageScale, resetPage } = useCatalogOverrides();
  const pageOverrides = getPage(pageId);
  // Field key atualmente em foco — destacado tanto na lista quanto no preview.
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // Escala do preview: calculada a partir do tamanho do previewCol via
  // ResizeObserver. Garante que a página caiba inteira sem precisar
  // rolar nem fazer zoom-out no navegador.
  const [previewScale, setPreviewScale] = useState(0.4);
  const formColRef = useRef<HTMLDivElement>(null);
  const previewColRef = useRef<HTMLDivElement>(null);

  // Auto-fit do preview à coluna direita do modal. Recalcula em mudança
  // de viewport e em troca de página (caso layout difira).
  useEffect(() => {
    const el = previewColRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const PADDING = 48; // 24 px em cada lado de .previewCol
      const availW = Math.max(0, rect.width - PADDING);
      const availH = Math.max(0, rect.height - PADDING);
      if (availW === 0 || availH === 0) return;
      const sw = availW / PAGE_PX_W;
      const sh = availH / PAGE_PX_H;
      // Cap em 0.55 — acima disso o preview começa a competir com o
      // formulário sem ganho de leitura proporcional.
      const next = Math.min(sw, sh, 0.55);
      setPreviewScale(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageId]);

  // Esc fecha o modal — atalho rápido sem precisar mirar no botão.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Limpa o foco visual depois de 1.6s pra não ficar "travado".
  useEffect(() => {
    if (!focusedField) return;
    const id = window.setTimeout(() => setFocusedField(null), 1600);
    return () => window.clearTimeout(id);
  }, [focusedField]);

  if (!config) {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.headerEyebrow}>EDITOR</div>
              <div className={styles.headerLabel}>Página sem editor configurado</div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnGhost} onClick={onClose}>Fechar</button>
            </div>
          </div>
          <div className={styles.emptyState}>
            <p>Esta página ainda não tem campos editáveis registrados em pageEditableConfig.ts.</p>
            <p style={{ fontSize: 12, marginTop: 12, opacity: 0.6 }}>pageId: <code>{pageId}</code></p>
          </div>
        </div>
      </div>
    );
  }

  const handleTextChange = (field: EditableField, newText: string) => {
    const isDefault = newText === field.defaultValue;
    setElement(pageId, field.key, { text: isDefault ? undefined : newText });
  };

  const handleHideToggle = (field: EditableField) => {
    const currentlyHidden = pageOverrides.elements?.[field.key]?.hidden === true;
    setElement(pageId, field.key, { hidden: currentlyHidden ? undefined : true });
  };

  const handleReset = (field: EditableField) => {
    setElement(pageId, field.key, {
      text: undefined,
      hidden: undefined,
      fontScale: undefined,
      letterSpacing: undefined,
    });
  };

  /**
   * Ajusta o tamanho de fonte do campo individual em incrementos de 5%.
   * Faixa: 0.7 (–30%) a 1.5 (+50%) — clampada para evitar absurdos.
   * Quando volta exatamente a 1.0, o setElement remove o override
   * automaticamente (vide useCatalogOverrides.setElement).
   */
  const handleFontScaleAdjust = (field: EditableField, delta: number) => {
    const current = pageOverrides.elements?.[field.key]?.fontScale ?? 1;
    const next = Math.round((current + delta) * 100) / 100;
    const clamped = Math.max(0.7, Math.min(1.5, next));
    setElement(pageId, field.key, { fontScale: clamped });
  };

  /**
   * Ajusta o tracking (letter-spacing) em incrementos de 0.005em
   * (≈5 unidades Adobe). Faixa: −0.02em a +0.05em.
   * Em em pra escalar proporcionalmente à fonte — mesmo ratio
   * visual no preview e no PDF.
   */
  const handleLetterSpacingAdjust = (field: EditableField, delta: number) => {
    const current = pageOverrides.elements?.[field.key]?.letterSpacing ?? 0;
    const next = Math.round((current + delta) * 1000) / 1000;
    const clamped = Math.max(-0.02, Math.min(0.05, next));
    setElement(pageId, field.key, { letterSpacing: clamped });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageScale(pageId, Number(e.target.value));
  };

  const handleResetAll = () => {
    if (window.confirm('Resetar todas as edições desta página?')) {
      resetPage(pageId);
    }
  };

  /**
   * Captura clique no preview, identifica o data-edit-key mais próximo
   * e foca/scrolla o input correspondente no formulário. Pareia com o
   * `<EditableText>` que estampa data-edit-key="{pageId}|{fieldKey}" em
   * cada texto editável do design.
   */
  const handlePreviewClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const editEl = target.closest('[data-edit-key]') as HTMLElement | null;
    if (!editEl) return;
    const fullKey = editEl.dataset.editKey;
    if (!fullKey) return;
    const [, fieldKey] = fullKey.split('|');
    if (!fieldKey) return;
    setFocusedField(fieldKey);
    // Achar o input correspondente no form
    const input = formColRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-form-field-key="${CSS.escape(fieldKey)}"]`
    );
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Pequeno delay pra terminar o scroll antes de focar (evita jump duplo).
      setTimeout(() => input.focus({ preventScroll: true }), 280);
    }
  };

  const scale = pageOverrides.scale ?? 1;
  const scalePercent = Math.round(scale * 100);

  const previewNode = renderPagePreview(pageId, ctx);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerEyebrow}>EDITOR DE PÁGINA</div>
            <div className={styles.headerLabel}>{config.label}</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnDanger} onClick={handleResetAll}>
              Resetar página
            </button>
            <button className={styles.btnPrimary} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className={styles.formCol} ref={formColRef}>
          <div className={styles.scaleBlock}>
            <div className={styles.scaleHeader}>
              <div className={styles.scaleLabel}>Escala da página</div>
              <div className={styles.scaleValue}>{scalePercent}%</div>
            </div>
            <input
              className={styles.scaleRange}
              type="range"
              min={0.85}
              max={1.2}
              step={0.01}
              value={scale}
              onChange={handleScaleChange}
            />
            <div className={styles.scaleHint}>
              <span>−15%</span>
              <span style={{ opacity: scale === 1 ? 1 : 0.4 }}>100% (default)</span>
              <span>+20%</span>
            </div>
          </div>

          <div className={styles.fieldsTitle}>
            Campos editáveis ({config.fields.length})
            <span style={{
              float: 'right',
              fontSize: 10,
              fontWeight: 400,
              opacity: 0.65,
              letterSpacing: 1.5,
            }}>
              ↳ clique no preview
            </span>
          </div>

          {config.fields.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              override={pageOverrides.elements?.[field.key]}
              isFocused={focusedField === field.key}
              onTextChange={(v) => handleTextChange(field, v)}
              onHideToggle={() => handleHideToggle(field)}
              onReset={() => handleReset(field)}
              onFontScaleAdjust={(delta) => handleFontScaleAdjust(field, delta)}
              onLetterSpacingAdjust={(delta) => handleLetterSpacingAdjust(field, delta)}
            />
          ))}
        </div>

        <div className={styles.previewCol} ref={previewColRef}>
          <div
            className={styles.previewWrap}
            onClick={handlePreviewClick}
            style={{
              width: PAGE_PX_W * previewScale,
              height: PAGE_PX_H * previewScale,
            }}
          >
            {/* documentRoot CSS injeta os tokens tipográficos. Inline style
                sobrescreve a posição off-screen pra preview ficar visível
                e aplica o scale calculado dinamicamente. */}
            <div
              className={`${catalogStyles.documentRoot} ${styles.previewInner}`}
              data-focused-key={focusedField || undefined}
              style={{
                position: 'static',
                left: 0,
                top: 0,
                pointerEvents: 'auto',
                zIndex: 0,
                transform: `scale(${previewScale})`,
              }}
              lang="pt-BR"
            >
              {previewNode}
            </div>
            <div className={styles.previewLegend}>
              Preview · {Math.round(previewScale * 100)}% · clique em qualquer texto
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: EditableField;
  override?: ElementOverride;
  isFocused: boolean;
  onTextChange: (v: string) => void;
  onHideToggle: () => void;
  onReset: () => void;
  onFontScaleAdjust: (delta: number) => void;
  onLetterSpacingAdjust: (delta: number) => void;
}

function FieldRow({
  field,
  override,
  isFocused,
  onTextChange,
  onHideToggle,
  onReset,
  onFontScaleAdjust,
  onLetterSpacingAdjust,
}: FieldRowProps) {
  const value = override?.text ?? field.defaultValue;
  const isDirty = override?.text != null && override.text !== field.defaultValue;
  const isHidden = override?.hidden === true;
  const fontScale = override?.fontScale ?? 1;
  const fontScalePercent = Math.round(fontScale * 100);
  const fontScaleDirty = fontScale !== 1;
  // Tracking armazenado em em; UI mostra em "unidades Adobe" (×1000) pra
  // ficar inteiro: 0.005em → "+5", −0.010em → "−10". 0 = default.
  const letterSpacing = override?.letterSpacing ?? 0;
  const letterSpacingUnits = Math.round(letterSpacing * 1000);
  const letterSpacingDirty = letterSpacing !== 0;
  const letterSpacingDisplay = letterSpacingUnits === 0
    ? '0'
    : letterSpacingUnits > 0
      ? `+${letterSpacingUnits}`
      : String(letterSpacingUnits);
  const isElementField = field.type === 'element';

  const inputClass = [
    styles.input,
    isDirty ? styles.dirty : '',
    field.type === 'text-long' ? styles.textarea : '',
    isFocused ? styles.flash : '',
  ].filter(Boolean).join(' ');

  // Mostra "resetar" quando há QUALQUER override pendente (texto, hide,
  // tamanho ou tracking), pra dar ao usuário 1 clique pra voltar ao default.
  // Para campos type='element' não há texto — só hide/fontScale/tracking contam.
  const showReset = isElementField
    ? isHidden || fontScaleDirty || letterSpacingDirty
    : isDirty || isHidden || fontScaleDirty || letterSpacingDirty;

  return (
    <div className={`${styles.field} ${isHidden ? styles.fieldHidden : ''} ${isFocused ? styles.fieldFocused : ''}`}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <div className={styles.fieldChips}>
          {/* Controles de tamanho de fonte — A−/A+ ajustam ±5% no
              multiplicador `fontScale` da override. Esconde quando o
              campo está oculto (não faz sentido redimensionar invisível). */}
          {!isHidden && (
            <div className={styles.sizeStepper} role="group" aria-label="Tamanho da fonte">
              <button
                type="button"
                className={styles.sizeBtn}
                onClick={() => onFontScaleAdjust(-0.05)}
                disabled={fontScale <= 0.7}
                title="Diminuir fonte (−5%)"
              >
                A−
              </button>
              <span
                className={`${styles.sizeValue} ${fontScaleDirty ? styles.sizeValueDirty : ''}`}
                title={fontScaleDirty ? `${fontScalePercent}% (override)` : '100% (auto)'}
              >
                {fontScalePercent}%
              </span>
              <button
                type="button"
                className={styles.sizeBtn}
                onClick={() => onFontScaleAdjust(0.05)}
                disabled={fontScale >= 1.5}
                title="Aumentar fonte (+5%)"
              >
                A+
              </button>
            </div>
          )}
          {/* Controles de tracking (letter-spacing) — T−/T+ ajustam ±0.005em
              (≈±5 unidades Adobe). Em em pra escalar com o tamanho da
              fonte: mesmo ratio visual no preview e no PDF. Não faz sentido
              em type='element' (sem texto) nem oculto. */}
          {!isHidden && !isElementField && (
            <div className={styles.sizeStepper} role="group" aria-label="Espaçamento entre letras">
              <button
                type="button"
                className={styles.sizeBtn}
                onClick={() => onLetterSpacingAdjust(-0.005)}
                disabled={letterSpacing <= -0.02}
                title="Apertar letras (tracking −5)"
              >
                T−
              </button>
              <span
                className={`${styles.sizeValue} ${letterSpacingDirty ? styles.sizeValueDirty : ''}`}
                title={letterSpacingDirty ? `${letterSpacing}em (override)` : '0 (default — herda do CSS)'}
              >
                {letterSpacingDisplay}
              </span>
              <button
                type="button"
                className={styles.sizeBtn}
                onClick={() => onLetterSpacingAdjust(0.005)}
                disabled={letterSpacing >= 0.05}
                title="Soltar letras (tracking +5)"
              >
                T+
              </button>
            </div>
          )}
          {!field.noHide && (
            <button
              className={`${styles.chip} ${isHidden ? styles.chipActive : ''}`}
              onClick={onHideToggle}
              type="button"
            >
              {isHidden ? '✓ oculto' : 'ocultar'}
            </button>
          )}
          {showReset && (
            <button
              className={`${styles.chip} ${styles.chipDanger}`}
              onClick={onReset}
              type="button"
            >
              resetar
            </button>
          )}
        </div>
      </div>
      {isElementField ? (
        <div
          className={styles.elementHint}
          data-form-field-key={field.key}
          tabIndex={-1}
        >
          {field.defaultValue}
        </div>
      ) : field.type === 'text-long' ? (
        <textarea
          className={inputClass}
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          disabled={isHidden}
          data-form-field-key={field.key}
        />
      ) : (
        <input
          className={inputClass}
          type="text"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={isHidden}
          data-form-field-key={field.key}
        />
      )}
    </div>
  );
}
