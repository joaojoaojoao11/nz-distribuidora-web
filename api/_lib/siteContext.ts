// Contexto real da NZ Distribuidora para injetar no prompt do Motor SEO IA.
// Objetivo: a IA não "alucina" produtos e fala só do que a NZ realmente vende.
// Mantido como texto cru para economizar tokens.

export const NZ_PPF_LINES = `
LINHAS OFICIAIS NZPPF (PPF = Paint Protection Film):
- NZPPF LUXURY GLOSS: 190μm (micras) de espessura, garantia de 12 ANOS. Top de linha.
- NZPPF PRIME GLOSS: 190μm, garantia de 10 ANOS. Premium intermediário.
- NZPPF FLOW GLOSS: 175μm, garantia de 4 ANOS. Linha intermediária.
- NZPPF CORE GLOSS: 175μm, garantia de 3 ANOS. Entrada / volume.
- NZ PPF HEADLIGHT: aplicação em faróis, garantia de 10 ANOS.
- NZ PPF WINDSHIELD: aplicação em para-brisas, 190μm, garantia de 2 ANOS.

NUNCA invente outros modelos de PPF que não estes 6. Nunca troque as micragens
nem os anos de garantia. Se precisar citar um modelo, use o nome exato acima.
`.trim();

export const NZ_WRAP_LINES = `
LINHAS OFICIAIS NZWRAP (envelopamento automotivo premium):
- NZWRAP PREMIUM: linha própria da NZ (SKUs NZW2xx), acabamentos sólido brilhante,
  metálico brilhante, metálico fosco, camaleão. Exemplos: Ferrari Metallic Red,
  Stuttgart Sport Grey, Alpine Sport Grey, Luxury British Pink, Mystic Teal.
- SH WRAPPING COLORS: linha parceira, acabamentos variados.

CATÁLOGO ORACAL 651: 62 cores em pronta entrega de vinil adesivo (não é
envelopamento automotivo), finish Gloss, SKUs numerados (010 White, 020 Golden
Yellow, 070 Black, etc.). Uso principal: comunicação visual, recorte, fachada,
frota. Não confundir com PPF nem com NZWRAP Premium.

CATÁLOGO ORACAL 670RA: 24 cores premium com tecnologia RapidAir (aplicação sem
bolhas), uso em frota e envelopamento comercial.
`.trim();

export const NZ_LOCAL = `
LOCALIZAÇÃO E ATENDIMENTO:
- Sede/centro de distribuição: R. Brasilândia, 366 — Chácaras Marco, Barueri-SP,
  CEP 06419-060 (região de Alphaville, Grande São Paulo).
- Atende instaladores de todo o Brasil com envio nacional; foco comercial em
  São Paulo capital e Grande SP (Barueri, Alphaville, Osasco, Guarulhos, ABC).
- Contato: WhatsApp comercial no site www.nzgroup.com.br.
`.trim();

export const NZ_WARRANTY_RULES = `
REGRAS DE GARANTIA (sempre respeite):
- A garantia é concedida pela NZ mediante cadastro da apólice no sistema (QR code
  do instalador credenciado).
- Cada linha PPF tem prazo próprio (ver lista acima).
- Só instaladores credenciados pela NZ emitem a apólice oficial.
- A NZ NÃO garante aplicações feitas por instaladores não credenciados.
`.trim();

export const NZ_BUSINESS_POSITIONING = `
POSICIONAMENTO DA NZ DISTRIBUIDORA:
- É a maior distribuidora ATACADISTA de PPF e vinis automotivos premium do Brasil.
- O cliente principal do blog é o INSTALADOR profissional (B2B), em especial
  estéticas automotivas de São Paulo capital e Grande SP.
- O cliente final (dono do carro) lê também — então o conteúdo precisa ser
  técnico o suficiente pro instalador e compreensível pro apaixonado.
- CTA padrão: o instalador comprar direto da NZ e se credenciar; o dono do carro
  procurar uma estética parceira NZ na cidade dele.
- NÃO fazer promessa de preço, não citar concorrentes pelo nome, não chamar
  nenhuma marca de "pior" ou "inferior".
`.trim();

export function buildSiteContext(): string {
  return [
    NZ_BUSINESS_POSITIONING,
    NZ_PPF_LINES,
    NZ_WRAP_LINES,
    NZ_WARRANTY_RULES,
    NZ_LOCAL,
  ].join('\n\n');
}
