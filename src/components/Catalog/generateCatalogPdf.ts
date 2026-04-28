import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ProgressInfo {
  current: number;
  total: number;
  label: string;
}

type ProgressFn = (info: ProgressInfo) => void;

/**
 * Modo de saída do PDF (ETAPA 9 do checklist gráfico):
 *   'print'   — versão para gráfica: A5 + sangria 3mm + crop marks +
 *               registration marks. JPEG quality 0.94. Sem hyperlinks.
 *   'digital' — versão para envio digital: A5 trim only (148×210mm),
 *               sangria descartada, sem marks, JPEG 0.85 (arquivo
 *               menor), hyperlinks ativos sobre QR codes.
 *   'proof'   — versão para prova/aprovação: como 'print' + legenda
 *               técnica visível na sangria do topo (NÃO PARA PRODUÇÃO).
 */
export type CatalogOutputMode = 'print' | 'digital' | 'proof';

export interface GenerateCatalogOptions {
  outputMode?: CatalogOutputMode;
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
 * Legenda técnica visível para a versão PROOF (ETAPA 9.3).
 * Texto em vermelho, fonte 6pt, posicionado dentro da sangria do
 * topo — quando a peça for cortada, esta linha some, então não
 * polui a peça final mas é claramente visível na prova.
 */
function drawProofLegend(pdf: jsPDF): void {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 30, 30);
  const text = 'PROOF · NZPPF Catálogo 2026 · A5 trim 148×210 + sangria 3mm · NÃO PARA PRODUÇÃO';
  pdf.text(text, PAGE_WIDTH_MM / 2, 1.8, { align: 'center' });
  // restaura cor de texto preta para outros usos
  pdf.setTextColor(0, 0, 0);
}

/**
 * Coleta todos os elementos da página marcados com `data-page-link-url`
 * e calcula a posição em mm relativa ao trim (148×210mm). Usado pelo
 * modo DIGITAL para criar hyperlinks ativos sobre os QR codes.
 *
 * Retorna coordenadas em mm já no sistema do trim (sem bleed).
 * Se a página tem altura/largura inesperada, retorna lista vazia.
 */
function collectPageLinks(page: HTMLElement): Array<{
  x: number; y: number; w: number; h: number; url: string;
}> {
  const pageRect = page.getBoundingClientRect();
  // px → mm (PAGE_WIDTH_MM / canvas largura em px)
  const pxToMm = PAGE_WIDTH_MM / pageRect.width;
  const links: Array<{ x: number; y: number; w: number; h: number; url: string }> = [];

  page.querySelectorAll<HTMLElement>('[data-page-link-url]').forEach((el) => {
    const url = el.dataset.pageLinkUrl;
    if (!url) return;
    const r = el.getBoundingClientRect();
    // Posição relativa à página, em mm
    const xPageMm = (r.left - pageRect.left) * pxToMm;
    const yPageMm = (r.top - pageRect.top) * pxToMm;
    const wMm = r.width * pxToMm;
    const hMm = r.height * pxToMm;
    // Converte de coords da PAGE (com bleed) para coords do TRIM
    // (subtrai BLEED_MM em ambos os eixos)
    links.push({
      x: xPageMm - BLEED_MM,
      y: yPageMm - BLEED_MM,
      w: wMm,
      h: hMm,
      url
    });
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

export async function generateCatalogPdf(
  root: HTMLElement,
  options: GenerateCatalogOptions = {}
): Promise<void> {
  const { outputMode = 'print', onProgress } = options;
  const isDigital = outputMode === 'digital';

  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }

  await preloadImages(root);

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-catalog-page]'));
  if (pages.length === 0) {
    throw new Error('Nenhuma página encontrada no documento.');
  }

  const total = pages.length;

  // Geometria do PDF varia por modo:
  //  print/proof: media 154×216mm (trim + bleed) — gráfica corta no trim
  //  digital:     trim only 148×210mm — sem bleed, sem marks
  const pdfWidthMm = isDigital ? TRIM_WIDTH_MM : PAGE_WIDTH_MM;
  const pdfHeightMm = isDigital ? TRIM_HEIGHT_MM : PAGE_HEIGHT_MM;

  // Compressão JPEG: print/proof preservam qualidade gráfica (0.94),
  // digital aceita compressão maior pra arquivo menor (0.85).
  const jpegQuality = isDigital ? 0.85 : 0.94;

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
        windowHeight: CANVAS_HEIGHT_PX
      });

      const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

      if (i > 0) {
        pdf.addPage([pdfWidthMm, pdfHeightMm], 'portrait');
      }

      if (isDigital) {
        // Posiciona a imagem com offset NEGATIVO de bleed em ambos os
        // eixos. A imagem (154×216mm) extrapola a página (148×210mm)
        // em 3mm pra cada lado — o conteúdo da sangria fica fora dos
        // limites da página, efetivamente cortado no trim.
        pdf.addImage(imgData, 'JPEG', -BLEED_MM, -BLEED_MM, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, `p${pageNum}`, 'FAST');

        // Hyperlinks ativos sobre QRs marcados com data-page-link-url.
        // A função collectPageLinks já converte para coords TRIM.
        const links = collectPageLinks(page);
        for (const link of links) {
          pdf.link(link.x, link.y, link.w, link.h, { url: link.url });
        }
      } else {
        // print / proof: imagem cobre toda a página (com sangria).
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, `p${pageNum}`, 'FAST');

        // Marcas de corte + registro dentro da sangria.
        drawTrimMarks(pdf);
        drawRegistrationMarks(pdf);

        if (outputMode === 'proof') {
          drawProofLegend(pdf);
        }
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

  // Filename varia por modo (ETAPA 9.1/9.2/9.3):
  //   print   → NZPPF_Catalogo_2026_A5_PRINT.pdf
  //   digital → NZPPF_Catalogo_2026_A5_DIGITAL.pdf
  //   proof   → NZPPF_Catalogo_2026_A5_PROOF.pdf
  const suffix = outputMode.toUpperCase();
  pdf.save(`NZPPF_Catalogo_2026_A5_${suffix}.pdf`);

  if (failedPages.length > 0) {
    console.warn(
      `PDF gerado, mas ${failedPages.length} página(s) falharam e foram substituídas por marcador: ${failedPages.join(', ')}`
    );
  }
}
