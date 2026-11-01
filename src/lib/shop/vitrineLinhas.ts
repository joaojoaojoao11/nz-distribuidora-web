// Linhas cuja página mostra os anúncios da NZSTORE (01/11/2026). Espelho de
// api/_lib/vitrineLinhas.ts: o servidor responde 308 nas páginas antigas de
// item; aqui o app faz o mesmo desvio para quem navega por um link interno.
// As duas listas andam juntas.

export interface VitrineLinha {
  linha: string;
  /** Página da linha, destino de quem chega num item sem anúncio. */
  pagina: string;
}

export const VITRINES: Record<string, VitrineLinha> = {
  m7: { linha: 'm7', pagina: '/sign/metamark-7-series' },
  mcx: { linha: 'mcx', pagina: '/wrap/metamark-mcx' },
  'sh-wrapping': { linha: 'sh-wrapping', pagina: '/wrap/sh-colors' },
  'oracal-651': { linha: 'oracal-651', pagina: '/sign/oracal-651' },
  'oracal-670': { linha: 'oracal-670', pagina: '/wrap/oracal-670ra' },
  'sh-decor': { linha: 'sh-decor', pagina: '/decor/sh' },
  etherna: { linha: 'etherna', pagina: '/decor/etherna' },
  imprimax: { linha: 'imprimax', pagina: '/decor/imprimax' },
};
