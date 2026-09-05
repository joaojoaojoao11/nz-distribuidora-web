// Mapa ERP → site: como um SKU do master_catalog vira um produto da LOJA.
//
// Módulo PURO, sem import nenhum, de propósito: é compartilhado pelo sync na
// Vercel (api/_lib/handlers/sync.ts), pelo migrador (scripts/) e pelo autoteste.
// Qualquer import de src/ arrastaria import.meta.env para o runtime da API.
//
// As três decisões que ele concentra:
//   1. `slugErp`    — URL estável do produto criado automaticamente. Sempre
//                     termina no SKU normalizado, então nunca colide.
//   2. `verticalDeCategoria` — a categoria do ERP decide em qual das 4 linhas
//                     de negócio o item aparece.
//   3. `linhaDeMarca` — a marca (mais o prefixo do SKU, na Metamark) decide a
//                     linha comercial, que é o que resolve perfil de embalagem
//                     e rótulo na loja.

export type VerticalErp = 'PPF' | 'WRAP' | 'SIGN' | 'DECOR';

export interface ErpSkuBasico {
  sku: string;
  nome: string | null;
  marca: string | null;
  categoria: string | null;
}

/** Sem acento, minúsculo, só [a-z0-9-], sem hífen nas pontas. */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 'SHDIP 413-12' → 'shdip-413-12'; 'ORA651000' → 'ora651000'. */
export function skuSlug(sku: string): string {
  return slugify(sku);
}

/**
 * 'METAMARK MCX JET BLACK 1,525 X 15M' com marca 'METAMARK' →
 * 'metamark-mcx-jet-black-mcx10'.
 *
 * Tira a dimensão do fim do nome (1,52 X 30M, 0,30M) e o prefixo repetido da
 * marca; recoloca a marca uma vez só. O sufixo com o SKU é o que garante
 * unicidade sem depender de nenhuma consulta.
 */
export function slugErp(row: ErpSkuBasico): string {
  const marca = (row.marca ?? '').trim();
  let nome = (row.nome ?? '').trim();
  // dimensões no fim: "1,52 X 30M", "1,525 X 15M", "0,30M", "30CM", "- 12,5M"
  nome = nome
    .replace(/[-–]?\s*\d+[.,]?\d*\s*[xX×]\s*\d+[.,]?\d*\s*M?\s*$/i, '')
    .replace(/\s+\d+[.,]?\d*\s*(M|CM)\s*$/i, '')
    .trim();
  if (marca && (nome.toUpperCase() === marca.toUpperCase() || nome.toUpperCase().startsWith(marca.toUpperCase() + " "))) {
    // Só quando a marca é palavra inteira: "NZ" não pode comer o "NZ" de "NZPPF".
    nome = nome.slice(marca.length).trim();
  }
  const base = slugify([marca, nome].filter(Boolean).join(' '));
  const sufixo = skuSlug(row.sku);
  if (!base) return sufixo;
  return base.endsWith(sufixo) ? base : `${base}-${sufixo}`;
}

/** Categorias reais do master_catalog (medidas em 2026-09-05). */
export function verticalDeCategoria(categoria: string | null | undefined, marca?: string | null): VerticalErp {
  const c = (categoria ?? '').trim().toUpperCase();
  if (c.startsWith('PPF')) return 'PPF';
  if (c.startsWith('DECORATIVO')) return 'DECOR';
  if (c === 'COMUNICAÇÃO VISUAL' || c === 'COMUNICACAO VISUAL') return 'SIGN';
  if (c === 'FILM') return 'SIGN';
  if (c === 'ENVELOPAMENTO') return 'WRAP';
  // DIVERSOS, ferramentas, vazio: cai pela marca.
  const m = (marca ?? '').trim().toUpperCase();
  if (m === 'ETHERNA' || m === 'SH DECOR') return 'DECOR';
  if (m.startsWith('ORACAL')) return 'SIGN';
  return 'WRAP';
}

/**
 * Chaves de linha. As 11 primeiras já existiam na LOJA (LineKey); as demais
 * nascem com o espelho. Cada uma precisa de um perfil de embalagem em
 * Admin → Logística para o frete cotar.
 */
export type LinhaErp =
  | 'etherna'
  | 'sh-decor'
  | 'm7'
  | 'mcx'
  | 'nzwrap'
  | 'oracal-651'
  | 'oracal-670'
  | 'sh-wrapping'
  | 'avery'
  | 'md80'
  | 'ppf'
  | 'speed-wrapping'
  | 'nzwrap-import'
  | 'nar'
  | 'next'
  | 'avery-adpro'
  | 'nz-farol'
  | 'diversos';

export const LINHA_LABEL: Record<LinhaErp, string> = {
  etherna: 'Etherna Decor',
  'sh-decor': 'SH Decor',
  m7: 'Metamark 7 Series',
  mcx: 'MetaCast MCX',
  nzwrap: 'NZWRAP Premium',
  'oracal-651': 'Oracal 651',
  'oracal-670': 'Oracal 670RA',
  'sh-wrapping': 'SH Wrapping',
  avery: 'Avery Dennison',
  md80: 'Metamark MD-80',
  ppf: 'NZPPF',
  'speed-wrapping': 'Speed Wrapping',
  'nzwrap-import': 'NZWRAP Import',
  nar: 'NAR PPF',
  next: 'SHNext PPF',
  'avery-adpro': 'Avery AD Pro',
  'nz-farol': 'NZ Película de Farol',
  diversos: 'Diversos',
};

export type BrandKeyErp = 'nz' | 'sh' | 'metamark' | 'orafol' | 'avery' | 'etherna' | 'speed' | 'nar' | 'outro';

export function linhaDeMarca(row: ErpSkuBasico): { linha: LinhaErp; brandKey: BrandKeyErp; marcaExibicao: string } {
  const m = (row.marca ?? '').trim().toUpperCase();
  const sku = row.sku.toUpperCase();
  const cat = (row.categoria ?? '').trim().toUpperCase();

  if (m === 'SPEED WRAPPING') return { linha: 'speed-wrapping', brandKey: 'speed', marcaExibicao: 'Speed Wrapping' };
  if (m === 'NZWRAP') return { linha: 'nzwrap-import', brandKey: 'nz', marcaExibicao: 'NZWRAP' };
  if (m === 'SH WRAPPING') return { linha: 'sh-wrapping', brandKey: 'sh', marcaExibicao: 'SH Wrapping' };
  if (m === 'SH DECOR') return { linha: 'sh-decor', brandKey: 'sh', marcaExibicao: 'SH Decor' };
  if (m === 'ETHERNA') return { linha: 'etherna', brandKey: 'etherna', marcaExibicao: 'Etherna Decor' };
  if (m === 'NAR') return { linha: 'nar', brandKey: 'nar', marcaExibicao: 'NAR' };
  if (m === 'NEXT') return { linha: 'next', brandKey: 'sh', marcaExibicao: 'SHNext' };
  if (m === 'ORACAL 670') return { linha: 'oracal-670', brandKey: 'orafol', marcaExibicao: 'Orafol' };
  if (m.startsWith('ORACAL')) return { linha: 'oracal-651', brandKey: 'orafol', marcaExibicao: 'Orafol' };
  if (m === 'AVERY') {
    return cat === 'FILM'
      ? { linha: 'avery-adpro', brandKey: 'avery', marcaExibicao: 'Avery Dennison' }
      : { linha: 'avery', brandKey: 'avery', marcaExibicao: 'Avery Dennison' };
  }
  if (m === 'METAMARK') {
    if (sku.startsWith('MCX')) return { linha: 'mcx', brandKey: 'metamark', marcaExibicao: 'Metamark' };
    if (sku.startsWith('MD')) return { linha: 'md80', brandKey: 'metamark', marcaExibicao: 'Metamark' };
    return { linha: 'm7', brandKey: 'metamark', marcaExibicao: 'Metamark' };
  }
  if (m === 'NZ') {
    if (cat === 'PPF FUME' || /FAROL|HEADLIGHT/.test((row.nome ?? '').toUpperCase())) {
      return { linha: 'nz-farol', brandKey: 'nz', marcaExibicao: 'NZ' };
    }
    if (cat.startsWith('PPF')) return { linha: 'ppf', brandKey: 'nz', marcaExibicao: 'NZPPF' };
    return { linha: 'diversos', brandKey: 'nz', marcaExibicao: 'NZ' };
  }
  return { linha: 'diversos', brandKey: 'outro', marcaExibicao: row.marca?.trim() || 'NZ' };
}

/** Nome de exibição: sem a marca repetida, sem dimensão, em Title Case simples. */
export function nomeExibicaoErp(row: ErpSkuBasico): string {
  const marca = (row.marca ?? '').trim();
  let nome = (row.nome ?? row.sku).trim();
  nome = nome
    .replace(/[-–]?\s*\d+[.,]?\d*\s*[xX×]\s*\d+[.,]?\d*\s*M?\s*$/i, '')
    .replace(/\s+\d+[.,]?\d*\s*(M|CM)\s*$/i, '')
    .trim();
  if (marca && (nome.toUpperCase() === marca.toUpperCase() || nome.toUpperCase().startsWith(marca.toUpperCase() + " "))) {
    // Só quando a marca é palavra inteira: "NZ" não pode comer o "NZ" de "NZPPF".
    nome = nome.slice(marca.length).trim();
  }
  if (!nome) nome = row.sku;
  return nome
    .split(/\s+/)
    .map((w) => (/^[A-Z0-9][A-Z0-9-]{1,5}$/.test(w) && /\d/.test(w) ? w : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

/** Mapa de categoria do ERP → aplicação da loja. */
export function aplicacoesDeVertical(v: VerticalErp): ('automotivo' | 'arquitetonico' | 'comunicacao-visual')[] {
  if (v === 'DECOR') return ['arquitetonico'];
  if (v === 'SIGN') return ['comunicacao-visual'];
  return ['automotivo'];
}

/** Linha do produto 'erp-auto' inteira, pronta para gravar em `produtos`. */
export function produtoAutoDeSku(row: ErpSkuBasico) {
  const vertical = verticalDeCategoria(row.categoria, row.marca);
  const { linha, brandKey, marcaExibicao } = linhaDeMarca(row);
  return {
    slug: slugErp(row),
    erp_sku: row.sku,
    tipo_vinculo: 'proprio' as const,
    nome: nomeExibicaoErp(row),
    subtitulo: LINHA_LABEL[linha],
    marca_exibicao: marcaExibicao,
    brand_key: brandKey,
    linha_key: linha,
    linha_label: LINHA_LABEL[linha],
    vertical,
    kind: vertical === 'DECOR' ? ('padrao' as const) : ('cor' as const),
    aplicacoes: aplicacoesDeVertical(vertical),
    codigo: row.sku,
    publicado: true,
    origem: 'erp-auto' as const,
    fonte_original: 'erp',
  };
}
