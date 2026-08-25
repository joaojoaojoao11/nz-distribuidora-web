import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './PpfPortfolio.module.css';
import PpfPortfolioDocument from './PpfPortfolioDocument';
import { getPortfolioLine, portfolioPageCount } from './ppfPortfolioRegistry';

/**
 * Seção de download do portfólio em PDF, no fim da página de uma linha:
 *
 *   <PpfPortfolioButton slug="prime-gloss" />
 *
 * Todos os dados vêm de ppfPortfolioRegistry.ts pelo slug — a página não
 * precisa passar nada. Estilos e cor de destaque saem do próprio componente.
 */

interface PpfPortfolioButtonProps {
  /** Chave da linha no registro (ex: 'prime-gloss'). */
  slug: string;
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
  title = 'Leve esta página com você',
  description,
}: PpfPortfolioButtonProps) {
  const entry = getPortfolioLine(slug);

  // O documento imprimível só é montado durante a geração — são várias
  // páginas A4 com imagens, caro para manter no DOM o tempo todo.
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [label, setLabel] = useState('');
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || !entry) return;
    let cancelled = false;

    (async () => {
      try {
        const el = docRef.current;
        if (!el) throw new Error('Documento do portfólio não montado.');
        // Dinâmico: mantém html2canvas + jsPDF fora do chunk inicial da página.
        const { generatePpfPortfolioPdf } = await import('./generatePpfPortfolioPdf');
        await generatePpfPortfolioPdf(el, {
          fileName: entry.config.fileName,
          quality: 'alta',
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
  }, [mounted, entry]);

  if (!entry) {
    console.warn(`PpfPortfolioButton: slug desconhecido "${slug}".`);
    return null;
  }

  const { config } = entry;
  const pageCount = portfolioPageCount(entry);

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

      {mounted && <PpfPortfolioDocument ref={docRef} lines={[entry]} />}
    </>
  );
}
