// Submete URLs do sitemap ao IndexNow (Bing/Yandex/etc) em lote.
// Uso: node scripts/submit-indexnow.mjs [filtro]
//   node scripts/submit-indexnow.mjs /wrap/   -> só URLs de cor
//   node scripts/submit-indexnow.mjs          -> sitemap inteiro
// Rodar APÓS o deploy (as URLs precisam responder 200 no ar).

const SITE = 'https://www.nzgroup.com.br';
const KEY = 'a3f8c1d94b7e42068f5a9c2d1e6b3a70';
const filter = process.argv[2] || '';

const res = await fetch(`${SITE}/sitemap.xml`);
if (!res.ok) throw new Error(`sitemap.xml respondeu ${res.status}`);
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes(filter));
if (urls.length === 0) throw new Error('Nenhuma URL casou com o filtro.');
console.log(`${urls.length} URLs para submeter (filtro: "${filter || 'nenhum'}")`);

// IndexNow aceita até 10.000 URLs por POST — 1 lote basta
const body = { host: 'www.nzgroup.com.br', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls };
const post = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow respondeu: ${post.status} ${post.statusText}`);
