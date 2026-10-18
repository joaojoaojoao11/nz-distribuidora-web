-- Aplicar DEPOIS que os formulários novos (que gravam por /api/nz/lead)
-- estiverem no ar.
--
-- Pedido de aplicador e cupom surpresa passam a ser gravados só pelo
-- servidor: é lá que ficam a validação, o limite por IP e o aviso por e-mail.
-- Com a policy pública, qualquer um gravava direto pela chave do site e
-- pulava tudo isso. (Mesma coisa feita em garantias_nz, 2026-10-17b.)

drop policy if exists "Anyone can insert leads" on public.installer_leads;
drop policy if exists "Anyone can insert leads" on public.leads;
