// /loja/:slug — template ÚNICO de produto, para as 11 fontes do catálogo.
//
// Regra estrutural: cada bloco é uma função render* que devolve `null` quando o
// dado não existe. Nunca "Não informado", nunca skeleton permanente. É isso que
// permite o mesmo componente servir um padrão Etherna (foto, specs, sem cor),
// uma cor Oracal (hex, sem foto) e uma linha Avery (sem cor e sem foto) sem
// nenhum buraco no layout.

import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { getShopItem, VERTICAL_LABEL } from '../../lib/shop/catalog';
import { buildShopItemSchema } from '../../lib/shop/schema';
import { relatedItems } from '../../lib/shop/related';
import { COLOR_LABEL, SUBFAMILY_LABEL } from '../../lib/shop/color/lexicon';
import { FINISH_LABEL } from '../../lib/shop/finish/tree';
import type { ShopItem } from '../../lib/shop/types';
import Disponibilidade from './Disponibilidade';
import PrazoEntrega from './PrazoEntrega';
import { ShopCard } from './ShopCard';
import styles from './LojaProduct.module.css';

const VERTICAL_PATH: Record<string, string> = {
  PPF: '/ppf',
  WRAP: '/wrap',
  SIGN: '/sign',
  DECOR: '/decor',
};

function whatsappUrl(item: ShopItem): string {
  const codigo = item.code ? ` (${item.code})` : '';
  const texto = `Olá, tenho interesse em ${item.name}${codigo} — ${item.brand}. Pode me passar disponibilidade e orçamento?`;
  return `https://wa.me/5511920707565?text=${encodeURIComponent(texto)}`;
}

export default function LojaProduct() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const item = getShopItem(slug);

  // Slug inexistente: o edge devolve 404 real para crawlers; aqui só levamos o
  // visitante de volta à loja em vez de mostrar uma página quebrada.
  if (!item) return <Navigate to="/loja" replace />;

  return <ProductView item={item} backTo={(location.state as { from?: string } | null)?.from ?? '/loja'} />;
}

function ProductView({ item, backTo }: { item: ShopItem; backTo: string }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);

  const related = useMemo(() => relatedItems(item), [item]);
  const gallery = item.gallery.length ? item.gallery : item.image ? [item.image] : [];

  const copyHex = async () => {
    if (!item.hex) return;
    try {
      await navigator.clipboard.writeText(item.hex.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard bloqueado (contexto inseguro, permissão negada): silencioso —
      // o hex está visível na tela de qualquer forma.
    }
  };

  function renderMedia() {
    if (gallery.length > 0) {
      return (
        <div className={styles.mediaBlock}>
          <div className={styles.mainImageWrap}>
            <img
              src={gallery[Math.min(activeImage, gallery.length - 1)]}
              alt={item.name}
              className={styles.mainImage}
              fetchPriority="high"
            />
          </div>
          {gallery.length > 1 && (
            <div className={styles.thumbs}>
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Imagem ${i + 1} de ${gallery.length}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.hex) {
      return (
        <div className={styles.mediaBlock}>
          <div className={styles.colorPanel} style={{ background: item.hex }}>
            <div className={styles.colorPanelInfo}>
              <span className={styles.colorPanelHex}>{item.hex.toUpperCase()}</span>
              <button type="button" className={styles.copyHex} onClick={copyHex}>
                {copied ? 'COPIADO' : 'COPIAR HEX'}
              </button>
            </div>
          </div>
          <p className={styles.colorNote}>
            Referência aproximada de cor. A amostra física é a única referência fiel — enviamos
            junto com o orçamento.
          </p>
        </div>
      );
    }

    // Sem foto e sem hex: linhas Avery e NZPPF. Bloco tipográfico em vez de um
    // quadrado cinza vazio.
    return (
      <div className={styles.mediaBlock}>
        <div className={styles.brandPanel}>
          <span className={styles.brandPanelBrand}>{item.brand}</span>
          <span className={styles.brandPanelLine}>{item.line}</span>
        </div>
      </div>
    );
  }

  function renderChips() {
    const chips: { key: string; label: string }[] = [];
    for (const sub of item.colorSubfamilies) {
      chips.push({ key: `s-${sub}`, label: SUBFAMILY_LABEL[sub] });
    }
    for (const fam of item.colorFamilies) {
      const label = COLOR_LABEL[fam];
      if (!chips.some((c) => c.label === label)) chips.push({ key: `c-${fam}`, label });
    }
    for (const f of item.finishes) chips.push({ key: `f-${f}`, label: FINISH_LABEL[f] });
    if (!chips.length) return null;

    return (
      <div className={styles.chips}>
        {chips.map((c) => (
          <span key={c.key} className={styles.chip}>
            {c.label}
          </span>
        ))}
        {item.colorConfidence === 'inferida' && (
          <span
            className={styles.chipEstimated}
            title="Família de cor estimada a partir da imagem oficial — o fabricante não publica valor de cor para esta linha."
          >
            cor estimada
          </span>
        )}
      </div>
    );
  }

  function renderSpecs() {
    // Fontes sem `specs` (as 116 cores do banco) ganham ficha sintética do que
    // existir. Só some se não sobrar nenhuma linha.
    const specs = item.specs.length
      ? item.specs
      : [
          ...(item.code ? [{ label: 'Código', value: item.code }] : []),
          ...(item.finishLabel ? [{ label: 'Acabamento', value: item.finishLabel }] : []),
          ...(item.hex ? [{ label: 'Hex aproximado', value: item.hex.toUpperCase() }] : []),
          ...(item.durabilidadeAnos
            ? [{ label: 'Durabilidade', value: `${item.durabilidadeAnos} anos` }]
            : []),
          ...(item.garantiaAnos ? [{ label: 'Garantia', value: `${item.garantiaAnos} anos` }] : []),
          { label: 'Marca', value: item.brand },
        ];

    if (!specs.length) return null;

    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ficha técnica</h2>
        <dl className={styles.specs}>
          {specs.map((s) => (
            <div key={`${s.label}-${s.value}`} className={styles.specRow}>
              <dt className={styles.specLabel}>{s.label}</dt>
              <dd className={styles.specValue}>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  const descricao =
    item.description?.slice(0, 155) ||
    `${item.name}${item.code ? ` (${item.code})` : ''} — ${item.line ?? item.brand}. Distribuição e consultoria técnica NZ Group. Valores sob consulta.`;

  return (
    <div className={styles.page}>
      <SEO
        title={`${item.name}${item.code ? ` · ${item.code}` : ''} — ${item.line ?? item.brand}`}
        description={descricao}
        canonicalUrl={`/loja/${item.slug}`}
        type="product"
        schema={buildShopItemSchema(item)}
        imageUrl={item.image ? `${SITE_URL}${item.image}` : undefined}
      />

      <div className={`container ${styles.head}`}>
        <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
          <Link to="/loja">LOJA</Link>
          <span className={styles.sep}>·</span>
          <Link to={VERTICAL_PATH[item.vertical]}>{VERTICAL_LABEL[item.vertical]}</Link>
          <span className={styles.sep}>·</span>
          <span className={styles.current}>{item.name}</span>
        </nav>
      </div>

      <div className={`container ${styles.layout}`}>
        {renderMedia()}

        <div className={styles.info}>
          <span className={styles.lineLabel}>{item.line ?? item.brand}</span>
          <h1 className={styles.title}>{item.name}</h1>
          {item.code && <span className={styles.code}>{item.code}</span>}

          {renderChips()}

          {item.description && <p className={styles.description}>{item.description}</p>}

          <div className={styles.ctaBlock}>
            <a
              href={whatsappUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              PEDIR ORÇAMENTO
            </a>
            <p className={styles.ctaNote}>
              Valores sob consulta. Atendemos instaladores e revendas em todo o Brasil.
            </p>
          </div>

          <Disponibilidade slug={item.slug} />

          <PrazoEntrega slug={item.sourceId} lineKey={item.lineKey} />

          {item.badges.length > 0 && (
            <ul className={styles.badges}>
              {item.badges.map((b) => (
                <li key={b} className={styles.badge}>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`container ${styles.body}`}>
        {renderSpecs()}

        {related.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Relacionados</h2>
            <div className={styles.relatedGrid}>
              {related.map((r) => (
                <ShopCard key={r.slug} item={r} />
              ))}
            </div>
          </section>
        )}

        <div className={styles.backWrap}>
          <Link to={backTo} className={styles.back}>
            ← VOLTAR PARA A LOJA
          </Link>
        </div>
      </div>
    </div>
  );
}
