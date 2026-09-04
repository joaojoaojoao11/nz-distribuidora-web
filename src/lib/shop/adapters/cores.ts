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
      image: c.chip,
      gallery: [c.chip, ...(c.photo ? [c.photo] : [])],
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
