import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Gera o portfólio de uma linha NZPPF em PDF (A4 retrato).
 *
 * Rasteriza cada `[data-portfolio-page]` de PpfPortfolioDocument.
 * As páginas são escritas em 1240×1754 px (A4 @150 DPI) e capturadas em
 * escala 2 → ~300 DPI no arquivo final.
 *
 * Os cuidados de fonte/imagem abaixo replicam os de
 * components/Catalog/generateCatalogPdf.ts, onde já foram validados.
 */

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.92;

export interface PortfolioProgress {
  current: number;
  total: number;
  label: string;
}

export interface GeneratePortfolioOptions {
  onProgress?: (info: PortfolioProgress) => void;
  fileName?: string;
}

/**
 * Pré-carrega `<img src>` e background-images sob `root`, aguardando
 * `decode()`. Sem isso o html2canvas ocasionalmente rasteriza imagens
 * ainda sem pixel data. Não usar crossOrigin: os assets são same-origin e
 * o dev server do Vite nem sempre manda CORS headers consistentes.
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

export async function generatePpfPortfolioPdf(
  root: HTMLElement,
  options: GeneratePortfolioOptions = {}
): Promise<void> {
  const { onProgress, fileName = 'NZPPF_Portfolio.pdf' } = options;

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-portfolio-page]'));
  if (pages.length === 0) throw new Error('Nenhuma página do portfólio encontrada.');

  onProgress?.({ current: 0, total: pages.length, label: 'Carregando imagens…' });

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await preloadImages(root);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const failed: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    onProgress?.({ current: i + 1, total: pages.length, label: `Renderizando ${i + 1} de ${pages.length}…` });

    try {
      const canvas = await html2canvas(page, {
        scale: CAPTURE_SCALE,
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

      if (i > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(
        canvas.toDataURL('image/jpeg', JPEG_QUALITY),
        'JPEG',
        0,
        0,
        PAGE_WIDTH_MM,
        PAGE_HEIGHT_MM,
        `pf${i + 1}`,
        'FAST'
      );
    } catch (err) {
      console.error(`Falha ao renderizar página ${i + 1} do portfólio:`, err);
      failed.push(i + 1);
      if (i > 0) pdf.addPage('a4', 'portrait');
      pdf.setFillColor(8, 8, 10);
      pdf.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(9);
      pdf.text(`(página ${i + 1} indisponível)`, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM / 2, { align: 'center' });
    }

    await new Promise((r) => setTimeout(r, 30));
  }

  onProgress?.({ current: pages.length, total: pages.length, label: 'Salvando PDF…' });
  pdf.save(fileName);

  if (failed.length > 0) {
    console.warn(`Portfólio gerado com ${failed.length} página(s) em falha: ${failed.join(', ')}`);
  }
}
