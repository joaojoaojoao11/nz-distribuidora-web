// Autoteste dos avisos por e-mail à NZ e da rota /api/nz/lead — sem rede, sem banco.
//
// Cobre:
//   · cada aviso monta assunto, HTML e texto, e vai para o destino certo;
//   · aviso com chave sai uma vez só (a segunda chamada é barrada pela chave);
//   · aviso nunca lança, nem com o e-mail fora do ar;
//   · /api/nz/lead: validação, honeypot, limite por IP, grava e avisa.
//
// Gera prévias em tmp/aviso-*.html (abra com o npm run dev rodando).
// Uso: npm run avisos:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-avisos-'));
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/avisos.ts',
    'api/_lib/email.ts',
    'api/_lib/garantias/emails.ts',
    'api/_lib/garantias/dados.ts',
    'api/_lib/conta/documento.ts',
    'api/_lib/papel.ts',
    'api/_lib/handlers/lead.ts',
    `--outdir=${outDir}`,
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  process.exit(1);
}
writeFileSync(join(outDir, 'fake-supabase.js'), 'export const createClient = () => globalThis.__fakeDb;\n');
const leadJs = join(outDir, 'handlers/lead.js');
writeFileSync(leadJs, readFileSync(leadJs, 'utf8').replaceAll('"@supabase/supabase-js"', '"../fake-supabase.js"'));

const imp = (p) => import(pathToFileURL(join(outDir, p)).href);
const avisos = await imp('avisos.js');

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// ------------------------------------------------------------ duplo do banco
function fakeDb({ contagem = 0 } = {}) {
  const tabelas = {};
  const builder = (t) => {
    const st = { op: 'select', payload: null, filtros: [], head: false };
    const exec = () => {
      const linhas = (tabelas[t] ??= []);
      if (st.op === 'insert') {
        const novo = Array.isArray(st.payload) ? st.payload[0] : st.payload;
        if (t === 'avisos_enviados' && linhas.some((l) => l.chave === novo.chave)) return { data: null, error: { code: '23505', message: 'dup' } };
        // Espelha o NOT NULL de leads.email/phone do banco.
        if (t === 'leads' && (novo.email == null || novo.phone == null)) return { data: null, error: { code: '23502', message: 'null value' } };
        linhas.push({ ...novo });
        return { data: novo, error: null };
      }
      if (st.op === 'update') {
        for (const l of linhas.filter((l) => st.filtros.every(([k, v]) => l[k] === v))) Object.assign(l, st.payload);
        return { data: null, error: null };
      }
      if (st.head) return { count: contagem, error: null };
      return { data: linhas, error: null };
    };
    const b = {
      select: (_c, o) => ((st.head = Boolean(o?.head)), b),
      insert: (p) => ((st.op = 'insert'), (st.payload = p), b),
      update: (p) => ((st.op = 'update'), (st.payload = p), b),
      eq: (k, v) => (st.filtros.push([k, v]), b),
      gte: () => b,
      then: (res, rej) => Promise.resolve(exec()).then(res, rej),
    };
    return b;
  };
  return { tabelas, from: builder };
}

const enviados = [];
let resendForaDoAr = false;
globalThis.fetch = async (url, init) => {
  if (resendForaDoAr) throw new Error('rede caiu');
  enviados.push({ url, corpo: JSON.parse(init.body) });
  return new Response(JSON.stringify({ id: 'e' + enviados.length }), { status: 200 });
};
process.env.RESEND_API_KEY = 're_teste';
delete process.env.AVISO_EMAIL;
delete process.env.GARANTIA_AVISO_EMAIL;

// ----------------------------------------------------------------- avisos
console.log('\navisos');
const CLIENTE = { full_name: 'Maria Teste', company_name: 'Estética Teste Ltda', email: 'maria@exemplo.com', phone: '(11) 99999-8888', cpf_cnpj: '11.222.333/0001-81', address_city: 'Barueri', address_state: 'SP' };
const previas = {};
const ultimo = () => enviados[enviados.length - 1]?.corpo;

{
  const db = fakeDb();
  await avisos.avisarPedidoNovo(db, {
    pedidoId: 'p1', numero: 1042, cliente: CLIENTE,
    itens: [
      { nome: 'NZPPF Prime Gloss 1,52 x 15 m', sku: 'NZP05', qtd: 1, unidade: 'rolo', total: 4890 },
      { nome: 'NZWRAP Ferrari Metallic Red', sku: 'NZW201', qtd: 2.5, unidade: 'metro', total: 412.5 },
    ],
    subtotal: 5302.5, desconto: 200, total: 5102.5, cupom: 'NZ10', afiliado: null,
    frete: { transportadora: 'Jadlog', prazoDias: 3, valor: 89.9 }, observacoes: 'Entregar pela manhã.',
  });
  const e = ultimo();
  ok('pedido novo: vai para joaovitor@', e?.to?.[0] === 'joaovitor@nzdistribuidora.com.br');
  ok('pedido novo: assunto com número, cliente e total', /Pedido novo #1042 — Estética Teste Ltda — R\$\s?5\.102,50/.test(e?.subject ?? ''), e?.subject);
  ok('pedido novo: itens e botão de Pedidos no e-mail', e.html.includes('NZP05') && e.html.includes('/admin/pedidos') && e.text.includes('Ferrari'));
  ok('pedido novo: responder cai no cliente', e.reply_to === 'maria@exemplo.com');
  previas['pedido-novo'] = e.html;
  const antes = enviados.length;
  await avisos.avisarPedidoNovo(db, { pedidoId: 'p1', numero: 1042, cliente: CLIENTE, itens: [], subtotal: 0, desconto: 0, total: 0 });
  ok('mesmo pedido de novo: não manda duas vezes', enviados.length === antes);
  ok('aviso fica registrado com ok', db.tabelas.avisos_enviados.find((l) => l.chave === 'pedido-novo:p1')?.ok === true);
}
{
  const db = fakeDb();
  await avisos.avisarPagamentoConfirmado(db, { pagamentoId: 'pg1', numero: 1042, cliente: CLIENTE, valor: 5102.5, forma: 'CREDIT_CARD', parcelas: 3, erp: { ok: true, estado: 'enviado', quoteNumber: 8812 } });
  const e = ultimo();
  ok('pagamento: assunto e forma', e.subject.includes('Pagamento confirmado — pedido #1042') && e.html.includes('Cartão de crédito em 3x') && e.html.includes('8812'), e.subject);
  previas['pagamento'] = e.html;
  const antes = enviados.length;
  await avisos.avisarPagamentoConfirmado(db, { pagamentoId: 'pg1', numero: 1042, cliente: CLIENTE, valor: 5102.5, forma: 'PIX', parcelas: 1, erp: { ok: true, estado: 'enviado' } });
  ok('pagamento repetido (webhook + cron): uma vez só', enviados.length === antes);
}
{
  const db = fakeDb();
  await avisos.avisarCadastroNovo(db, { userId: 'u1', perfil: { ...CLIENTE, role: 'reseller' }, aprovado: false, jaCliente: false });
  const e = ultimo();
  ok('revendedor esperando aprovação vem destacado', e.subject.startsWith('Revendedor esperando aprovação') && e.html.includes('Aprovar em Clientes'), e.subject);
  previas['cadastro-revendedor'] = e.html;
  await avisos.avisarCadastroNovo(db, { userId: 'u2', perfil: { ...CLIENTE, company_name: null, role: 'client' }, aprovado: true, jaCliente: true });
  ok('cliente final: cadastro novo', ultimo().subject === 'Cadastro novo no site — Maria Teste', ultimo().subject);
  const antes = enviados.length;
  await avisos.avisarCadastroNovo(db, { userId: 'u2', perfil: { ...CLIENTE, role: 'client' }, aprovado: true, jaCliente: true });
  ok('novo login do mesmo usuário: não avisa de novo', enviados.length === antes);
}
{
  const db = fakeDb();
  await avisos.avisarProblema(db, { produto: 'NZPPF Prime Gloss', slug: 'nzppf-prime-gloss', motivo: 'Foto errada ou faltando', mensagem: 'A foto do fosco está mostrando o brilhante.', contato: 'cliente@exemplo.com', url: 'https://www.nzgroup.com.br/loja/nzppf-prime-gloss', temImagem: true });
  const e = ultimo();
  ok('problema: assunto, Central e produto', e.subject === 'Problema informado — NZPPF Prime Gloss — Foto errada ou faltando' && e.html.includes('/admin/central') && e.html.includes('/loja/nzppf-prime-gloss'));
  ok('problema: responder cai no cliente quando é e-mail', e.reply_to === 'cliente@exemplo.com');
  ok('aviso sem chave também fica registrado', db.tabelas.avisos_enviados.length === 1 && db.tabelas.avisos_enviados[0].tipo === 'problema-produto');
  previas['problema'] = e.html;
}
{
  resendForaDoAr = true;
  const db = fakeDb();
  const r = await avisos.avisarCupom(db, { nome: 'Ana', email: 'ana@exemplo.com', telefone: '11988887777', origem: 'NZPPF Prime - Cupom Surpresa' });
  ok('e-mail fora do ar: não lança e registra o erro', r === false && db.tabelas.avisos_enviados[0].ok === false);
  resendForaDoAr = false;
}
{
  process.env.AVISO_EMAIL = 'a@nz.com, b@nz.com';
  await avisos.avisarCupom(fakeDb(), { nome: 'Ana', email: '', telefone: '11988887777', origem: 'NZPPF Prime - Cupom Surpresa' });
  ok('AVISO_EMAIL com vírgula manda para os dois', JSON.stringify(ultimo().to) === '["a@nz.com","b@nz.com"]');
  delete process.env.AVISO_EMAIL;
}

// ------------------------------------------------------------ rota de lead
console.log('\n/api/nz/lead');
process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';
const { default: lead } = await imp('handlers/lead.js');
const chamar = async (body, db = fakeDb()) => {
  globalThis.__fakeDb = db;
  const res = { status: 0, json: null };
  const r = { status: (s) => ((res.status = s), r), json: (j) => ((res.json = j), r), setHeader() {} };
  await lead({ method: 'POST', body, headers: { 'x-forwarded-for': '9.9.9.9' } }, r);
  return { res, db };
};
const APLICADOR = { full_name: 'Carlos Teste', whatsapp: '(11) 97777-6666', state: 'SP', city: 'Campinas', vehicle: 'BMW X1', service_type: 'PPF', notes: 'Quero orçamento de carro inteiro' };
{
  const antes = enviados.length;
  const { res, db } = await chamar({ op: 'aplicador', dados: APLICADOR });
  ok('aplicador: grava e responde ok', res.status === 200 && db.tabelas.installer_leads?.[0]?.full_name === 'Carlos Teste');
  ok('aplicador: grava ip_hash, nunca o IP', db.tabelas.installer_leads[0].ip_hash?.length === 64 && !JSON.stringify(db.tabelas.installer_leads[0]).includes('9.9.9.9'));
  const e = ultimo();
  ok('aplicador: e-mail com WhatsApp e Leads', enviados.length === antes + 1 && e.subject.includes('Pedido de aplicador — PPF — Campinas/SP') && e.html.includes('wa.me/5511977776666') && e.html.includes('/admin/leads'), e.subject);
  previas['aplicador'] = e.html;
}
ok('aplicador sem WhatsApp válido: 400', (await chamar({ op: 'aplicador', dados: { ...APLICADOR, whatsapp: '123' } })).res.json?.error === 'whatsapp-invalido');
ok('aplicador com serviço inventado: 400', (await chamar({ op: 'aplicador', dados: { ...APLICADOR, service_type: 'Pintura' } })).res.json?.error === 'servico-invalido');
{
  const antes = enviados.length;
  const { res, db } = await chamar({ op: 'aplicador', site: 'spam.com', dados: APLICADOR });
  ok('honeypot: ok sem gravar nem avisar', res.status === 200 && !db.tabelas.installer_leads && enviados.length === antes);
}
ok('limite por IP: 429', (await chamar({ op: 'aplicador', dados: APLICADOR }, fakeDb({ contagem: 6 }))).res.status === 429);
{
  const { res, db } = await chamar({ op: 'cupom', dados: { name: 'Ana Teste', email: 'Ana@Exemplo.com', phone: '(11) 98888-7777', source: 'NZPPF Luxury - Cupom Surpresa' } });
  ok('cupom: grava em leads e avisa', res.status === 200 && db.tabelas.leads?.[0]?.email === 'ana@exemplo.com' && ultimo().subject === 'Lead do site — NZPPF Luxury - Cupom Surpresa — Ana Teste', ultimo()?.subject);
  previas['cupom'] = ultimo().html;
}
ok('cupom de origem estranha: 400', (await chamar({ op: 'cupom', dados: { name: 'Ana', email: 'a@b.com', source: 'qualquer' } })).res.json?.error === 'origem-invalida');
ok('cupom só com telefone grava (e-mail vazio, não nulo)', (await chamar({ op: 'cupom', dados: { name: 'Ana', email: '', phone: '(11) 98888-7777', source: 'NZPPF Prime - Cupom Surpresa' } })).res.status === 200);
ok('cupom sem e-mail e sem telefone: 400', (await chamar({ op: 'cupom', dados: { name: 'Ana', source: 'NZPPF Prime - Cupom Surpresa' } })).res.json?.error === 'contato-invalido');

// ---------------------------------------------------------------- prévias
mkdirSync(join(ROOT, 'tmp'), { recursive: true });
for (const [nome, html] of Object.entries(previas)) {
  writeFileSync(join(ROOT, `tmp/aviso-${nome}.html`), html.replaceAll('https://www.nzgroup.com.br/assets/', 'http://localhost:5199/assets/'));
}
console.log(`\nprévias em tmp/aviso-*.html (${Object.keys(previas).length})`);

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
