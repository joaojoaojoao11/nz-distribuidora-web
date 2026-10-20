// POST /api/auth-email — Send Email Hook do Supabase Auth.
//
// Em vez de o Supabase mandar os e-mails de confirmação, senha, convite, link
// mágico e troca de e-mail pelo mailer dele (2 por hora, sem a cara da NZ) ou
// por SMTP (exigiria a chave do Resend dentro do Supabase), ele chama esta
// URL com os dados e o token, e nós mandamos pelo Resend — a mesma API, o
// mesmo remetente e o mesmo modelo visual das garantias (api/_lib/email.ts).
//
// Roda na EDGE, de propósito: a assinatura do Supabase (Standard Webhooks) é
// sobre os bytes exatos do corpo, e o runtime Node da Vercel entrega
// `req.body` já parseado, sem os bytes. Aqui `await req.text()` é o corpo
// bruto. É também por isso que este arquivo não entra no roteador
// api/nz/[acao].ts.
//
// Contrato (docs do Supabase): 200 com `{}` = enviado; erro = JSON
// `{ error: { http_code, message } }`, e o Supabase devolve o erro a quem
// pediu (o usuário vê "não foi possível enviar" e tenta de novo).
//
// Segredos: AUTH_HOOK_SECRET ("v1,whsec_…", o mesmo cadastrado no hook),
// RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY (só para a linha de log em
// avisos_enviados — é por ela que se confere o que saiu).

import { enviarEmail } from './_lib/email.js';
import { lerCabecalhos, verificarAssinatura } from './_lib/auth/webhook.js';
import { montarEmailsAuth } from './_lib/auth/emails.js';

export const config = { runtime: 'edge' };

interface Corpo {
  user?: { id?: string; email?: string; new_email?: string | null; user_metadata?: { full_name?: string; name?: string } | null };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const erro = (http_code: number, message: string) => json({ error: { http_code, message } }, http_code);

async function registrar(tipo: string, ok: boolean, detalhe: string | null): Promise<void> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return;
  try {
    await fetch(`${url}/rest/v1/avisos_enviados`, {
      method: 'POST',
      headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ chave: `auth-${tipo}:${crypto.randomUUID()}`, tipo: `auth-${tipo}`, ok, erro: detalhe }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* o log nunca derruba o envio */
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return erro(405, 'Método não permitido.');

  const segredo = process.env.AUTH_HOOK_SECRET;
  if (!segredo) return erro(500, 'AUTH_HOOK_SECRET ausente');

  const corpoBruto = await req.text();
  const v = await verificarAssinatura(segredo, lerCabecalhos(req.headers), corpoBruto);
  if (!v.ok) return erro(401, `assinatura: ${v.motivo}`);

  let corpo: Corpo;
  try {
    corpo = JSON.parse(corpoBruto) as Corpo;
  } catch {
    return erro(400, 'JSON inválido');
  }
  const u = corpo.user ?? {};
  const ed = corpo.email_data ?? {};
  const tipo = String(ed.email_action_type ?? '');
  const email = String(u.email ?? '').trim();
  if (!tipo || !email.includes('@')) return erro(400, 'sem tipo ou e-mail');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const emails = montarEmailsAuth({
    tipo,
    email,
    novoEmail: u.new_email ?? null,
    nome: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
    token: ed.token ?? null,
    tokenHash: ed.token_hash ?? null,
    tokenHashNew: ed.token_hash_new ?? null,
    redirectTo: ed.redirect_to ?? null,
    siteUrl: ed.site_url ?? null,
    supabaseUrl,
  });

  if (!emails.length) {
    await registrar(tipo || 'desconhecido', false, 'tipo sem modelo — nada enviado');
    return json({});
  }

  const falhas: string[] = [];
  for (const e of emails) {
    const r = await enviarEmail({ para: e.para, assunto: e.assunto, html: e.html, texto: e.texto });
    await registrar(tipo, r.ok, r.ok ? null : `${r.motivo}${r.detalhe ? `: ${r.detalhe}` : ''}`);
    if (!r.ok) falhas.push(r.motivo);
  }
  if (falhas.length) return erro(500, `e-mail não enviado (${falhas.join(', ')})`);
  return json({});
}
