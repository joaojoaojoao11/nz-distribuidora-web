// Autoteste do Send Email Hook — sem rede.
//
//   · assinatura (Standard Webhooks): válida passa; segredo errado, corpo
//     alterado e timestamp velho não passam; cabeçalho com duas assinaturas
//     (troca de segredo) passa se uma bater;
//   · os e-mails de cada tipo: link de verificação do Supabase certo, assunto,
//     destinatário, troca de e-mail em dois envios, código sem link.
//
// Uso: npm run auth-email:test

import { spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-auth-email-'));

const build = spawnSync(
  process.execPath,
  [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'api/_lib/auth/webhook.ts', 'api/_lib/auth/emails.ts', 'api/_lib/email.ts', 'api/_lib/conta/limparNaoConfirmados.ts', 'api/_lib/conta/emailVerificado.ts', `--outdir=${outDir}`, '--outbase=api/_lib', '--format=esm', '--platform=node', '--log-level=error'],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const { verificarAssinatura, assinar, lerCabecalhos, segredoBytes, derivarSegredo, ROTULO_DERIVACAO } = await import(pathToFileURL(join(outDir, 'auth/webhook.js')).href);
const { montarEmailsAuth, linkDeVerificacao } = await import(pathToFileURL(join(outDir, 'auth/emails.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

console.log('\n=== ASSINATURA ===');
{
  const bruto = randomBytes(32);
  const segredo = `v1,whsec_${bruto.toString('base64')}`;
  const corpo = '{"user":{"email":"a@b.c"},"email_data":{"email_action_type":"signup","token_hash":"abc"}}';
  const id = 'msg_123';
  const ts = String(Math.floor(Date.now() / 1000));
  // Referência independente: HMAC do Node sobre `${id}.${ts}.${corpo}`.
  const esperada = createHmac('sha256', bruto).update(`${id}.${ts}.${corpo}`).digest('base64');
  ok('segredoBytes tira "v1," e "whsec_" e decodifica o base64', Buffer.from(segredoBytes(segredo)).equals(bruto));
  ok('assinar bate com o HMAC do Node', (await assinar(segredo, id, ts, corpo)) === esperada);
  const cab = { id, timestamp: ts, signature: `v1,${esperada}` };
  ok('assinatura válida passa', (await verificarAssinatura(segredo, cab, corpo)).ok === true);
  ok('corpo alterado não passa', (await verificarAssinatura(segredo, cab, corpo + ' ')).ok === false);
  ok('segredo errado não passa', (await verificarAssinatura(`v1,whsec_${randomBytes(32).toString('base64')}`, cab, corpo)).ok === false);
  const velho = await verificarAssinatura(segredo, { ...cab, timestamp: String(Number(ts) - 600), signature: `v1,${createHmac('sha256', bruto).update(`${id}.${Number(ts) - 600}.${corpo}`).digest('base64')}` }, corpo);
  ok('timestamp de 10 min atrás não passa (fora do prazo)', velho.ok === false && velho.motivo === 'fora-do-prazo');
  ok('sem cabeçalhos não passa', (await verificarAssinatura(segredo, { id: null, timestamp: null, signature: null }, corpo)).motivo === 'cabecalhos-ausentes');
  ok('duas assinaturas no cabeçalho (troca de segredo): passa se uma bater', (await verificarAssinatura(segredo, { ...cab, signature: `v1,AAAA v1,${esperada}` }, corpo)).ok === true);
  const h = new Headers({ 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${esperada}` });
  ok('lerCabecalhos aceita Headers da Edge', lerCabecalhos(h).id === id && lerCabecalhos(h).signature.endsWith(esperada));
  ok('lerCabecalhos aceita objeto do Node', lerCabecalhos({ 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${esperada}` }).timestamp === ts);
  // Derivação: o mesmo cálculo que scripts/hook-segredo.mjs faz com o Node para configurar o Supabase.
  const derivado = await derivarSegredo('chave-mestra-de-teste');
  const referencia = `v1,whsec_${createHmac('sha256', 'chave-mestra-de-teste').update(ROTULO_DERIVACAO).digest('base64')}`;
  ok('derivarSegredo: determinístico e igual ao HMAC do Node com o rótulo', derivado === referencia && derivado === (await derivarSegredo('chave-mestra-de-teste')));
  ok('derivarSegredo: chave diferente → segredo diferente', (await derivarSegredo('outra')) !== derivado);
  const corpo2 = '{"x":1}';
  const sig2 = await assinar(derivado, 'id2', ts, corpo2);
  ok('segredo derivado assina e verifica', (await verificarAssinatura(derivado, { id: 'id2', timestamp: ts, signature: `v1,${sig2}` }, corpo2)).ok === true);
}

console.log('\n=== E-MAILS ===');
const SUPA = 'https://uibjmvkvbthzypgozpcs.supabase.co';
const base = { email: 'cliente@exemplo.com', nome: 'Maria Silva', tokenHash: 'HASH123', redirectTo: 'https://www.nzgroup.com.br', siteUrl: 'https://www.nzgroup.com.br', supabaseUrl: SUPA };
{
  const link = linkDeVerificacao(SUPA, 'h&1', 'signup', 'https://www.nzgroup.com.br/login?confirmado=1');
  ok('link de verificação: endpoint do Supabase, token e redirect codificados', link === `${SUPA}/auth/v1/verify?token=h%261&type=signup&redirect_to=${encodeURIComponent('https://www.nzgroup.com.br/login?confirmado=1')}`);
  const s = montarEmailsAuth({ ...base, tipo: 'signup' });
  ok('signup: um e-mail para o cadastrado, assunto de confirmação, nome no título', s.length === 1 && s[0].para === base.email && s[0].assunto === 'Confirme seu e-mail na NZ Group' && s[0].html.includes('Maria, bem-vindo'));
  ok('signup: redirect padrão é /login?confirmado=1 quando o Supabase manda só o site', s[0].html.includes(encodeURIComponent('https://www.nzgroup.com.br/login?confirmado=1')) && s[0].html.includes('type=signup'));
  ok('signup: texto puro traz o link', s[0].texto.includes('/auth/v1/verify?token=HASH123'));
  const r = montarEmailsAuth({ ...base, tipo: 'recovery', redirectTo: 'https://www.nzgroup.com.br/nova-senha' });
  ok('recovery: type=recovery e volta para /nova-senha', r[0].html.includes('type=recovery') && r[0].html.includes(encodeURIComponent('https://www.nzgroup.com.br/nova-senha')) && /Redefinir/.test(r[0].assunto));
  const i = montarEmailsAuth({ ...base, tipo: 'invite', redirectTo: 'https://www.nzgroup.com.br/nova-senha' });
  ok('invite: convite para o painel, type=invite', i[0].html.includes('type=invite') && /convidado/.test(i[0].assunto));
  const m = montarEmailsAuth({ ...base, tipo: 'magiclink' });
  ok('magiclink: type=magiclink, cai no painel', m[0].html.includes('type=magiclink') && m[0].html.includes(encodeURIComponent('https://www.nzgroup.com.br/painel')));
  const t = montarEmailsAuth({ ...base, tipo: 'email_change', novoEmail: 'novo@exemplo.com', tokenHashNew: 'NOVO9' });
  ok('troca de e-mail: dois envios (atual e novo), cada um com seu token', t.length === 2 && t[0].para === base.email && t[0].html.includes('token=HASH123') && t[1].para === 'novo@exemplo.com' && t[1].html.includes('token=NOVO9'));
  const tn = montarEmailsAuth({ ...base, tipo: 'email_change_new', novoEmail: 'novo@exemplo.com', tokenHashNew: 'NOVO9' });
  ok('email_change_new: só o endereço novo', tn.length === 1 && tn[0].para === 'novo@exemplo.com');
  const c = montarEmailsAuth({ ...base, tipo: 'reauthentication', token: '482913', tokenHash: null });
  ok('código (reauthentication): sem link, com o código no assunto e no corpo', c.length === 1 && !c[0].html.includes('/auth/v1/verify') && c[0].assunto.includes('482913') && c[0].html.includes('482913'));
  ok('tipo desconhecido: nada a enviar', montarEmailsAuth({ ...base, tipo: 'xyz' }).length === 0);
  ok('signup sem token_hash: nada a enviar (não manda link quebrado)', montarEmailsAuth({ ...base, tipo: 'signup', tokenHash: null }).length === 0);
  ok('HTML escapa o nome', montarEmailsAuth({ ...base, tipo: 'signup', nome: '<b>X</b>' })[0].html.includes('&lt;b&gt;X&lt;/b&gt;'));
}

console.log('\n=== LIMPEZA DE CONTAS NÃO CONFIRMADAS ===');
{
  const { paraApagar } = await import(pathToFileURL(join(outDir, 'conta/limparNaoConfirmados.js')).href);
  const virada = new Date('2026-10-20T20:40:00Z');
  const agora = Date.parse('2026-10-23T12:00:00Z');
  const h = (n) => new Date(agora - n * 3_600_000).toISOString();
  const lista = [
    { id: 'a', email: 'a@x', email_confirmed_at: null, created_at: h(50), last_sign_in_at: null }, // apaga
    { id: 'b', email: 'b@x', email_confirmed_at: null, created_at: h(10), last_sign_in_at: null }, // nova demais
    { id: 'c', email: 'c@x', email_confirmed_at: h(49), created_at: h(50), last_sign_in_at: null }, // confirmou
    { id: 'd', email: 'd@x', email_confirmed_at: null, created_at: '2026-10-01T00:00:00Z', last_sign_in_at: null }, // antes da virada
    { id: 'e', email: 'e@x', email_confirmed_at: null, created_at: h(60), last_sign_in_at: h(1) }, // entrou (não deveria, mas não apaga)
  ];
  const r = paraApagar(lista, agora, 48, virada);
  ok('apaga só a conta criada depois da virada, há mais de 48 h, nunca confirmada e sem login', r.length === 1 && r[0].id === 'a');
  ok('data inválida não apaga', paraApagar([{ id: 'z', created_at: 'nada', email_confirmed_at: null }], agora, 48, virada).length === 0);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
