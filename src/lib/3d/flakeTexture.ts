import { CanvasTexture, RepeatWrapping, Texture } from 'three';

let cached: Texture | null = null;

export function getFlakeNormalTexture(): Texture {
  if (cached) return cached;

  const SIZE = 512;
  const FLAKE_COUNT = 11000;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // flat normal base = (128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = img.data;

  for (let i = 0; i < FLAKE_COUNT; i++) {
    const cx = (Math.random() * SIZE) | 0;
    const cy = (Math.random() * SIZE) | 0;
    const radius = 0.8 + Math.random() * 1.4;
    const dirX = (Math.random() - 0.5) * 2;
    const dirY = (Math.random() - 0.5) * 2;
    const r = ((dirX * 0.5 + 0.5) * 255) | 0;
    const g = ((dirY * 0.5 + 0.5) * 255) | 0;
    const rr = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > rr) continue;
        const x = ((cx + dx) + SIZE) % SIZE;
        const y = ((cy + dy) + SIZE) % SIZE;
        const idx = (y * SIZE + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(50, 50);
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  cached = tex;
  return tex;
}
