import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './PpfPortfolio.module.css';
import PpfPortfolioDocument, {
  type SpecRow,
  type BenchmarkRow,
  type DiferencialRow,
  type FinishRow,
} from './PpfPortfolioDocument';
import { PPF_PORTFOLIOS } from './ppfPortfolioConfig';

/**
 * Seção de download do portfólio em PDF, pronta para ser colocada no fim da
 * página de qualquer linha NZPPF:
 *
 *   <PpfPortfolioButton
 *     slug="prime-gloss"
 *     tabelaTecnica={tabelaTecnica}
 *     benchmarkData={benchmarkData}
 *     diferenciais={diferenciais}
 *     finishes={finishesData}
 *   />
 *
 * A página passa as constantes que já tem em escopo, então o portfólio não
 * duplica o conteúdo. Estilos e cor de destaque vêm do próprio componente.
 */

interface PpfPortfolioButtonProps {
  /** Chave em PPF_PORTFOLIOS (ex: 'prime-gloss'). */
  slug: string;
  tabelaTecnica: SpecRow[];
  benchmarkData: BenchmarkRow[];
  diferenciais: DiferencialRow[];
  finishes?: FinishRow[];
  /** Sobrescreve o texto padrão da seção. */
  title?: string;
  description?: string;
}

const fade = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function PpfPortfolioButton({
  slug,
  tabelaTecnica,
  benchmarkData,
  diferenciais,
  finishes,
  title = 'Leve esta página com você',
  description,
}: PpfPortfolioButtonProps) {
  const config = PPF_PORTFOLIOS[slug];

  // O documento imprimível só é montado durante a geração — são várias
  // páginas A4 com imagens, caro para manter no DOM o tempo todo.
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [label, setLabel] = useState('');
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    (async () => {
      try {
        const el = docRef.current;
        if (!el) throw new Error('Documento do portfólio não montado.');
        // Dinâmico: mantém html2canvas + jsPDF fora do chunk inicial da página.
        const { generatePpfPortfolioPdf } = await import('./generatePpfPortfolioPdf');
        await generatePpfPortfolioPdf(el, {
          fileName: config.fileName,
          onProgress: (p) => {
            if (!cancelled) setLabel(p.label);
          },
        });
        if (!cancelled) {
          setStatus('idle');
          setLabel('');
        }
      } catch (err) {
        console.error('Falha ao gerar o portfólio:', err);
        if (!cancelled) {
          setStatus('error');
          setLabel('');
        }
      } finally {
        if (!cancelled) setMounted(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, config]);

  if (!config) {
    console.warn(`PpfPortfolioButton: slug desconhecido "${slug}".`);
    return null;
  }

  // 6 páginas fixas: capa, manifesto, diferenciais, ficha, benchmark e contato.
  // Tecnologia e acabamentos só existem nas linhas que têm esses dados.
  const pageCount =
    6 +
    (config.tecnologia ? 1 : 0) +
    (config.finishesTitle && finishes && finishes.length > 0 ? 1 : 0);

  const defaultDesc =
    description ??
    `Baixe o portfólio completo do ${config.name} em PDF: manifesto, ` +
      `diferenciais, ${config.finishesTitle ? 'acabamentos, ' : ''}ficha técnica e os gráficos de ` +
      `desempenho. ${pageCount} páginas em A4, prontas para apresentar ao cliente.`;

  const handleClick = () => {
    if (mounted) return;
    setStatus('working');
    setLabel('Preparando…');
    setMounted(true);
  };

  return (
    <>
      <section
        className={styles.ctaSection}
        style={
          {
            '--pf-accent': config.accent,
            '--pf-accent-rgb': config.accentRgb,
          } as React.CSSProperties
        }
      >
        <motion.div
          className="container"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fade}
        >
          <div className={styles.ctaCard}>
            <div>
              <h2 className={styles.ctaTitle}>{title}</h2>
              <p className={styles.ctaDesc}>{defaultDesc}</p>
            </div>
            <div className={styles.ctaActions}>
              <button className={styles.ctaBtn} onClick={handleClick} disabled={status === 'working'}>
                {status === 'working' ? label || 'Gerando…' : 'BAIXAR PORTFÓLIO EM PDF'}
              </button>
              <span className={styles.ctaHint}>
                {status === 'error'
                  ? 'Não foi possível gerar o PDF. Tente novamente.'
                  : `PDF · A4 · ${pageCount} páginas`}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {mounted && (
        <PpfPortfolioDocument
          ref={docRef}
          config={config}
          tabelaTecnica={tabelaTecnica}
          benchmarkData={benchmarkData}
          diferenciais={diferenciais}
          finishes={finishes}
        />
      )}
    </>
  );
}
