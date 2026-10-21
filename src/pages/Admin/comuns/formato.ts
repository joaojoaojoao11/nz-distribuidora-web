// Formatação e estilos compartilhados das telas do admin. Fica fora de
// Pagina.tsx porque o Fast Refresh do Vite só funciona em arquivo que exporta
// apenas componentes.

import type { CSSProperties } from 'react';

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const pctTexto = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));
export const dataBR = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');
export const dataHoraBR = (v: string | null | undefined) => (v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

export const campoEstilo: CSSProperties = { background: 'rgba(15,15,18,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.45rem 0.6rem', fontSize: '0.85rem', borderRadius: 4, width: '100%' };
