// POST /api/nz/testar — diagnóstico de transportadora, só para admin.
//
// Diferente do endpoint público (/api/nz/prazo), este devolve a resposta
// CRUA da transportadora, inclusive os campos de valor que o público descarta.
// É o que permite conferir a integração sem adivinhar. Por isso exige JWT com
// role='admin' lida NO SERVIDOR — nunca confiando no que o cliente diz que é.
//
// Padrão de auth copiado de api/cron/ai-writer.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { carrierConfigStatus, getAdapter, isRealMode } from '../carriers/index.js';
import { fatorCubagem, pesoTaxavel } from '../carriers/cubagem.js';
import { normalizarResultados } from '../carriers/types.js';

const CEP_RE = /^[0-9]{8}$/;
const QTD_MAX = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      error: 'ENV ausente',
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceKey,
    });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // --- auth: JWT do Supabase + role admin conferida no banco.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};

  // Catálogo de serviços do Melhor Envio, para o admin saber quais ids existem
  // antes de restringir a lista em shipping_carriers.config.servicos.
  if (body.listarServicos) {
    res.status(200).json(await listarServicosMelhorEnvio());
    return;
  }

  // Sem corpo, devolve só o status de configuração — é o que o painel usa para
  // exibir "credencial configurada ✓/✗" sem nunca ver o valor.
  if (!body.cep) {
    res.status(200).json({ modo: isRealMode() ? 'real' : 'mock', carriers: carrierConfigStatus() });
    return;
  }

  const cep = String(body.cep).replace(/\D/g, '');
  if (!CEP_RE.test(cep)) {
    res.status(400).json({ error: 'CEP inválido. Informe 8 dígitos.' });
    return;
  }
  const profileId = typeof body.profileId === 'string' ? body.profileId : null;
  if (!profileId) {
    res.status(400).json({ error: 'Informe profileId.' });
    return;
  }

  // Quantidade e valor declarado são opcionais: sem eles o teste roda como uma
  // consulta de 1 volume, que é o caso mais comum da página de produto.
  const qtdBruta = Math.floor(Number(body.qtd));
  const qtd = Number.isFinite(qtdBruta) && qtdBruta >= 1 ? Math.min(qtdBruta, QTD_MAX) : 1;
  const vlBruto = Number(body.vldeclarado);
  const vlOverride = Number.isFinite(vlBruto) && vlBruto > 0 ? vlBruto : null;

  const { data: perfil } = await supabase
    .from('shipping_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();

  if (!perfil) {
    res.status(404).json({ error: 'Perfil de embalagem não encontrado.' });
    return;
  }
  const p = perfil as unknown as {
    id: string;
    nome: string;
    peso_kg: number;
    comprimento_cm: number;
    largura_cm: number;
    altura_cm: number;
    valor_declarado?: number;
  };

  const { data: carriers } = await supabase
    .from('shipping_carriers')
    .select('slug, nome, cep_origem, dias_manuseio, config')
    .order('ordem', { ascending: true });

  const lista = (carriers ?? []) as unknown as {
    slug: string;
    nome: string;
    cep_origem: string;
    dias_manuseio: number;
    config: unknown;
  }[];

  const valorDeclarado = (vlOverride ?? Number(p.valor_declarado ?? 100)) * qtd;

  const resultados = await Promise.all(
    lista.map(async (c) => {
      const adapter = getAdapter(c.slug);
      if (!adapter) {
        return { carrier: c.slug, ok: false, erro: 'Adapter não encontrado' };
      }
      if (!adapter.isConfigured()) {
        return { carrier: c.slug, ok: false, erro: 'Credencial não configurada' };
      }

      // Mesma conta do endpoint público: é isso que permite conferir se a
      // transportadora está cobrando pelo peso que esperamos.
      const peso = pesoTaxavel(p, qtd, fatorCubagem(c.config));

      const inicio = Date.now();
      try {
        const cotacoes = normalizarResultados(
          await adapter.quoteDeadline({
            cepOrigem: c.cep_origem,
            cepDestino: cep,
            pesoKg: peso.pesoKg,
            pesoRealKg: peso.pesoReal,
            quantidade: qtd,
            comprimentoCm: Number(p.comprimento_cm),
            larguraCm: Number(p.largura_cm),
            alturaCm: Number(p.altura_cm),
            valorDeclarado,
            config: c.config,
          })
        );
        const primeira = cotacoes[0];
        return {
          carrier: c.slug,
          nome: c.nome,
          ok: true,
          // Uma linha por serviço. Jadlog/Gollog cotam uma modalidade só e
          // trazem um item; o Melhor Envio traz um por transportadora×serviço.
          opcoes: cotacoes.map((q) => ({
            servico: q.servico ?? '',
            servicoNome: q.servicoNome ?? q.modalidade ?? c.nome,
            transportadora: q.transportadora ?? c.nome,
            diasTransporte: q.dias,
            diasTotal: q.dias + c.dias_manuseio,
            valorFrete: q.valorTotal,
            modalidade: q.modalidade,
          })),
          // Campos de compatibilidade: a primeira opção (a que o cache antigo
          // guardava). Mantidos para não quebrar leitura de fora.
          diasTransporte: primeira.dias,
          diasManuseio: c.dias_manuseio,
          diasTotal: primeira.dias + c.dias_manuseio,
          valorFrete: primeira.valorTotal,
          modalidade: primeira.modalidade,
          // Os dois pesos lado a lado: qual venceu explica o valor cobrado.
          pesoEnviadoKg: peso.pesoKg,
          pesoRealKg: peso.pesoReal,
          pesoCubadoKg: peso.pesoCubado,
          fatorCubagem: peso.fator,
          valorDeclarado,
          ms: Date.now() - inicio,
          // Só aqui: o payload cru, para conferir a integração.
          raw: cotacoes.map((q) => q.raw),
        };
      } catch (err) {
        return {
          carrier: c.slug,
          nome: c.nome,
          ok: false,
          pesoEnviadoKg: peso.pesoKg,
          pesoRealKg: peso.pesoReal,
          pesoCubadoKg: peso.pesoCubado,
          ms: Date.now() - inicio,
          erro: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  res.status(200).json({
    modo: isRealMode() ? 'real' : 'mock',
    perfil: { id: p.id, nome: p.nome },
    cep,
    quantidade: qtd,
    resultados,
  });
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * GET /api/v2/me/shipment/services no Melhor Envio — o catálogo de serviços com
 * seus ids. Exige a permissão `shipping-companies` no token.
 *
 * Existe porque a doc é explícita: os ids não seguem ordem fixa entre versões e
 * os nomes podem mudar, então o admin precisa VER a lista antes de restringir
 * `config.servicos`. Nada de segredo sai daqui — só id, nome e transportadora.
 */
async function listarServicosMelhorEnvio(): Promise<{
  ok: boolean;
  servicos?: { id: string; nome: string; transportadora: string }[];
  erro?: string;
}> {
  const token = process.env.MELHORENVIO_TOKEN;
  const email = process.env.MELHORENVIO_UA_EMAIL;
  if (!token || !email) {
    return { ok: false, erro: 'MELHORENVIO_TOKEN / MELHORENVIO_UA_EMAIL não configurados.' };
  }
  const base = (process.env.MELHORENVIO_ENDPOINT || 'https://melhorenvio.com.br').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/v2/me/shipment/services`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': `NZSTORE (${email})`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, erro: 'Token inválido ou sem a permissão shipping-companies.' };
    }
    if (!res.ok) return { ok: false, erro: `HTTP ${res.status}` };
    const json = (await res.json()) as {
      id?: number | string;
      name?: string;
      company?: { name?: string };
    }[];
    if (!Array.isArray(json)) return { ok: false, erro: 'Resposta inesperada.' };
    return {
      ok: true,
      servicos: json.map((s) => ({
        id: String(s.id ?? ''),
        nome: s.name ?? '',
        transportadora: s.company?.name ?? '',
      })),
    };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  }
}
