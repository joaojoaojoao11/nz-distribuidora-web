import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './AdminSocialCarousel.module.css';
import SocialImageDocument from '../../components/SocialImage/SocialImageDocument';
import { generateSocialPng } from '../../components/SocialImage/generateSocialPng';
import {
  FORMAT_LABELS,
  LAYOUT_LABELS,
  LAYOUT_FIELD_KEYS,
  FIELD_LABELS,
  type SocialFormat,
  type SocialLayout,
  type SocialImageData,
  type SocialProduct,
  type SocialFieldKey,
  type SocialFieldOverrides,
} from '../../components/SocialImage/socialImageTypes';
import {
  generateBackgroundFromPrompt,
  generateCarouselContent,
} from '../../components/Agencia/oficinaApi';
import {
  loadProductCatalog,
  CATALOG_LABELS,
  BRAND_NAME_BY_CATALOG,
} from '../../components/Agencia/productSources';
import {
  TONE_LABELS,
  suggestCopy,
  suggestHashtags,
  buildBackgroundPrompt,
} from '../../components/SocialImage/socialCopyDefaults';
import {
  lookupLineProfile,
  type LineProfile,
} from '../../components/Agencia/lineProfiles';
import type {
  MotorSpec,
  ProductCatalog,
  SocialTone,
} from '../../components/Agencia/motorTypes';

const MIN_SLIDES = 3;
const MAX_SLIDES = 10;

const ALL_FIELD_KEYS: SocialFieldKey[] = [
  'wordmark',
  'lineBadge',
  'eyebrow',
  'badge',
  'headline',
  'subline',
  'stat',
  'statLabel',
  'cta',
  'footer',
];

/** Quais campos viram textarea (multilinha) vs input (uma linha). */
const MULTILINE_FIELDS: SocialFieldKey[] = ['headline', 'subline'];

interface SlideFieldValue {
  value: string;
  hidden: boolean;
}

interface CarouselSlide {
  id: string;
  layout: SocialLayout;
  fields: Record<SocialFieldKey, SlideFieldValue>;
  /**
   * `true` quando algum campo foi editado manualmente OU o slide foi gerado
   * pela IA. Enquanto for `false`, mudanças globais (tom, linha, layout)
   * recalculam os defaults e atualizam o slide automaticamente.
   */
  customized: boolean;
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

/** Calcula valor default de cada campo a partir do contexto atual. */
function buildDefaults(
  layout: SocialLayout,
  product: SocialProduct,
  tone: SocialTone,
  brandName: string
): Record<SocialFieldKey, string> {
  const s = suggestCopy(product.shortName, layout, tone, brandName);
  return {
    wordmark: brandName,
    lineBadge: product.shortName,
    eyebrow: product.subtitle,
    badge: s.badge || 'NOVO',
    headline: s.headline,
    subline: s.subline,
    stat: s.stat || '12 ANOS',
    statLabel: s.statLabel || 'DE GARANTIA REAL',
    cta: s.cta,
    footer: 'nzgroup.com.br',
  };
}

function makeSlideId(i: number): string {
  return `slide-${i}-${Math.random().toString(36).slice(2, 8)}`;
}

function newSlide(
  i: number,
  layout: SocialLayout,
  product: SocialProduct,
  tone: SocialTone,
  brandName: string
): CarouselSlide {
  const defaults = buildDefaults(layout, product, tone, brandName);
  const fields = {} as Record<SocialFieldKey, SlideFieldValue>;
  for (const key of ALL_FIELD_KEYS) {
    fields[key] = { value: defaults[key], hidden: false };
  }
  return { id: makeSlideId(i), layout, fields, customized: false };
}

function buildInitialSlides(
  count: number,
  product: SocialProduct,
  tone: SocialTone,
  brandName: string,
  configLayouts?: SocialLayout[]
): CarouselSlide[] {
  return Array.from({ length: count }, (_, i) =>
    newSlide(
      i,
      configLayouts?.[i] || defaultLayoutForSlot(i, count),
      product,
      tone,
      brandName
    )
  );
}

interface AdminSocialCarouselProps {
  motor?: MotorSpec;
}

export default function AdminSocialCarousel({ motor }: AdminSocialCarouselProps = {}) {
  const config = motor?.config.type === 'social-carousel' ? motor.config : undefined;
  const docRef = useRef<HTMLDivElement>(null);

  const productCatalog: ProductCatalog = config?.productCatalog || 'ppf';
  const productLabel = CATALOG_LABELS[productCatalog];
  const brandName = BRAND_NAME_BY_CATALOG[productCatalog];

  const initialFormat: SocialFormat = config?.defaultFormat || 'feed-1x1';
  const initialTone: SocialTone = config?.defaultTone || 'aspiracional';
  const initialCount = Math.min(
    Math.max(config?.defaultSlidesCount || 5, MIN_SLIDES),
    MAX_SLIDES
  );

  const placeholderProduct: SocialProduct = {
    slug: '',
    title: '—',
    shortName: '—',
    subtitle: '—',
    image: '',
    accent: '#D4AF37',
  };

  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSlug, setProductSlug] = useState<string>(config?.defaultProductSlug || '');
  const [format, setFormat] = useState<SocialFormat>(initialFormat);
  const [tone, setTone] = useState<SocialTone>(initialTone);
  const [slidesCount, setSlidesCount] = useState(initialCount);
  const [slides, setSlides] = useState<CarouselSlide[]>(() =>
    buildInitialSlides(initialCount, placeholderProduct, initialTone, brandName, config?.defaultSlideLayouts)
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [exporting, setExporting] = useState(false);

  // AI background — compartilhado entre todos os slides do carrossel
  const [aiBackground, setAiBackground] = useState<string | undefined>(undefined);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // AI copy — gera headline/subline/CTA pra todos os slides
  const [aiCopyExtraInstructions, setAiCopyExtraInstructions] = useState('');
  const [aiCopyGenerating, setAiCopyGenerating] = useState(false);
  const [aiCopyError, setAiCopyError] = useState('');
  const [aiCopyOk, setAiCopyOk] = useState(false);
  const [factsExpanded, setFactsExpanded] = useState(false);

  // Carrega catálogo de produtos (sync pra PPF, async via Supabase pra Oracal)
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    loadProductCatalog(productCatalog).then((list) => {
      if (cancelled) return;
      setProducts(list);
      setProductSlug((current) => {
        if (list.find((p) => p.slug === current)) return current;
        return list[0]?.slug || '';
      });
      setProductsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productCatalog]);

  const product: SocialProduct =
    products.find((p) => p.slug === productSlug) || products[0] || placeholderProduct;
  const accent = config?.accent || product.accent || '#D4AF37';

  // Perfil canônico da linha (cars + fatos verificáveis) — alimentado nos
  // prompts da IA (texto e imagem) pra evitar invencionices.
  const lineProfile: LineProfile | null = useMemo(
    () => lookupLineProfile(product.slug, productCatalog),
    [product.slug, productCatalog]
  );

  // Reconcilia slides quando a quantidade muda — preserva edições existentes.
  useEffect(() => {
    setSlides((current) => {
      if (current.length === slidesCount) return current;
      if (current.length > slidesCount) return current.slice(0, slidesCount);
      const added: CarouselSlide[] = [];
      for (let i = current.length; i < slidesCount; i++) {
        const layout = defaultLayoutForSlot(i, slidesCount);
        added.push(newSlide(i, layout, product, tone, brandName));
      }
      return [...current, ...added];
    });
    setActiveIdx((idx) => Math.min(idx, slidesCount - 1));
  }, [slidesCount, product, tone, brandName]);

  // Sync de defaults quando produto/tom/marca mudam: slides NÃO-customizados
  // se atualizam pra refletir a nova linha/tom; slides customizados ficam
  // intocados (preservam edição manual ou copy gerada pela IA).
  useEffect(() => {
    setSlides((current) =>
      current.map((s) => {
        if (s.customized) return s;
        const defaults = buildDefaults(s.layout, product, tone, brandName);
        const newFields = {} as Record<SocialFieldKey, SlideFieldValue>;
        for (const key of ALL_FIELD_KEYS) {
          newFields[key] = { value: defaults[key], hidden: s.fields[key]?.hidden ?? false };
        }
        return { ...s, fields: newFields };
      })
    );
  }, [product, tone, brandName]);

  const isLocked = (field: 'format' | 'productSlug' | 'tone' | 'slidesCount'): boolean =>
    !!config?.lockedInputs?.includes(field);

  const activeSlide = slides[activeIdx] || slides[0];

  // Prompt automático de imagem usa o layout da capa + perfil da linha
  const autoAiPrompt = useMemo(
    () =>
      buildBackgroundPrompt(
        product,
        slides[0]?.layout || 'announce-badge',
        tone,
        brandName,
        lineProfile
      ),
    [product, slides, tone, brandName, lineProfile]
  );
  const effectiveAiPrompt = aiExtraInstructions.trim()
    ? `${autoAiPrompt} Additional direction from user: ${aiExtraInstructions.trim()}.`
    : autoAiPrompt;

  /**
   * Constrói o `SocialImageData` que o renderer consome. Os fields do slide
   * viram fieldOverrides — o renderer respeita value+hidden direto.
   */
  function buildSlideData(slide: CarouselSlide): SocialImageData {
    const suggested = suggestCopy(product.shortName, slide.layout, tone, brandName);
    const visibleKeys = LAYOUT_FIELD_KEYS[slide.layout];
    const fieldOverrides: SocialFieldOverrides = {};
    for (const key of visibleKeys) {
      const f = slide.fields[key];
      if (f) {
        fieldOverrides[key] = { value: f.value, hidden: f.hidden };
      }
    }
    return {
      product,
      format,
      layout: slide.layout,
      tone,
      accent,
      brandName,
      aiBackground,
      copy: {
        ...suggested,
        // `copy` ainda é populado como fallback (caso alguém renderize
        // sem fieldOverrides). Os layouts atualizados leem fieldOverrides
        // primeiro via field().
        headline: slide.fields.headline?.value || suggested.headline,
        subline: slide.fields.subline?.value || suggested.subline,
        cta: slide.fields.cta?.value || suggested.cta,
      },
      fieldOverrides,
    };
  }

  const activeData = buildSlideData(activeSlide);

  const hashtags = useMemo(
    () => suggestHashtags(product.shortName, brandName, config?.hashtags),
    [product, brandName, config]
  );
  const firstHeadline =
    slides[0] && buildSlideData(slides[0]).copy.headline.replace(/\n/g, ' ');
  const fullCaption = `${firstHeadline}\n\nDeslize → para ver tudo.\n\n${hashtags.join(' ')}`;

  /** Atualiza a layout de um slide. Se !customized, reaplica defaults novos. */
  function updateSlideLayout(idx: number, layout: SocialLayout) {
    setSlides((current) =>
      current.map((s, i) => {
        if (i !== idx) return s;
        if (s.customized) return { ...s, layout };
        const defaults = buildDefaults(layout, product, tone, brandName);
        const newFields = {} as Record<SocialFieldKey, SlideFieldValue>;
        for (const key of ALL_FIELD_KEYS) {
          newFields[key] = { value: defaults[key], hidden: s.fields[key]?.hidden ?? false };
        }
        return { ...s, layout, fields: newFields };
      })
    );
  }

  /** Edição manual do texto de um campo. Marca o slide como customizado. */
  function setSlideFieldValue(idx: number, key: SocialFieldKey, value: string) {
    setSlides((current) =>
      current.map((s, i) =>
        i === idx
          ? {
              ...s,
              fields: { ...s.fields, [key]: { ...s.fields[key], value } },
              customized: true,
            }
          : s
      )
    );
  }

  /** Toggle de oculto. Marca como customizado pra preservar a escolha. */
  function toggleSlideFieldHidden(idx: number, key: SocialFieldKey) {
    setSlides((current) =>
      current.map((s, i) =>
        i === idx
          ? {
              ...s,
              fields: {
                ...s.fields,
                [key]: { ...s.fields[key], hidden: !s.fields[key].hidden },
              },
              customized: true,
            }
          : s
      )
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
   * Pede pro Claude gerar copy completo (headline/subline/CTA por slide)
   * com fatos verificáveis da linha como referência (anti-alucinação) e
   * com o segmento de carros associado pra contextualizar mentions. Marca
   * cada slide como `customized=true` pra preservar o resultado.
   */
  async function handleGenerateCopyAi() {
    if (!product.slug || !product.shortName || product.shortName === '—') {
      setAiCopyError('Selecione uma linha antes de gerar.');
      return;
    }
    setAiCopyGenerating(true);
    setAiCopyError('');
    setAiCopyOk(false);

    const result = await generateCarouselContent({
      brand: brandName,
      productShortName: product.shortName,
      productSubtitle: product.subtitle,
      tone,
      layouts: slides.map((s) => s.layout),
      extraInstructions: aiCopyExtraInstructions.trim() || undefined,
      factsContext: lineProfile?.factsContext,
      carBrands: lineProfile?.carBrands,
      segmentLabel: lineProfile?.segmentLabel,
    });

    if (!result.ok) {
      setAiCopyError(result.error);
      setAiCopyGenerating(false);
      return;
    }

    setSlides((current) =>
      current.map((s, i) => {
        const copy = result.slides[i];
        if (!copy) return s;
        return {
          ...s,
          fields: {
            ...s.fields,
            headline: { ...s.fields.headline, value: copy.headline },
            subline: { ...s.fields.subline, value: copy.subline },
            cta: { ...s.fields.cta, value: copy.cta },
          },
          customized: true,
        };
      })
    );
    setAiCopyOk(true);
    setAiCopyGenerating(false);
  }

  /** Reseta todos os slides pro modo automático (template + defaults). */
  function handleResetCopy() {
    setSlides((current) =>
      current.map((s) => {
        const defaults = buildDefaults(s.layout, product, tone, brandName);
        const newFields = {} as Record<SocialFieldKey, SlideFieldValue>;
        for (const key of ALL_FIELD_KEYS) {
          newFields[key] = { value: defaults[key], hidden: false };
        }
        return { ...s, fields: newFields, customized: false };
      })
    );
    setAiCopyOk(false);
    setAiCopyError('');
  }

  /**
   * Exporta todos os slides em sequência. Para cada slide muda o activeIdx
   * (que dirige a renderização off-screen via docRef), espera 2 frames pro
   * React commitar + browser pintar, e captura o PNG.
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

  const customizedCount = slides.filter((s) => s.customized).length;
  const visibleFieldKeys = LAYOUT_FIELD_KEYS[activeSlide.layout];

  return (
    <div className={styles.wrap}>
      <header className={styles.heroCard}>
        <div className={styles.eyebrow}>NZ GROUP · MOTOR SOCIAL</div>
        <h1 className={styles.title}>{motor?.metadata.title || 'Carrossel Social'}</h1>
        <p className={styles.subtitle}>
          {motor?.metadata.description ||
            'Carrossel multi-slide com identidade NZPPF. Cada texto da imagem é um campo editável e ocultável; a IA respeita os fatos reais da linha selecionada.'}
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
            <label className={styles.label}>{productLabel}</label>
            <select
              className={styles.input}
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              disabled={isLocked('productSlug') || exporting || productsLoading || products.length === 0}
            >
              {productsLoading && <option value="">Carregando…</option>}
              {!productsLoading && products.length === 0 && (
                <option value="">Nenhum produto encontrado</option>
              )}
              {products.map((p) => (
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

          {lineProfile && (
            <div className={styles.factsBox}>
              <button
                type="button"
                className={styles.factsToggle}
                onClick={() => setFactsExpanded((v) => !v)}
                aria-expanded={factsExpanded}
              >
                <span className={styles.factsChevron} aria-hidden="true">
                  {factsExpanded ? '▾' : '▸'}
                </span>
                <span>Anexo: contexto factual da linha</span>
                <span className={styles.factsBadge}>{lineProfile.shortName}</span>
              </button>
              {factsExpanded && (
                <div className={styles.factsContent}>
                  <div className={styles.factsRow}>
                    <strong>Carros do segmento:</strong> {lineProfile.carBrands}
                  </div>
                  <div className={styles.factsRow}>
                    <strong>Segmento:</strong> {lineProfile.segmentLabel}
                  </div>
                  <div className={styles.factsRow}>
                    <strong>Fatos verificáveis:</strong> {lineProfile.factsContext}
                  </div>
                  <small className={styles.fieldHint}>
                    Esse bloco é anexado automaticamente ao prompt da IA (texto + imagem) — ela é instruída a NÃO inventar specs nem citar carros fora dessa lista.
                  </small>
                </div>
              )}
            </div>
          )}

          <h2 className={styles.sectionTitle}>
            Texto dos slides
            <span
              className={styles.aiStatusPill}
              data-active={customizedCount > 0 ? 'true' : 'false'}
            >
              {customizedCount > 0
                ? `Customizado (${customizedCount}/${slidesCount})`
                : 'Auto'}
            </span>
          </h2>

          <small className={styles.fieldHint}>
            A IA escreve headline, subline e CTA pra todos os slides usando a
            linha + tom acima e respeitando os fatos verificáveis. Você pode
            editar cada campo manualmente depois — incluindo wordmark, badge,
            stat, footer etc. nas seções de cada slide.
          </small>

          <div className={styles.field}>
            <label className={styles.label}>Instruções extras (opcional)</label>
            <textarea
              className={styles.input}
              rows={3}
              placeholder='Ex: "foco em garantia, mencionar revenda autorizada no slide do meio"'
              value={aiCopyExtraInstructions}
              onChange={(e) => setAiCopyExtraInstructions(e.target.value)}
              maxLength={500}
              disabled={aiCopyGenerating || exporting}
            />
          </div>

          <div className={styles.aiActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGenerateCopyAi}
              disabled={
                aiCopyGenerating ||
                exporting ||
                productsLoading ||
                !product.slug ||
                product.shortName === '—'
              }
            >
              {aiCopyGenerating
                ? `Gerando ${slidesCount} slides…`
                : customizedCount > 0
                ? '↻ Regenerar com IA'
                : `✨ Gerar ${slidesCount} slides com IA`}
            </button>
            {customizedCount > 0 && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleResetCopy}
                disabled={aiCopyGenerating || exporting}
              >
                ✕ Voltar ao automático
              </button>
            )}
          </div>

          {aiCopyError && <div className={styles.aiError}>⚠️ {aiCopyError}</div>}
          {aiCopyOk && !aiCopyError && (
            <div className={styles.aiSuccess}>
              ✓ {slidesCount} slides preenchidos pela IA. Edite qualquer campo abaixo se quiser ajustar.
            </div>
          )}

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
              onChange={(e) => updateSlideLayout(activeIdx, e.target.value as SocialLayout)}
              disabled={exporting}
            >
              {(Object.keys(LAYOUT_LABELS) as SocialLayout[]).map((l) => (
                <option key={l} value={l}>{LAYOUT_LABELS[l]}</option>
              ))}
            </select>
            <small className={styles.fieldHint}>
              Cada layout tem um conjunto próprio de elementos — os campos
              abaixo refletem só os que esse layout renderiza.
            </small>
          </div>

          {visibleFieldKeys.map((key) => {
            const f = activeSlide.fields[key];
            const multiline = MULTILINE_FIELDS.includes(key);
            return (
              <div key={key} className={styles.field}>
                <div className={styles.fieldHeader}>
                  <label className={styles.label}>{FIELD_LABELS[key]}</label>
                  <button
                    type="button"
                    className={`${styles.eyeToggle} ${f.hidden ? styles.eyeToggleHidden : ''}`}
                    onClick={() => toggleSlideFieldHidden(activeIdx, key)}
                    disabled={exporting}
                    title={f.hidden ? 'Mostrar este campo' : 'Ocultar este campo na imagem'}
                    aria-pressed={f.hidden}
                  >
                    {f.hidden ? '🚫 Oculto' : '👁 Visível'}
                  </button>
                </div>
                {multiline ? (
                  <textarea
                    className={`${styles.input} ${f.hidden ? styles.inputDimmed : ''}`}
                    rows={2}
                    value={f.value}
                    onChange={(e) => setSlideFieldValue(activeIdx, key, e.target.value)}
                    disabled={exporting}
                  />
                ) : (
                  <input
                    className={`${styles.input} ${f.hidden ? styles.inputDimmed : ''}`}
                    value={f.value}
                    onChange={(e) => setSlideFieldValue(activeIdx, key, e.target.value)}
                    disabled={exporting}
                  />
                )}
              </div>
            );
          })}

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
              Gerado a partir de linha (carros típicos do segmento), tom e
              layout da capa. A mesma imagem é aplicada em todos os slides.
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
