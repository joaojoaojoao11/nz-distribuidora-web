#!/usr/bin/env node
/**
 * drive-cores.mjs — pastas de cor do Drive (CORES SPEEDWRAP), sem OAuth.
 *
 * A pasta raiz está compartilhada como "qualquer pessoa com o link", então dá
 * para listar (embeddedfolderview) e baixar (uc?export=download) sem token.
 * Se a pasta virar restrita, este script para de funcionar.
 *
 *   node scripts/drive-cores.mjs status          lista as pastas de cor que têm foto
 *   node scripts/drive-cores.mjs baixar EDG-020  baixa as fotos da amostra dessa cor
 *
 * As fotos vão para a pasta de amostras da Cledna (CLEDNA.md §1):
 *   ~/OneDrive/Área de Trabalho/AUTOMAÇÕES/NZMARKETING - CLEDNA/_AMOSTRAS/<COD>/
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ_DRIVE, listar, lerLinha, sleep } from './lib/drive.mjs';

const AMOSTRAS = path.join(os.homedir(), 'OneDrive', 'Área de Trabalho', 'AUTOMAÇÕES',
  'NZMARKETING - CLEDNA', '_AMOSTRAS');

/** Todas as pastas de cor: [{ linha, cor, id, fotos: [{id, nome, mod}] }] */
async function varrer(filtroCodigo) {
  const res = [];
  for (const linha of (await listar(RAIZ_DRIVE)).filter((e) => e.pasta)) {
    // O nome da linha leva o progresso na frente ("FALTA 96% · EBP - ..."): o
    // código sai por regex, não pelos 3 primeiros caracteres.
    const cod = lerLinha(linha.nome)?.codigo;
    if (filtroCodigo && (!cod || !filtroCodigo.startsWith(cod))) continue;
    for (const cor of (await listar(linha.id)).filter((e) => e.pasta)) {
      // A marca de status vem ANTES do código ("🟢 EDG-020 ...", "✅ ..."): procura o
      // código como palavra, não como prefixo.
      if (filtroCodigo && !new RegExp(`(^|\\s)${filtroCodigo}(\\s|$)`).test(cor.nome)) continue;
      await sleep(120);
      const fotos = (await listar(cor.id)).filter((e) => !e.pasta && /\.(jpe?g|png|heic|webp)$/i.test(e.nome));
      res.push({ linha: linha.nome, cor: cor.nome, id: cor.id, fotos });
    }
  }
  return res;
}

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'status') {
  const todas = await varrer();
  const com = todas.filter((c) => c.fotos.length);
  console.log(`${todas.length} pastas de cor · ${com.length} com foto\n`);
  for (const c of com) console.log(`${c.cor.padEnd(40)} ${c.fotos.length} foto(s)`);
} else if (cmd === 'baixar' && arg) {
  const cod = arg.toUpperCase();
  const [cor] = await varrer(cod);
  if (!cor) { console.error(`não achei a pasta ${cod} no Drive`); process.exit(1); }
  if (!cor.fotos.length) { console.error(`${cor.cor}: pasta sem foto`); process.exit(1); }
  const dir = path.join(AMOSTRAS, cod);
  mkdirSync(dir, { recursive: true });
  for (const f of cor.fotos) {
    const dest = path.join(dir, f.nome);
    if (existsSync(dest)) continue;
    const r = await fetch(`https://drive.google.com/uc?export=download&id=${f.id}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  }
  console.log(`${cor.cor}: ${cor.fotos.length} foto(s) em ${dir}`);
} else {
  console.log('uso: node scripts/drive-cores.mjs status | baixar <COD>');
}
