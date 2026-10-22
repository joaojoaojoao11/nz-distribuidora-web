import { motion } from 'framer-motion';
import s from './Protegido.module.css';

interface Props {
  id?: string;
  olho: string;
  titulo: string;
  sub?: string;
  centro?: boolean;
  movimento: boolean;
}

/** Cabeçalho das seções: olho (com o ponto vermelho), título e linha de apoio. */
export default function Cabecalho({ id, olho, titulo, sub, centro = false, movimento }: Props) {
  return (
    <motion.div
      className={`${s.cab} ${centro ? s.cabCentro : ''}`}
      initial={movimento ? { opacity: 0, y: 28 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className={s.olho}>{olho}</span>
      <h2 id={id} className={s.h2}>
        {titulo}
      </h2>
      {sub && <p className={s.cabSub}>{sub}</p>}
    </motion.div>
  );
}
