// Autoteste do cadastro e da equipe — sem rede, sem banco.
//
// Cobre o que dá para errar sem perceber:
//   · completude do cadastro (a mesma lista que o trigger do banco usa);
//   · CPF/CNPJ e normalização de e-mail;
//   · o FILTRO de campos do ERP: limite de crédito, lista de preço, vendedor e
//     observações NUNCA podem sair de clients para o site;
//   · vínculo com o ERP: aprova o lojista só com documento E e-mail conferindo,
//     completa campo vazio e nunca sobrescreve o que o usuário escreveu;
//   · cruzamento da equipe (ERP × site) e a sincronização (convite, bloqueio).
//
// Uso: npm run conta:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-conta-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/conta/completude.ts',
    'api/_lib/conta/documento.ts',
    'api/_lib/conta/erpClientes.ts',
    'api/_lib/conta/vinculo.ts',
    'api/_lib/conta/erpHistorico.ts',
    'api/_lib/conta/atribuirTitulos.ts',
    'api/_lib/pedido/despachoErp.ts',
    'api/_lib/papel.ts',
    'api/_lib/asaas/cliente.ts',
    'api/_lib/handlers/conta.ts',
    'api/_lib/handlers/equipe.ts',
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

// O módulo do Supabase é ESM (só leitura): não dá para trocar `createClient`
// depois de importado. Então trocamos o ESPECIFICADOR nos arquivos gerados por
// um duplo local — o código de produção fica intocado.
writeFileSync(join(outDir, 'fake-supabase.js'), 'export const createClient = () => globalThis.__erpFake;\n');
for (const arq of ['conta/erpClientes.js', 'handlers/conta.js', 'handlers/equipe.js', 'papel.js']) {
  const caminho = join(outDir, arq);
  const nivel = arq.includes('/') ? '../' : './';
  writeFileSync(caminho, readFileSync(caminho, 'utf8').replaceAll('"@supabase/supabase-js"', `"${nivel}fake-supabase.js"`));
}

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// --------------------------------------------------------- duplo supabase
function fakeDb(dados = {}) {
  const escritas = [];
  const tabelas = structuredClone(dados);
  const builder = (tabela) => {
    const st = { tabela, op: 'select', filtros: [], payload: null, single: false };
    const b = {
      select: () => b,
      insert: (p) => { st.op = 'insert'; st.payload = p; return b; },
      update: (p) => { st.op = 'update'; st.payload = p; return b; },
      upsert: (p) => { st.op = 'upsert'; st.payload = p; return b; },
      eq: (k, v) => { st.filtros.push([k, v]); return b; },
      ilike: (k, v) => { st.filtros.push([k, String(v).toLowerCase()]); return b; },
      neq: () => b, in: () => b, gte: () => b, order: () => b, limit: () => b,
      maybeSingle: () => { st.single = true; return b; },
      single: () => { st.single = true; return b; },
      then: (res, rej) => Promise.resolve(exec()).then(res, rej),
    };
    const exec = () => {
      const linhas = tabelas[st.tabela] ?? [];
      const bate = (r) => st.filtros.every(([k, v]) => String(r[k] ?? '').toLowerCase() === String(v).toLowerCase());
      if (st.op === 'insert' || st.op === 'upsert') {
        const lista = Array.isArray(st.payload) ? st.payload : [st.payload];
        tabelas[st.tabela] = [...linhas, ...lista];
        escritas.push({ tabela: st.tabela, op: st.op, payload: lista });
        return { data: lista, error: null };
      }
      if (st.op === 'update') {
        const alvo = linhas.filter(bate);
        for (const r of alvo) Object.assign(r, st.payload);
        escritas.push({ tabela: st.tabela, op: 'update', payload: st.payload, filtros: st.filtros });
        return { data: alvo, error: null };
      }
      const sel = linhas.filter(bate);
      return { data: st.single ? sel[0] ?? null : sel, error: null };
    };
    return b;
  };
  const rpcs = [];
  const bans = [];
  return {
    from: builder,
    rpc: async (nome, args) => { rpcs.push({ nome, args }); return { data: tabelas[`rpc:${nome}`] ?? [], error: null }; },
    auth: { admin: { updateUserById: async (id, p) => { bans.push({ id, ...p }); return { data: null, error: null }; } } },
    escritas, rpcs, tabelas, bans,
  };
}

const { completude, faltandoNoCadastro } = await import(pathToFileURL(join(outDir, 'conta/completude.js')).href);
const { validarCpfCnpj, tipoDocumento, normalizarEmail, somenteDigitos } = await import(pathToFileURL(join(outDir, 'conta/documento.js')).href);
const { vincularComErp, consultarDocumento } = await import(pathToFileURL(join(outDir, 'conta/vinculo.js')).href);
const { montarLista, sincronizarEquipe } = await import(pathToFileURL(join(outDir, 'handlers/equipe.js')).href);

const COMPLETO = {
  full_name: 'Maria Teste', cpf_cnpj: '52998224725', phone: '11999990000',
  address_street: 'Rua A', address_number: '10', address_city: 'São Paulo',
  address_state: 'SP', address_zip: '01310-100',
};

// ============================================================== completude
console.log('\n=== COMPLETUDE ===');
ok('cadastro cheio é completo', completude(COMPLETO).completo);
ok('perfil nulo lista os 8 campos', faltandoNoCadastro(null).length === 8);
ok('CEP com 7 dígitos não vale', faltandoNoCadastro({ ...COMPLETO, address_zip: '0131010' }).includes('cep'));
ok('espaço em branco não conta como preenchido', faltandoNoCadastro({ ...COMPLETO, address_number: '   ' }).includes('numero'));
ok('rótulo do campo é legível', completude({}).rotulos.includes('CPF ou CNPJ'));

// ============================================================== documento
console.log('\n=== DOCUMENTO E E-MAIL ===');
ok('CPF válido', validarCpfCnpj('529.982.247-25'));
ok('CPF com dígito errado', !validarCpfCnpj('529.982.247-26'));
ok('CPF de dígitos repetidos', !validarCpfCnpj('111.111.111-11'));
ok('CNPJ válido', validarCpfCnpj('11.222.333/0001-81'));
ok('CNPJ inválido', !validarCpfCnpj('11.222.333/0001-82'));
ok('tipo do documento', tipoDocumento('52998224725') === 'cpf' && tipoDocumento('11222333000181') === 'cnpj');
ok('e-mail normaliza caixa e espaço', normalizarEmail('  EVERSON@NZDISTRIBUIDORA.COM.BR ') === 'everson@nzdistribuidora.com.br');
ok('somenteDigitos', somenteDigitos('(11) 99999-0000') === '11999990000');

// ======================================================= filtro do ERP
console.log('\n=== O QUE NÃO PODE SAIR DO ERP ===');
const CLIENTE_ERP_BRUTO = {
  id: 'cli-1', nome: 'LOJA TESTE LTDA', fantasia: 'Loja Teste', cpf_cnpj: '11.222.333/0001-81',
  tipo_pessoa: 'J', email: 'compras@lojateste.com.br', telefone: '1133334444', celular: '11999998888',
  cep: '01310-100', endereco: 'Av Paulista', numero: '1000', complemento: 'cj 10', bairro: 'Bela Vista',
  cidade: 'São Paulo', estado: 'SP', inscricao_estadual: '123456', situacao: 'Ativo',
  // sensíveis — não podem aparecer em lugar nenhum do resultado
  limite_de_credito: 50000, lista_de_preco: 'REVENDA', vendedor: 'ERICK', observacoes: 'cliente problemático',
};

process.env.ERP_SUPABASE_URL = 'https://erp.example.com';
process.env.ERP_SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';

// A RPC site_consultar_cliente já devolve a lista branca (o SQL é a fronteira).
// Aqui o duplo devolve a linha CRUA de propósito: se algum dia o JS voltar a
// repassar o objeto inteiro, os testes de vazamento pegam.
const RPC_PUBLICO = (c) => ({
  id: c.id, nome: c.nome, fantasia: c.fantasia, tipo_pessoa: c.tipo_pessoa, email: c.email,
  telefone: c.celular || c.telefone, cep: c.cep, endereco: c.endereco, numero: c.numero,
  complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, estado: c.estado,
  inscricao_estadual: c.inscricao_estadual, ativo: String(c.situacao).toLowerCase() === 'ativo',
  site_user_id: null,
  // ruído que a RPC real NÃO manda — o mapeamento do site tem de ignorar
  limite_de_credito: c.limite_de_credito, lista_de_preco: c.lista_de_preco,
  vendedor: c.vendedor, observacoes: c.observacoes,
});
let linhasErp = [CLIENTE_ERP_BRUTO];
let rpcsChamadas = [];
let tabelasLidas = [];
globalThis.__erpFake = {
  from: (t) => {
    tabelasLidas.push(t);
    return { select: () => Promise.resolve({ data: [], error: null }) };
  },
  rpc: (nome, args) => {
    rpcsChamadas.push({ nome, args });
    const doc = String(args?.p_doc ?? '').replace(/\D/g, '');
    const email = String(args?.p_email ?? '').toLowerCase();
    const achado = linhasErp.find(
      (c) => (doc && String(c.cpf_cnpj).replace(/\D/g, '') === doc) || (email && String(c.email).toLowerCase() === email)
    );
    return Promise.resolve({ data: achado ? RPC_PUBLICO(achado) : null, error: null });
  },
};
const erpMod = await import(pathToFileURL(join(outDir, 'conta/erpClientes.js')).href);

const achado = await erpMod.clienteErpPorDocumento('11222333000181');
const serializado = JSON.stringify(achado ?? {});
ok('acha o cliente pelo documento com máscara', achado?.id === 'cli-1');
ok('lê pela RPC, nunca pela tabela clients', rpcsChamadas.at(-1)?.nome === 'site_consultar_cliente' && !tabelasLidas.includes('clients'));
ok('não vaza limite de crédito', !serializado.includes('50000') && !serializado.includes('limite'));
ok('não vaza lista de preço', !serializado.includes('REVENDA'));
ok('não vaza vendedor nem observações', !serializado.includes('ERICK') && !serializado.includes('problemático'));
ok('telefone preferido é o celular', achado?.telefone === '11999998888');
ok('campo desconhecido na resposta não é repassado', !Object.keys(achado ?? {}).some((k) => ['limite_de_credito', 'lista_de_preco', 'vendedor', 'observacoes'].includes(k)));
ok('situação Ativo vira ativo=true', achado?.ativo === true);

linhasErp = [{ ...CLIENTE_ERP_BRUTO, cpf_cnpj: '11.222.333/0001-99' }];
ok('documento parecido mas diferente não casa', (await erpMod.clienteErpPorDocumento('11222333000181')) === null);
linhasErp = [CLIENTE_ERP_BRUTO];

// ============================================================== vínculo
console.log('\n=== VÍNCULO COM O ERP ===');
{
  const db = fakeDb({ user_profiles: [{ id: 'u1' }] });
  const r = await vincularComErp(db, {
    id: 'u1', role: 'reseller', email: 'compras@lojateste.com.br', cpf_cnpj: '11222333000181',
    is_approved: false, erp_client_id: null,
  });
  const patch = db.escritas.find((e) => e.tabela === 'user_profiles')?.payload ?? {};
  ok('lojista com documento e e-mail conferindo é aprovado', r.aprovouAgora === true && patch.is_approved === true);
  ok('grava o erp_client_id', patch.erp_client_id === 'cli-1');
  ok('preenche endereço vazio a partir do ERP', patch.address_street === 'Av Paulista' && patch.address_zip === '01310100');
  ok('motivo da aprovação fica registrado', String(patch.aprovado_motivo).includes('NZERP'));
}
{
  const db = fakeDb({ user_profiles: [{ id: 'u2' }] });
  const r = await vincularComErp(db, {
    id: 'u2', role: 'reseller', email: 'outro@gmail.com', cpf_cnpj: '11222333000181',
    is_approved: false, erp_client_id: null,
  });
  const patch = db.escritas.find((e) => e.tabela === 'user_profiles')?.payload ?? {};
  ok('e-mail diferente NÃO aprova o lojista', r.aprovouAgora === false && patch.is_approved === undefined);
  ok('e-mail diferente não copia endereço de terceiro', patch.address_street === undefined);
  ok('avisa o admin para conferir', String(r.motivo).includes('outro e-mail'));
}
{
  const db = fakeDb({ user_profiles: [{ id: 'u3' }] });
  await vincularComErp(db, {
    id: 'u3', role: 'reseller', email: 'compras@lojateste.com.br', cpf_cnpj: '11222333000181',
    is_approved: false, erp_client_id: null,
    address_street: 'Rua que o usuário digitou', address_number: '7',
  });
  const patch = db.escritas.find((e) => e.tabela === 'user_profiles')?.payload ?? {};
  ok('não sobrescreve o que o usuário escreveu', patch.address_street === undefined && patch.address_number === undefined);
  ok('mas completa o que faltava', patch.address_city === 'São Paulo');
}
{
  const db = fakeDb({ user_profiles: [{ id: 'u4' }] });
  const r = await vincularComErp(db, { id: 'u4', role: 'reseller', email: 'x@y.com', cpf_cnpj: '11222333000181', is_approved: false, erp_client_id: 'cli-9' });
  ok('já vinculado não faz nada (idempotente)', r.erpClientId === 'cli-9' && db.escritas.length === 0);
}
{
  const db = fakeDb({ user_profiles: [{ id: 'u5' }] });
  const r = await vincularComErp(db, { id: 'u5', role: 'client', email: 'compras@lojateste.com.br', cpf_cnpj: '11222333000181', is_approved: true, erp_client_id: null });
  ok('cliente final já aprovado não muda aprovação', r.aprovouAgora === false && r.jaCliente === true);
}
{
  linhasErp = [{ ...CLIENTE_ERP_BRUTO, situacao: 'Inativo' }];
  const db = fakeDb({ user_profiles: [{ id: 'u6' }] });
  const r = await vincularComErp(db, { id: 'u6', role: 'reseller', email: 'compras@lojateste.com.br', cpf_cnpj: '11222333000181', is_approved: false, erp_client_id: null });
  ok('cliente inativo no ERP não aprova', r.aprovouAgora === false);
  linhasErp = [CLIENTE_ERP_BRUTO];
}
{
  const r = await consultarDocumento('11222333000181', 'compras@lojateste.com.br');
  ok('consulta com e-mail igual devolve dados', r.jaCliente && r.dados?.address_city === 'São Paulo');
  const r2 = await consultarDocumento('11222333000181', 'curioso@gmail.com');
  ok('consulta com outro e-mail não devolve dados', r2.jaCliente && r2.dados === null && Boolean(r2.aviso));
  const r3 = await consultarDocumento('123', 'x@y.com');
  ok('documento inválido não consulta', r3.jaCliente === false);
}

// ================================================================ equipe
console.log('\n=== EQUIPE (NZERP × SITE) ===');
const ERP_USERS = [
  { id: 'e1', nome: 'JOÃO VITOR', email: 'joaovitor@nzdistribuidora.com.br', papel: 'DIRETORIA', ativo: true, permissoes: ['CRM'] },
  { id: 'e2', nome: 'ANA ELISA', email: 'elisa@nzdistribuidora.com.br', papel: 'VENDEDOR', ativo: true, permissoes: ['ORCAMENTOS'] },
  { id: 'e3', nome: 'SAIU DA EMPRESA', email: 'exfuncionario@nzdistribuidora.com.br', papel: 'VENDEDOR', ativo: false, permissoes: [] },
];
{
  const perfis = [
    { id: 'p1', email: 'joaovitor@nzdistribuidora.com.br', full_name: 'João', role: 'admin', is_approved: true, erp_user_id: 'e1', erp_role: 'DIRETORIA', erp_permissions: ['CRM'], origem: 'site', convidado_em: null, ultimo_acesso_em: null, last_sign_in_at: '2026-09-06T10:00:00Z', bloqueado: false, created_at: '2026-04-13' },
  ];
  const convites = [{ email: 'elisa@nzdistribuidora.com.br', erp_user_id: 'e2', usado_em: null, revogado_em: null, criado_em: '2026-09-06' }];
  const lista = montarLista(ERP_USERS, perfis, convites);
  const porEmail = Object.fromEntries(lista.map((l) => [l.email, l]));
  ok('quem já entrou aparece como ativo', porEmail['joaovitor@nzdistribuidora.com.br'].status === 'ativo');
  ok('quem tem convite aberto aparece como convidado', porEmail['elisa@nzdistribuidora.com.br'].status === 'convidado');
  ok('conta criada pelo convite que nunca logou continua "convidado"', montarLista(ERP_USERS, [{ ...perfis[0], last_sign_in_at: null }], convites)[0].status !== 'ativo');
  ok('inativo no ERP aparece marcado', porEmail['exfuncionario@nzdistribuidora.com.br'].ativoErp === false);
  ok('a lista tem uma linha por pessoa do ERP', lista.length === 3);
}
{
  const perfis = [
    { id: 'p9', email: 'antigo@nzgroup.com.br', full_name: 'Admin Antigo', role: 'admin', is_approved: true, erp_user_id: null, erp_role: null, erp_permissions: [], origem: 'site', convidado_em: null, ultimo_acesso_em: null, last_sign_in_at: null, bloqueado: false, created_at: '2026-04-01' },
  ];
  const lista = montarLista(ERP_USERS, perfis, []);
  ok('admin do site que não existe no ERP fica visível', lista.some((l) => l.email === 'antigo@nzgroup.com.br' && l.status === 'fora-do-erp'));
}

// sincronização
{
  // Duplo do users_safe do ERP para a sincronização.
  globalThis.__erpFake = {
    from: () => ({
      select: () => Promise.resolve({
        data: ERP_USERS.map((u) => ({ id: u.id, name: u.nome, email: u.email, role: u.papel, active: u.ativo, permissions: u.permissoes })),
        error: null,
      }),
    }),
  };
  const db = fakeDb({
    equipe_convites: [],
    'rpc:equipe_site': [
      { id: 'p1', email: 'joaovitor@nzdistribuidora.com.br', full_name: 'João', role: 'client', is_approved: false, erp_user_id: null, erp_role: null, erp_permissions: [], origem: 'site', convidado_em: null, ultimo_acesso_em: null, last_sign_in_at: null, bloqueado: false, created_at: '2026-04-13' },
      { id: 'p7', email: 'exfuncionario@nzdistribuidora.com.br', full_name: 'Ex', role: 'admin', is_approved: true, erp_user_id: 'e3', erp_role: 'VENDEDOR', erp_permissions: [], origem: 'convite', convidado_em: null, ultimo_acesso_em: null, last_sign_in_at: null, bloqueado: false, created_at: '2026-05-01' },
    ],
    user_profiles: [{ id: 'p1' }, { id: 'p7' }],
  });
  const r = await sincronizarEquipe(db, null);
  ok('conta quem do ERP ainda não tem acesso', r.semAcesso === 1, `semAcesso=${r.semAcesso}`);
  ok('sincronização NÃO cria convite sozinha (e-mail é autoconfirmado)', (db.tabelas.equipe_convites ?? []).length === 0);
  ok('promove a admin quem já tem conta', r.perfisAtualizados === 1 && db.tabelas.user_profiles.find((p) => p.id === 'p1').role === 'admin');
  ok('bloqueia quem saiu do ERP', r.bloqueados === 1 && db.bans.some((b) => b.id === 'p7' && b.ban_duration !== 'none'));
  ok('quem saiu vira cliente comum', db.tabelas.user_profiles.find((p) => p.id === 'p7').role === 'client');
  ok('sincronização sem erros', r.erros.length === 0, r.erros.join('; '));
}
{
  globalThis.__erpFake = { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) };
  const db = fakeDb({ 'rpc:equipe_site': [], equipe_convites: [] });
  const r = await sincronizarEquipe(db, null);
  ok('ERP vazio não bloqueia ninguém (falha fechada)', r.bloqueados === 0 && r.erros.length === 1);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
