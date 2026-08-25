import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './PpfPortfolio.module.css';
import PpfPortfolioDocument from './PpfPortfolioDocument';
import {
  PPF_LINES,
  CATALOGO_COMPLETO,
  portfolioPageCount,
  catalogoPageCount,
} from './ppfPortfolioRegistry';

/**
 * Seção de downloads da página /ppf.
 *
 * Oferece o catálogo com todas as linhas num PDF só e, abaixo, um card por
 * linha para baixar o portfólio individual sem precisar entrar na página
 * dela.
 *
 * O catálogo é gerado em PEDAÇOS — uma linha por vez. Montar as ~41 páginas
 * A4 de uma vez colocaria mais de 150 imagens vivas no DOM simultaneamente.
 * A cada passo montamos as seções de uma linha, anexamos ao PDF e
 * desmontamos, mantendo o pico de memória no tamanho de um portfólio comum.
 * A capa geral entra no primeiro pedaço e a página "Fale com a NZ" no
 * último — por isso ela aparece uma única vez.
 */

type Job =
  | { kind: 'linha'; slug: string }
  | { kind: 'catalogo' };

const fade = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const CATALOGO_TOTAL = catalogoPageCount();

/** Primeira página de cada pedaço, para a numeração corrida do catálogo. */
function chunkStarts(): number[] {
  const starts: number[] = [];
  let acc = 1;
  PPF_LINES.forEach((line, i) => {
    starts.push(acc);
    // páginas da linha sem o contato, + a capa geral no primeiro pedaço
    acc += portfolioPageCount(line) - 1 + (i === 0 ? 1 : 0);
  });
  return starts;
}

export default function PpfCatalogSection() {
  const [job, setJob] = useState<Job | null>(null);
  const [chunk, setChunk] = useState(0);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [label, setLabel] = useState('');
  const docRef = useRef<HTMLDivElement>(null);
  // Handle do jsPDF em construção, vivo entre os pedaços do catálogo.
  const handleRef = useRef<unknown>(null);

  const reset = useCallback(() => {
    setJob(null);
    setChunk(0);
    handleRef.current = null;
  }, []);

  useEffect(() => {
    if (!job) return;
    let cancelled = false;

    (async () => {
      const el = docRef.current;
      if (!el) return;

      try {
        const mod = await import('./generatePpfPortfolioPdf');

        if (job.kind === 'linha') {
          const entry = PPF_LINES.find((l) => l.config.slug === job.slug);
          if (!entry) throw new Error(`Linha desconhecida: ${job.slug}`);
          await mod.generatePpfPortfolioPdf(el, {
            fileName: entry.config.fileName,
            quality: 'alta',
            onProgress: (p) => !cancelled && setLabel(p.label),
          });
          if (!cancelled) {
            setStatus('idle');
            setLabel('');
            reset();
          }
          return;
        }

        // ── catálogo: um pedaço por vez ──
        if (chunk === 0) {
          handleRef.current = mod.createPortfolioPdf('compacta');
        }
        const handle = handleRef.current as ReturnType<typeof mod.createPortfolioPdf>;
        const starts = chunkStarts();

        await mod.appendPortfolioPages(handle, el, {
          totalOverride: CATALOGO_TOTAL,
          offset: starts[chunk] - 1,
          onProgress: (p) => !cancelled && setLabel(p.label),
        });

        if (cancelled) return;

        if (chunk < PPF_LINES.length - 1) {
          setChunk((c) => c + 1); // dispara o próximo pedaço
        } else {
          setLabel('Salvando PDF…');
          mod.savePortfolioPdf(handle, CATALOGO_COMPLETO.fileName);
          setStatus('idle');
          setLabel('');
          reset();
        }
      } catch (err) {
        console.error('Falha ao gerar o PDF:', err);
        if (!cancelled) {
          setStatus('error');
          setLabel('');
          reset();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [job, chunk, reset]);

  const busy = status === 'working';

  const baixarLinha = (slug: string) => {
    if (busy) return;
    setStatus('working');
    setLabel('Preparando…');
    setChunk(0);
    setJob({ kind: 'linha', slug });
  };

  const baixarCatalogo = () => {
    if (busy) return;
    setStatus('working');
    setLabel('Preparando…');
    setChunk(0);
    setJob({ kind: 'catalogo' });
  };

  // O que está montado agora: a linha do pedaço atual, ou a linha avulsa.
  const linhaMontada =
    job?.kind === 'catalogo'
      ? PPF_LINES[chunk]
      : job?.kind === 'linha'
        ? PPF_LINES.find((l) => l.config.slug === job.slug)
        : null;

  const ehCatalogo = job?.kind === 'catalogo';
  const starts = chunkStarts();

  return (
    <>
      <section className={styles.ctaSection}>
        <motion.div
          className="container"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
        >
          <div className={styles.catalogCard}>
            <div className={styles.catalogHeader}>
              <div>
                <h2 className={styles.ctaTitle}>Leve o catálogo com você</h2>
                <p className={styles.ctaDesc}>
                  Um PDF único com as {PPF_LINES.length} linhas NZPPF: manifesto, diferenciais, acabamentos,
                  ficha técnica e gráficos de desempenho de cada uma. {CATALOGO_TOTAL} páginas em A4, prontas
                  para apresentar ao cliente.
                </p>
              </div>
              <div className={styles.ctaActions}>
                <button className={styles.ctaBtn} onClick={baixarCatalogo} disabled={busy}>
                  {busy && ehCatalogo ? label || 'Gerando…' : 'BAIXAR CATÁLOGO COMPLETO'}
                </button>
                <span className={styles.ctaHint}>
                  {status === 'error'
                    ? 'Não foi possível gerar o PDF. Tente novamente.'
                    : `PDF · A4 · ${CATALOGO_TOTAL} páginas`}
                </span>
              </div>
            </div>

            <p className={styles.catalogDivider}>ou baixe uma linha específica</p>

            <div className={styles.lineGrid}>
              {PPF_LINES.map((line) => {
                const { config } = line;
                const espessura = config.badges.find((b) => /espessura/i.test(b.label))?.value;
                const garantia = config.badges.find((b) => /garantia/i.test(b.label))?.value;
                const ativo = busy && job?.kind === 'linha' && job.slug === config.slug;
                return (
                  <button
                    key={config.slug}
                    className={styles.lineCard}
                    style={
                      {
                        '--pf-accent': config.accent,
                        '--pf-accent-rgb': config.accentRgb,
                      } as React.CSSProperties
                    }
                    onClick={() => baixarLinha(config.slug)}
                    disabled={busy}
                  >
                    <span className={styles.lineCardName}>{config.name}</span>
                    <span className={styles.lineCardSpec}>
                      {[espessura, garantia].filter(Boolean).join(' · ')}
                    </span>
                    <span className={styles.lineCardAction}>
                      {ativo ? label || 'Gerando…' : `Baixar · ${portfolioPageCount(line)} páginas`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {linhaMontada && (
        <PpfPortfolioDocument
          ref={docRef}
          lines={[linhaMontada]}
          allLines={ehCatalogo ? PPF_LINES : undefined}
          masterCover={ehCatalogo && chunk === 0 ? CATALOGO_COMPLETO : undefined}
          includeContact={!ehCatalogo || chunk === PPF_LINES.length - 1}
          numbering={ehCatalogo ? { start: starts[chunk], total: CATALOGO_TOTAL } : undefined}
        />
      )}
    </>
  );
}
