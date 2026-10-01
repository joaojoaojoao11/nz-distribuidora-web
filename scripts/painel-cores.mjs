#!/usr/bin/env node
/**
 * painel-cores.mjs — quanto falta de cada linha Speed Wrapping para ir ao site.
 *
 * O total de cada linha é o número de pastas de cor no Drive (CORES SPEEDWRAP),
 * que espelha o catálogo físico. Uma cor conta como FEITA quando a página dela
 * na loja já tem as fotos de carro (capa + fotos em produto_midia, 3 mídias ou
 * mais) — é o banco do site que decide, não a marca ✅ da pasta. Divergência
 * entre os dois aparece no fim do relatório.
 *
 *   node scripts/painel-cores.mjs           tabela por linha + divergências
 *   node scripts/painel-cores.mjs --json    grava scripts/output/painel-cores.json
 *
 * O nome sugerido para cada pasta de linha ("FALTA 96% · EBP - BODY PROTECT")
 * sai na tabela; a renomeação é feita pelo conector do Drive (sem OAuth aqui).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ_DRIVE, listar, lerLinha, lerCor, sleep } from './lib/drive.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_MIDIAS = 3; // capa + ao menos 2 fotos de carro

function env() {
  const txt = readFileSync(path.join(RAIZ, '.env'), 'utf8');
  return Object.fromEntries(
    txt.split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
  );
}

async function produtosSite() {
  const e = env();
  const r = await fetch(`${e.VITE_SUPABASE_URL}/rest/v1/produtos?erp_sku=like.SPW*&select=erp_sku,slug,produto_midia(count)`, {
    headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!r.ok) throw new Error(`site ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const mapa = new Map();
  for (const p of await r.json()) mapa.set(p.erp_sku, { slug: p.slug, midias: p.produto_midia?.[0]?.count ?? 0 });
  return mapa;
}

export function nomePasta(linha, faltam, total) {
  if (!faltam) return `✅ COMPLETA · ${linha}`;
  return `FALTA ${Math.round((faltam / total) * 100)}% · ${linha}`;
}

const site = await produtosSite();
const linhas = [];
const divergencias = [];
for (const pasta of (await listar(RAIZ_DRIVE)).filter((x) => x.pasta)) {
  const l = lerLinha(pasta.nome);
  if (!l) { divergencias.push(`pasta de linha sem código: "${pasta.nome}"`); continue; }
  await sleep(150);
  const cores = [];
  for (const c of (await listar(pasta.id)).filter((x) => x.pasta)) {
    const cor = lerCor(c.nome);
    if (!cor) { divergencias.push(`${l.codigo}: pasta de cor sem código: "${c.nome}"`); continue; }
    const p = site.get(cor.sku);
    const feita = (p?.midias ?? 0) >= MIN_MIDIAS;
    if (!p) divergencias.push(`${cor.codigo}: sem produto no site (${cor.sku})`);
    if (feita && !cor.publicada) divergencias.push(`${cor.codigo}: no site com fotos, mas a pasta não tem ✅`);
    if (!feita && cor.publicada) divergencias.push(`${cor.codigo}: pasta com ✅, mas o site não tem as fotos`);
    cores.push({ codigo: cor.codigo, nome: c.nome.replace(/^[^A-Z]+/, ''), feita, slug: p?.slug ?? null });
  }
  cores.sort((a, b) => a.codigo.localeCompare(b.codigo));
  const total = cores.length;
  const feitas = cores.filter((c) => c.feita).length;
  const faltam = total - feitas;
  linhas.push({
    codigo: l.codigo, nome: l.nome, pasta_id: pasta.id, pasta_atual: pasta.nome,
    pasta_nova: nomePasta(l.nome, faltam, total),
    total, feitas, faltam, pct_falta: total ? Math.round((faltam / total) * 100) : 0, cores,
  });
}
linhas.sort((a, b) => a.codigo.localeCompare(b.codigo));

const T = linhas.reduce((s, l) => ({ total: s.total + l.total, feitas: s.feitas + l.feitas }), { total: 0, feitas: 0 });
const resumo = { atualizado_em: new Date().toISOString(), total: T.total, feitas: T.feitas, faltam: T.total - T.feitas,
  pct_falta: Math.round(((T.total - T.feitas) / T.total) * 100) };

if (process.argv.includes('--json')) {
  mkdirSync(path.join(RAIZ, 'scripts', 'output'), { recursive: true });
  const dest = path.join(RAIZ, 'scripts', 'output', 'painel-cores.json');
  writeFileSync(dest, JSON.stringify({ resumo, linhas, divergencias }, null, 1));
  console.log(`gravado ${path.relative(RAIZ, dest)}`);
}

// --db [--lote "8 (02/10): ESG-002, ..."]: um JSON por documento do banco do painel
// (Artifact "Painel Cores Speed"), para gravar com ArtifactData batch (file_path).
if (process.argv.includes('--db')) {
  const iLote = process.argv.indexOf('--lote');
  const dir = path.join(RAIZ, 'scripts', 'output', 'painel-db');
  mkdirSync(path.join(dir, 'linhas'), { recursive: true });
  writeFileSync(path.join(dir, 'resumo.json'), JSON.stringify({
    ...resumo, lote_tamanho: 10, divergencias,
    ...(iLote >= 0 ? { ultimo_lote: process.argv[iLote + 1] } : {}),
  }));
  for (const l of linhas) {
    const { pasta_id, pasta_atual, pasta_nova, ...doc } = l;
    writeFileSync(path.join(dir, 'linhas', `${l.codigo}.json`), JSON.stringify(doc));
  }
  console.log(`gravado ${path.relative(RAIZ, dir)} (resumo + ${linhas.length} linhas)`);
}

console.log(`\n${'linha'.padEnd(32)} ${'total'.padStart(5)} ${'feitas'.padStart(6)} ${'faltam'.padStart(6)} ${'falta'.padStart(6)}   pasta`);
for (const l of linhas) {
  const muda = l.pasta_atual === l.pasta_nova ? '' : `  ← renomear (hoje: "${l.pasta_atual}")`;
  console.log(`${l.nome.padEnd(32)} ${String(l.total).padStart(5)} ${String(l.feitas).padStart(6)} ${String(l.faltam).padStart(6)} ${(l.pct_falta + '%').padStart(6)}   ${l.pasta_nova}${muda}`);
}
console.log(`${'TOTAL'.padEnd(32)} ${String(resumo.total).padStart(5)} ${String(resumo.feitas).padStart(6)} ${String(resumo.faltam).padStart(6)} ${(resumo.pct_falta + '%').padStart(6)}`);
if (divergencias.length) {
  console.log(`\n${divergencias.length} divergência(s):`);
  for (const d of divergencias) console.log(`  - ${d}`);
}
