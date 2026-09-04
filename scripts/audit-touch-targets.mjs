// Auditoria de alvos de toque da LOJA.
//
// Regra: todo elemento interativo com menos de 44×44px (Apple HIG; Material
// pede 48) é listado, junto com a distância ao vizinho interativo mais
// próximo. WCAG 2.5.8 aceita 24px quando há 24px de espaçamento — a tabela dá
// os dois números para decidir caso a caso.
//
// Sem Playwright instalado (é o caso do projeto), o script imprime o snippet
// para colar no console do DevTools em modo dispositivo. Com Playwright
// (`npm i -D playwright` + `npx playwright install chromium`), roda sozinho
// contra uma URL em viewport 390×844 e falha (exit 1) se sobrar alvo abaixo
// do mínimo fora das exceções.
//
// Uso:
//   npm run loja:alvos                      → imprime o snippet
//   npm run loja:alvos -- http://localhost:5173/loja   → roda com Playwright, se houver

const URL_ALVO = process.argv[2];

/** Alvos aceitos abaixo de 44px: texto corrido com padding (cobrem WCAG via espaçamento). */
const EXCECOES = ['breadcrumb', 'selecaoVerTudo', 'back', 'copyHex', 'closeBtn', 'clearLink'];

// O mesmo código roda no navegador (Playwright) ou é impresso para o console.
const SNIPPET = String.raw`(() => {
  const MIN = 44, GAP = 8;
  const sel = 'a,button,input,select,[role=button]';
  const els = [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length && el.offsetParent !== null);
  const rects = els.map((el) => el.getBoundingClientRect());
  const nome = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
  const dist = (a, b) => {
    const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
    const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
    return Math.hypot(dx, dy);
  };
  const rows = [];
  els.forEach((el, i) => {
    const r = rects[i];
    // Área REAL de toque: padding e ::before expandido contam. Testa os 4
    // cantos a 20px do centro — se todos caem no próprio elemento, ele tem
    // pelo menos 40px de toque mesmo que a caixa visual seja menor.
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cantos = [[-20, -20], [20, -20], [-20, 20], [20, 20]];
    const toqueOk = cantos.every(([dx, dy]) => { const t = document.elementFromPoint(cx + dx, cy + dy); return t === el || el.contains(t); });
    if (r.width >= MIN && r.height >= MIN) return;
    if (toqueOk) return;
    let vizinho = Infinity, quem = '';
    els.forEach((o, j) => { if (j !== i) { const d = dist(r, rects[j]); if (d < vizinho) { vizinho = d; quem = nome(o); } } });
    rows.push({ alvo: nome(el), cls: String(el.className).split(' ')[0], w: +r.width.toFixed(1), h: +r.height.toFixed(1), vizinhoPx: vizinho === Infinity ? null : +vizinho.toFixed(1), vizinho: quem, ok24: r.width >= 24 && r.height >= 24 && vizinho >= GAP });
  });
  console.table(rows);
  window.$alvos = rows;
  return rows;
})()`;

async function main() {
  if (!URL_ALVO) {
    console.log('Sem URL: cole o snippet abaixo no console do DevTools (modo dispositivo, 390×844):\n');
    console.log(SNIPPET);
    console.log('\nLinhas com ok24=false são alvos que falham até o mínimo legal (24px + 8 de folga).');
    console.log(`Exceções aceitas (texto corrido com padding): ${EXCECOES.join(', ')}.`);
    return;
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright não instalado. `npm i -D playwright && npx playwright install chromium`, ou rode sem URL para obter o snippet.');
    process.exit(2);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(URL_ALVO, { waitUntil: 'networkidle' });
  const rows = await page.evaluate(SNIPPET);
  await browser.close();

  const falhas = rows.filter((r) => !EXCECOES.some((e) => String(r.cls).includes(e)));
  console.table(rows);
  console.log(`\n${rows.length} alvo(s) abaixo de 44px, ${falhas.length} fora das exceções.`);
  process.exit(falhas.length ? 1 : 0);
}

main();
