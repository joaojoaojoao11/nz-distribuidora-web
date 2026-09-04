-- Perfis de embalagem — pesos derivados de um rolo real medido pela NZ.
--
-- PONTO DE PARTIDA (informado pelo João em 04/09/2026):
--   rolo fechado de adesivo, 1,52 m de largura × 17 m lineares = 13,5 kg
--
-- Disso sai a densidade de área do conjunto rolo + liner + tubete + embalagem:
--   13,5 kg ÷ (1,52 × 17) m² = 13,5 ÷ 25,84 = 0,522446 kg/m²  (~522 g/m²)
--
-- O peso de cada perfil abaixo é essa densidade × a área do rolo. É melhor que
-- o cálculo teórico por micragem porque já embute liner, tubete e embalagem —
-- que pesam e que nenhuma ficha técnica publica.
--
-- ONDE A APROXIMAÇÃO ERRA, e para que lado:
--   - Metamark 7 Series e MD-80 são 70µ contra ~100µ do rolo de referência: o
--     peso sai ALTO (conservador). Frete cotado a mais, nunca a menos.
--   - NZPPF é 150-190µ: o peso sai BAIXO. É o único caso em que a estimativa
--     erra para o lado perigoso — vale pesar um rolo de PPF e corrigir.
--
-- DIÂMETRO: calculado pela espessura enrolada sobre tubete de 3", com folga de
-- embalagem. NÃO É CRÍTICO: conferido caso a caso, o peso REAL vence o cubado
-- em todos os perfis, com folga. O menor margem é o rolo de 17 m, que só
-- passaria a cobrar por cubagem se a embalagem tivesse mais de 17 cm de
-- diâmetro (estimado: 13 cm).
--
-- VALOR DECLARADO: fica em R$ 100 por unidade em todos, que é placeholder. Ele
-- só afeta a parcela de seguro do frete. Ajustar em Admin → Logística quando
-- quiser precisão — é o valor de NF de UM rolo.
--
-- APLICADO em 2026-09-04 no projeto uibjmvkvbthzypgozpcs (via MCP).
-- Rodar no SQL Editor do Supabase (uibjmvkvbthzypgozpcs), depois das migrations
-- 2026-09-03 e 2026-09-04. Tudo continua editável em Admin → Logística.

insert into public.shipping_profiles
  (nome, formato, peso_kg, comprimento_cm, largura_cm, altura_cm, valor_declarado, observacao)
values
  -- ------------------------------------------------- vinil automotivo (wrap)
  ('Rolo NZWRAP 1,52 × 17 m',            'rolo', 13.500, 160, 13, 13, 100,
   'ROLO DE REFERÊNCIA medido pela NZ: 13,5 kg. Base de todos os outros pesos.'),
  ('Rolo SH Wrapping 1,52 × 17 m',       'rolo', 13.500, 160, 13, 13, 100,
   'Mesma classe do rolo de referência. Confirmar se o comprimento é 17 m.'),
  ('Rolo Avery 1,52 × 25 m',             'rolo', 19.853, 160, 14, 14, 100,
   'Comprimento 25 m ASSUMIDO (padrão Avery). Peso derivado da densidade.'),

  -- --------------------------------------------------------- MetaCast (cast)
  ('Rolo MetaCast MCX 1,52 × 15 m',      'rolo', 11.951, 161, 13, 13, 100,
   'Comprimento da ficha técnica (1.525 mm × 15 m). Peso derivado.'),
  ('Rolo MetaCast MCX 1,52 × 30 m',      'rolo', 23.902, 161, 15, 15, 100,
   'Comprimento da ficha técnica (1.525 mm × 30 m). Peso derivado.'),

  -- ------------------------------------------------------- vinil de recorte
  ('Rolo Metamark 7 Series 1,22 × 50 m', 'rolo', 31.869, 130, 16, 16, 100,
   'Filme de 70µ: peso derivado sai CONSERVADOR (para cima). Comprimento assumido.'),
  ('Rolo Metamark MD-80 1,22 × 50 m',    'rolo', 31.869, 130, 16, 16, 100,
   'Comprimento 50 m ASSUMIDO. Peso conservador, mesma razão do 7 Series.'),
  ('Rolo Oracal 651 1,26 × 50 m',        'rolo', 32.914, 134, 16, 16, 100,
   'Comprimento 50 m ASSUMIDO. Peso derivado da densidade.'),
  ('Rolo Oracal 670RA 1,26 × 50 m',      'rolo', 32.914, 134, 16, 16, 100,
   'Comprimento 50 m ASSUMIDO. Peso derivado da densidade.'),

  -- ------------------------------------------------------------- decorativo
  ('Rolo Etherna Decor 1,22 × 25 m',     'rolo', 15.935, 130, 14, 14, 100,
   'Comprimento 25 m ASSUMIDO. Peso derivado da densidade.'),
  ('Rolo SH Decor 1,22 × 25 m',          'rolo', 15.935, 130, 14, 14, 100,
   'Comprimento 25 m ASSUMIDO. Peso derivado da densidade.'),

  -- --------------------------------------------------------------------- PPF
  ('Rolo NZPPF 1,52 × 15 m',             'rolo', 11.912, 160, 14, 14, 100,
   'ATENÇÃO: PPF é 150-190µ, bem mais espesso que o rolo de referência. Este peso provavelmente está SUBestimado — pesar um rolo e corrigir.');

-- ------------------------------------------------- vínculo perfil ↔ linha
--
-- Liga cada perfil à sua linha do catálogo e marca o padrão. O MCX é a única
-- linha com dois perfis (15 m e 30 m) — é o caso que faz aparecer o seletor de
-- formato na página de produto; nas demais a consulta é direta.

insert into public.shipping_profile_lines (profile_id, line_key, is_default)
select p.id, v.line_key, v.is_default
  from (values
    ('Rolo NZWRAP 1,52 × 17 m',            'nzwrap',      true),
    ('Rolo SH Wrapping 1,52 × 17 m',       'sh-wrapping', true),
    ('Rolo Avery 1,52 × 25 m',             'avery',       true),
    ('Rolo MetaCast MCX 1,52 × 15 m',      'mcx',         true),
    ('Rolo MetaCast MCX 1,52 × 30 m',      'mcx',         false),
    ('Rolo Metamark 7 Series 1,22 × 50 m', 'm7',          true),
    ('Rolo Metamark MD-80 1,22 × 50 m',    'md80',        true),
    ('Rolo Oracal 651 1,26 × 50 m',        'oracal-651',  true),
    ('Rolo Oracal 670RA 1,26 × 50 m',      'oracal-670',  true),
    ('Rolo Etherna Decor 1,22 × 25 m',     'etherna',     true),
    ('Rolo SH Decor 1,22 × 25 m',          'sh-decor',    true),
    ('Rolo NZPPF 1,52 × 15 m',             'ppf',         true)
  ) as v(nome, line_key, is_default)
  join public.shipping_profiles p on p.nome = v.nome
on conflict (profile_id, line_key) do nothing;

-- Conferência: as 11 linhas do catálogo têm que aparecer, todas com padrão.
select line_key, count(*) as perfis, bool_or(is_default) as tem_padrao
  from public.shipping_profile_lines
 group by line_key
 order by line_key;
