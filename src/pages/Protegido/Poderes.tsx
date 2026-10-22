// Os 4 "poderes" do PPF, cada um com uma micro-animação em SVG que só roda
// enquanto o cartão está na tela. Parado (reduzir movimento), cada desenho
// mostra o momento que explica o poder.

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Cabecalho from './Cabecalho';
import { PODERES } from './protegidoConfig';
import s from './Protegido.module.css';

type Anim = { ativo: boolean };
const loop = (duration: number, times: number[]) => ({ duration, times, repeat: Infinity, ease: 'easeInOut' as const });

// --------------------------------------------------------------- se regenera
function Regenera({ ativo }: Anim) {
  const t = (times: number[]) => loop(4.6, times);
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <defs>
        <linearGradient id="pd-r-painel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b2b31" />
          <stop offset=".55" stopColor="#111114" />
          <stop offset="1" stopColor="#08080a" />
        </linearGradient>
        <radialGradient id="pd-r-calor">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity=".85" />
          <stop offset=".45" stopColor="#d11e1e" stopOpacity=".35" />
          <stop offset="1" stopColor="#d11e1e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pd-r-reflexo" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="pd-r-clip">
          <rect x="14" y="14" width="172" height="112" rx="14" />
        </clipPath>
      </defs>
      <g clipPath="url(#pd-r-clip)">
        <rect x="14" y="14" width="172" height="112" fill="url(#pd-r-painel)" />
        <motion.polygon
          points="0,14 56,14 30,126 -26,126"
          fill="url(#pd-r-reflexo)"
          initial={{ x: -70 }}
          animate={ativo ? { x: [-70, -70, 250] } : { x: 120 }}
          transition={t([0, 0.76, 1])}
        />
        <motion.circle
          cy="70"
          r="62"
          fill="url(#pd-r-calor)"
          initial={{ cx: -70, opacity: 0 }}
          animate={ativo ? { cx: [-70, -70, 260, 260], opacity: [0, 1, 1, 0] } : { cx: 112, opacity: 0.85 }}
          transition={t([0, 0.36, 0.72, 0.8])}
        />
        <motion.path
          d="M38,92 L60,77 L67,82 L92,61 L100,66 L126,46 L135,51 L162,36"
          fill="none"
          stroke="#f5f5f7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={ativo ? { pathLength: [0, 1, 1, 1, 0], opacity: [1, 1, 1, 0, 0] } : { pathLength: 1, opacity: 0.4 }}
          transition={t([0, 0.18, 0.4, 0.66, 1])}
        />
      </g>
      <rect x="14" y="14" width="172" height="112" rx="14" fill="none" stroke="#fff" strokeOpacity=".08" />
    </svg>
  );
}

// --------------------------------------------------------------- a água não fica
const sup = (x: number) => 100 - 0.16 * x; // superfície inclinada: sobe para a direita
function Agua({ ativo }: Anim) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <defs>
        <linearGradient id="pd-a-sup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1f25" />
          <stop offset="1" stopColor="#060607" />
        </linearGradient>
        <radialGradient id="pd-a-gota" cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".28" stopColor="#c4e6ff" stopOpacity=".6" />
          <stop offset="1" stopColor="#5aa9ff" stopOpacity=".2" />
        </radialGradient>
      </defs>
      <polygon points={`0,${sup(0)} 200,${sup(200)} 200,140 0,140`} fill="url(#pd-a-sup)" />
      <line x1="0" y1={sup(0)} x2="200" y2={sup(200)} stroke="#fff" strokeOpacity=".24" strokeWidth=".8" />
      {[46, 88, 130, 170].map((x0, i) => {
        const r = 6;
        const y0 = sup(x0) - r * 0.75;
        const x1 = x0 - 74;
        const y1 = sup(x1) - r * 0.75;
        const tempo = { duration: 2.8, times: [0, 0.3, 0.44, 1], repeat: Infinity, delay: i * 0.62, ease: ['easeIn', 'easeOut', 'easeIn'] as const };
        return (
          <motion.g
            key={x0}
            initial={{ x: x0, y: y0, opacity: ativo ? 0 : 1 }}
            animate={ativo ? { x: [x0, x0, x0, x1], y: [-14, y0, y0, y1], opacity: [0, 1, 1, 0] } : { x: x0, y: y0, opacity: 1 }}
            transition={{ ...tempo, ease: [...tempo.ease] }}
          >
            <motion.ellipse
              rx={r}
              ry={r}
              fill="url(#pd-a-gota)"
              initial={{ scaleX: 1.2, scaleY: 0.78 }}
              animate={ativo ? { scaleX: [0.82, 1.28, 1.2, 1.2], scaleY: [1.25, 0.7, 0.78, 0.78] } : { scaleX: 1.2, scaleY: 0.78 }}
              transition={{ ...tempo, ease: [...tempo.ease] }}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------------- impacto
const RETO = 'M0,92 Q100,92 200,92 L200,100 Q100,100 0,100 Z';
const AMASSA = 'M0,92 Q100,108 200,92 L200,100 Q100,113 0,100 Z';
function Impacto({ ativo }: Anim) {
  const t = (times: number[]) => loop(3.2, times);
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <defs>
        <linearGradient id="pd-i-tinta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c21c1c" />
          <stop offset=".5" stopColor="#7d0c0c" />
          <stop offset="1" stopColor="#2e0303" />
        </linearGradient>
        <linearGradient id="pd-i-ppf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <rect x="0" y="100" width="200" height="40" fill="url(#pd-i-tinta)" />
      <rect x="0" y="104" width="200" height="1.2" fill="#fff" opacity=".18" />
      <motion.path
        fill="url(#pd-i-ppf)"
        initial={{ d: RETO }}
        animate={ativo ? { d: [RETO, RETO, AMASSA, RETO, RETO] } : { d: RETO }}
        transition={t([0, 0.3, 0.35, 0.52, 1])}
      />
      {[0, 0.06].map((atraso, k) => (
        <motion.ellipse
          key={k}
          cx="100"
          cy="94"
          fill="none"
          stroke="#fff"
          strokeWidth=".8"
          initial={{ rx: 0, ry: 0, opacity: 0 }}
          animate={ativo ? { rx: [0, 0, 74], ry: [0, 0, 9], opacity: [0, 0.75, 0] } : { rx: 40, ry: 5, opacity: 0.35 }}
          transition={t([0, 0.31 + atraso, 0.66 + atraso])}
        />
      ))}
      <motion.circle
        cx="100"
        cy="94"
        fill="#fff"
        initial={{ r: 0, opacity: 0 }}
        animate={ativo ? { r: [0, 0, 11, 0], opacity: [0, 0, 0.9, 0] } : { r: 0, opacity: 0 }}
        transition={t([0, 0.29, 0.32, 0.42])}
      />
      <motion.g
        initial={{ x: 178, y: -16, rotate: 0, opacity: ativo ? 1 : 0 }}
        animate={
          ativo
            ? { x: [178, 100, 100, 34, 34], y: [-16, 85, 85, -30, -30], rotate: [0, 200, 200, 380, 380], opacity: [1, 1, 1, 0, 0] }
            : { x: 64, y: 40, rotate: 120, opacity: 1 }
        }
        transition={t([0, 0.3, 0.33, 0.72, 1])}
      >
        <polygon points="-6,-3 -2,-7 5,-5 7,1 2,6 -5,5" fill="#8d8d93" stroke="#c9c9cf" strokeWidth=".6" />
      </motion.g>
    </svg>
  );
}

// --------------------------------------------------------------- brilho e UV
const ALVOS = [74, 108, 142, 176];
function Uv({ ativo }: Anim) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <defs>
        <radialGradient id="pd-u-sol">
          <stop offset="0" stopColor="#fff6d6" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pd-u-tinta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202026" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <linearGradient id="pd-u-reflexo" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="pd-u-clip">
          <rect x="0" y="96" width="200" height="44" />
        </clipPath>
      </defs>
      <circle cx="30" cy="26" r="24" fill="url(#pd-u-sol)" />
      <circle cx="30" cy="26" r="8" fill="#fff8e1" />
      {ALVOS.map((x, i) => (
        <g key={x}>
          <motion.line
            x1="40"
            y1="34"
            x2={x}
            y2="90"
            stroke="#a77bff"
            strokeWidth="1.3"
            strokeDasharray="3 5"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 0 }}
            animate={ativo ? { strokeDashoffset: [0, -32] } : { strokeDashoffset: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.circle
            cx={x}
            cy="90"
            fill="#c9b0ff"
            initial={{ r: 2, opacity: 0.8 }}
            animate={ativo ? { r: [1.6, 4.4, 1.6], opacity: [0.9, 0.25, 0.9] } : { r: 2.4, opacity: 0.8 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
          />
        </g>
      ))}
      <rect x="0" y="90" width="200" height="6" fill="#fff" opacity=".1" />
      <rect x="0" y="90" width="200" height=".9" fill="#fff" opacity=".45" />
      <rect x="0" y="96" width="200" height="44" fill="url(#pd-u-tinta)" />
      <g clipPath="url(#pd-u-clip)">
        <motion.polygon
          points="0,96 44,96 24,140 -20,140"
          fill="url(#pd-u-reflexo)"
          initial={{ x: -50 }}
          animate={ativo ? { x: [-50, 230] } : { x: 110 }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
        />
      </g>
    </svg>
  );
}

const ANIMACAO = { regenera: Regenera, agua: Agua, impacto: Impacto, uv: Uv } as const;

export default function Poderes({ movimento }: { movimento: boolean }) {
  return (
    <section className={s.secao} aria-labelledby="poderes-titulo">
      <Cabecalho id="poderes-titulo" olho="Agora mesmo, sem você ver" titulo="O que essa camada faz pelo carro, todos os dias." movimento={movimento} />
      <div className={s.poderesGrade}>
        {PODERES.map((p, i) => (
          <Poder key={p.id} id={p.id} titulo={p.titulo} texto={p.texto} i={i} movimento={movimento} />
        ))}
      </div>
    </section>
  );
}

function Poder({ id, titulo, texto, i, movimento }: { id: keyof typeof ANIMACAO; titulo: string; texto: string; i: number; movimento: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const naTela = useInView(ref, { amount: 0.45 });
  const Desenho = ANIMACAO[id];
  return (
    <motion.article
      ref={ref}
      className={s.poder}
      initial={movimento ? { opacity: 0, y: 32 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={s.poderPalco}>
        <Desenho ativo={movimento && naTela} />
      </div>
      <span className={s.poderNum}>0{i + 1}</span>
      <h3 className={s.poderTitulo}>{titulo}</h3>
      <p className={s.poderTexto}>{texto}</p>
    </motion.article>
  );
}
