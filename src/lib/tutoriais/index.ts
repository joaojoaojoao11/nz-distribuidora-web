// Registro dos tutoriais do botão "Como funciona" (src/components/Tutorial).
//
// O conteúdo fica separado por ÁREA, e o começo do id diz o arquivo:
//   admin.*     → admin.ts     (painel administrativo)
//   conta.*     → conta.ts     (área do cliente: /painel)
//   loja.*      → loja.ts      (vitrine, produto, carrinho, checkout, cadastro)
//   garantia.*  → garantia.ts  (registro, selo e certificado)
// Cada área é carregada só quando a primeira tela dela pede um tutorial: o texto
// do admin não entra no pacote da loja, e vice-versa.
//
// Dentro de cada área, o `publico` de cada tutorial (admin, cliente, lojista,
// revendedor, afiliado) diz para quem ele foi escrito; a variante por tipo de
// acesso é escolhida pela tela (ex.: `conta.indique` × `conta.indique-afiliado`).

import type { Publico, Tutorial } from '../../components/Tutorial/tipos';

export type Area = 'admin' | 'conta' | 'loja' | 'garantia';

const CARREGAR: Record<Area, () => Promise<Tutorial[]>> = {
  admin: () => import('./admin').then((m) => m.TUTORIAIS_ADMIN),
  conta: () => import('./conta').then((m) => m.TUTORIAIS_CONTA),
  loja: () => import('./loja').then((m) => m.TUTORIAIS_LOJA),
  garantia: () => import('./garantia').then((m) => m.TUTORIAIS_GARANTIA),
};

export const AREAS = Object.keys(CARREGAR) as Area[];

const cache = new Map<Area, Promise<Tutorial[]>>();

export function carregarArea(area: Area): Promise<Tutorial[]> {
  let p = cache.get(area);
  if (!p) {
    p = CARREGAR[area]().catch(() => {
      cache.delete(area); // falhou a rede: tenta de novo na próxima vez
      return [];
    });
    cache.set(area, p);
  }
  return p;
}

export async function carregarTutorial(id: string): Promise<Tutorial | undefined> {
  const area = id.split('.')[0] as Area;
  if (!(area in CARREGAR)) return undefined;
  const lista = await carregarArea(area);
  return lista.find((t) => t.id === id);
}

export const ROTULO_PUBLICO: Record<Publico, string> = {
  admin: 'visão do administrador',
  cliente: 'para você',
  lojista: 'para lojista e aplicador',
  revendedor: 'para revendedor',
  afiliado: 'para afiliado',
};
