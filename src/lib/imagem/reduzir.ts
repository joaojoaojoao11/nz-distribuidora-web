// Encolhe uma foto no NAVEGADOR, antes de subir.
//
// Existe por um motivo prático: a foto que o instalador tira do celular tem 4 a
// 12 MB, e o corpo de uma função da Vercel para em 4,5 MB. Mandar o arquivo
// cru simplesmente falharia — e falharia justamente para quem está com pressa,
// no pátio, tentando avisar que a foto do produto está errada.
//
// O cálculo do tamanho fica separado do desenho no canvas para poder ser
// testado sem navegador (`npm run selecoes:test`).

/** Lado maior de destino. 1600 é o suficiente para ler um rótulo na foto. */
export const LADO_MAX = 1600;
/** Acima disso o corpo da requisição fica grande demais depois do base64. */
export const BYTES_MAX = 1_500_000;
const QUALIDADE = 0.85;

export interface Dimensao {
  largura: number;
  altura: number;
}

/**
 * Cabe em LADO_MAX sem distorcer. Imagem já pequena NÃO é ampliada — esticar
 * um print de 400px só geraria um arquivo maior e mais borrado.
 */
export function dimensaoDestino({ largura, altura }: Dimensao, ladoMax = LADO_MAX): Dimensao {
  const maior = Math.max(largura, altura);
  if (!(maior > 0)) return { largura: 0, altura: 0 };
  if (maior <= ladoMax) return { largura: Math.round(largura), altura: Math.round(altura) };
  const fator = ladoMax / maior;
  return { largura: Math.max(1, Math.round(largura * fator)), altura: Math.max(1, Math.round(altura * fator)) };
}

export interface ImagemReduzida {
  /** Só o payload, sem o prefixo `data:` — é o que o endpoint espera. */
  base64: string;
  tipo: 'image/jpeg';
  bytes: number;
  largura: number;
  altura: number;
}

export class ImagemGrandeDemais extends Error {
  // Campo declarado e atribuído no corpo: o projeto compila com
  // `erasableSyntaxOnly`, que proíbe propriedade de parâmetro no construtor.
  bytes: number;
  constructor(bytes: number) {
    super('imagem-grande-demais');
    this.bytes = bytes;
  }
}

/**
 * Lê o arquivo, redesenha em JPEG no tamanho de destino e devolve base64.
 *
 * Sempre JPEG: PNG de foto sai maior que o original, e o que se quer aqui é
 * caber no envio, não preservar transparência de um print de tela.
 */
export async function reduzirImagem(arquivo: File, ladoMax = LADO_MAX): Promise<ImagemReduzida> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregar(url);
    const destino = dimensaoDestino({ largura: img.naturalWidth, altura: img.naturalHeight }, ladoMax);
    if (!destino.largura || !destino.altura) throw new Error('imagem-invalida');

    const canvas = document.createElement('canvas');
    canvas.width = destino.largura;
    canvas.height = destino.altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-indisponivel');
    ctx.drawImage(img, 0, 0, destino.largura, destino.altura);

    const dataUrl = canvas.toDataURL('image/jpeg', QUALIDADE);
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    // Cada 4 caracteres de base64 são 3 bytes; o padding '=' não conta.
    const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    if (bytes > BYTES_MAX) throw new ImagemGrandeDemais(bytes);

    return { base64, tipo: 'image/jpeg', bytes, largura: destino.largura, altura: destino.altura };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function carregar(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagem-invalida'));
    img.src = url;
  });
}
