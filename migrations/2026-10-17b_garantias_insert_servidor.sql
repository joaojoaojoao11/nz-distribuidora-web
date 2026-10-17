-- Aplicar DEPOIS que o formulário novo (que grava por /api/nz/garantia) estiver
-- no ar. Até lá o formulário antigo ainda insere direto, como anônimo.
--
-- O registro de garantia passa a ser gravado só pelo servidor, com service
-- role: é lá que ficam a validação, o honeypot, o limite por IP e o aviso por
-- e-mail. Com a policy pública, qualquer um gravava direto na tabela pela chave
-- do site (que está no bundle) e pulava tudo isso.

drop policy if exists garantias_insert_publico on public.garantias_nz;
