// Adapters das fontes editoriais: Avery Dennison (6 famílias), Metamark MD-80
// (4 SKUs) e as 6 linhas NZPPF.
//
// Estes itens são `kind: 'linha'` — não são cor nem padrão, são famílias
// técnicas. Entram na LOJA porque um visitante que busca "avery" ou "ppf"
// espera encontrá-los; mas são ocultados quando há filtro de cor ativo, já que
// não pertencem a nenhuma família cromática.

import { averyFamilies } from '../../../pages/Sign/averyLines';
import { metamarkSkus, MD80_SPECS } from '../../../pages/Sign/metamarkMd80';
import { PPF_PORTFOLIOS } from '../../../pages/Ppf/ppfPortfolioConfig';
import { normalizeFinishString } from '../finish/normalizeFinish';
import { resolveColor } from '../color/resolveColor';
import { buildSearchText, shopSlug, type ShopItem } from '../types';

export function averyToShopItems(): ShopItem[] {
  return averyFamilies.map((f) => ({
    slug: shopSlug('avery', f.slug),
    source: 'avery',
    sourceId: f.slug,
    name: f.shortName,
    code: null,
    subtitle: f.subtitle,
    brand: 'Avery Dennison',
    line: f.name,
    lineKey: 'avery',
    brandKey: 'avery',
    vertical: 'SIGN',
    kind: 'linha',
    aplicacoes: ['comunicacao-visual'],
    image: null,
    gallery: [],
    hex: null,
    colorFamilies: [],
    colorSubfamilies: [],
    colorConfidence: null,
    finishes: [],
    finishLabel: null,
    patternFamily: null,
    specs: f.specs,
    badges: f.badges,
    garantiaAnos: null,
    durabilidadeAnos: null,
    description: f.description,
    legacyPath: `/sign/${f.slug}`,
    searchText: buildSearchText([
      f.shortName,
      f.name,
      f.subtitle,
      f.description,
      f.subLines?.map((s) => `${s.code} ${s.name}`).join(' '),
      f.applications.join(' '),
      'avery dennison comunicacao visual impressao',
      f.seo?.keywords,
    ]),
  }));
}

export function md80ToShopItems(): ShopItem[] {
  return metamarkSkus.map((s) => {
    const finish = normalizeFinishString(s.finish);
    // 'MD-80 · Branco Brilho' — o nome carrega a cor, então o resolvedor pega.
    const color = resolveColor({ name: s.name, finishes: finish.ids });

    return {
      slug: shopSlug('md80', s.slug),
      source: 'md80',
      sourceId: s.slug,
      name: s.name,
      code: s.code,
      subtitle: `Metamark MD-80 · adesivo ${s.adhesive}`,
      brand: 'Metamark',
      line: 'MD-80',
      lineKey: 'md80',
      brandKey: 'metamark',
      vertical: 'SIGN',
      kind: 'cor',
      aplicacoes: ['comunicacao-visual'],
      image: s.image ?? null,
      gallery: s.image ? [s.image] : [],
      hex: null,
      colorFamilies: color.families,
      colorSubfamilies: color.subfamilies,
      colorConfidence: color.confidence,
      finishes: finish.ids,
      finishLabel: finish.label,
      patternFamily: null,
      specs: MD80_SPECS,
      badges: s.badges,
      garantiaAnos: null,
      durabilidadeAnos: 3,
      description: s.description,
      legacyPath: '/sign',
      searchText: buildSearchText([
        s.name,
        s.code,
        s.description,
        `adesivo ${s.adhesive}`,
        s.finish,
        'metamark md80 vinil monomerico calandrado impressao',
      ]),
    };
  });
}

export function ppfToShopItems(): ShopItem[] {
  return Object.values(PPF_PORTFOLIOS).map((p) => ({
    slug: shopSlug('ppf', p.slug),
    source: 'ppf',
    sourceId: p.slug,
    name: p.name,
    code: null,
    subtitle: p.tagline,
    brand: 'NZPPF',
    line: p.name,
    lineKey: 'ppf',
    brandKey: 'nz',
    vertical: 'PPF',
    kind: 'linha',
    aplicacoes: ['automotivo'],
    image: p.heroImage,
    gallery: [p.heroImage],
    hex: null,
    colorFamilies: [],
    colorSubfamilies: [],
    colorConfidence: null,
    finishes: [],
    finishLabel: null,
    patternFamily: null,
    specs: p.badges.map((b) => ({ label: b.label, value: b.value })),
    badges: p.badges.map((b) => `${b.value} ${b.label}`.toUpperCase()),
    garantiaAnos: null,
    durabilidadeAnos: null,
    description: p.manifesto.paragraphs[0] ?? null,
    legacyPath: `/ppf/${p.slug}`,
    searchText: buildSearchText([
      p.name,
      p.tagline,
      p.manifesto.title,
      p.manifesto.paragraphs.join(' '),
      'nzppf ppf pelicula protecao de pintura automotivo',
    ]),
  }));
}
