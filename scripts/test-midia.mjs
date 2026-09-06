// Autoteste da mídia de produto — sem rede, sem navegador.
//
// Cobre o que dá para verificar fora do browser: o reconhecimento de link de
// vídeo (é o que decide se o admin consegue colar um YouTube), o caminho no
// bucket, e as regras de orientação que a tela mostra ao lado de cada foto.
//
// O processamento de imagem/vídeo depende de canvas e createImageBitmap: fica
// para o smoke com Playwright.
//
// Uso: npm run midia:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-midia-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/admin/midia.ts',
    `--outfile=${join(outDir, 'midia.js')}`,
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

// O módulo importa o cliente do Supabase (que lê import.meta.env): troca por um
// duplo, como no teste de conta.
writeFileSync(join(outDir, 'supabase-falso.js'), 'export const supabase = { storage: { from: () => ({}) } };\n');
const arq = join(outDir, 'midia.js');
writeFileSync(arq, readFileSync(arq, 'utf8').replace(/"\.\.\/supabase"|'\.\.\/supabase'/g, '"./supabase-falso.js"'));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const { lerVideoExterno, caminhoNoBucket, avaliarMidia, avaliarConjunto, formatarBytes, LIMITES } = await import(
  pathToFileURL(arq).href
);

// ==================================================== vídeo externo
console.log('\n=== LINK DE VÍDEO ===');
const yt = lerVideoExterno('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
ok('YouTube watch?v=', yt?.plataforma === 'youtube' && yt.embedUrl.endsWith('dQw4w9WgXcQ'));
ok('YouTube sem cookie', yt?.embedUrl.includes('youtube-nocookie.com'));
ok('YouTube traz miniatura', yt?.thumbnail?.includes('dQw4w9WgXcQ'));
ok('youtu.be', lerVideoExterno('https://youtu.be/dQw4w9WgXcQ')?.embedUrl.endsWith('dQw4w9WgXcQ'));
ok('YouTube Shorts', lerVideoExterno('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.embedUrl.endsWith('dQw4w9WgXcQ'));
ok('link com parâmetros extras', lerVideoExterno('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')?.embedUrl.endsWith('dQw4w9WgXcQ'));
ok('Vimeo', lerVideoExterno('https://vimeo.com/123456789')?.embedUrl === 'https://player.vimeo.com/video/123456789');
ok('Instagram reel', lerVideoExterno('https://www.instagram.com/reel/Abc-123_x/')?.plataforma === 'instagram');
ok('link qualquer não vira vídeo', lerVideoExterno('https://nzgroup.com.br/loja') === null);
ok('texto vazio', lerVideoExterno('   ') === null);
ok('id curto demais não passa', lerVideoExterno('https://youtu.be/abc') === null);

// ==================================================== caminho no bucket
console.log('\n=== CAMINHO NO BUCKET ===');
const c1 = caminhoNoBucket('sh-bentley-pink', 'webp');
const c2 = caminhoNoBucket('sh-bentley-pink', 'webp');
ok('começa com produtos/<slug>/', c1.startsWith('produtos/sh-bentley-pink/'));
ok('termina com a extensão', c1.endsWith('.webp'));
ok('dois envios não colidem', c1 !== c2);
ok('sufixo do poster', caminhoNoBucket('x', 'webp', '-poster').includes('-poster.webp'));
ok('slug estranho é higienizado', !caminhoNoBucket('Cor/Nova Ç', 'webp').includes(' '));

// ==================================================== orientação
console.log('\n=== ORIENTAÇÃO ===');
const boa = { tipo: 'imagem', capa: true, alt: 'Rolo de vinil rosa metálico', largura: 1200, altura: 1200, tamanho_bytes: 240 * 1024 };
ok('foto boa não gera aviso', avaliarMidia(boa).length === 0, JSON.stringify(avaliarMidia(boa)));
ok('sem alt avisa', avaliarMidia({ ...boa, alt: null }).some((a) => a.texto.includes('alternativo')));
ok('alt curto avisa', avaliarMidia({ ...boa, alt: 'rolo' }).some((a) => a.texto.includes('alternativo')));
ok('foto pequena avisa', avaliarMidia({ ...boa, largura: 800, altura: 800 }).some((a) => a.texto.includes('Pequena')));
ok('capa retangular avisa', avaliarMidia({ ...boa, largura: 1600, altura: 900 }).some((a) => a.texto.includes('quadrado')));
ok('galeria retangular NÃO avisa', !avaliarMidia({ ...boa, capa: false, largura: 1600, altura: 900 }).some((a) => a.texto.includes('quadrado')));
ok('foto pesada avisa', avaliarMidia({ ...boa, tamanho_bytes: 900 * 1024 }).some((a) => a.texto.includes('Pesada')));
ok(
  'vídeo externo não é cobrado por peso nem dimensão',
  avaliarMidia({ tipo: 'video-externo', capa: false, alt: 'Aplicação em Golf preto', largura: null, altura: null, tamanho_bytes: null }).length === 0
);

console.log('\n=== CONJUNTO ===');
const img = (extra = {}) => ({ id: Math.random().toString(), tipo: 'imagem', capa: false, alt: 'foto do rolo aplicado', largura: 1200, altura: 1200, tamanho_bytes: 200000, ...extra });
ok('sem foto é erro', avaliarConjunto([]).some((a) => a.nivel === 'erro'));
ok('sem capa é erro', avaliarConjunto([img(), img()]).some((a) => a.texto.includes('capa')));
ok('uma foto só gera sugestão', avaliarConjunto([img({ capa: true })]).some((a) => a.nivel === 'atencao'));
ok('duas fotos com capa está ok', avaliarConjunto([img({ capa: true }), img()]).length === 0);
ok('vídeo sozinho ainda cobra foto', avaliarConjunto([{ tipo: 'video', capa: false, alt: 'x' }]).some((a) => a.nivel === 'erro'));

console.log('\n=== FORMATOS E LIMITES ===');
ok('bytes em kB', formatarBytes(250 * 1024) === '250 kB');
ok('bytes em MB', formatarBytes(3 * 1024 * 1024) === '3.0 MB');
ok('nulo vira travessão', formatarBytes(null) === '—');
ok('limite de vídeo em 20 s', LIMITES.videoDuracaoMaxS === 20);
ok('lado máximo 1600', LIMITES.ladoMax === 1600);
ok('peso bom até 400 kB', LIMITES.pesoBomBytes === 400 * 1024);

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
