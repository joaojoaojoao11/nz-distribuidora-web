// As linhas NZPPF, um cartão (e um botão) para cada, como no /ppf. Os anos de
// garantia contam de 0 até o número quando o cartão aparece.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Cabecalho from './Cabecalho';
import { LINHAS_EXTRAS, LINHAS_PINTURA, type LinhaProtegido } from './protegidoConfig';
import s from './Protegido.module.css';

function useContador(alvo: number, comecar: boolean, movimento: boolean): number {
  const [n, setN] = useState(movimento ? 0 : alvo);
  useEffect(() => {
    if (!movimento || !comecar) return;
    const c = animate(0, alvo, { duration: 1.5, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [alvo, comecar, movimento]);
  return n;
}

export default function Linhas({ movimento }: { movimento: boolean }) {
  return (
    <section className={s.secao} aria-labelledby="linhas-titulo">
      <Cabecalho id="linhas-titulo" olho="A família NZPPF" titulo="Uma linha para cada nível de exigência." sub="Toque na linha para conhecer." movimento={movimento} />
      <div className={s.linhasGrade}>
        {LINHAS_PINTURA.map((l, i) => (
          <CartaoLinha key={l.slug} linha={l} i={i} movimento={movimento} />
        ))}
      </div>
      <div className={s.extrasGrade}>
        {LINHAS_EXTRAS.map((l, i) => (
          <motion.div
            key={l.slug}
            initial={movimento ? { opacity: 0, y: 24 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={`/ppf/${l.slug}`} className={s.extra}>
              <img src={l.foto} alt="" loading="lazy" decoding="async" width={112} height={112} />
              <span className={s.extraCorpo}>
                <span className={s.extraNome}>NZPPF {l.nome}</span>
                <span className={s.extraFrase}>{l.frase}</span>
                <span className={s.extraAnos}>{l.anos} anos de garantia</span>
              </span>
              <ArrowRight className={s.extraSeta} size={18} aria-hidden="true" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CartaoLinha({ linha, i, movimento }: { linha: LinhaProtegido; i: number; movimento: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const visto = useInView(ref, { once: true, amount: 0.5 });
  const anos = useContador(linha.anos, visto, movimento);
  return (
    <motion.div
      initial={movimento ? { opacity: 0, y: 40 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay: (i % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link ref={ref} to={`/ppf/${linha.slug}`} className={s.linha} style={{ '--cor': linha.cor } as CSSProperties}>
        <span className={s.linhaFoto}>
          <img src={linha.foto} alt="" loading="lazy" decoding="async" width={1000} height={1000} />
        </span>
        <span className={s.linhaCorpo}>
          <span className={s.linhaMarca}>NZPPF</span>
          <h3 className={s.linhaNome}>{linha.nome}</h3>
          <span className={s.linhaFrase}>{linha.frase}</span>
          <span className={s.linhaDetalhe}>{linha.detalhe}</span>
          <span className={s.linhaRodape}>
            <span className={s.linhaAnos}>
              <span className={s.linhaAnosNum}>{anos}</span>
              <span className={s.linhaAnosRotulo}>
                anos de
                <br />
                garantia
              </span>
            </span>
            <span className={s.linhaBotao}>
              Conhecer a {linha.curto}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
