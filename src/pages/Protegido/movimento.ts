import { useState, type RefObject } from 'react';
import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

/**
 * true = a página anima. Quem pediu "reduzir movimento" no aparelho vê a versão
 * parada; `?movimento=1` na URL força a animação (para conferir a página num
 * aparelho com a opção ligada).
 */
export function useMovimento(): boolean {
  const reduzir = useReducedMotion();
  const [forcar] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('movimento'));
  return forcar || !reduzir;
}

/**
 * 0 → 1 enquanto uma seção alta (com miolo sticky) passa pela tela: 0 quando o
 * topo dela encosta no topo da tela, 1 quando o fim encosta no fim.
 * Mede a seção a cada rolagem, em vez do `useScroll({ target })`, que guarda a
 * posição medida na montagem e erra quando o herói muda de altura depois
 * (fonte, imagem e o chunk da rota chegando).
 */
export function useProgressoSecao(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, () => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const percurso = r.height - window.innerHeight;
    if (percurso <= 0) return 1;
    return Math.min(1, Math.max(0, -r.top / percurso));
  });
}
