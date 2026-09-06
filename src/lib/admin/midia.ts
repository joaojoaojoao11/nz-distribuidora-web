// Mídia de produto: processamento no navegador, upload e regras de orientação.
//
// POR QUE NO NAVEGADOR
// A Vercel Hobby limita o corpo de uma função a 4,5 MB e o Supabase Free não
// tem transformação de imagem. Então a foto é convertida aqui — WebP, lado
// maior 1600 px — e sobe direto do navegador para o Storage. Uma foto de 8 MB
// vira ~250 kB antes de sair da máquina de quem está cadastrando.
//
// O que NÃO fazemos: mexer na cor. O cliente compara a foto com a amostra
// física; reencodar já é o limite aceitável.

import { supabase } from '../supabase';

export const BUCKET = 'produto-midia';

/** Limites que a UI mostra e o Storage também aplica (allowed_mime_types). */
export const LIMITES = {
  imagemEntradaMax: 25 * 1024 * 1024,
  videoMax: 25 * 1024 * 1024,
  videoDuracaoMaxS: 20,
  ladoMax: 1600,
  ladoMinimo: 600,
  ladoIdeal: 1200,
  qualidade: 0.82,
  /** Acima disto a UI avisa que a foto está pesada. */
  pesoBomBytes: 400 * 1024,
} as const;

export const MIME_IMAGEM = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];
export const MIME_VIDEO = ['video/mp4', 'video/webm'];

export type TipoMidia = 'imagem' | 'video' | 'video-externo';

export interface Midia {
  id: string;
  produto_id: string;
  tipo: TipoMidia;
  url: string;
  poster_url: string | null;
  alt: string | null;
  ordem: number;
  capa: boolean;
  largura: number | null;
  altura: number | null;
  duracao_s: number | null;
  tamanho_bytes: number | null;
  origem: 'upload' | 'estatico' | 'externo' | 'seed';
}

export class MidiaErro extends Error {}

// ------------------------------------------------------------------ imagem

export interface ImagemProcessada {
  blob: Blob;
  largura: number;
  altura: number;
  tamanho: number;
  ext: 'webp';
}

/**
 * Converte para WebP com o lado maior em `ladoMax`. Nunca aumenta: foto menor
 * que o alvo é só reencodada.
 *
 * `quadrado` recorta pelo centro — é o formato da capa (o card da loja é 1:1 e
 * um retângulo esticado fica ruim ao lado dos outros).
 */
export async function processarImagem(
  file: File,
  opcoes: { ladoMax?: number; quadrado?: boolean; qualidade?: number } = {}
): Promise<ImagemProcessada> {
  const ladoMax = opcoes.ladoMax ?? LIMITES.ladoMax;
  const qualidade = opcoes.qualidade ?? LIMITES.qualidade;

  if (file.size > LIMITES.imagemEntradaMax) {
    throw new MidiaErro(`A imagem tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 25 MB.`);
  }
  if (!file.type.startsWith('image/')) {
    throw new MidiaErro('Isto não é uma imagem.');
  }
  if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    throw new MidiaErro('HEIC do iPhone não abre no navegador. Exporte como JPG e tente de novo.');
  }

  // `from-image` respeita a rotação do EXIF; sem isso foto de celular vira de lado.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new MidiaErro('Não consegui abrir esta imagem. Tente exportar como JPG ou PNG.');
  }

  const { width: lw, height: lh } = bitmap;
  if (Math.min(lw, lh) < LIMITES.ladoMinimo) {
    bitmap.close();
    throw new MidiaErro(`A imagem tem ${lw}×${lh}. O mínimo é ${LIMITES.ladoMinimo} px no menor lado.`);
  }

  let sx = 0;
  let sy = 0;
  let sw = lw;
  let sh = lh;
  if (opcoes.quadrado) {
    const lado = Math.min(lw, lh);
    sx = Math.round((lw - lado) / 2);
    sy = Math.round((lh - lado) / 2);
    sw = lado;
    sh = lado;
  }

  const escala = Math.min(1, ladoMax / Math.max(sw, sh));
  const dw = Math.round(sw * escala);
  const dh = Math.round(sh * escala);

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new MidiaErro('O navegador não deixou processar a imagem.');
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', qualidade));
  if (!blob) throw new MidiaErro('Não consegui converter a imagem para WebP.');

  return { blob, largura: dw, altura: dh, tamanho: blob.size, ext: 'webp' };
}

// ------------------------------------------------------------------- vídeo

export interface VideoProcessado {
  arquivo: File;
  poster: Blob;
  largura: number;
  altura: number;
  duracao: number;
  tamanho: number;
}

/**
 * Não reencoda o vídeo (o navegador não faz isso de graça): valida limites e
 * captura um quadro para servir de poster — sem poster o player mostra preto
 * até o vídeo carregar.
 */
export async function processarVideo(file: File): Promise<VideoProcessado> {
  if (!MIME_VIDEO.includes(file.type)) {
    throw new MidiaErro('Use MP4 ou WebM.');
  }
  if (file.size > LIMITES.videoMax) {
    throw new MidiaErro(`O vídeo tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 25 MB.`);
  }

  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new MidiaErro('Não consegui ler este vídeo.'));
      setTimeout(() => reject(new MidiaErro('O vídeo demorou demais para abrir.')), 15000);
    });

    if (video.duration > LIMITES.videoDuracaoMaxS + 0.5) {
      throw new MidiaErro(`O vídeo tem ${Math.round(video.duration)}s. O limite é ${LIMITES.videoDuracaoMaxS}s.`);
    }

    // Meio segundo à frente: o primeiro quadro costuma ser preto.
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new MidiaErro('Não consegui capturar o quadro de capa.'));
      video.currentTime = Math.min(0.5, video.duration / 2);
      setTimeout(() => resolve(), 8000);
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new MidiaErro('O navegador não deixou gerar a capa do vídeo.');
    ctx.drawImage(video, 0, 0);
    const poster = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.8));
    if (!poster) throw new MidiaErro('Não consegui gerar a capa do vídeo.');

    return {
      arquivo: file,
      poster,
      largura: video.videoWidth,
      altura: video.videoHeight,
      duracao: Math.round(video.duration * 100) / 100,
      tamanho: file.size,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------- vídeo externo

export interface VideoExterno {
  plataforma: 'youtube' | 'vimeo' | 'instagram';
  embedUrl: string;
  thumbnail: string | null;
}

/** YouTube / Vimeo / Instagram — não gasta storage e serve para vídeo longo. */
export function lerVideoExterno(bruto: string): VideoExterno | null {
  const url = bruto.trim();
  if (!url) return null;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    return {
      plataforma: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}`,
      thumbnail: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }

  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vi) return { plataforma: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vi[1]}`, thumbnail: null };

  const ig = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (ig) return { plataforma: 'instagram', embedUrl: `https://www.instagram.com/p/${ig[1]}/embed`, thumbnail: null };

  return null;
}

// ------------------------------------------------------------------ upload

/** produtos/<slug>/<timestamp>-<aleatório>.<ext> — nunca colide, nunca sobrescreve. */
export function caminhoNoBucket(slug: string, ext: string, sufixo = ''): string {
  const limpo = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const marca = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `produtos/${limpo}/${marca}${sufixo}.${ext}`;
}

export async function enviarBlob(caminho: string, blob: Blob, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new MidiaErro(`Upload falhou: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Só apaga o que subimos: caminho estático do repositório não é nosso. */
export async function apagarDoBucket(url: string): Promise<void> {
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marca);
  if (i < 0) return;
  const caminho = decodeURIComponent(url.slice(i + marca.length).split('?')[0]);
  await supabase.storage.from(BUCKET).remove([caminho]);
}

// ------------------------------------------------------------- orientação

export interface Aviso {
  nivel: 'erro' | 'atencao';
  texto: string;
}

/**
 * O que a tela mostra ao lado de cada mídia. Não impede salvar — a foto ruim de
 * hoje é melhor que o quadrado de cor de sempre —, mas diz o que melhorar.
 */
export function avaliarMidia(m: Pick<Midia, 'tipo' | 'capa' | 'alt' | 'largura' | 'altura' | 'tamanho_bytes'>): Aviso[] {
  const avisos: Aviso[] = [];
  if (!m.alt || m.alt.trim().length < 6) {
    avisos.push({ nivel: 'atencao', texto: 'Sem texto alternativo — descreva a foto em poucas palavras.' });
  }
  if (m.tipo !== 'video-externo') {
    if (m.largura && m.altura) {
      const menor = Math.min(m.largura, m.altura);
      if (menor < LIMITES.ladoIdeal) {
        avisos.push({ nivel: 'atencao', texto: `Pequena (${m.largura}×${m.altura}). O ideal é ${LIMITES.ladoIdeal} px no menor lado.` });
      }
      const razao = m.largura / m.altura;
      if (m.capa && Math.abs(razao - 1) > 0.06) {
        avisos.push({ nivel: 'atencao', texto: 'A capa aparece num quadrado no card da loja — use 1:1 para não cortar.' });
      }
    }
    if (m.tipo === 'imagem' && m.tamanho_bytes && m.tamanho_bytes > LIMITES.pesoBomBytes) {
      avisos.push({ nivel: 'atencao', texto: `Pesada (${Math.round(m.tamanho_bytes / 1024)} kB). Acima de 400 kB atrasa a página no celular.` });
    }
  }
  return avisos;
}

/** Resumo do produto inteiro, para a lista e o cabeçalho do editor. */
export function avaliarConjunto(midias: Midia[]): Aviso[] {
  const avisos: Aviso[] = [];
  const imagens = midias.filter((m) => m.tipo === 'imagem');
  if (imagens.length === 0) {
    avisos.push({ nivel: 'erro', texto: 'Sem foto — a loja mostra só um quadrado da cor.' });
    return avisos;
  }
  if (!imagens.some((m) => m.capa)) avisos.push({ nivel: 'erro', texto: 'Nenhuma foto marcada como capa.' });
  if (imagens.length < 2) avisos.push({ nivel: 'atencao', texto: 'Só uma foto. Duas ou três (aplicação e detalhe) vendem mais.' });
  return avisos;
}

export function formatarBytes(n: number | null | undefined): string {
  if (!n) return '—';
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`;
}
