// E-mail transacional do site — pelo Resend (resend.com), com a API HTTP.
//
// Decisão da revisão de auth (FIRECRAL/PLANO_AUTH_SITE_NZGROUP.md §4): o site
// manda e-mail pelo Resend, remetente nao-responda@nzgroup.com.br, domínio
// verificado no DNS. A chave fica SÓ no servidor (`RESEND_API_KEY` na Vercel)
// — o EmailJS antigo do Admin precisava de chave no navegador e nunca recebeu
// as chaves; o FormSubmit do formulário mandava CPF para um serviço de fora.
//
// Sem chave configurada, `enviarEmail` não lança: devolve { ok: false,
// motivo: 'nao-configurado' } e quem chamou decide o que mostrar. Nada do
// site pode cair porque o e-mail não saiu.

const API = 'https://api.resend.com/emails';
const REMETENTE_PADRAO = 'NZ Group <nao-responda@nzgroup.com.br>';
const TEMPO_MAXIMO_MS = 8000;

export interface Email {
  para: string | string[];
  assunto: string;
  html: string;
  texto: string;
  responderPara?: string;
  /** `caminho` é uma URL que o Resend baixa (ex.: URL assinada do Storage). */
  anexos?: { nome: string; caminho: string }[];
}

export type ResultadoEmail = { ok: true; id: string | null } | { ok: false; motivo: 'nao-configurado' | 'recusado' | 'falha-rede'; detalhe?: string };

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function remetente(): string {
  return process.env.EMAIL_REMETENTE || REMETENTE_PADRAO;
}

export async function enviarEmail(e: Email): Promise<ResultadoEmail> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false, motivo: 'nao-configurado' };
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: remetente(),
        to: Array.isArray(e.para) ? e.para : [e.para],
        subject: e.assunto,
        html: e.html,
        text: e.texto,
        ...(e.responderPara ? { reply_to: e.responderPara } : {}),
        ...(e.anexos?.length ? { attachments: e.anexos.map((a) => ({ filename: a.nome, path: a.caminho })) } : {}),
      }),
      // Com anexo o Resend baixa o arquivo antes de responder: mais tempo.
      signal: AbortSignal.timeout(e.anexos?.length ? 25000 : TEMPO_MAXIMO_MS),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!r.ok) {
      console.warn('[email] Resend recusou:', r.status, j.name, j.message);
      return { ok: false, motivo: 'recusado', detalhe: j.message ?? `http-${r.status}` };
    }
    return { ok: true, id: j.id ?? null };
  } catch (err) {
    console.warn('[email] falha de rede:', err instanceof Error ? err.message : err);
    return { ok: false, motivo: 'falha-rede' };
  }
}

/** Para colocar texto vindo de formulário dentro do HTML do e-mail. */
export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
