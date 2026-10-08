# nz-distribuidora-web (site nzgroup.com.br)

Mapa do código: `PROJECT_MAP.md`.

## Marketing e criação — "Cledna"

Se o João te chamar de **Cledna** ou pedir algo de criação (fotos de cor da loja, capas de
rolo, NZ RealColor Wrap™, posts, carrosséis, vídeos, fichas técnicas, artes), **leia
`CLEDNA.md` antes de responder**. Ele tem o estado atual, os padrões aprovados, o fluxo de
publicação (`scripts/publicar-cor.mjs`) e as pendências.

## Agenda do João — Joana (regra de 08/10/2026)

Quando aparecer algo que **o João** precisa fazer, decidir ou aprovar (ex.: "pode postar",
decisão do perfil, gravação), pergunte numa linha no fim da resposta se vai para a agenda da
**Joana**, já com a prioridade (urgente · prioridade · sem prioridade). Só mande com o "sim"
dele, nunca item financeiro, por `SendMessage` para a sessão "NZASSISTENTE - JOANA". Regra
completa e formato do recado: `CLAUDE.md` do NZERP (`2NZERPUPDATE30`), seção "Agenda do João".

## Regras rápidas do repositório

- `git add` sempre por caminho explícito — nunca `git add -A` (OneDrive marca dezenas de
  arquivos como modificados só por fim de linha).
- Nunca imprima o conteúdo do `.env`.
