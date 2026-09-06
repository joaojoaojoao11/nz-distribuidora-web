// Rota única das funções da LOJA: /api/nz/<acao>
//
// POR QUE UM ROTEADOR E NÃO CINCO ARQUIVOS
// O plano Hobby da Vercel permite no máximo 12 Serverless Functions por
// deployment. O projeto já usava 10; os cinco endpoints da loja (prazo, testar,
// sync, webhook, estoque) levariam a 15 e a publicação era recusada com
// `exceeded_serverless_functions_per_deployment` — o build passava e o deploy
// falhava na etapa de publicar os outputs.
//
// Uma rota dinâmica conta como UMA função e atende todos os caminhos abaixo
// dela. Os handlers continuam em arquivos separados, em _lib/handlers/, que o
// prefixo `_` mantém fora da contagem: a organização do código não mudou, só o
// ponto de entrada.
//
// Ao migrar para o plano Pro (limite bem maior), dá para voltar a um arquivo
// por endpoint — mas não há ganho real nisso, então provavelmente não vale.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import prazo from '../_lib/handlers/prazo.js';
import testar from '../_lib/handlers/testar.js';
import sync from '../_lib/handlers/sync.js';
import webhook from '../_lib/handlers/webhook.js';
import estoque from '../_lib/handlers/estoque.js';
import catalogo from '../_lib/handlers/catalogo.js';
import precos from '../_lib/handlers/precos.js';
import afiliado from '../_lib/handlers/afiliado.js';
import pedido from '../_lib/handlers/pedido.js';
import checkout from '../_lib/handlers/checkout.js';
import asaas from '../_lib/handlers/asaas.js';
import conta from '../_lib/handlers/conta.js';
import equipe from '../_lib/handlers/equipe.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

const ROTAS: Record<string, Handler> = {
  // Prazo de entrega na página de produto. Público.
  prazo,
  // Diagnóstico de transportadora. Admin.
  testar,
  // Sincronização com o NZERP. Cron ou admin.
  sync,
  // Database Webhook do NZERP. Shared secret.
  webhook,
  // Disponibilidade por papel. Público, com tiers.
  estoque,
  // Catálogo público da loja (view loja_catalogo). Cacheado na CDN.
  catalogo,
  // Preço de venda por papel. Logado e aprovado; admin vê os mínimos.
  precos,
  // Link de indicação, cupom e comissões.
  afiliado,
  // Pedido do site → orçamento no NZERP. Logado e aprovado.
  pedido,
  // Checkout com pagamento online (Pix, boleto, cartão) via Asaas. Logado e aprovado.
  checkout,
  // Webhook do Asaas. Token em cabeçalho.
  asaas,
  // Cadastro do usuário: completude, vínculo com o ERP, recuperar senha.
  conta,
  // Equipe: usuários do NZERP viram admins do site. Admin.
  equipe,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.acao;
  const acao = Array.isArray(raw) ? raw[0] : raw;

  const rota = acao ? ROTAS[acao] : undefined;
  if (!rota) {
    res.status(404).json({
      error: 'acao-desconhecida',
      disponiveis: Object.keys(ROTAS),
    });
    return;
  }

  await rota(req, res);
}
