// O manifesto: a tela para (sticky) e as palavras acendem conforme a rolagem.
// Parado (reduzir movimento), o texto aparece inteiro, sem trava.

import { useMemo, useRef } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useProgressoSecao } from './movimento';
import { MANIFESTO } from './protegidoConfig';
import s from './Protegido.module.css';

interface Palavra {
  texto: string;
  destaque: boolean;
}

export default function Manifesto({ movimento }: { movimento: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const scrollYProgress = useProgressoSecao(ref);
  const palavras = useMemo<Palavra[]>(
    () => MANIFESTO.split(' ').map((p) => ({ texto: p.replace(/\*/g, ''), destaque: p.startsWith('*') })),
    [],
  );

  return (
    <section ref={ref} className={`${s.manifesto} ${movimento ? '' : s.manifestoParado}`} aria-label="Manifesto NZPPF">
      <div className={s.manifestoFixo}>
        <p className={s.manifestoTexto}>
          {palavras.map((p, i) => (
            <PalavraAcesa key={i} palavra={p} i={i} total={palavras.length} progresso={scrollYProgress} movimento={movimento} />
          ))}
        </p>
      </div>
    </section>
  );
}

function PalavraAcesa({ palavra, i, total, progresso, movimento }: { palavra: Palavra; i: number; total: number; progresso: MotionValue<number>; movimento: boolean }) {
  const ini = 0.04 + (i / total) * 0.8;
  const opacity = useTransform(progresso, [ini, ini + 0.06], [0.14, 1]);
  return (
    <>
      <motion.span className={palavra.destaque ? s.destaque : undefined} style={movimento ? { opacity } : undefined}>
        {palavra.texto}
      </motion.span>{' '}
    </>
  );
}
