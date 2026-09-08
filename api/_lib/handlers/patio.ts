// GET /api/nz/patio — quem tem rolo fechado (bolinha verde) e quem tem ponta
// aberta (bolinha laranja), no catálogo INTEIRO. SÓ ADMIN.
//
// POR QUE UM ENDPOINT NOVO E NÃO O /api/nz/precos
// As bolinhas do card vêm junto do preço, e isso resolve a VITRINE: uma
// requisição por página de 60 cards. Mas filtrar é outra pergunta — "me mostre
// só o que tem rolo fechado" precisa da resposta para os 806 itens do catálogo,
// não para os 60 que estão na tela. Pedir preço de tudo para descobrir isso
// seria mandar a tabela inteira para o navegador por causa de duas bolinhas.
//
// Aqui não vai número nenhum: só a LISTA DE SLUGS de cada sinal. É o mínimo que
// responde à pergunta do filtro, e mesmo assim é dado de admin — quem decide é
// o servidor, como no preço, e a resposta é `no-store`.
//
// Tamanho real (2026-09-10): 194 SKUs com algum rolo → ~220 slugs, ~6 KB.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';

interface LinhaEspelho {
  sku: string;
  ativo: boolean;
  rolos_fechados: number | null;
  rolos_abertos: number | null;
}

interface LinhaProduto {
  slug: string;
  erp_sku: string | null;
}

/** PostgREST devolve no máximo 1000 por vez; hoje são ~200, mas o pátio cresce. */
const PAGINA = 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const { papel } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel !== 'admin') {
    res.status(403).json({ error: 'somente-admin', papel });
    return;
  }

  // Só os SKUs que têm alguma coisa no pátio — é uma fração do espelho.
  const espelho: LinhaEspelho[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await site
      .from('erp_produtos')
      .select('sku, ativo, rolos_fechados, rolos_abertos')
      .or('rolos_fechados.gt.0,rolos_abertos.gt.0')
      .range(de, de + PAGINA - 1);
    if (error) {
      res.status(500).json({ error: 'erp_produtos', detalhe: error.message });
      return;
    }
    const pagina = (data ?? []) as unknown as LinhaEspelho[];
    espelho.push(...pagina);
    if (pagina.length < PAGINA) break;
  }

  // SKU inativo no ERP não aparece na loja; deixá-lo aqui faria a contagem da
  // faceta prometer produtos que o catálogo não tem.
  const comFechado = new Set(
    espelho.filter((e) => e.ativo && Number(e.rolos_fechados ?? 0) > 0).map((e) => e.sku)
  );
  const comAberto = new Set(
    espelho.filter((e) => e.ativo && Number(e.rolos_abertos ?? 0) > 0).map((e) => e.sku)
  );
  const skus = [...new Set([...comFechado, ...comAberto])];

  // Um SKU pode ter mais de um slug (alias NZWRAP → SH Wrapping): a volta é
  // pelo produto, nunca pelo SKU, senão os alias ficariam de fora do filtro.
  const fechados: string[] = [];
  const abertos: string[] = [];
  if (skus.length) {
    const { data, error } = await site
      .from('produtos')
      .select('slug, erp_sku')
      .in('erp_sku', skus);
    if (error) {
      res.status(500).json({ error: 'produtos', detalhe: error.message });
      return;
    }
    for (const p of (data ?? []) as unknown as LinhaProduto[]) {
      if (!p.erp_sku) continue;
      if (comFechado.has(p.erp_sku)) fechados.push(p.slug);
      if (comAberto.has(p.erp_sku)) abertos.push(p.slug);
    }
  }

  res.status(200).json({ papel, fechados, abertos });
}
