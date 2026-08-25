import { forwardRef } from 'react';
import styles from './PpfPortfolio.module.css';
import { PORTFOLIO_SITE, type PpfPortfolioConfig } from './ppfPortfolioConfig';

/**
 * Portfólio imprimível NZPPF — serve tanto uma linha isolada quanto o
 * catálogo com todas elas.
 *
 * Cada `[data-portfolio-page]` vira uma página A4 do PDF
 * (ver generatePpfPortfolioPdf.ts).
 *
 * A regra é uniforme nos dois casos: renderiza as seções de cada linha
 * recebida e fecha com UMA única página "Fale com a NZ". Com uma linha só a
 * saída é exatamente o portfólio individual; com as seis é o catálogo
 * completo, que ganha também uma capa geral na frente.
 *
 * Os dados vêm de ppfPortfolioRegistry.ts, que por sua vez lê os módulos
 * <linha>Data.ts — os mesmos usados pelas páginas. Não há segunda cópia.
 */

export interface SpecRow {
  icon: string;
  info: string;
  spec: string;
  detalhe: string;
}

export interface BenchmarkRow {
  metric: string;
  desc: string;
  nz: number[];
  mercado: number[];
}

export interface DiferencialRow {
  icon: string;
  title: string;
  desc: string;
  accent: string;
  image: string;
}

export interface FinishRow {
  src: string;
  title: string;
  sub: string;
  tech?: string;
  soldOut?: boolean;
}

export interface PortfolioLineData {
  config: PpfPortfolioConfig;
  tabelaTecnica: SpecRow[];
  benchmarkData: BenchmarkRow[];
  diferenciais: DiferencialRow[];
  finishes?: FinishRow[];
}

export interface PpfPortfolioDocumentProps {
  /** Linhas cujas seções serão renderizadas NESTE root. */
  lines: PortfolioLineData[];
  /** Capa geral do catálogo. Só sai quando `allLines` tem mais de uma linha. */
  masterCover?: { title: string; tagline: string; image?: string };
  /**
   * O catálogo completo é gerado em pedaços — uma linha por vez, para não
   * manter ~41 páginas A4 vivas no DOM ao mesmo tempo. As props abaixo
   * permitem montar um pedaço mantendo a numeração corrida do documento
   * inteiro. Sem elas, o comportamento é o de um portfólio individual.
   */
  /** Página de contato, que fecha o documento. Padrão: true. */
  includeContact?: boolean;
  /** Todas as linhas do documento — contexto da capa geral e do contato. */
  allLines?: PortfolioLineData[];
  /** Número da primeira página deste pedaço e total do documento. */
  numbering?: { start: number; total: number };
}

/** Cor institucional, usada na capa geral e no contato do catálogo. */
const BRAND_ACCENT = '#D4AF37';
const BRAND_ACCENT_RGB = '212, 175, 55';
const MASTER_COVER_IMAGE = '/assets/images/nzppf_bento_background.png';

function lineHasFinishes(line: PortfolioLineData): boolean {
  return Boolean(line.config.finishesTitle && line.finishes && line.finishes.length > 0);
}

/**
 * `text-transform: uppercase` converte "μ" (mu minúsculo, U+03BC) em "Μ"
 * (Mu maiúsculo, U+039C) — visualmente idêntico a um "M" latino, o que faz
 * "190μ" virar "190M". Este helper isola o μ num span sem transform, para
 * manter a caixa alta do design sem estragar a micragem.
 */
function MuText({ children }: { children: string }) {
  if (!children.includes('μ')) return <>{children}</>;
  const parts = children.split('μ');
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span style={{ textTransform: 'none' }}>μ</span>}
        </span>
      ))}
    </>
  );
}

/** Gráfico de desgaste — estático (a versão da página usa framer-motion). */
function BenchmarkChart({
  item,
  index,
  years,
  accent,
  uid,
}: {
  item: BenchmarkRow;
  index: number;
  years: string[];
  accent: string;
  uid: string;
}) {
  // Geometria própria do portfólio. O gráfico da página é largo (~2.9:1)
  // porque ocupa um modal; aqui ele divide a A4 em 2×2, onde a caixa é quase
  // quadrada — daí um viewBox mais alto, para preencher em vez de flutuar.
  const VB_W = 660;
  const VB_H = 580;
  const X0 = 78;
  const X1 = 600;
  const Y_TOP = 70; // 100%
  const Y_BASE = 510; // 0%

  const n = Math.max(item.nz.length, 2);
  const px = (i: number) => X0 + i * ((X1 - X0) / (n - 1));
  const py = (v: number) => Y_BASE - (v / 100) * (Y_BASE - Y_TOP);
  const linePath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const areaPath = (data: number[]) => `${linePath(data)} L ${X1} ${Y_BASE} L ${X0} ${Y_BASE} Z`;

  // Nos extremos o texto centrado sairia do viewBox (direita) ou colidiria
  // com o rótulo do eixo Y (esquerda), então ancoramos para dentro.
  const anchorFor = (i: number): 'start' | 'middle' | 'end' =>
    i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';

  // Com 5 pontos os rótulos de valor ficam apertados; mostramos só as pontas.
  const showValue = (i: number) => n <= 3 || i === 0 || i === n - 1;

  // Os ids dos gradientes precisam ser únicos no documento inteiro: o
  // catálogo completo tem 6 linhas com os mesmos índices de métrica.
  const gid = `${uid}-${index}`;

  return (
    <div className={styles.chartBox}>
      <h4 className={styles.chartTitle}>{item.metric}</h4>
      <p className={styles.chartDesc}>{item.desc}</p>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={`pf-nz-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`pf-cm-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888888" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#888888" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={X0}
              y1={py(v)}
              x2={X1}
              y2={py(v)}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1.5"
              strokeDasharray={v === 0 ? 'none' : '5 5'}
            />
            <text x={X0 - 14} y={py(v) + 7} fill="#8b8b97" fontSize="19" fontFamily="monospace" textAnchor="end">
              {v}%
            </text>
          </g>
        ))}

        {years.slice(0, n).map((label, i) => (
          <text key={label} x={px(i)} y={Y_BASE + 40} fill="#a5a5b0" fontSize="20" textAnchor={anchorFor(i)}>
            {label}
          </text>
        ))}

        <path d={areaPath(item.mercado)} fill={`url(#pf-cm-${gid})`} />
        <path d={linePath(item.mercado)} fill="none" stroke="rgba(255,255,255,0.36)" strokeWidth="4" />
        <path d={areaPath(item.nz)} fill={`url(#pf-nz-${gid})`} />
        <path d={linePath(item.nz)} fill="none" stroke={accent} strokeWidth="5.5" />

        {item.mercado.map((v, i) => (
          <circle key={`c${i}`} cx={px(i)} cy={py(v)} r="7" fill="#888888" />
        ))}
        {item.nz.map((v, i) => (
          <g key={`n${i}`}>
            <circle cx={px(i)} cy={py(v)} r="9" fill={accent} stroke="#0d0d11" strokeWidth="3" />
            {showValue(i) && (
              <text
                x={px(i)}
                y={py(v) - 22}
                fill={accent}
                fontSize="21"
                fontWeight="700"
                textAnchor={anchorFor(i)}
              >
                {Math.round(v)}%
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

interface PageProps {
  pageNum: number;
  total: number;
  lineName: string;
  accent: string;
  accentRgb: string;
  title?: string;
  children: React.ReactNode;
  bare?: boolean;
}

/**
 * IMPORTANTE: precisa ficar em nível de módulo.
 *
 * Definir este componente dentro do corpo de PpfPortfolioDocument cria um
 * novo *tipo* de componente a cada render. Como o onProgress da geração
 * atualiza estado no botão a cada página, o documento re-renderiza no meio
 * da captura, o React desmonta e remonta toda a subárvore, e o html2canvas
 * fica com referências a nós que não existem mais — falhando com
 * "Unable to find element in cloned iframe" e gerando páginas em branco.
 *
 * A cor de destaque é aplicada por PÁGINA (e não no stage) para que, no
 * catálogo completo, cada linha mantenha a sua.
 */
function PortfolioPage({
  pageNum,
  total,
  lineName,
  accent,
  accentRgb,
  title,
  children,
  bare = false,
}: PageProps) {
  return (
    <div
      className={styles.page}
      data-portfolio-page={pageNum}
      style={{ '--pf-accent': accent, '--pf-accent-rgb': accentRgb } as React.CSSProperties}
    >
      {bare ? (
        children
      ) : (
        <div className={styles.pad}>
          <div className={styles.runningHead}>
            <span>{lineName}</span>
            <span>{title}</span>
          </div>
          {children}
          <div className={styles.footer}>
            <span>NZ Distribuidora · {PORTFOLIO_SITE}</span>
            <span>
              {pageNum} / {total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Capa geral do catálogo completo, com o índice das linhas. */
function MasterCoverPage({
  cover,
  lines,
  pageNum,
  total,
}: {
  cover: { title: string; tagline: string; image?: string };
  lines: PortfolioLineData[];
  pageNum: number;
  total: number;
}) {
  return (
    <PortfolioPage
      pageNum={pageNum}
      total={total}
      lineName="NZPPF"
      accent={BRAND_ACCENT}
      accentRgb={BRAND_ACCENT_RGB}
      bare
    >
      <div className={styles.coverImageWrap}>
        <img src={cover.image ?? MASTER_COVER_IMAGE} alt="" className={styles.coverImage} />
        <div className={styles.coverScrim} />
      </div>
      <div className={styles.pad}>
        <div className={styles.coverBody}>
          <p className={styles.eyebrow}>Catálogo Técnico · NZ Distribuidora</p>
          <h1 className={styles.h1}>{cover.title}</h1>
          <p className={styles.coverSub}>
            <MuText>{cover.tagline}</MuText>
          </p>
          <div className={styles.coverLineList}>
            {lines.map((l) => {
              const espessura = l.config.badges.find((b) => /espessura/i.test(b.label))?.value;
              const garantia = l.config.badges.find((b) => /garantia/i.test(b.label))?.value;
              const spec = [espessura, garantia].filter(Boolean).join(' · ');
              return (
                <div key={l.config.slug} className={styles.coverLineRow}>
                  <span className={styles.coverLineName} style={{ color: l.config.accent }}>
                    {l.config.name}
                  </span>
                  <span className={styles.coverLineSpec}>
                    <MuText>{spec}</MuText>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PortfolioPage>
  );
}

/**
 * As seções de UMA linha: capa, manifesto, tecnologia, diferenciais,
 * acabamentos, ficha e benchmark. A página de contato NÃO entra aqui — ela
 * é única e fecha o documento.
 */
function LineSections({
  line,
  numFor,
  total,
}: {
  line: PortfolioLineData;
  numFor: (key: string) => number;
  total: number;
}) {
  const { config, tabelaTecnica, benchmarkData, diferenciais, finishes } = line;
  const hasFinishes = lineHasFinishes(line);
  const k = (key: string) => `${config.slug}:${key}`;

  const pageProps = {
    total,
    lineName: config.name,
    accent: config.accent,
    accentRgb: config.accentRgb,
  };

  return (
    <>
      {/* CAPA DA LINHA */}
      <PortfolioPage {...pageProps} pageNum={numFor(k('capa'))} bare>
        <div className={styles.coverImageWrap}>
          <img src={config.heroImage} alt="" className={styles.coverImage} />
          <div className={styles.coverScrim} />
        </div>
        <div className={styles.pad}>
          <div className={styles.coverBody}>
            <p className={styles.eyebrow}>Portfólio Técnico · NZPPF</p>
            <h1 className={styles.h1}>{config.name}</h1>
            <p className={styles.coverSub}>
              <MuText>{config.tagline}</MuText>
            </p>
            <div className={styles.badgeRow}>
              {config.badges.map((b) => (
                <div key={b.label} className={styles.badge}>
                  <span className={styles.badgeValue}>{b.value}</span>
                  <span className={styles.badgeLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PortfolioPage>

      {/* MANIFESTO */}
      <PortfolioPage {...pageProps} pageNum={numFor(k('manifesto'))} title="A linha">
        <h2 className={styles.h2}>{config.manifesto.title}</h2>
        {config.manifesto.paragraphs.map((p, i) => (
          <p key={i} className={styles.lead}>
            {p}
          </p>
        ))}
        <div className={styles.quote}>
          <p>{config.manifesto.quote}</p>
        </div>
      </PortfolioPage>

      {/* TECNOLOGIA */}
      {config.tecnologia && (
        <PortfolioPage {...pageProps} pageNum={numFor(k('tecnologia'))} title="Tecnologia">
          <h2 className={styles.h2}>{config.tecnologia.title}</h2>
          <img src={config.tecnologia.layersImage} alt="" className={styles.techImage} />
          {config.tecnologia.camadas.map((layer, i) => (
            <div key={layer.name} className={styles.layerCard}>
              <span className={styles.layerNum}>0{i + 1}</span>
              <div>
                <h3 className={styles.layerName}>{layer.name}</h3>
                <p className={styles.layerDesc}>{layer.desc}</p>
              </div>
            </div>
          ))}
        </PortfolioPage>
      )}

      {/* DIFERENCIAIS */}
      <PortfolioPage {...pageProps} pageNum={numFor(k('diferenciais'))} title="Diferenciais">
        <h2 className={styles.h2}>Diferenciais</h2>
        <div className={styles.cardGrid}>
          {diferenciais.map((item) => (
            <div key={item.title} className={styles.card}>
              <div className={styles.cardImageWrap}>
                <img src={item.image} alt="" className={styles.cardImage} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
                <span className={styles.cardAccent}>
                  <MuText>{item.accent}</MuText>
                </span>
              </div>
            </div>
          ))}
        </div>
      </PortfolioPage>

      {/* ACABAMENTOS */}
      {hasFinishes && finishes && (
        <PortfolioPage {...pageProps} pageNum={numFor(k('acabamentos'))} title="Acabamentos">
          <h2 className={styles.h2}>{config.finishesTitle}</h2>
          <div className={styles.cardGrid}>
            {finishes.map((item) => (
              <div key={item.title} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <img src={item.src} alt="" className={styles.cardImage} />
                  {item.soldOut && (
                    <div className={styles.soldOutScrim}>
                      <span className={styles.soldOutStamp}>ESGOTADO</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>
                    {item.title}
                    {item.soldOut && <span className={styles.soldOutInline}>ESGOTADO</span>}
                  </h3>
                  <p className={styles.cardDesc}>{item.sub}</p>
                  {item.tech && <span className={styles.cardTech}>{item.tech}</span>}
                </div>
              </div>
            ))}
          </div>
        </PortfolioPage>
      )}

      {/* FICHA TÉCNICA */}
      <PortfolioPage {...pageProps} pageNum={numFor(k('ficha'))} title="Ficha técnica">
        <h2 className={styles.h2}>Ficha técnica</h2>
        <div className={`${styles.specRow} ${styles.specRowHead}`}>
          <span className={styles.specHeadCell}>Informações</span>
          <span className={styles.specHeadCell}>Especificação</span>
          <span className={styles.specHeadCell}>Detalhes</span>
        </div>
        {tabelaTecnica.map((row) => (
          <div key={row.info} className={styles.specRow}>
            <span className={styles.specInfo}>
              <img src={row.icon} alt="" className={styles.specIcon} />
              {row.info}
            </span>
            <span className={styles.specValue}>{row.spec}</span>
            <span className={styles.specDetail}>{row.detalhe}</span>
          </div>
        ))}
      </PortfolioPage>

      {/* BENCHMARK */}
      <PortfolioPage {...pageProps} pageNum={numFor(k('benchmark'))} title="Benchmark de performance">
        <h2 className={styles.h2}>{config.benchmarkTitle}</h2>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDotNz} /> {config.name}
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDotCm} /> Padrão de mercado
          </span>
        </div>
        <div className={styles.chartGrid}>
          {benchmarkData.map((item, i) => (
            <BenchmarkChart
              key={item.metric}
              item={item}
              index={i}
              uid={config.slug}
              years={config.benchmarkYears}
              accent={config.accent}
            />
          ))}
        </div>
      </PortfolioPage>
    </>
  );
}

/** Página final — única, tanto no portfólio individual quanto no catálogo. */
function ContactPage({
  lines,
  pageNum,
  total,
}: {
  lines: PortfolioLineData[];
  pageNum: number;
  total: number;
}) {
  const single = lines.length === 1 ? lines[0] : null;
  const accent = single ? single.config.accent : BRAND_ACCENT;
  const accentRgb = single ? single.config.accentRgb : BRAND_ACCENT_RGB;

  const soldOut = single?.finishes?.filter((f) => f.soldOut).length ?? 0;
  const inStock = (single?.finishes?.length ?? 0) - soldOut;

  const esgotadosNoCatalogo = lines.reduce(
    (acc, l) => acc + (l.finishes?.filter((f) => f.soldOut).length ?? 0),
    0
  );

  return (
    <PortfolioPage
      pageNum={pageNum}
      total={total}
      lineName={single ? single.config.name : 'NZPPF'}
      accent={accent}
      accentRgb={accentRgb}
      title="Contato"
    >
      <h2 className={styles.h2}>Fale com a NZ</h2>
      <p className={styles.lead}>
        A NZ Distribuidora é atacadista: vendemos para instaladores e estéticas automotivas. A garantia{' '}
        {single ? `do ${single.config.name}` : 'NZPPF'} só é emitida por instalador credenciado, que registra a
        apólice oficial com QR code no momento da aplicação.
      </p>
      <div className={styles.contactGrid}>
        <div className={styles.contactCard}>
          <p className={styles.contactLabel}>{single ? 'Página do produto' : 'Catálogo online'}</p>
          <p className={styles.contactValue}>
            {single ? `${PORTFOLIO_SITE}/ppf/${single.config.slug}` : `${PORTFOLIO_SITE}/ppf`}
          </p>
        </div>
        <div className={styles.contactCard}>
          <p className={styles.contactLabel}>Encontre um aplicador</p>
          <p className={styles.contactValue}>{PORTFOLIO_SITE}/encontre-aplicador</p>
        </div>
        <div className={styles.contactCard}>
          <p className={styles.contactLabel}>Endereço</p>
          <p className={styles.contactValue}>
            R. Brasilândia, 366 — Chácaras Marco
            <br />
            Barueri-SP, CEP 06419-060
          </p>
        </div>
        <div className={styles.contactCard}>
          <p className={styles.contactLabel}>Disponibilidade</p>
          <p className={styles.contactValue}>
            {single ? (
              soldOut > 0 ? (
                <>
                  {inStock} de {single.finishes?.length} acabamentos em estoque.
                  <br />
                  Demais sob consulta de reposição.
                </>
              ) : (
                <>
                  Linha ativa e disponível no atacado.
                  <br />
                  Consulte prazos e volumes com o comercial.
                </>
              )
            ) : (
              <>
                {lines.length} linhas ativas no atacado.
                {esgotadosNoCatalogo > 0 && (
                  <>
                    <br />
                    {esgotadosNoCatalogo} acabamentos sob consulta de reposição.
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>
      <p className={styles.disclaimer}>
        Documento gerado a partir das páginas oficiais dos produtos. Especificações e disponibilidade sujeitas a
        alteração — confirme com o comercial NZ antes de fechar pedido. A garantia NZPPF não cobre aplicações
        feitas por instaladores não credenciados.
      </p>
    </PortfolioPage>
  );
}

const PpfPortfolioDocument = forwardRef<HTMLDivElement, PpfPortfolioDocumentProps>(
  ({ lines, masterCover, includeContact = true, allLines, numbering }, ref) => {
    // Contexto do documento inteiro: no catálogo em pedaços, `lines` traz só
    // a linha da vez, mas capa geral e contato falam do conjunto.
    const contexto = allLines ?? lines;
    const showMaster = Boolean(masterCover && contexto.length > 1);

    // Páginas deste pedaço, na ordem em que aparecem.
    const pageKeys: string[] = [];
    if (showMaster) pageKeys.push('master');
    for (const line of lines) {
      const s = line.config.slug;
      pageKeys.push(`${s}:capa`, `${s}:manifesto`);
      if (line.config.tecnologia) pageKeys.push(`${s}:tecnologia`);
      pageKeys.push(`${s}:diferenciais`);
      if (lineHasFinishes(line)) pageKeys.push(`${s}:acabamentos`);
      pageKeys.push(`${s}:ficha`, `${s}:benchmark`);
    }
    if (includeContact) pageKeys.push('contato');

    const start = numbering?.start ?? 1;
    const total = numbering?.total ?? pageKeys.length;
    const offsets = new Map(pageKeys.map((k, i) => [k, start + i]));
    const numFor = (key: string) => offsets.get(key) ?? 0;

    return (
      <div className={styles.stage} ref={ref} aria-hidden="true">
        {showMaster && masterCover && (
          <MasterCoverPage cover={masterCover} lines={contexto} pageNum={numFor('master')} total={total} />
        )}

        {lines.map((line) => (
          <LineSections key={line.config.slug} line={line} numFor={numFor} total={total} />
        ))}

        {includeContact && (
          <ContactPage lines={contexto} pageNum={numFor('contato')} total={total} />
        )}
      </div>
    );
  }
);

PpfPortfolioDocument.displayName = 'PpfPortfolioDocument';

export default PpfPortfolioDocument;
