# Cadastro, base de clientes e processo de compra — diagnóstico e plano

> **Status 2026-09-06: IMPLANTADO** (fases 4.1–4.7), com duas exceções documentadas no fim
> desta caixa. Verificado em produção pelo smoke de conta/equipe e por `npm run conta:test`.
>
> **Mudança de rumo na 4.1/4.4 (vale mais que o texto original):** o trigger do banco NÃO cria
> administradores. A ideia inicial — promover quem tivesse linha em `equipe_convites` — é
> insegura com `mailer_autoconfirm = true`: bastaria alguém se cadastrar com o e-mail de um
> funcionário para nascer admin. Exigir `auth.users.invited_at` também não serve: o GoTrue
> grava esse campo depois do INSERT que dispara o trigger. A regra final é
> `migrations/2026-09-08c_admin_so_por_acao.sql`: toda conta nasce cliente ou lojista, e a
> promoção acontece no servidor, na op `convidar` de `/api/nz/equipe`, com admin autenticado e
> o id do usuário em mãos.
>
> **Não feito (falta credencial do João):** SMTP próprio (Resend) — sem ele o convite sai por
> link copiado e a recuperação de senha usa o mailer do Supabase, limitado a 2 e-mails por
> hora; login com Google e captcha Turnstile ficam atrás de flags desligadas
> (`VITE_GOOGLE_LOGIN`, `VITE_TURNSTILE_SITE_KEY`); e os e-mails transacionais de pedido
> (4.6) dependem do mesmo Resend.
>
> Para o agente **Opus 5** executar. Diagnóstico feito em 2026-09-06 lendo o código do site
> (`nz-distribuidora-web`), o banco do site (`uibjmvkvbthzypgozpcs`), o banco e o código do NZERP
> (`2NZERPUPDATE30`, `ipehorttsrvjynnhyzhu`) e a configuração de Auth dos dois projetos via
> Management API. Nada foi alterado ainda além do fix `572b3d5` (carrinho barrava admin não
> aprovado). Antecessor: `docs/PLANO_CHECKOUT_ASAAS.md` (implantado).
>
> Regras que continuam valendo: nenhuma chave do ERP no bundle do site; nada de `VITE_` para
> segredo; preço/custo/margem nunca saem do ERP; segredos nunca ecoados; no repo do NZERP
> qualquer push só com o "pode" do João (`AGENTS.md`).

---

## 0. O pedido do João (2026-09-06)

> "Quando coloquei um produto no carrinho os dados da conta que eu usei estavam bem ruins, não
> apareceu tudo preenchido, e eu já estava logado. Bolar um planejamento para melhorar o
> processo de compra, o processo de cadastro, a base de cadastro de usuário e cliente.
> Começar que todos os usuários do NZERP precisam ter usuário administrativo ativo no site."

O que estava por trás da tela que ele viu: a conta `joao.vanderleia@gmail.com` é um admin criado
em abril ("USER CENTRAL") sem CPF, telefone nem endereço, e com `is_approved = false`. O
carrinho escondia **todo** o bloco de ação para quem não estava aprovado — inclusive admin.
Isso já foi corrigido (`572b3d5`) e o perfil foi aprovado. O resto deste documento é o que
está por trás desse sintoma.

---

## 1. Diagnóstico — como está hoje

### 1.1 Números

| | Site (`uibjmvkvbthzypgozpcs`) | NZERP (`ipehorttsrvjynnhyzhu`) |
|---|---|---|
| Usuários | 3 em `auth.users` (2 admin, 1 cliente) | 9 em `public.users` (5 DIRETORIA, 3 VENDEDOR, 1 ESTOQUISTA), todos `active` |
| Colaboradores | — | 9 em `hr_employees` (7 com `usa_sistema = true`, todos com `user_id`) |
| Clientes | 1 perfil `client` aprovado | 389 em `clients`: 379 com CPF/CNPJ, 359 com e-mail, 366 com telefone, 382 com CEP; 214 PJ, 89 PF, 86 sem `tipo_pessoa` |
| Pedidos do site | 0 (o smoke test limpou) | 1 `quotes` com `origem = 'SITE'` (teste) |
| Vínculo site ↔ ERP | **nenhum** (`user_profiles` não guarda `erp_client_id`) | `site_criar_pedido` acha o cliente por CPF/CNPJ, depois por e-mail, senão cria com `vendedor = 'SITE'` |

### 1.2 Cadastro e login do site (`src/pages/Auth/*`, `src/contexts/AuthContext.tsx`)

1. **Dois passos frágeis no cadastro.** `signUp()` (`AuthContext.tsx:80-104`) cria o usuário só
   com `full_name` e `role` nos metadados; o trigger `handle_new_user` grava a linha em
   `user_profiles`; e **depois** o front faz um `update` separado com telefone, CNPJ, IE,
   razão social, `indicado_por` e `aceite_termos_em`. Se esse segundo passo falhar (rede,
   aba fechada, RLS), o perfil fica só com nome e e-mail — exatamente o "dados ruins".
   Como `mailer_autoconfirm = true` no site, hoje o segundo passo costuma rodar; mas é um
   desenho que perde dado silenciosamente.
2. **Mensagem errada depois do cadastro.** `Register.tsx:72-83` diz "Um administrador irá
   revisar e aprovar seu acesso" para todo mundo; cliente final já nasce aprovado desde o
   plano do checkout. E o usuário **já está logado** (autoconfirm) mas é mandado para
   `/login` de novo. Também não honra `?next=` (quem veio de "entre para ver o preço" perde
   o produto).
3. **Não existe "esqueci minha senha"** (`grep resetPasswordForEmail` → nada). Nem página de
   definir senha, nem troca de e-mail, nem login com Google (`external_google_enabled = false`).
4. **Cadastro pede de mais para cliente final** (tipo de conta, documento, WhatsApp) e **de
   menos para quem vai comprar** (endereço só aparece no painel/checkout). Sem máscara de
   telefone, sem CEP automático, UF em texto livre.
5. **Perfil do admin não tem tela.** `Painel.tsx:171` redireciona admin para `/admin`; o
   painel admin não tem "meus dados". Por isso as duas contas admin estão sem CPF/telefone/
   endereço — e o checkout precisa disso para gerar a cobrança no Asaas.

### 1.3 Base de usuários do site (`user_profiles`)

- Colunas: identidade (`role`, `is_approved`, `email`), contato, documento (`cpf_cnpj`, `ie`),
  endereço único, `indicado_por`, `aceite_termos_em`, `asaas_customer_id/env`. **Faltam**:
  `erp_client_id` (cliente correspondente no ERP), `erp_user_id/erp_role/erp_permissions`
  (colaborador correspondente), origem do cadastro, último acesso, endereço de cobrança ≠
  entrega.
- `handle_new_user` só lê `full_name` e `role` dos metadados (aceita `client`/`reseller`;
  qualquer outra coisa vira `client` — inclusive `admin`).
- Proteções que já existem e ficam: trigger `nz_user_profiles_guard` (usuário não muda o
  próprio `role`/`is_approved`/`email`), RLS dono-lê/atualiza + admin tudo, `is_admin()`.
- Papel decidido no servidor em `api/_lib/papel.ts`: admin = aprovado; lojista sem aprovação
  vira cliente final; falha de token = anônimo. Correto, mantém.

### 1.4 Usuários do NZERP × administradores do site

- O NZERP **não usa Supabase Auth** para entrar: `services/userService.ts:6-9` faz
  `select * from users where email ilike … and password = … and active`. A tabela
  `public.users` guarda a **senha em texto puro** (todas as 9 contas estão com `123`) e tem
  RLS `anon_full_access_users` (ALL para `anon`) — qualquer pessoa com a anon key que está no
  bundle do ERP lê e altera todos os usuários e senhas. Isso está fora do escopo deste plano
  (é o repo do ERP, precisa de "pode"), mas define uma regra aqui: **o site nunca copia,
  valida nem armazena senha do ERP**. O acesso do colaborador ao site nasce por convite do
  Supabase Auth do site, com senha própria.
- Não existe hoje nenhuma relação entre `users` do ERP e `auth.users` do site. Dos 9
  colaboradores ativos, só `joaovitor@nzdistribuidora.com.br` tem conta no site. E-mails do
  ERP estão em caixa mista (`EVERSON@NZDISTRIBUIDORA.COM.BR`) — comparar sempre em minúsculas.
- A tela Admin → Usuários (`Dashboard.tsx:343-372`, `createUser`) cria admin chamando
  `supabase.auth.signUp` **na sessão do próprio admin** — isso troca a sessão do navegador
  para a conta nova (o admin é deslogado), o trigger grava o novo como `client` (porque
  `admin` não é aceito) e o `update` para `role = 'admin'` roda já como o usuário novo, que o
  guard bloqueia. Na prática a função é quebrada. Ela some neste plano.
- O site tem só um papel de equipe (`admin`, tudo liberado). O ERP tem `role` + `permissions[]`
  por pessoa. O João pediu "usuário administrativo ativo" para todos; o plano dá `admin` a
  todos e **guarda** `erp_role`/`erp_permissions` para, numa fase depois, esconder abas do
  painel do site conforme a permissão do ERP (ex.: estoquista não vê Pedidos & Pagamentos).

### 1.5 Base de clientes do ERP (`clients`) e o vínculo com o site

- `clients` tem colunas em português e em inglês duplicadas (`nome`/`name`, `cpf_cnpj`/`document`,
  `telefone`+`celular`/`phone`, `endereco`/`address`…). O ERP e a RPC `site_criar_pedido`
  usam as **em português**; as em inglês são legado de import. O plano só lê/escreve as em
  português.
- Ao criar pedido, a RPC (`supabase/migrations/20260906_site_pedidos.sql:75-101`) acha o
  cliente por CPF/CNPJ (dígitos), depois por e-mail, senão insere. Ela devolve o
  `client_id`, mas o site **ignora** e não guarda; e ela **não atualiza** telefone/endereço
  de um cliente já existente quando o site tem dado mais novo.
- Não há caminho ERP → site: um cliente antigo da NZ que se cadastra no site é um estranho
  até o primeiro pedido, mesmo que o CNPJ esteja há anos no ERP. Isso é a maior perda de
  experiência para lojista: ele podia nascer aprovado e com endereço preenchido.
- `clients.vendedor` fica `'SITE'` e o `quotes.salesperson` também; o CRM (`crm_opportunities.attendant`)
  é quem distribui. OK para agora; registrado como decisão (D8).

### 1.6 Processo de compra (carrinho → checkout → painel)

- **Carrinho** (`src/pages/Loja/Carrinho.tsx`): trava por aprovação corrigida; ainda não mostra
  ao usuário **o que falta** no cadastro nem leva direto ao lugar certo; não estima frete
  (só no checkout); "Enviar como orçamento" e "Fechar pedido e pagar" convivem bem.
- **Checkout** (`src/pages/Loja/Checkout.tsx`): passo 1 preenche do perfil, tem CEP automático
  (ViaCEP), valida CPF/CNPJ e salva no perfil antes de pagar. Faltam: máscara de telefone,
  UF como select, modo "resumo" quando o cadastro já está completo ("Entregar em … — alterar"),
  endereço de cobrança para cartão quando difere da entrega (o Asaas usa `postalCode` +
  `addressNumber` do titular — hoje vai o de entrega), e-mail de confirmação do pedido.
- **Pós-compra**: só a página `/painel/pedido/N` e os e-mails do próprio Asaas. Sem e-mail
  transacional da NZ (pedido criado / pago / enviado), sem link de WhatsApp com o vendedor.
- **Admin → Clientes** (`Dashboard.tsx` aba `clients`): tabela crua com aprovar/revogar; sem
  busca, filtro, edição, contagem de pendentes visível fora do dashboard, nem link para o
  cliente no ERP.

### 1.7 Configuração de Auth do Supabase (site) — via Management API

| Item | Hoje | Problema |
|---|---|---|
| `site_url` | `http://localhost:3000` | qualquer link de e-mail (convite, recuperar senha) volta para localhost |
| `uri_allow_list` | vazio | `redirectTo` para `nzgroup.com.br/...` é recusado |
| `mailer_autoconfirm` | `true` | cadastro sem confirmar e-mail (ok para agora; captcha compensa) |
| SMTP | não configurado | e-mails saem de `noreply@mail.app.supabase.io`, limite **2 por hora** (`rate_limit_email_sent = 2`) — inviável para convidar 9 pessoas ou para recuperar senha |
| Google | desligado | sem "Entrar com Google" |
| Captcha | desligado | cadastro aberto sem proteção contra bot |
| `password_min_length` | 6 | fraco; subir para 8 |

O projeto do ERP tem a mesma configuração (`localhost`, sem SMTP) mas o ERP não usa o Auth.

---

## 2. Decisões — recomendação já embutida no plano (o João pode trocar)

| # | Decisão | Recomendação | Alternativa |
|---|---|---|---|
| D1 | Quem do ERP vira admin do site | **Todos os `users.active = true`** (9 hoje), inclusive estoquista; `erp_role`/`erp_permissions` guardados para filtrar abas depois | só DIRETORIA + VENDEDOR |
| D2 | Como o colaborador entra | **Convite**: link do Supabase Auth para definir a própria senha (por e-mail quando houver SMTP; ou botão "Copiar link de convite" para mandar no WhatsApp). Nunca a senha do ERP | senha inicial fixa (rejeitada) |
| D3 | E-mail transacional | **Resend** (grátis até 3.000/mês) com domínio `nzgroup.com.br`, SMTP do Resend dentro do Supabase Auth (convite/recuperação) e API do Resend para e-mails de pedido | continuar no mailer do Supabase (2/h) |
| D4 | Aprovação | Cliente final: automática (já é). **Lojista: automática se o CNPJ já existe em `clients` do ERP com `situacao = 'Ativo'` e o e-mail bate**; senão manual, como hoje | tudo manual |
| D5 | Login com Google | **Sim** para cliente final (menos atrito no celular); precisa de OAuth client do João | não |
| D6 | O que o cadastro pede | **Mínimo**: nome, e-mail, WhatsApp, senha (+ CNPJ/razão social só para lojista). Documento e endereço no checkout, com pré-preenchimento do ERP quando o documento bater | tudo no cadastro |
| D7 | Captcha | **Cloudflare Turnstile** no cadastro e no login (Supabase suporta nativo) assim que o checkout abrir ao público | sem captcha |
| D8 | Vendedor do pedido do site | Continua `SITE` no orçamento; CRM distribui. Fase futura: cliente com `vendedor` no ERP → `salesperson` = esse vendedor | — |

---

## 3. O que o João precisa fazer / passar (sem isso a fase correspondente fica em espera)

1. **Resend** (D3): criar conta em resend.com com o e-mail da NZ → Domains → adicionar
   `nzgroup.com.br` → criar no DNS (onde o domínio está hospedado) os registros que o Resend
   mostrar (1 TXT SPF, 1 TXT DKIM, 1 MX de retorno) → esperar "Verified" → API Keys → criar
   `NZSTORE` com permissão *Sending access* → me passar **por arquivo** (como o token do
   Asaas), nunca no chat. Entra na Vercel como `RESEND_API_KEY`; e o Opus configura o SMTP do
   Supabase Auth com ela via Management API (host `smtp.resend.com`, porta 465, user `resend`).
   Remetente sugerido: `NZ Group <loja@nzgroup.com.br>`.
2. **Google OAuth** (D5, opcional): console.cloud.google.com → projeto "NZ Site" → Tela de
   consentimento (externo, nome "NZ Group", domínio nzgroup.com.br) → Credenciais → ID do
   cliente OAuth (Web) → URI de redirecionamento
   `https://uibjmvkvbthzypgozpcs.supabase.co/auth/v1/callback` → me passar Client ID e
   Secret por arquivo. Se não quiser agora, a parte Google da fase 4.2 fica para depois.
3. **Cloudflare Turnstile** (D7, opcional): dash.cloudflare.com → Turnstile → Add site
   (`nzgroup.com.br`, modo Managed) → Site Key (pública, pode ir para `VITE_TURNSTILE_SITE_KEY`)
   e Secret Key (por arquivo → Supabase Auth).
4. **Confirmar a lista** de quem do ERP vira admin do site (seção 1.1 — 9 pessoas) e dizer se
   alguém fica de fora.
5. **"Pode"** para os pushes no repo do ERP quando chegar a hora (fase 4.5 mexe na RPC
   `site_criar_pedido` e cria RPCs de cliente; os commits `0d0c789` e `2562a55` ainda
   estão parados aguardando o mesmo "pode").
6. Depois da fase 4.4: abrir o convite que chegar no seu e-mail/WhatsApp e definir a senha, e
   pedir a cada colaborador para fazer o mesmo.

---

## 4. Plano de execução (fases, na ordem)

Cada fase termina com lint + `npm run build` + testes + commit + push + verificação em
produção. Migrations do site aplicadas com `node scripts/aplicar-sql.mjs site <arquivo>`;
do ERP, com `… erp …` **e** o arquivo copiado para `2NZERPUPDATE30/supabase/migrations/`
(commit lá, push só com "pode"). Endpoints novos entram como ação em `api/nz/[acao].ts`
(limite de funções do Vercel Hobby); regra de negócio em `api/_lib/**`.

### 4.1 Fundações: Auth config + schema + trigger (sem UI ainda)

**Supabase Auth (site) via Management API** — `PATCH https://api.supabase.com/v1/projects/uibjmvkvbthzypgozpcs/config/auth`
(mesmo token de `scripts/aplicar-sql.mjs`; criar `scripts/auth-config.mjs get|set <json>`):
- `site_url = https://www.nzgroup.com.br`
- `uri_allow_list = https://www.nzgroup.com.br/**,https://nzgroup.com.br/**,https://*-nz-distribuidora-web.vercel.app/**,http://localhost:5173/**`
- `password_min_length = 8`
- `mailer_subjects_*` e `mailer_templates_*_content` em português (convite, recuperação,
  troca de e-mail, magic link) — HTML simples, logo NZ, botão; ver seção 5 para o texto.
- Quando o Resend existir: `smtp_host = smtp.resend.com`, `smtp_port = 465`, `smtp_user = resend`,
  `smtp_pass = <RESEND_API_KEY>`, `smtp_admin_email = loja@nzgroup.com.br`,
  `smtp_sender_name = NZ Group`, `rate_limit_email_sent = 60`.
- Turnstile quando existir: `security_captcha_enabled = true`, `security_captcha_provider = turnstile`,
  `security_captcha_secret`.
- Nunca imprimir o JSON de resposta inteiro (contém segredos); imprimir só as chaves alteradas
  com `hasX`.

**Migration `migrations/2026-09-08_cadastro_v2.sql` (site):**
```sql
alter table public.user_profiles
  add column if not exists erp_client_id uuid,                 -- clients.id no ERP
  add column if not exists erp_user_id uuid,                   -- users.id no ERP (colaborador)
  add column if not exists erp_role text,                      -- DIRETORIA | VENDEDOR | ESTOQUISTA
  add column if not exists erp_permissions text[] not null default '{}',
  add column if not exists origem text not null default 'site', -- site | convite | google
  add column if not exists convidado_em timestamptz,
  add column if not exists ultimo_acesso_em timestamptz,
  add column if not exists cadastro_completo_em timestamptz,
  add column if not exists cobranca_igual_entrega boolean not null default true,
  add column if not exists cobranca_cep text,
  add column if not exists cobranca_numero text;
create unique index if not exists user_profiles_cpf_cnpj_uq
  on public.user_profiles (cpf_cnpj) where cpf_cnpj is not null;
create index if not exists user_profiles_erp_client_idx on public.user_profiles (erp_client_id);
```
- `handle_new_user` passa a ler **tudo** dos metadados (`phone`, `cpf_cnpj`, `company_name`,
  `ie`, `indicado_por`, `aceite_termos_em`, `origem`). O front deixa de fazer o segundo
  `update`. Metadados vêm de `signUp({ options: { data } })` (cadastro) ou de
  `auth.admin.inviteUserByEmail/generateLink({ data })` (convite, service role).
- **Como impedir que um usuário comum se cadastre como admin mandando metadados?** Regra do
  trigger: `role = 'admin'` **só** quando existe uma linha em `equipe_convites` com esse
  e-mail (minúsculas), não revogada — tabela que só o service role escreve. Sem a linha, o
  trigger grava `client`, ignore o que vier nos metadados. `erp_user_id/erp_role/erp_permissions`
  vêm da própria linha de `equipe_convites`, nunca dos metadados.
- Tabela `equipe_convites (email text primary key, erp_user_id uuid, erp_role text,
  erp_permissions text[], criado_por uuid, criado_em timestamptz, usado_em timestamptz,
  revogado_em timestamptz)` — RLS: admin lê; ninguém escreve via API (só service role).
- `nz_user_profiles_guard`: além do que já bloqueia, usuário comum não altera `erp_*`,
  `origem`, `cadastro_completo_em`, `convidado_em`. Atualização de `ultimo_acesso_em` via RPC
  `tocar_acesso()` (SECURITY DEFINER, usa `auth.uid()`), chamada pelo `AuthContext` uma vez
  por sessão.
- Função SECURITY DEFINER `equipe_site()` (admin-only) = `user_profiles where role='admin'`
  + `auth.users.last_sign_in_at` + `banned_until` — não expor `auth.users` direto.

**`api/_lib/conta/*` (novo módulo, servidor):**
- `completude(perfil) → { completo: boolean, faltando: string[] }` — a mesma regra de
  `precificar.ts:97-108`, agora num lugar só; `precificar.ts` passa a importar daqui.
- `erpClientes.ts`: `buscarClienteErpPorDocumento(doc)` e `porEmail(email)` com o
  **service role do ERP** (já existe `ERP_SUPABASE_SERVICE_ROLE_KEY`), devolvendo **somente**
  `{ id, nome, fantasia, tipo_pessoa, email, telefone, celular, cep, endereco, numero,
  complemento, bairro, cidade, estado, inscricao_estadual, situacao }` — nunca
  `limite_de_credito`, `lista_de_preco`, `observacoes`, `vendedor`. (Na 4.5 isso vira RPC no
  ERP; até lá, `select` com lista explícita de colunas.)
- Testes: `scripts/test-conta.mjs` (`npm run conta:test`) no molde de `test-checkout.mjs`
  (esbuild, sem rede): completude, normalização de e-mail/documento, montagem de metadados,
  filtro de campos do ERP (garantir que os campos sensíveis **não** passam).

### 4.2 Cadastro v2, login v2, recuperação de senha

Rotas novas em `src/App.tsx` (todas `noindex` em `api/_lib/routeMeta.ts`): `/cadastro`
(refeito), `/login` (refeito), `/recuperar-senha`, `/nova-senha`.

**`src/pages/Auth/Register.tsx` — reescrever:**
- Um único card, passos curtos no celular: (1) "Você é" → *Cliente final* | *Lojista/aplicador*
  (explicando: lojista compra com CNPJ e preço de revenda); (2) nome, WhatsApp (máscara
  `(11) 99999-9999`, `inputMode=tel`), e-mail, senha (mín. 8, com "mostrar"); lojista: CNPJ
  (máscara + validação; ao completar 14 dígitos chama `POST /api/nz/conta {op:'consultar-documento'}`
  — ver abaixo — e pré-preenche razão social/IE/endereço quando já é cliente NZ), razão social,
  IE ou "isento"; (3) aceite dos termos/privacidade (link) e Turnstile.
- Envia tudo em `signUp({ options: { data } })`; **sem** o segundo `update`.
- Depois do sucesso: já logado (autoconfirm) → chama `op:'pos-cadastro'` (vínculo com o ERP,
  D4) → `navigate(next ?? (lojista ? '/painel' : '/loja'))`.
  Mensagem: cliente "Conta criada. Você já vê preços e pode comprar."; lojista já cliente do
  ERP "Conta criada e liberada — encontramos seu CNPJ na NZ."; lojista novo "Conta criada.
  A NZ confere seu CNPJ e libera o preço de revenda — costuma levar um dia útil. Enquanto
  isso você vê preço de cliente final."
- `?ref=` de afiliado continua (`localStorage nz:ref`), agora nos metadados.
- Botão "Continuar com Google" (D5) quando `VITE_GOOGLE_LOGIN=1`: `signInWithOAuth({provider:'google', options:{redirectTo}})`;
  o `handle_new_user` cria o perfil como `client` aprovado com `origem = 'google'`; o painel
  pede WhatsApp na primeira visita.

**`POST /api/nz/conta`** (ação nova; ops):
- `consultar-documento {cpf_cnpj}` — **só com sessão** (rate limit 10/min por usuário):
  procura no ERP (`erpClientes.ts`). Anti-enumeração: devolve os dados de pré-preenchimento
  **só** se o e-mail da sessão for igual ao e-mail do cliente no ERP; caso contrário devolve
  apenas `{ jaCliente: true }` e o cadastro segue para aprovação manual com a nota
  "documento já existe no ERP com outro e-mail — confirmar com o cliente".
- `pos-cadastro` — servidor (service role) acha/cria `erp_client_id` (4.5) e aplica D4
  (lojista + CNPJ ativo no ERP + e-mail igual → `is_approved = true`), registrando em `equipe_log`.
- `completude` — devolve `{completo, faltando}` para carrinho/painel mostrarem.
- `recuperar-senha {email}` — `auth.resetPasswordForEmail(email, { redirectTo: SITE + '/nova-senha' })`
  pelo service role; resposta sempre 200 (não revela se o e-mail existe).

**`Login.tsx`:** link "Esqueci minha senha", "Continuar com Google", mensagens traduzidas,
honra `next`. **`/recuperar-senha`**: e-mail + Turnstile. **`/nova-senha`**: lê o token da URL
(`exchangeCodeForSession` no PKCE / evento `PASSWORD_RECOVERY` do `onAuthStateChange`), campo
senha ×2, `auth.updateUser({password})`, serve **também** para o convite da equipe
(`type=invite`) e manda para `/admin` ou `/painel` conforme o papel.

**Segurança:** senha ≥ 8; Turnstile; `rate_limit_email_sent` real só com SMTP próprio;
nunca mostrar "e-mail não existe".

### 4.3 Minha conta para todos — e painel do cliente reorganizado

- `Painel.tsx` deixa de redirecionar admin: admin vê `/painel` com **seus dados** (é o que
  faltou para o João testar o checkout) e um atalho "Painel administrativo". A Navbar mostra
  "Minha conta" para todo mundo logado e "Admin" ao lado para quem é admin.
- Bloco **"Seu cadastro"** com checklist do que falta (`completude`) e botão "Completar"
  que foca o campo. Quando completo: "Pronto para comprar".
- Formulário com máscaras (telefone, CPF/CNPJ, CEP com ViaCEP), UF `<select>`, endereço de
  cobrança opcional (`cobranca_igual_entrega`), botão "Salvar". Campos que o usuário não
  pode mudar (e-mail, papel, aprovação) aparecem como texto.
- "Alterar senha" (`updateUser`), "Alterar e-mail" (com confirmação dupla do Supabase).
- Pedidos: lista já existe; ganha filtro por status e o chip de pagamento.
- Lojista não aprovado: card explicando o que acontece e botão "Falar com a NZ" (WhatsApp).

### 4.4 Equipe NZ = usuários do ERP → admins do site

**Servidor — `api/_lib/equipe/*` + ação `POST /api/nz/equipe` (admin only):**
- `listar`: lê a view `users_safe` do ERP (`id, name, email, role, active, permissions` — a
  view já existe e **não tem** a coluna `password`; nunca ler `users` direto) com service
  role, normaliza e-mail (`lower/trim`), cruza com `user_profiles` (por `erp_user_id`, depois
  por e-mail) e devolve por pessoa: `{ erpUserId, nome, email, erpRole, ativoErp,
  status: 'sem-conta' | 'convidado' | 'ativo' | 'desativado', convidadoEm, ultimoAcesso, siteUserId }`.
- `convidar {erpUserId}`: grava `equipe_convites`, então
  `auth.admin.inviteUserByEmail(email, { data: { full_name, origem:'convite' }, redirectTo: SITE + '/nova-senha' })`.
  Se já existe `auth.users` com esse e-mail (ex.: o João), **não** convida: promove
  (`update user_profiles set role='admin', is_approved=true, erp_* …`) e registra.
  Sem SMTP configurado, usa `auth.admin.generateLink({ type:'invite', … })` e devolve
  `actionLink` para o admin copiar ("Copiar link de convite — vale 24 h; mande no WhatsApp").
  Nunca logar o link.
- `reenviar {erpUserId}`: idem, novo link.
- `desativar {erpUserId}` / automático quando `active = false` no ERP:
  `auth.admin.updateUserById(id, { ban_duration: '876000h' })` + `user_profiles.role = 'client'`,
  `is_approved = false`, `equipe_convites.revogado_em`, nota em `equipe_log`. `reativar` desfaz.
- `sincronizar`: o que o cron chama — convida quem apareceu, desativa quem saiu, atualiza
  `erp_role/erp_permissions` de quem mudou. **Só convida automaticamente quando há SMTP**;
  sem SMTP, marca `pendente-convite` e o admin copia o link.
- Cron: novo passo em `api/_lib/handlers/sync.ts` (já roda às 6h) → `sincronizarEquipe(site)`
  best-effort, resultado no JSON do sync. Sem função nova na Vercel.
- `equipe_log (id, quando, quem uuid, acao, alvo_email, detalhe jsonb)` — auditoria; admin lê.

**Painel — aba "Usuários" reescrita como `src/pages/Admin/AdminEquipe.tsx`:**
- Tabela: nome, e-mail, papel no ERP, status no site (chip), último acesso, ações
  (Convidar / Reenviar / Copiar link / Desativar / Reativar). Cabeçalho com "Sincronizar
  com o ERP agora" e contadores (N no ERP, N com acesso, N pendentes).
- Remove o modal "Cadastrar Administrador" (`createUser`) e o `signUp` na sessão do admin.
- Regra visível: "Quem tem usuário ativo no NZERP tem acesso administrativo ao site. Para dar
  ou tirar acesso, faça no NZERP (Gestão de Usuários) e sincronize."
- `Dashboard.tsx` só monta a aba; o componente é separado (o arquivo já passa de 900 linhas).
- Fase futura (não agora): gating de abas por `erp_permissions` (mapa ERP → aba do site:
  `ORCAMENTOS|PEDIDOS` → Pedidos & Pagamentos; `EXPEDICAO` → Logística; `CADASTRO_CLIENTES`
  → Clientes; `GESTAO_USUARIOS` → Usuários; DIRETORIA → tudo).

### 4.5 Vínculo com a base de clientes do ERP (mexe no ERP → "pode")

**Migration `2NZERPUPDATE30/supabase/migrations/20260908_site_clientes.sql`:**
- `alter table clients add column if not exists site_user_id uuid` (+ índice).
- `site_criar_pedido`: quando acha o cliente existente e o payload traz telefone/endereço
  mais completos (campo vazio no ERP), **completa** (nunca sobrescreve o que já existe);
  grava `site_user_id`; continua devolvendo `client_id` — e o site passa a **guardar** em
  `user_profiles.erp_client_id` (`api/_lib/handlers/pedido.ts`, `checkout.ts`, `asaas/pagamento.ts:avisarErpPago`).
- RPC `site_consultar_cliente(p_doc text, p_email text)` SECURITY DEFINER, `service_role` only,
  devolvendo só os campos públicos da 4.1 — substitui o `select` direto do `erpClientes.ts`
  (menos superfície). Sem escrita.
- RPC `site_vincular_cliente(p_site_user_id uuid, p jsonb)` — cria o cliente no ERP a partir do
  cadastro completo do site **antes** do primeiro pedido (para o lojista aprovado aparecer no
  CRM da NZ já cadastrado), com `vendedor = 'SITE'`, `observacoes = 'Cadastro criado pelo site'`.
- Badge "tem conta no site" na tela de clientes do ERP: fase futura, repo do ERP.

**Site:** Admin → Clientes reescrito como `src/pages/Admin/AdminClientes.tsx`: busca (nome,
e-mail, documento), filtros (pendente/aprovado, cliente/lojista, com/sem ERP), edição inline
dos dados, aprovar/revogar com motivo, coluna "ERP" (✓ vinculado / "criar no ERP"),
contagem de pendentes no menu lateral (badge), exportar CSV.

### 4.6 Processo de compra — carrinho, checkout, pós-compra

- **Carrinho:** bloco "Seu cadastro" (completo ✓ / faltam X — link para `/painel#dados`);
  estimativa de frete por CEP no carrinho (reusa `cotarCarrinho` via `op:'resumo'`, mostra a
  mais barata + retirada); contagem de itens e subtotal fixos no rodapé no celular (como o
  checkout); "Fechar pedido e pagar" primeiro, "enviar como orçamento" secundário (já é).
- **Checkout passo 1:** se `completude.completo`, abre **recolhido**: "Entregar para João —
  Rua X, 123 — São Paulo/SP — (11) 9… — CPF ***.456.789-** — *alterar*"; expandido só se
  faltar algo ou o usuário clicar. Máscara de telefone, UF select, "endereço de cobrança
  diferente" (cartão) → `creditCardHolderInfo` usa cobrança. Lojista: razão social/IE
  recolhidos no mesmo resumo.
- **Identificação para quem não está logado:** `/checkout` sem sessão mostra "Entrar" |
  "Criar conta" lado a lado (não só redirect), com `next=/checkout`.
- **Pós-compra:** e-mails da NZ via Resend (`api/_lib/email/*`, templates PT-BR, texto +
  HTML simples): *Pedido recebido* (com Pix copia-e-cola / linha do boleto / cartão aprovado),
  *Pagamento confirmado*, *Pedido enviado* (quando o ERP mudar status; já há gatilho
  `site_notificar_sync`). Disparo em `marcarPago`/`criarPagamento`/webhook, best-effort,
  nunca bloqueia o pagamento; `email_log` para não duplicar (chave `pedido_id+tipo`).
- **Página do pedido:** botão "Falar com a NZ sobre este pedido" (WhatsApp com nº do pedido).
- Admin → Pedidos & Pagamentos: coluna cliente com link para Admin → Clientes.

### 4.7 Verificação e entrega

- `npm run conta:test`, `npm run checkout:test` (continua verde), lint, build, `tsc -p api`.
- Smoke em produção (scratchpad, admin temporário como no checkout): cadastro cliente final →
  perfil com todos os campos gravados na **primeira** escrita; cadastro lojista com CNPJ
  existente no ERP e mesmo e-mail → nasce aprovado e com `erp_client_id`; `recuperar-senha`
  → link chega e `/nova-senha` funciona; equipe `listar` → 9 pessoas; `convidar` com
  `generateLink` → perfil `admin` nasce pelo trigger com `erp_*`; **teste de segurança
  obrigatório:** `signUp` comum com `origem:'convite'` e `role:'admin'` nos metadados → nasce
  `client`; `consultar-documento` de cliente com outro e-mail → sem dados (anti-enumeração).
- Playwright (scratchpad `pw/`), iPhone 13 + desktop: `/cadastro`, `/login`, `/painel`,
  `/carrinho`, `/checkout` (recolhido e expandido), Admin → Usuários e Clientes.
- Atualizar `docs/` (este arquivo com status), `.env.example` (`RESEND_API_KEY`,
  `VITE_GOOGLE_LOGIN`, `VITE_TURNSTILE_SITE_KEY`) e a memória do projeto.

### 4.8 Ordem e commits sugeridos

1. `feat(conta): fundações — auth config, schema v2, trigger lê metadados, módulo conta + testes` (4.1)
2. `feat(conta): cadastro v2, login v2, recuperar/definir senha` (4.2)
3. `feat(conta): minha conta para todos os papéis e checklist de cadastro` (4.3)
4. `feat(equipe): usuários do NZERP viram admins do site (convite, cron, painel)` (4.4)
5. ERP: `feat(site): RPCs de consulta/vínculo de cliente e site_user_id` (4.5, push com "pode") + site: `feat(clientes): vínculo com o ERP e painel de clientes`
6. `feat(compra): carrinho com cadastro/frete, checkout recolhido, e-mails de pedido` (4.6)
7. `docs: plano marcado como implantado` (4.7)

Fases 4.1–4.4 não dependem de nada do João **exceto** o SMTP para o convite por e-mail (há o
fallback do link copiado). 4.5 depende do "pode". Google e Turnstile entram quando chegarem.

---

## 5. Textos (PT-BR) para os e-mails do Auth

- **Convite** — assunto "Seu acesso ao painel da NZ Group": "Olá, {nome}. Você tem usuário no
  NZERP, então ganhou acesso administrativo ao site nzgroup.com.br. Clique para definir sua
  senha (o link vale 24 horas). Se não esperava este e-mail, ignore."
- **Recuperar senha** — "Redefinir sua senha na NZ Group": "Recebemos um pedido para trocar a
  senha da conta {email}. Clique para escolher uma nova (vale 1 hora). Se não foi você,
  ignore — nada muda."
- **Confirmar troca de e-mail** — "Confirme seu novo e-mail na NZ Group".
- **Magic link** (se usado) — "Seu link de acesso à NZ Group".
- Rodapé em todos: "NZ Group · nzgroup.com.br · WhatsApp +55 11 91890-7565".

---

## 6. Riscos e limites

- **Senha do ERP em texto puro com acesso anônimo** (1.4) é o risco mais sério encontrado e
  **não** é resolvido por este plano — precisa de um plano próprio no repo do ERP (hash com
  `pgcrypto.crypt`, RPC `erp_login`, revogar `anon` em `users`, usar `users_safe`). Registrar
  como próximo item de segurança para o João decidir.
- Convite sem SMTP depende de alguém copiar e mandar o link (24 h). Com Resend, some.
- `mailer_autoconfirm = true` significa que um e-mail digitado errado cria conta "órfã";
  mitigação: Turnstile + campo de e-mail com confirmação visual; opção futura: exigir
  confirmação quando o SMTP estiver estável.
- Índice único em `cpf_cnpj`: antes de criar, checar duplicidade nos perfis atuais (hoje não
  há); em produção, se alguém tentar cadastrar um documento já usado, a UI diz "já existe
  conta com este CPF/CNPJ — recuperar senha?".
- D4 aprova lojista automaticamente por CNPJ do ERP — quem souber o CNPJ de um cliente NZ e
  criar conta com ele ganharia preço de revenda. Mitigação: exige e-mail igual ao do ERP;
  senão aprovação manual; e o admin vê "aprovado automaticamente por CNPJ" na lista, com
  "revogar".
- Nada disso muda preço, custo ou margem, nem expõe chave do ERP: todo acesso ao ERP é em
  `api/_lib/**` com service role e campos filtrados.
