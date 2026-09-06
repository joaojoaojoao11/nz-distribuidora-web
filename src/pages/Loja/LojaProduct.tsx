// /loja/:slug — template ÚNICO de produto, para as 11 fontes do catálogo.
//
// Regra estrutural: cada bloco é uma função render* que devolve `null` quando o
// dado não existe. Nunca "Não informado", nunca skeleton permanente. É isso que
// permite o mesmo componente servir um padrão Etherna (foto, specs, sem cor),
// uma cor Oracal (hex, sem foto) e uma linha Avery (sem cor e sem foto) sem
// nenhum buraco no layout.

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { VERTICAL_LABEL } from '../../lib/shop/catalog';
import { getShopItem, useCatalogoEstado, useShopCatalog } from '../../lib/shop/store';
import { buildShopItemSchema } from '../../lib/shop/schema';
import { relatedItems } from '../../lib/shop/related';
import { COLOR_LABEL, SUBFAMILY_LABEL } from '../../lib/shop/color/lexicon';
import { FINISH_LABEL } from '../../lib/shop/finish/tree';
import type { MidiaPublica, ShopItem } from '../../lib/shop/types';
import Disponibilidade from './Disponibilidade';
import Preco from './Preco';
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
  // Assina o store: quando o catálogo do banco chegar, o item (ou o 404) é
  // recalculado. Sem isso um slug que só existe no ERP redirecionaria antes
  // de o JSON responder.
  useShopCatalog();
  const estado = useCatalogoEstado();
  const item = getShopItem(slug);

  // Slug inexistente: o edge devolve 404 real para crawlers; aqui só levamos o
  // visitante de volta à loja em vez de mostrar uma página quebrada. Enquanto
  // o banco não respondeu, não decide — o estático pode não ter o slug.
  if (!item) {
    if (estado === 'estatico' || estado === 'carregando') return null;
    return <Navigate to="/loja" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;
  return <ProductView item={item} backTo={from ?? '/loja'} viaHistorico={Boolean(from)} />;
}

function ProductView({
  item,
  backTo,
  viaHistorico,
}: {
  item: ShopItem;
  backTo: string;
  /** Veio de um card da lista: voltar pelo histórico restaura posição e filtros. */
  viaHistorico: boolean;
}) {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);

  const related = useMemo(() => relatedItems(item), [item]);
  const gallery = item.gallery.length ? item.gallery : item.image ? [item.image] : [];
  // `media` só vem do catálogo do banco; as fontes estáticas continuam com as
  // URLs soltas de `gallery`. Um caminho só para renderizar os dois.
  const midias: MidiaPublica[] = useMemo(
    () =>
      item.media && item.media.length > 0
        ? item.media
        : gallery.map((url) => ({ tipo: 'imagem' as const, url, poster: null, alt: null, largura: null, altura: null, duracao: null })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.media, item.gallery, item.image]
  );

  // Trocar de produto volta para a primeira mídia.
  useEffect(() => {
    setActiveImage(0);
    setLightbox(false);
  }, [item.slug]);

  // Esc fecha a lupa; setas andam pela galeria.
  useEffect(() => {
    if (!lightbox) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setActiveImage((i) => Math.min(i + 1, midias.length - 1));
      if (e.key === 'ArrowLeft') setActiveImage((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [lightbox, midias.length]);

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
    if (midias.length > 0) {
      const atual = midias[Math.min(activeImage, midias.length - 1)];
      return (
        <div className={styles.mediaBlock}>
          <div className={styles.mainImageWrap}>
            {atual.tipo === 'imagem' ? (
              <button
                type="button"
                className={styles.ampliar}
                onClick={() => setLightbox(true)}
                aria-label="Ampliar imagem"
              >
                <img
                  src={atual.url}
                  alt={atual.alt ?? item.name}
                  className={styles.mainImage}
                  fetchPriority="high"
                  {...(atual.largura && atual.altura ? { width: atual.largura, height: atual.altura } : {})}
                />
              </button>
            ) : atual.tipo === 'video' ? (
              /* Curto, mudo e em laço: é vitrine, não cinema. O usuário liga o
                 som se quiser. */
              <video
                key={atual.url}
                src={atual.url}
                poster={atual.poster ?? undefined}
                className={styles.mainImage}
                controls
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <iframe
                key={atual.url}
                src={atual.url}
                title={atual.alt ?? item.name}
                className={styles.mainImage}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          {midias.length > 1 && (
            <div className={styles.thumbs}>
              {midias.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`${m.tipo === 'imagem' ? 'Imagem' : 'Vídeo'} ${i + 1} de ${midias.length}`}
                >
                  <img src={m.tipo === 'imagem' ? m.url : m.poster ?? m.url} alt="" loading="lazy" />
                  {m.tipo !== 'imagem' && <span className={styles.thumbVideo}>▶</span>}
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

          {item.kind !== 'linha' && (
            <Preco
              slug={item.slug}
              variante="pagina"
              produto={{ nome: item.name, codigo: item.code, imagem: item.image, hex: item.hex }}
            />
          )}

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
              Atendemos instaladores e revendas em todo o Brasil.
            </p>
          </div>

          <Disponibilidade slug={item.slug} nome={item.name} />

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
          {/* Com origem conhecida, volta pelo histórico (POP): a Loja lê a
              posição salva e devolve o usuário ao mesmo card. Sem origem (link
              direto, busca), o href continua sendo o fallback. */}
          <Link
            to={backTo}
            className={styles.back}
            onClick={
              viaHistorico
                ? (e) => {
                    e.preventDefault();
                    navigate(-1);
                  }
                : undefined
            }
          >
            ← VOLTAR PARA A LOJA
          </Link>
        </div>
      </div>

      {/* Lupa: a foto do rolo tem detalhe de textura que o card não mostra. */}
      {lightbox && midias[activeImage]?.tipo === 'imagem' && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" onClick={() => setLightbox(false)}>
          <button type="button" className={styles.lightboxFechar} onClick={() => setLightbox(false)} aria-label="Fechar">
            ×
          </button>
          <img
            src={midias[activeImage].url}
            alt={midias[activeImage].alt ?? item.name}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          {midias.length > 1 && (
            <div className={styles.lightboxNav} onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setActiveImage((i) => Math.max(i - 1, 0))} disabled={activeImage === 0} aria-label="Anterior">
                ‹
              </button>
              <span>
                {activeImage + 1} / {midias.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveImage((i) => Math.min(i + 1, midias.length - 1))}
                disabled={activeImage >= midias.length - 1}
                aria-label="Próxima"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
