// GERADO por scripts/generate-metamark.mjs — não editar à mão.
// Fonte: https://metamark.co.uk/products/metamark-7-series (tabela de cores do HTML oficial)
// Metamark®, MetaCast®, MetaGlide®, MetaSure™ e Inspire Colours™ são marcas
// registradas da Metamark (UK) Limited.

export type M7Family = 'white' | 'black' | 'grey' | 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'brown' | 'purple' | 'pink' | 'peach' | 'gold';

export interface Metamark7Color {
  /** Código oficial da cor, ex.: 'M7-108'. O SKU do fabricante (M7-108-610) inclui a largura. */
  code: string;
  name: string;
  /** Grafia oficial completa, ex.: 'M7-108 Imitation Gold'. */
  fullName: string;
  slug: string;
  family: M7Family;
  /** Derivado do RGB publicado pela Metamark. */
  hex: string;
  rgb: [number, number, number];
  /** Valor CMYK oficial; null quando o fabricante não publica. */
  cmyk: string | null;
  /** Referência Pantone® oficial; null quando o fabricante não publica. */
  pantone: string | null;
  /** Acabamento fosco — indicado pelo sufixo 'M' no código oficial. */
  matt: boolean;
  /** Filme transparente: o RGB publicado não representa a aparência real. */
  transparent: boolean;
  /** Disponível também em bobina de 1.600 mm. */
  wide: boolean;
}

export const M7_FAMILIES: { id: M7Family; label: string; labelPt: string }[] = [
  { id: 'white', label: 'White', labelPt: 'Brancos' },
  { id: 'black', label: 'Black', labelPt: 'Pretos' },
  { id: 'grey', label: 'Grey', labelPt: 'Cinzas' },
  { id: 'blue', label: 'Blue', labelPt: 'Azuis' },
  { id: 'green', label: 'Green', labelPt: 'Verdes' },
  { id: 'red', label: 'Red', labelPt: 'Vermelhos' },
  { id: 'orange', label: 'Orange', labelPt: 'Laranjas' },
  { id: 'yellow', label: 'Yellow', labelPt: 'Amarelos' },
  { id: 'brown', label: 'Brown', labelPt: 'Marrons' },
  { id: 'purple', label: 'Purple', labelPt: 'Roxos' },
  { id: 'pink', label: 'Pink', labelPt: 'Rosas' },
  { id: 'peach', label: 'Peach', labelPt: 'Pêssego' },
  { id: 'gold', label: 'Gold', labelPt: 'Dourados' },
];

export const M7_WIDTHS_MM = [380, 610, 760, 1220, 1600] as const;

export const M7_COLORS: Metamark7Color[] = [
  { code: 'M7-100', name: 'White Gloss', fullName: 'M7-100 White Gloss', slug: 'm7-100-white-gloss', family: 'white', hex: '#e0e8ed', rgb: [224, 232, 237], cmyk: null, pantone: null, matt: false, transparent: false, wide: true },
  { code: 'M7-101M', name: 'White Matt', fullName: 'M7-101M White Matt', slug: 'm7-101m-white-matt', family: 'white', hex: '#dfe4f0', rgb: [223, 228, 240], cmyk: null, pantone: null, matt: true, transparent: false, wide: true },
  { code: 'M7-105', name: 'Clear', fullName: 'M7-105 Clear', slug: 'm7-105-clear', family: 'white', hex: '#e1e2d8', rgb: [225, 226, 216], cmyk: null, pantone: null, matt: false, transparent: true, wide: false },
  { code: 'M7-108', name: 'Imitation Gold', fullName: 'M7-108 Imitation Gold', slug: 'm7-108-imitation-gold', family: 'gold', hex: '#c69b36', rgb: [198, 155, 54], cmyk: 'C20 M39 Y92 K9', pantone: '1245C', matt: false, transparent: false, wide: false },
  { code: 'M7-109', name: 'Chiltern White', fullName: 'M7-109 Chiltern White', slug: 'm7-109-chiltern-white', family: 'white', hex: '#eef4f9', rgb: [238, 244, 249], cmyk: null, pantone: null, matt: false, transparent: false, wide: false },
  { code: 'M7-110', name: 'Black Gloss', fullName: 'M7-110 Black Gloss', slug: 'm7-110-black-gloss', family: 'black', hex: '#000008', rgb: [0, 0, 8], cmyk: 'C0 M0 Y0 K100', pantone: 'Black C', matt: false, transparent: false, wide: true },
  { code: 'M7-111M', name: 'Black Matt', fullName: 'M7-111M Black Matt', slug: 'm7-111m-black-matt', family: 'black', hex: '#181e23', rgb: [24, 30, 35], cmyk: 'C0 M0 Y0 K100', pantone: 'Black U', matt: true, transparent: false, wide: true },
  { code: 'M7-112', name: 'Tangerine', fullName: 'M7-112 Tangerine', slug: 'm7-112-tangerine', family: 'orange', hex: '#ef622a', rgb: [239, 98, 42], cmyk: 'C0 M81 Y94 K0', pantone: 'Orange 021C', matt: false, transparent: false, wide: false },
  { code: 'M7-113', name: 'Burnt Orange', fullName: 'M7-113 Burnt Orange', slug: 'm7-113-burnt-orange', family: 'orange', hex: '#f0502d', rgb: [240, 80, 45], cmyk: 'C0 M87 Y94 K0', pantone: '7597C', matt: false, transparent: false, wide: false },
  { code: 'M7-114', name: 'Maroon', fullName: 'M7-114 Maroon', slug: 'm7-114-maroon', family: 'red', hex: '#891627', rgb: [137, 22, 39], cmyk: 'C22 M100 Y100 K18', pantone: '202C', matt: false, transparent: false, wide: false },
  { code: 'M7-115', name: 'Cornflour', fullName: 'M7-115 Cornflour', slug: 'm7-115-cornflour', family: 'blue', hex: '#3aa9e0', rgb: [58, 169, 224], cmyk: 'C81 M7 Y3 K0', pantone: '279C', matt: false, transparent: false, wide: false },
  { code: 'M7-116', name: 'Admiral', fullName: 'M7-116 Admiral', slug: 'm7-116-admiral', family: 'blue', hex: '#0d487c', rgb: [13, 72, 124], cmyk: 'C100 M82 Y25 K14', pantone: '541C', matt: false, transparent: false, wide: false },
  { code: 'M7-117', name: 'Oxford', fullName: 'M7-117 Oxford', slug: 'm7-117-oxford', family: 'blue', hex: '#1a3c6f', rgb: [26, 60, 111], cmyk: 'C100 M88 Y24 K18', pantone: '2748C', matt: false, transparent: false, wide: false },
  { code: 'M7-118', name: 'Reflex Blue', fullName: 'M7-118 Reflex Blue', slug: 'm7-118-reflex-blue', family: 'blue', hex: '#18437e', rgb: [24, 67, 126], cmyk: 'C100 M87 Y18 K10', pantone: 'Reflex Blue', matt: false, transparent: false, wide: false },
  { code: 'M7-119', name: 'Prussian', fullName: 'M7-119 Prussian', slug: 'm7-119-prussian', family: 'blue', hex: '#152b4f', rgb: [21, 43, 79], cmyk: 'C100 M88 Y34 K42', pantone: '2767C', matt: false, transparent: false, wide: false },
  { code: 'M7-120', name: 'Pewter', fullName: 'M7-120 Pewter', slug: 'm7-120-pewter', family: 'grey', hex: '#6e7c82', rgb: [110, 124, 130], cmyk: 'C59 M42 Y40 K40', pantone: '430C', matt: false, transparent: false, wide: false },
  { code: 'M7-121', name: 'Light Grey', fullName: 'M7-121 Light Grey', slug: 'm7-121-light-grey', family: 'grey', hex: '#959a98', rgb: [149, 154, 152], cmyk: 'C41 M31 Y33 K1', pantone: '422C', matt: false, transparent: false, wide: false },
  { code: 'M7-122', name: 'Pale Grey', fullName: 'M7-122 Pale Grey', slug: 'm7-122-pale-grey', family: 'grey', hex: '#b8bcbb', rgb: [184, 188, 187], cmyk: 'C23 M18 Y18 K0', pantone: '427C', matt: false, transparent: false, wide: false },
  { code: 'M7-123', name: 'Medium Grey', fullName: 'M7-123 Medium Grey', slug: 'm7-123-medium-grey', family: 'grey', hex: '#828b86', rgb: [130, 139, 134], cmyk: 'C47 M35 Y42 K2', pantone: '414C', matt: false, transparent: false, wide: false },
  { code: 'M7-124', name: 'Dark Grey', fullName: 'M7-124 Dark Grey', slug: 'm7-124-dark-grey', family: 'grey', hex: '#555d5f', rgb: [85, 93, 95], cmyk: 'C66 M50 Y54 K24', pantone: 'Cool Grey 10C', matt: false, transparent: false, wide: false },
  { code: 'M7-125', name: 'Nimbus Grey', fullName: 'M7-125 Nimbus Grey', slug: 'm7-125-nimbus-grey', family: 'grey', hex: '#3f494a', rgb: [63, 73, 74], cmyk: 'C64 M49 Y48 K40', pantone: '445C', matt: false, transparent: false, wide: false },
  { code: 'M7-126', name: 'Storm Grey', fullName: 'M7-126 Storm Grey', slug: 'm7-126-storm-grey', family: 'grey', hex: '#26292a', rgb: [38, 41, 42], cmyk: 'C72 M63 Y66 K65', pantone: '426C', matt: false, transparent: false, wide: false },
  { code: 'M7-127', name: 'Ash Grey', fullName: 'M7-127 Ash Grey', slug: 'm7-127-ash-grey', family: 'grey', hex: '#6e7c82', rgb: [110, 124, 130], cmyk: 'C59 M41 Y40 K7', pantone: 'Cool Grey 9C', matt: false, transparent: false, wide: false },
  { code: 'M7-128', name: 'Shadow', fullName: 'M7-128 Shadow', slug: 'm7-128-shadow', family: 'grey', hex: '#394447', rgb: [57, 68, 71], cmyk: 'C73 M58 Y58 K42', pantone: '425C', matt: false, transparent: false, wide: false },
  { code: 'M7-130', name: 'Lemon', fullName: 'M7-130 Lemon', slug: 'm7-130-lemon', family: 'yellow', hex: '#efec5d', rgb: [239, 236, 93], cmyk: 'C0 M7 Y100 K0', pantone: 'Yellow', matt: false, transparent: false, wide: false },
  { code: 'M7-131', name: 'Sunflower', fullName: 'M7-131 Sunflower', slug: 'm7-131-sunflower', family: 'yellow', hex: '#fbc030', rgb: [251, 192, 48], cmyk: 'C0 M27 Y100 K0', pantone: '7409C', matt: false, transparent: false, wide: false },
  { code: 'M7-132', name: 'Medium Yellow', fullName: 'M7-132 Medium Yellow', slug: 'm7-132-medium-yellow', family: 'yellow', hex: '#fbad2e', rgb: [251, 173, 46], cmyk: 'C0 M36 Y100 K0', pantone: '7409C', matt: false, transparent: false, wide: false },
  { code: 'M7-107', name: 'Fire Orange', fullName: 'M7-107 Fire Orange', slug: 'm7-107-fire-orange', family: 'orange', hex: '#f36f28', rgb: [243, 111, 40], cmyk: 'C0 M74 Y97 K0', pantone: '165C', matt: false, transparent: false, wide: false },
  { code: 'M7-134', name: 'Marigold', fullName: 'M7-134 Marigold', slug: 'm7-134-marigold', family: 'orange', hex: '#f57f27', rgb: [245, 127, 39], cmyk: 'C0 M65 Y97 K0', pantone: '166C', matt: false, transparent: false, wide: false },
  { code: 'M7-135', name: 'Apricot', fullName: 'M7-135 Apricot', slug: 'm7-135-apricot', family: 'orange', hex: '#f7902e', rgb: [247, 144, 46], cmyk: 'C0 M55 Y97 K0', pantone: '7413C', matt: false, transparent: false, wide: false },
  { code: 'M7-136', name: 'Bright Yellow', fullName: 'M7-136 Bright Yellow', slug: 'm7-136-bright-yellow', family: 'yellow', hex: '#fcce33', rgb: [252, 206, 51], cmyk: 'C0 M20 Y100 K0', pantone: '123C', matt: false, transparent: false, wide: false },
  { code: 'M7-129', name: 'Ochre', fullName: 'M7-129 Ochre', slug: 'm7-129-ochre', family: 'orange', hex: '#f8982d', rgb: [248, 152, 45], cmyk: 'C0 M50 Y100 K0', pantone: '715C', matt: false, transparent: false, wide: false },
  { code: 'M7-138', name: 'Saffron', fullName: 'M7-138 Saffron', slug: 'm7-138-saffron', family: 'orange', hex: '#f5802b', rgb: [245, 128, 43], cmyk: 'C0 M64 Y98 K0', pantone: '158C', matt: false, transparent: false, wide: false },
  { code: 'M7-139', name: 'Pumpkin', fullName: 'M7-139 Pumpkin', slug: 'm7-139-pumpkin', family: 'orange', hex: '#f37125', rgb: [243, 113, 37], cmyk: 'C0 M74 Y99 K0', pantone: '165C', matt: false, transparent: false, wide: false },
  { code: 'M7-140', name: 'Poppy', fullName: 'M7-140 Poppy', slug: 'm7-140-poppy', family: 'red', hex: '#ec402d', rgb: [236, 64, 45], cmyk: 'C0 M92 Y96 K0', pantone: '7626C', matt: false, transparent: false, wide: false },
  { code: 'M7-141', name: 'Flame Red', fullName: 'M7-141 Flame Red', slug: 'm7-141-flame-red', family: 'red', hex: '#d5252a', rgb: [213, 37, 42], cmyk: 'C1 M99 Y100 K0', pantone: '2347C', matt: false, transparent: false, wide: false },
  { code: 'M7-142', name: 'Tomato', fullName: 'M7-142 Tomato', slug: 'm7-142-tomato', family: 'red', hex: '#d32029', rgb: [211, 32, 41], cmyk: 'C1 M100 Y100 K0', pantone: '1795C', matt: false, transparent: false, wide: false },
  { code: 'M7-143', name: 'Cherry', fullName: 'M7-143 Cherry', slug: 'm7-143-cherry', family: 'red', hex: '#bf2128', rgb: [191, 33, 40], cmyk: 'C7 M100 Y100 K1', pantone: '2035C', matt: false, transparent: false, wide: false },
  { code: 'M7-144', name: 'Medium Red', fullName: 'M7-144 Medium Red', slug: 'm7-144-medium-red', family: 'red', hex: '#ee3126', rgb: [238, 49, 38], cmyk: 'C0 M95 Y98 K0', pantone: '485C', matt: false, transparent: false, wide: false },
  { code: 'M7-146', name: 'Ruby', fullName: 'M7-146 Ruby', slug: 'm7-146-ruby', family: 'red', hex: '#d62029', rgb: [214, 32, 41], cmyk: 'C1 M100 Y100 K0', pantone: '2035C', matt: false, transparent: false, wide: false },
  { code: 'M7-145', name: 'Burgundy', fullName: 'M7-145 Burgundy', slug: 'm7-145-burgundy', family: 'red', hex: '#660528', rgb: [102, 5, 40], cmyk: 'C29 M100 Y87 K37', pantone: '1817C', matt: false, transparent: false, wide: false },
  { code: 'M7-147', name: 'Rose', fullName: 'M7-147 Rose', slug: 'm7-147-rose', family: 'red', hex: '#db1e33', rgb: [219, 30, 51], cmyk: 'C0 M100 Y97 K0', pantone: '186C', matt: false, transparent: false, wide: false },
  { code: 'M7-148', name: 'Deep Red', fullName: 'M7-148 Deep Red', slug: 'm7-148-deep-red', family: 'red', hex: '#bc2028', rgb: [188, 32, 40], cmyk: 'C8 M100 Y100 K2', pantone: '200C', matt: false, transparent: false, wide: false },
  { code: 'M7-149', name: 'Crimson', fullName: 'M7-149 Crimson', slug: 'm7-149-crimson', family: 'red', hex: '#d91f33', rgb: [217, 31, 51], cmyk: 'C0 M100 Y98 K0', pantone: '185C', matt: false, transparent: false, wide: false },
  { code: 'M7-150', name: 'Pale Blue', fullName: 'M7-150 Pale Blue', slug: 'm7-150-pale-blue', family: 'blue', hex: '#0ba8d6', rgb: [11, 168, 214], cmyk: 'C98 M5 Y9 K0', pantone: '2915C', matt: false, transparent: false, wide: false },
  { code: 'M7-151', name: 'Olympic', fullName: 'M7-151 Olympic', slug: 'm7-151-olympic', family: 'blue', hex: '#2188c9', rgb: [33, 136, 201], cmyk: 'C99 M31 Y2 K0', pantone: '2925C', matt: false, transparent: false, wide: false },
  { code: 'M7-152', name: 'Ocean', fullName: 'M7-152 Ocean', slug: 'm7-152-ocean', family: 'blue', hex: '#137cbf', rgb: [19, 124, 191], cmyk: 'C100 M44 Y4 K0', pantone: '3005C', matt: false, transparent: false, wide: false },
  { code: 'M7-104', name: 'Azure Blue', fullName: 'M7-104 Azure Blue', slug: 'm7-104-azure-blue', family: 'blue', hex: '#1d62af', rgb: [29, 98, 175], cmyk: 'C100 M69 Y4 K0', pantone: '293C', matt: false, transparent: false, wide: false },
  { code: 'M7-154', name: 'Mid Blue', fullName: 'M7-154 Mid Blue', slug: 'm7-154-mid-blue', family: 'blue', hex: '#005398', rgb: [0, 83, 152], cmyk: 'C100 M80 Y15 K3', pantone: '286C', matt: false, transparent: false, wide: false },
  { code: 'M7-155', name: 'Ultramarine', fullName: 'M7-155 Ultramarine', slug: 'm7-155-ultramarine', family: 'blue', hex: '#1c3c72', rgb: [28, 60, 114], cmyk: 'C100 M88 Y23 K16', pantone: '2747C', matt: false, transparent: false, wide: false },
  { code: 'M7-156', name: 'Navy', fullName: 'M7-156 Navy', slug: 'm7-156-navy', family: 'blue', hex: '#112647', rgb: [17, 38, 71], cmyk: 'C100 M90 Y33 K47', pantone: '2756C', matt: false, transparent: false, wide: false },
  { code: 'M7-157', name: 'Midnight', fullName: 'M7-157 Midnight', slug: 'm7-157-midnight', family: 'blue', hex: '#020e29', rgb: [2, 14, 41], cmyk: 'C87 M77 Y56 K73', pantone: '296C', matt: false, transparent: false, wide: false },
  { code: 'M7-158', name: 'Bright Blue', fullName: 'M7-158 Bright Blue', slug: 'm7-158-bright-blue', family: 'blue', hex: '#0d56a3', rgb: [13, 86, 163], cmyk: 'C100 M82 Y0 K0', pantone: '2736C', matt: false, transparent: false, wide: false },
  { code: 'M7-159', name: 'Sky Blue', fullName: 'M7-159 Sky Blue', slug: 'm7-159-sky-blue', family: 'blue', hex: '#52c8e7', rgb: [82, 200, 231], cmyk: 'C69 M0 Y8 K0', pantone: '2985C', matt: false, transparent: false, wide: false },
  { code: 'M7-160', name: 'Lime', fullName: 'M7-160 Lime', slug: 'm7-160-lime', family: 'green', hex: '#6fc053', rgb: [111, 192, 83], cmyk: 'C74 M0 Y100 K0', pantone: '2285C', matt: false, transparent: false, wide: false },
  { code: 'M7-161', name: 'Grass', fullName: 'M7-161 Grass', slug: 'm7-161-grass', family: 'green', hex: '#22ad4b', rgb: [34, 173, 75], cmyk: 'C100 M1 Y100 K1', pantone: '2424C', matt: false, transparent: false, wide: false },
  { code: 'M7-162', name: 'Emerald', fullName: 'M7-162 Emerald', slug: 'm7-162-emerald', family: 'green', hex: '#138e63', rgb: [19, 142, 99], cmyk: 'C100 M17 Y90 K6', pantone: '3405C', matt: false, transparent: false, wide: false },
  { code: 'M7-163', name: 'Mid Green', fullName: 'M7-163 Mid Green', slug: 'm7-163-mid-green', family: 'green', hex: '#097749', rgb: [9, 119, 73], cmyk: 'C100 M27 Y98 K18', pantone: '341C', matt: false, transparent: false, wide: false },
  { code: 'M7-164', name: 'Forest', fullName: 'M7-164 Forest', slug: 'm7-164-forest', family: 'green', hex: '#05432d', rgb: [5, 67, 45], cmyk: 'C100 M43 Y89 K53', pantone: '7484C', matt: false, transparent: false, wide: false },
  { code: 'M7-165', name: 'Teal', fullName: 'M7-165 Teal', slug: 'm7-165-teal', family: 'green', hex: '#137986', rgb: [19, 121, 134], cmyk: 'C100 M34 Y42 K7', pantone: '7714C', matt: false, transparent: false, wide: false },
  { code: 'M7-166', name: 'Turquoise', fullName: 'M7-166 Turquoise', slug: 'm7-166-turquoise', family: 'green', hex: '#249b99', rgb: [36, 155, 153], cmyk: 'C100 M12 Y47 K1', pantone: '3272C', matt: false, transparent: false, wide: false },
  { code: 'M7-167', name: 'Poseidon', fullName: 'M7-167 Poseidon', slug: 'm7-167-poseidon', family: 'blue', hex: '#16576b', rgb: [22, 87, 107], cmyk: 'C100 M54 Y43 K23', pantone: '3155C', matt: false, transparent: false, wide: false },
  { code: 'M7-168', name: 'Deep Lagoon', fullName: 'M7-168 Deep Lagoon', slug: 'm7-168-deep-lagoon', family: 'green', hex: '#00444f', rgb: [0, 68, 79], cmyk: 'C100 M67 Y47 K42', pantone: '2217C', matt: false, transparent: false, wide: false },
  { code: 'M7-169', name: 'Hunter', fullName: 'M7-169 Hunter', slug: 'm7-169-hunter', family: 'green', hex: '#0e6a40', rgb: [14, 106, 64], cmyk: 'C100 M31 Y98 K28', pantone: '3298C', matt: false, transparent: false, wide: false },
  { code: 'M7-171', name: 'Brown', fullName: 'M7-171 Brown', slug: 'm7-171-brown', family: 'brown', hex: '#472d1e', rgb: [71, 45, 30], cmyk: 'C43 M74 Y85 K56', pantone: '4625C', matt: false, transparent: false, wide: false },
  { code: 'M7-103', name: 'Clay', fullName: 'M7-103 Clay', slug: 'm7-103-clay', family: 'brown', hex: '#d8ceb6', rgb: [216, 206, 182], cmyk: 'C9 M14 Y25 K0', pantone: '4685C', matt: false, transparent: false, wide: false },
  { code: 'M7-189', name: 'Jungle Green', fullName: 'M7-189 Jungle Green', slug: 'm7-189-jungle-green', family: 'green', hex: '#022d1d', rgb: [2, 45, 29], cmyk: 'C91 M53 Y78 K70', pantone: '560C', matt: false, transparent: false, wide: false },
  { code: 'M7-174', name: 'Burnt Sienna', fullName: 'M7-174 Burnt Sienna', slug: 'm7-174-burnt-sienna', family: 'brown', hex: '#7a4822', rgb: [122, 72, 34], cmyk: 'C29 M77 Y99 K24', pantone: '725C', matt: false, transparent: false, wide: false },
  { code: 'M7-175', name: 'Shortbread', fullName: 'M7-175 Shortbread', slug: 'm7-175-shortbread', family: 'brown', hex: '#ffda9b', rgb: [255, 218, 155], cmyk: 'C0 M14 Y41 K0', pantone: '7401C', matt: false, transparent: false, wide: false },
  { code: 'M7-176', name: 'Ivory', fullName: 'M7-176 Ivory', slug: 'm7-176-ivory', family: 'brown', hex: '#e3d6b1', rgb: [227, 214, 177], cmyk: 'C0 M14 Y41 K0', pantone: '7500C', matt: false, transparent: false, wide: false },
  { code: 'M7-170', name: 'Powder Blue', fullName: 'M7-170 Powder Blue', slug: 'm7-170-powder-blue', family: 'blue', hex: '#66b8db', rgb: [102, 184, 219], cmyk: 'C65 M4 Y7 K0', pantone: '283C', matt: false, transparent: false, wide: false },
  { code: 'M7-178', name: 'Viking', fullName: 'M7-178 Viking', slug: 'm7-178-viking', family: 'blue', hex: '#21366e', rgb: [33, 54, 110], cmyk: 'C100 M94 Y18 K18', pantone: '2738C', matt: false, transparent: false, wide: false },
  { code: 'M7-179', name: 'Peach Blossom', fullName: 'M7-179 Peach Blossom', slug: 'm7-179-peach-blossom', family: 'peach', hex: '#ecc0b3', rgb: [236, 192, 179], cmyk: 'C1 M25 Y19 K0', pantone: '489C', matt: false, transparent: false, wide: false },
  { code: 'M7-180', name: 'Lilac', fullName: 'M7-180 Lilac', slug: 'm7-180-lilac', family: 'purple', hex: '#8b70b2', rgb: [139, 112, 178], cmyk: 'C40 M63 Y0 K0', pantone: '2577C', matt: false, transparent: false, wide: false },
  { code: 'M7-181', name: 'Pink', fullName: 'M7-181 Pink', slug: 'm7-181-pink', family: 'pink', hex: '#f086b5', rgb: [240, 134, 181], cmyk: 'C0 M59 Y2 K0', pantone: '210C', matt: false, transparent: false, wide: false },
  { code: 'M7-182', name: 'Magenta', fullName: 'M7-182 Magenta', slug: 'm7-182-magenta', family: 'pink', hex: '#c81f68', rgb: [200, 31, 104], cmyk: 'C2 M99 Y43 K0', pantone: '220C', matt: false, transparent: false, wide: false },
  { code: 'M7-183', name: 'Violet', fullName: 'M7-183 Violet', slug: 'm7-183-violet', family: 'purple', hex: '#4f3e98', rgb: [79, 62, 152], cmyk: 'C82 M98 Y4 K1', pantone: '269C', matt: false, transparent: false, wide: false },
  { code: 'M7-102', name: 'Grape', fullName: 'M7-102 Grape', slug: 'm7-102-grape', family: 'purple', hex: '#581d5b', rgb: [88, 29, 91], cmyk: 'C59 M100 Y35 K25', pantone: '7658C', matt: false, transparent: false, wide: false },
  { code: 'M7-185', name: 'Dark Navy', fullName: 'M7-185 Dark Navy', slug: 'm7-185-dark-navy', family: 'blue', hex: '#021a32', rgb: [2, 26, 50], cmyk: 'C95 M80 Y50 K66', pantone: '2767C', matt: false, transparent: false, wide: false },
  { code: 'M7-186', name: 'Lavender', fullName: 'M7-186 Lavender', slug: 'm7-186-lavender', family: 'purple', hex: '#666099', rgb: [102, 96, 153], cmyk: 'C67 M74 Y11 K1', pantone: '668C', matt: false, transparent: false, wide: false },
  { code: 'M7-187', name: 'Dark Violet', fullName: 'M7-187 Dark Violet', slug: 'm7-187-dark-violet', family: 'purple', hex: '#283377', rgb: [40, 51, 119], cmyk: 'C100 M98 Y21 K11', pantone: '2112C', matt: false, transparent: false, wide: false },
  { code: 'M7-188', name: 'Aquamarine', fullName: 'M7-188 Aquamarine', slug: 'm7-188-aquamarine', family: 'blue', hex: '#56c2b4', rgb: [86, 194, 180], cmyk: 'C83 M0 Y40 K0', pantone: '333C', matt: false, transparent: false, wide: false },
  { code: 'M7-190', name: 'Silver', fullName: 'M7-190 Silver', slug: 'm7-190-silver', family: 'grey', hex: '#6d7879', rgb: [109, 120, 121], cmyk: 'C56 M44 Y44 K9', pantone: 'Cool Grey 6C', matt: false, transparent: false, wide: false },
  { code: 'M7-191', name: 'Gold', fullName: 'M7-191 Gold', slug: 'm7-191-gold', family: 'gold', hex: '#7a6841', rgb: [122, 104, 65], cmyk: 'C39 M51 Y89 K20', pantone: '7557C', matt: false, transparent: false, wide: false },
  { code: 'M7-192', name: 'Charcoal', fullName: 'M7-192 Charcoal', slug: 'm7-192-charcoal', family: 'grey', hex: '#424847', rgb: [66, 72, 71], cmyk: 'C67 M58 Y59 K40', pantone: 'Cool Grey 10C', matt: false, transparent: false, wide: false },
  { code: 'M7-193M', name: 'Gunmetal', fullName: 'M7-193M Gunmetal', slug: 'm7-193m-gunmetal', family: 'grey', hex: '#505253', rgb: [80, 82, 83], cmyk: 'C64 M55 Y56 K31', pantone: 'Cool Grey 9C', matt: true, transparent: false, wide: false },
  { code: 'M7-194', name: 'Steel', fullName: 'M7-194 Steel', slug: 'm7-194-steel', family: 'grey', hex: '#5f6360', rgb: [95, 99, 96], cmyk: 'C60 M51 Y53 K20', pantone: '2332C', matt: false, transparent: false, wide: false },
  { code: 'M7-195', name: 'Aluminium', fullName: 'M7-195 Aluminium', slug: 'm7-195-aluminium', family: 'grey', hex: '#6e757a', rgb: [110, 117, 122], cmyk: 'C55 M44 Y43 K8', pantone: 'Cool Grey 6C', matt: false, transparent: false, wide: false },
  { code: 'M7-196', name: 'Graphite', fullName: 'M7-196 Graphite', slug: 'm7-196-graphite', family: 'grey', hex: '#34393a', rgb: [52, 57, 58], cmyk: 'C70 M60 Y64 K52', pantone: '447C', matt: false, transparent: false, wide: false },
  { code: 'M7-197', name: 'Grasshopper', fullName: 'M7-197 Grasshopper', slug: 'm7-197-grasshopper', family: 'green', hex: '#1ea149', rgb: [30, 161, 73], cmyk: 'C100 M7 Y100 K1', pantone: '354C', matt: false, transparent: false, wide: false },
  { code: 'M7-198', name: 'Nature', fullName: 'M7-198 Nature', slug: 'm7-198-nature', family: 'green', hex: '#9ecc45', rgb: [158, 204, 69], cmyk: 'C45 M1 Y100 K0', pantone: '2291C', matt: false, transparent: false, wide: false },
  { code: 'M7-199', name: 'Apple', fullName: 'M7-199 Apple', slug: 'm7-199-apple', family: 'green', hex: '#4ea447', rgb: [78, 164, 71], cmyk: 'C89 M9 Y100 K2', pantone: '369C', matt: false, transparent: false, wide: false },
];

/** Ficha técnica oficial da linha (Technical Data Sheet Metamark 7 Series). */
export const M7_SPECS: { label: string; value: string }[] = [
  { label: 'Face film', value: '70 micras PVC polimérico calandrado' },
  { label: 'Adesivo', value: 'Apex permanente, acrílico base solvente' },
  { label: 'Liner', value: 'Kraft layflat clay coated, sem solvente' },
  { label: 'Durabilidade', value: '8 anos preto e branco · 7 anos cores · 5 anos metálicos' },
  { label: 'Larguras', value: '380 · 610 · 760 · 1.220 · 1.600 mm' },
  { label: 'Reação ao fogo', value: 'Classe B' },
  { label: 'Observação', value: '1.600 mm disponível apenas em White Gloss, White Matt, Black Gloss e Black Matt' },
];
