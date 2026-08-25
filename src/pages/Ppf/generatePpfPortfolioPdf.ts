import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Geração do portfólio NZPPF em PDF (A4 retrato).
 *
 * Rasteriza cada `[data-portfolio-page]` de PpfPortfolioDocument. As páginas
 * são escritas em 1240×1754 px (A4 @150 DPI) e capturadas em escala 2 →
 * ~300 DPI no arquivo final.
 *
 * A API é dividida em criar / anexar / salvar porque o catálogo completo tem
 * ~41 páginas: montar tudo de uma vez seriam ~160 imagens vivas no DOM ao
 * mesmo tempo. Com `appendPortfolioPages` o chamador monta UMA linha, anexa,
 * desmonta e segue para a próxima, mantendo o pico de memória baixo.
 *
 * Os cuidados de fonte/imagem replicam os de
 * components/Catalog/generateCatalogPdf.ts, onde já foram validados.
 */

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

/**
 * 'alta' — portfólio de uma linha (~525 KB/página, ~300 DPI).
 * 'compacta' — catálogo completo; com 41 páginas a qualidade alta passaria
 *   de 20 MB, inviável para WhatsApp/e-mail. ~180 KB/página, ~220 DPI.
 */
export type PortfolioQuality = 'alta' | 'compacta';

const QUALITY_PRESETS: Record<PortfolioQuality, { scale: number; jpeg: number }> = {
  alta: { scale: 2, jpeg: 0.92 },
  compacta: { scale: 1.5, jpeg: 0.82 },
};

export interface PortfolioProgress {
  current: number;
  total: number;
  label: string;
}

export interface PortfolioHandle {
  pdf: jsPDF;
  quality: PortfolioQuality;
  /** Páginas já anexadas — usado para saber quando adicionar addPage(). */
  pageCount: number;
  failed: number[];
}

export function createPortfolioPdf(quality: PortfolioQuality = 'alta'): PortfolioHandle {
  return {
    pdf: new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true }),
    quality,
    pageCount: 0,
    failed: [],
  };
}

/**
 * Pré-carrega `<img src>` e background-images sob `root`, aguardando
 * `decode()`. Sem isso o html2canvas ocasionalmente rasteriza imagens ainda
 * sem pixel data. Não usar crossOrigin: os assets são same-origin e o dev
 * server do Vite nem sempre manda CORS headers consistentes.
 */
async function preloadImages(root: HTMLElement): Promise<void> {
  const urls = new Set<string>();

  root.querySelectorAll('img').forEach((img) => {
    if (img.src) urls.add(img.src);
  });

  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none' || !bg.includes('url(')) return;
    for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(m[1]);
  });

  await Promise.all(
    Array.from(urls).map(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        await new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
    })
  );

  await new Promise((r) => setTimeout(r, 120));
}

export interface AppendOptions {
  onProgress?: (info: PortfolioProgress) => void;
  /** Total geral, quando o append é parcial (uma linha do catálogo). */
  totalOverride?: number;
  /** Quantas páginas já foram feitas antes deste append. */
  offset?: number;
}

/**
 * Rasteriza os `[data-portfolio-page]` de `root` e anexa ao PDF do handle.
 * Pode ser chamado várias vezes com roots diferentes.
 */
export async function appendPortfolioPages(
  handle: PortfolioHandle,
  root: HTMLElement,
  options: AppendOptions = {}
): Promise<void> {
  const { onProgress, totalOverride, offset = 0 } = options;
  const preset = QUALITY_PRESETS[handle.quality];

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-portfolio-page]'));
  if (pages.length === 0) throw new Error('Nenhuma página do portfólio encontrada.');

  const total = totalOverride ?? pages.length;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await preloadImages(root);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const globalIndex = offset + i + 1;
    onProgress?.({ current: globalIndex, total, label: `Renderizando ${globalIndex} de ${total}…` });

    try {
      const canvas = await html2canvas(page, {
        scale: preset.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#08080a',
        imageTimeout: 30000,
        logging: false,
        width: page.offsetWidth,
        height: page.offsetHeight,
        windowWidth: page.offsetWidth,
        windowHeight: page.offsetHeight,
        // html2canvas clona o DOM num iframe com `document.fonts` próprio.
        // Sem esperar as fontes dentro do clone, a captura sai em fallback
        // e as métricas divergem do layout (gaps no meio das palavras).
        onclone: ((clonedDoc: Document) => {
          const cf = (clonedDoc as Document & { fonts?: FontFaceSet }).fonts;
          const ready = cf?.ready ? cf.ready : Promise.resolve();
          return ready
            .then(() => new Promise<void>((r) => setTimeout(r, 250)))
            .then(() => {
              // O clone é posicionado fora da tela no documento original;
              // dentro do iframe isso não é necessário e atrapalha o
              // enquadramento da captura.
              clonedDoc.querySelectorAll<HTMLElement>('[data-portfolio-page]').forEach((el) => {
                const stage = el.parentElement;
                if (stage) {
                  stage.style.position = 'static';
                  stage.style.left = '0';
                }
              });
              // html2canvas usa line-height literal, sem o leading implícito
              // das métricas da fonte: em títulos com line-height baixo os
              // descendentes (Ç, ã, g) encostam na linha seguinte.
              const win = clonedDoc.defaultView;
              if (!win) return;
              clonedDoc.querySelectorAll<HTMLElement>('[data-portfolio-page] *').forEach((el) => {
                const cs = win.getComputedStyle(el);
                const fs = parseFloat(cs.fontSize);
                const lh = parseFloat(cs.lineHeight);
                if (!isFinite(fs) || fs <= 0 || !isFinite(lh)) return;
                if (lh / fs < 1.05) el.style.lineHeight = '1.05';
              });
            });
        }) as unknown as (doc: Document) => void,
      });

      if (handle.pageCount > 0) handle.pdf.addPage('a4', 'portrait');
      handle.pdf.addImage(
        canvas.toDataURL('image/jpeg', preset.jpeg),
        'JPEG',
        0,
        0,
        PAGE_WIDTH_MM,
        PAGE_HEIGHT_MM,
        `pf${globalIndex}`,
        'FAST'
      );
      handle.pageCount++;
    } catch (err) {
      console.error(`Falha ao renderizar página ${globalIndex} do portfólio:`, err);
      handle.failed.push(globalIndex);
      if (handle.pageCount > 0) handle.pdf.addPage('a4', 'portrait');
      handle.pdf.setFillColor(8, 8, 10);
      handle.pdf.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');
      handle.pdf.setTextColor(120, 120, 120);
      handle.pdf.setFontSize(9);
      handle.pdf.text(`(página ${globalIndex} indisponível)`, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM / 2, {
        align: 'center',
      });
      handle.pageCount++;
    }

    await new Promise((r) => setTimeout(r, 30));
  }
}

export function savePortfolioPdf(handle: PortfolioHandle, fileName: string): void {
  handle.pdf.save(fileName);
  if (handle.failed.length > 0) {
    console.warn(`Portfólio gerado com ${handle.failed.length} página(s) em falha: ${handle.failed.join(', ')}`);
  }
}

export interface GeneratePortfolioOptions {
  onProgress?: (info: PortfolioProgress) => void;
  fileName?: string;
  quality?: PortfolioQuality;
}

/** Caminho simples: um root, um PDF. Usado pelas páginas de linha. */
export async function generatePpfPortfolioPdf(
  root: HTMLElement,
  options: GeneratePortfolioOptions = {}
): Promise<void> {
  const { onProgress, fileName = 'NZPPF_Portfolio.pdf', quality = 'alta' } = options;
  const handle = createPortfolioPdf(quality);
  onProgress?.({ current: 0, total: 0, label: 'Carregando imagens…' });
  await appendPortfolioPages(handle, root, { onProgress });
  onProgress?.({ current: handle.pageCount, total: handle.pageCount, label: 'Salvando PDF…' });
  savePortfolioPdf(handle, fileName);
}
