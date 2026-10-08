// Mostruário da cor em PDF — o que o documento precisa, preparado ANTES de montar.
//
// O João pediu (08/10/2026) um botão na página do produto que gere um arquivo
// padrão com todas as fotos do anúncio, para o vendedor ou o instalador
// apresentar a cor ao cliente. Sem API: o texto sai dos dados que a página já
// tem (nome, linha, acabamento, ficha), e o PDF é montado no navegador com o
// mesmo motor do portfólio NZPPF (src/pages/Ppf/generatePpfPortfolioPdf.ts).
//
// Duas versões (João, mesmo dia): COM o contato da NZ e SEM contato. O
// instalador muitas vezes não quer que o dono do carro conheça a fonte; a
// versão sem contato não leva logo, nome, site, telefone, QR nem o código
// interno da NZ — só a marca e o código do fabricante.
//
// As fotos são baixadas aqui e viram `blob:` (mesma origem). Assim o
// html2canvas nunca esbarra em CORS das fotos que moram no Storage do
// Supabase, e já sabemos a proporção de cada uma para diagramar as páginas.

import QRCode from 'qrcode';
import type { FichaDoProduto } from '../../../lib/shop/linhas';
import type { MidiaPublica, ShopItem, ShopSpec } from '../../../lib/shop/types';
import { DECOR, VENDAS, type Contato } from '../../../lib/contatos';

type TipoFoto = 'aplicacao' | 'amostra' | 'produto';

export interface FotoMostruario {
  src: string;
  /** largura / altura */
  ar: number;
  legenda: string | null;
  tipo: TipoFoto;
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

export interface PaginaDeFotos {
  titulo: string;
  subtitulo: string | null;
  linhas: LinhaDeFotos[];
}

export interface Detalhe {
  rotulo: string;
  valor: string;
}

export interface DadosMostruario {
  comContato: boolean;
  marca: string;
  titulo: string;
  codigo: string | null;
  detalhes: Detalhe[];
  hex: string | null;
  introducao: string;
  capa: FotoMostruario | null;
  paginasDeFotos: PaginaDeFotos[];
  produto: FotoMostruario | null;
  ficha: ShopSpec[];
  aplicacoes: string[];
  sobre: string | null;
  sobreTitulo: string;
  aviso: string;
  url: string;
  qr: string | null;
  contatos: Contato[];
  data: string;
}

// Diagramação, em px da página A4 @150 DPI (1240 × 1754).
const LARGURA_UTIL = 1064;
const GAP = 28;
const ALTURA_ALVO = 580;
const ALTURA_MAX = 610;
const ALTURA_LEGENDA = 44;
const ESPACO_ENTRE_LINHAS = 36;
/** Área de fotos de uma página, já descontado o título da seção. */
const ALTURA_UTIL_PAGINA = 1400;
/** A ficha da linha pode ter 16 itens; na última página cabem estes. */
const MAX_FICHA = 12;

const SITE = 'https://www.nzgroup.com.br';

/** Siglas que continuam em caixa alta quando o nome vem todo maiúsculo. */
const SIGLAS = new Set(['PET', 'PVC', 'PPF', 'TPU', 'UV', 'RA', 'II', 'III', 'XL', 'HD', 'NZ']);

function capitalizar(palavra: string): string {
  if (SIGLAS.has(palavra.toUpperCase())) return palavra.toUpperCase();
  const p = palavra.toLowerCase();
  // McLaren, McQueen
  if (/^mc[a-z]/.test(p)) return 'Mc' + p.charAt(2).toUpperCase() + p.slice(3);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/**
 * "EMT 020 SATIN METALLIC MATT MIST BLUE" → código "EMT-020" e título
 * "Satin Metallic Matt Mist Blue". Nome que já vem em caixa mista fica como está.
 */
export function separarNome(nome: string, codigo: string | null): { titulo: string; codigo: string | null } {
  const m = nome.match(/^([A-Za-z]{2,5})[\s-]?(\d{2,4})\s+(.+)$/);
  const resto = m ? m[3] : nome;
  const caixaAlta = resto === resto.toUpperCase();
  const titulo = caixaAlta ? resto.split(/\s+/).map(capitalizar).join(' ') : resto;
  return { titulo, codigo: m ? `${m[1].toUpperCase()}-${m[2]}` : codigo };
}

/** "Mercedes-Benz EQS envelopado em … — perfil puro" → "Mercedes-Benz EQS · perfil puro". */
export function legendaCurta(alt: string | null): string | null {
  if (!alt) return null;
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
export function montarLinhas(fotos: FotoMostruario[], alvo = ALTURA_ALVO): LinhaDeFotos[] {
  const grupos: FotoMostruario[][] = [];
  let i = 0;
  while (i < fotos.length) {
    let melhorK = 1;
    let melhorDif = Infinity;
    for (let k = 1; k <= 4 && i + k <= fotos.length; k++) {
      const soma = fotos.slice(i, i + k).reduce((s, f) => s + f.ar, 0);
      const h = Math.min(ALTURA_MAX, (LARGURA_UTIL - GAP * (k - 1)) / soma);
      const dif = Math.abs(h - alvo) + (h < 300 ? 1000 : 0);
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

function paginar(linhas: LinhaDeFotos[]): LinhaDeFotos[][] {
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

async function carregar(m: MidiaPublica, imagemPrincipal: string | null): Promise<FotoMostruario | null> {
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
    const amostra = /amostra/i.test(m.alt ?? '');
    const tipo: TipoFoto = amostra ? 'amostra' : m.url === imagemPrincipal ? 'produto' : 'aplicacao';
    // A amostra já tem título de seção; legenda repetida em cada foto só polui.
    return { src, ar: img.naturalWidth / img.naturalHeight, legenda: amostra ? null : legendaCurta(m.alt), tipo };
  } catch (e) {
    // Uma foto que não carrega não derruba o mostruário: sai sem ela.
    console.warn('Mostruário: foto ignorada', m.url, e);
    return null;
  }
}

function ocupacao(pagina: LinhaDeFotos[]): number {
  return pagina.reduce((s, l) => s + alturaDaLinha(l), 0) / ALTURA_UTIL_PAGINA;
}

/**
 * Fotos grandes primeiro. Se a última página ficar com menos da metade
 * ocupada (3 fotos de carro = 2 + 1 sozinha), tenta o arranjo compacto — duas
 * deitadas lado a lado — e fica com ele quando economiza página.
 */
function secao(titulo: string, subtitulo: string | null, fotos: FotoMostruario[]): PaginaDeFotos[] {
  if (!fotos.length) return [];
  let paginas = paginar(montarLinhas(fotos));
  if (paginas.length > 1 && ocupacao(paginas[paginas.length - 1]) < 0.5) {
    const compacto = paginar(montarLinhas(fotos, 340));
    if (compacto.length < paginas.length) paginas = compacto;
  }
  return paginas.map((linhas) => ({ titulo, subtitulo, linhas }));
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
  rotulos: { familia: string | null; acabamento: string | null },
  comContato: boolean
): Promise<Preparado> {
  const imagens = midias.filter((m) => m.tipo === 'imagem');
  const carregadas = (await Promise.all(imagens.map((m) => carregar(m, item.image)))).filter(
    (f): f is FotoMostruario => f !== null
  );
  if (!carregadas.length) throw new Error('nenhuma foto carregou');

  // Capa: a primeira foto da cor aplicada, deitada. O carro apresenta a cor
  // melhor do que o rolo no fundo branco, que vai para a página do material.
  const deitada = (f: FotoMostruario) => f.ar >= 1.25;
  const capa =
    carregadas.find((f) => f.tipo === 'aplicacao' && deitada(f)) ?? carregadas.find(deitada) ?? carregadas[0];
  const resto = carregadas.filter((f) => f !== capa);
  const produto = resto.find((f) => f.tipo === 'produto') ?? null;
  const aplicacao = resto.filter((f) => f.tipo === 'aplicacao');
  const amostras = resto.filter((f) => f.tipo === 'amostra');

  const { titulo, codigo } = separarNome(item.name, item.code);
  const largura = item.larguraM && item.larguraM > 0 ? `${String(item.larguraM).replace('.', ',')} m` : null;
  // A marca já é o sobretítulo da capa; a linha só entra quando diz outra coisa.
  const linha = item.line && item.line !== item.brand ? item.line : null;
  const detalhes: Detalhe[] = [
    ...(linha ? [{ rotulo: 'Linha', valor: linha }] : []),
    ...(rotulos.acabamento ? [{ rotulo: 'Acabamento', valor: rotulos.acabamento }] : []),
    ...(rotulos.familia ? [{ rotulo: 'Cor', valor: rotulos.familia }] : []),
    ...(largura ? [{ rotulo: 'Largura do rolo', valor: largura }] : []),
  ].slice(0, 4);

  // Na versão sem contato sai o código interno da NZ (SPW…); o do fabricante
  // já está no cabeçalho da capa.
  const fichaCompleta = [...ficha.variante, ...ficha.linha.slice(0, MAX_FICHA)].filter(
    (s) => comContato || !/^c[oó]digo/i.test(s.label)
  );

  const url = `${SITE}/loja/${item.slug}`;
  const qr = comContato
    ? await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#000000', light: '#ffffff' } })
    : null;

  const dados: DadosMostruario = {
    comContato,
    marca: item.brand,
    titulo,
    codigo,
    detalhes,
    hex: item.hex,
    introducao:
      amostras.length > 0
        ? 'Fotos da cor aplicada e da amostra real, para escolher com segurança. Tela e impressão alteram a cor: confira sempre a amostra física.'
        : 'Fotos da cor aplicada, para escolher com segurança. Tela e impressão alteram a cor: confira sempre a amostra física.',
    capa,
    paginasDeFotos: [
      ...secao('A cor aplicada', null, aplicacao),
      ...secao('A amostra real', 'Foto na mão, sem filtro: é o que mais se aproxima da cor ao vivo.', amostras),
    ],
    produto,
    ficha: fichaCompleta,
    aplicacoes: ficha.aplicacoes,
    sobre: ficha.descricao,
    sobreTitulo: ficha.linhaLabel ? `Sobre a linha ${ficha.linhaLabel}` : 'Sobre a cor',
    aviso: comContato
      ? 'As cores em tela e em impressão são aproximadas. A amostra física é a única referência fiel: peça a sua junto com o orçamento.'
      : 'As cores em tela e em impressão são aproximadas. A amostra física é a única referência fiel: peça para ver a amostra antes de fechar.',
    url,
    qr,
    contatos: comContato ? (item.vertical === 'DECOR' ? [DECOR] : VENDAS) : [],
    data: new Date().toLocaleDateString('pt-BR'),
  };

  const base = [codigo, titulo]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    dados,
    arquivo: comContato ? `Mostruario_NZ_${base || 'cor'}.pdf` : `Mostruario_${base || 'cor'}.pdf`,
    liberar: () => carregadas.forEach((f) => URL.revokeObjectURL(f.src)),
  };
}
