-- NZPPF: cruza a página da linha, o catálogo em PDF e as fotos com o produto.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Todo o conteúdo aqui já está publicado no site: as URLs são as rotas reais
-- de /ppf/*, as fotos são as mesmas que as páginas usam, e o catálogo é o
-- portfólio que já existe em src/pages/Ppf/ppfPortfolioRegistry.ts.
--   heroImage e tagline  → src/pages/Ppf/ppfPortfolioConfig.ts
--   acabamentos          → finishesCarousel / finishesData / tonalidades
--
-- Por que a NZPPF ganha um bloco que as outras linhas não têm: é marca
-- própria. Nas linhas de terceiros o material é do fabricante e mora no site
-- dele; aqui a página, o catálogo e a sessão de fotos são nossos, e não fazia
-- sentido o cliente chegar na página do rolo sem caminho nenhum para eles.
--
-- Os comparativos de desempenho continuam FORA daqui: as fotos e a ficha
-- entram, os gráficos "NZ × mercado" não, enquanto não houver ensaio de
-- origem registrado (ver docs/PLANO_FICHA_TECNICA.md §5).
--
-- Aplicada em produção em: 2026-09-07

update public.linhas set
  pagina_url = '/ppf',
  galeria = '[]'::jsonb
where linha_key = 'ppf';

-- --------------------------------------------------------------- luxury
update public.linha_familias set
  pagina_url = '/ppf/luxury-gloss',
  catalogo_slug = 'luxury-gloss',
  galeria = '[
    {"url":"/assets/images/luxury_lambo.png","titulo":"NZPPF Luxury Gloss","sub":"TPU Alifático 190μ · 12 anos de garantia"},
    {"url":"/assets/images/nzppf_super_brilho.png","titulo":"Gloss","sub":"Brilho espelhado vitrificado"},
    {"url":"/assets/images/nzppf_matte.png","titulo":"Matte","sub":"Toque suave aveludado"},
    {"url":"/assets/images/nzppf_black.png","titulo":"Black","sub":"Luxo absoluto profundo"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'luxury';

-- ---------------------------------------------------------------- prime
update public.linha_familias set
  pagina_url = '/ppf/prime-gloss',
  catalogo_slug = 'prime-gloss',
  galeria = '[
    {"url":"/assets/images/nzppf_prime_hero.png","titulo":"NZPPF Prime Gloss","sub":"TPU 100% virgem 190μ · 10 anos de garantia"},
    {"url":"/assets/images/nzppf_prime_brilho.png","titulo":"Gloss","sub":"Brilho intenso e uniforme"},
    {"url":"/assets/images/nzppf_prime_matte.jpg","titulo":"Matte","sub":"Toque suave aveludado"},
    {"url":"/assets/images/nzppf_prime_black.jpg","titulo":"Black Piano","sub":"Profundidade absoluta espelhada"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'prime';

-- ----------------------------------------------------------------- flow
update public.linha_familias set
  pagina_url = '/ppf/flow-gloss',
  catalogo_slug = 'flow-gloss',
  galeria = '[
    {"url":"/assets/images/flow_hero_haval.png","titulo":"NZPPF Flow Gloss","sub":"Formulação G2 185μ · 7 anos de garantia"},
    {"url":"/assets/images/flow_clear_gloss_haval.png","titulo":"Clear Gloss","sub":"Transparente brilho — conserva a cor original"},
    {"url":"/assets/images/flow_clear_matte_haval.png","titulo":"Clear Matte","sub":"Transparente fosco — acetinado macio"},
    {"url":"/assets/images/flow_black_gloss_haval.png","titulo":"Black Gloss","sub":"Opaco brilho — efeito black piano"},
    {"url":"/assets/images/flow_black_matte_haval.png","titulo":"Black Matte","sub":"Opaco fosco — absorção dramática"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'flow';

-- ----------------------------------------------------------------- core
update public.linha_familias set
  pagina_url = '/ppf/core-gloss',
  catalogo_slug = 'core-gloss',
  galeria = '[
    {"url":"/assets/images/core_catalog_car.png","titulo":"NZPPF Core Gloss","sub":"Híbrido 80/20 · 175μ · 3 anos de garantia"},
    {"url":"/assets/images/core_clear_gloss.png","titulo":"Core Gloss","sub":"Brilho espelhado, correção de casca de laranja"},
    {"url":"/assets/images/core_clear_matte.png","titulo":"Core Matte","sub":"Fosco acetinado, difusão macia"},
    {"url":"/assets/images/core_black_gloss.png","titulo":"Core Black","sub":"Preto refletivo, bloqueia a cor original"},
    {"url":"/assets/images/core_black_matte.png","titulo":"Core Black Matte","sub":"Opaco escuro, absorção total"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'core';

-- ----------------------------------------------------------- windshield
update public.linha_familias set
  pagina_url = '/ppf/windshield',
  catalogo_slug = 'windshield',
  galeria = '[
    {"url":"/assets/images/nzppf_windshield_hero.png","titulo":"NZPPF Windshield","sub":"TPU 190μ para parabrisa · 2 anos de garantia"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'windshield';

-- ------------------------------------------------------------ headlight
update public.linha_familias set
  pagina_url = '/ppf/headlight',
  catalogo_slug = 'headlight',
  galeria = '[
    {"url":"/assets/images/nzppf_headlight_light_black.png","titulo":"Light Black","sub":"Escurecimento sutil, sofisticação sem exagero"},
    {"url":"/assets/images/nzppf_headlight_light_gray.png","titulo":"Light Gray","sub":"Tom neutro, grafite quase imperceptível"},
    {"url":"/assets/images/nzppf_headlight_dark_black.png","titulo":"Dark Black","sub":"Presença máxima, fumê escuro de impacto"}
  ]'::jsonb
where linha_key = 'ppf' and familia_key = 'headlight';

-- --------------------------------------------------------------- nz-farol
-- Os 13 SKUs de película de farol vivem em `nz-farol`, não em `ppf`. É a mesma
-- linha comercial da família headlight — mesma página, mesmo catálogo, mesmas
-- fotos.
update public.linhas set
  pagina_url = '/ppf/headlight',
  catalogo_slug = 'headlight',
  galeria = '[
    {"url":"/assets/images/nzppf_headlight_light_black.png","titulo":"Light Black","sub":"Escurecimento sutil, sofisticação sem exagero"},
    {"url":"/assets/images/nzppf_headlight_light_gray.png","titulo":"Light Gray","sub":"Tom neutro, grafite quase imperceptível"},
    {"url":"/assets/images/nzppf_headlight_dark_black.png","titulo":"Dark Black","sub":"Presença máxima, fumê escuro de impacto"}
  ]'::jsonb
where linha_key = 'nz-farol';
