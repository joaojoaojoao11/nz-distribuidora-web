/**
 * Leitura da pasta CORES SPEEDWRAP do Drive, sem OAuth.
 *
 * A pasta raiz está compartilhada como "qualquer pessoa com o link", então dá
 * para listar (embeddedfolderview) e baixar (uc?export=download) sem token.
 * Se a pasta virar restrita, isto para de funcionar.
 *
 * Os NOMES das pastas carregam marcações que mudam com o trabalho:
 *   - linha: "FALTA 96% · EBP - BODY PROTECT" (progresso, ver painel-cores.mjs)
 *   - cor:   "🟢 EDG-020 ..." (amostra nova) / "✅ ESG-001 ..." (no site)
 * Por isso o código sai sempre por regex, nunca pela posição no nome.
 */

export const RAIZ_DRIVE = '1ncYxSSoIwUObmmsOslIVvPs1D6sMwOlm'; // CORES SPEEDWRAP

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Itens de uma pasta: [{ id, pasta, nome, mod }] */
export async function listar(id, tentativa = 0) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (r.status !== 200) {
    if (tentativa < 3) { await sleep(2000 * (tentativa + 1)); return listar(id, tentativa + 1); }
    throw new Error(`pasta ${id}: HTTP ${r.status}`);
  }
  const html = await r.text();
  const re = /<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?flip-entry-title">([^<]*)<[\s\S]*?flip-entry-last-modified"><div>([^<]*)</g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push({ id: m[1], pasta: m[2].includes('/folders/'), nome: m[3].replace(/&amp;/g, '&'), mod: m[4] });
  }
  return out;
}

/** "FALTA 96% · EBP - BODY PROTECT" → { codigo: 'EBP', nome: 'EBP - BODY PROTECT' } */
export function lerLinha(nome) {
  const m = nome.match(/\b([A-Z]{3}) - (.+)$/);
  return m ? { codigo: m[1], nome: `${m[1]} - ${m[2].trim()}` } : null;
}

/** "✅ ESG-001 PIANO BLACK" → { codigo: 'ESG-001', sku: 'SPWESG001', publicada: true } */
export function lerCor(nome) {
  const m = nome.match(/\b([A-Z]{3})-(\d{3})\b/);
  if (!m) return null;
  return { codigo: `${m[1]}-${m[2]}`, sku: `SPW${m[1]}${m[2]}`, publicada: nome.includes('✅') };
}

export { sleep };
