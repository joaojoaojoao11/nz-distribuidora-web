// Linhas cuja página mostra os anúncios da NZSTORE (pedido do João em
// 01/11/2026: "não ter outras páginas de produtos que não são da loja").
//
// Três efeitos, todos daqui:
// - a página antiga de cada item responde 308 para o anúncio dela na loja (ou
//   para a página da linha, quando o item não está à venda);
// - o anúncio deixa de apontar o canonical para a página antiga;
// - o sitemap lista os anúncios dessas linhas no lugar das páginas antigas.
//
// O app tem o espelho em src/lib/shop/vitrineLinhas.ts (o edge runtime não
// importa de src/): as duas listas andam juntas.

export interface VitrineLinha {
  /** linha_key da loja. */
  linha: string;
  /** Página da linha, destino de quem chega num item sem anúncio. */
  pagina: string;
  /** Prefixo das páginas antigas de item (sem ele, a linha só tinha o painel ?cor=). */
  item?: string;
}

export const VITRINES: VitrineLinha[] = [
  { linha: 'm7', pagina: '/sign/metamark-7-series' },
  { linha: 'mcx', pagina: '/wrap/metamark-mcx' },
  { linha: 'sh-wrapping', pagina: '/wrap/sh-colors', item: '/wrap/sh-colors/' },
  { linha: 'oracal-651', pagina: '/sign/oracal-651', item: '/sign/oracal-651/' },
  { linha: 'oracal-670', pagina: '/wrap/oracal-670ra', item: '/wrap/oracal-670ra/' },
  { linha: 'sh-decor', pagina: '/decor/sh', item: '/decor/sh/' },
  { linha: 'etherna', pagina: '/decor/etherna', item: '/decor/etherna/' },
  { linha: 'imprimax', pagina: '/decor/imprimax', item: '/decor/imprimax/' },
];

/** Páginas de linha com o painel antigo ?cor=<slug>. */
const PAINEL_COR: Record<string, string> = {
  '/sign/metamark-7-series': 'm7',
  '/wrap/metamark-7-series': 'm7',
  '/wrap/metamark-mcx': 'mcx',
};

/**
 * Caminho antigo que não é mais página: o painel ?cor= ou a página de item de
 * uma linha da vitrine. O anúncio que aponta para ele é canônico de si mesmo.
 */
export function ehCaminhoAntigoDaVitrine(caminho: string): boolean {
  const c = caminho.toLowerCase();
  if (c.includes('?')) return true;
  // A 651 morou em /wrap antes de ir para /sign; o banco guarda o endereço antigo.
  if (c.startsWith('/wrap/oracal-651/')) return true;
  return VITRINES.some((v) => v.item && c.startsWith(v.item));
}

/** Endereços antigos que o banco pode ter guardado para este item. */
function candidatos(v: VitrineLinha, slug: string): string[] {
  const lista = [`${v.item}${slug}`];
  if (v.linha === 'oracal-651') lista.push(`/wrap/oracal-651/${slug}`);
  return lista;
}

async function buscarAnuncio(filtro: string): Promise<string | null | undefined> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return undefined;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/loja_catalogo?${filtro}&pai_slug=is.null&select=slug&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return undefined;
    const rows = (await res.json()) as { slug: string }[];
    return rows[0]?.slug ?? null;
  } catch {
    return undefined;
  }
}

/**
 * Para onde vai uma página antiga de item (ou um ?cor= do painel). `null` =
 * não é página antiga. Banco fora do ar também devolve `null`: um 308 é
 * guardado pelo navegador, e mandar para a página da linha por uma falha
 * passageira perderia o item de vez. Nesse caso o app faz o desvio.
 */
export async function destinoDaVitrine(pathname: string, cor: string | null): Promise<string | null> {
  const path = pathname.replace(/\/+$/, '').toLowerCase();

  const linhaDoPainel = PAINEL_COR[path];
  if (linhaDoPainel && cor) {
    const slug = cor.toLowerCase();
    const achado = await buscarAnuncio(
      `linha_key=eq.${linhaDoPainel}&slug=eq.${encodeURIComponent(slug)}`,
    );
    if (achado === undefined) return null;
    const pagina = VITRINES.find((v) => v.linha === linhaDoPainel)!.pagina;
    return achado ? `/loja/${achado}` : pagina;
  }

  for (const v of VITRINES) {
    if (!v.item || !path.startsWith(v.item)) continue;
    const slug = path.slice(v.item.length);
    if (!slug || slug.includes('/')) return v.pagina;
    const ou = [
      `legacy_path.in.(${candidatos(v, slug).map((c) => `"${c}"`).join(',')})`,
      // A Imprimax nunca teve legacy_path: o anúncio é sempre imprimax-<slug>.
      ...(v.linha === 'imprimax' ? [`slug.eq.imprimax-${slug}`] : []),
    ];
    const achado = await buscarAnuncio(
      `linha_key=eq.${v.linha}&or=${encodeURIComponent(`(${ou.join(',')})`)}`,
    );
    if (achado === undefined) return null;
    return achado ? `/loja/${achado}` : v.pagina;
  }
  return null;
}
