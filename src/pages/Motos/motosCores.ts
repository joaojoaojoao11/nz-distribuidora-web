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
  { sku: 'SPWEGL006', slug: 'speed-wrapping-egl-006-chrome-gloss-purple-spwegl006', marca: 'Speed Wrapping', codigo: 'EGL-006', cor: "Chrome Gloss Purple" },
];
