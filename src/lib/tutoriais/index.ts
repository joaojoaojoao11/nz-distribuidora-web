// Registro dos tutoriais do botão "Como funciona" (src/components/Tutorial).
// Cada público ganha o seu arquivo: admin.ts hoje; cliente, lojista,
// revendedor e afiliado entram aqui do mesmo jeito.

import type { Publico, Tutorial } from '../../components/Tutorial/tipos';
import { TUTORIAIS_ADMIN } from './admin';

const TODOS: Tutorial[] = [...TUTORIAIS_ADMIN];

const POR_ID = new Map(TODOS.map((t) => [t.id, t]));

export function tutorialPorId(id: string): Tutorial | undefined {
  return POR_ID.get(id);
}

export const ROTULO_PUBLICO: Record<Publico, string> = {
  admin: 'visão do administrador',
  cliente: 'para você, cliente',
  lojista: 'para lojista e aplicador',
  revendedor: 'para revendedor',
  afiliado: 'para afiliado',
};
