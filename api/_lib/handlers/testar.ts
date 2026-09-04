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

const CEP_RE = /^[0-9]{8}$/;

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

  const { data: perfil } = await supabase
    .from('shipping_profiles')
    .select('id, nome, peso_kg, comprimento_cm, largura_cm, altura_cm')
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
  };

  const { data: carriers } = await supabase
    .from('shipping_carriers')
    .select('slug, nome, cep_origem, dias_manuseio')
    .order('ordem', { ascending: true });

  const lista = (carriers ?? []) as unknown as {
    slug: string;
    nome: string;
    cep_origem: string;
    dias_manuseio: number;
  }[];

  const resultados = await Promise.all(
    lista.map(async (c) => {
      const adapter = getAdapter(c.slug);
      if (!adapter) {
        return { carrier: c.slug, ok: false, erro: 'Adapter não encontrado' };
      }
      if (!adapter.isConfigured()) {
        return { carrier: c.slug, ok: false, erro: 'Credencial não configurada' };
      }

      const inicio = Date.now();
      try {
        const cotacao = await adapter.quoteDeadline({
          cepOrigem: c.cep_origem,
          cepDestino: cep,
          pesoKg: Number(p.peso_kg),
          comprimentoCm: Number(p.comprimento_cm),
          larguraCm: Number(p.largura_cm),
          alturaCm: Number(p.altura_cm),
        });
        return {
          carrier: c.slug,
          nome: c.nome,
          ok: true,
          diasTransporte: cotacao.dias,
          diasManuseio: c.dias_manuseio,
          diasTotal: cotacao.dias + c.dias_manuseio,
          modalidade: cotacao.modalidade,
          ms: Date.now() - inicio,
          // Só aqui: o payload cru, para conferir a integração.
          raw: cotacao.raw,
        };
      } catch (err) {
        return {
          carrier: c.slug,
          nome: c.nome,
          ok: false,
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
