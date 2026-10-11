// Paleta dominante de uma imagem — o coração da busca por imagem.
//
// Recebe PIXELS (RGBA, como `ImageData.data` no navegador ou o buffer raw do
// sharp no node), nunca um elemento de DOM: é o que deixa o MESMO algoritmo
// rodar na Lente (foto do cliente), no script que amostra a cor das fotos do
// catálogo e no autoteste. Se os dois lados usassem código diferente, a
// "mesma foto" daria cores diferentes e a auto-recuperação não fecharia.
//
// Algoritmo: amostragem de até ~4 mil pixels, conversão para Lab, k-means com
// inicialização k-means++ e gerador determinístico (mesma foto ⇒ mesma paleta),
// fusão de clusters quase iguais e ordenação por peso.
//
// Fundo: a foto de catálogo é um rolo sobre um fundo de estúdio — branco quase
// sempre, mas também o branco-rosado da Metamark e, em renders, o preto. Em vez
// de "tirar o branco", o fundo é ESTIMADO pela borda da imagem: se a borda é
// uniforme, a cor dela é o fundo e sai, seja qual for. Se a borda não é
// uniforme (foto de carro na rua), não há fundo a tirar; aí a paleta é lida
// só do centro, onde o assunto está. Se tirar o fundo comer quase tudo (o
// produto É da cor do fundo, ou é uma textura que preenche o quadro), o corte
// é desfeito.

import { chroma, deltaE2000, labToHex, rgbToLab, type Lab } from './lab';

export interface CorDaPaleta {
  hex: string;
  /** Fração dos pixels considerados (0–1). A soma da paleta é 1. */
  peso: number;
  lab: Lab;
}

export interface OpcoesPaleta {
  /** Número de cores. Padrão 5. */
  k?: number;
  /** Teto de pixels amostrados. Padrão 4096. */
  amostras?: number;
  /**
   * Tira o fundo antes de agrupar: a cor uniforme da borda (qualquer cor) e o
   * branco de papel. Sem borda uniforme, lê só o centro. Padrão false.
   */
  ignorarFundo?: boolean;
  /**
   * Fração da imagem a ignorar no canto superior esquerdo — onde as fotos de
   * catálogo têm o logo da marca. `{ largura: 0.42, altura: 0.2 }`.
   */
  ignorarCanto?: { largura: number; altura: number } | null;
  /** Semente do gerador. Padrão 7. Mude só em teste. */
  semente?: number;
}

/** Pixel que é "papel": claro e sem croma. */
export function ehFundoBranco(lab: Lab): boolean {
  return lab.L > 92 && chroma(lab) < 5;
}

/** Anel da borda usado para estimar o fundo (fração de cada lado). */
const BORDA = 0.08;
/** Borda com pelo menos isto de pixels perto da mediana é "uniforme". */
export const MIN_UNIFORMIDADE = 0.65;
/** Pixel a menos que isto (ΔE2000) do fundo estimado é fundo. */
const DE_FUNDO = 10;
/** Se, tirado o fundo, sobrar menos que isto, o produto era o "fundo": desfaz. */
const MIN_RESTANTE = 0.15;

export interface FundoEstimado {
  /** Mediana (por canal) da borda. */
  lab: Lab;
  /** Fração da borda a menos de DE_FUNDO da mediana. ≥ MIN_UNIFORMIDADE ⇒ é fundo. */
  uniformidade: number;
  /** Fração da borda que é branco de papel. */
  fracaoBranca: number;
}

function mediana(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Lê a borda (anel de 8%) e estima a cor de fundo e quão uniforme ela é. */
export function estimarFundo(data: ArrayLike<number>, largura: number, altura: number): FundoEstimado | null {
  const mx = Math.max(1, Math.floor(largura * BORDA));
  const my = Math.max(1, Math.floor(altura * BORDA));
  const total = largura * altura;
  const passo = Math.max(1, Math.floor(total / 6000));
  const Ls: number[] = [];
  const as: number[] = [];
  const bs: number[] = [];
  const labs: Lab[] = [];
  let brancos = 0;
  for (let i = 0; i < total; i += passo) {
    const x = i % largura;
    const y = (i / largura) | 0;
    if (x >= mx && x < largura - mx && y >= my && y < altura - my) continue;
    const o = i * 4;
    if (data[o + 3] < 200) continue;
    const lab = rgbToLab(data[o], data[o + 1], data[o + 2]);
    labs.push(lab);
    Ls.push(lab.L);
    as.push(lab.a);
    bs.push(lab.b);
    if (ehFundoBranco(lab)) brancos++;
  }
  if (!labs.length) return null;
  const centro = { L: mediana(Ls), a: mediana(as), b: mediana(bs) };
  let perto = 0;
  for (const lab of labs) if (deltaE2000(lab, centro) < DE_FUNDO) perto++;
  return { lab: centro, uniformidade: perto / labs.length, fracaoBranca: brancos / labs.length };
}

/** Fração de pixels brancos na borda. Atalho sobre `estimarFundo`. */
export function fracaoDeFundoBranco(data: ArrayLike<number>, largura: number, altura: number): number {
  return estimarFundo(data, largura, altura)?.fracaoBranca ?? 0;
}

export function extrairPaletaDePixels(
  data: ArrayLike<number>,
  largura: number,
  altura: number,
  opcoes: OpcoesPaleta = {}
): CorDaPaleta[] {
  const k = Math.max(1, opcoes.k ?? 5);
  const total = largura * altura;
  if (!total) return [];
  let passo = Math.max(1, Math.floor(total / (opcoes.amostras ?? 4096)));
  // Passo múltiplo da largura amostraria sempre as mesmas colunas.
  if (passo > 1 && largura % passo === 0) passo += 1;

  const canto = opcoes.ignorarCanto ?? null;
  const cx = canto ? Math.floor(largura * canto.largura) : 0;
  const cy = canto ? Math.floor(altura * canto.altura) : 0;

  // Fundo: cor uniforme da borda, se houver. Sem borda uniforme, só o centro
  // (60% × 60%) entra — é onde o assunto de uma foto comum está.
  const fundo = opcoes.ignorarFundo ? estimarFundo(data, largura, altura) : null;
  const fundoUniforme = fundo && fundo.uniformidade >= MIN_UNIFORMIDADE ? fundo.lab : null;
  const soCentro = Boolean(opcoes.ignorarFundo) && !fundoUniforme;
  const x0 = soCentro ? Math.floor(largura * 0.2) : 0;
  const x1 = soCentro ? Math.ceil(largura * 0.8) : largura;
  const y0 = soCentro ? Math.floor(altura * 0.2) : 0;
  const y1 = soCentro ? Math.ceil(altura * 0.8) : altura;
  const ehFundo = (lab: Lab) =>
    fundoUniforme ? deltaE2000(lab, fundoUniforme) < DE_FUNDO || ehFundoBranco(lab) : ehFundoBranco(lab);

  const pixels: Lab[] = [];
  const descartados: Lab[] = [];
  for (let i = 0; i < total; i += passo) {
    const o = i * 4;
    if (data[o + 3] < 200) continue;
    const x = i % largura;
    const y = (i / largura) | 0;
    if (x < x0 || x >= x1 || y < y0 || y >= y1) continue;
    if (canto && x < cx && y < cy) continue;
    const lab = rgbToLab(data[o], data[o + 1], data[o + 2]);
    if (opcoes.ignorarFundo && ehFundo(lab)) descartados.push(lab);
    else pixels.push(lab);
  }

  // O produto é da cor do fundo (ou é uma textura que preenche o quadro): o
  // corte comeu quase tudo. Volta tudo.
  let base = pixels;
  const considerados = pixels.length + descartados.length;
  if (opcoes.ignorarFundo && pixels.length < Math.max(16, considerados * MIN_RESTANTE)) {
    base = pixels.concat(descartados);
  }
  if (!base.length) return [];

  return kMeans(base, Math.min(k, base.length), opcoes.semente ?? 7);
}

/**
 * Cor média de uma janela quadrada em torno de (x, y), em Lab. É o "toque na
 * foto" da Lente. `null` só se a janela não tiver pixel opaco.
 */
export function amostrarPontoDePixels(
  data: ArrayLike<number>,
  largura: number,
  altura: number,
  x: number,
  y: number,
  raio = 4
): string | null {
  const x0 = Math.max(0, Math.floor(x) - raio);
  const x1 = Math.min(largura - 1, Math.floor(x) + raio);
  const y0 = Math.max(0, Math.floor(y) - raio);
  const y1 = Math.min(altura - 1, Math.floor(y) + raio);
  let L = 0;
  let a = 0;
  let b = 0;
  let n = 0;
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const o = (yy * largura + xx) * 4;
      if (data[o + 3] < 200) continue;
      const lab = rgbToLab(data[o], data[o + 1], data[o + 2]);
      L += lab.L;
      a += lab.a;
      b += lab.b;
      n++;
    }
  }
  if (!n) return null;
  return labToHex({ L: L / n, a: a / n, b: b / n });
}

// ------------------------------------------------------------------ k-means

function dist2(p: Lab, q: Lab): number {
  const dL = p.L - q.L;
  const da = p.a - q.a;
  const db = p.b - q.b;
  return dL * dL + da * da + db * db;
}

/** Gerador determinístico pequeno (mulberry32). */
function gerador(semente: number): () => number {
  let s = semente | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dois centros mais perto que isto são a mesma cor para quem olha. */
const FUSAO_DE = 6;

function kMeans(pontos: Lab[], k: number, semente: number): CorDaPaleta[] {
  const rand = gerador(semente);

  // k-means++: cada centro novo é sorteado proporcional à distância² ao mais
  // próximo já escolhido. Separa as cores de verdade em vez de cair todos no
  // mesmo tom.
  const centros: Lab[] = [{ ...pontos[Math.floor(rand() * pontos.length)] }];
  const d2 = new Float64Array(pontos.length).fill(Infinity);
  while (centros.length < k) {
    const ultimo = centros[centros.length - 1];
    let soma = 0;
    for (let i = 0; i < pontos.length; i++) {
      const d = dist2(pontos[i], ultimo);
      if (d < d2[i]) d2[i] = d;
      soma += d2[i];
    }
    if (soma === 0) break;
    let alvo = rand() * soma;
    let idx = pontos.length - 1;
    for (let i = 0; i < pontos.length; i++) {
      alvo -= d2[i];
      if (alvo <= 0) {
        idx = i;
        break;
      }
    }
    centros.push({ ...pontos[idx] });
  }

  const atrib = new Int32Array(pontos.length).fill(-1);
  const soma = centros.map(() => ({ L: 0, a: 0, b: 0, n: 0 }));
  for (let iter = 0; iter < 24; iter++) {
    let mudou = false;
    for (const s of soma) {
      s.L = 0;
      s.a = 0;
      s.b = 0;
      s.n = 0;
    }
    for (let i = 0; i < pontos.length; i++) {
      let melhor = 0;
      let md = Infinity;
      for (let c = 0; c < centros.length; c++) {
        const d = dist2(pontos[i], centros[c]);
        if (d < md) {
          md = d;
          melhor = c;
        }
      }
      if (atrib[i] !== melhor) {
        atrib[i] = melhor;
        mudou = true;
      }
      const s = soma[melhor];
      s.L += pontos[i].L;
      s.a += pontos[i].a;
      s.b += pontos[i].b;
      s.n++;
    }
    for (let c = 0; c < centros.length; c++) {
      const s = soma[c];
      if (s.n) centros[c] = { L: s.L / s.n, a: s.a / s.n, b: s.b / s.n };
    }
    if (!mudou) break;
  }

  let grupos = centros
    .map((lab, c) => ({ lab, n: soma[c].n }))
    .filter((g) => g.n > 0)
    .sort((a, b) => b.n - a.n);

  // Fusão: dois centros a menos de FUSAO_DE são a mesma cor dividida em dois.
  // O mais pesado fica; o outro soma o peso.
  const fundidos: { lab: Lab; n: number }[] = [];
  for (const g of grupos) {
    const igual = fundidos.find((f) => deltaE2000(f.lab, g.lab) < FUSAO_DE);
    if (igual) igual.n += g.n;
    else fundidos.push({ ...g });
  }
  grupos = fundidos.sort((a, b) => b.n - a.n);

  const total = grupos.reduce((acc, g) => acc + g.n, 0) || 1;
  return grupos.map((g) => ({ hex: labToHex(g.lab), peso: g.n / total, lab: g.lab }));
}
