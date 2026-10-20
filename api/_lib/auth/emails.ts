// E-mails do Supabase Auth (confirmação, senha, convite, link mágico, troca de
// e-mail, código) no modelo visual da NZ — os mesmos das garantias e dos
// avisos, só que montados aqui com as peças mínimas, porque este módulo roda
// na Edge (api/auth-email.ts) e não pode puxar o módulo das garantias inteiro.
//
// O link é o endpoint de verificação do próprio Supabase:
//   https://<projeto>.supabase.co/auth/v1/verify?token=<token_hash>&type=<tipo>&redirect_to=<url>
// É ele que confirma e manda o navegador para o site (a lista de redirects
// permitidos é a do Auth; o site e o localhost já estão nela).

import { esc } from '../email.js';

export const SITE = 'https://www.nzgroup.com.br';
const FONTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const COR = { fundo: '#050505', cartao: '#0e0e0e', borda: '#232323', texto: '#f5f5f7', secundario: '#a1a1a6', mudo: '#6b6b70', vermelho: '#d11e1e' };

export type TipoAuth = 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email_change_current' | 'email_change_new' | 'email' | 'reauthentication';

export interface DadosAuth {
  tipo: string;
  email: string;
  novoEmail?: string | null;
  nome?: string | null;
  token?: string | null;
  tokenHash?: string | null;
  tokenHashNew?: string | null;
  redirectTo?: string | null;
  siteUrl?: string | null;
  /** URL do projeto Supabase (https://<ref>.supabase.co). */
  supabaseUrl: string;
}

export interface EmailPronto {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

export function linkDeVerificacao(supabaseUrl: string, tokenHash: string, tipo: string, redirectTo: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(tipo)}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

// ------------------------------------------------------------- modelo

function rotulo(t: string, cor = COR.mudo): string {
  return `<div style="font-family:${FONTE};font-size:10px;line-height:14px;letter-spacing:1.6px;text-transform:uppercase;color:${cor};">${esc(t)}</div>`;
}

function botao(texto: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
    <tr><td bgcolor="${COR.vermelho}" style="border-radius:10px;">
      <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:16px 28px;font-family:${FONTE};font-size:13px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(texto)}</a>
    </td></tr>
  </table>`;
}

interface Peca {
  etiqueta: string;
  titulo: string;
  paragrafos: string[];
  botao?: { texto: string; href: string } | null;
  codigo?: string | null;
  nota: string;
}

function montar(assunto: string, p: Peca): { html: string; texto: string } {
  const corpo = `
<tr><td style="padding:0 4px 18px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle"><img src="${SITE}/assets/email/logo-nz.png" width="66" height="28" alt="NZ" style="display:block;width:66px;height:28px;border:0;outline:none;" /></td>
    <td valign="middle" align="right">${rotulo(p.etiqueta)}</td>
  </tr></table>
</td></tr>
<tr><td bgcolor="${COR.cartao}" class="px" style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:18px;padding:30px 32px 28px;">
  ${rotulo(p.etiqueta, '#fbbf24')}
  <h1 class="h1" style="margin:10px 0 14px;font-family:${FONTE};font-size:24px;line-height:30px;font-weight:bold;color:${COR.texto};">${esc(p.titulo)}</h1>
  ${p.paragrafos.map((t) => `<p style="margin:0 0 14px;font-family:${FONTE};font-size:15px;line-height:22px;color:${COR.secundario};">${esc(t)}</p>`).join('')}
  ${p.codigo ? `<div style="margin:6px 0 18px;font-family:${FONTE};font-size:30px;line-height:36px;letter-spacing:8px;font-weight:bold;color:${COR.texto};">${esc(p.codigo)}</div>` : ''}
  ${p.botao ? `<div style="margin:8px 0 18px;">${botao(p.botao.texto, p.botao.href)}</div><p style="margin:0 0 14px;font-family:${FONTE};font-size:12px;line-height:18px;color:${COR.mudo};word-break:break-all;">Se o botão não abrir, copie e cole no navegador:<br />${esc(p.botao.href)}</p>` : ''}
  <p style="margin:0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.mudo};">${esc(p.nota)}</p>
</td></tr>
<tr><td align="center" style="padding:22px 24px 8px;font-family:${FONTE};font-size:11px;line-height:17px;color:${COR.mudo};">
  NZ Group · <a href="${SITE}" style="color:${COR.mudo};">nzgroup.com.br</a> · WhatsApp +55 11 91890-7565
</td></tr>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${esc(assunto)}</title>
<style>
  body { margin:0; padding:0; background:${COR.fundo}; }
  a { color:${COR.texto}; }
  @media (max-width: 620px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:22px !important; line-height:28px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COR.fundo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COR.fundo};">${esc(p.paragrafos[0] ?? p.titulo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COR.fundo}" style="background:${COR.fundo};">
  <tr><td align="center" style="padding:28px 12px 36px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
${corpo}
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const texto = [p.titulo, '', ...p.paragrafos, p.codigo ? `\nCódigo: ${p.codigo}` : null, p.botao ? `\n${p.botao.texto}: ${p.botao.href}` : null, '', p.nota].filter((l) => l !== null).join('\n');
  return { html, texto };
}

// ------------------------------------------------------------ por tipo

const VALIDADE = 'O link vale 30 minutos e só pode ser usado uma vez.';

/** Um e-mail por destinatário. Tipo desconhecido → lista vazia (o Supabase recebe 200 e segue). */
export function montarEmailsAuth(d: DadosAuth): EmailPronto[] {
  const site = (d.siteUrl || SITE).replace(/\/$/, '');
  const nome = (d.nome ?? '').trim().split(' ')[0] || null;
  const destino = (padrao: string) => (d.redirectTo && d.redirectTo !== site && d.redirectTo !== `${site}/` ? d.redirectTo : padrao);
  const link = (tipo: string, hash: string | null | undefined, padrao: string) => (hash ? linkDeVerificacao(d.supabaseUrl, hash, tipo, destino(padrao)) : null);

  switch (d.tipo) {
    case 'signup': {
      const href = link('signup', d.tokenHash, `${site}/login?confirmado=1`);
      if (!href) return [];
      const assunto = 'Confirme seu e-mail na NZ Group';
      const { html, texto } = montar(assunto, {
        etiqueta: 'Confirme seu e-mail',
        titulo: nome ? `${nome}, bem-vindo à NZ` : 'Bem-vindo à NZ',
        paragrafos: ['Confirme seu e-mail para ativar a conta. Depois disso a NZ confere o cadastro e libera o acesso aos preços — costuma levar até 1 dia útil.'],
        botao: { texto: 'Confirmar meu e-mail', href },
        nota: `${VALIDADE} Se você não criou conta no site nzgroup.com.br, ignore este e-mail.`,
      });
      return [{ para: d.email, assunto, html, texto }];
    }
    case 'recovery': {
      const href = link('recovery', d.tokenHash, `${site}/nova-senha`);
      if (!href) return [];
      const assunto = 'Redefinir sua senha na NZ Group';
      const { html, texto } = montar(assunto, {
        etiqueta: 'Senha',
        titulo: 'Redefinir sua senha',
        paragrafos: [`Recebemos um pedido para trocar a senha da conta ${d.email}. Clique no botão para escolher uma nova.`],
        botao: { texto: 'Escolher nova senha', href },
        nota: `${VALIDADE} Se não foi você, ignore este e-mail: nada muda e a senha atual continua valendo.`,
      });
      return [{ para: d.email, assunto, html, texto }];
    }
    case 'invite': {
      const href = link('invite', d.tokenHash, `${site}/nova-senha`);
      if (!href) return [];
      const assunto = 'Você foi convidado para o painel da NZ Group';
      const { html, texto } = montar(assunto, {
        etiqueta: 'Convite',
        titulo: 'Você foi convidado para o painel da NZ',
        paragrafos: ['Você tem usuário no NZERP, então ganhou acesso administrativo ao site nzgroup.com.br. Clique no botão para definir a sua senha de acesso ao site (a do ERP não serve aqui).'],
        botao: { texto: 'Definir minha senha', href },
        nota: `${VALIDADE} Se você não esperava este e-mail, pode ignorar.`,
      });
      return [{ para: d.email, assunto, html, texto }];
    }
    case 'magiclink': {
      const href = link('magiclink', d.tokenHash, `${site}/painel`);
      if (!href) return [];
      const assunto = 'Seu link de acesso à NZ Group';
      const { html, texto } = montar(assunto, {
        etiqueta: 'Acesso',
        titulo: 'Seu link de acesso',
        paragrafos: ['Clique para entrar na sua conta NZ.'],
        botao: { texto: 'Entrar na minha conta', href },
        nota: `${VALIDADE} Se não foi você, ignore este e-mail.`,
      });
      return [{ para: d.email, assunto, html, texto }];
    }
    case 'email_change':
    case 'email_change_current':
    case 'email_change_new': {
      const assunto = 'Confirme seu novo e-mail na NZ Group';
      const de = d.email;
      const para = d.novoEmail ?? '';
      const lista: EmailPronto[] = [];
      const peca = (href: string): Peca => ({
        etiqueta: 'Troca de e-mail',
        titulo: 'Confirme seu novo e-mail',
        paragrafos: [`Você pediu para trocar o e-mail da sua conta NZ de ${de} para ${para || 'um novo endereço'}. Confirme para concluir.`],
        botao: { texto: 'Confirmar novo e-mail', href },
        nota: `${VALIDADE} Se não foi você, ignore este e-mail.`,
      });
      // Atual: recebe o link com o token do e-mail atual. Novo: com o token novo.
      const hrefAtual = d.tipo !== 'email_change_new' ? link('email_change', d.tokenHash, `${site}/painel/dados`) : null;
      const hrefNovo = d.tipo !== 'email_change_current' ? link('email_change', d.tokenHashNew, `${site}/painel/dados`) : null;
      if (hrefAtual) lista.push({ para: de, assunto, ...montar(assunto, peca(hrefAtual)) });
      if (hrefNovo && para) lista.push({ para, assunto, ...montar(assunto, peca(hrefNovo)) });
      return lista;
    }
    case 'email':
    case 'reauthentication': {
      if (!d.token) return [];
      const assunto = `Seu código NZ: ${d.token}`;
      const { html, texto } = montar(assunto, {
        etiqueta: 'Código de confirmação',
        titulo: 'Seu código de confirmação',
        paragrafos: ['Use o código abaixo para confirmar a operação na sua conta NZ.'],
        codigo: d.token,
        nota: 'O código vale por alguns minutos. Se não foi você, ignore este e-mail.',
      });
      return [{ para: d.email, assunto, html, texto }];
    }
    default:
      return [];
  }
}
