import { AnimatePresence, motion } from 'framer-motion';
import type { AIStatus } from './hooks/useAutoAIEnhance';
import styles from './WrapSimulator.module.css';

interface Props {
  aiImage: string | null;
  status: AIStatus;
  errorMsg: string | null;
  onDismiss: () => void;
  colorName: string;
}

export default function AIEnhanceOverlay({ aiImage, status, errorMsg, onDismiss, colorName }: Props) {
  const showImage = status === 'ready' && aiImage;
  const showBadge = status === 'rendering' || status === 'error';

  return (
    <>
      <AnimatePresence>
        {showImage && (
          <motion.div
            key="ai-overlay"
            className={styles.aiOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={aiImage!} alt={colorName} className={styles.aiImage} />
            <div className={styles.aiControls}>
              <button className={styles.aiButton} onClick={onDismiss}>Voltar ao 3D</button>
              <a
                className={styles.aiButton}
                href={aiImage!}
                download={`NZWRAP_${colorName.replace(/\s+/g, '_')}.png`}
              >
                Baixar PNG
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBadge && (
          <motion.div
            className={styles.aiBadge}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {status === 'rendering' && (
              <span><span className={`${styles.aiDot} ${styles.aiDotActive}`} /> renderizando foto realista IA…</span>
            )}
            {status === 'error' && (
              <span className={styles.aiError}>Falha IA: {errorMsg}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
