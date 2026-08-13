// Baixa os assets oficiais da Metamark (UK) Ltd. para public/assets/.
// Fonte única: scripts/data/metamark/mcx-colors.json (chipFile) + a lista LINE_ASSETS abaixo.
// Idempotente: pula o que já existe em disco com tamanho plausível. Use --force para rebaixar.
//
// Uso: node scripts/scrape-metamark.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';

const CDN = 'https://metamark.co.uk/cdn/shop/files';
const FORCE = process.argv.includes('--force');

const CHIP_DIR = path.resolve('public/assets/images/metamark/mcx/chips');
const MCX_DIR = path.resolve('public/assets/images/metamark/mcx');
const M7_DIR = path.resolve('public/assets/images/metamark/m7');
const MD80_DIR = path.resolve('public/assets/images/metamark/md80');
const LOGO_DIR = path.resolve('public/assets/logos/metamark');
const CREDITS = path.resolve('public/assets/images/metamark/CREDITS.md');

// fotos da linha + logo. `w` pede o resize ao CDN da Shopify quando o original é maior.
const LINE_ASSETS = [
  // MCX — as únicas fotos de veículo envelopado publicadas pela Metamark são da
  // MCX-84 Electric Storm. vimana-mcx-wrap.jpg é pequena demais (600x300) e o
  // banner metacast-mcx-video-placeholder traz o letreiro da própria Metamark,
  // então nenhum dos dois serve como hero.
  { remote: 'MCX-84-side.jpg', out: path.join(MCX_DIR, 'mcx-hero.jpg'), w: 1600 },
  { remote: 'MCX-84-front.jpg', out: path.join(MCX_DIR, 'mcx-card.jpg'), w: 1600 },
  { remote: 'MCX-84-rear-side.jpg', out: path.join(MCX_DIR, 'mcx-aplicacao-1.jpg'), w: 1600 },
  { remote: 'MCX-84-rear.jpg', out: path.join(MCX_DIR, 'mcx-aplicacao-2.jpg'), w: 1600 },
  { remote: 'MCX-2.jpg', out: path.join(MCX_DIR, 'mcx-aplicacao-3.jpg'), w: 1600 },
  { remote: 'metacast-mcx-video-placeholder-full_1.jpg', out: path.join(MCX_DIR, 'mcx-aplicacao-4.jpg'), w: 1600 },
  // M7 — gráfico veicular e comunicação visual, as duas aplicações da linha
  { remote: 'M7_11.jpg', out: path.join(M7_DIR, 'm7-hero.jpg'), w: 1600 },
  { remote: 'M7_4_b37897cf-333e-4122-8b2b-b86ebc83efc7.jpg', out: path.join(M7_DIR, 'm7-card.jpg'), w: 1600 },
  { remote: 'M7_1_8d4a1c83-9135-4c04-973b-3f64a768974a.jpg', out: path.join(M7_DIR, 'm7-aplicacao-1.jpg'), w: 1600 },
  { remote: 'M7_10_ab1f5251-7ee2-4095-8e86-e1d5c15566c7.jpg', out: path.join(M7_DIR, 'm7-aplicacao-2.jpg'), w: 1600 },
  { remote: 'M7_5_e72390fd-fb1b-4105-a729-9d83bbbc7da9.jpg', out: path.join(M7_DIR, 'm7-aplicacao-3.jpg'), w: 1600 },
  { remote: 'M7_8.jpg', out: path.join(M7_DIR, 'm7-aplicacao-4.jpg'), w: 1600 },
  // MD-80 Series — as duas fotos que a Metamark publica por produto. O acabamento
  // fosco (MD-81M / MD-81MB) é variante dentro da mesma página, sem foto própria,
  // então os cards fosco do /sign herdam a foto do produto correspondente.
  { remote: 'MD-80_1.jpg', out: path.join(MD80_DIR, 'md-80-card.jpg'), w: 1200 },
  { remote: 'MD-80_2.jpg', out: path.join(MD80_DIR, 'md-80-detalhe.jpg'), w: 1200 },
  { remote: 'MD-80B_1.jpg', out: path.join(MD80_DIR, 'md-80b-card.jpg'), w: 1200 },
  { remote: 'MD-80B_2.jpg', out: path.join(MD80_DIR, 'md-80b-detalhe.jpg'), w: 1200 },
  { remote: 'Logo_1.svg', out: path.join(LOGO_DIR, 'logo-metamark.svg') },
];

// Validação por assinatura, não por tamanho: chips de cor lisa (Jet Black, Simply White)
// são JPEGs legítimos de ~1,8 KB — um piso de bytes generoso os rejeitaria.
const MIN_BYTES = 800;
const isValid = (buf, ext) =>
  ext === '.svg'
    ? buf.subarray(0, 512).toString('utf8').includes('<svg')
    : buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff; // SOI do JPEG

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function download(url, out) {
  const ext = path.extname(out);
  if (!FORCE && fs.existsSync(out) && fs.statSync(out).size >= MIN_BYTES) return 'cache';

  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 nz-distribuidora-web/asset-sync' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`resposta curta demais (${buf.length}B) — ${url}`);
  if (!isValid(buf, ext)) throw new Error(`conteúdo não é ${ext} válido — ${url}`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  return 'ok';
}

const data = JSON.parse(fs.readFileSync(path.resolve('scripts/data/metamark/mcx-colors.json'), 'utf8'));

const jobs = [
  ...data.colors.map((c) => ({
    url: `${CDN}/${c.chipFile}`,
    out: path.join(CHIP_DIR, `${slugify(c.code)}-${slugify(c.name)}.jpg`),
    label: `${c.code} ${c.name}`,
  })),
  ...LINE_ASSETS.map((a) => ({
    url: `${CDN}/${a.remote}${a.w ? `?width=${a.w}` : ''}`,
    out: a.out,
    label: path.basename(a.out),
  })),
];

let ok = 0;
let cached = 0;
const failures = [];
const credits = [];

for (const job of jobs) {
  try {
    const status = await download(job.url, job.out);
    status === 'ok' ? ok++ : cached++;
    credits.push(`| \`${path.relative(path.resolve('public'), job.out).replace(/\\/g, '/')}\` | ${job.url} |`);
  } catch (err) {
    failures.push(`${job.label}: ${err.message}`);
  }
}

const today = new Date().toISOString().slice(0, 10);

// O script é dono APENAS da seção abaixo deste heading. Tudo acima é escrito à
// mão — a tabela de procedência foto a foto da MCX, por exemplo, com o
// mapeamento conferido página a página na brochure. Reescrever o arquivo inteiro
// apagava esse conteúdo a cada rodada; agora só o trecho gerado é substituído.
const GENERATED_HEADING = '## Baixados por este script';

const DEFAULT_PREAMBLE =
  `# Créditos das imagens — Metamark\n\n` +
  `Todo o material desta pasta é **oficial da Metamark (UK) Limited**, baixado do site do\n` +
  `fabricante por \`scripts/scrape-metamark.mjs\`. Nenhuma imagem é gerada por IA e nenhuma\n` +
  `vem de terceiros (revendas, aplicadores ou bancos de imagem).\n\n` +
  `Metamark®, MetaCast®, MetaGlide®, MetaSure™ e Inspire Colours™ são marcas registradas\n` +
  `da Metamark (UK) Limited.\n\n`;

const existing = fs.existsSync(CREDITS) ? fs.readFileSync(CREDITS, 'utf8') : '';
const preamble = existing.includes(GENERATED_HEADING)
  ? existing.slice(0, existing.indexOf(GENERATED_HEADING))
  : DEFAULT_PREAMBLE;

fs.writeFileSync(
  CREDITS,
  preamble +
    `${GENERATED_HEADING}\n\n` +
    `Última sincronização: ${today}\n\n` +
    `| Arquivo | Origem |\n| --- | --- |\n${credits.join('\n')}\n`,
);

console.log(`\nMetamark — assets: ${ok} baixados, ${cached} em cache, ${failures.length} falhas`);
if (failures.length) {
  console.error('\nFALHAS:');
  failures.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}
console.log(`CREDITS.md atualizado (${credits.length} arquivos).`);
