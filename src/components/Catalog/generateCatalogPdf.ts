import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ProgressInfo {
  current: number;
  total: number;
  label: string;
}

type ProgressFn = (info: ProgressInfo) => void;

const PAGE_WIDTH_MM = 150;
const PAGE_HEIGHT_MM = 200;

/**
 * Pré-carrega todas as imagens referenciadas em `<img src>` e em
 * background-image CSS dentro do documento. Usa `img.decode()` para
 * garantir que o pixel data está na GPU antes do html2canvas tentar
 * usá-la como padrão de canvas (sem isso aparece o erro
 * "createPattern ... width or height of 0" em algumas imagens lentas).
 *
 * Importante: NÃO usar crossOrigin aqui. Todas as imagens do catálogo
 * são same-origin (servidas pelo Vite de /public/). O Vite dev server
 * nem sempre envia CORS headers consistentes, e com crossOrigin ligado
 * a imagem é rejeitada silenciosamente.
 */
async function preloadImages(root: HTMLElement): Promise<void> {
  const urls = new Set<string>();

  // <img src="...">
  root.querySelectorAll('img').forEach((img) => {
    if (img.src) urls.add(img.src);
  });

  // background-image: url(...) em qualquer elemento
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none' || !bg.includes('url(')) return;
    const matches = bg.matchAll(/url\(["']?([^"')]+)["']?\)/g);
    for (const m of matches) urls.add(m[1]);
  });

  await Promise.all(
    Array.from(urls).map(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        // Se falhar decode, aguarda ao menos o evento load/error para
        // não deixar a promise pendurada.
        await new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return; }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
    })
  );

  // Um tick extra para garantir que o browser aplicou as imagens ao layout
  await new Promise((r) => setTimeout(r, 100));
}

export async function generateCatalogPdf(
  root: HTMLElement,
  onProgress?: ProgressFn
): Promise<void> {
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }

  await preloadImages(root);

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-catalog-page]'));
  if (pages.length === 0) {
    throw new Error('Nenhuma página encontrada no documento.');
  }

  const total = pages.length;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
    compress: true
  });

  const failedPages: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = page.dataset.catalogPage || String(i + 1);

    onProgress?.({
      current: i + 1,
      total,
      label: `Renderizando página ${i + 1} de ${total}…`
    });

    try {
      const canvas = await html2canvas(page, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#050505',
        imageTimeout: 30000,
        logging: false,
        width: 1772,
        height: 2362,
        windowWidth: 1772,
        windowHeight: 2362
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.94);

      if (i > 0) {
        pdf.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM], 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, `p${pageNum}`, 'FAST');
    } catch (err) {
      console.error(`Falha ao renderizar página ${pageNum}:`, err);
      failedPages.push(Number(pageNum));

      if (i > 0) {
        pdf.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM], 'portrait');
      }
      pdf.setFillColor(5, 5, 5);
      pdf.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');
      pdf.setTextColor(120, 120, 120);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`(página ${pageNum} indisponível)`, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM / 2, { align: 'center' });
    }

    await new Promise((r) => setTimeout(r, 30));
  }

  onProgress?.({ current: total, total, label: 'Salvando PDF…' });

  pdf.save(`NZPPF_Catalogo_2026.pdf`);

  if (failedPages.length > 0) {
    console.warn(
      `PDF gerado, mas ${failedPages.length} página(s) falharam e foram substituídas por marcador: ${failedPages.join(', ')}`
    );
  }
}
