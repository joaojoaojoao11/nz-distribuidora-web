// POST /api/nz/conta — cadastro do usuário: o que falta, quem já é cliente da
// NZ e recuperação de senha.
//
// Ops (campo `op`):
//   completude          logado  — o que falta no cadastro para poder comprar
//   consultar-documento logado  — CPF/CNPJ já é cliente no NZERP? devolve os
//                                 dados para pré-preencher SÓ se o e-mail bater
//   pos-cadastro        logado  — vincula ao cliente do ERP e aplica a
//                                 aprovação automática do lojista
//   historico-erp       logado  — pedidos, notas e parcelas que o cliente já
//                                 tinha no NZERP (lista branca de colunas)
//   atribuir-titulos    admin   — roda o job que decide de quem é cada título
//   titulos-sem-dono    admin   — o que sobrou, para atribuir à mão
//   atribuir-titulo     admin   — atribui um título a um cliente
//   recuperar-senha     público — envia o e-mail de redefinição
//
// Por que `recuperar-senha` passa pelo servidor em vez de o front chamar o
// Supabase direto: assim a resposta é sempre 200 (não dá para descobrir quais
// e-mails têm conta) e o redirectTo não depende do que o navegador mandar.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { ipDoCliente } from '../asaas/cliente.js';
import { completude } from '../conta/completude.js';
import { normalizarEmail, validarCpfCnpj } from '../conta/documento.js';
import { consultarDocumento, registrarLog, vincularComErp, type PerfilVinculo } from '../conta/vinculo.js';
import { clienteDoUsuario, pedidosDoCliente, titulosDoCliente } from '../conta/erpHistorico.js';
import { atribuirTitulos, titulosSemDono } from '../conta/atribuirTitulos.js';

export const SITE_URL = 'https://www.nzgroup.com.br';

const CAMPOS_PERFIL =
  'id, role, email, is_approved, erp_client_id, full_name, company_name, ie, phone, cpf_cnpj, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, cadastro_completo_em';

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Reusa checkout_tentativas (mesma ideia, outra `forma`). */
async function excedeu(site: Db, forma: string, chave: { userId?: string | null; ip?: string | null }, maximo: number, minutos: number): Promise<boolean> {
  const desde = new Date(Date.now() - minutos * 60_000).toISOString();
  let q = site.from('checkout_tentativas').select('id', { count: 'exact', head: true }).eq('forma', forma).gte('criado_em', desde);
  q = chave.userId ? q.eq('user_id', chave.userId) : q.eq('ip', chave.ip ?? '');
  const { count } = await q;
  return Number(count ?? 0) >= maximo;
}

async function registrarTentativa(site: Db, forma: string, userId: string | null, ip: string | null): Promise<void> {
  await site
    .from('checkout_tentativas')
    .insert({ user_id: userId, ip, forma, resultado: 'tentativa' })
    .then(
      () => undefined,
      () => undefined
    );
}

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
  const site = createClient(siteUrl, siteKey);
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const op = typeof body.op === 'string' ? body.op : '';
  const ip = ipDoCliente(req.headers as Record<string, string | string[] | undefined>);

  // ------------------------------------------------------------- público
  if (op === 'recuperar-senha') {
    const email = normalizarEmail(body.email);
    // Resposta sempre igual: nunca revela se o e-mail existe.
    const generico = { ok: true as const };
    if (!email.includes('@') || email.length > 200) {
      res.status(200).json(generico);
      return;
    }
    if (await excedeu(site, 'RECUPERAR_SENHA', { ip }, 5, 60)) {
      res.status(200).json(generico);
      return;
    }
    await registrarTentativa(site, 'RECUPERAR_SENHA', null, ip);
    await site.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/nova-senha` }).then(
      () => undefined,
      () => undefined
    );
    res.status(200).json(generico);
    return;
  }

  // -------------------------------------------------------------- logado
  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }

  const { data: perfilData } = await site.from('user_profiles').select(CAMPOS_PERFIL).eq('id', userId).maybeSingle();
  const perfil = (perfilData ?? null) as (PerfilVinculo & Record<string, string | null>) | null;
  if (!perfil) {
    res.status(404).json({ error: 'perfil-nao-encontrado' });
    return;
  }

  if (op === 'completude') {
    res.status(200).json({ ...completude(perfil), papel, aprovado: perfil.is_approved, vinculadoErp: Boolean(perfil.erp_client_id) });
    return;
  }

  if (op === 'consultar-documento') {
    const doc = body.cpf_cnpj;
    if (!validarCpfCnpj(doc)) {
      res.status(400).json({ error: 'documento-invalido' });
      return;
    }
    if (await excedeu(site, 'CONSULTA_DOC', { userId }, 10, 1)) {
      res.status(429).json({ error: 'muitas-consultas' });
      return;
    }
    await registrarTentativa(site, 'CONSULTA_DOC', userId, ip);
    const r = await consultarDocumento(doc, normalizarEmail(perfil.email));
    res.status(200).json(r);
    return;
  }

  if (op === 'pos-cadastro') {
    const r = await vincularComErp(site, perfil);
    res.status(200).json(r);
    return;
  }

  // O histórico que o cliente já tinha na NZ antes do site existir: pedidos de
  // balcão, notas fiscais e parcelas. Tudo lido pelo módulo com lista branca —
  // preço de custo, margem, limite de crédito e vendedor nunca saem do ERP.
  if (op === 'historico-erp') {
    const cliente = await clienteDoUsuario(site, userId);
    if (!cliente) {
      res.status(200).json({ vinculado: false, cliente: null, pedidos: [], titulos: [] });
      return;
    }
    const [pedidos, titulos] = await Promise.all([pedidosDoCliente(site, userId), titulosDoCliente(site, userId)]);
    res.status(200).json({ vinculado: true, cliente, pedidos, titulos });
    return;
  }

  if (op === 'atribuir-titulos' || op === 'titulos-sem-dono' || op === 'atribuir-titulo') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    if (op === 'atribuir-titulos') {
      const r = await atribuirTitulos(site);
      res.status(r.erro ? 502 : 200).json({ ok: !r.erro, ...r });
      return;
    }
    if (op === 'titulos-sem-dono') {
      const { data: log } = await site.from('erp_atribuicao_log').select('*').order('rodou_em', { ascending: false }).limit(1).maybeSingle();
      res.status(200).json({ ok: true, ultimaRodada: log ?? null, titulos: await titulosSemDono(site) });
      return;
    }
    // Atribuição à mão: o admin diz de quem é. Nunca é sobrescrita pelo job.
    const tituloId = typeof body.tituloId === 'string' ? body.tituloId : '';
    const clientId = typeof body.erpClientId === 'string' ? body.erpClientId : '';
    if (!tituloId || !clientId) {
      res.status(400).json({ error: 'faltam-ids' });
      return;
    }
    const { error } = await site
      .from('erp_titulo_dono')
      .upsert({ titulo_id: tituloId, erp_client_id: clientId, chave: 'manual', confianca: 'manual', confirmado_por: userId, atualizado_em: new Date().toISOString() }, { onConflict: 'titulo_id' });
    res.status(error ? 500 : 200).json(error ? { error: 'nao-gravou', message: error.message } : { ok: true });
    return;
  }

  if (op === 'reavaliar') {
    // Admin pede a reavaliação de um cadastro (botão "procurar no ERP").
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    const alvo = typeof body.userId === 'string' ? body.userId : '';
    const { data } = await site.from('user_profiles').select(CAMPOS_PERFIL).eq('id', alvo).maybeSingle();
    if (!data) {
      res.status(404).json({ error: 'perfil-nao-encontrado' });
      return;
    }
    const r = await vincularComErp(site, data as unknown as PerfilVinculo);
    await registrarLog(site, 'reavaliar', normalizarEmail((data as { email?: string }).email), r, userId);
    res.status(200).json(r);
    return;
  }

  res.status(400).json({ error: 'op-desconhecida' });
}
