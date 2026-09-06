// Fotos oficiais das cores SH Wrapping, por slug.
//
// Vive em `lib/data` — e nao dentro da pagina — porque a LOJA tambem consome:
// a pagina do produto mostra estas fotos de veiculo junto do rolo. Enquanto o
// mapa morava no componente, a loja teria de importar a pagina inteira
// (framer-motion, supabase, SEO) para pegar uma lista de URLs.
//
// `image` aponta para o CDN da SignHouse (miniatura 380x300) e so a pagina de
// cores usa. A loja usa apenas `gallery`, que e local em `/assets/images/sh/`.

export interface SHColorData {
  slug: string;
  nameEN: string;
  finish: string;
  hex: string;
  image: string;
  description: string;
  gallery?: {
    suv?: string;
    sedan?: string;
    supercar?: string;
    night?: string;
  };
}

export const SH_COLORS_ASSETS: Record<string, Partial<SHColorData>> = {
  'pearl-metal-space-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-01-380x300-317c406e.jpg', gallery: { suv: '/assets/images/sh/pm_sg_suv_v2.png', sedan: '/assets/images/sh/pm_sg_sedan_v2.png', supercar: '/assets/images/sh/pm_sg_supercar_v2.png' } },
  'fantastic-purple': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-02-380x300-a6d457b5.jpg', gallery: { suv: '/assets/images/sh/fantastic_purple_morning.png', sedan: '/assets/images/sh/fantastic_purple_afternoon.png', supercar: '/assets/images/sh/fantastic_purple_sunset.png', night: '/assets/images/sh/fantastic_purple_night.png' } },
  'amg-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-03-380x300-2bb35afc.jpg', gallery: { suv: '/assets/images/sh/ag_suv_v2.png', sedan: '/assets/images/sh/ag_sedan_v2.png', supercar: '/assets/images/sh/ag_supercar_v2.png' } },
  'mercury-silver': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-04-380x300-3f98b907.jpg', gallery: { suv: '/assets/images/sh/mercury_silver_morning.png', sedan: '/assets/images/sh/mercury_silver_afternoon.png', supercar: '/assets/images/sh/mercury_silver_sunset.png', night: '/assets/images/sh/mercury_silver_night.png' } },
  'pearl-metal-black': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-05-380x300-b2ffb44e.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_black_morning.png', sedan: '/assets/images/sh/pearl_metal_black_afternoon.png', supercar: '/assets/images/sh/pearl_metal_black_sunset.png', night: '/assets/images/sh/pearl_metal_black_night.png' } },
  'soulmoving-red': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-06-380x300-2557a395.jpg', gallery: { suv: '/assets/images/sh/soulmoving_red_suv.jpeg', sedan: '/assets/images/sh/soulmoving_red_sedan.jpeg' } },
  'candy-purple-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-07-380x300-a830aedc.jpg', gallery: { suv: '/assets/images/sh/candy_purple_morning.png', sedan: '/assets/images/sh/candy_purple_afternoon.png', supercar: '/assets/images/sh/candy_purple_sunset.png', night: '/assets/images/sh/candy_purple_night.png' } },
  'matt-dark-purple': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-23-380x300-dba90aca.jpg', gallery: { suv: '/assets/images/sh/matt_dark_purple_morning.png', sedan: '/assets/images/sh/matt_dark_purple_afternoon.png', supercar: '/assets/images/sh/matt_dark_purple_sunset.png', night: '/assets/images/sh/matt_dark_purple_night.png' } },
  'bentley-pink': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-08-380x300-ba1ca466.jpg', gallery: { suv: '/assets/images/sh/bentley_pink_morning.png', sedan: '/assets/images/sh/bentley_pink_afternoon.png', supercar: '/assets/images/sh/bentley_pink_sunset.png', night: '/assets/images/sh/bentley_pink_night.png' } },
  'sao-paulo-yellow': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-09-380x300-377ba92f.jpg', gallery: { suv: '/assets/images/sh/sao_paulo_yellow_suv.jpeg', sedan: '/assets/images/sh/sao_paulo_yellow_sedan.jpeg', supercar: '/assets/images/sh/sao_paulo_yellow_supercar.jpeg', night: '/assets/images/sh/sao_paulo_yellow_night.jpeg' } },
  'fantastic-green-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-10-380x300-c416653c.jpg', gallery: { suv: '/assets/images/sh/fantastic_green_grey_morning.png', sedan: '/assets/images/sh/fantastic_green_grey_afternoon.png', supercar: '/assets/images/sh/fantastic_green_grey_sunset.png', night: '/assets/images/sh/fantastic_green_grey_night.png' } },
  'crystal-glacial-blue': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-11-380x300-49716875.jpg', gallery: { suv: '/assets/images/sh/crystal_glacial_blue_morning.png', sedan: '/assets/images/sh/crystal_glacial_blue_afternoon.png', supercar: '/assets/images/sh/crystal_glacial_blue_sunset.png', night: '/assets/images/sh/crystal_glacial_blue_night.png' } },
  'crystal-yellow': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-21-380x300-c1661058.jpg', gallery: { suv: '/assets/images/sh/crystal_yellow_morning.png', sedan: '/assets/images/sh/crystal_yellow_afternoon.png', supercar: '/assets/images/sh/crystal_yellow_sunset.png', night: '/assets/images/sh/crystal_yellow_night.png' } },
  'crystal-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-12-380x300-ded97fae.jpg', gallery: { suv: '/assets/images/sh/crystal_white_morning.png', sedan: '/assets/images/sh/crystal_white_afternoon.png', supercar: '/assets/images/sh/crystal_white_sunset.png', night: '/assets/images/sh/crystal_white_night.png' } },
  'space-blue-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-30-380x300-340c350a.jpg', gallery: { suv: '/assets/images/sh/space_blue_gloss_suv.jpeg', sedan: '/assets/images/sh/space_blue_gloss_sedan.jpeg', supercar: '/assets/images/sh/space_blue_gloss_supercar.jpeg' } },

  'blue-charm-green': { image: 'https://www.signhouse.com.br/storage/images/cache/blue-charm-green-380x300-2b439023.jpg', gallery: { suv: '/assets/images/sh/blue_charm_green_morning.png', sedan: '/assets/images/sh/blue_charm_green_afternoon.png', supercar: '/assets/images/sh/blue_charm_green_sunset.png', night: '/assets/images/sh/blue_charm_green_night.png' } },
  'pearl-metal-tiffany': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-24-380x300-cf82e931.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_tiffany_suv.jpeg', sedan: '/assets/images/sh/pearl_metal_tiffany_sedan.jpeg', supercar: '/assets/images/sh/pearl_metal_tiffany_supercar.jpeg' } },
  'crystal-silver': { image: 'https://www.signhouse.com.br/storage/images/cache/crystal-silver-380x300-2d0a2fde.jpg', gallery: { suv: '/assets/images/sh/crystal_silver_morning.png', sedan: '/assets/images/sh/crystal_silver_afternoon.png', supercar: '/assets/images/sh/crystal_silver_sunset.png', night: '/assets/images/sh/crystal_silver_night.png' } },
  'paprika-orange': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-17-380x300-d03d86c7.jpg', gallery: { suv: '/assets/images/sh/paprika_orange_gloss_metallic_morning.png', sedan: '/assets/images/sh/paprika_orange_gloss_metallic_afternoon.png', supercar: '/assets/images/sh/paprika_orange_gloss_metallic_sunset.png', night: '/assets/images/sh/paprika_orange_gloss_metallic_night.png' } },
  'combat-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-16-380x300-5d5a8b8e.jpg', gallery: { suv: '/assets/images/sh/combat_green_morning.png', sedan: '/assets/images/sh/combat_green_afternoon.png', supercar: '/assets/images/sh/combat_green_sunset.png', night: '/assets/images/sh/combat_green_night.png' } },
  'khaki-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-28-380x300-4a06f450.jpg', gallery: { suv: '/assets/images/sh/khaki_green_morning.png', sedan: '/assets/images/sh/khaki_green_afternoon.png', supercar: '/assets/images/sh/khaki_green_sunset.png', night: '/assets/images/sh/khaki_green_night.png' } },
  'crystal-champagne-gold': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-20-380x300-4c011d11.jpg', gallery: { suv: '/assets/images/sh/crystal_champagne_gold_morning.png', sedan: '/assets/images/sh/crystal_champagne_gold_afternoon.png', supercar: '/assets/images/sh/crystal_champagne_gold_sunset.png', night: '/assets/images/sh/crystal_champagne_gold_night.png' } },
  'crystal-mamba-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-27-380x300-582afeea.jpg', gallery: { suv: '/assets/images/sh/crystal_mamba_green_morning.png', sedan: '/assets/images/sh/crystal_mamba_green_afternoon.png', supercar: '/assets/images/sh/crystal_mamba_green_sunset.png', night: '/assets/images/sh/crystal_mamba_green_night.png' } },
  'pearl-metal-sakura-pink': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-29-380x300-c761f919.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_sakura_pink_suv_v2.png', sedan: '/assets/images/sh/pearl_metal_sakura_pink_sedan_v2.png', supercar: '/assets/images/sh/pearl_metal_sakura_pink_supercar_v2.png' } },
  'liquid-metal-somato-blue': { image: 'https://www.signhouse.com.br/storage/images/cache/liquid-metal-somato-blue-380x300-deead0e2.png', gallery: { suv: '/assets/images/sh/liquid_metal_somato_blue_morning.png', sedan: '/assets/images/sh/liquid_metal_somato_blue_afternoon.png', supercar: '/assets/images/sh/liquid_metal_somato_blue_sunset.png', night: '/assets/images/sh/liquid_metal_somato_blue_night.png' } },
  'glossy-nado-ash': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-26-380x300-d54df3a3.jpg', gallery: { suv: '/assets/images/sh/glossy_nando_ash_morning.png', sedan: '/assets/images/sh/glossy_nando_ash_afternoon.png', supercar: '/assets/images/sh/glossy_nando_ash_sunset.png', night: '/assets/images/sh/glossy_nando_ash_night.png' } },
  'amg-mountain-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-03-380x300-2bb35afc.jpg', gallery: { suv: '/assets/images/sh/ag_suv_v2.png', sedan: '/assets/images/sh/ag_sedan_v2.png', supercar: '/assets/images/sh/ag_supercar_v2.png' } },

  'pearl-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-14-380x300-4795911c.jpg', gallery: { suv: '/assets/images/sh/pearl_white_suv.jpeg', sedan: '/assets/images/sh/pearl_white_sedan.jpeg', supercar: '/assets/images/sh/pearl_white_supercar.jpeg' } },
  'pearl-metal-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-19-380x300-4f768134.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_white_suv.jpeg', sedan: '/assets/images/sh/pearl_metal_white_sedan.jpeg', supercar: '/assets/images/sh/pearl_metal_white_supercar.jpeg' } },

  'glossy-black': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-13-380x300-53be72e7.jpg', gallery: { suv: '/assets/images/sh/glossy_black_morning.png', sedan: '/assets/images/sh/glossy_black_afternoon.png', supercar: '/assets/images/sh/glossy_black_sunset.png', night: '/assets/images/sh/glossy_black_night.png' } }
};
