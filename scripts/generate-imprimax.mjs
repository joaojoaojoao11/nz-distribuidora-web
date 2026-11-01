// Gera o catálogo Imprimax DecorMax a partir de scripts/data/imprimax/*.json
// (scripts/scrape-imprimax.mjs):
//   - public/assets/images/decor/imprimax/<slug>/texture.jpg (+ ambient-N.jpg
//     quando a foto de ambiente é do próprio padrão)
//   - public/assets/images/decor/imprimax/familias/<pagina>-<n>.jpg (ambiente
//     da família — nunca vai para a galeria de um padrão, porque mostra outro)
//   - src/pages/Decor/imprimaxProducts.ts e api/_lib/imprimaxSlugs.ts
//   - src/pages/Decor/imprimaxTotal.ts: só a contagem, para o menu não carregar
//     o catálogo inteiro
//   - scripts/data/imprimax/_banco.json: o que gravar em `produtos` e
//     `produto_midia` do banco do site (aplicado por migration)
// Determinístico (família → nome). Uso: node scripts/generate-imprimax.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DATA_DIR = path.resolve('scripts/data/imprimax');
const ORIG_DIR = path.join(DATA_DIR, '_originals');
const IMG_DIR = path.resolve('public/assets/images/decor/imprimax');
const OUT_TS = path.resolve('src/pages/Decor/imprimaxProducts.ts');
const OUT_SLUGS = path.resolve('api/_lib/imprimaxSlugs.ts');
const OUT_TOTAL = path.resolve('src/pages/Decor/imprimaxTotal.ts');
const OUT_BANCO = path.join(DATA_DIR, '_banco.json');

const LINHA = 'Imprimax DecorMax';

// Família do catálogo /decor/imprimax (agrupa as páginas do fabricante).
const FAMILY_ORDER = ['madeira', 'pedra', 'formica', 'tecido', 'textura', 'metal', 'piso'];
const FAMILY_NAMES = {
  madeira: 'Madeira', pedra: 'Pedra & Mármore', formica: 'Fórmica', tecido: 'Tecido & Telado',
  textura: 'Couro & Texturas', metal: 'Metal', piso: 'PisoMax',
};
const FAMILY_DESC = {
  madeira: 'Carvalhos, jequitibás, freijó, demolição e ripados com veio realista, mais o bambu natural e trançado.',
  pedra: 'Mármores com e sem brilho, travertinos, cimento queimado, ardósias, terrazzos, seixos e tijolos.',
  formica: 'Cores sólidas em três acabamentos: Laca (alto brilho), Satin (acetinado) e Ripada (frisos em relevo).',
  tecido: 'Bouclé, linho natural, telados, canvas, palha e a textura Savana para aquecer móveis e paredes.',
  textura: 'Couro Volpe e Firenze para painéis, cabeceiras e detalhes de mobiliário.',
  metal: 'Aço corten para acabamentos de efeito metálico.',
  piso: 'PisoMax: frontal de 250 micras para piso de tráfego leve.',
};

// Página do fabricante → família do catálogo e família de padrão da LOJA
// (src/lib/shop/pattern/taxonomy.ts). Pedras se subdivide pelo nome.
const PAGINA = {
  'gold-madeiras': { familia: 'madeira', padrao: 'madeira' },
  'gold-bambu': { familia: 'madeira', padrao: 'madeira' },
  'gold-pedras': { familia: 'pedra', padrao: null },
  'formica-laca': { familia: 'formica', padrao: 'formica' },
  'formica-satin': { familia: 'formica', padrao: 'formica' },
  'gold-formica-ripada': { familia: 'formica', padrao: 'formica' },
  'gold-tecido': { familia: 'tecido', padrao: 'tecido' },
  'gold-telado': { familia: 'tecido', padrao: 'tecido' },
  'gold-canvas': { familia: 'tecido', padrao: 'tecido' },
  'gold-palha': { familia: 'tecido', padrao: 'tecido' },
  'gold-savana': { familia: 'tecido', padrao: 'tecido' },
  'gold-couros': { familia: 'textura', padrao: 'couro' },
  'gold-firenze': { familia: 'textura', padrao: 'estampado' },
  'gold-metal': { familia: 'metal', padrao: 'metal' },
  'pisomax-decorativo': { familia: 'piso', padrao: 'piso' },
};
const padraoDePedra = (slug) =>
  /marmore|travertino|calacatta/.test(slug) ? 'marmore'
    : /cimento/.test(slug) ? 'cimento'
      : /tijolo/.test(slug) ? 'tijolo'
        : 'pedra';

// O cadastro do NZERP vem sem acento; a grafia certa é a do fabricante.
const ACENTOS = {
  aco: 'Aço', ardosia: 'Ardósia', atlantico: 'Atlântico', aluminio: 'Alumínio', boucle: 'Bouclé',
  classico: 'Clássico', demolicao: 'Demolição', formica: 'Fórmica', freijo: 'Freijó', jequitiba: 'Jequitibá',
  marmore: 'Mármore', nevoa: 'Névoa', petroleo: 'Petróleo', tabua: 'Tábua', trancado: 'Trançado',
};
const MINUSCULAS = new Set(['de', 'da', 'do', 'e']);
const SIGLAS = new Set(['mc', 'md', 'mi', 'mj', 'ml', 'mr', 'mt', 'sl']);

/** "madeira-carvalho-mc-1705" → "Madeira Carvalho MC-1705"; "pedras-…" e "tecido-…" perdem o prefixo da família. */
function nomeDoSlug(slug) {
  const ws = slug.split('-');
  if (ws[0] === 'pedras' || ws[0] === 'tecido') ws.shift();
  if (ws[0] === 'pisomax' && ws[1] === 'pedras') ws.splice(1, 1);
  const out = [];
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    if (SIGLAS.has(w) && /^\d+$/.test(ws[i + 1] ?? '')) {
      out.push(`${w.toUpperCase()}-${ws[i + 1]}`);
      i++;
    } else if (SIGLAS.has(w)) out.push(w.toUpperCase());
    else if (w === 'pisomax') out.push('PisoMax');
    else if (ACENTOS[w]) out.push(ACENTOS[w]);
    else if (i > 0 && MINUSCULAS.has(w)) out.push(w);
    else out.push(w[0].toUpperCase() + w.slice(1));
  }
  return out.join(' ');
}

const entidades = (s) => (s ?? '').replace(/&sup2;/g, '²').replace(/&eacute;/g, 'é').replace(/&amp;/g, '&').trim();

/** "0,140 / 0,180 mm" → "140 / 180 micras". */
function micras(mm) {
  if (!mm) return null;
  const ns = [...mm.matchAll(/(\d+),(\d+)/g)].map(([, a, b]) => Math.round(Number(`${a}.${b}`) * 1000));
  return ns.length ? `${ns.join(' / ')} micras` : null;
}

const familiasDoFabricante = JSON.parse(fs.readFileSync(path.join(DATA_DIR, '_familias.json'), 'utf8'));
const extensao = (u) => (u.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase();

async function converter(origem, destino, largura) {
  if (fs.existsSync(destino) && fs.statSync(destino).mtimeMs >= fs.statSync(origem).mtimeMs) return;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  await sharp(origem)
    .flatten({ background: '#ffffff' })
    .resize({ width: largura, height: largura, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(destino);
}

// Toda capa leva o selo escuro com o logo Imprimax no canto superior esquerdo
// (pedido do João, 31/10/2026). A capa é sempre regravada a partir do original,
// então o selo nunca sai em dobro. Medidas na escala de uma capa de 1080 px.
const LOGO_BRANCO = path.resolve('public/assets/logos/nzdecor/logo-imprimax-branco.webp');

async function gerarCapa(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const { data, info } = await sharp(origem)
    .flatten({ background: '#ffffff' })
    .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = info.width / 1080;
  const margem = Math.round(36 * k);
  const padX = Math.round(26 * k);
  const padY = Math.round(20 * k);
  const raio = Math.round(14 * k);
  const logo = await sharp(LOGO_BRANCO).resize(Math.round(380 * k)).png().toBuffer({ resolveWithObject: true });
  const pw = logo.info.width + 2 * padX;
  const ph = logo.info.height + 2 * padY;
  const folga = Math.round(20 * k);
  const placa = Buffer.from(
    `<svg width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${raio}" fill="rgba(14,14,14,0.9)"/></svg>`
  );
  const sombra = await sharp(Buffer.from(
    `<svg width="${pw + 2 * folga}" height="${ph + 2 * folga}"><rect x="${folga}" y="${Math.round(24 * k)}" width="${pw}" height="${ph}" rx="${raio}" fill="rgba(0,0,0,0.18)"/></svg>`
  )).blur(Math.max(0.3, 9 * k)).png().toBuffer();
  await sharp(data, { raw: info })
    .composite([
      { input: sombra, left: margem - folga, top: margem - folga },
      { input: placa, left: margem, top: margem },
      { input: logo.data, left: margem + padX, top: margem + padY },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(destino);
}

const FONTE = 'Segoe UI, Arial, sans-serif';
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Onde fica a parte lisa do rolo na foto do fabricante. A capa padrão (1080 px)
// tem o rolo saindo da esquerda; a Fórmica Ripada (700 px) tem o rolo à
// esquerda e os frisos embaixo à direita; sem textura, a capa é um ambiente.
function regiaoDaAmostra(info, temTextura) {
  const k = info.width / 1080;
  if (!temTextura) {
    const h = info.height, w = Math.round(h * 0.7);
    return { left: Math.round((info.width - w) / 2), top: 0, width: w, height: h };
  }
  if (info.width < 1000) {
    const s = info.width / 700;
    return { left: Math.round(380 * s), top: Math.round(330 * s), width: Math.round(238 * s), height: Math.round(340 * s) };
  }
  return { left: Math.round(60 * k), top: Math.round(370 * k), width: Math.round(385 * k), height: Math.round(550 * k) };
}

// Zoom da textura (pedido do João, 31/10/2026): recorte da parte lisa do rolo,
// ampliado. Só nas capas de 1080 px com textura; nas menores o zoom sairia
// borrado e na capa de ambiente não há textura para ampliar.
async function gerarZoom(origem, destino, temTextura) {
  const img = sharp(origem).flatten({ background: '#ffffff' });
  const info = await img.metadata();
  if (!temTextura || info.width < 1000 || info.height < 1000) return false;
  const k = info.width / 1080;
  const etiqueta = Buffer.from(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect x="36" y="976" width="420" height="68" rx="12" fill="rgba(14,14,14,0.82)"/>
  <text x="62" y="1020" font-family="${FONTE}" font-size="30" font-weight="600" fill="#fff" letter-spacing="1">DETALHE DA TEXTURA</text>
</svg>`);
  const recorte = await img
    .extract({ left: Math.round(40 * k), top: Math.round(330 * k), width: Math.round(600 * k), height: Math.round(600 * k) })
    .resize(1080, 1080, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.8 })
    .toBuffer();
  // Monta em 1080 e grava em 900 px: o recorte ampliado não tem mais detalhe que isso.
  const montado = await sharp(recorte).composite([{ input: etiqueta }]).toBuffer();
  await sharp(montado).resize(900).jpeg({ quality: 82, mozjpeg: true }).toFile(destino);
  return true;
}

// Card de ficha técnica (pedido do João, 31/10/2026): amostra do padrão e os
// dados do rolo, no fundo escuro do site.
async function gerarFicha(origem, destino, { name, colecao, espessura, durabilidade, piso, temTextura }) {
  const base = sharp(origem).flatten({ background: '#ffffff' });
  const info = await base.metadata();
  const amostra = await base.extract(regiaoDaAmostra(info, temTextura)).resize(420, 600).toBuffer();
  const logo = await sharp(LOGO_BRANCO).resize(300).png().toBuffer();
  const linhas = [
    ['Rolo', '1,22 m × 25 m'],
    espessura && ['Espessura frontal', espessura],
    ['Adesivo', 'acrílico permanente'],
    durabilidade && ['Durabilidade', durabilidade],
    ['Proteção', 'antimofo e antibacteriano'],
    ['Segurança', 'não propaga fogo'],
    ['Origem', 'indústria nacional'],
  ].filter(Boolean);
  const passo = 72;
  const y0 = 330 + Math.round((600 - (linhas.length * passo - 40)) / 2);
  const corpo = linhas.map(([k, v], i) => `
  <text x="520" y="${y0 + i * passo}" font-family="${FONTE}" font-size="22" fill="#9a9a9a" letter-spacing="1.5">${xml(k.toUpperCase())}</text>
  <text x="520" y="${y0 + i * passo + 32}" font-family="${FONTE}" font-size="29" font-weight="600" fill="#f2f2f2">${xml(v)}</text>`).join('');
  const titulo = Math.min(46, Math.floor(960 / (name.length * 0.56)));
  const uso = piso
    ? 'Vinil autoadesivo · piso de tráfego leve, paredes, móveis e bancadas'
    : 'Vinil autoadesivo decorativo · móveis, paredes, portas e eletrodomésticos';
  const svg = Buffer.from(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#0e0e0e"/>
  <text x="60" y="220" font-family="${FONTE}" font-size="24" fill="#c8102e" letter-spacing="3" font-weight="700">${xml(colecao.toUpperCase())}</text>
  <text x="60" y="275" font-family="${FONTE}" font-size="${titulo}" font-weight="700" fill="#ffffff">${xml(name)}</text>
  <rect x="59" y="329" width="422" height="602" fill="none" stroke="#333" stroke-width="2"/>
  ${corpo}
  <text x="60" y="1010" font-family="${FONTE}" font-size="20" fill="#7a7a7a">${xml(uso)}</text>
</svg>`);
  await sharp(svg)
    .composite([{ input: logo, left: 60, top: 70 }, { input: amostra, left: 60, top: 330 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(destino);
}

// Fotos reais do padrão aplicado, do Digital Press Kit da Imprimax (Drive
// público do fabricante), escolhidas à mão: _originals/<slug>--kit-N.jpg.
const fotosDoKit = (slug) =>
  fs.readdirSync(ORIG_DIR)
    .filter((f) => f.startsWith(`${slug}--kit-`))
    .sort((a, b) => Number(a.match(/kit-(\d+)/)[1]) - Number(b.match(/kit-(\d+)/)[1]));

const registros = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));

const entries = [];
const banco = [];
const semFoto = [];
for (const r of registros) {
  const cfg = PAGINA[r.pagina];
  if (!cfg) throw new Error(`${r.slug}: página sem família (${r.pagina})`);
  const capaOrigem = r.textura
    ? path.join(ORIG_DIR, `${r.slug}--textura.${extensao(r.textura)}`)
    : r.ambiente[0] ? path.join(ORIG_DIR, `${r.slug}--ambiente-1.${extensao(r.ambiente[0])}`) : null;
  if (!capaOrigem || !fs.existsSync(capaOrigem)) {
    semFoto.push(r.sku);
    continue;
  }
  const dir = path.join(IMG_DIR, r.slug);
  await gerarCapa(capaOrigem, path.join(dir, 'texture.jpg'));
  // A capa já pode ser a foto de ambiente (padrão sem textura no site do fabricante).
  const ambientesOrigem = r.textura ? r.ambiente : r.ambiente.slice(1);
  const ambient = [];
  for (let i = 0; i < ambientesOrigem.length && i < 3; i++) {
    const idx = r.textura ? i + 1 : i + 2;
    const origem = path.join(ORIG_DIR, `${r.slug}--ambiente-${idx}.${extensao(ambientesOrigem[i])}`);
    if (!fs.existsSync(origem)) continue;
    await converter(origem, path.join(dir, `ambient-${ambient.length + 1}.jpg`), 1600);
    ambient.push(`/assets/images/decor/imprimax/${r.slug}/ambient-${ambient.length + 1}.jpg`);
  }
  for (const [i, arquivo] of fotosDoKit(r.slug).entries()) {
    await converter(path.join(ORIG_DIR, arquivo), path.join(dir, `kit-${i + 1}.jpg`), 1200);
    ambient.push(`/assets/images/decor/imprimax/${r.slug}/kit-${i + 1}.jpg`);
  }

  const fab = familiasDoFabricante[r.pagina];
  const ficha = fab?.ficha ?? {};
  const espessura = micras(ficha.frontal_mm);
  const liner = entidades(ficha.liner);
  const name = nomeDoSlug(r.slug);
  const familia = cfg.familia;
  const famName = FAMILY_NAMES[familia];
  const colecao = fab.titulo; // "Gold Madeiras", "Gold Fórmica Satin"…
  const codigoImprimax = r.sku.replace(/^IMX/, '').padStart(10, '0');
  const durabilidade = ficha.durabilidade_interna && ficha.durabilidade_externa
    ? `${ficha.durabilidade_interna} interno · ${ficha.durabilidade_externa} externo`
    : null;

  const description =
    `Padrão ${name}, da coleção ${colecao} da linha ${LINHA}. ` +
    `Vinil autoadesivo de PVC polimérico calandrado` +
    (espessura ? `, com frontal de ${espessura}` : '') +
    ', adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. ' +
    (familia === 'piso'
      ? 'Indicado para piso de tráfego leve e para paredes, móveis e bancadas.'
      : 'Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.');

  const specs = [];
  if (espessura) specs.push({ label: 'Espessura frontal', value: espessura });
  specs.push({ label: 'Dimensões do rolo', value: '1,22 m × 25 m' });
  if (liner) specs.push({ label: 'Liner', value: /papel|poli/i.test(liner) ? liner.replace(/(\d)g/, '$1 g') : `Papel siliconado ${liner.replace(/(\d)g/, '$1 g')}` });
  specs.push({ label: 'Adesivo', value: 'Acrílico aquoso permanente, sensível à pressão (atóxico)' });
  if (durabilidade) specs.push({ label: 'Durabilidade', value: durabilidade });
  specs.push({ label: 'Proteção', value: 'Antimofo, antibacteriano, não propaga fogo' });
  specs.push({ label: 'Código Imprimax', value: codigoImprimax });

  const badges = ['INDÚSTRIA NACIONAL', 'ANTIMOFO · ANTIBACTERIANO', 'NÃO PROPAGA FOGO'];
  const texture = `/assets/images/decor/imprimax/${r.slug}/texture.jpg`;
  const zoom = (await gerarZoom(capaOrigem, path.join(dir, 'zoom.jpg'), !!r.textura))
    ? `/assets/images/decor/imprimax/${r.slug}/zoom.jpg`
    : undefined;
  await gerarFicha(capaOrigem, path.join(dir, 'ficha.jpg'), {
    name, colecao, espessura, durabilidade, piso: familia === 'piso', temTextura: !!r.textura,
  });
  const cardFicha = `/assets/images/decor/imprimax/${r.slug}/ficha.jpg`;
  const seo = {
    title: `${name} — Vinil Adesivo ${LINHA}`,
    description: `Revestimento vinílico autoadesivo ${name}, coleção ${colecao}, linha ${LINHA}. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.`,
    keywords: `${name.toLowerCase()} adesivo, imprimax ${name.toLowerCase()}, decormax ${name.toLowerCase()}, vinil ${famName.toLowerCase()} imprimax`,
  };

  entries.push({
    slug: r.slug,
    name,
    code: codigoImprimax,
    sku: r.sku,
    lojaSlug: `imprimax-${r.slug}`,
    family: familia,
    collection: colecao,
    description,
    specs,
    badges,
    images: { texture, ambient, ...(zoom ? { zoom } : {}), ficha: cardFicha },
    seo,
    sourceUrl: r.fonte,
  });

  // Loja: a ficha do produto só leva o que é DELE (espessura, liner, código);
  // adesivo, durabilidade e proteção são da linha (tabela `linhas`). A medida
  // do rolo vem do ERP, nunca daqui (src/lib/shop/linhas.ts, camada D).
  const fichaLoja = [];
  if (espessura) fichaLoja.push({ label: 'Espessura frontal', value: espessura });
  if (/poli/i.test(liner)) fichaLoja.push({ label: 'Liner', value: liner.replace(/(\d)g/, '$1 g') });
  if (durabilidade) fichaLoja.push({ label: 'Durabilidade', value: durabilidade });
  fichaLoja.push({ label: 'Coleção', value: colecao });
  fichaLoja.push({ label: 'Código Imprimax', value: codigoImprimax });
  banco.push({
    sku: r.sku,
    slug: `imprimax-${r.slug}`,
    nome: name,
    subtitulo: colecao,
    familia_padrao: cfg.padrao ?? padraoDePedra(r.slug),
    descricao: description,
    ficha: fichaLoja,
    badges,
    durabilidade_anos: Number(ficha.durabilidade_interna?.match(/\d+/)?.[0] ?? 0) || null,
    seo_titulo: seo.title,
    seo_descricao: seo.description,
    midias: [
      { url: texture, alt: `Vinil adesivo ${name} — ${LINHA}` },
      ...ambient.map((url) => ({ url, alt: `${name} aplicado em ambiente` })),
      ...(zoom ? [{ url: zoom, alt: `Detalhe da textura ${name}` }] : []),
      { url: cardFicha, alt: `Ficha técnica ${name}` },
    ].map((m, ordem) => ({ url: m.url, ordem, capa: ordem === 0, alt: m.alt })),
  });
}

// Ambiente da família: vai para a galeria da LINHA e para o topo de cada
// família no catálogo — mostra a família, não um padrão específico.
const ambientesFamilia = {};
for (const [pagina, fab] of Object.entries(familiasDoFabricante)) {
  const familia = PAGINA[pagina]?.familia;
  if (!familia) continue;
  for (let i = 0; i < fab.ambiente.length; i++) {
    const origem = path.join(ORIG_DIR, `_familia--${pagina}--${i + 1}.${extensao(fab.ambiente[i])}`);
    if (!fs.existsSync(origem)) continue;
    const destino = path.join(IMG_DIR, 'familias', `${pagina}-${i + 1}.jpg`);
    await converter(origem, destino, 1600);
    (ambientesFamilia[familia] ??= []).push({ url: `/assets/images/decor/imprimax/familias/${pagina}-${i + 1}.jpg`, colecao: fab.titulo });
  }
}

entries.sort((a, b) => {
  const fo = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
  if (fo !== 0) return fo;
  return a.name.localeCompare(b.name, 'pt');
});
banco.sort((a, b) => a.slug.localeCompare(b.slug));

const familiasUsadas = FAMILY_ORDER.filter((f) => entries.some((e) => e.family === f));
const families = familiasUsadas.map((slug) => ({
  slug,
  name: FAMILY_NAMES[slug],
  description: FAMILY_DESC[slug],
  ambient: (ambientesFamilia[slug] ?? []).slice(0, 4).map((a) => a.url),
}));

const header = `// Catálogo Imprimax DecorMax — GERADO a partir de scripts/data/imprimax/*.json
// (scripts/generate-imprimax.mjs). Edite os JSONs e regenere; não edite à mão.

export type ImprimaxFamilySlug = ${FAMILY_ORDER.map((f) => `'${f}'`).join(' | ')};

export type ImprimaxFamily = {
  slug: ImprimaxFamilySlug;
  name: string;
  description: string;
  /** Fotos de ambiente da FAMÍLIA (não mostram um padrão específico). */
  ambient: string[];
};

export type ImprimaxSpec = { label: string; value: string };

export type ImprimaxProduct = {
  slug: string;
  name: string;
  /** Código do fabricante (10 dígitos, como na lista de preços Imprimax). */
  code: string;
  sku: string;
  /** Página do produto na loja (/loja/<lojaSlug>), com preço e compra. */
  lojaSlug: string;
  family: ImprimaxFamilySlug;
  collection: string;
  description: string;
  specs: ImprimaxSpec[];
  badges: string[];
  images: {
    texture: string;
    /** Fotos DESTE padrão aplicado (site e Digital Press Kit do fabricante). */
    ambient: string[];
    /** Recorte ampliado da textura (só nas capas de 1080 px). */
    zoom?: string;
    /** Card com a amostra e os dados do rolo. */
    ficha: string;
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const IMPRIMAX_HERO_BADGES = [
  'INDÚSTRIA NACIONAL',
  'ANTIMOFO · ANTIBACTERIANO',
  'NÃO PROPAGA FOGO',
  'ROLO 1,22 × 25 M',
];

export const imprimaxFamilies: ImprimaxFamily[] = ${JSON.stringify(families, null, 2)};

export const imprimaxProducts: ImprimaxProduct[] = `;

const footer = `;

export const getImprimaxProductBySlug = (slug?: string) =>
  imprimaxProducts.find((p) => p.slug === slug);

export const getImprimaxProductsByFamily = (family: ImprimaxFamilySlug) =>
  imprimaxProducts.filter((p) => p.family === family);

export const getImprimaxFamilyBySlug = (slug?: string) =>
  imprimaxFamilies.find((f) => f.slug === slug);
`;

fs.writeFileSync(OUT_TS, header + JSON.stringify(entries, null, 2) + footer);
fs.writeFileSync(
  OUT_SLUGS,
  `// GERADO por scripts/generate-imprimax.mjs — não editar à mão\nexport const imprimaxSlugs: string[] = ${JSON.stringify(entries.map((e) => e.slug))};\n`
);
fs.writeFileSync(
  OUT_TOTAL,
  `// GERADO por scripts/generate-imprimax.mjs — não editar à mão
export const IMPRIMAX_TOTAL = ${entries.length};
`
);
fs.writeFileSync(
  OUT_BANCO,
  JSON.stringify({ linhaGaleria: Object.entries(ambientesFamilia).flatMap(([familia, fotos]) => fotos.slice(0, 2).map((f) => ({ url: f.url, titulo: f.colecao, sub: FAMILY_NAMES[familia] }))), produtos: banco }, null, 2) + '\n'
);

const byFamily = {};
for (const e of entries) byFamily[e.family] = (byFamily[e.family] ?? 0) + 1;
console.log(`gerado: ${entries.length} produtos`, byFamily, `· sem foto (ficam ocultos): ${semFoto.length}`);
