import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './AdminSocialCarousel.module.css';
import SocialImageDocument from '../../components/SocialImage/SocialImageDocument';
import { generateSocialPng } from '../../components/SocialImage/generateSocialPng';
import {
  FORMAT_LABELS,
  LAYOUT_LABELS,
  type SocialFormat,
  type SocialLayout,
  type SocialImageData,
} from '../../components/SocialImage/socialImageTypes';
import { productLines } from '../../components/Catalog/data/catalogData';
import { generateBackgroundFromPrompt } from '../../components/Agencia/oficinaApi';
import {
  TONE_LABELS,
  suggestCopy,
  suggestHashtags,
  buildBackgroundPrompt,
} from '../../components/SocialImage/socialCopyDefaults';
import type { MotorSpec, SocialTone } from '../../components/Agencia/motorTypes';

const MIN_SLIDES = 3;
const MAX_SLIDES = 10;

interface CarouselSlide {
  id: string;
  layout: SocialLayout;
  headlineOverride: string;
  sublineOverride: string;
  ctaOverride: string;
}

/**
 * Sequência opinada de layouts por slide. Capa anuncia, meio varia,
 * fechamento sempre tem CTA. Garante ritmo visual no carrossel.
 */
function defaultLayoutForSlot(slot: number, total: number): SocialLayout {
  if (slot === 0) return 'announce-badge';
  if (slot === total - 1) return 'hero-bottom-cta';
  const middle: SocialLayout[] = [
    'stat-driven',
    'centered-quote',
    'split-photo',
    'full-bleed-headline',
  ];
  return middle[(slot - 1) % middle.length];
}

function buildInitialSlides(
  count: number,
  configLayouts?: SocialLayout[]
): CarouselSlide[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `slide-${i}-${Math.random().toString(36).slice(2, 8)}`,
    layout: configLayouts?.[i] || defaultLayoutForSlot(i, count),
    headlineOverride: '',
    sublineOverride: '',
    ctaOverride: '',
  }));
}

interface AdminSocialCarouselProps {
  motor?: MotorSpec;
}

export default function AdminSocialCarousel({ motor }: AdminSocialCarouselProps = {}) {
  const config = motor?.config.type === 'social-carousel' ? motor.config : undefined;
  const docRef = useRef<HTMLDivElement>(null);

  const initialFormat: SocialFormat = config?.defaultFormat || 'feed-1x1';
  const initialProductSlug = config?.defaultProductSlug || productLines[0].slug;
  const initialTone: SocialTone = config?.defaultTone || 'aspiracional';
  const initialCount = Math.min(
    Math.max(config?.defaultSlidesCount || 5, MIN_SLIDES),
    MAX_SLIDES
  );

  const [productSlug, setProductSlug] = useState(initialProductSlug);
  const [format, setFormat] = useState<SocialFormat>(initialFormat);
  const [tone, setTone] = useState<SocialTone>(initialTone);
  const [slidesCount, setSlidesCount] = useState(initialCount);
  const [slides, setSlides] = useState<CarouselSlide[]>(() =>
    buildInitialSlides(initialCount, config?.defaultSlideLayouts)
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [exporting, setExporting] = useState(false);

  // AI background — compartilhado entre todos os slides do carrossel
  const [aiBackground, setAiBackground] = useState<string | undefined>(undefined);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const product = productLines.find((p) => p.slug === productSlug) || productLines[0];
  const accent = config?.accent || product.accent || '#D4AF37';

  // Reconcilia slides quando a quantidade muda — preserva edições nos slides existentes
  useEffect(() => {
    setSlides((current) => {
      if (current.length === slidesCount) return current;
      if (current.length > slidesCount) return current.slice(0, slidesCount);
      const added: CarouselSlide[] = [];
      for (let i = current.length; i < slidesCount; i++) {
        added.push({
          id: `slide-${i}-${Math.random().toString(36).slice(2, 8)}`,
          layout: defaultLayoutForSlot(i, slidesCount),
          headlineOverride: '',
          sublineOverride: '',
          ctaOverride: '',
        });
      }
      return [...current, ...added];
    });
    setActiveIdx((idx) => Math.min(idx, slidesCount - 1));
  }, [slidesCount]);

  const isLocked = (field: 'format' | 'productSlug' | 'tone' | 'slidesCount'): boolean =>
    !!config?.lockedInputs?.includes(field);

  const activeSlide = slides[activeIdx] || slides[0];

  const activeSuggested = useMemo(
    () => suggestCopy(product.shortName, activeSlide.layout, tone),
    [product, activeSlide.layout, tone]
  );

  // Prompt automático usa o layout da capa (slide 0) para definir a estética dominante
  const autoAiPrompt = useMemo(
    () => buildBackgroundPrompt(product, slides[0]?.layout || 'announce-badge', tone),
    [product, slides, tone]
  );
  const effectiveAiPrompt = aiExtraInstructions.trim()
    ? `${autoAiPrompt} Additional direction from user: ${aiExtraInstructions.trim()}.`
    : autoAiPrompt;

  function buildSlideData(slide: CarouselSlide): SocialImageData {
    const suggested = suggestCopy(product.shortName, slide.layout, tone);
    return {
      product,
      format,
      layout: slide.layout,
      tone,
      accent,
      aiBackground,
      copy: {
        ...suggested,
        headline: slide.headlineOverride.trim() || suggested.headline,
        subline: slide.sublineOverride.trim() || suggested.subline,
        cta: slide.ctaOverride.trim() || suggested.cta,
      },
    };
  }

  const activeData = buildSlideData(activeSlide);

  const hashtags = useMemo(
    () => suggestHashtags(product.shortName, config?.hashtags),
    [product, config]
  );
  const firstHeadline =
    slides[0] && buildSlideData(slides[0]).copy.headline.replace(/\n/g, ' ');
  const fullCaption = `${firstHeadline}\n\nDeslize → para ver tudo.\n\n${hashtags.join(' ')}`;

  function updateSlide(idx: number, patch: Partial<CarouselSlide>) {
    setSlides((current) =>
      current.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }

  async function handleGenerateBackground() {
    setAiGenerating(true);
    setAiError('');
    const result = await generateBackgroundFromPrompt(effectiveAiPrompt, format);
    if (!result.ok) {
      setAiError(result.error);
      setAiGenerating(false);
      return;
    }
    setAiBackground(result.imageBase64);
    setAiGenerating(false);
  }

  function handleClearBackground() {
    setAiBackground(undefined);
    setAiError('');
  }

  /**
   * Exporta todos os slides em sequência. Para cada slide muda o activeIdx
   * (que dirige a renderização off-screen via docRef), espera 2 frames pro
   * React commitar + browser pintar, e captura o PNG.
   *
   * Browsers podem pedir confirmação para múltiplos downloads na primeira
   * execução — comportamento esperado, basta o usuário liberar.
   */
  async function handleExportAll() {
    if (!docRef.current) return;
    setExporting(true);
    const previousIdx = activeIdx;
    try {
      for (let i = 0; i < slides.length; i++) {
        setActiveIdx(i);
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r()))
        );
        await new Promise((r) => setTimeout(r, 120));
        if (!docRef.current) break;
        const idxLabel = String(i + 1).padStart(2, '0');
        await generateSocialPng(
          docRef.current,
          format,
          `nzppf_carrossel_${product.slug}_slide_${idxLabel}.png`
        );
      }
    } finally {
      setActiveIdx(previousIdx);
      setExporting(false);
    }
  }

  function handleCopyCaption() {
    navigator.clipboard.writeText(fullCaption).then(
      () => alert('Caption copiada!'),
      () => alert('Não consegui copiar.')
    );
  }

  // Preview scale: 0.444 (480 / 1080) — mesmo do AdminSocialImage
  const previewScale = 0.444;
  const previewWidth = 1080 * previewScale;
  const previewHeight = (format === 'story-9x16' ? 1920 : 1080) * previewScale;

  return (
    <div className={styles.wrap}>
      <header className={styles.heroCard}>
        <div className={styles.eyebrow}>NZ GROUP · MOTOR SOCIAL</div>
        <h1 className={styles.title}>{motor?.metadata.title || 'Carrossel Social'}</h1>
        <p className={styles.subtitle}>
          {motor?.metadata.description ||
            'Carrossel multi-slide com identidade NZPPF. Linha, tom e formato são globais; cada slide tem layout e copy próprios. Exporte tudo em 1 clique.'}
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.controls}>
          <h2 className={styles.sectionTitle}>Estrutura</h2>

          <div className={styles.field}>
            <label className={styles.label}>Formato (todos os slides)</label>
            <select
              className={styles.input}
              value={format}
              onChange={(e) => setFormat(e.target.value as SocialFormat)}
              disabled={isLocked('format') || exporting}
            >
              {(Object.keys(FORMAT_LABELS) as SocialFormat[]).map((f) => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Quantidade de slides: <strong>{slidesCount}</strong>
            </label>
            <input
              type="range"
              min={MIN_SLIDES}
              max={MAX_SLIDES}
              step={1}
              value={slidesCount}
              onChange={(e) => setSlidesCount(Number(e.target.value))}
              disabled={isLocked('slidesCount') || exporting}
              className={styles.slider}
            />
            <small className={styles.fieldHint}>
              Mín. {MIN_SLIDES} · Máx. {MAX_SLIDES}. Ajustar a quantidade preserva edições nos slides existentes.
            </small>
          </div>

          <h2 className={styles.sectionTitle}>Conteúdo (global)</h2>

          <div className={styles.field}>
            <label className={styles.label}>Linha</label>
            <select
              className={styles.input}
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              disabled={isLocked('productSlug') || exporting}
            >
              {productLines.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tom</label>
            <div className={styles.chipGroup}>
              {(['tecnico', 'aspiracional', 'promocional'] as SocialTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.chip} ${tone === t ? styles.chipActive : ''}`}
                  onClick={() => setTone(t)}
                  disabled={isLocked('tone') || exporting}
                >
                  {TONE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <h2 className={styles.sectionTitle}>
            Slide {activeIdx + 1} de {slidesCount}
          </h2>

          <div className={styles.slideTabs}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.slideTab} ${i === activeIdx ? styles.slideTabActive : ''}`}
                onClick={() => setActiveIdx(i)}
                disabled={exporting}
                aria-label={`Ir para slide ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Layout deste slide</label>
            <select
              className={styles.input}
              value={activeSlide.layout}
              onChange={(e) =>
                updateSlide(activeIdx, { layout: e.target.value as SocialLayout })
              }
              disabled={exporting}
            >
              {(Object.keys(LAYOUT_LABELS) as SocialLayout[]).map((l) => (
                <option key={l} value={l}>{LAYOUT_LABELS[l]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Headline</label>
            <textarea
              className={styles.input}
              rows={2}
              placeholder={activeSuggested.headline}
              value={activeSlide.headlineOverride}
              onChange={(e) => updateSlide(activeIdx, { headlineOverride: e.target.value })}
              disabled={exporting}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subline</label>
            <textarea
              className={styles.input}
              rows={2}
              placeholder={activeSuggested.subline}
              value={activeSlide.sublineOverride}
              onChange={(e) => updateSlide(activeIdx, { sublineOverride: e.target.value })}
              disabled={exporting}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CTA</label>
            <input
              className={styles.input}
              placeholder={activeSuggested.cta}
              value={activeSlide.ctaOverride}
              onChange={(e) => updateSlide(activeIdx, { ctaOverride: e.target.value })}
              disabled={exporting}
            />
          </div>

          <h2 className={styles.sectionTitle}>
            Imagem de fundo
            <span className={styles.aiStatusPill} data-active={aiBackground ? 'true' : 'false'}>
              {aiBackground ? 'IA · todos os slides' : 'Foto do produto'}
            </span>
          </h2>

          <div className={styles.field}>
            <label className={styles.label}>Prompt automático (do contexto)</label>
            <div className={styles.autoPromptBox}>{autoAiPrompt}</div>
            <small className={styles.fieldHint}>
              Gerado a partir de linha, tom e layout da capa. A mesma imagem é aplicada em todos os slides.
            </small>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Instruções extras (opcional)</label>
            <textarea
              className={styles.input}
              rows={3}
              placeholder='Ex: "Lamborghini preto fosco em garagem industrial à noite, neblina suave"'
              value={aiExtraInstructions}
              onChange={(e) => setAiExtraInstructions(e.target.value)}
              maxLength={800}
              disabled={exporting}
            />
          </div>

          <div className={styles.aiActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGenerateBackground}
              disabled={aiGenerating || exporting}
            >
              {aiGenerating
                ? 'Gerando imagem…'
                : aiBackground
                ? '↻ Regenerar com IA'
                : '✨ Gerar imagem com IA'}
            </button>
            {aiBackground && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleClearBackground}
                disabled={aiGenerating || exporting}
              >
                ✕ Voltar para foto do produto
              </button>
            )}
          </div>

          {aiError && <div className={styles.aiError}>⚠️ {aiError}</div>}

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={handleExportAll}
              disabled={exporting}
            >
              {exporting ? `Gerando ${activeIdx + 1}/${slidesCount}…` : `Baixar ${slidesCount} slides`}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleCopyCaption}
              disabled={exporting}
            >
              Copiar caption
            </button>
          </div>

          <small className={styles.fieldHint}>
            Os slides baixam um após o outro. Na primeira vez o navegador pode pedir
            permissão para múltiplos downloads — basta liberar.
          </small>
        </section>

        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h2 className={styles.sectionTitle}>Preview · slide {activeIdx + 1}</h2>
            <div className={styles.previewNav}>
              <button
                type="button"
                className={styles.previewNavButton}
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0 || exporting}
                aria-label="Slide anterior"
              >
                ←
              </button>
              <span className={styles.previewNavLabel}>
                {activeIdx + 1} / {slidesCount}
              </span>
              <button
                type="button"
                className={styles.previewNavButton}
                onClick={() => setActiveIdx((i) => Math.min(slidesCount - 1, i + 1))}
                disabled={activeIdx === slidesCount - 1 || exporting}
                aria-label="Próximo slide"
              >
                →
              </button>
            </div>
          </div>

          <div className={styles.previewFrame}>
            <div
              className={styles.previewScale}
              style={{ width: previewWidth, height: previewHeight }}
            >
              <SocialImageDocument ref={docRef} data={activeData} />
              <div
                className={styles.previewVisible}
                style={{ transform: `scale(${previewScale})` }}
              >
                <SocialImageDocument data={activeData} />
              </div>
            </div>
          </div>

          <div className={styles.dotsRow}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''}`}
                onClick={() => setActiveIdx(i)}
                disabled={exporting}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Caption sugerida</h2>
          <pre className={styles.captionBox}>{fullCaption}</pre>
        </section>
      </div>
    </div>
  );
}
