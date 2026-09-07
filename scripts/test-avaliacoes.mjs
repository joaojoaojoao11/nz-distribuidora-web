// Autoteste das avaliações, pontos e cashback — sem rede, sem banco.
//
// A verificação que dá nome a este arquivo é a primeira: **o ponto não pode
// depender da nota**. Premiar avaliação é legal; premiar avaliação BOA é
// publicidade enganosa. A diferença é uma linha de código, e é exatamente o
// tipo de linha que entra sem ninguém perceber — daí o teste ler o fonte além
// de exercitar o comportamento.
//
// Uso: npm run avaliacoes:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-aval-'));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/loja/avaliacoes.ts',
    'api/_lib/conta/erpHistorico.ts',
    'api/_lib/conta/documento.ts',
    'api/_lib/pedido/despachoErp.ts',
    `--outdir=${outDir}`,
    '--outbase=api/_lib',
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

const mod = await import(pathToFileURL(join(outDir, 'loja/avaliacoes.js')).href);
const { PONTOS, pontosDaAvaliacao, resgatar, saldoDePontos } = mod;

// ================================================ 1. o ponto ignora a nota
console.log('\n=== O PONTO NÃO OLHA A NOTA ===');

const base = { texto: 'Apliquei no capô de um Civic e o material se comportou bem no calor.' };
const notas = [1, 2, 3, 4, 5].map((nota) => pontosDaAvaliacao({ ...base, nota }));
ok('1 estrela paga igual a 5 estrelas', new Set(notas).size === 1, notas.join(', '));

// E no fonte: a função não pode nem receber a nota.
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ 	]*\/\/.*$/gm, '');
const fonte = readFileSync(join(ROOT, 'api/_lib/loja/avaliacoes.ts'), 'utf8');
const corpoFuncao = /export function pontosDaAvaliacao\([\s\S]*?\n\}/.exec(fonte)?.[0] ?? '';
ok('achei a função no fonte', corpoFuncao.length > 0);
ok('e ela não menciona `nota` em lugar nenhum', !/\bnota\b/.test(corpoFuncao), corpoFuncao.match(/\bnota\b/g)?.join(',') ?? '');

// O caminho da moderação também não pode condicionar o crédito à nota.
// Os comentários do handler EXPLICAM que o crédito não olha a nota — e por
// isso contêm a palavra. O que vale é o código.
const handler = semComentarios(readFileSync(join(ROOT, 'api/_lib/handlers/avaliacoes.ts'), 'utf8'));
const blocoModerar = /if \(op === 'moderar'\)[\s\S]*?\n  \}/.exec(handler)?.[0] ?? '';
ok('achei o bloco de moderação', blocoModerar.length > 0);
ok('e ele credita sem consultar a nota', blocoModerar.includes('creditarPontosDaAvaliacao') && !/\bnota\b/.test(blocoModerar));

// ============================================== 2. o que SIM muda o ponto
console.log('\n=== O QUE MUDA O PONTO É ESFORÇO ===');
const curto = 'Bom material, recomendo muito mesmo.';
const longo = 'x'.repeat(PONTOS.minimoTextoLongo);
ok('avaliação simples vale a base', pontosDaAvaliacao({ texto: curto }) === PONTOS.base, `${pontosDaAvaliacao({ texto: curto })}`);
ok('com foto soma o bônus de foto', pontosDaAvaliacao({ texto: curto, foto_url: 'x.jpg' }) === PONTOS.base + PONTOS.foto);
ok('texto longo soma o bônus de texto', pontosDaAvaliacao({ texto: longo }) === PONTOS.base + PONTOS.textoLongo);
ok('os dois juntos somam os dois', pontosDaAvaliacao({ texto: longo, foto_url: 'x.jpg' }) === PONTOS.base + PONTOS.foto + PONTOS.textoLongo);
ok('um caractere a menos não conta como longo', pontosDaAvaliacao({ texto: 'x'.repeat(PONTOS.minimoTextoLongo - 1) }) === PONTOS.base);
ok('espaço em branco não vira texto longo', pontosDaAvaliacao({ texto: `${curto}${' '.repeat(500)}` }) === PONTOS.base);

// ==================================================== 3. banco em memória
function bancoFalso(estado) {
  const tabela = (nome) => (estado[nome] ??= []);
  return {
    from(nome) {
      const filtros = [];
      let modo = 'select';
      let patch = null;
      let linhas = null;
      const casa = (l) => filtros.every((f) => (f.tipo === 'eq' ? l[f.col] === f.valor : true));
      const q = {
        select: () => q,
        insert(v) {
          modo = 'insert';
          linhas = Array.isArray(v) ? v : [v];
          return q;
        },
        update(p) {
          modo = 'update';
          patch = p;
          return q;
        },
        eq(col, valor) {
          filtros.push({ tipo: 'eq', col, valor });
          return q;
        },
        order: () => q,
        limit: () => q,
        aplicar() {
          if (modo === 'insert') {
            for (const l of linhas) {
              if (estado.falharEm === nome) return { data: null, error: { message: 'falha simulada', code: '500' } };
              tabela(nome).push({ id: `${nome}-${tabela(nome).length + 1}`, ...l });
            }
            return { data: tabela(nome).slice(-linhas.length), error: null };
          }
          if (modo === 'update') {
            for (const l of tabela(nome).filter(casa)) Object.assign(l, patch);
            return { data: [], error: null };
          }
          return { data: tabela(nome).filter(casa), error: null };
        },
        single: async () => {
          const r = q.aplicar();
          return { data: r.data?.[0] ?? null, error: r.error ?? null };
        },
        maybeSingle: async () => {
          const r = q.aplicar();
          return { data: r.data?.[0] ?? null, error: r.error ?? null };
        },
        then: (res, rej) => {
          const r = q.aplicar();
          if (modo === 'select' && filtros.length) return Promise.resolve({ data: r.data, error: null, count: r.data.length }).then(res, rej);
          return Promise.resolve(r).then(res, rej);
        },
      };
      return q;
    },
  };
}

const CAMPANHA = {
  id: 'c1',
  nome: 'R$ 50 de crédito',
  descricao: null,
  pontos: 200,
  valor: 50,
  validade_dias: 90,
  ativo: true,
  inicio: null,
  fim: null,
  limite_por_usuario: 1,
  limite_total: null,
  resgatados: 0,
};

const novoEstado = (pontos) => ({
  campanhas_cashback: [{ ...CAMPANHA }],
  pontos_movimentos: pontos ? [{ id: 1, user_id: 'u1', pontos, motivo: 'avaliacao' }] : [],
  cupons: [],
  resgates: [],
});

console.log('\n=== SALDO ===');
{
  const db = bancoFalso({ pontos_movimentos: [
    { user_id: 'u1', pontos: 40 }, { user_id: 'u1', pontos: 70 }, { user_id: 'u1', pontos: -200 }, { user_id: 'u2', pontos: 999 },
  ] });
  ok('saldo é a soma dos movimentos da pessoa', (await saldoDePontos(db, 'u1')) === -90, `${await saldoDePontos(db, 'u1')}`);
}

console.log('\n=== RESGATE ===');
{
  const estado = novoEstado(150);
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('sem pontos suficientes, recusa', r.ok === false && r.motivo === 'pontos-insuficientes', JSON.stringify(r));
  ok('e não gera cupom nenhum', estado.cupons.length === 0);
  ok('nem debita pontos', estado.pontos_movimentos.filter((m) => m.motivo === 'resgate').length === 0);
}

{
  const estado = novoEstado(250);
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('com saldo, resgata', r.ok === true, JSON.stringify(r).slice(0, 90));
  ok('gera um cupom', estado.cupons.length === 1, `${estado.cupons.length}`);
  ok('o cupom é nominal ao cliente', estado.cupons[0]?.dono_user_id === 'u1');
  ok('com o valor da campanha', Number(estado.cupons[0]?.desconto_valor) === 50);
  ok('e uso único', estado.cupons[0]?.limite_usos === 1);
  ok('debita exatamente os pontos da campanha', estado.pontos_movimentos.some((m) => m.motivo === 'resgate' && m.pontos === -200));
  ok('registra o resgate', estado.resgates.length === 1);
  ok('e devolve o saldo novo', r.ok && r.saldo === 50, r.ok ? `${r.saldo}` : '');
}

{
  const estado = novoEstado(250);
  estado.resgates = [{ user_id: 'u1', campanha_id: 'c1' }];
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('respeita o limite por cliente', r.ok === false && r.motivo === 'limite-do-usuario', JSON.stringify(r));
}

{
  const estado = novoEstado(250);
  estado.campanhas_cashback[0].limite_total = 3;
  estado.campanhas_cashback[0].resgatados = 3;
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('respeita o limite total da campanha', r.ok === false && r.motivo === 'limite-da-campanha');
}

{
  const estado = novoEstado(250);
  estado.campanhas_cashback[0].ativo = false;
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('campanha desligada não resgata', r.ok === false && r.motivo === 'campanha-inativa');
}

{
  // O cupom falha DEPOIS do débito: os pontos têm que voltar.
  const estado = novoEstado(250);
  estado.falharEm = 'cupons';
  const r = await resgatar(bancoFalso(estado), 'u1', 'c1');
  ok('cupom que falha não come os pontos', r.ok === false, JSON.stringify(r).slice(0, 80));
  const debito = estado.pontos_movimentos.find((m) => m.motivo === 'resgate');
  const estorno = estado.pontos_movimentos.find((m) => m.motivo === 'estorno');
  ok('o débito é estornado', Boolean(debito && estorno) && debito.pontos + estorno.pontos === 0, `${debito?.pontos} / ${estorno?.pontos}`);
  ok('e o saldo volta ao que era', (await saldoDePontos(bancoFalso(estado), 'u1')) === 250);
}

// ================================================ 4. o que a tela promete
console.log('\n=== A TELA DIZ O QUE PRECISA DIZER ===');
const blocoProduto = readFileSync(join(ROOT, 'src/pages/Loja/Avaliacoes.tsx'), 'utf8');
ok('a página marca a avaliação como incentivada', blocoProduto.includes('avaliação incentivada'));
ok('e mostra o selo de compra verificada', blocoProduto.includes('compra verificada'));
ok('mostra a distribuição inteira, não só a média', /n1|barras/.test(blocoProduto));

const formulario = readFileSync(join(ROOT, 'src/pages/Painel/PainelAvaliacoes.tsx'), 'utf8');
ok('o formulário avisa que passa por conferência', /confer[êe]ncia|an[áa]lise/i.test(formulario));
ok('e que a nota baixa é publicada do mesmo jeito', /nota baixa/i.test(formulario));
ok('e que o ponto não depende da nota', /n[ãa]o dependem da nota|n[ãa]o depende da nota/i.test(formulario));

// ============================================ 5. escrita só pelo servidor
console.log('\n=== ESCRITA SÓ PELO SERVIDOR ===');
const migration = readFileSync(join(ROOT, 'migrations/2026-09-07_avaliacoes_pontos.sql'), 'utf8');
ok('RLS ligada em avaliacoes', /alter table public\.avaliacoes enable row level security/.test(migration));
ok('só existe política de SELECT (ninguém insere pelo navegador)', !/create policy[^;]*on public\.avaliacoes[\s\S]{0,80}for (insert|update|delete|all)/i.test(migration));
ok('avaliação aprovada é pública', /avaliacoes_publicas[\s\S]*status = 'aprovada'/.test(migration));
ok('um crédito por avaliação (índice único)', /pontos_avaliacao_uk[\s\S]*where motivo = 'avaliacao'/.test(migration));
ok('uma avaliação por pessoa por produto', /unique \(user_id, produto_slug\)/.test(migration));
ok('o cupom de cashback tem dono', /dono_user_id/.test(migration));

const front = readFileSync(join(ROOT, 'src/lib/shop/avaliacoes.ts'), 'utf8');
ok('o front nunca escreve direto na tabela', !/from\(['"]avaliacoes['"]\)|from\(['"]pontos_movimentos['"]\)/.test(front));

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo certo'}`);
process.exit(falhas ? 1 : 0);
