// POST /api/nz/lead — contatos que chegam pelos formulários abertos do site.
//
//   { op: 'aplicador', dados }  "Encontre um aplicador" → installer_leads
//   { op: 'cupom', dados }      cupom surpresa das páginas NZPPF → leads
//
// Antes o navegador gravava direto na tabela (policy pública de insert) e o
// aviso ia pelo FormSubmit — que parou de chegar, e o do aplicador nem isso
// tinha: o lead ficava numa tabela que nenhuma tela do Admin mostra. Agora
// grava o servidor, que confere os dados, segura spam (honeypot + limite por
// IP, sem guardar o IP) e manda o e-mail para a NZ (avisos.ts).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import type { Db } from '../papel.js';
import { EMAIL_VALIDO } from '../email.js';
import { avisarAplicador, avisarCupom } from '../avisos.js';

const MAX_POR_HORA = 6;
const SERVICOS = ['PPF', 'Envelopamento'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }
  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'env-ausente' });
    return;
  }
  const site = createClient(siteUrl, siteKey);
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};

  // Honeypot: gente não vê o campo; robô preenche. Responde ok e não grava.
  if (typeof body.site === 'string' && body.site.trim()) {
    res.status(200).json({ ok: true });
    return;
  }
  const d = body.dados && typeof body.dados === 'object' ? (body.dados as Record<string, unknown>) : {};
  const ipHash = hashIp(req);

  if (body.op === 'aplicador') return aplicador(site, res, d, ipHash);
  if (body.op === 'cupom') return cupom(site, res, d, ipHash);
  res.status(400).json({ error: 'op-desconhecida', disponiveis: ['aplicador', 'cupom'] });
}

async function aplicador(site: Db, res: VercelResponse, d: Record<string, unknown>, ipHash: string) {
  const nome = texto(d.full_name, 120);
  const whatsapp = texto(d.whatsapp, 30);
  const cidade = texto(d.city, 80);
  const uf = texto(d.state, 2).toUpperCase();
  const servico = SERVICOS.includes(texto(d.service_type, 30)) ? texto(d.service_type, 30) : '';
  const veiculo = texto(d.vehicle, 120);
  const obs = texto(d.notes, 1000);
  const digitos = whatsapp.replace(/\D/g, '');
  if (nome.length < 2) return erro(res, 'nome-invalido');
  if (digitos.length < 10 || digitos.length > 13) return erro(res, 'whatsapp-invalido');
  if (!cidade) return erro(res, 'cidade-invalida');
  if (!servico) return erro(res, 'servico-invalido');
  if (await excedeu(site, 'installer_leads', ipHash)) {
    res.status(429).json({ error: 'muitos-envios' });
    return;
  }

  const { error } = await site.from('installer_leads').insert({
    full_name: nome,
    whatsapp,
    state: uf || null,
    city: cidade,
    vehicle: veiculo || null,
    service_type: servico,
    notes: obs || null,
    ip_hash: ipHash,
  });
  if (error) {
    console.error('[lead] aplicador não gravou:', error.message);
    res.status(500).json({ error: 'nao-consegui-registrar' });
    return;
  }
  await avisarAplicador(site, { nome, whatsapp, cidade, uf, servico, veiculo, obs });
  res.status(200).json({ ok: true });
}

async function cupom(site: Db, res: VercelResponse, d: Record<string, unknown>, ipHash: string) {
  const nome = texto(d.name, 120);
  const email = texto(d.email, 160).toLowerCase();
  const telefone = texto(d.phone, 30);
  // A origem vem das páginas das linhas ("NZPPF Prime - Cupom Surpresa").
  const origem = texto(d.source, 80);
  if (nome.length < 2) return erro(res, 'nome-invalido');
  if (email && !EMAIL_VALIDO.test(email)) return erro(res, 'email-invalido');
  if (!email && telefone.replace(/\D/g, '').length < 10) return erro(res, 'contato-invalido');
  if (!/^NZPPF /.test(origem)) return erro(res, 'origem-invalida');
  if (await excedeu(site, 'leads', ipHash)) {
    res.status(429).json({ error: 'muitos-envios' });
    return;
  }

  const { error } = await site.from('leads').insert({ name: nome, email: email || null, phone: telefone || null, source: origem, ip_hash: ipHash });
  if (error) {
    console.error('[lead] cupom não gravou:', error.message);
    res.status(500).json({ error: 'nao-consegui-registrar' });
    return;
  }
  await avisarCupom(site, { nome, email, telefone, origem });
  res.status(200).json({ ok: true });
}

// -------------------------------------------------------------------- util

function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function erro(res: VercelResponse, codigo: string) {
  res.status(400).json({ error: codigo });
}

async function excedeu(site: Db, tabela: 'installer_leads' | 'leads', ipHash: string): Promise<boolean> {
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await site.from(tabela).select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', desde);
  // Falha ao contar não pode barrar um cliente de verdade.
  if (error) return false;
  return (count ?? 0) >= MAX_POR_HORA;
}

/** sha256(ip + salt): conta envios da mesma origem sem guardar o IP. */
function hashIp(req: VercelRequest): string {
  const bruto = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(bruto) ? bruto[0] : bruto || '').split(',')[0].trim() || 'desconhecido';
  const sal = process.env.OCORRENCIAS_SALT || process.env.CRON_SECRET || 'nz';
  return createHash('sha256').update(`lead|${ip}|${sal}`).digest('hex');
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
