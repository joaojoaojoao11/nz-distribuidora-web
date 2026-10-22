// O "gêmeo" do selo que a pessoa acabou de escanear: os dois modelos (A prata
// holográfico na frente, B black atrás) inclinando com o dedo, o mouse ou o
// giroscópio. O giroscópio só no Android: no iPhone ele pede permissão numa
// caixa do sistema, e um aviso logo na entrada estragaria a abertura.
// Tocar troca o selo da frente. Na entrada, uma linha vermelha "lê" o selo e
// acende o "Protegido".

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform, type MotionStyle } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import s from './Protegido.module.css';

const IMG = { a: '/assets/images/protegido/selo-a.webp', b: '/assets/images/protegido/selo-b.webp' } as const;
const ALT = { a: 'Selo de garantia NZPPF, modelo prata holográfico', b: 'Selo de garantia NZPPF, modelo black com faixa holográfica' } as const;
const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v));

export default function SeloHolo({ movimento }: { movimento: boolean }) {
  const [frente, setFrente] = useState<'a' | 'b'>('a');
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 130, damping: 15, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 130, damping: 15, mass: 0.6 });
  // O reflexo e o arco-íris andam com a inclinação, como num holograma de verdade.
  const bx = useTransform(sry, [-20, 20], ['100%', '0%']);
  const ax = useTransform(srx, [-16, 16], ['0%', '100%']);
  const controle = useRef<'auto' | 'dedo' | 'giro'>('auto');
  const base = useRef<{ beta: number; gamma: number } | null>(null);

  // Balanço lento enquanto ninguém mexe.
  useAnimationFrame((t) => {
    if (!movimento || controle.current !== 'auto') return;
    rx.set(Math.sin(t / 1700) * 5);
    ry.set(Math.cos(t / 2300) * 9);
  });

  useEffect(() => {
    if (!movimento || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown };
    if (typeof DOE.requestPermission === 'function') return;
    const aoGirar = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || controle.current === 'dedo') return;
      if (!base.current) base.current = { beta: e.beta, gamma: e.gamma };
      controle.current = 'giro';
      rx.set(lim(-(e.beta - base.current.beta) * 0.7, 16));
      ry.set(lim((e.gamma - base.current.gamma) * 0.9, 20));
    };
    window.addEventListener('deviceorientation', aoGirar);
    return () => window.removeEventListener('deviceorientation', aoGirar);
  }, [movimento, rx, ry]);

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (!movimento) return;
    const r = e.currentTarget.getBoundingClientRect();
    controle.current = 'dedo';
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 34);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 26);
  };
  const soltar = () => {
    controle.current = 'auto';
  };

  const trocar = () => setFrente((f) => (f === 'a' ? 'b' : 'a'));

  return (
    <div className={s.palco} onPointerMove={mover} onPointerLeave={soltar} onPointerUp={soltar} onPointerCancel={soltar}>
      <span className={s.palcoSombra} aria-hidden="true" />
      <motion.div className={s.palco3d} style={{ rotateX: srx, rotateY: sry }}>
        {(['b', 'a'] as const).map((m) => {
          const naFrente = frente === m;
          return (
            <motion.button
              key={m}
              type="button"
              className={s.seloCartao}
              onClick={trocar}
              aria-label={naFrente ? `${ALT[m]}. Toque para ver o outro modelo.` : `Mostrar o ${ALT[m].charAt(0).toLowerCase()}${ALT[m].slice(1)}`}
              style={{ zIndex: naFrente ? 2 : 1 }}
              initial={false}
              animate={
                naFrente
                  ? { x: '0%', y: '0%', rotate: -4, scale: 1, filter: 'brightness(1)' }
                  : { x: '34%', y: '-7%', rotate: 8, scale: 0.84, filter: 'brightness(0.5)' }
              }
              transition={{ type: 'spring', stiffness: 150, damping: 19 }}
            >
              <img src={IMG[m]} alt="" width={600} height={721} draggable={false} fetchPriority={m === 'a' ? 'high' : 'auto'} />
              <motion.span
                className={s.seloBrilho}
                aria-hidden="true"
                style={{ '--bx': bx, WebkitMaskImage: `url(${IMG[m]})`, maskImage: `url(${IMG[m]})` } as unknown as MotionStyle}
              />
              <motion.span
                className={`${s.seloArco} ${m === 'b' ? s.seloArcoB : ''}`}
                aria-hidden="true"
                style={{ '--bx': bx, '--ax': ax, WebkitMaskImage: `url(${IMG[m]})`, maskImage: `url(${IMG[m]})` } as unknown as MotionStyle}
              />
              {m === 'a' && movimento && (
                <motion.span
                  className={s.seloLeitura}
                  aria-hidden="true"
                  initial={{ top: '-4%', opacity: 0 }}
                  animate={{ top: ['-4%', '104%'], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.15, delay: 0.55, ease: [0.65, 0, 0.35, 1], times: [0, 0.12, 0.85, 1] }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
      <motion.span
        className={s.selado}
        initial={movimento ? { opacity: 0, scale: 0.6, y: 8 } : false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: movimento ? 1.65 : 0 }}
      >
        <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" />
        Protegido
      </motion.span>
    </div>
  );
}
