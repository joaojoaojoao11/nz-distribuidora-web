// Reprodução de toques imprecisos na loja, em emulação de celular (iPhone 14 e
// Pixel 7). Para cada alvo, toca no centro e a 16px em cada direção e registra o
// que aconteceu: abriu o que devia, aplicou filtro, ou NAVEGOU para outra rota.
//
// Foi este roteiro que achou o bug real de 2026-09-05: os links dos dropdowns da
// navbar, invisíveis no celular (overlay com opacity 0), continuavam tocáveis por
// cima da barra de busca — tocar em FILTROS abria /wrap/metamark-7-series.
// Auditoria estática de tamanho não pega isso; só o toque de verdade pega.
//
// Requer Playwright (não é dependência do projeto):
//   npm i -D playwright && npx playwright install chromium
// Uso:
//   npm run loja:toque                          → contra https://www.nzgroup.com.br
//   npm run loja:toque -- http://localhost:4173 → contra `vite preview`
//
// Leitura do resultado: "NAVEGOU" só é aceitável em alvos que SÃO links (logo,
// breadcrumb). Em botão, campo ou opção de filtro, é bug.

let chromium, devices;
try {
  ({ chromium, devices } = await import('playwright'));
} catch {
  console.error('Playwright não instalado: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}
const BASE = process.argv[2] || 'https://www.nzgroup.com.br';
const OFF = [[0,0],[-16,0],[16,0],[0,-16],[0,16]];

const AUDIT = `(() => {
  const sel = 'a,button,input,select,[role=button]';
  const els = [...document.querySelectorAll(sel)].filter(el => el.getClientRects().length && el.offsetParent !== null);
  const rects = els.map(el => el.getBoundingClientRect());
  const nome = el => (el.getAttribute('aria-label') || el.textContent || el.querySelector('img')?.alt || '').trim().replace(/\s+/g,' ').slice(0,26);
  const dist = (a,b) => Math.hypot(Math.max(0, Math.max(a.left,b.left)-Math.min(a.right,b.right)), Math.max(0, Math.max(a.top,b.top)-Math.min(a.bottom,b.bottom)));
  const out = [];
  els.forEach((el,i) => {
    const r = rects[i]; if (r.width === 0 || r.height === 0) return;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const probe = [[-20,-20],[20,-20],[-20,20],[20,20]].map(([dx,dy]) => { const t = document.elementFromPoint(cx+dx, cy+dy); return t === el || el.contains(t); });
    const hit40 = probe.every(Boolean);
    let viz = Infinity, quem = '';
    els.forEach((o,j) => { if (j!==i) { const d = dist(r, rects[j]); if (d < viz) { viz = d; quem = nome(o); } } });
    const pequeno = r.width < 44 || r.height < 44;
    if (pequeno && !hit40) out.push({ alvo: nome(el), tag: el.tagName.toLowerCase(), href: el.getAttribute('href') || '', w: Math.round(r.width), h: Math.round(r.height), viz: Math.round(viz), vizinho: quem });
  });
  return out;
})()`;

const estado = async (page) => page.evaluate(() => ({
  url: location.pathname + location.search,
  modal: document.body.dataset.nzModal === '1',
  sheet: !!document.querySelector('[role=dialog][aria-label="Filtros"]'),
  menu: !!document.querySelector('[class*=linksOpen]'),
  paleta: !!document.querySelector('[role=dialog][aria-label="Busca no site"]'),
}));

async function abrir(page, path) {
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function toqueImpreciso(page, path, nome, sel, prep) {
  const linhas = [];
  for (const [dx, dy] of OFF) {
    await abrir(page, path);
    if (prep) await prep(page);
    const box = await page.locator(sel).first().boundingBox().catch(() => null);
    if (!box) { linhas.push(`${nome}: seletor não encontrado`); break; }
    const antes = await estado(page);
    await page.touchscreen.tap(box.x + box.width/2 + dx, box.y + box.height/2 + dy);
    await page.waitForTimeout(600);
    const depois = await estado(page);
    const efeito = depois.url !== antes.url ? (depois.url.split('?')[0] === antes.url.split('?')[0] ? `filtro/URL → ${depois.url}` : `NAVEGOU → ${depois.url}`) : depois.sheet && !antes.sheet ? 'abriu filtros' : depois.paleta && !antes.paleta ? 'abriu busca' : depois.menu && !antes.menu ? 'abriu menu' : 'nada';
    linhas.push(`  ${nome.padEnd(22)} ${String(dx).padStart(3)},${String(dy).padStart(3)}  ${efeito}`);
  }
  return linhas;
}

async function main() {
  for (const dev of ['iPhone 14', 'Pixel 7']) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ ...devices[dev], locale: 'pt-BR' });
    const page = await ctx.newPage();
    console.log(`\n================ ${dev} (${devices[dev].viewport.width}x${devices[dev].viewport.height}) ================`);

    await abrir(page, '/loja');
    console.log('--- /loja: alvos <44px SEM área expandida (dobra inicial) ---');
    console.table(await page.evaluate(AUDIT));
    await page.tap('button[aria-label="Buscar no site"]').catch(() => {});
    await page.waitForTimeout(600);
    console.log('--- busca aberta: alvos <44px ---');
    console.table(await page.evaluate(AUDIT));
    await abrir(page, '/loja/m7-108-imitation-gold');
    console.log('--- produto: alvos <44px ---');
    console.table(await page.evaluate(AUDIT));

    console.log('--- toques imprecisos: centro e 16px para cada lado ---');
    const testes = [
      ['/loja', 'lupa (navbar)', 'button[aria-label="Buscar no site"]'],
      ['/loja', 'hambúrguer', 'button[aria-label="Menu"]'],
      ['/loja', 'pílula NZSTORE', 'nav a[href="/loja"]'],
      ['/loja', 'logo NZ (→home)', 'nav a[href="/"]'],
      ['/loja', 'FILTROS', 'button[aria-label="Abrir filtros"]'],
      ['/loja', 'MONTAR SELEÇÃO', 'button:has-text("MONTAR SELEÇÃO")'],
      ['/loja', 'input de busca', 'input[aria-label="Buscar na loja"]'],
      ['/loja', 'breadcrumb NZ GROUP', 'header a[href="/"]'],
      ['/loja/m7-108-imitation-gold', 'breadcrumb LOJA', 'nav[aria-label="Trilha de navegação"] a[href="/loja"]'],
      ['/loja/m7-108-imitation-gold', 'VOLTAR', 'a:has-text("VOLTAR PARA A LOJA")'],
    ];
    for (const [path, nome, sel] of testes) for (const l of await toqueImpreciso(page, path, nome, sel)) console.log(l);

    const abrirBusca = async (p) => { await p.tap('button[aria-label="Buscar no site"]'); await p.waitForTimeout(600); };
    for (const l of await toqueImpreciso(page, '/loja', 'busca: 1º atalho', '[aria-label="Busca no site"] button[data-index="0"]', abrirBusca)) console.log(l);
    for (const l of await toqueImpreciso(page, '/loja', 'busca: campo', '[aria-label="Busca no site"] input', abrirBusca)) console.log(l);
    for (const l of await toqueImpreciso(page, '/loja', 'busca: ESC', '[aria-label="Busca no site"] button[aria-label="Fechar busca"]', abrirBusca)) console.log(l);
    const abrirFiltros = async (p) => { await p.tap('button[aria-label="Abrir filtros"]'); await p.waitForTimeout(450); };
    for (const l of await toqueImpreciso(page, '/loja', 'filtros: 1ª opção', '[role=dialog][aria-label="Filtros"] button[aria-pressed]', abrirFiltros)) console.log(l);

    await abrir(page, '/loja?cor=azul&acabamento=fosco');
    const chip = await page.locator('main button:has-text("✕")').first().boundingBox().catch(() => null);
    if (chip) {
      const antes = await estado(page);
      const x = chip.x + chip.width / 2, y = chip.y + chip.height / 2;
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 20, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(600);
      const depois = await estado(page);
      console.log(`  ${'chips: arrasto 20px'.padEnd(22)}          ${depois.url !== antes.url ? 'REMOVEU FILTRO → ' + depois.url : 'nada (correto)'}`);
    }
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
