// Ponte entre o navegador e o algoritmo puro de paleta (./paleta.ts).
//
// Só o que precisa de DOM mora aqui: decodificar o arquivo, desenhar pequeno
// num canvas e ler os pixels. A matemática é a mesma do script que amostra as
// fotos do catálogo — é o que faz a foto do produto reencontrar o produto.

import {
  amostrarPontoDePixels,
  estimarFundo,
  extrairPaletaDePixels,
  MIN_UNIFORMIDADE,
  type CorDaPaleta,
  type OpcoesPaleta,
} from './paleta';

/** Lado maior da imagem de análise. 72 px bastam para cor; mais só custa. */
export const LADO_ANALISE = 72;

/**
 * Mesmas opções do script de catálogo (scripts/amostrar-hex-fotos.mjs):
 * fundo fora, logo do canto fora, 4 cores. Usado pelo admin ao trocar a capa —
 * assim produto novo nasce com a MESMA cor de busca que o script daria.
 */
export const OPCOES_CATALOGO: OpcoesPaleta = {
  k: 4,
  ignorarFundo: true,
  ignorarCanto: { largura: 0.42, altura: 0.2 },
};

export interface ImagemAnalisada {
  /** Pixels reduzidos (RGBA), para paleta e para o toque na foto. */
  data: Uint8ClampedArray;
  largura: number;
  altura: number;
  paleta: CorDaPaleta[];
  /** A foto tem fundo uniforme (estúdio), que saiu da paleta. */
  fundoUniforme: boolean;
}

async function decodificar(arquivo: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    // 'from-image' aplica a orientação EXIF: a foto do celular chega em pé.
    return createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(arquivo);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('imagem-invalida'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Lê o arquivo e devolve pixels pequenos + paleta. Lança `imagem-invalida`
 * quando o navegador não decodifica (HEIC fora do Safari, arquivo corrompido).
 */
export async function analisarImagem(
  arquivo: Blob,
  modo: 'foto' | 'catalogo' = 'foto'
): Promise<ImagemAnalisada> {
  let fonte: ImageBitmap | HTMLImageElement;
  try {
    fonte = await decodificar(arquivo);
  } catch {
    throw new Error('imagem-invalida');
  }
  try {
    const w0 = 'naturalWidth' in fonte ? fonte.naturalWidth : fonte.width;
    const h0 = 'naturalHeight' in fonte ? fonte.naturalHeight : fonte.height;
    if (!w0 || !h0) throw new Error('imagem-invalida');
    const escala = Math.min(1, LADO_ANALISE / Math.max(w0, h0));
    const largura = Math.max(1, Math.round(w0 * escala));
    const altura = Math.max(1, Math.round(h0 * escala));

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas-indisponivel');
    ctx.drawImage(fonte, 0, 0, largura, altura);
    const { data } = ctx.getImageData(0, 0, largura, altura);

    const fundo = estimarFundo(data, largura, altura);
    const fundoUniforme = Boolean(fundo && fundo.uniformidade >= MIN_UNIFORMIDADE);

    if (modo === 'catalogo') {
      const paleta = extrairPaletaDePixels(data, largura, altura, OPCOES_CATALOGO);
      return { data, largura, altura, paleta, fundoUniforme };
    }

    // Foto comum: o fundo uniforme (estúdio, parede) sai; sem fundo uniforme
    // (rua, pátio), vale o centro da foto, onde o assunto está. Decisão dentro
    // de extrairPaletaDePixels — a mesma do catálogo.
    const paleta = extrairPaletaDePixels(data, largura, altura, { k: 5, ignorarFundo: true });
    return { data, largura, altura, paleta, fundoUniforme };
  } finally {
    if ('close' in fonte) fonte.close();
  }
}

/**
 * Cor no ponto tocado. `fx`/`fy` são frações (0–1) da imagem exibida — a
 * imagem de análise é menor, mas tem a mesma proporção.
 */
export function corNoPonto(img: ImagemAnalisada, fx: number, fy: number): string | null {
  const x = Math.min(img.largura - 1, Math.max(0, fx * img.largura));
  const y = Math.min(img.altura - 1, Math.max(0, fy * img.altura));
  return amostrarPontoDePixels(img.data, img.largura, img.altura, x, y, 2);
}
