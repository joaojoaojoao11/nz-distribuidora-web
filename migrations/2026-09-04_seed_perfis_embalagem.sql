-- MODELO de cadastro dos perfis de embalagem — PREENCHER ANTES DE RODAR.
--
-- Por que este arquivo existe: sem perfil cadastrado, NENHUM produto mostra
-- prazo nem valor de frete (o endpoint responde 404 'sem-perfil' e o bloco some
-- da página, de propósito). São ~11 linhas de catálogo para cadastrar, e fazer
-- isso pelo modal do admin uma a uma é lento — aqui sai de uma vez.
--
-- O QUE JÁ ESTÁ PREENCHIDO: as larguras vêm da ficha técnica de cada linha, que
-- está no próprio código do site (specs de src/lib/data/*). O comprimento da
-- embalagem é a largura do rolo + folga de embalagem.
--
-- O QUE VOCÊ PRECISA PREENCHER: o PESO de cada rolo e o diâmetro real da
-- embalagem. Nenhum dos dois está na ficha técnica, e chutar peso é o caminho
-- mais curto para cotar frete errado — a Jadlog cobra pelo maior peso entre o
-- real e o cubado. Os valores abaixo estão como 0 justamente para o INSERT
-- falhar (há CHECK peso_kg > 0) caso alguém rode sem preencher.
--
-- Depois de rodar, tudo continua editável em Admin → Logística.
--
-- Rodar no SQL Editor do Supabase (projeto uibjmvkvbthzypgozpcs), DEPOIS das
-- migrations 2026-09-03 e 2026-09-04.

-- ------------------------------------------------------------------ perfis
--
-- Colunas: nome, formato, peso_kg, comprimento_cm, largura_cm, altura_cm,
--          valor_declarado, observacao
--
-- comprimento_cm = largura do rolo + folga (o rolo viaja deitado sobre o eixo)
-- largura_cm e altura_cm = diâmetro da embalagem
-- valor_declarado = valor de NF aproximado de UM rolo (afeta o seguro do frete)

insert into public.shipping_profiles
  (nome, formato, peso_kg, comprimento_cm, largura_cm, altura_cm, valor_declarado, observacao)
values
  -- ---------------------------------------------------- vinil automotivo
  ('Rolo NZWRAP 1,52 × 18 m',      'rolo', 0 /* PESO */, 160, 20, 20, 100, 'PREENCHER peso e diâmetro'),
  ('Rolo MetaCast MCX 1,52 × 15 m','rolo', 0 /* PESO */, 160, 18, 18, 100, 'Ficha: 100µ cast, rolo 1.525 mm × 15 m'),
  ('Rolo MetaCast MCX 1,52 × 30 m','rolo', 0 /* PESO */, 160, 24, 24, 100, 'Ficha: 100µ cast, rolo 1.525 mm × 30 m'),
  ('Rolo SH Wrapping 1,52 × 18 m', 'rolo', 0 /* PESO */, 160, 20, 20, 100, 'PREENCHER peso e diâmetro'),
  ('Rolo Avery 1,52 × 25 m',       'rolo', 0 /* PESO */, 160, 22, 22, 100, 'PREENCHER peso e diâmetro'),

  -- ------------------------------------------------------ vinil de recorte
  ('Rolo Metamark 7 Series 1,22 × 50 m', 'rolo', 0 /* PESO */, 130, 22, 22, 100, 'Ficha: 70µ polimérico, larguras 380/610/760/1220/1600 mm'),
  ('Rolo Oracal 651 1,26 × 50 m',        'rolo', 0 /* PESO */, 134, 22, 22, 100, 'PREENCHER peso e diâmetro'),
  ('Rolo Oracal 670RA 1,26 × 50 m',      'rolo', 0 /* PESO */, 134, 22, 22, 100, 'PREENCHER peso e diâmetro'),
  ('Rolo Metamark MD-80 1,22 × 50 m',    'rolo', 0 /* PESO */, 130, 22, 22, 100, 'PREENCHER peso e diâmetro'),

  -- ------------------------------------------------------------ decorativo
  ('Rolo Etherna Decor 1,22 × 25 m', 'rolo', 0 /* PESO */, 130, 20, 20, 100, 'PREENCHER peso e diâmetro'),
  ('Rolo SH Decor 1,22 × 25 m',      'rolo', 0 /* PESO */, 130, 20, 20, 100, 'PREENCHER peso e diâmetro'),

  -- ------------------------------------------------------------------ PPF
  ('Rolo NZPPF 1,52 × 15 m', 'rolo', 0 /* PESO */, 160, 22, 22, 100, 'Ficha: 150-190µ. PPF é mais pesado que vinil na mesma metragem');

-- ------------------------------------------------- vínculo perfil ↔ linha
--
-- Liga cada perfil à sua linha do catálogo e marca o padrão. Uma linha com dois
-- perfis (o MCX, com rolo de 15 m e de 30 m) mostra o seletor de formato na
-- página de produto; com um perfil só, consulta direto.

insert into public.shipping_profile_lines (profile_id, line_key, is_default)
select p.id, v.line_key, v.is_default
  from (values
    ('Rolo NZWRAP 1,52 × 18 m',             'nzwrap',      true),
    ('Rolo MetaCast MCX 1,52 × 15 m',       'mcx',         true),
    ('Rolo MetaCast MCX 1,52 × 30 m',       'mcx',         false),
    ('Rolo SH Wrapping 1,52 × 18 m',        'sh-wrapping', true),
    ('Rolo Avery 1,52 × 25 m',              'avery',       true),
    ('Rolo Metamark 7 Series 1,22 × 50 m',  'm7',          true),
    ('Rolo Oracal 651 1,26 × 50 m',         'oracal-651',  true),
    ('Rolo Oracal 670RA 1,26 × 50 m',       'oracal-670',  true),
    ('Rolo Metamark MD-80 1,22 × 50 m',     'md80',        true),
    ('Rolo Etherna Decor 1,22 × 25 m',      'etherna',     true),
    ('Rolo SH Decor 1,22 × 25 m',           'sh-decor',    true),
    ('Rolo NZPPF 1,52 × 15 m',              'ppf',         true)
  ) as v(nome, line_key, is_default)
  join public.shipping_profiles p on p.nome = v.nome
on conflict (profile_id, line_key) do nothing;

-- Conferência: as 11 linhas do catálogo devem aparecer aqui, sem nenhuma
-- faltando. O painel admin mostra o mesmo alerta em vermelho.
select line_key, count(*) as perfis, bool_or(is_default) as tem_padrao
  from public.shipping_profile_lines
 group by line_key
 order by line_key;
