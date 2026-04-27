import { useRef, useState, useMemo, useEffect } from 'react';
import styles from './AdminSocialImage.module.css';
import SocialImageDocument from '../../components/SocialImage/SocialImageDocument';
import { generateSocialPng } from '../../components/SocialImage/generateSocialPng';
import {
  FORMAT_LABELS,
  LAYOUT_LABELS,
  type SocialFormat,
  type SocialLayout,
  type SocialImageData,
  type SocialProduct,
} from '../../components/SocialImage/socialImageTypes';
import { generateBackgroundFromPrompt } from '../../components/Agencia/oficinaApi';
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
import type {
  MotorSpec,
  ProductCatalog,
  SocialTone,
} from '../../components/Agencia/motorTypes';

interface AdminSocialImageProps {
  motor?: MotorSpec;
}

export default function AdminSocialImage({ motor }: AdminSocialImageProps = {}) {
  const config = motor?.config.type === 'social-image' ? motor.config : undefined;
  const docRef = useRef<HTMLDivElement>(null);

  const productCatalog: ProductCatalog = config?.productCatalog || 'ppf';
  const productLabel = CATALOG_LABELS[productCatalog];
  const brandName = BRAND_NAME_BY_CATALOG[productCatalog];

  const initialFormat: SocialFormat = config?.defaultFormat || 'feed-1x1';
  const initialLayout: SocialLayout = config?.defaultLayout || 'hero-bottom-cta';
  const initialTone: SocialTone = config?.defaultTone || 'aspiracional';

  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSlug, setProductSlug] = useState<string>(config?.defaultProductSlug || '');
  const [format, setFormat] = useState<SocialFormat>(initialFormat);
  const [layout, setLayout] = useState<SocialLayout>(initialLayout);
  const [tone, setTone] = useState<SocialTone>(initialTone);
  const [headlineOverride, setHeadlineOverride] = useState('');
  const [sublineOverride, setSublineOverride] = useState('');
  const [ctaOverride, setCtaOverride] = useState('');
  const [generating, setGenerating] = useState(false);

  // AI background — efêmero, vive só nesta sessão. Não persiste no motor.
  const [aiBackground, setAiBackground] = useState<string | undefined>(undefined);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

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

  const product: SocialProduct = products.find((p) => p.slug === productSlug) || products[0] || {
    slug: '',
    title: '—',
    shortName: '—',
    subtitle: '—',
    image: '',
    accent: '#D4AF37',
  };
  const accent = config?.accent || product.accent || '#D4AF37';

  const suggested = useMemo(
    () => suggestCopy(product.shortName, layout, tone, brandName, config?.copyTemplates),
    [product, layout, tone, brandName, config]
  );

  const autoAiPrompt = useMemo(
    () => buildBackgroundPrompt(product, layout, tone, brandName),
    [product, layout, tone, brandName]
  );
  const effectiveAiPrompt = aiExtraInstructions.trim()
    ? `${autoAiPrompt} Additional direction from user: ${aiExtraInstructions.trim()}.`
    : autoAiPrompt;

  const data: SocialImageData = {
    product,
    format,
    layout,
    tone,
    accent,
    brandName,
    aiBackground,
    copy: {
      ...suggested,
      headline: headlineOverride.trim() || suggested.headline,
      subline: sublineOverride.trim() || suggested.subline,
      cta: ctaOverride.trim() || suggested.cta,
    },
  };

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

  const hashtags = useMemo(
    () => suggestHashtags(product.shortName, brandName, config?.hashtags),
    [product, brandName, config]
  );
  const fullCaption = `${data.copy.headline.replace(/\n/g, ' ')}\n\n${data.copy.subline}\n\n${hashtags.join(' ')}`;

  const isLocked = (field: 'format' | 'layout' | 'productSlug' | 'tone'): boolean =>
    !!config?.lockedInputs?.includes(field);

  async function handleExport() {
    if (!docRef.current) return;
    setGenerating(true);
    try {
      await generateSocialPng(
        docRef.current,
        format,
        `nzppf_${product.slug}_${format}_${layout}_${Date.now()}.png`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar imagem. Veja o console.');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopyCaption() {
    navigator.clipboard.writeText(fullCaption).then(
      () => alert('Caption copiada!'),
      () => alert('Não consegui copiar.')
    );
  }

  // Preview scale: 0.444 (480 / 1080). Pra Stories, altura escala junto.
  const previewScale = 0.444;
  const previewWidth = 1080 * previewScale;
  const previewHeight = (format === 'story-9x16' ? 1920 : 1080) * previewScale;

  return (
    <div className={styles.wrap}>
      <header className={styles.heroCard}>
        <div className={styles.eyebrow}>NZ GROUP · MOTOR SOCIAL</div>
        <h1 className={styles.title}>{motor?.metadata.title || 'Gerador de Imagem Social'}</h1>
        <p className={styles.subtitle}>
          {motor?.metadata.description ||
            'Configure formato, layout, linha e tom. Preview ao vivo. Baixa em PNG pronto pra publicar.'}
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.controls}>
          <h2 className={styles.sectionTitle}>Formato e layout</h2>

          <div className={styles.field}>
            <label className={styles.label}>Formato</label>
            <select
              className={styles.input}
              value={format}
              onChange={(e) => setFormat(e.target.value as SocialFormat)}
              disabled={isLocked('format')}
            >
              {(Object.keys(FORMAT_LABELS) as SocialFormat[]).map((f) => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Layout</label>
            <select
              className={styles.input}
              value={layout}
              onChange={(e) => setLayout(e.target.value as SocialLayout)}
              disabled={isLocked('layout')}
            >
              {(Object.keys(LAYOUT_LABELS) as SocialLayout[]).map((l) => (
                <option key={l} value={l}>{LAYOUT_LABELS[l]}</option>
              ))}
            </select>
          </div>

          <h2 className={styles.sectionTitle}>Conteúdo</h2>

          <div className={styles.field}>
            <label className={styles.label}>{productLabel}</label>
            <select
              className={styles.input}
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              disabled={isLocked('productSlug') || productsLoading || products.length === 0}
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
                  disabled={isLocked('tone')}
                >
                  {TONE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Copy (opcional)</h2>

          <div className={styles.field}>
            <label className={styles.label}>Headline</label>
            <textarea
              className={styles.input}
              rows={2}
              placeholder={suggested.headline}
              value={headlineOverride}
              onChange={(e) => setHeadlineOverride(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subline</label>
            <textarea
              className={styles.input}
              rows={2}
              placeholder={suggested.subline}
              value={sublineOverride}
              onChange={(e) => setSublineOverride(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CTA</label>
            <input
              className={styles.input}
              placeholder={suggested.cta}
              value={ctaOverride}
              onChange={(e) => setCtaOverride(e.target.value)}
            />
          </div>

          <h2 className={styles.sectionTitle}>
            Imagem de fundo
            <span className={styles.aiStatusPill} data-active={aiBackground ? 'true' : 'false'}>
              {aiBackground ? 'IA' : 'Foto do produto'}
            </span>
          </h2>

          <div className={styles.field}>
            <label className={styles.label}>Prompt automático (do contexto)</label>
            <div className={styles.autoPromptBox}>{autoAiPrompt}</div>
            <small className={styles.fieldHint}>
              Gerado a partir de linha, tom e layout. Atualiza sozinho ao mudar os inputs acima.
            </small>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Instruções extras (opcional)</label>
            <textarea
              className={styles.input}
              rows={3}
              placeholder='Ex: "carro Lamborghini Aventador preto fosco, garagem industrial à noite, neblina suave"'
              value={aiExtraInstructions}
              onChange={(e) => setAiExtraInstructions(e.target.value)}
              maxLength={800}
            />
            <small className={styles.fieldHint}>
              Adiciona detalhes específicos por cima do prompt automático sem reescrevê-lo.
            </small>
          </div>

          <div className={styles.aiActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGenerateBackground}
              disabled={aiGenerating}
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
                disabled={aiGenerating}
              >
                ✕ Voltar para foto do produto
              </button>
            )}
          </div>

          {aiError && (
            <div className={styles.aiError}>
              ⚠️ {aiError}
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={handleExport}
              disabled={generating}
            >
              {generating ? 'Gerando…' : 'Baixar PNG'}
            </button>
            <button className={styles.secondaryButton} onClick={handleCopyCaption}>
              Copiar caption
            </button>
          </div>
        </section>

        <section className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Preview</h2>
          <div className={styles.previewFrame}>
            <div
              className={styles.previewScale}
              style={{ width: previewWidth, height: previewHeight }}
            >
              <SocialImageDocument ref={docRef} data={data} />
              <div
                className={styles.previewVisible}
                style={{ transform: `scale(${previewScale})` }}
              >
                <SocialImageDocument data={data} />
              </div>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Caption sugerida</h2>
          <pre className={styles.captionBox}>{fullCaption}</pre>
        </section>
      </div>
    </div>
  );
}
