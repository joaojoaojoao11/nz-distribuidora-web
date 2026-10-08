// Mostruário da cor em PDF — o que o documento precisa, preparado ANTES de montar.
//
// O João pediu (08/10/2026) um botão na página do produto que gere um arquivo
// padrão com todas as fotos do anúncio, para o vendedor ou o instalador
// apresentar a cor ao cliente. Sem API: o texto sai dos dados que a página já
// tem (nome, linha, acabamento, ficha), e o PDF é montado no navegador com o
// mesmo motor do portfólio NZPPF (src/pages/Ppf/generatePpfPortfolioPdf.ts).
//
// As fotos são baixadas aqui e viram `blob:` (mesma origem). Assim o
// html2canvas nunca esbarra em CORS das fotos que moram no Storage do
// Supabase, e já sabemos a proporção de cada uma para diagramar as páginas.

import QRCode from 'qrcode';
import type { FichaDoProduto } from '../../../lib/shop/linhas';
import type { MidiaPublica, ShopItem, ShopSpec } from '../../../lib/shop/types';
import { DECOR, VENDAS, type Contato } from '../../../lib/contatos';

export interface FotoMostruario {
  src: string;
  /** largura / altura */
  ar: number;
  legenda: string | null;
}

export interface FotoNaLinha extends FotoMostruario {
  largura: number;
}

export interface LinhaDeFotos {
  altura: number;
  fotos: FotoNaLinha[];
  /** Legenda única quando todas as fotos da linha dizem a mesma coisa. */
  legendaUnica: string | null;
}

export interface DadosMostruario {
  nome: string;
  codigo: string | null;
  linha: string;
  acabamento: string | null;
  familia: string | null;
  hex: string | null;
  textoCapa: string;
  sobre: string | null;
  capa: FotoMostruario | null;
  paginasDeFotos: LinhaDeFotos[][];
  ficha: ShopSpec[];
  fichaLinhaLabel: string | null;
  fichaLinha: ShopSpec[];
  aplicacoes: string[];
  cuidados: string | null;
  url: string;
  urlCurta: string;
  qr: string;
  contatos: Contato[];
  data: string;
}

// Diagramação, em px da página A4 @150 DPI (1240 × 1754).
const LARGURA_UTIL = 1064;
const GAP = 28;
const ALTURA_ALVO = 600;
const ALTURA_MAX = 640;
const ALTURA_LEGENDA = 44;
const ESPACO_ENTRE_LINHAS = 36;
const ALTURA_UTIL_PAGINA = 1500;
/** Ficha da linha pode ter 16 itens; na última página cabem estes. */
const MAX_FICHA = 12;

const SITE = 'https://www.nzgroup.com.br';

/** "Mercedes-Benz EQS envelopado em … — perfil puro" → "Mercedes-Benz EQS · perfil puro". */
export function legendaCurta(alt: string | null): string | null {
  if (!alt) return null;
  if (/amostra/i.test(alt)) return 'Foto real da amostra';
  const [antes, depois] = alt.split(' — ');
  const assunto = antes.split(/\s+envelopad[oa]s?\s+/i)[0].trim();
  if (depois) return `${assunto} · ${depois.trim()}`;
  return antes.length <= 60 ? antes : null;
}

/**
 * Linhas justificadas: cada linha junta de 1 a 4 fotos na altura que ficar
 * mais perto de ALTURA_ALVO, sem passar de ALTURA_MAX. No empate, mais fotos
 * na linha (duas amostras em pé lado a lado, e não uma por linha).
 */
export function montarLinhas(fotos: FotoMostruario[]): LinhaDeFotos[] {
  const grupos: FotoMostruario[][] = [];
  let i = 0;
  while (i < fotos.length) {
    let melhorK = 1;
    let melhorDif = Infinity;
    for (let k = 1; k <= 4 && i + k <= fotos.length; k++) {
      const soma = fotos.slice(i, i + k).reduce((s, f) => s + f.ar, 0);
      const h = Math.min(ALTURA_MAX, (LARGURA_UTIL - GAP * (k - 1)) / soma);
      const dif = Math.abs(h - ALTURA_ALVO) + (h < 300 ? 1000 : 0);
      if (dif <= melhorDif) {
        melhorDif = dif;
        melhorK = k;
      }
    }
    grupos.push(fotos.slice(i, i + melhorK));
    i += melhorK;
  }
  // Última linha com uma foto só depois de uma linha cheia: divide melhor (3+1 → 2+2).
  const n = grupos.length;
  if (n >= 2 && grupos[n - 1].length === 1 && grupos[n - 2].length >= 3) {
    grupos[n - 1].unshift(grupos[n - 2].pop() as FotoMostruario);
  }

  return grupos.map((g) => {
    const soma = g.reduce((s, f) => s + f.ar, 0);
    const altura = Math.round(Math.min(ALTURA_MAX, (LARGURA_UTIL - GAP * (g.length - 1)) / soma));
    const legendas = g.map((f) => f.legenda);
    const iguais = legendas.every((l) => l === legendas[0]);
    return {
      altura,
      fotos: g.map((f) => ({ ...f, largura: Math.round(altura * f.ar) })),
      legendaUnica: iguais ? legendas[0] : null,
    };
  });
}

function alturaDaLinha(l: LinhaDeFotos): number {
  const temLegenda = l.legendaUnica || l.fotos.some((f) => f.legenda);
  return l.altura + (temLegenda ? ALTURA_LEGENDA : 0) + ESPACO_ENTRE_LINHAS;
}

export function paginar(linhas: LinhaDeFotos[]): LinhaDeFotos[][] {
  const paginas: LinhaDeFotos[][] = [];
  let atual: LinhaDeFotos[] = [];
  let usado = 0;
  for (const l of linhas) {
    const h = alturaDaLinha(l);
    if (atual.length && usado + h > ALTURA_UTIL_PAGINA) {
      paginas.push(atual);
      atual = [];
      usado = 0;
    }
    atual.push(l);
    usado += h;
  }
  if (atual.length) paginas.push(atual);
  return paginas;
}

async function carregar(m: MidiaPublica): Promise<FotoMostruario | null> {
  try {
    const r = await fetch(m.url, { mode: 'cors' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const src = URL.createObjectURL(await r.blob());
    // `onload`, e não `decode()`: com a aba em segundo plano o Chrome adia o
    // decode indefinidamente, e quem clicou e foi para outra aba ficaria
    // preso em "Juntando as fotos…".
    const img = new Image();
    await new Promise<void>((ok, falha) => {
      img.onload = () => ok();
      img.onerror = () => falha(new Error('imagem inválida'));
      img.src = src;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('imagem vazia');
    return { src, ar: img.naturalWidth / img.naturalHeight, legenda: legendaCurta(m.alt) };
  } catch (e) {
    // Uma foto que não carrega não derruba o mostruário: sai sem ela.
    console.warn('Mostruário: foto ignorada', m.url, e);
    return null;
  }
}

/** Texto padrão da capa. Só com dado que a página já tem — nada inventado. */
function textoDaCapa(nome: string, codigo: string | null, linha: string, acabamento: string | null, temAmostra: boolean): string {
  const partes = [`${nome}${codigo ? ` (${codigo})` : ''} é uma cor da linha ${linha}${acabamento ? `, acabamento ${acabamento.toLowerCase()}` : ''}.`];
  partes.push(
    temAmostra
      ? 'Aqui estão as fotos da cor publicadas na loja da NZ, com a foto real da amostra na mão.'
      : 'Aqui estão as fotos da cor publicadas na loja da NZ.'
  );
  partes.push('Tela e impressão alteram a cor: a amostra física é a única referência fiel.');
  return partes.join(' ');
}

export interface Preparado {
  dados: DadosMostruario;
  arquivo: string;
  liberar: () => void;
}

export async function prepararMostruario(
  item: ShopItem,
  midias: MidiaPublica[],
  ficha: FichaDoProduto,
  rotulos: { familia: string | null }
): Promise<Preparado> {
  const imagens = midias.filter((m) => m.tipo === 'imagem');
  const carregadas = (await Promise.all(imagens.map(carregar))).filter((f): f is FotoMostruario => f !== null);
  if (!carregadas.length) throw new Error('nenhuma foto carregou');

  // Capa: a primeira foto deitada (o carro aplicado apresenta melhor a cor do
  // que o rolo no fundo branco, que vai para as páginas de fotos).
  const iCapa = Math.max(0, carregadas.findIndex((f) => f.ar >= 1.25));
  const capa = carregadas[iCapa];
  const resto = carregadas.filter((_, i) => i !== iCapa);
  const url = `${SITE}/loja/${item.slug}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#000000', light: '#ffffff' } });

  const linha = item.line ?? item.brand;
  const temAmostra = imagens.some((m) => /amostra/i.test(m.alt ?? ''));
  const fichaLinha = ficha.linha.slice(0, MAX_FICHA);

  const dados: DadosMostruario = {
    nome: item.name,
    codigo: item.code,
    linha,
    acabamento: item.finishLabel,
    familia: rotulos.familia,
    hex: item.hex,
    textoCapa: textoDaCapa(item.name, item.code, linha, item.finishLabel, temAmostra),
    sobre: ficha.descricao,
    capa,
    paginasDeFotos: paginar(montarLinhas(resto)),
    ficha: ficha.variante,
    fichaLinhaLabel: ficha.linhaLabel,
    fichaLinha,
    aplicacoes: ficha.aplicacoes,
    cuidados: ficha.cuidados,
    url,
    urlCurta: `nzgroup.com.br/loja/${item.slug}`,
    qr,
    contatos: item.vertical === 'DECOR' ? [DECOR] : VENDAS,
    data: new Date().toLocaleDateString('pt-BR'),
  };

  const base = [item.code, item.name]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    dados,
    arquivo: `Mostruario_NZ_${base || 'cor'}.pdf`,
    liberar: () => carregadas.forEach((f) => URL.revokeObjectURL(f.src)),
  };
}
