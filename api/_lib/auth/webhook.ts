// Assinatura do Send Email Hook do Supabase Auth — padrão "Standard Webhooks".
//
// O Supabase manda três cabeçalhos: `webhook-id`, `webhook-timestamp` (segundos
// Unix) e `webhook-signature` ("v1,<base64>" — pode trazer várias separadas
// por espaço, quando o segredo está sendo trocado). A assinatura é
// HMAC-SHA256 de `${id}.${timestamp}.${corpo bruto}` com o segredo, que vem
// como "v1,whsec_<base64>". Só Web Crypto aqui: o endpoint roda na Edge
// (api/auth-email.ts), onde não existe node:crypto — e no Node moderno o
// mesmo `crypto.subtle` existe, então o teste roda sem dublê.
//
// Por que a Edge: o runtime Node da Vercel entrega `req.body` já parseado e
// não expõe os bytes originais; a assinatura é sobre os bytes. Na Edge o
// corpo chega bruto (`await req.text()`).

export interface CabecalhosWebhook {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

/** Aceita `Headers` (Edge) ou o objeto de cabeçalhos do Node. */
export function lerCabecalhos(h: Headers | Record<string, string | string[] | undefined>): CabecalhosWebhook {
  const pega = (nome: string): string | null => {
    if (typeof (h as Headers).get === 'function') return (h as Headers).get(nome);
    const v = (h as Record<string, string | string[] | undefined>)[nome];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  };
  return { id: pega('webhook-id'), timestamp: pega('webhook-timestamp'), signature: pega('webhook-signature') };
}

function base64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesParaBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

/** "v1,whsec_abc" → bytes do segredo. Aceita também só "whsec_abc" ou o base64 cru. */
export function segredoBytes(segredo: string): Uint8Array {
  const semVersao = segredo.trim().replace(/^v1,/, '');
  const semPrefixo = semVersao.replace(/^whsec_/, '');
  return base64ParaBytes(semPrefixo);
}

/**
 * O segredo do hook, derivado da chave de serviço do Supabase (HMAC-SHA256 com
 * um rótulo fixo). Por que derivar: a Vercel não deixou criar variável nova
 * pelo MCP, e a função já tem a chave de serviço. Derivar é padrão de KDF —
 * quem vê o segredo do hook (na configuração do Auth) não chega à chave
 * mestra. Se a chave de serviço for trocada, o segredo muda: rodar de novo o
 * patch de configuração (scripts/auth-config.mjs). `AUTH_HOOK_SECRET`, se
 * existir, tem prioridade (api/auth-email.ts).
 */
export const ROTULO_DERIVACAO = 'nz-auth-email-hook-v1';

export async function derivarSegredo(chaveMestra: string): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(chaveMestra), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(ROTULO_DERIVACAO));
  return `v1,whsec_${bytesParaBase64(bytes)}`;
}

export async function assinar(segredo: string, id: string, timestamp: string, corpo: string): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', segredoBytes(segredo).buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(`${id}.${timestamp}.${corpo}`));
  return bytesParaBase64(sig);
}

function iguaisEmTempoConstante(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export type ResultadoVerificacao = { ok: true } | { ok: false; motivo: 'cabecalhos-ausentes' | 'timestamp-invalido' | 'fora-do-prazo' | 'assinatura-nao-bate' };

/**
 * Confere id, timestamp (±5 min) e assinatura. `corpo` tem de ser o texto
 * EXATO recebido — nunca um JSON reserializado.
 */
export async function verificarAssinatura(segredo: string, cab: CabecalhosWebhook, corpo: string, agoraMs: number = Date.now(), toleranciaSeg = 300): Promise<ResultadoVerificacao> {
  if (!cab.id || !cab.timestamp || !cab.signature) return { ok: false, motivo: 'cabecalhos-ausentes' };
  const ts = Number(cab.timestamp);
  if (!Number.isFinite(ts)) return { ok: false, motivo: 'timestamp-invalido' };
  if (Math.abs(agoraMs / 1000 - ts) > toleranciaSeg) return { ok: false, motivo: 'fora-do-prazo' };
  const esperada = await assinar(segredo, cab.id, cab.timestamp, corpo);
  const recebidas = cab.signature
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.includes(',') ? s.slice(s.indexOf(',') + 1) : s));
  return recebidas.some((r) => iguaisEmTempoConstante(r, esperada)) ? { ok: true } : { ok: false, motivo: 'assinatura-nao-bate' };
}
