/* Linhas Metamark distribuídas pela NZ.
 *
 * Todo o conteúdo técnico vem da documentação oficial da Metamark (UK) Limited
 * (datasheets MetaCast® MCX e Metamark 7 Series). Nenhum número é estimado.
 *
 * Metamark®, MetaCast®, MetaGlide®, MetaSure™ e Inspire Colours™ são marcas
 * registradas da Metamark (UK) Limited.
 *
 * As Inspire Colours™ reproduzem tons de pintura automotiva de forma
 * representativa; a Metamark declara não ter vínculo com nenhuma montadora,
 * então nenhuma marca de veículo é citada nestas páginas.
 */
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import {
  WrapProductPage,
  CamadaIcon,
  CertoIcon,
  EscudoVazioIcon,
  RegeneracaoIcon,
  RepelenciaIcon,
  PresenteIcon,
} from './WrapProducts';
import MetamarkColorCatalog, { type CatalogItem } from './MetamarkColorCatalog';
import { MCX_COLORS, MCX_FINISHES, MCX_BLACK_CODES } from '../../lib/data/metamarkMcxColors';
import { M7_COLORS, M7_FAMILIES, M7_WIDTHS_MM } from '../../lib/data/metamark7Colors';

const WHATSAPP = '5511920707565';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const quoteUrl = (line: string, code: string, name: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Vi a linha ${line} no site da NZ e quero um orçamento da cor ${code} ${name}.`,
  )}`;

const COLOR_DISCLAIMER =
  'Imagens e valores de cor são ilustrativos e representativos: o resultado final varia conforme iluminação, superfície de aplicação e calibragem da sua tela. Solicite uma amostra física antes de fechar o projeto.';

/* ========================= MetaCast® MCX ========================= */

const finishLabel = (id: string) => MCX_FINISHES.find((f) => f.id === id)!;

const mcxItems: CatalogItem[] = MCX_COLORS.map((c) => {
  const finish = finishLabel(c.finish);
  const chips: string[] = [];
  if (c.inspire) chips.push('INSPIRE™');
  if (MCX_BLACK_CODES.includes(c.code)) chips.push('BLACK');
  return {
    id: c.slug,
    code: c.code,
    name: c.name,
    groupId: c.finish,
    swatch: {
      type: 'image',
      src: c.chip,
      alt: `Amostra do filme MetaCast MCX ${c.code} ${c.name}`,
    },
    chips,
    photo: c.photo
      ? { src: c.photo, alt: `Veículo envelopado em MetaCast MCX ${c.code} ${c.name}` }
      : undefined,
    details: [
      { label: 'Código', value: c.code },
      { label: 'Acabamento', value: `${finish.label} (${finish.labelPt})` },
      ...(c.inspire
        ? [{ label: 'Coleção', value: 'Inspire Colours™ — réplica representativa de tom automotivo' }]
        : []),
      { label: 'Face film', value: '100 micras cast premium' },
      { label: 'Adesivo', value: 'MetaGlide® micro canal, reposicionável' },
      { label: 'Rolo', value: '1.525 mm × 15 m ou 30 m' },
      { label: 'Durabilidade', value: '12 anos preto e branco · 10 anos cores · 5 anos metálicos' },
      { label: 'Garantia', value: 'MetaSure™ — até 12 anos' },
    ],
    searchTerms: normalize(
      `${c.code} ${c.name} ${finish.label} ${finish.labelPt} ${c.inspire ? 'inspire colours oem' : ''}`,
    ),
  };
});

export function MetamarkMcx() {
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MetaCast® MCX — Envelopamento Cast Premium Metamark',
    description:
      'Catálogo das 37 cores do filme cast premium MetaCast® MCX da Metamark, distribuído pela NZ Distribuidora.',
    url: `${SITE_URL}/wrap/metamark-mcx`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: MCX_COLORS.length,
      itemListElement: MCX_COLORS.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: `MetaCast MCX ${c.code} ${c.name}`,
          color: c.name,
          brand: { '@type': 'Brand', name: 'Metamark' },
        },
      })),
    },
  });

  return (
    <>
      <SEO
        title="MetaCast MCX — Envelopamento Cast Premium Metamark"
        description="MetaCast® MCX da Metamark: filme cast premium 100μ com adesivo MetaGlide®, 37 cores e garantia MetaSure™ de até 12 anos. Distribuição autorizada NZ."
        keywords="metamark, metacast mcx, envelopamento cast premium, vinil ingles, inspire colours, metaglide, metasure, wrap automotivo"
        canonicalUrl="/wrap/metamark-mcx"
        schema={schema}
      />
      <WrapProductPage
        data={{
          title: 'METACAST® MCX',
          // "micras" por extenso: o subtítulo é uppercase no CSS e μ vira Μ (Mu maiúsculo)
          subtitle: 'Cast Premium 100 micras | Metamark · Reino Unido',
          heroDescription:
            'Filme cast premium de dupla camada com 100 micras e tecnologia de adesivo MetaGlide®: micro canais de ar, reposicionável e com alta força de adesão para encaixar em canais e reentrâncias tridimensionais. São 37 cores em acabamentos brilhante, acetinado e fosco, incluindo as Inspire Colours™ da Metamark.',
          heroWarning: 'GARANTIA METASURE™ DE ATÉ 12 ANOS — FABRICAÇÃO PRÓPRIA NO REINO UNIDO.',
          heroImage: '/assets/images/metamark/mcx/mcx-hero.jpg',
          specs: [
            {
              icon: CamadaIcon,
              info: 'Face film',
              spec: '100μ Cast Premium',
              detalhe: 'Dupla camada, altamente conformável.',
            },
            {
              icon: RepelenciaIcon,
              info: 'Adesivo',
              spec: 'MetaGlide® Micro Canal',
              detalhe: 'Cinza, base solvente, reposicionável, com saída de ar.',
            },
            {
              icon: CamadaIcon,
              info: 'Liner',
              spec: 'PE Layflat 140 g/m²',
              detalhe: 'Estruturado com micro canais; mantém o filme plano.',
            },
            {
              icon: RegeneracaoIcon,
              info: 'Durabilidade',
              spec: '12 / 10 / 5 anos',
              detalhe: 'Preto e branco, cores e metálicos, respectivamente.',
            },
            {
              icon: CertoIcon,
              info: 'Cores',
              spec: `${MCX_COLORS.length} cores`,
              detalhe: `Inclui ${MCX_COLORS.filter((c) => c.inspire).length} Inspire Colours™.`,
            },
            {
              icon: EscudoVazioIcon,
              info: 'Rolo',
              spec: '1.525 mm × 15 m / 30 m',
              detalhe: 'Autoextinguível. Validade em estoque de 2 anos.',
            },
          ],
          diferenciais: [
            {
              icon: RepelenciaIcon,
              title: 'MetaGlide® — instalação sem ar preso',
              desc: 'Sistema de micro canais de saída de ar com repositionabilidade ampliada e alta força de adesão. Segurança para trabalhar em canais e reentrâncias tridimensionais sem refazer a peça.',
              accent: 'Sem bolhas',
              image: '/assets/images/metamark/mcx/mcx-aplicacao-1.jpg',
            },
            {
              icon: RegeneracaoIcon,
              title: 'Garantia MetaSure™',
              desc: 'Programa de garantia do próprio fabricante, com durabilidade externa declarada de até 12 anos conforme o acabamento — cobertura documentada, não promessa comercial.',
              accent: 'Até 12 anos',
              image: '/assets/images/metamark/mcx/mcx-aplicacao-2.jpg',
            },
            {
              icon: CertoIcon,
              title: 'Inspire Colours™',
              desc: 'Onze cores desenvolvidas pela Metamark para reproduzir, em filme de envelopamento, alguns dos tons de pintura automotiva mais procurados. As cores são aproximações representativas.',
              accent: `${MCX_COLORS.filter((c) => c.inspire).length} cores`,
              image: '/assets/images/metamark/mcx/mcx-aplicacao-3.jpg',
            },
            {
              icon: PresenteIcon,
              title: 'Fabricação britânica desde 1992',
              desc: 'Produção própria em Lancaster, no Reino Unido, com certificações ISO 9001, 14001, 45001 e 50001 e selo EcoVadis Platinum. Desde 2025 a Metamark integra o grupo finlandês UPM.',
              accent: 'Made in UK',
              image: '/assets/images/metamark/mcx/mcx-aplicacao-4.jpg',
            },
          ],
          officialData: {
            title: 'DURABILIDADE DECLARADA',
            subtitle: 'Valores do datasheet do fabricante, por tipo de acabamento',
            unit: 'anos',
            rows: [
              { label: 'Preto e branco', value: 12 },
              { label: 'Cores', value: 10 },
              { label: 'Metálicos', value: 5 },
            ],
            source: 'Fonte: Metamark — MetaCast® MCX Technical Data Sheet. Durabilidade externa sob garantia MetaSure™.',
          },
        }}
      >
        <MetamarkColorCatalog
          lineLabel="MetaCast® MCX"
          title="Catálogo de cores"
          subtitle={`${MCX_COLORS.length} cores em cinco acabamentos, com as amostras fotográficas oficiais da Metamark. Toque numa cor para ver a ficha e pedir orçamento.`}
          items={mcxItems}
          groups={MCX_FINISHES.map((f) => ({ id: f.id, label: f.label }))}
          extraFilters={[
            {
              id: 'inspire',
              label: 'Inspire Colours™',
              test: (i) => !!i.chips?.includes('INSPIRE™'),
            },
            { id: 'blacks', label: 'Blacks', test: (i) => !!i.chips?.includes('BLACK') },
          ]}
          cardMinPx={150}
          searchPlaceholder="Buscar cor ou código (ex.: MCX-59, Blue Abyss)…"
          disclaimer={COLOR_DISCLAIMER}
          whatsappUrl={(item) => quoteUrl('MetaCast MCX', item.code, item.name)}
        />
      </WrapProductPage>
    </>
  );
}

/* ======================= Metamark 7 Series ======================= */

const familyLabel = (id: string) => M7_FAMILIES.find((f) => f.id === id)!;

const m7Items: CatalogItem[] = M7_COLORS.map((c) => {
  const family = familyLabel(c.family);
  const chips: string[] = [];
  if (c.matt) chips.push('FOSCO');
  if (c.wide) chips.push('1600mm');
  if (c.transparent) chips.push('TRANSP.');
  return {
    id: c.slug,
    code: c.code,
    name: c.name,
    groupId: c.family,
    swatch: { type: 'color', hex: c.hex, transparent: c.transparent },
    chips,
    details: [
      { label: 'Código', value: c.code },
      { label: 'Família', value: `${family.label} (${family.labelPt.toLowerCase()})` },
      ...(c.transparent
        ? [{ label: 'Aparência', value: 'Filme transparente — o valor de cor é apenas referencial' }]
        : [{ label: 'Cor (RGB)', value: `${c.hex.toUpperCase()} · rgb(${c.rgb.join(', ')})` }]),
      ...(c.pantone ? [{ label: 'Pantone®', value: c.pantone }] : []),
      ...(c.cmyk ? [{ label: 'CMYK', value: c.cmyk }] : []),
      {
        label: 'Larguras',
        value: c.wide
          ? M7_WIDTHS_MM.map((w) => `${w} mm`).join(' · ')
          : M7_WIDTHS_MM.filter((w) => w !== 1600)
              .map((w) => `${w} mm`)
              .join(' · '),
      },
      { label: 'Face film', value: '70 micras PVC polimérico calandrado' },
      { label: 'Durabilidade', value: '8 anos preto e branco · 7 anos cores · 5 anos metálicos' },
    ],
    searchTerms: normalize(
      `${c.code} ${c.name} ${family.label} ${family.labelPt} ${c.pantone ? `pantone ${c.pantone}` : ''} ${c.cmyk ?? ''} ${c.matt ? 'fosco matt' : ''}`,
    ),
  };
});

export function MetamarkM7() {
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Metamark 7 Series — Vinil de Recorte 70μ',
    description:
      'Catálogo das 92 cores do vinil polimérico Metamark 7 Series, com valores Pantone® e CMYK oficiais. Distribuição NZ.',
    url: `${SITE_URL}/wrap/metamark-7-series`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: M7_COLORS.length,
      itemListElement: M7_COLORS.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: `Metamark ${c.fullName}`,
          color: c.name,
          brand: { '@type': 'Brand', name: 'Metamark' },
        },
      })),
    },
  });

  return (
    <>
      <SEO
        title="Metamark 7 Series — Vinil de Recorte 70μ com 92 Cores"
        description="Metamark 7 Series: vinil polimérico calandrado 70μ com adesivo Apex, reação ao fogo Classe B e 92 cores com Pantone® e CMYK publicados. Larguras de 380 a 1.600 mm."
        keywords="metamark 7 series, m7 vinil, vinil de recorte, vinil polimerico, vinil sinalizacao, pantone vinil, plotter de recorte, comunicacao visual"
        canonicalUrl="/wrap/metamark-7-series"
        schema={schema}
      />
      <WrapProductPage
        data={{
          title: 'METAMARK 7 SERIES',
          subtitle: 'Vinil de Recorte Polimérico 70 micras | Metamark · Reino Unido',
          heroDescription:
            'Alto desempenho onde a cor precisa ser potente e durável: gráficos veiculares em superfícies planas e curvas, sinalização e recorte. Filme de 70 micras com toque macio, adesivo Apex permanente base solvente e liner lay-flat de alto desempenho. As 92 cores têm valores Pantone® e CMYK publicados pelo fabricante.',
          heroWarning: '92 CORES · REAÇÃO AO FOGO CLASSE B · LARGURAS DE 380 A 1.600 mm.',
          heroImage: '/assets/images/metamark/m7/m7-hero.jpg',
          specs: [
            {
              icon: CamadaIcon,
              info: 'Face film',
              spec: '70μ PVC polimérico',
              detalhe: 'Calandrado, toque macio, otimizado para recorte e weeding.',
            },
            {
              icon: RepelenciaIcon,
              info: 'Adesivo',
              spec: 'Apex permanente',
              detalhe: 'Acrílico base solvente, formulação própria Metamark.',
            },
            {
              icon: CamadaIcon,
              info: 'Liner',
              spec: 'Kraft layflat clay coated',
              detalhe: 'Sem solvente; mantém o filme plano na mesa e no plotter.',
            },
            {
              icon: RegeneracaoIcon,
              info: 'Durabilidade',
              spec: '8 / 7 / 5 anos',
              detalhe: 'Preto e branco, cores e metálicos, respectivamente.',
            },
            {
              icon: CertoIcon,
              info: 'Cores',
              spec: `${M7_COLORS.length} cores`,
              detalhe: `${M7_COLORS.filter((c) => c.pantone).length} com referência Pantone® e CMYK publicada.`,
            },
            {
              icon: EscudoVazioIcon,
              info: 'Larguras',
              spec: '380 a 1.600 mm',
              detalhe: 'Reação ao fogo Classe B. 1.600 mm em branco e preto, brilho e fosco.',
            },
          ],
          diferenciais: [
            {
              icon: CertoIcon,
              title: 'Cor com referência colorimétrica',
              desc: 'Cada cor da linha tem valor Pantone® e CMYK publicado pelo fabricante. Isso permite fechar identidade visual de frota e de marca com referência objetiva, em vez de aprovação no olho.',
              accent: 'Pantone + CMYK',
              image: '/assets/images/metamark/m7/m7-aplicacao-1.jpg',
            },
            {
              icon: RepelenciaIcon,
              title: 'Manuseio sem drama',
              desc: 'Face film de 70 micras com toque macio, adesivo Apex e liner lay-flat de alto desempenho: corte limpo, weeding previsível e aplicação estável em superfícies planas e curvas.',
              accent: 'Recorte limpo',
              image: '/assets/images/metamark/m7/m7-aplicacao-2.jpg',
            },
            {
              icon: CamadaIcon,
              title: 'Cinco larguras de bobina',
              desc: 'De 380 mm a 1.600 mm. Escolher a bobina certa para cada trabalho significa menos refile, menos sobra e melhor aproveitamento de material por serviço.',
              accent: '380 a 1.600 mm',
              image: '/assets/images/metamark/m7/m7-aplicacao-3.jpg',
            },
            {
              icon: PresenteIcon,
              title: 'Classe B e fabricação britânica',
              desc: 'Reação ao fogo Classe B, produção própria no Reino Unido desde 1992 e certificações ISO 9001, 14001, 45001 e 50001, com selo EcoVadis Platinum. Metamark integra o grupo UPM desde 2025.',
              accent: 'Classe B',
              image: '/assets/images/metamark/m7/m7-aplicacao-4.jpg',
            },
          ],
          officialData: {
            title: 'DURABILIDADE DECLARADA',
            subtitle: 'Valores do datasheet do fabricante, por tipo de cor',
            unit: 'anos',
            rows: [
              { label: 'Preto e branco', value: 8 },
              { label: 'Cores', value: 7 },
              { label: 'Metálicos', value: 5 },
            ],
            source: 'Fonte: Metamark — Metamark 7 Series Technical Data Sheet. Durabilidade externa em aplicação vertical.',
          },
        }}
      >
        <MetamarkColorCatalog
          lineLabel="Metamark 7 Series"
          title="Catálogo de cores"
          subtitle={`${M7_COLORS.length} cores organizadas por família, com o valor Pantone® e CMYK oficial de cada uma. Toque numa cor para ver a ficha e pedir orçamento.`}
          items={m7Items}
          groups={M7_FAMILIES.map((f) => ({ id: f.id, label: f.labelPt }))}
          extraFilters={[{ id: 'matt', label: 'Fosco', test: (i) => !!i.chips?.includes('FOSCO') }]}
          cardMinPx={120}
          searchPlaceholder="Buscar cor, código ou Pantone (ex.: M7-196, Graphite, 447C)…"
          disclaimer={COLOR_DISCLAIMER}
          whatsappUrl={(item) => quoteUrl('Metamark 7 Series', item.code, item.name)}
        />
      </WrapProductPage>
    </>
  );
}
