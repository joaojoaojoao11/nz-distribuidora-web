// Autoteste da medição de acesso — sem rede, sem navegador.
//
// Duas coisas que já deram errado em produção e não podem voltar:
//
//   1. **A geolocalização.** O front chamava `ip-api.com` direto do navegador;
//      o plano gratuito não atende HTTPS e devolvia 403 em toda visita. Foram
//      17.004 eventos gravados sem um único país. Agora quem responde é
//      `/api/nz/geo`, lendo os cabeçalhos da Vercel — e este teste garante que
//      ele decodifica a cidade, traduz o país e nunca quebra quando o cabeçalho
//      falta ou vem torto.
//   2. **O `no-store`.** A resposta é a localização de QUEM PERGUNTOU. Se
//      escapar para o cache da CDN, um visitante recebe a cidade de outro.
//
// Uso: npm run analytics:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-analytics-'));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const build = spawnSync(
  process.execPath,
  [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'api/_lib/handlers/geo.ts', `--outdir=${outDir}`, '--format=esm', '--platform=node', '--log-level=error'],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const { default: geo } = await import(pathToFileURL(join(outDir, 'geo.js')).href);

/** Dublê mínimo do VercelResponse. */
function resposta() {
  const r = { code: 0, corpo: null, cabecalhos: {} };
  r.setHeader = (k, v) => {
    r.cabecalhos[k] = v;
  };
  r.status = (c) => {
    r.code = c;
    return r;
  };
  r.json = (j) => {
    r.corpo = j;
    return r;
  };
  return r;
}

const chamar = async (headers) => {
  const r = resposta();
  await geo({ headers }, r);
  return r;
};

// ============================================================ o caminho feliz
console.log('\n=== GEOLOCALIZAÇÃO PELOS CABEÇALHOS DA VERCEL ===');
{
  // Exatamente como a Vercel manda: cidade percent-encoded, país em sigla.
  const r = await chamar({
    'x-vercel-ip-country': 'BR',
    'x-vercel-ip-city': 'S%C3%A3o%20Paulo',
    'x-vercel-ip-country-region': 'SP',
    'x-vercel-ip-latitude': '-23.5505',
    'x-vercel-ip-longitude': '-46.6333',
  });
  ok('responde 200', r.code === 200);
  ok('diz que tem geo', r.corpo.disponivel === true);
  ok('decodifica a cidade', r.corpo.city === 'São Paulo', r.corpo.city);
  ok('traduz o país para português', r.corpo.country === 'Brasil', r.corpo.country);
  ok('guarda a sigla também', r.corpo.countryCode === 'BR');
  ok('a região vem junto', r.corpo.region === 'SP');
  ok('latitude vira número', r.corpo.latitude === -23.5505, `${typeof r.corpo.latitude}`);
  ok('longitude vira número', r.corpo.longitude === -46.6333);
}

{
  const r = await chamar({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-city': 'New%20York', 'x-vercel-ip-latitude': '40.7128', 'x-vercel-ip-longitude': '-74.0060' });
  ok('país estrangeiro também traduz', r.corpo.country === 'Estados Unidos', r.corpo.country);
}

// ================================================= o que NÃO pode derrubar
console.log('\n=== O QUE NÃO PODE DERRUBAR ===');
{
  // `npm run dev` e chamada interna não têm cabeçalho nenhum.
  const r = await chamar({});
  ok('sem cabeçalho responde 200, não erro', r.code === 200);
  ok('e diz que não tem geo', r.corpo.disponivel === false);
  ok('sem inventar coordenada', r.corpo.latitude === undefined);
}

{
  const r = await chamar({ 'x-vercel-ip-country': 'BR', 'x-vercel-ip-city': 'Bel%E9m', 'x-vercel-ip-latitude': 'nao-e-numero' });
  ok('cidade mal codificada não quebra', r.code === 200 && r.corpo.disponivel === true);
  ok('e a coordenada inválida vira nulo', r.corpo.latitude === null, `${r.corpo.latitude}`);
}

{
  const r = await chamar({ 'x-vercel-ip-country': 'ZZ' });
  // Cai na própria sigla; "Região desconhecida" viraria nome de país no mapa.
  ok('sigla desconhecida cai na sigla', r.corpo.country === 'ZZ', r.corpo.country);
}

{
  // Cabeçalho repetido chega como array.
  const r = await chamar({ 'x-vercel-ip-country': ['BR', 'US'], 'x-vercel-ip-latitude': ['-23.5', '0'] });
  ok('cabeçalho repetido usa o primeiro', r.corpo.countryCode === 'BR' && r.corpo.latitude === -23.5);
}

// ======================================================== privacidade e cache
console.log('\n=== PRIVACIDADE ===');
for (const [nome, headers] of [
  ['com geo', { 'x-vercel-ip-country': 'BR', 'x-vercel-ip-latitude': '-23.5' }],
  ['sem geo', {}],
]) {
  const r = await chamar(headers);
  ok(`${nome}: resposta é no-store`, r.cabecalhos['Cache-Control'] === 'no-store', r.cabecalhos['Cache-Control']);
}

{
  const r = await chamar({ 'x-vercel-ip-country': 'BR', 'x-forwarded-for': '200.1.2.3', 'x-real-ip': '200.1.2.3' });
  ok('o IP do visitante NÃO volta na resposta', !JSON.stringify(r.corpo).includes('200.1.2.3'));
}

// ============================================ o front não fala mais com ip-api
console.log('\n=== O FRONT NÃO CHAMA MAIS TERCEIRO ===');
const hook = readFileSync(join(ROOT, 'src/hooks/useAnalytics.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
ok('nenhuma chamada a ip-api no código', !/ip-api\.com/.test(hook));
ok('nenhum fetch para fora do domínio', !/fetch\(\s*['"`]https?:\/\//.test(hook.replace(/\$\{supabaseUrl\}/g, '')));
ok('usa a rota própria /api/nz/geo', hook.includes('/api/nz/geo'));
ok('guarda em sessionStorage (uma chamada por sessão)', hook.includes('sessionStorage') && hook.includes('CHAVE_GEO'));

// ======================================== a rota está registrada no roteador
const rotas = readFileSync(join(ROOT, 'api/nz/[acao].ts'), 'utf8');
ok('a ação `geo` está no roteador', /^\s*geo,\s*$/m.test(rotas));
ok('e sem criar arquivo de função novo (limite do Hobby)', rotas.includes("from '../_lib/handlers/geo.js'"));

// ============================================== o menu do admin pode rolar
console.log('\n=== MENU DO ADMIN ROLA ===');
const css = readFileSync(join(ROOT, 'src/pages/Admin/Admin.module.css'), 'utf8');
const bloco = /\.sidebarNav\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
ok('o nav tem overflow-y', /overflow-y:\s*auto/.test(bloco), bloco.trim().slice(0, 60));
// Sem `min-height: 0` o item de flex não encolhe abaixo do conteúdo e o
// overflow nunca vale — é o detalhe que fazia o menu vazar da barra fixa.
ok('e min-height: 0 (senão o overflow não vale)', /min-height:\s*0/.test(bloco));
ok('o rodapé não encolhe', /\.sidebarFooter\s*\{[^}]*flex:\s*0 0 auto/.test(css));
ok('o logo não encolhe', /\.sidebarLogo\s*\{[^}]*flex:\s*0 0 auto/.test(css));

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo certo'}`);
process.exit(falhas ? 1 : 0);
