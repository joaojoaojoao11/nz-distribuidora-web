// GET/POST /api/nz/geo — de onde o visitante está acessando.
//
// Por que existe: o painel do admin tem um mapa de acessos que nunca funcionou.
// O front chamava `https://ip-api.com/json/` direto do navegador, e o plano
// gratuito do ip-api **não atende HTTPS** — devolve 403. Resultado: 17.004
// eventos gravados, ZERO com país ou coordenada.
//
// A saída não é trocar de serviço pago: a Vercel já manda a geolocalização do
// visitante nos cabeçalhos da requisição, de graça e sem chave. Sai mais barato,
// sai mais rápido (não tem ida a terceiro) e é mais privado — o IP do visitante
// deixa de ser enviado para fora.
//
// O front chama isto UMA vez por sessão e guarda em sessionStorage; os eventos
// seguintes reaproveitam. Resposta `no-store`: é dado de quem perguntou, não
// pode ficar no cache da CDN e servir a cidade de um visitante para outro.

import type { VercelRequest, VercelResponse } from '@vercel/node';

function cabecalho(req: VercelRequest, nome: string): string {
  const v = req.headers[nome];
  const bruto = Array.isArray(v) ? v[0] : v;
  if (!bruto) return '';
  // A Vercel manda a cidade percent-encoded ("S%C3%A3o%20Paulo").
  try {
    return decodeURIComponent(bruto).trim();
  } catch {
    return bruto.trim();
  }
}

function numero(bruto: string): number | null {
  if (!bruto) return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
}

/** "BR" → "Brasil". Cai no próprio código se o ICU não conhecer. */
function nomeDoPais(sigla: string): string {
  if (!/^[A-Za-z]{2}$/.test(sigla)) return sigla;
  const codigo = sigla.toUpperCase();
  try {
    const nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region', fallback: 'code' });
    const nome = nomes.of(codigo);
    // "ZZ" é um código VÁLIDO que significa "região desconhecida", então o
    // `fallback` não pega: o CLDR tem tradução para ele. Qualquer sigla que
    // resolva para o mesmo texto de ZZ não é país nenhum — melhor mostrar o
    // código cru no mapa do que a frase "Região desconhecida".
    if (!nome || nome === nomes.of('ZZ')) return codigo;
    return nome;
  } catch {
    return codigo;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const sigla = cabecalho(req, 'x-vercel-ip-country');
  const cidade = cabecalho(req, 'x-vercel-ip-city');
  const regiao = cabecalho(req, 'x-vercel-ip-country-region');
  const latitude = numero(cabecalho(req, 'x-vercel-ip-latitude'));
  const longitude = numero(cabecalho(req, 'x-vercel-ip-longitude'));

  // Sem cabeçalho não há o que inventar: em `npm run dev` e em requisição de
  // rede interna eles não existem. O front simplesmente não grava geo.
  if (!sigla && latitude == null) {
    res.status(200).json({ disponivel: false });
    return;
  }

  res.status(200).json({
    disponivel: true,
    country: sigla ? nomeDoPais(sigla) : null,
    countryCode: sigla || null,
    city: cidade || null,
    region: regiao || null,
    latitude,
    longitude,
  });
}
