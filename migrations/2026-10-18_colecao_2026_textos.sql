-- Coleção NZPPF 2026: descrição e SEO das vitrines Nº 02 a 05, no modelo da Nº 01
-- (piloto aprovado pelo João em 18/10/2026). Aplicada em 18/10/2026 no banco do site.
begin;
update public.produtos set
  descricao = $t$Nº 02 PROTECTED · Clã do Detalhe. Repara em tudo. Camiseta preta 100% algodão com a arte do clã nas costas (38 × 56 cm), logo NZPPF no peito, etiqueta interna com o número do clã, etiqueta de composição, tag e adesivo exclusivos. Coleção NZPPF 2026 · Os Clãs. A lenda do clã está em nzgroup.com.br/colecao.$t$,
  seo_titulo = $t$Camiseta NZPPF 2026 Nº 02 Protected · Clã do Detalhe$t$,
  seo_descricao = $t$Camiseta preta 100% algodão da Coleção NZPPF 2026. Estampa de 38 × 56 cm nas costas, tag e adesivo exclusivos. Tamanhos P, M, G e GG.$t$
 where erp_sku = 'NZPPFCAM02M';
update public.produtos set
  descricao = $t$Nº 03 SHINE AFTER DARK · Clã da Meia-Noite. Só brilha depois da meia-noite. Camiseta preta 100% algodão com a arte do clã nas costas (38 × 56 cm), logo NZPPF no peito, etiqueta interna com o número do clã, etiqueta de composição, tag e adesivo exclusivos. Coleção NZPPF 2026 · Os Clãs. A lenda do clã está em nzgroup.com.br/colecao.$t$,
  seo_titulo = $t$Camiseta NZPPF 2026 Nº 03 Shine After Dark · Clã da Meia-Noite$t$,
  seo_descricao = $t$Camiseta preta 100% algodão da Coleção NZPPF 2026. Estampa de 38 × 56 cm nas costas, tag e adesivo exclusivos. Tamanhos P, M, G e GG.$t$
 where erp_sku = 'NZPPFCAM03M';
update public.produtos set
  descricao = $t$Nº 04 PPF · Clã da Fumaça. Não sabe o que é devagar. Camiseta preta 100% algodão com a arte do clã nas costas (38 × 56 cm), logo NZPPF no peito, etiqueta interna com o número do clã, etiqueta de composição, tag e adesivo exclusivos. Coleção NZPPF 2026 · Os Clãs. A lenda do clã está em nzgroup.com.br/colecao.$t$,
  seo_titulo = $t$Camiseta NZPPF 2026 Nº 04 PPF · Clã da Fumaça$t$,
  seo_descricao = $t$Camiseta preta 100% algodão da Coleção NZPPF 2026. Estampa de 38 × 56 cm nas costas, tag e adesivo exclusivos. Tamanhos P, M, G e GG.$t$
 where erp_sku = 'NZPPFCAM04M';
update public.produtos set
  descricao = $t$Nº 05 EMOTION & PROTECT · Clã dos Night Riders. Equilibra emoção e juízo. Camiseta preta 100% algodão com a arte do clã nas costas (38 × 56 cm), logo NZPPF no peito, etiqueta interna com o número do clã, etiqueta de composição, tag e adesivo exclusivos. Coleção NZPPF 2026 · Os Clãs. A lenda do clã está em nzgroup.com.br/colecao.$t$,
  seo_titulo = $t$Camiseta NZPPF 2026 Nº 05 Emotion & Protect · Clã dos Night Riders$t$,
  seo_descricao = $t$Camiseta preta 100% algodão da Coleção NZPPF 2026. Estampa de 38 × 56 cm nas costas, tag e adesivo exclusivos. Tamanhos P, M, G e GG.$t$
 where erp_sku = 'NZPPFCAM05M';
do $$ begin
  if (select count(*) from public.produtos where erp_sku like 'NZPPFCAM%M' and descricao is not null and seo_titulo is not null) <> 5 then
    raise exception 'esperava 5 vitrines com texto';
  end if;
end $$;
commit;
