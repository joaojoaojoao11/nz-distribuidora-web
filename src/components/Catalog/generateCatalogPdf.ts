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

async function preloadImages(root: HTMLElement): Promise<void> {
  const elements = Array.from(root.querySelectorAll('img'));
  const cssBg = Array.from(root.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const bg = window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && bg.includes('url(');
  });

  const urls = new Set<string>();
  elements.forEach((img) => { if (img.src) urls.add(img.src); });
  cssBg.forEach((el) => {
    const bg = window.getComputedStyle(el).backgroundImage;
    const matches = bg.matchAll(/url\(["']?([^"')]+)["']?\)/g);
    for (const m of matches) urls.add(m[1]);
  });

  await Promise.all(
    Array.from(urls).map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  );
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

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = page.dataset.catalogPage || String(i + 1);

    onProgress?.({
      current: i + 1,
      total,
      label: `Renderizando página ${i + 1} de ${total}…`
    });

    const canvas = await html2canvas(page, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
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

    await new Promise((r) => setTimeout(r, 30));
  }

  onProgress?.({ current: total, total, label: 'Salvando PDF…' });

  pdf.save(`NZPPF_Catalogo_2026.pdf`);
}
