import html2canvas from 'html2canvas';
import { FORMAT_DIMENSIONS, type SocialFormat } from './socialImageTypes';

export async function generateSocialPng(
  root: HTMLElement,
  format: SocialFormat,
  filename = 'nzppf_social.png'
): Promise<void> {
  const target = root.querySelector<HTMLElement>('[data-social-image]');
  if (!target) throw new Error('Imagem não encontrada no DOM.');

  const dims = FORMAT_DIMENSIONS[format];

  // Pré-carrega imagens
  const imgs = target.querySelectorAll('img');
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      try { await img.decode(); } catch { /* segue */ }
    })
  );

  const canvas = await html2canvas(target, {
    scale: 1,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#060606',
    width: dims.width,
    height: dims.height,
    windowWidth: dims.width,
    windowHeight: dims.height,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
