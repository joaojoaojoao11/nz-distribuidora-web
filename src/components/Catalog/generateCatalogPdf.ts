import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ProgressInfo {
  current: number;
  total: number;
  label: string;
}

type ProgressFn = (info: ProgressInfo) => void;

export interface GenerateCatalogOptions {
  onProgress?: ProgressFn;
}

// ─────────────────────────────────────────────────────────────────────
// PRINT GEOMETRY — A5 + sangria 3mm (ETAPA 1 do checklist gráfico)
// ─────────────────────────────────────────────────────────────────────
// Trim final (A5):  148 × 210 mm
// Bleed (sangria):  3 mm em cada lado
// Media (página):   154 × 216 mm  =  trim + 2 × bleed
// Resolution:       300 DPI       →  canvas 1819 × 2551 px
//
// As marcas de corte (crop marks) e de registro são desenhadas via jsPDF
// dentro da área de sangria (ver drawTrimMarks/drawRegistrationMarks).
// Fontes do projeto rasterizadas via html2canvas — para texto vetorial
// real, fontes embutidas e PDF/X-4 ver FASE 2 (pipeline Puppeteer).
// ─────────────────────────────────────────────────────────────────────
const TRIM_WIDTH_MM = 148;
const TRIM_HEIGHT_MM = 210;
const BLEED_MM = 3;
const PAGE_WIDTH_MM = TRIM_WIDTH_MM + 2 * BLEED_MM;   // 154
const PAGE_HEIGHT_MM = TRIM_HEIGHT_MM + 2 * BLEED_MM; // 216
const CANVAS_WIDTH_PX = 1819;   // 154mm @ 300 DPI
const CANVAS_HEIGHT_PX = 2551;  // 216mm @ 300 DPI

/**
 * Crop marks (L-shapes) em cada canto da área de trim.
 * Posicionadas dentro da sangria, com pequeno gap para não invadir a área final.
 *  – Comprimento da marca: 2 mm
 *  – Gap do canto trim:    1 mm
 *  – Linha:                0.1 mm (~0.28 pt) preto
 *
 * Convenção: cada canto recebe duas linhas (uma vertical e uma horizontal)
 * que formam um L apontando para fora do trim, dentro da área de sangria.
 */
function drawTrimMarks(pdf: jsPDF): void {
  const markLen = 2;
  const gap = 1;

  pdf.setLineWidth(0.1);
  pdf.setDrawColor(0, 0, 0);

  const tlX = BLEED_MM, tlY = BLEED_MM;
  const trX = BLEED_MM + TRIM_WIDTH_MM, trY = BLEED_MM;
  const blX = BLEED_MM, blY = BLEED_MM + TRIM_HEIGHT_MM;
  const brX = BLEED_MM + TRIM_WIDTH_MM, brY = BLEED_MM + TRIM_HEIGHT_MM;

  // Top-left
  pdf.line(tlX, tlY - gap - markLen, tlX, tlY - gap);
  pdf.line(tlX - gap - markLen, tlY, tlX - gap, tlY);

  // Top-right
  pdf.line(trX, trY - gap - markLen, trX, trY - gap);
  pdf.line(trX + gap, trY, trX + gap + markLen, trY);

  // Bottom-left
  pdf.line(blX, blY + gap, blX, blY + gap + markLen);
  pdf.line(blX - gap - markLen, blY, blX - gap, blY);

  // Bottom-right
  pdf.line(brX, brY + gap, brX, brY + gap + markLen);
  pdf.line(brX + gap, brY, brX + gap + markLen, brY);
}

/**
 * Registration marks (cruzes +) no centro de cada borda da página,
 * dentro da sangria. Auxiliam o operador da gráfica a alinhar os
 * fotolitos das placas em offset multi-cor.
 *  – Centro da cruz no meio do bleed (1.5 mm da borda da página)
 *  – Tamanho do braço: 1 mm
 */
function drawRegistrationMarks(pdf: jsPDF): void {
  const arm = 1;
  const halfBleed = BLEED_MM / 2;
  const cx = PAGE_WIDTH_MM / 2;
  const cy = PAGE_HEIGHT_MM / 2;

  pdf.setLineWidth(0.1);
  pdf.setDrawColor(0, 0, 0);

  const cross = (x: number, y: number) => {
    pdf.line(x - arm, y, x + arm, y);
    pdf.line(x, y - arm, x, y + arm);
  };

  cross(cx, halfBleed);                       // top
  cross(cx, PAGE_HEIGHT_MM - halfBleed);      // bottom
  cross(halfBleed, cy);                       // left
  cross(PAGE_WIDTH_MM - halfBleed, cy);       // right
}

/**
 * Coleta todos os elementos da página marcados com `data-page-link-url`
 * e calcula a posição em mm relativa à PAGE (com sangria). Usado para
 * criar hyperlinks ativos sobre os QR codes do PDF unificado.
 *
 * Retorna coordenadas em mm no sistema da PAGE (origem no topo-esquerda
 * incluindo a sangria de 3mm), que é onde a imagem do canvas é colocada
 * no PDF (addImage at 0,0).
 */
function collectPageLinks(page: HTMLElement): Array<{
  x: number; y: number; w: number; h: number; url: string;
}> {
  const pageRect = page.getBoundingClientRect();
  const pxToMm = PAGE_WIDTH_MM / pageRect.width;
  const links: Array<{ x: number; y: number; w: number; h: number; url: string }> = [];

  page.querySelectorAll<HTMLElement>('[data-page-link-url]').forEach((el) => {
    const url = el.dataset.pageLinkUrl;
    if (!url) return;
    const r = el.getBoundingClientRect();
    const xPageMm = (r.left - pageRect.left) * pxToMm;
    const yPageMm = (r.top - pageRect.top) * pxToMm;
    const wMm = r.width * pxToMm;
    const hMm = r.height * pxToMm;
    links.push({ x: xPageMm, y: yPageMm, w: wMm, h: hMm, url });
  });

  return links;
}

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

/**
 * Geração do PDF NZPPF — modo único (consolidado a partir de print/digital/proof).
 *
 * Geometria: A5 (148×210mm) + sangria 3mm = página 154×216mm @ 300 DPI
 * Saída: JPEG 0.94 (qualidade gráfica) + crop marks + registration marks
 *        + hyperlinks ativos sobre QR codes.
 *
 * Pode ser enviado direto à gráfica para impressão ou aberto em qualquer
 * leitor de PDF — os QRs ficam clicáveis também no visualizador digital.
 */
export async function generateCatalogPdf(
  root: HTMLElement,
  options: GenerateCatalogOptions = {}
): Promise<void> {
  const { onProgress } = options;

  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }

  await preloadImages(root);

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-catalog-page]'));
  if (pages.length === 0) {
    throw new Error('Nenhuma página encontrada no documento.');
  }

  const total = pages.length;

  const pdfWidthMm = PAGE_WIDTH_MM;
  const pdfHeightMm = PAGE_HEIGHT_MM;
  const jpegQuality = 0.94;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
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
        width: CANVAS_WIDTH_PX,
        height: CANVAS_HEIGHT_PX,
        windowWidth: CANVAS_WIDTH_PX,
        windowHeight: CANVAS_HEIGHT_PX,
        // html2canvas clona o DOM num iframe interno antes de rasterizar.
        // Esse iframe tem `document.fonts` independente do main — o
        // `await document.fonts.ready` que rodamos antes de chamar
        // html2canvas garante apenas a janela principal. Sem esperar
        // dentro do clone, o iframe captura com fontes em fallback
        // (sans-serif → Arial), as métricas dos glyphs divergem do
        // layout calculado e aparecem gaps mid-word no JPEG final
        // ("Rev estimento", "flexív el", "Proteç ão" — ETAPA 7-bug).
        onclone: ((clonedDoc: Document) => {
          const cf = (clonedDoc as Document & { fonts?: FontFaceSet }).fonts;
          const ready = cf?.ready ? cf.ready : Promise.resolve();
          // Fallback de 300ms: alguns browsers resolvem fonts.ready
          // antes do paint efetivo dos glyphs custom.
          return ready
            .then(() => new Promise<void>((r) => setTimeout(r, 300)))
            .then(() => {
              // html2canvas usa line-height literal e não adiciona o
              // leading implícito que o navegador deriva das métricas
              // da fonte. Em headlines com line-height ≤ 1.0 isso faz
              // descendentes (Ç, P, Ã) tocarem ascendentes da linha
              // seguinte no JPEG final, mesmo quando o preview ao vivo
              // está espaçado. Aqui, dentro do iframe do clone, elevamos
              // qualquer elemento abaixo de 1.05 para 1.05 — sem afetar
              // o documento original que o usuário vê no PageEditor.
              const minRatio = 1.05;
              const win = clonedDoc.defaultView;
              if (!win) return;
              clonedDoc
                .querySelectorAll<HTMLElement>('[data-catalog-page] *')
                .forEach((el) => {
                  const cs = win.getComputedStyle(el);
                  const fs = parseFloat(cs.fontSize);
                  const lh = parseFloat(cs.lineHeight);
                  if (!isFinite(fs) || fs <= 0 || !isFinite(lh)) return;
                  if (lh / fs < minRatio) {
                    el.style.lineHeight = String(minRatio);
                  }
                });
            });
        }) as unknown as (doc: Document) => void
      });

      const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

      if (i > 0) {
        pdf.addPage([pdfWidthMm, pdfHeightMm], 'portrait');
      }

      // Imagem cobre toda a página (com sangria 3mm em cada lado).
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, `p${pageNum}`, 'FAST');

      // Marcas de corte + registro dentro da sangria.
      drawTrimMarks(pdf);
      drawRegistrationMarks(pdf);

      // Hyperlinks ativos sobre QRs (coords em sistema PAGE, com sangria).
      const links = collectPageLinks(page);
      for (const link of links) {
        pdf.link(link.x, link.y, link.w, link.h, { url: link.url });
      }
    } catch (err) {
      console.error(`Falha ao renderizar página ${pageNum}:`, err);
      failedPages.push(Number(pageNum));

      if (i > 0) {
        pdf.addPage([pdfWidthMm, pdfHeightMm], 'portrait');
      }
      pdf.setFillColor(5, 5, 5);
      pdf.rect(0, 0, pdfWidthMm, pdfHeightMm, 'F');
      pdf.setTextColor(120, 120, 120);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`(página ${pageNum} indisponível)`, pdfWidthMm / 2, pdfHeightMm / 2, { align: 'center' });
    }

    await new Promise((r) => setTimeout(r, 30));
  }

  onProgress?.({ current: total, total, label: 'Salvando PDF…' });

  pdf.save('NZPPF_Catalogo_2026_A5.pdf');

  if (failedPages.length > 0) {
    console.warn(
      `PDF gerado, mas ${failedPages.length} página(s) falharam e foram substituídas por marcador: ${failedPages.join(', ')}`
    );
  }
}
