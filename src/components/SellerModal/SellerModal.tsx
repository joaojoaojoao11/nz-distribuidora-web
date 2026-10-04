import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone } from 'lucide-react';
import { VENDAS, linkWhatsApp } from '../../lib/contatos';
import styles from './SellerModal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Assunto curto: vira "Olá! Vim pelo link e quero saber sobre {assunto}." */
  messageContext?: string;
  /** Mensagem pronta (tem prioridade sobre messageContext). */
  mensagem?: string;
};

export default function SellerModal({
  open,
  onClose,
  messageContext = 'os produtos da NZ Group',
  mensagem,
}: Props) {
  const texto = mensagem ?? `Olá! Vim pelo link e quero saber sobre ${messageContext}.`;

  useEffect(() => {
    if (!open) return;
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: 20, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalBadge}>
                <MessageCircle size={14} />
                <span>WHATSAPP</span>
              </div>
              <h2 className={styles.modalTitle}>Central de Vendas</h2>
              <p className={styles.modalSubtitle}>
                Escolha um consultor para iniciar a conversa direto pelo WhatsApp.
              </p>
            </div>

            <div className={styles.sellerList}>
              {VENDAS.map((s, i) => (
                <motion.a
                  key={s.telefone}
                  href={linkWhatsApp(s, texto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sellerBtn}
                  onClick={onClose}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  whileHover={{ x: 4 }}
                >
                  <div className={styles.sellerAvatar}>
                    <span>{i + 1}</span>
                    <span className={styles.sellerStatus} />
                  </div>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>{s.nome}</span>
                    <span className={styles.sellerPhone}>
                      <Phone size={11} /> {s.exibicao}
                    </span>
                  </div>
                  <div className={styles.sellerWhats}>
                    <MessageCircle size={18} />
                  </div>
                </motion.a>
              ))}
            </div>

            <p className={styles.modalFootnote}>
              Horário comercial · Seg–Sex · 09h–18h
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
