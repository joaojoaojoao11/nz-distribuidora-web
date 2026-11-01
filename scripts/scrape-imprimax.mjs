// Importa as texturas da linha Imprimax DecorMax a partir das páginas de
// família do site oficial (https://www.imprimax.com.br/gold-madeiras etc.).
// Não existe página por padrão: cada família tem uma galeria com a textura de
// cada padrão, e o nome do padrão está no nome do arquivo. As fotos de
// ambiente são da família (não de um padrão), salvo quando o arquivo nomeia o
// padrão ("Linho Natural Bege - Móveis").
//
// O casamento com o cadastro é pelos SKUs que já existem no NZERP
// (scripts/data/imprimax/_skus.json, exportado do espelho do site): nome do
// arquivo e nome do SKU viram conjuntos de palavras e só casam quando são
// IGUAIS. O que não casar fica no relatório — nada de chute; casos conferidos
// à mão entram em CASADOS_A_MAO, com o motivo.
//
// Uso: node scripts/scrape-imprimax.mjs [--sem-baixar]
// Saída: scripts/data/imprimax/<slug>.json, _familias.json, _relatorio.json
//        + originais em _originals/ (fora do git)
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.imprimax.com.br';
const DATA_DIR = path.resolve('scripts/data/imprimax');
const ORIG_DIR = path.join(DATA_DIR, '_originals');
const semBaixar = process.argv.includes('--sem-baixar');

// página do fabricante → prefixo do nome no NZERP (depois de "IMPRIMAX DECOR GOLD")
// e as palavras de família que o arquivo da imagem repete.
const PAGINAS = [
  { pagina: 'gold-madeiras', titulo: 'Gold Madeiras', erp: 'madeira', ruido: ['madeiras', 'madeira'] },
  { pagina: 'gold-pedras', titulo: 'Gold Pedras', erp: 'pedras', ruido: ['pedras', 'pedra'] },
  { pagina: 'formica-laca', titulo: 'Gold Fórmica Laca', erp: 'formica laca', ruido: ['formica', 'laca'] },
  { pagina: 'formica-satin', titulo: 'Gold Fórmica Satin', erp: 'formica satin', ruido: ['formica', 'satin'] },
  { pagina: 'gold-formica-ripada', titulo: 'Gold Fórmica Ripada', erp: 'formica ripada', ruido: ['formica', 'ripada'] },
  { pagina: 'gold-tecido', titulo: 'Gold Tecido', erp: 'tecido', ruido: ['tecido'] },
  { pagina: 'gold-telado', titulo: 'Gold Telado', erp: 'telado', ruido: ['telado'] },
  { pagina: 'gold-couros', titulo: 'Gold Couros', erp: 'couros', ruido: ['couros'] },
  { pagina: 'gold-savana', titulo: 'Gold Savana', erp: 'savana', ruido: ['savana'] },
  { pagina: 'gold-firenze', titulo: 'Gold Firenze', erp: 'firenze', ruido: ['firenze'] },
  { pagina: 'gold-bambu', titulo: 'Gold Bambu', erp: 'bambu', ruido: ['bambu'] },
  { pagina: 'gold-palha', titulo: 'Gold Palha', erp: 'palha', ruido: ['palha'] },
  { pagina: 'gold-canvas', titulo: 'Gold Canvas', erp: 'canvas', ruido: ['canvas'] },
  { pagina: 'gold-metal', titulo: 'Gold Metal', erp: 'aco corten', ruido: ['metal', 'aco', 'corten'] },
  { pagina: 'pisomax-decorativo', titulo: 'PisoMax Decorativo', erp: 'pisomax pedras', ruido: ['piso', 'max', 'decorativo', 'pisomax', 'pedras'] },
];

// Palavras que só dizem ONDE a foto foi tirada (foto de ambiente): "Móveis2",
// "Parede_0005". O número com zero na frente é o índice da foto, não o código
// do padrão (que é 1701, 2601…).
const LUGAR = /^(parede|paredes|moveis|balcao|teto|banheiro|aplica|carrosel|carrossel)\d*$/;
const semLugar = (ws) => ws.filter((w) => !LUGAR.test(w) && w !== 'e' && w !== 'sub' && !/^0\d+$/.test(w));
const SEMPRE_RUIDO = new Set(['imprimax', 'decormax', 'gold', 'v01']);

// Conferidos olhando a página do fabricante: o arquivo tem uma palavra a mais
// ou a menos que o cadastro, mas é o mesmo padrão (e o único candidato).
const CASADOS_A_MAO = {
  // "imprimax_gold_formica_satin_cinza_glacial": o cadastro diz só "Glacial";
  // a Satin não tem outro Glacial além do Atlântico Glacial (que é outro arquivo).
  IMX10250005: { arquivo: /formica_satin_cinza_glacial/, motivo: 'cadastro "Satin Glacial" = arquivo "Satin Cinza Glacial"' },
  // Marrom Armani só existe em gloss na linha Gold Pedras.
  IMX14060059: { arquivo: /marmore_marrom_armani/, motivo: 'cadastro com "Gloss", arquivo sem; único Marrom Armani' },
  // O arquivo do Travertino Semi Brilho não repete "Mármore".
  IMX14060047: { arquivo: /pedras_travertino_semi_brilho/, motivo: 'arquivo sem a palavra "Mármore"' },
  IMX14060048: { arquivo: /pedras_travertino_super_brilho/, motivo: 'arquivo sem "Mármore" e sem a espessura (0,25)' },
  IMX14060041: { arquivo: /Calacatta-Athenas/, motivo: 'arquivo sem a palavra "Mármore"' },
  // A Gold Telado só tem um preto, e o arquivo o chama de "Linho Preto".
  IMX14010005: { arquivo: /telado_linho_preto/, motivo: 'cadastro "Telado Preto" = arquivo "Telado Linho Preto"' },
  IMX15240041: { arquivo: /piso_max_decorativo_terrazo_off_white/, motivo: 'arquivo sem "Matte"; único Terrazzo Off White do PisoMax' },
};

const norm = (s) =>
  decodeURIComponent(s)
    .replace(/\+/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/terrazo/g, 'terrazzo') // o fabricante escreve das duas formas
    .replace(/\(\s*0,\d+\s*\)/g, ' ');

const palavras = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Nome do arquivo → palavras do padrão (sem hash, sem índice, sem família). */
function palavrasDoArquivo(arquivo, ruido) {
  let base = decodeURIComponent(arquivo).replace(/\.(jpe?g|png|webp)$/i, '');
  base = base.replace(/-[0-9a-f]{8}$/i, '').replace(/^\d{3}_/, '').replace(/-imprimax-decormax$/i, '');
  return palavras(base).filter((w) => !SEMPRE_RUIDO.has(w) && !ruido.includes(w));
}

const igual = (a, b) => a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ');

const UA = { 'User-Agent': 'Mozilla/5.0 (NZ Group catálogo de revenda)' };

async function lerPagina(pagina) {
  const res = await fetch(`${BASE}/${pagina}`, { headers: UA });
  if (!res.ok) throw new Error(`${pagina}: HTTP ${res.status}`);
  return res.text();
}

/** Texto corrido da página, para ler a tabela de características. */
function textoDe(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' | ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/(\s*\|\s*)+/g, ' | ')
    .replace(/\s+/g, ' ');
}

/** "Durabilidade Interna | Durabilidade Externa | X | 8 anos | 5 anos" e "Frontal | Liner | Dimensões | Toda a Linha | a | b | c". */
function fichaDaPagina(texto) {
  const dur = texto.match(/Durabilidade Interna \| Durabilidade Externa \| [^|]+ \| ([^|]+?) \| ([^|]+?) \|/);
  const tec = texto.match(/Frontal \| Liner \| Dimens[^|]+ \| [^|]+ \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|/);
  const frontal = tec?.[1]?.trim() ?? null;
  return {
    frontal_mm: frontal,
    liner: tec?.[2]?.trim() ?? null,
    dimensoes: tec?.[3]?.trim() ?? null,
    durabilidade_interna: dur?.[1]?.trim() ?? null,
    durabilidade_externa: dur?.[2]?.trim() ?? null,
  };
}

const skus = JSON.parse(fs.readFileSync(path.join(DATA_DIR, '_skus.json'), 'utf8'));
const restoDoNome = (nome) => palavras(nome.replace(/^IMPRIMAX DECOR (GOLD )?/i, ''));

fs.mkdirSync(ORIG_DIR, { recursive: true });

const familias = {};
const COPIA_DA_PAGINA = new Map(); // original → cópia 1920w usada pela própria página
const casados = new Map(); // sku → { pagina, textura, ambiente[] }
const sobras = [];

for (const cfg of PAGINAS) {
  const html = await lerPagina(cfg.pagina);
  // Só o original de cada imagem (sem as cópias "-640w"/"-1920w" do construtor do site).
  const urls = [...new Set(html.match(/https:\/\/irp[^"'\s)]*?\/dms3rep\/multi\/[^"'\s)/]+?\.(?:jpe?g|png|webp)/gi) ?? [])]
    .filter((u) => !/\/opt\//.test(u) && !/-\d+w\.(?:jpe?g|png|webp)$/i.test(u))
    .filter((u) => !/logo|icon[_-]|botao|bot%C3%A3o/i.test(u));
  const porArquivo = new Map(urls.map((u) => [u.split('/').pop(), u]));
  // A mesma imagem redimensionada que a página mostra ("/opt/<nome>-1920w"):
  // alguns originais respondem 403 e a cópia da página abre.
  const copias = html.match(/https:\/\/[^"'\s)]*?\/opt\/[^"'\s)/]+?-1920w\.(?:jpe?g|png|webp)/gi) ?? [];
  for (const u of porArquivo.values()) {
    const nome = u.split('/').pop().replace(/\.(jpe?g|png|webp)$/i, '');
    const copia = copias.find((c) => c.includes(`/opt/${nome}-1920w.`));
    if (copia) COPIA_DA_PAGINA.set(u, copia);
  }

  const prefixo = palavras(cfg.erp);
  const daPagina = skus.filter((s) => {
    const r = restoDoNome(s.nome);
    return prefixo.every((p, i) => r[i] === p);
  });

  const usados = new Set();
  const ambienteDaFamilia = [];
  for (const [arquivo, url] of porArquivo) {
    const ws = palavrasDoArquivo(arquivo, cfg.ruido);
    const ehAmbiente = ws.some((w) => LUGAR.test(w));
    let achou = null;
    for (const s of daPagina) {
      const alvo = restoDoNome(s.nome).slice(prefixo.length);
      const m = CASADOS_A_MAO[s.sku];
      if ((m && m.arquivo.test(arquivo)) || igual(ehAmbiente ? semLugar(ws) : ws, alvo)) { achou = s; break; }
    }
    if (achou) {
      const c = casados.get(achou.sku) ?? { pagina: cfg.pagina, textura: null, ambiente: [] };
      // Duas texturas para o mesmo padrão: fica a da grade padrão do fabricante
      // ("imprimax_gold_…", fundo e escala iguais aos vizinhos).
      if (ehAmbiente) c.ambiente.push(url);
      else if (!c.textura || (/\/imprimax_/i.test(url) && !/\/imprimax_/i.test(c.textura))) c.textura = url;
      casados.set(achou.sku, c);
      usados.add(arquivo);
    } else if (/_20\d\d_\d+|carrossel|carrosel|FOrmica_Satin_0|Ripada_0|gold-formica-laca|Aplica|Parede|Banheiro|TX\+0/i.test(arquivo)) {
      ambienteDaFamilia.push(url);
    } else {
      sobras.push({ pagina: cfg.pagina, arquivo, palavras: ws });
    }
  }

  familias[cfg.pagina] = {
    titulo: cfg.titulo,
    fonte: `${BASE}/${cfg.pagina}`,
    ficha: fichaDaPagina(textoDe(html)),
    ambiente: ambienteDaFamilia,
    skus: daPagina.length,
  };
  console.log(`${cfg.pagina}: ${daPagina.length} SKUs, ${[...casados.values()].filter((c) => c.pagina === cfg.pagina).length} casados, ${ambienteDaFamilia.length} fotos de ambiente`);
}

// ── baixa e grava ─────────────────────────────────────────────────────
async function baixar(url, destino) {
  if (fs.existsSync(destino) && fs.statSync(destino).size > 10_000) return;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`${url}: imagem suspeita (${buf.length} bytes)`);
  fs.writeFileSync(destino, buf);
}
const extensao = (u) => (u.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase();

const fila = [];
for (const s of skus) {
  const c = casados.get(s.sku);
  if (!c) continue;
  const resto = restoDoNome(s.nome);
  const slug = resto.join('-');
  const registro = {
    sku: s.sku,
    slugLoja: s.slug,
    slug,
    nomeErp: s.nome,
    pagina: c.pagina,
    textura: c.textura,
    ambiente: c.ambiente,
    casadoAMao: CASADOS_A_MAO[s.sku]?.motivo ?? null,
    fonte: `${BASE}/${c.pagina}`,
  };
  fs.writeFileSync(path.join(DATA_DIR, `${slug}.json`), JSON.stringify(registro, null, 2) + '\n');
  if (c.textura) fila.push([c.textura, path.join(ORIG_DIR, `${slug}--textura.${extensao(c.textura)}`)]);
  c.ambiente.forEach((u, i) => fila.push([u, path.join(ORIG_DIR, `${slug}--ambiente-${i + 1}.${extensao(u)}`)]));
}
for (const [pagina, f] of Object.entries(familias)) {
  f.ambiente.forEach((u, i) => fila.push([u, path.join(ORIG_DIR, `_familia--${pagina}--${i + 1}.${extensao(u)}`)]));
}

if (!semBaixar) {
  let feitos = 0;
  const trabalhadores = Array.from({ length: 4 }, async () => {
    while (fila.length) {
      const [url, destino] = fila.shift();
      try {
        await baixar(url, destino);
        feitos++;
      } catch (e) {
        const copia = COPIA_DA_PAGINA.get(url);
        try {
          if (!copia) throw e;
          await baixar(copia, destino);
          feitos++;
        } catch (e2) {
          console.error('FALHA', e2.message);
        }
      }
    }
  });
  await Promise.all(trabalhadores);
  console.log(`imagens baixadas/em cache: ${feitos}`);
}

const semFoto = skus
  .filter((s) => !casados.get(s.sku)?.textura && !casados.get(s.sku)?.ambiente.length)
  .map((s) => ({ sku: s.sku, nome: s.nome }));
fs.writeFileSync(path.join(DATA_DIR, '_familias.json'), JSON.stringify(familias, null, 2) + '\n');
fs.writeFileSync(
  path.join(DATA_DIR, '_relatorio.json'),
  JSON.stringify({ geradoEm: new Date().toISOString(), casados: casados.size, semFoto, arquivosSemCadastro: sobras }, null, 2) + '\n'
);
console.log(`casados: ${casados.size} de ${skus.length} · sem foto: ${semFoto.length} · arquivos sem cadastro: ${sobras.length}`);
