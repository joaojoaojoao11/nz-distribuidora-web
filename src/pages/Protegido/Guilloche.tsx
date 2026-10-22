// Guilhoché do selo NZPPF (o desenho de cédula atrás do QR), gerado na hora.
// É a mesma conta do selo impresso (NZ-AGENTES/CLEDNA/scripts/selo_garantia,
// faixa_polar): r = R0 + a·sen(k·t + fase), em curvas de Bézier com tangente
// exata, 4 por onda — leve o bastante para desenhar e girar no celular.

import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';

const POR_ONDA = 4;
const f = (v: number) => v.toFixed(2);

function faixaPolar(cx: number, cy: number, R0: number, a: number, k: number, fases: number): string[] {
  const n = k * POR_ONDA;
  const h = (2 * Math.PI) / n;
  const caminhos: string[] = [];
  for (let j = 0; j < fases; j++) {
    const ph = ((2 * Math.PI * j) / fases / k) * 2;
    let d = '';
    let x0 = 0, y0 = 0, dx0 = 0, dy0 = 0;
    for (let i = 0; i <= n; i++) {
      const t = (2 * Math.PI * i) / n;
      const r = R0 + a * Math.sin(k * t + ph * k);
      const dr = a * k * Math.cos(k * t + ph * k);
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      const dx = dr * Math.cos(t) - r * Math.sin(t);
      const dy = dr * Math.sin(t) + r * Math.cos(t);
      d += i === 0
        ? `M${f(x)},${f(y)}`
        : `C${f(x0 + (dx0 * h) / 3)},${f(y0 + (dy0 * h) / 3)} ${f(x - (dx * h) / 3)},${f(y - (dy * h) / 3)} ${f(x)},${f(y)}`;
      x0 = x; y0 = y; dx0 = dx; dy0 = dy;
    }
    caminhos.push(`${d}Z`);
  }
  return caminhos;
}

const ANEIS = [
  { R0: 46, a: 3.6, k: 22 },
  { R0: 64, a: 4.6, k: 30 },
  { R0: 82, a: 3.8, k: 38 },
];

interface Props {
  className?: string;
  /** Desenha as linhas na entrada e mantém o brilho holográfico girando. */
  movimento: boolean;
  /** Atraso do desenho, em segundos. */
  atraso?: number;
}

export default function Guilloche({ className, movimento, atraso = 0 }: Props) {
  const id = useId().replace(/:/g, '');
  const caminhos = useMemo(() => ANEIS.flatMap(({ R0, a, k }) => faixaPolar(100, 100, R0, a, k, 4)), []);

  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`holo-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".1" />
          <stop offset=".18" stopColor="#ff7cc8" stopOpacity=".26" />
          <stop offset=".32" stopColor="#7fd8ff" stopOpacity=".24" />
          <stop offset=".48" stopColor="#ffffff" stopOpacity=".1" />
          <stop offset=".64" stopColor="#fff38a" stopOpacity=".2" />
          <stop offset=".8" stopColor="#8affbc" stopOpacity=".2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".1" />
          {movimento && (
            <animateTransform attributeName="gradientTransform" type="rotate" from="0 100 100" to="360 100 100" dur="9s" repeatCount="indefinite" />
          )}
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#holo-${id})`} strokeWidth=".32">
        {caminhos.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            initial={movimento ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.9, delay: atraso + i * 0.045, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}
      </g>
    </svg>
  );
}
