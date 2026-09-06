// Adapters das três fontes estáticas de cor: Metamark 7 Series (92),
// MetaCast MCX (37) e NZWRAP Premium (30).
//
// M7 e MCX são o motivo de a LOJA existir do ponto de vista de SEO: hoje essas
// 129 cores só existem como `?cor=<slug>` dentro do catálogo, sem página
// própria. Na LOJA cada uma vira uma entidade com URL — por isso `legacyPath`
// aponta para a query, e não para uma página de detalhe (que não existe).

import { M7_COLORS, M7_FAMILIES, type M7Family } from '../../data/metamark7Colors';
import { MCX_COLORS, MCX_FINISHES } from '../../data/metamarkMcxColors';
import { NZWRAP_COLORS } from '../../data/nzwrapColors';
import { MCX_CHIP_HEX } from '../generated/mcxChipHex';
import { resolveColor } from '../color/resolveColor';
import type { ColorFamilyId } from '../color/lexicon';
import { finishFromM7, finishFromMcx, normalizeFinishString } from '../finish/normalizeFinish';
import { buildSearchText, shopSlug, type ShopItem, type ShopSpec } from '../types';

/**
 * Fotos de rolo MetaCast MCX geradas por IA (Nano Banana 2, img2img a partir do
 * template METACAST MCX / METAMARK aprovado). Um webp 1600x1600 por slug — tubete
 * de papelão com paper label ORAFOL substituído por METAMARK "Premium Cast
 * Automotive Colour Wrap Films", logo METACAST MCX no canto superior esquerdo.
 *
 * Slug = mesmo `c.slug` da tabela MCX_COLORS (`mcx-51-miami-blue` etc.).
 * Convenção de arquivo: `public/assets/images/shop/metamark-mcx/{slug}.webp`.
 */
const MCX_ROLL_IMAGES: Record<string, string> = {
  'mcx-00-simply-white': '/assets/images/shop/metamark-mcx/mcx-00-simply-white.webp',
  'mcx-10-jet-black': '/assets/images/shop/metamark-mcx/mcx-10-jet-black.webp',
  'mcx-12-gotham-black': '/assets/images/shop/metamark-mcx/mcx-12-gotham-black.webp',
  'mcx-22-chalk-grey': '/assets/images/shop/metamark-mcx/mcx-22-chalk-grey.webp',
  'mcx-26-nardo-grey': '/assets/images/shop/metamark-mcx/mcx-26-nardo-grey.webp',
  'mcx-28-cafe-racer': '/assets/images/shop/metamark-mcx/mcx-28-cafe-racer.webp',
  'mcx-35-modena-yellow': '/assets/images/shop/metamark-mcx/mcx-35-modena-yellow.webp',
  'mcx-36-monza-yellow': '/assets/images/shop/metamark-mcx/mcx-36-monza-yellow.webp',
  'mcx-38-venturi-orange': '/assets/images/shop/metamark-mcx/mcx-38-venturi-orange.webp',
  'mcx-39-firefox': '/assets/images/shop/metamark-mcx/mcx-39-firefox.webp',
  'mcx-46-volcano-red': '/assets/images/shop/metamark-mcx/mcx-46-volcano-red.webp',
  'mcx-48-cooper-red': '/assets/images/shop/metamark-mcx/mcx-48-cooper-red.webp',
  'mcx-49-maranello-red': '/assets/images/shop/metamark-mcx/mcx-49-maranello-red.webp',
  'mcx-51-miami-blue': '/assets/images/shop/metamark-mcx/mcx-51-miami-blue.webp',
  'mcx-52-mexico-blue': '/assets/images/shop/metamark-mcx/mcx-52-mexico-blue.webp',
  'mcx-54-bavarian-blue': '/assets/images/shop/metamark-mcx/mcx-54-bavarian-blue.webp',
  'mcx-56-icon-blue': '/assets/images/shop/metamark-mcx/mcx-56-icon-blue.webp',
  'mcx-57-yacht-blue': '/assets/images/shop/metamark-mcx/mcx-57-yacht-blue.webp',
  'mcx-58-lapis-blue': '/assets/images/shop/metamark-mcx/mcx-58-lapis-blue.webp',
  'mcx-59-blue-abyss': '/assets/images/shop/metamark-mcx/mcx-59-blue-abyss.webp',
  'mcx-60-sub-lime': '/assets/images/shop/metamark-mcx/mcx-60-sub-lime.webp',
  'mcx-61-atomic-green': '/assets/images/shop/metamark-mcx/mcx-61-atomic-green.webp',
  'mcx-62-viper-green': '/assets/images/shop/metamark-mcx/mcx-62-viper-green.webp',
  'mcx-63-speed-green': '/assets/images/shop/metamark-mcx/mcx-63-speed-green.webp',
  'mcx-65-carbon-green': '/assets/images/shop/metamark-mcx/mcx-65-carbon-green.webp',
  'mcx-66-army-olive': '/assets/images/shop/metamark-mcx/mcx-66-army-olive.webp',
  'mcx-67-bullitt-green': '/assets/images/shop/metamark-mcx/mcx-67-bullitt-green.webp',
  'mcx-68-chimera-green': '/assets/images/shop/metamark-mcx/mcx-68-chimera-green.webp',
  'mcx-73-capri-bronze': '/assets/images/shop/metamark-mcx/mcx-73-capri-bronze.webp',
  'mcx-84-electric-storm': '/assets/images/shop/metamark-mcx/mcx-84-electric-storm.webp',
  'mcx-86-nightlife': '/assets/images/shop/metamark-mcx/mcx-86-nightlife.webp',
  'mcx-87-plum-crazy': '/assets/images/shop/metamark-mcx/mcx-87-plum-crazy.webp',
  'mcx-94-pure-iridium': '/assets/images/shop/metamark-mcx/mcx-94-pure-iridium.webp',
  'mcx-96-urban-steel': '/assets/images/shop/metamark-mcx/mcx-96-urban-steel.webp',
  'mcx-97-carbon-steel': '/assets/images/shop/metamark-mcx/mcx-97-carbon-steel.webp',
  'mcx-98-blizzard-stone': '/assets/images/shop/metamark-mcx/mcx-98-blizzard-stone.webp',
  'mcx-99-obsidian-black': '/assets/images/shop/metamark-mcx/mcx-99-obsidian-black.webp',
};

/** Família publicada pela Metamark → nosso enum. */
const M7_FAMILY_MAP: Record<M7Family, ColorFamilyId> = {
  white: 'branco',
  black: 'preto',
  grey: 'cinza',
  blue: 'azul',
  green: 'verde',
  red: 'vermelho',
  orange: 'laranja',
  yellow: 'amarelo',
  brown: 'marrom',
  purple: 'roxo',
  pink: 'rosa',
  peach: 'laranja',
  gold: 'dourado',
};

export function metamark7ToShopItems(): ShopItem[] {
  return M7_COLORS.map((c) => {
    const finish = finishFromM7(c.matt, c.transparent);
    const color = resolveColor({
      name: c.name,
      code: c.code,
      hex: c.transparent ? null : c.hex,
      declaredFamily: M7_FAMILY_MAP[c.family],
      transparent: c.transparent,
      finishes: finish.ids,
    });
    const familyLabel = M7_FAMILIES.find((f) => f.id === c.family)?.labelPt ?? c.family;

    const specs: ShopSpec[] = [
      { label: 'Código', value: c.code },
      { label: 'Acabamento', value: finish.label ?? '—' },
      { label: 'Hex', value: c.hex.toUpperCase() },
      { label: 'RGB', value: c.rgb.join(', ') },
    ];
    if (c.cmyk) specs.push({ label: 'CMYK', value: c.cmyk });
    if (c.pantone) specs.push({ label: 'Pantone®', value: c.pantone });
    specs.push({ label: 'Larguras', value: c.wide ? 'até 1.600 mm' : 'até 1.220 mm' });

    const badges = ['VINIL DE RECORTE', 'METAMARK UK'];
    if (c.transparent) badges.push('TRANSPARENTE');
    if (c.wide) badges.push('BOBINA LARGA');

    return {
      slug: shopSlug('m7', c.slug),
      source: 'm7',
      sourceId: c.slug,
      name: c.name,
      code: c.code,
      subtitle: `Metamark 7 Series · ${familyLabel}`,
      brand: 'Metamark',
      line: '7 Series',
      lineKey: 'm7',
      brandKey: 'metamark',
      vertical: 'SIGN',
      kind: 'cor',
      aplicacoes: ['comunicacao-visual'],
      image: null,
      gallery: [],
      hex: c.hex,
      colorFamilies: color.families,
      colorSubfamilies: color.subfamilies,
      colorConfidence: color.confidence,
      finishes: finish.ids,
      finishLabel: finish.label,
      patternFamily: null,
      specs,
      badges,
      garantiaAnos: null,
      durabilidadeAnos: null,
      description: null,
      legacyPath: `/wrap/metamark-7-series?cor=${c.slug}`,
      searchText: buildSearchText([
        c.name,
        c.fullName,
        c.code,
        familyLabel,
        c.pantone,
        c.cmyk,
        'metamark m7 7 series vinil recorte sinalizacao plotter',
      ]),
    };
  });
}

export function metamarkMcxToShopItems(): ShopItem[] {
  return MCX_COLORS.map((c) => {
    const finishMeta = MCX_FINISHES.find((f) => f.id === c.finish);
    const finish = finishFromMcx(c.finish, finishMeta?.labelPt);
    // A MetaCast MCX não publica hex por cor. O valor extraído do chip serve só
    // para o bucketing quando o nome não tem token de cor — nunca vira swatch.
    const color = resolveColor({
      name: c.name,
      code: c.code,
      inferredHex: MCX_CHIP_HEX[c.slug] ?? null,
      finishes: finish.ids,
    });

    const badges = ['CAST PREMIUM', 'METAMARK UK'];
    if (c.inspire) badges.push('INSPIRE COLOURS™');

    return {
      slug: shopSlug('mcx', c.slug),
      source: 'mcx',
      sourceId: c.slug,
      name: c.name,
      code: c.code,
      subtitle: `MetaCast MCX · ${finishMeta?.label ?? ''}`.trim(),
      brand: 'Metamark',
      line: 'MetaCast MCX',
      lineKey: 'mcx',
      brandKey: 'metamark',
      vertical: 'WRAP',
      kind: 'cor',
      aplicacoes: ['automotivo'],
      // Foto de rolo custom por slug tem prioridade; chip original + foto de
      // aplicação (quando existe) entram na galeria como secundárias.
      image: MCX_ROLL_IMAGES[c.slug] ?? c.chip,
      gallery: [
        ...(MCX_ROLL_IMAGES[c.slug] ? [MCX_ROLL_IMAGES[c.slug]] : []),
        c.chip,
        ...(c.photo ? [c.photo] : []),
      ],
      // Deliberadamente null: exibir o hex do chip como se fosse oficial seria
      // apresentar uma estimativa nossa como dado do fabricante.
      hex: null,
      colorFamilies: color.families,
      colorSubfamilies: color.subfamilies,
      colorConfidence: color.confidence,
      finishes: finish.ids,
      finishLabel: finish.label,
      patternFamily: null,
      specs: [
        { label: 'Código', value: c.code },
        { label: 'Acabamento', value: finishMeta?.label ?? '—' },
        { label: 'Tecnologia', value: 'MetaGlide® + MetaSure™' },
      ],
      badges,
      garantiaAnos: null,
      durabilidadeAnos: null,
      description: null,
      legacyPath: `/wrap/metamark-mcx?cor=${c.slug}`,
      searchText: buildSearchText([
        c.name,
        c.code,
        finishMeta?.label,
        finishMeta?.labelPt,
        c.inspire ? 'inspire colours oem' : null,
        'metamark metacast mcx cast envelopamento automotivo',
      ]),
    };
  });
}

export function nzwrapToShopItems(): ShopItem[] {
  return NZWRAP_COLORS.map((c) => {
    const finish = normalizeFinishString(c.finish);
    // Nomes como 'NZWRAP FERRARI METALLIC RED' — o prefixo da marca não ajuda a
    // classificar cor, mas também não atrapalha: não há token 'nzwrap' no léxico.
    const color = resolveColor({
      name: c.name,
      code: c.sku,
      hex: c.hex,
      finishes: finish.ids,
    });

    const displayName = c.name.replace(/^NZWRAP\s+/i, '');

    return {
      slug: shopSlug('nzwrap', c.sku),
      source: 'nzwrap',
      sourceId: c.sku,
      name: displayName,
      code: c.sku,
      subtitle: `NZWRAP Premium · ${c.finish}`,
      brand: 'NZWRAP',
      line: 'NZWRAP Premium',
      lineKey: 'nzwrap',
      brandKey: 'nz',
      vertical: 'WRAP',
      kind: 'cor',
      aplicacoes: ['automotivo'],
      image: c.thumbnail,
      gallery: c.images,
      hex: c.hex,
      colorFamilies: color.families,
      colorSubfamilies: color.subfamilies,
      colorConfidence: color.confidence,
      finishes: finish.ids,
      finishLabel: finish.label,
      patternFamily: null,
      specs: [
        { label: 'SKU', value: c.sku },
        { label: 'Acabamento', value: c.finish },
        { label: 'Hex aproximado', value: c.hex.toUpperCase() },
      ],
      badges: ['LINHA PREMIUM', 'ENVELOPAMENTO AUTOMOTIVO'],
      garantiaAnos: 3,
      durabilidadeAnos: 5,
      description: null,
      // A página de cor emite o canonical em minúsculo.
      legacyPath: `/wrap/nzwrap-premium/${c.sku.toLowerCase()}`,
      searchText: buildSearchText([
        displayName,
        c.name,
        c.sku,
        c.finish,
        'nzwrap premium cor envelopamento automotivo tpu',
      ]),
    };
  });
}
