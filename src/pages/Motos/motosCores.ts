// Cores da Ação Moto: as que têm pedaço — rolo aberto no pátio da NZ ou no
// estoque do parceiro Inova (Jardel). Pedido do João em 2026-10-03: "as cores
// que tenham pedaço tenham 3 fotos de motos envelopadas" e uma página para
// incentivar a saída dos fracionados.
//
// Ordem = mais metragem primeiro (o que mais precisa sair). A metragem em si NÃO
// vai para a página: é dado interno (a bolinha vermelha/laranja do admin).
// As fotos estão em public/assets/images/shop/motos/<slug>-moto-<1|2|3>.webp e
// também na galeria de cada produto (produto_midia).
//
// Lista mantida pela Cledna: quando a lista do parceiro mudar e uma cor nova
// ganhar fotos de moto, ela entra aqui.

export interface CorMoto {
  sku: string;
  slug: string;
  marca: string;
  codigo: string;
  cor: string;
}

export const fotoMoto = (slug: string, n: 1 | 2 | 3) => `/assets/images/shop/motos/${slug}-moto-${n}.webp`;

export const CORES_MOTO: CorMoto[] = [
  { sku: 'SPWESG001', slug: 'speed-wrapping-esg-001-super-gloss-piano-black-pet-spwesg001', marca: 'Speed Wrapping', codigo: 'ESG-001', cor: "Super Gloss Piano Black" },
  { sku: 'SPWEGL012', slug: 'speed-wrapping-egl-012-chrome-gloss-light-blue-spwegl012', marca: 'Speed Wrapping', codigo: 'EGL-012', cor: "Chrome Gloss Light Blue" },
  { sku: 'SPWEGL011', slug: 'speed-wrapping-egl-011-chrome-gloss-blue-spwegl011', marca: 'Speed Wrapping', codigo: 'EGL-011', cor: "Chrome Gloss Blue" },
  { sku: 'SPWEMG012', slug: 'speed-wrapping-emg-012-satin-metallic-glossy-emerald-pet-spwemg012', marca: 'Speed Wrapping', codigo: 'EMG-012', cor: "Satin Metallic Glossy Emerald" },
  { sku: 'SPWEMG017', slug: 'speed-wrapping-emg-017-satin-metallic-glossy-mistblue-pet-spwemg017', marca: 'Speed Wrapping', codigo: 'EMG-017', cor: "Satin Metallic Glossy Mistblue" },
  { sku: 'SPWEMA005', slug: 'speed-wrapping-ema-005-matt-lemon-green-spwema005', marca: 'Speed Wrapping', codigo: 'EMA-005', cor: "Matt Lemon Green" },
  { sku: 'SPWEGL009', slug: 'speed-wrapping-egl-009-chrome-gloss-green-spwegl009', marca: 'Speed Wrapping', codigo: 'EGL-009', cor: "Chrome Gloss Green" },
  { sku: 'SPWEGL007', slug: 'speed-wrapping-egl-007-chrome-gloss-orange-spwegl007', marca: 'Speed Wrapping', codigo: 'EGL-007', cor: "Chrome Gloss Orange" },
  { sku: 'ORA670070G', slug: 'oracal-670-black-g', marca: 'Oracal 670RA', codigo: '670-070', cor: "Black Gloss" },
  { sku: 'SPWEDG016', slug: 'speed-wrapping-edg-016-metal-space-silver-pet-spwedg016', marca: 'Speed Wrapping', codigo: 'EDG-016', cor: "Metal Space Silver" },
  { sku: 'SPWEGL005', slug: 'speed-wrapping-egl-005-chrome-gloss-pink-spwegl005', marca: 'Speed Wrapping', codigo: 'EGL-005', cor: "Chrome Gloss Pink" },
  { sku: 'SPWEGL008', slug: 'speed-wrapping-egl-008-chrome-gloss-gold-spwegl008', marca: 'Speed Wrapping', codigo: 'EGL-008', cor: "Chrome Gloss Gold" },
  { sku: 'SPWECC005', slug: 'speed-wrapping-ecc-005-chameleon-blue-purple-pet-spwecc005', marca: 'Speed Wrapping', codigo: 'ECC-005', cor: "Chameleon Blue Purple" },
  { sku: 'SPWEDG014', slug: 'speed-wrapping-edg-014-metallic-champane-pet-spwedg014', marca: 'Speed Wrapping', codigo: 'EDG-014', cor: "Metallic Champagne" },
  { sku: 'SPWEFG004', slug: 'speed-wrapping-efg-004-magic-flip-grey-blue-pet-spwefg004', marca: 'Speed Wrapping', codigo: 'EFG-004', cor: "Magic Flip Grey Blue" },
  { sku: 'SPWEHM002', slug: 'speed-wrapping-ehm-002-chrome-metallic-rose-red-pet-spwehm002', marca: 'Speed Wrapping', codigo: 'EHM-002', cor: "Chrome Metallic Rose Red" },
  { sku: 'SPWEMA015', slug: 'speed-wrapping-ema-015-matt-red-spwema015', marca: 'Speed Wrapping', codigo: 'EMA-015', cor: "Matt Red" },
  { sku: 'SPWEMT010', slug: 'speed-wrapping-emt-010-satin-metallic-matt-rose-gold-spwemt010', marca: 'Speed Wrapping', codigo: 'EMT-010', cor: "Satin Metallic Matt Rose Gold" },
  { sku: 'MCX66', slug: 'mcx-66-army-olive', marca: 'Metamark MCX', codigo: 'MCX 66', cor: "Army Olive" },
  { sku: 'SPWEDG017', slug: 'speed-wrapping-edg-017-metal-midnigth-plurple-spwedg017', marca: 'Speed Wrapping', codigo: 'EDG-017', cor: "Metal Midnight Purple" },
  { sku: 'SPWELS001', slug: 'speed-wrapping-els-001-laser-chrome-black-pet-spwels001', marca: 'Speed Wrapping', codigo: 'ELS-001', cor: "Laser Chrome Black" },
  { sku: 'SPWEMR003', slug: 'speed-wrapping-emr-003-chrome-mirror-blue-spwemr003', marca: 'Speed Wrapping', codigo: 'EMR-003', cor: "Chrome Mirror Blue" },
  { sku: 'SPWESG020', slug: 'speed-wrapping-esg-020-super-gloss-mclaren-orange-pet-spwesg020', marca: 'Speed Wrapping', codigo: 'ESG-020', cor: "Super Gloss Mclaren Orange" },
  { sku: 'SPWECH007', slug: 'speed-wrapping-ech-007-chrome-matte-blue-spwech007', marca: 'Speed Wrapping', codigo: 'ECH-007', cor: "Chrome Matte Blue" },
  { sku: 'ORA670066G', slug: 'oracal-670-turquoise-g', marca: 'Oracal 670RA', codigo: '670-066', cor: "Turquoise Gloss" },
  { sku: 'SPWEMG015', slug: 'speed-wrapping-emg-015-satin-metallic-glossy-magic-blue-pet-spwemg015', marca: 'Speed Wrapping', codigo: 'EMG-015', cor: "Satin Metallic Glossy Magic Blue" },
  { sku: 'SPWESG004', slug: 'speed-wrapping-esg-004-super-gloss-ferrari-red-pet-spwesg004', marca: 'Speed Wrapping', codigo: 'ESG-004', cor: "Super Gloss Ferrari Red" },
  { sku: 'SPWECH005', slug: 'speed-wrapping-ech-005-chrome-matte-brown-spwech005', marca: 'Speed Wrapping', codigo: 'ECH-005', cor: "Chrome Matte Brown" },
  { sku: 'SPWECC007', slug: 'speed-wrapping-ecc-007-chameleon-purple-blue-pet-spwecc007', marca: 'Speed Wrapping', codigo: 'ECC-007', cor: "Chameleon Purple Blue" },
  { sku: 'SPWEMT017', slug: 'speed-wrapping-emt-017-satin-metallic-matt-sea-blue-spwemt017', marca: 'Speed Wrapping', codigo: 'EMT-017', cor: "Satin Metallic Matt Sea Blue" },
  { sku: 'SPWEMG004', slug: 'speed-wrapping-emg-004-satin-metallic-glossy-grey-pet-spwemg004', marca: 'Speed Wrapping', codigo: 'EMG-004', cor: "Satin Metallic Glossy Grey" },
  { sku: 'SPWEMT012', slug: 'speed-wrapping-emt-012-satin-metallic-matt-royal-green-spwemt012', marca: 'Speed Wrapping', codigo: 'EMT-012', cor: "Satin Metallic Matt Royal Green" },
  { sku: 'SPWEMT025', slug: 'speed-wrapping-emt-025-satin-metallic-matt-deep-blue-spwemt025', marca: 'Speed Wrapping', codigo: 'EMT-025', cor: "Satin Metallic Matt Deep Blue" },
  { sku: 'SPWESG010', slug: 'speed-wrapping-esg-010-super-gloss-denim-blue-pet-spwesg010', marca: 'Speed Wrapping', codigo: 'ESG-010', cor: "Super Gloss Denim Blue" },
  { sku: 'SPWESG016', slug: 'speed-wrapping-esg-016-super-gloss-sunflower-yellow-pet-spwesg016', marca: 'Speed Wrapping', codigo: 'ESG-016', cor: "Super Gloss Sunflower Yellow" },
  { sku: 'SPWEMT009', slug: 'speed-wrapping-emt-009-satin-metallic-matt-maple-leaf-yellow-spwemt009', marca: 'Speed Wrapping', codigo: 'EMT-009', cor: "Satin Metallic Matt Maple Leaf Yellow" },
  { sku: 'SHSR-101', slug: 'sh-soulmoving-red', marca: 'SH Wrapping', codigo: 'SHSR-101', cor: "Soulmoving Red" },
  { sku: 'SPWEGF002', slug: 'speed-wrapping-egf-002-gloss-carbon-black-pet-spwegf002', marca: 'Speed Wrapping', codigo: 'EGF-002', cor: "Gloss Carbon Black" },
  { sku: 'SPWEDG008', slug: 'speed-wrapping-edg-008-metallic-lamborghini-blue-blast-purple-spwedg008', marca: 'Speed Wrapping', codigo: 'EDG-008', cor: "Metallic Lamborghini Blue Blast Purple" },
  { sku: 'SPWEHM001', slug: 'speed-wrapping-ehm-001-chrome-metallic-gold-pet-spwehm001', marca: 'Speed Wrapping', codigo: 'EHM-001', cor: "Chrome Metallic Gold" },
  { sku: 'SPWEMG003', slug: 'speed-wrapping-emg-003-satin-metallic-glossy-coal-grey-pet-spwemg003', marca: 'Speed Wrapping', codigo: 'EMG-003', cor: "Satin Metallic Glossy Coal Grey" },
  { sku: 'SPWEMT013', slug: 'speed-wrapping-emt-013-satin-metallic-matt-emerald-spwemt013', marca: 'Speed Wrapping', codigo: 'EMT-013', cor: "Satin Metallic Matt Emerald" },
  { sku: 'SPWEOX004', slug: 'speed-wrapping-eox-004-oxide-dusk-purple-spweox004', marca: 'Speed Wrapping', codigo: 'EOX-004', cor: "Oxide Dusk Purple" },
  { sku: 'SPWESG011', slug: 'speed-wrapping-esg-011-super-gloss-miami-blue-pet-spwesg011', marca: 'Speed Wrapping', codigo: 'ESG-011', cor: "Super Gloss Miami Blue" },
  { sku: 'SPWESG036', slug: 'speed-wrapping-esg-036-super-gloss-armor-green-pet-spwesg036', marca: 'Speed Wrapping', codigo: 'ESG-036', cor: "Super Gloss Armor Green" },
  { sku: 'SPWECH004', slug: 'speed-wrapping-ech-004-chrome-matte-rose-red-spwech004', marca: 'Speed Wrapping', codigo: 'ECH-004', cor: "Chrome Matte Rose Red" },
  { sku: 'SPWECH011', slug: 'speed-wrapping-ech-011-chrome-matte-black-spwech011', marca: 'Speed Wrapping', codigo: 'ECH-011', cor: "Chrome Matte Black" },
  { sku: 'SPWEDG006', slug: 'speed-wrapping-edg-006-metallic-porshe-urban-green-pet-spwedg006', marca: 'Speed Wrapping', codigo: 'EDG-006', cor: "Metallic Porsche Urban Green" },
  { sku: 'SPWEDG021', slug: 'speed-wrapping-edg-021-metal-blue-berry-pet-spwedg021', marca: 'Speed Wrapping', codigo: 'EDG-021', cor: "Metal Blue Berry" },
  { sku: 'SPWEMG006', slug: 'speed-wrapping-emg-006-satin-metallic-glossy-orange-pet-spwemg006', marca: 'Speed Wrapping', codigo: 'EMG-006', cor: "Satin Metallic Glossy Orange" },
  { sku: 'SPWEMR006', slug: 'speed-wrapping-emr-006-chrome-mirror-gold-spwemr006', marca: 'Speed Wrapping', codigo: 'EMR-006', cor: "Chrome Mirror Gold" },
  { sku: 'SPWESG017', slug: 'speed-wrapping-esg-017-super-gloss-maize-yellow-pet-spwesg017', marca: 'Speed Wrapping', codigo: 'ESG-017', cor: "Super Gloss Maize Yellow" },
  { sku: 'SPWESG021', slug: 'speed-wrapping-esg-021-super-gloss-beetroot-red-pet-spwesg021', marca: 'Speed Wrapping', codigo: 'ESG-021', cor: "Super Gloss Beetroot Red" },
  { sku: 'SPWEGL006', slug: 'speed-wrapping-egl-006-chrome-gloss-purple-spwegl006', marca: 'Speed Wrapping', codigo: 'EGL-006', cor: "Chrome Gloss Purple" },
  { sku: 'ORA670072G', slug: 'oracal-670-light-grey-g', marca: 'Oracal 670RA', codigo: '670-072', cor: "Light Grey Gloss" },
  { sku: 'SPWEDG003', slug: 'speed-wrapping-edg-003-metallic-mountain-green-pet-spwedg003', marca: 'Speed Wrapping', codigo: 'EDG-003', cor: "Metallic Mountain Green" },
  { sku: 'SPWEDG004', slug: 'speed-wrapping-edg-004-metallic-isle-of-man-green-pet-spwedg004', marca: 'Speed Wrapping', codigo: 'EDG-004', cor: "Metallic Isle Of Man Green" },
  { sku: 'SPWEDG010', slug: 'speed-wrapping-edg-010-metallic-gentian-blue-pet-spwedg010', marca: 'Speed Wrapping', codigo: 'EDG-010', cor: "Metallic Gentian Blue" },
  { sku: 'SPWELS005', slug: 'speed-wrapping-els-005-laser-chrome-purple-pet-spwels005', marca: 'Speed Wrapping', codigo: 'ELS-005', cor: "Laser Chrome Purple" },
  { sku: 'SPWEOX003', slug: 'speed-wrapping-eox-003-oxide-ghost-venom-green-spweox003', marca: 'Speed Wrapping', codigo: 'EOX-003', cor: "Oxide Ghost Venom Green" },
  { sku: 'SPWEHM009', slug: 'speed-wrapping-ehm-009-chrome-metallic-romani-red-pet-spwehm009', marca: 'Speed Wrapping', codigo: 'EHM-009', cor: "Chrome Metallic Romani Red" },
  { sku: 'SPWECH003', slug: 'speed-wrapping-ech-003-chrome-matte-red-spwech003', marca: 'Speed Wrapping', codigo: 'ECH-003', cor: "Chrome Matte Red" },
  { sku: 'SPWEFG006', slug: 'speed-wrapping-efg-006-magic-crystal-white-gold-pet-spwefg006', marca: 'Speed Wrapping', codigo: 'EFG-006', cor: "Magic Crystal White Gold" },
  { sku: 'SPWEMG008', slug: 'speed-wrapping-emg-008-satin-metallic-glossy-champagne-pet-spwemg008', marca: 'Speed Wrapping', codigo: 'EMG-008', cor: "Satin Metallic Glossy Champagne" },
  { sku: 'SPWEMT011', slug: 'speed-wrapping-emt-011-satin-metallic-matt-grape-purple-spwemt011', marca: 'Speed Wrapping', codigo: 'EMT-011', cor: "Satin Metallic Matt Grape Purple" },
  { sku: 'SPWESG023', slug: 'speed-wrapping-esg-023-super-gloss-peach-pink-pet-spwesg023', marca: 'Speed Wrapping', codigo: 'ESG-023', cor: "Super Gloss Peach Pink" },
  { sku: 'SPWECH002', slug: 'speed-wrapping-ech-002-chrome-matte-orange-spwech002', marca: 'Speed Wrapping', codigo: 'ECH-002', cor: "Chrome Matte Orange" },
  { sku: 'ORA670031G', slug: 'oracal-670-red-g', marca: 'Oracal 670RA', codigo: '670-031', cor: "Red Gloss" },
  { sku: 'SPWECG003', slug: 'speed-wrapping-ecg-003-candy-gold-lemon-yellow-pet-spwecg003', marca: 'Speed Wrapping', codigo: 'ECG-003', cor: "Candy Gold Lemon Yellow" },
  { sku: 'SPWEGL001', slug: 'speed-wrapping-egl-001-chrome-gloss-silver-spwegl001', marca: 'Speed Wrapping', codigo: 'EGL-001', cor: "Chrome Gloss Silver" },
  { sku: 'SPWESG008', slug: 'speed-wrapping-esg-008-super-gloss-light-lime-green-pet-spwesg008', marca: 'Speed Wrapping', codigo: 'ESG-008', cor: "Super Gloss Light Lime Green" },
  { sku: 'SPWECC006', slug: 'speed-wrapping-ecc-006-chameleon-purple-red-pet-spwecc006', marca: 'Speed Wrapping', codigo: 'ECC-006', cor: "Chameleon Purple Red" },
  { sku: 'SPWECC003', slug: 'speed-wrapping-ecc-003-chameleon-chrome-blue-spwecc003', marca: 'Speed Wrapping', codigo: 'ECC-003', cor: "Chameleon Chrome Blue" },
  { sku: 'SPWEGH004', slug: 'speed-wrapping-egh-004-phontom-shadow-black-blue-spwegh004', marca: 'Speed Wrapping', codigo: 'EGH-004', cor: "Phantom Shadow Black Blue" },
  { sku: 'SPWEMG005', slug: 'speed-wrapping-emg-005-satin-metallic-glossy-fire-red-pet-spwemg005', marca: 'Speed Wrapping', codigo: 'EMG-005', cor: "Satin Metallic Glossy Fire Red" },
  { sku: 'SPWEMG013', slug: 'speed-wrapping-emg-013-satin-metallic-glossy-blueberry-pet-spwemg013', marca: 'Speed Wrapping', codigo: 'EMG-013', cor: "Satin Metallic Glossy Blueberry" },
  { sku: 'SHBC-108', slug: 'sh-combat-green', marca: 'SH Wrapping', codigo: 'SHBC-108', cor: "Combat Green" },
  { sku: 'SHSM-118', slug: 'sh-candy-purple-gloss-aluminium', marca: 'SH Wrapping', codigo: 'SHSM-118', cor: "Candy Purple Gloss Aluminium" },
  { sku: 'ORA670070M', slug: 'oracal-670-black-m', marca: 'Oracal 670RA', codigo: '670-070', cor: "Black Matte" },
  { sku: 'ORA670025G', slug: 'oracal-670-brimstone-yellow-g', marca: 'Oracal 670RA', codigo: '670-025', cor: "Brimstone Yellow Gloss" },
  { sku: 'SPWEGF005', slug: 'speed-wrapping-egf-005-carbon-gloss-3d-spwegf005', marca: 'Speed Wrapping', codigo: 'EGF-005', cor: "Carbon Gloss 3D" },
  { sku: 'SPWEMG014', slug: 'speed-wrapping-emg-014-satin-metallic-glossy-sapphire-pet-spwemg014', marca: 'Speed Wrapping', codigo: 'EMG-014', cor: "Satin Metallic Glossy Sapphire" },
  { sku: 'SPWEMG016', slug: 'speed-wrapping-emg-016-satin-metallic-glossy-seablue-pet-spwemg016', marca: 'Speed Wrapping', codigo: 'EMG-016', cor: "Satin Metallic Glossy Seablue" },
  { sku: 'SPWEMT003', slug: 'speed-wrapping-emt-003-satin-metallic-matt-carbon-grey-spwemt003', marca: 'Speed Wrapping', codigo: 'EMT-003', cor: "Satin Metallic Matt Carbon Grey" },
  { sku: 'ORA670010G', slug: 'oracal-670-white-g', marca: 'Oracal 670RA', codigo: '670-010', cor: "White Gloss" },
  { sku: 'SPWECG007', slug: 'speed-wrapping-ecg-007-candy-gold-blue-chameleon-pet-spwecg007', marca: 'Speed Wrapping', codigo: 'ECG-007', cor: "Candy Gold Blue Chameleon" },
  { sku: 'SPWEGL004', slug: 'speed-wrapping-egl-004-chrome-gloss-rose-red-spwegl004', marca: 'Speed Wrapping', codigo: 'EGL-004', cor: "Chrome Gloss Rose Red" },
  { sku: 'SPWEMA001', slug: 'speed-wrapping-ema-001-matt-white-spwema001', marca: 'Speed Wrapping', codigo: 'EMA-001', cor: "Matt White" },
  { sku: 'SPWEDG011', slug: 'speed-wrapping-edg-011-metallic-grey-pet-spwedg011', marca: 'Speed Wrapping', codigo: 'EDG-011', cor: "Metallic Grey" },
  { sku: 'SPWESG003', slug: 'speed-wrapping-esg-003-super-gloss-porsche-rouge-red-pet-spwesg003', marca: 'Speed Wrapping', codigo: 'ESG-003', cor: "Super Gloss Porsche Rouge Red" },
  { sku: 'SPWEMT026', slug: 'speed-wrapping-emt-026-satin-ceramic-black-pet-spwemt026', marca: 'Speed Wrapping', codigo: 'EMT-026', cor: "Satin Ceramic Black" },
  { sku: 'SPWEDG002', slug: 'speed-wrapping-edg-002-metallic-soul-red-pet-spwedg002', marca: 'Speed Wrapping', codigo: 'EDG-002', cor: "Metallic Soul Red" },
  { sku: 'SPWEGF004', slug: 'speed-wrapping-egf-004-matte-carbon-black-pet-spwegf004', marca: 'Speed Wrapping', codigo: 'EGF-004', cor: "Matte Carbon Black" },
];
