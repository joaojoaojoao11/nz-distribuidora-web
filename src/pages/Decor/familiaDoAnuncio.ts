// Família de um anúncio Decor na NZSTORE, pelo catálogo da linha.
//
// O subtítulo do anúncio é a coleção ("Gold Bambu", "Avalon"); as páginas Decor
// filtram pela família do catálogo ("Madeira", "Tecido & Telado"), que tem a
// descrição e, na Imprimax, as fotos de ambiente. O anúncio acha o padrão pelo
// endereço antigo (legacy_path) ou pelo slug com o prefixo da linha.

import type { ShopItem } from '../../lib/shop/types';
import { normalizar } from '../Wrap/useAnunciosDaLinha';

interface Familia {
  slug: string;
  name: string;
}

interface Padrao {
  slug: string;
  family: string;
}

export function familiaPeloCatalogo(
  familias: Familia[],
  padroes: Padrao[],
  /** Endereço antigo do padrão: '/decor/etherna/'. */
  caminho: string,
  /** Prefixo do slug do anúncio: 'etherna-'. */
  prefixo: string,
) {
  const nome = new Map(familias.map((f) => [f.slug, f.name]));
  const porCaminho = new Map(padroes.map((p) => [`${caminho}${p.slug}`, p.family]));
  const porSlug = new Map(padroes.map((p) => [`${prefixo}${p.slug}`, p.family]));
  const porNome = new Map(familias.map((f) => [normalizar(f.name), f.name]));

  return (item: ShopItem): string | null => {
    const familia = porCaminho.get((item.legacyPath ?? '').toLowerCase()) ?? porSlug.get(item.slug);
    if (familia) return nome.get(familia) ?? null;
    // Anúncio criado no ERP, sem padrão no catálogo: vale o subtítulo se ele for o nome de uma família.
    return (item.subtitle && porNome.get(normalizar(item.subtitle))) || null;
  };
}
