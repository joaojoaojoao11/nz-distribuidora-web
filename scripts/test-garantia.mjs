// Autoteste do registro de garantia no servidor — sem rede, sem banco.
//
// Cobre o que dá para errar sem perceber:
//   · a validação do registro (o front é sugestão): CPF, placa, data futura,
//     móvel só com PPF, e-mail obrigatório, áreas da lista;
//   · os ANOS de garantia saem do servidor, nunca do corpo da requisição;
//   · o handler: honeypot, limite por IP, aviso à NZ + protocolo ao cliente,
//     aprovar/recusar/enviar só para admin, aprovar manda o certificado;
//   · sem RESEND_API_KEY nada quebra: o registro grava e o e-mail é pulado.
//
// E gera as prévias dos três e-mails em tmp/email-*.html (com as imagens do
// `npm run dev` em localhost:5199 e o QR embutido), para conferir no navegador.
//
// Uso: npm run garantia:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-garantia-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/garantias/dados.ts',
    'api/_lib/garantias/emails.ts',
    'api/_lib/email.ts',
    'api/_lib/conta/documento.ts',
    'api/_lib/papel.ts',
    'api/_lib/handlers/garantia.ts',
    `--outdir=${outDir}`,
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

// O handler cria o client do Supabase com createClient; trocamos o
// especificador nos arquivos gerados por um duplo local.
writeFileSync(join(outDir, 'fake-supabase.js'), 'export const createClient = () => globalThis.__fakeDb;\n');
const handlerJs = join(outDir, 'handlers/garantia.js');
writeFileSync(handlerJs, readFileSync(handlerJs, 'utf8').replaceAll('"@supabase/supabase-js"', '"../fake-supabase.js"'));
// O handler importa 'qrcode' do node_modules do projeto.
const handlerSrc = readFileSync(handlerJs, 'utf8').replaceAll('"qrcode"', `"${pathToFileURL(join(ROOT, 'node_modules/qrcode/lib/index.js')).href}"`);
writeFileSync(handlerJs, handlerSrc);

const imp = (p) => import(pathToFileURL(join(outDir, p)).href);
const dados = await imp('garantias/dados.js');
const emails = await imp('garantias/emails.js');

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// ------------------------------------------------------------ validação
const BASE = {
  cliente_cpf: '123.456.789-09',
  cliente_nome_completo: 'Cliente Teste',
  cliente_email: 'Cliente@Exemplo.com',
  cliente_telefone: '(11) 99999-8888',
  cliente_cep: null,
  cliente_endereco: null,
  cliente_cidade: 'Barueri',
  cliente_estado: 'sp',
  veiculo_placa_chassi: 'abc1234',
  veiculo_modelo: 'Porsche 911',
  aplicador_nome: 'Estúdio Teste',
  data_aplicacao: '2026-10-15',
  produto_nome: 'NZPPF PRIME',
  linha_escolhida: 'PPF',
  tipo_servico: 'Parcial',
  areas_protegidas: ['Capô', 'Faróis', 'Inventada'],
  garantia_anos: 99,
  durabilidade_anos: 99,
};
console.log('\nvalidação');
{
  const v = dados.validarRegistro(BASE);
  ok('registro válido passa', v.ok);
  ok('anos vêm do servidor (Prime = 10), não do corpo', v.ok && v.linha.garantia_anos === 10 && v.linha.durabilidade_anos === 12);
  ok('placa antiga ganha hífen', v.ok && v.linha.veiculo_placa_chassi === 'ABC-1234');
  ok('área fora da lista sai', v.ok && JSON.stringify(v.linha.areas_protegidas) === '["Capô","Faróis"]');
  ok('e-mail em minúsculas, UF em maiúsculas', v.ok && v.linha.cliente_email === 'cliente@exemplo.com' && v.linha.cliente_estado === 'SP');
  ok('sem endereço quando não pediu impresso', v.ok && v.linha.cliente_cep === null && v.linha.cliente_endereco === null);
}
const erro = (patch) => {
  const v = dados.validarRegistro({ ...BASE, ...patch });
  return v.ok ? 'passou' : v.erro;
};
ok('CPF inválido barra', erro({ cliente_cpf: '123.456.789-00' }) === 'documento-invalido');
ok('CNPJ válido passa', erro({ cliente_cpf: '11.222.333/0001-81' }) === 'passou');
ok('e-mail é obrigatório', erro({ cliente_email: '' }) === 'email-invalido');
ok('data no futuro barra', erro({ data_aplicacao: '2099-01-01' }) === 'data-invalida');
ok('placa inválida barra', erro({ veiculo_placa_chassi: 'AB12' }) === 'placa-invalida');
ok('chassi de 17 passa', erro({ veiculo_placa_chassi: '9BWZZZ377VT004251' }) === 'passou');
ok('linha PPF inventada barra', erro({ produto_nome: 'NZPPF SUPER' }) === 'produto-invalido');
ok('móvel com envelopamento barra', erro({ linha_escolhida: 'NZWrap', produto_nome: 'NZWRAP RED', tipo_servico: 'Movel/Eletro' }) === 'servico-invalido');
ok('parcial sem área barra', erro({ areas_protegidas: [] }) === 'areas-invalidas');
ok('impresso sem número barra', erro({ cliente_cep: '06454-000', cliente_endereco: 'Rua A', cliente_numero: '' }) === 'endereco-incompleto');
{
  const v = dados.validarRegistro({ ...BASE, linha_escolhida: 'NZWrap', produto_nome: 'NZWRAP FERRARI METALLIC RED', tipo_servico: 'Total/Full' });
  ok('envelopamento grava 3 anos', v.ok && v.linha.garantia_anos === 3 && JSON.stringify(v.linha.areas_protegidas) === '["Veículo Completo"]');
}
{
  const c = dados.gerarCodigo('2026-10-15', 'ABC-1234');
  ok('código no formato de sempre', /^NZ-15102026-ABC1234-[A-Z2-9]{5}$/.test(c), c);
}

// --------------------------------------------------------------- handler
function fakeDb({ admin = false, contagem = 0, comPdf = true } = {}) {
  const tabela = [];
  const updates = [];
  let seq = 9;
  const builder = () => {
    const st = { op: 'select', filtros: [], payload: null, head: false };
    const exec = () => {
      if (st.op === 'insert') {
        const linha = { id: '00000000-0000-4000-8000-00000000000' + seq, created_at: new Date().toISOString(), ...st.payload[0] };
        // o trigger do banco
        Object.assign(linha, { protocolo: `GAR-2026-${String(seq++).padStart(5, '0')}`, status: 'pendente', envios_certificado: 0 });
        tabela.push(linha);
        return { data: linha, error: null };
      }
      const alvo = tabela.filter((r) => st.filtros.every(([k, v, neg]) => (neg ? r[k] !== v : r[k] === v)));
      if (st.op === 'update') {
        updates.push(st.payload);
        for (const r of alvo) Object.assign(r, st.payload);
        return { data: alvo[0] ?? null, error: null };
      }
      if (st.head) return { count: contagem, error: null };
      return { data: alvo[0] ?? null, error: null };
    };
    const b = {
      select: (_c, o) => {
        if (o?.head) st.head = true;
        return b;
      },
      insert: (p) => ((st.op = 'insert'), (st.payload = p), b),
      update: (p) => ((st.op = 'update'), (st.payload = p), b),
      eq: (k, v) => (st.filtros.push([k, v]), b),
      neq: (k, v) => (st.filtros.push([k, v, true]), b),
      gte: () => b,
      single: () => b,
      maybeSingle: () => b,
      then: (res, rej) => Promise.resolve(exec()).then(res, rej),
    };
    return b;
  };
  return {
    tabela,
    updates,
    storage: {
      from: (bucket) => ({
        createSignedUrl: async (nome) =>
          comPdf && bucket === 'certificados'
            ? { data: { signedUrl: `https://fake.supabase.co/storage/v1/object/sign/certificados/${nome}?token=t` }, error: null }
            : { data: null, error: { message: 'Object not found' } },
      }),
    },
    from: (t) => (t === 'user_profiles' ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: admin ? 'admin' : 'client', is_approved: true } }) }) }) } : builder()),
    auth: { getUser: async () => ({ data: { user: { id: 'u-admin' } } }) },
  };
}

function chamada(body, { metodo = 'POST', query = {}, auth } = {}) {
  const res = { status: 0, json: null, headers: {}, corpo: null };
  const r = {
    status(s) {
      res.status = s;
      return r;
    },
    json(j) {
      res.json = j;
      return r;
    },
    send(b) {
      res.corpo = b;
      return r;
    },
    setHeader(k, v) {
      res.headers[k] = v;
    },
  };
  const req = { method: metodo, body, query, headers: { 'x-forwarded-for': '1.2.3.4', ...(auth ? { authorization: auth } : {}) } };
  return { req, res, r };
}

const enviados = [];
globalThis.fetch = async (url, init) => {
  enviados.push({ url, corpo: JSON.parse(init.body) });
  return new Response(JSON.stringify({ id: 'email-' + enviados.length }), { status: 200 });
};
process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';
const { default: handler } = await imp('handlers/garantia.js');

console.log('\nhandler');
{
  delete process.env.RESEND_API_KEY;
  globalThis.__fakeDb = fakeDb();
  const { req, res, r } = chamada({ op: 'registrar', dados: BASE });
  await handler(req, r);
  ok('sem Resend: registra e devolve protocolo', res.status === 200 && res.json.protocolo === 'GAR-2026-00009', JSON.stringify(res.json));
  ok('sem Resend: nenhum e-mail sai e nada quebra', enviados.length === 0 && res.json.emailConfigurado === false);
  ok('grava ip_hash, nunca o IP', globalThis.__fakeDb.tabela[0].ip_hash?.length === 64 && !JSON.stringify(globalThis.__fakeDb.tabela[0]).includes('1.2.3.4'));
}
process.env.RESEND_API_KEY = 're_teste';
{
  globalThis.__fakeDb = fakeDb();
  enviados.length = 0;
  const { req, res, r } = chamada({ op: 'registrar', dados: BASE });
  await handler(req, r);
  const paraNz = enviados.find((e) => e.corpo.subject.startsWith('Garantia para aprovar'));
  const paraCliente = enviados.find((e) => e.corpo.subject.startsWith('Recebemos o registro'));
  ok('com Resend: aviso à NZ', Boolean(paraNz) && paraNz.corpo.to[0] === 'joaovitor@nzdistribuidora.com.br');
  ok('com Resend: protocolo ao cliente', Boolean(paraCliente) && paraCliente.corpo.to[0] === 'cliente@exemplo.com' && res.json.emailCliente === true);
  ok('aviso marca aviso_nz_enviado_em', globalThis.__fakeDb.updates.some((u) => u.aviso_nz_enviado_em));
  ok('nenhum e-mail leva o CPF inteiro ao cliente', !paraCliente.corpo.html.includes('123.456.789-09'));
}
{
  globalThis.__fakeDb = fakeDb();
  const { req, res, r } = chamada({ op: 'registrar', site: 'http://spam', dados: BASE });
  await handler(req, r);
  ok('honeypot: responde ok e não grava', res.status === 200 && globalThis.__fakeDb.tabela.length === 0);
}
{
  globalThis.__fakeDb = fakeDb({ contagem: 12 });
  const { req, res, r } = chamada({ op: 'registrar', dados: BASE });
  await handler(req, r);
  ok('limite por IP: 429', res.status === 429);
}
{
  globalThis.__fakeDb = fakeDb();
  const { req, res, r } = chamada({ op: 'registrar', dados: { ...BASE, cliente_cpf: '111' } });
  await handler(req, r);
  ok('dado inválido: 400 com o motivo', res.status === 400 && res.json.error === 'documento-invalido');
}
{
  const db = fakeDb({ admin: false });
  globalThis.__fakeDb = db;
  const { req, res, r } = chamada({ op: 'aprovar', id: '00000000-0000-4000-8000-000000000009' }, { auth: 'Bearer x' });
  await handler(req, r);
  ok('aprovar sem ser admin: 403', res.status === 403);
}
{
  const db = fakeDb({ admin: true });
  globalThis.__fakeDb = db;
  const reg = chamada({ op: 'registrar', dados: BASE });
  await handler(reg.req, reg.r);
  enviados.length = 0;
  const id = db.tabela[0].id;
  const { req, res, r } = chamada({ op: 'aprovar', id, enviar: true }, { auth: 'Bearer x' });
  await handler(req, r);
  const cert = enviados.find((e) => e.corpo.subject.startsWith('Seu certificado'));
  ok('admin aprova', res.status === 200 && db.tabela[0].status === 'aprovada' && db.tabela[0].aprovada_por === 'u-admin', JSON.stringify(res.json?.error ?? ''));
  ok('aprovar com enviar manda o certificado', Boolean(cert) && res.json.envio?.ok === true && cert.corpo.to[0] === 'cliente@exemplo.com');
  ok('envio fica registrado', db.tabela[0].envios_certificado === 1 && db.tabela[0].certificado_enviado_para === 'cliente@exemplo.com');
  ok('certificado leva o QR do servidor', cert.corpo.html.includes('/api/nz/garantia?op=qr&amp;c=') || cert.corpo.html.includes('/api/nz/garantia?op=qr&c='));
  const anexo = cert.corpo.attachments?.[0];
  ok('certificado vai com o PDF oficial em anexo', Boolean(anexo) && anexo.filename === `Certificado_NZ_${db.tabela[0].codigo_autenticacao}.pdf` && anexo.path.includes('/certificados/'), JSON.stringify(anexo));
  ok('e-mail avisa que o PDF está anexado', cert.corpo.html.includes('anexado a este e-mail') && cert.corpo.text.includes('anexado'));

  const de2 = chamada({ op: 'aprovar', id }, { auth: 'Bearer x' });
  await handler(de2.req, de2.r);
  ok('aprovar de novo: 409', de2.res.status === 409);

  enviados.length = 0;
  const env = chamada({ op: 'enviar', id, para: 'Outro@Exemplo.com' }, { auth: 'Bearer x' });
  await handler(env.req, env.r);
  ok('reenviar para e-mail corrigido atualiza o cadastro', env.res.status === 200 && db.tabela[0].cliente_email === 'outro@exemplo.com' && db.tabela[0].envios_certificado === 2);
}
{
  // Sem o PDF no bucket o e-mail não sai: nunca manda certificado sem o arquivo oficial.
  const db = fakeDb({ admin: true, comPdf: false });
  globalThis.__fakeDb = db;
  const reg = chamada({ op: 'registrar', dados: BASE });
  await handler(reg.req, reg.r);
  const id = db.tabela[0].id;
  const apr = chamada({ op: 'aprovar', id }, { auth: 'Bearer x' });
  await handler(apr.req, apr.r);
  enviados.length = 0;
  const env = chamada({ op: 'enviar', id }, { auth: 'Bearer x' });
  await handler(env.req, env.r);
  ok('sem o PDF no bucket: não envia e diz o motivo', env.res.status === 502 && env.res.json.envio?.motivo === 'sem-pdf' && enviados.length === 0);
}
{
  const db = fakeDb({ admin: true });
  globalThis.__fakeDb = db;
  const reg = chamada({ op: 'registrar', dados: BASE });
  await handler(reg.req, reg.r);
  const id = db.tabela[0].id;
  const curto = chamada({ op: 'recusar', id, motivo: 'x' }, { auth: 'Bearer x' });
  await handler(curto.req, curto.r);
  ok('recusar pede motivo', curto.res.status === 400);
  const rec = chamada({ op: 'recusar', id, motivo: 'Aplicador não confirmou' }, { auth: 'Bearer x' });
  await handler(rec.req, rec.r);
  ok('recusar grava o motivo', rec.res.status === 200 && db.tabela[0].status === 'recusada');
  const env = chamada({ op: 'enviar', id }, { auth: 'Bearer x' });
  await handler(env.req, env.r);
  ok('não envia certificado de recusada', env.res.status === 409);
}
{
  const { req, res, r } = chamada(null, { metodo: 'GET', query: { op: 'qr', c: 'NZ-15102026-ABC1234-QZEB4' } });
  await handler(req, r);
  ok('QR em PNG com cache longo', res.status === 200 && res.headers['Content-Type'] === 'image/png' && res.corpo?.length > 200 && /immutable/.test(res.headers['Cache-Control']));
  const ruim = chamada(null, { metodo: 'GET', query: { op: 'qr', c: '<script>' } });
  await handler(ruim.req, ruim.r);
  ok('QR com código estranho: 400', ruim.res.status === 400);
}

// ---------------------------------------------------------------- prévias
const G = {
  id: 'x',
  protocolo: 'GAR-2026-00009',
  status: 'aprovada',
  ...dados.validarRegistro(BASE).linha,
  areas_protegidas: ['Capô', 'Para-choque Dianteiro', 'Para-lamas', 'Retrovisores', 'Faróis'],
  veiculo_modelo: 'Porsche 911 Carrera S',
  cliente_nome_completo: 'João Vitor Vanderleia',
  codigo_autenticacao: 'NZ-15102026-ABC1234-QZEB4',
  created_at: new Date().toISOString(),
  aprovada_em: new Date().toISOString(),
  motivo_recusa: null,
  certificado_enviado_em: null,
  certificado_enviado_para: null,
  envios_certificado: 0,
};
mkdirSync(join(ROOT, 'tmp'), { recursive: true });
const qr = await QRCode.toDataURL('https://www.nzgroup.com.br/validar-garantia?id=' + G.codigo_autenticacao, { margin: 1, width: 312 });
const previa = (html) =>
  html
    .replaceAll(emails.SITE + '/assets/', 'http://localhost:5199/assets/')
    .replace(/https?:\/\/[^"']*\/api\/nz\/garantia\?op=qr&amp;c=[^"']*/g, qr)
    .replace(/https?:\/\/[^"']*\/api\/nz\/garantia\?op=qr&c=[^"']*/g, qr);
for (const [nome, m] of [
  ['certificado', emails.emailCertificado(G)],
  ['certificado-wrap', emails.emailCertificado({ ...G, linha_escolhida: 'NZWrap', produto_nome: 'NZWRAP FERRARI METALLIC RED', garantia_anos: 3, tipo_servico: 'Total/Full' })],
  ['protocolo', emails.emailProtocolo({ ...G, status: 'pendente' })],
  ['aviso-nz', emails.emailAvisoNz({ ...G, status: 'pendente', cliente_cep: '06454-000', cliente_endereco: 'Alameda Rio Negro', cliente_numero: '500', cliente_bairro: 'Alphaville' })],
]) {
  writeFileSync(join(ROOT, `tmp/email-${nome}.html`), previa(m.html));
  ok(`e-mail ${nome}: assunto e texto`, m.assunto.length > 10 && m.texto.length > 50, m.assunto);
}
console.log('\nprévias em tmp/email-*.html (abra com o npm run dev rodando, para as imagens)');

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
