// POST /api/nz/precos — preço de venda de produtos, por papel.
//
// Decisão do cliente (2026-09-05): preço só para quem está LOGADO E APROVADO.
//   anônimo                 → 401 (a UI mostra "entre para ver o preço")
//   logado, não aprovado    → 403 (a UI mostra "cadastro em análise")
//   cliente final / lojista → preço de ATACADO: rolo fechado + metro linear
//   admin                   → + a tabela de varejo (referência) e promoção
//
// Os preços vivem em erp_produtos (espelho do pricing_engineering do ERP,
// sem custo nem margem). Unidades: `rolo` é R$ por rolo fechado de
// `metragemPadrao` metros; `metro` é R$ por metro linear fracionado.
//
// SELEÇÃO. O corpo aceita `selecao: <token>`. Uma seleção ATIVA que mostra
// preço é a ÚNICA porta por onde alguém sem cadastro vê valor no site — e ela
// abre só os slugs daquela lista, com o acréscimo em % aplicado AQUI, no
// servidor. O percentual jamais volta para o cliente; volta o preço final.
// Token expirado, encerrado, inexistente ou de seleção sem preço é tratado
// como se não tivesse vindo: a porta fecha de novo em 401/403.
//
// ATACADO x VAREJO (decisão do João, 2026-09-08): `preco_rolo`/`preco_metro`
// no espelho já são o ATACADO — quem escolhe é o sync, ver api/_lib/handlers/sync.ts.
// O varejo (a tabela publicada) vem em `preco_*_varejo` e só o admin recebe:
// serve para ele saber de quanto está descontando, não para o cliente comparar.
// Quando o ERP não precificou o atacado o sync cai no varejo e abre uma
// ocorrência; aqui isso vira o sinal `usandoVarejo`, também só para admin.
//
// `Cache-Control: no-store`: a resposta depende do token — nunca pode ficar
// numa CDN. O papel é lido no servidor (_lib/papel.ts), nunca do cliente.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';
import { lerSelecaoPorToken, selecaoAtiva } from './selecoes.js';
import { aplicarAcrescimo } from '../pedido/dinheiro.js';

interface Produto {
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: string;
}

interface Espelho {
  sku: string;
  ativo: boolean;
  unidade: string | null;
  largura_m: number | null;
  metragem_padrao: number | null;
  /** ATACADO — é o que o site mostra e cobra. */
  preco_rolo: number | null;
  preco_metro: number | null;
  /** ATACADO cru do ERP: zero/nulo é o que faz o sync cair no varejo. */
  preco_rolo_min: number | null;
  preco_metro_min: number | null;
  /** VAREJO (tabela publicada). Só admin recebe. */
  preco_rolo_varejo: number | null;
  preco_metro_varejo: number | null;
  /** Contagem de rolos no pátio. Só admin recebe (as bolinhas do card). */
  rolos_fechados: number;
  rolos_abertos: number;
  promocao: boolean;
  preco_atualizado_em: string | null;
  sincronizado_em: string;
}

const MAX_SLUGS = 80;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const lista = Array.isArray(body.slugs)
    ? (body.slugs as unknown[]).filter((s): s is string => typeof s === 'string').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const slugs = [...new Set(lista)].slice(0, MAX_SLUGS);
  if (!slugs.length) {
    res.status(400).json({ error: 'Informe slugs[].' });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const { papel, aprovado } = await resolverPapelDetalhado(site, req.headers.authorization);

  // Uma seleção ATIVA que mostra preço é a única forma de alguém sem cadastro
  // ver valor no site. Ela não abre o catálogo: libera exatamente os slugs que
  // o vendedor escolheu, e só enquanto o link vive. Token inválido, expirado,
  // encerrado ou de uma seleção sem preço é o mesmo que não ter mandado token.
  const tokenSel = typeof body.selecao === 'string' ? body.selecao.trim().slice(0, 32) : '';
  const sel = tokenSel ? await lerSelecaoPorToken(site, tokenSel) : null;
  const selValida = sel && sel.mostrar_preco && selecaoAtiva(sel) ? sel : null;
  const naSelecao = new Set(selValida?.slugs ?? []);

  if (papel === 'anonimo' && !selValida) {
    res.status(401).json({ error: 'login-necessario', papel });
    return;
  }
  if (!aprovado && papel !== 'anonimo' && !selValida) {
    res.status(403).json({ error: 'aguardando-aprovacao', papel });
    return;
  }
  /** Quem não passaria pela porta acima só enxerga o que está na seleção. */
  const soPelaSelecao = papel === 'anonimo' || !aprovado;

  const { data: produtosData } = await site
    .from('produtos')
    .select('slug, erp_sku, tipo_vinculo')
    .in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];

  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site
        .from('erp_produtos')
        .select('sku, ativo, unidade, largura_m, metragem_padrao, preco_rolo, preco_metro, preco_rolo_min, preco_metro_min, preco_rolo_varejo, preco_metro_varejo, rolos_fechados, rolos_abertos, promocao, preco_atualizado_em, sincronizado_em')
        .in('sku', skus)
    : { data: [] };
  const porSku = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  const itens: Record<string, unknown> = {};
  for (const slug of slugs) {
    const dentroDaSelecao = Boolean(selValida) && naSelecao.has(slug);

    // Quem só tem acesso por causa do link não pode usá-lo como chave-mestra do
    // catálogo: pedir um slug de fora da lista devolve ausência, não preço.
    if (soPelaSelecao && !dentroDaSelecao) {
      itens[slug] = { disponivel: false, foraDaSelecao: true };
      continue;
    }

    const p = produtos.find((x) => x.slug === slug);
    const e = p?.erp_sku ? porSku.get(p.erp_sku) : undefined;
    if (!p || !e || !e.ativo) {
      itens[slug] = { disponivel: false };
      continue;
    }
    // Preco zero no espelho e' cadastro incompleto do ERP, nao promocao: SKU que
    // entrou sem passar pelo pricing_engineering. Zero tem que virar ausente,
    // senao o card anuncia "R$ 0,00" e o checkout aceita o pedido de graca.
    const baseRolo = Number(e.preco_rolo) > 0 ? e.preco_rolo : null;
    const baseMetro = Number(e.preco_metro) > 0 ? e.preco_metro : null;

    // O acréscimo é aplicado AQUI, no servidor. O cliente recebe o número
    // final e nunca o percentual — no navegador não há como recalcular a base.
    const pct = dentroDaSelecao ? Number(selValida?.acrescimo_pct ?? 0) : 0;
    const rolo = pct > 0 ? aplicarAcrescimo(baseRolo, pct) : baseRolo;
    const metro = pct > 0 ? aplicarAcrescimo(baseMetro, pct) : baseMetro;

    const item: Record<string, unknown> = {
      disponivel: rolo != null || metro != null,
      rolo,
      metro,
      metragemPadrao: e.metragem_padrao,
      larguraM: e.largura_m,
      unidade: e.unidade ?? 'ML',
      promocao: Boolean(e.promocao),
      atualizadoEm: e.preco_atualizado_em ?? e.sincronizado_em,
    };
    // O cliente precisa saber que aquele valor é o daquela seleção, não a
    // tabela do site — é o que a legenda da tela diz. O percentual não vai.
    if (dentroDaSelecao) item.viaSelecao = true;

    // Só admin. Construído campo a campo: o que não entra aqui não sai.
    if (papel === 'admin') {
      item.roloVarejo = e.preco_rolo_varejo;
      item.metroVarejo = e.preco_metro_varejo;
      // O ERP não precificou o atacado e o preço acima é a tabela de varejo.
      // A Central já tem a ocorrência; aqui é o aviso na própria tela.
      item.usandoVarejo = !(Number(e.preco_rolo_min) > 0) || !(Number(e.preco_metro_min) > 0);
      item.erpSku = p.erp_sku;
      // As bolinhas do card: verde = tem rolo fechado, laranja = tem ponta.
      // Vem por aqui, e não por /api/nz/estoque, porque este endpoint já é
      // chamado UMA vez por página de cards; o de estoque consulta o ERP ao
      // vivo por SKU e derrubaria a vitrine com 60 requisições.
      item.estoque = { rolosFechados: Number(e.rolos_fechados ?? 0), rolosAbertos: Number(e.rolos_abertos ?? 0) };
      // Dentro de uma seleção o admin vê a conta que o cliente não vê: de onde
      // saiu o número e de quanto foi o aumento.
      if (dentroDaSelecao && pct > 0) {
        item.base = { rolo: baseRolo, metro: baseMetro };
        item.acrescimoPct = pct;
      }
    }
    itens[slug] = item;
  }

  res.status(200).json({ papel, selecao: selValida?.token ?? null, itens });
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
