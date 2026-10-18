-- Coleção NZPPF 2026 · Os Clãs — DADOS da loja (fase C do plano).
--
-- APLICADA em 18/10/2026, depois do deploy da fase B (commit f28d003).
-- Até lá as 20 camisetas continuam com oculto_manual = true (fora da loja).
--
-- Plano: NZ-AGENTES/CLEDNA/casos/2026-10-17_loja-vestuario-plano.md (seção 3.2).
-- Depende de: migrations/2026-10-17c_loja_vestuario.sql (fase A, APLICADA em 17/10/2026).
--
-- O que faz, numa transação só (qualquer contagem errada desfaz TUDO):
--   1. perfil de frete "Camiseta NZPPF (envelope)" ligado à linha `vestuario`;
--      valores-padrão combinados em 17/10 (o João confirma depois; tudo editável
--      em Admin → Logística): 0,35 kg; 30 × 25 × 4 cm; até 3 peças por envelope;
--      +0,25 kg por peça extra; valor declarado R$ 189 por peça; 0 dias de produção;
--   2. reclassifica as 20 linhas que o sync criou sozinho em 17/10 (WRAP/Diversos)
--      como vestuário da coleção, com slug novo, tamanho e a MESMA data do
--      lançamento de src/pages/Colecao/colecaoConfig.ts (LANCAMENTO):
--      2026-10-29 18:00 -03 (21:00 UTC);
--   3. P, G e GG apontam para o M (`pai_id`): o M é a vitrine;
--   4. ficha técnica nas 5 vitrines; descrição e SEO só da Nº 01 (PILOTO, rascunho
--      para o João aprovar antes das outras 4);
--   5. 35 fotos (7 por vitrine) — arquivos já em public/assets/images/colecao-2026/;
--   6. só então tira o oculto_manual. Quem segura até 18:00 do dia 29 é a data.
--
-- Conferir depois de aplicar (antes das 18:00 de 29/10):
--   select count(*) from loja_catalogo where linha_key = 'vestuario';            -- 0
--   select count(*) from loja_catalogo_completo where linha_key = 'vestuario';   -- 20
--   select count(*) from produtos where linha_key = 'vestuario' and pai_id is null; -- 5
--   select count(*) from produto_midia m join produtos p on p.id = m.produto_id
--    where p.linha_key = 'vestuario';                                            -- 35

begin;

-- 0) trava: a fase A tem de estar aplicada
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'produtos' and column_name = 'publicar_em') then
    raise exception 'fase A (2026-10-17c_loja_vestuario.sql) não aplicada: falta produtos.publicar_em';
  end if;
  if (select count(*) from public.produtos where erp_sku like 'NZPPFCAM%') <> 20 then
    raise exception 'esperava 20 produtos NZPPFCAM%%';
  end if;
end $$;

-- 1) perfil de frete da camiseta + vínculo com a linha
with novo as (
  insert into public.shipping_profiles
    (nome, formato, peso_kg, comprimento_cm, largura_cm, altura_cm, valor_declarado,
     dias_producao, itens_por_volume, peso_adicional_kg, observacao)
  values ('Camiseta NZPPF (envelope)', 'caixa', 0.350, 30, 25, 4, 189,
          0, 3, 0.250,
          'Coleção NZPPF 2026. Peso = envelope com 1 camiseta. Valores-padrão de 17/10/2026, a confirmar com o João.')
  returning id
)
insert into public.shipping_profile_lines (profile_id, line_key, is_default)
select id, 'vestuario', true from novo;

-- 2) as 20 linhas (chave = erp_sku); continuam ocultas até o passo 6
with c(n, cla, base, nome) as (values
  ('01', 'Clã do Sol Nascente', 'camiseta-nzppf-2026-01-true-protect', 'Camiseta NZPPF 2026 Nº 01 · True Protect'),
  ('02', 'Clã do Detalhe', 'camiseta-nzppf-2026-02-protected', 'Camiseta NZPPF 2026 Nº 02 · Protected'),
  ('03', 'Clã da Meia-Noite', 'camiseta-nzppf-2026-03-shine-after-dark', 'Camiseta NZPPF 2026 Nº 03 · Shine After Dark'),
  ('04', 'Clã da Fumaça', 'camiseta-nzppf-2026-04-ppf', 'Camiseta NZPPF 2026 Nº 04 · PPF'),
  ('05', 'Clã dos Night Riders', 'camiseta-nzppf-2026-05-emotion-protect', 'Camiseta NZPPF 2026 Nº 05 · Emotion & Protect')
), t(tam, o) as (values ('P', 1), ('M', 2), ('G', 3), ('GG', 4))
update public.produtos p set
  slug             = case when t.tam = 'M' then c.base else c.base || '-' || lower(t.tam) end,
  nome             = c.nome,
  subtitulo        = c.cla,
  marca_exibicao   = 'NZPPF',
  brand_key        = 'nz',
  linha_key        = 'vestuario',
  linha_label      = 'Coleção NZPPF 2026',
  vertical         = 'PPF',
  kind             = 'vestuario',
  aplicacoes       = '{}',
  hex              = null,
  acabamentos      = '{}',
  acabamento_label = null,
  codigo           = p.erp_sku,
  variante         = t.tam,
  ordem            = c.n::int * 10 + t.o,
  origem           = 'manual',
  publicado        = true,
  publicar_em      = '2026-10-29 18:00:00-03'
from c, t
where p.erp_sku = 'NZPPFCAM' || c.n || t.tam;

-- 3) P, G e GG → M
update public.produtos f set pai_id = a.id
  from public.produtos a
 where f.erp_sku like 'NZPPFCAM%' and f.variante <> 'M'
   and a.erp_sku = left(f.erp_sku, 10) || 'M';

-- 4) ficha nas 5 vitrines; descrição e SEO só na Nº 01 (piloto)
update public.produtos set ficha = '[{"label": "Tecido", "value": "Algodão 100%, preta"}, {"label": "Tamanhos", "value": "P, M, G e GG"}, {"label": "Estampa", "value": "Costas, 38 × 56 cm, com a arte do clã"}, {"label": "Peito", "value": "Logo NZPPF com o número e o nome da camiseta"}, {"label": "Etiquetas", "value": "Interna impressa na gola, com o número do clã, e etiqueta de composição"}, {"label": "Acompanha", "value": "Tag e adesivo exclusivos do clã"}]'::jsonb
 where erp_sku like 'NZPPFCAM%M';

update public.produtos set
  descricao = 'Nº 01 TRUE PROTECT · Clã do Sol Nascente. Acorda antes do sol. Camiseta preta 100% algodão com a arte do clã nas costas (38 × 56 cm), logo NZPPF no peito, etiqueta interna com o número do clã, etiqueta de composição, tag e adesivo exclusivos. Coleção NZPPF 2026 · Os Clãs. A lenda do clã está em nzgroup.com.br/colecao.',
  seo_titulo = 'Camiseta NZPPF 2026 Nº 01 True Protect · Clã do Sol Nascente',
  seo_descricao = 'Camiseta preta 100% algodão da Coleção NZPPF 2026. Estampa de 38 × 56 cm nas costas, tag e adesivo exclusivos. Tamanhos P, M, G e GG.'
 where erp_sku = 'NZPPFCAM01M';

-- 5) fotos das vitrines (o gatilho produto_midia_espelho preenche imagem/galeria)
insert into public.produto_midia (produto_id, tipo, url, alt, ordem, capa, largura, altura, origem)
select a.id, 'imagem', f.url, f.alt, f.ordem, f.ordem = 0, f.w, f.h, 'estatico'
  from (values
    ('01', 0, '/assets/images/colecao-2026/cla-1-costas.webp', 'Camiseta preta Nº 01 TRUE PROTECT no cabide, de costas, com a estampa do Clã do Sol Nascente', 1100, 1375),
    ('01', 1, '/assets/images/colecao-2026/cla-1-chave.webp', 'De costas, um homem veste a camiseta Nº 01 True Protect diante do monte Fuji ao nascer do sol, ao lado de um sedã branco parado na serra.', 1200, 1494),
    ('01', 2, '/assets/images/colecao-2026/cla-1-arte.webp', 'Arte da estampa das costas da Nº 01 TRUE PROTECT', 900, 1320),
    ('01', 3, '/assets/images/colecao-2026/cla-1-peito.webp', 'Detalhe do logo NZPPF no peito da camiseta Nº 01 TRUE PROTECT', 900, 476),
    ('01', 4, '/assets/images/colecao-2026/cla-1-etiqueta.webp', 'Etiqueta impressa por dentro da gola da Nº 01, com o número 01 de 05', 900, 596),
    ('01', 5, '/assets/images/colecao-2026/cla-1-tag.webp', 'Tag da camiseta Nº 01 TRUE PROTECT', 500, 865),
    ('01', 6, '/assets/images/colecao-2026/cla-1-adesivo.webp', 'Adesivo recortado do Clã do Sol Nascente', 700, 700),
    ('02', 0, '/assets/images/colecao-2026/cla-2-costas.webp', 'Camiseta preta Nº 02 PROTECTED no cabide, de costas, com a estampa do Clã do Detalhe', 1100, 1375),
    ('02', 1, '/assets/images/colecao-2026/cla-2-chave.webp', 'De costas, um homem com a camiseta Nº 02 Protected inspeciona com uma lanterna a pintura de um esportivo preto num estúdio iluminado.', 1200, 1494),
    ('02', 2, '/assets/images/colecao-2026/cla-2-arte.webp', 'Arte da estampa das costas da Nº 02 PROTECTED', 900, 1320),
    ('02', 3, '/assets/images/colecao-2026/cla-2-peito.webp', 'Detalhe do logo NZPPF no peito da camiseta Nº 02 PROTECTED', 900, 476),
    ('02', 4, '/assets/images/colecao-2026/cla-2-etiqueta.webp', 'Etiqueta impressa por dentro da gola da Nº 02, com o número 02 de 05', 900, 596),
    ('02', 5, '/assets/images/colecao-2026/cla-2-tag.webp', 'Tag da camiseta Nº 02 PROTECTED', 500, 865),
    ('02', 6, '/assets/images/colecao-2026/cla-2-adesivo.webp', 'Adesivo recortado do Clã do Detalhe', 700, 407),
    ('03', 0, '/assets/images/colecao-2026/cla-3-costas.webp', 'Camiseta preta Nº 03 SHINE AFTER DARK no cabide, de costas, com a estampa do Clã da Meia-Noite', 1100, 1375),
    ('03', 1, '/assets/images/colecao-2026/cla-3-chave.webp', 'De costas, um homem com a camiseta Nº 03 Shine After Dark diante da Ponte Estaiada iluminada à noite, ao lado de um esportivo clássico prateado molhado de chuva.', 1200, 1494),
    ('03', 2, '/assets/images/colecao-2026/cla-3-arte.webp', 'Arte da estampa das costas da Nº 03 SHINE AFTER DARK', 900, 1320),
    ('03', 3, '/assets/images/colecao-2026/cla-3-peito.webp', 'Detalhe do logo NZPPF no peito da camiseta Nº 03 SHINE AFTER DARK', 900, 476),
    ('03', 4, '/assets/images/colecao-2026/cla-3-etiqueta.webp', 'Etiqueta impressa por dentro da gola da Nº 03, com o número 03 de 05', 900, 596),
    ('03', 5, '/assets/images/colecao-2026/cla-3-tag.webp', 'Tag da camiseta Nº 03 SHINE AFTER DARK', 500, 865),
    ('03', 6, '/assets/images/colecao-2026/cla-3-adesivo.webp', 'Adesivo recortado do Clã da Meia-Noite', 700, 338),
    ('04', 0, '/assets/images/colecao-2026/cla-4-costas.webp', 'Camiseta preta Nº 04 PPF no cabide, de costas, com a estampa do Clã da Fumaça', 1100, 1375),
    ('04', 1, '/assets/images/colecao-2026/cla-4-chave.webp', 'De costas, um homem com a camiseta Nº 04 PPF assiste a um superesportivo branco fazendo drift no meio da fumaça, ao pôr do sol.', 1200, 1494),
    ('04', 2, '/assets/images/colecao-2026/cla-4-arte.webp', 'Arte da estampa das costas da Nº 04 PPF', 900, 1320),
    ('04', 3, '/assets/images/colecao-2026/cla-4-peito.webp', 'Detalhe do logo NZPPF no peito da camiseta Nº 04 PPF', 900, 476),
    ('04', 4, '/assets/images/colecao-2026/cla-4-etiqueta.webp', 'Etiqueta impressa por dentro da gola da Nº 04, com o número 04 de 05', 900, 596),
    ('04', 5, '/assets/images/colecao-2026/cla-4-tag.webp', 'Tag da camiseta Nº 04 PPF', 500, 865),
    ('04', 6, '/assets/images/colecao-2026/cla-4-adesivo.webp', 'Adesivo recortado do Clã da Fumaça', 700, 541),
    ('05', 0, '/assets/images/colecao-2026/cla-5-costas.webp', 'Camiseta preta Nº 05 EMOTION & PROTECT no cabide, de costas, com a estampa do Clã dos Night Riders', 1100, 1375),
    ('05', 1, '/assets/images/colecao-2026/cla-5-chave.webp', 'De costas, um homem com a camiseta Nº 05 Emotion & Protect na Avenida Paulista molhada e iluminada de neon rosa, segurando o capacete ao lado de uma superbike branca.', 1200, 1494),
    ('05', 2, '/assets/images/colecao-2026/cla-5-arte.webp', 'Arte da estampa das costas da Nº 05 EMOTION & PROTECT', 900, 1320),
    ('05', 3, '/assets/images/colecao-2026/cla-5-peito.webp', 'Detalhe do logo NZPPF no peito da camiseta Nº 05 EMOTION & PROTECT', 900, 476),
    ('05', 4, '/assets/images/colecao-2026/cla-5-etiqueta.webp', 'Etiqueta impressa por dentro da gola da Nº 05, com o número 05 de 05', 900, 596),
    ('05', 5, '/assets/images/colecao-2026/cla-5-tag.webp', 'Tag da camiseta Nº 05 EMOTION & PROTECT', 500, 865),
    ('05', 6, '/assets/images/colecao-2026/cla-5-adesivo.webp', 'Adesivo recortado do Clã dos Night Riders', 700, 315)
  ) f(num, ordem, url, alt, w, h)
  join public.produtos a on a.erp_sku = 'NZPPFCAM' || f.num || 'M';

-- 6) sai do oculto manual: quem segura até 29/10 21:00 UTC é a data (publicar_em)
update public.produtos set oculto_manual = false
 where erp_sku like 'NZPPFCAM%';

-- 7) trava final: qualquer contagem diferente desfaz a transação inteira
do $$
declare v_prod int; v_pais int; v_filhos int; v_midia int; v_vitrine int; v_perfil int;
begin
  select count(*) into v_prod from public.produtos where erp_sku like 'NZPPFCAM%' and linha_key = 'vestuario'
     and kind = 'vestuario' and publicar_em = '2026-10-29 18:00:00-03' and not oculto_manual;
  select count(*) into v_pais from public.produtos where erp_sku like 'NZPPFCAM%' and pai_id is null and variante = 'M';
  select count(*) into v_filhos from public.produtos where erp_sku like 'NZPPFCAM%' and pai_id is not null;
  select count(*) into v_midia from public.produto_midia m join public.produtos p on p.id = m.produto_id
   where p.erp_sku like 'NZPPFCAM%';
  select count(*) into v_vitrine from public.loja_catalogo where linha_key = 'vestuario';
  select count(*) into v_perfil from public.shipping_profile_lines where line_key = 'vestuario' and is_default;
  if v_prod <> 20 or v_pais <> 5 or v_filhos <> 15 or v_midia <> 35 or v_perfil <> 1 then
    raise exception 'contagem errada: produtos=% vitrines=% filhos=% fotos=% perfil=%', v_prod, v_pais, v_filhos, v_midia, v_perfil;
  end if;
  -- antes do lançamento, a vitrine pública não pode ter nenhuma
  if now() < '2026-10-29 18:00:00-03'::timestamptz and v_vitrine <> 0 then
    raise exception 'vazamento: % camisetas na vitrine pública antes do lançamento', v_vitrine;
  end if;
end $$;

commit;
