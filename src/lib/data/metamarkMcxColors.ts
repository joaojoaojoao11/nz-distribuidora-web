// GERADO por scripts/generate-metamark.mjs — não editar à mão.
// Fonte: https://metamark.co.uk/pages/mcx (painéis de acabamento do HTML oficial)
// Metamark®, MetaCast®, MetaGlide®, MetaSure™ e Inspire Colours™ são marcas
// registradas da Metamark (UK) Limited.

export type McxFinish = 'matt-metallic' | 'gloss-metallic' | 'satin-metallic' | 'gloss-solid' | 'satin-solid';

export interface MetamarkMcxColor {
  /** Código oficial do mostruário, ex.: 'MCX-54'. */
  code: string;
  /** Nome oficial da cor, sem o código. */
  name: string;
  /** Identificador de URL (?cor=). */
  slug: string;
  finish: McxFinish;
  /** Inspire Colours™ — desenvolvida para reproduzir um tom de pintura OEM. */
  inspire: boolean;
  /** Foto oficial do filme (400x400). A MetaCast MCX não publica valor hexadecimal por cor. */
  chip: string;
}

export const MCX_FINISHES: { id: McxFinish; label: string; labelPt: string }[] = [
  { id: 'matt-metallic', label: 'Matt Metallic', labelPt: 'metálico fosco' },
  { id: 'gloss-metallic', label: 'Gloss Metallic', labelPt: 'metálico brilhante' },
  { id: 'satin-metallic', label: 'Satin Metallic', labelPt: 'metálico acetinado' },
  { id: 'gloss-solid', label: 'Gloss Solid', labelPt: 'sólido brilhante' },
  { id: 'satin-solid', label: 'Satin Solid', labelPt: 'sólido acetinado' },
];

/** Recorte transversal "Blacks" do mostruário oficial — não é um acabamento. */
export const MCX_BLACK_CODES: readonly string[] = ['MCX-99', 'MCX-10', 'MCX-12'];

export const MCX_COLORS: MetamarkMcxColor[] = [
  { code: 'MCX-54', name: 'Bavarian Blue', slug: 'mcx-54-bavarian-blue', finish: 'matt-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-54-bavarian-blue.jpg' },
  { code: 'MCX-63', name: 'Speed Green', slug: 'mcx-63-speed-green', finish: 'matt-metallic', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-63-speed-green.jpg' },
  { code: 'MCX-73', name: 'Capri Bronze', slug: 'mcx-73-capri-bronze', finish: 'matt-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-73-capri-bronze.jpg' },
  { code: 'MCX-87', name: 'Plum Crazy', slug: 'mcx-87-plum-crazy', finish: 'matt-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-87-plum-crazy.jpg' },
  { code: 'MCX-96', name: 'Urban Steel', slug: 'mcx-96-urban-steel', finish: 'matt-metallic', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-96-urban-steel.jpg' },
  { code: 'MCX-97', name: 'Carbon Steel', slug: 'mcx-97-carbon-steel', finish: 'matt-metallic', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-97-carbon-steel.jpg' },
  { code: 'MCX-39', name: 'FireFox', slug: 'mcx-39-firefox', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-39-firefox.jpg' },
  { code: 'MCX-46', name: 'Volcano Red', slug: 'mcx-46-volcano-red', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-46-volcano-red.jpg' },
  { code: 'MCX-59', name: 'Blue Abyss', slug: 'mcx-59-blue-abyss', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-59-blue-abyss.jpg' },
  { code: 'MCX-60', name: 'Sub Lime', slug: 'mcx-60-sub-lime', finish: 'gloss-metallic', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-60-sub-lime.jpg' },
  { code: 'MCX-61', name: 'Atomic Green', slug: 'mcx-61-atomic-green', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-61-atomic-green.jpg' },
  { code: 'MCX-67', name: 'Bullitt Green', slug: 'mcx-67-bullitt-green', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-67-bullitt-green.jpg' },
  { code: 'MCX-68', name: 'Chimera Green', slug: 'mcx-68-chimera-green', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-68-chimera-green.jpg' },
  { code: 'MCX-84', name: 'Electric Storm', slug: 'mcx-84-electric-storm', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-84-electric-storm.jpg' },
  { code: 'MCX-86', name: 'Nightlife', slug: 'mcx-86-nightlife', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-86-nightlife.jpg' },
  { code: 'MCX-94', name: 'Pure Iridium', slug: 'mcx-94-pure-iridium', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-94-pure-iridium.jpg' },
  { code: 'MCX-98', name: 'Blizzard Stone', slug: 'mcx-98-blizzard-stone', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-98-blizzard-stone.jpg' },
  { code: 'MCX-99', name: 'Obsidian Black', slug: 'mcx-99-obsidian-black', finish: 'gloss-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-99-obsidian-black.jpg' },
  { code: 'MCX-65', name: 'Carbon Green', slug: 'mcx-65-carbon-green', finish: 'satin-metallic', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-65-carbon-green.jpg' },
  { code: 'MCX-35', name: 'Modena Yellow', slug: 'mcx-35-modena-yellow', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-35-modena-yellow.jpg' },
  { code: 'MCX-36', name: 'Monza Yellow', slug: 'mcx-36-monza-yellow', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-36-monza-yellow.jpg' },
  { code: 'MCX-38', name: 'Venturi Orange', slug: 'mcx-38-venturi-orange', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-38-venturi-orange.jpg' },
  { code: 'MCX-48', name: 'Cooper Red', slug: 'mcx-48-cooper-red', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-48-cooper-red.jpg' },
  { code: 'MCX-49', name: 'Maranello Red', slug: 'mcx-49-maranello-red', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-49-maranello-red.jpg' },
  { code: 'MCX-51', name: 'Miami Blue', slug: 'mcx-51-miami-blue', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-51-miami-blue.jpg' },
  { code: 'MCX-52', name: 'Mexico Blue', slug: 'mcx-52-mexico-blue', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-52-mexico-blue.jpg' },
  { code: 'MCX-56', name: 'Icon Blue', slug: 'mcx-56-icon-blue', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-56-icon-blue.jpg' },
  { code: 'MCX-57', name: 'Yacht Blue', slug: 'mcx-57-yacht-blue', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-57-yacht-blue.jpg' },
  { code: 'MCX-58', name: 'Lapis Blue', slug: 'mcx-58-lapis-blue', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-58-lapis-blue.jpg' },
  { code: 'MCX-62', name: 'Viper Green', slug: 'mcx-62-viper-green', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-62-viper-green.jpg' },
  { code: 'MCX-00', name: 'Simply White', slug: 'mcx-00-simply-white', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-00-simply-white.jpg' },
  { code: 'MCX-22', name: 'Chalk Grey', slug: 'mcx-22-chalk-grey', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-22-chalk-grey.jpg' },
  { code: 'MCX-26', name: 'Nardo Grey', slug: 'mcx-26-nardo-grey', finish: 'gloss-solid', inspire: true, chip: '/assets/images/metamark/mcx/chips/mcx-26-nardo-grey.jpg' },
  { code: 'MCX-28', name: 'Café Racer', slug: 'mcx-28-cafe-racer', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-28-cafe-racer.jpg' },
  { code: 'MCX-10', name: 'Jet Black', slug: 'mcx-10-jet-black', finish: 'gloss-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-10-jet-black.jpg' },
  { code: 'MCX-12', name: 'Gotham Black', slug: 'mcx-12-gotham-black', finish: 'satin-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-12-gotham-black.jpg' },
  { code: 'MCX-66', name: 'Army Olive', slug: 'mcx-66-army-olive', finish: 'satin-solid', inspire: false, chip: '/assets/images/metamark/mcx/chips/mcx-66-army-olive.jpg' },
];

/** Ficha técnica oficial da linha (Technical Data Sheet MetaCast® MCX). */
export const MCX_SPECS: { label: string; value: string }[] = [
  { label: 'Face film', value: '100 micras cast premium (dupla camada)' },
  { label: 'Adesivo', value: 'MetaGlide® micro canal, cinza, base solvente, reposicionável' },
  { label: 'Liner', value: 'PE layflat 140 g/m² com micro canais estruturados' },
  { label: 'Durabilidade', value: '12 anos preto e branco · 10 anos cores · 5 anos metálicos' },
  { label: 'Largura do rolo', value: '1.525 mm' },
  { label: 'Comprimento do rolo', value: '15 m / 30 m' },
  { label: 'Validade em estoque', value: '2 anos' },
  { label: 'Reação ao fogo', value: 'Autoextinguível' },
  { label: 'Garantia', value: 'MetaSure™ — até 12 anos' },
];
