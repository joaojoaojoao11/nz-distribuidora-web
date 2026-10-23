// Autoteste do programa de indicação (Fase 2) — sem rede, sem banco.
//
// O que não pode quebrar em silêncio:
//   · a TRAVA de margem (§5): o teto e o corte, só com percentuais;
//   · os PERÍODOS da recorrência (mensal/quinzenal) no fuso de Brasília;
//   · o SUPER CUPOM: código sugerido e validação (sem NZ, sem palavrão);
//   · a régua única do cupom (motivoCupomInvalido): nominal, próprio, só
//     conta nova, limite por cliente, esgotado;
//   · a carteira: crédito a liberar × disponível, idempotência por pedido,
//     estorno e expiração (banco em memória).
//
// Uso: npm run incentivos:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-incentivos-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/incentivos/trava.ts',
    'api/_lib/incentivos/periodos.ts',
    'api/_lib/incentivos/superCupom.ts',
    'api/_lib/incentivos/config.ts',
    'api/_lib/incentivos/saqueRegras.ts',
    'api/_lib/incentivos/carteira.ts',
    'api/_lib/incentivos/cupomUsos.ts',
    // `cupomUsos` confere o documento no "só conta nova" (varredura 22/10).
    'api/_lib/conta/documento.ts',
    'api/_lib/pedido/precificar.ts',
    'api/_lib/pedido/dinheiro.ts',
    'api/_lib/conta/completude.ts',
    'api/_lib/promoMotoDados.ts',
    'api/_lib/loja/visibilidade.ts',
    'api/_lib/precos/regraAcesso.ts',
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

const { limitarIncentivo, tetoIncentivoPct } = await import(pathToFileURL(join(outDir, 'incentivos/trava.js')).href);
const { chavePeriodo, fimPeriodo, rotuloPeriodo } = await import(pathToFileURL(join(outDir, 'incentivos/periodos.js')).href);
const { codigoValido, sugerirCodigo } = await import(pathToFileURL(join(outDir, 'incentivos/superCupom.js')).href);
const { montarConfig, CONFIG_PADRAO } = await import(pathToFileURL(join(outDir, 'incentivos/config.js')).href);
const { creditar, debitar, saldoDe, estornarPorPedido, manutencaoCarteira, liberarAposEntrega, aplicarDevolucaoParcial, DIAS_SEM_ENTREGA } = await import(pathToFileURL(join(outDir, 'incentivos/carteira.js')).href);
const { motivoCupomInvalido, resolverCupom } = await import(pathToFileURL(join(outDir, 'pedido/precificar.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

console.log('\n=== TRAVA DE MARGEM (§5) ===');
{
  // Números FICTÍCIOS (repo público — os reais ficam no NZERP): lojista +10%,
  // cupom 5%, t 8%, k 3% → teto ≈ 6,83%.
  const teto = tetoIncentivoPct({ acrescimoPct: 10, descontoPct: 5, impostoPct: 8, comissaoEmbutidaPct: 3 });
  ok('lojista +10% com cupom 5%: teto ≈ 6,83%', Math.abs(teto - 6.83) < 0.02, String(teto));
  const r1 = limitarIncentivo({ acrescimoPct: 10, descontoPct: 5, impostoPct: 8, comissaoEmbutidaPct: 3, incentivoPct: 3 });
  ok('cashback 3% passa sem corte', !r1.cortou && r1.incentivoPct === 3);
  const r2 = limitarIncentivo({ acrescimoPct: 10, descontoPct: 5, impostoPct: 8, comissaoEmbutidaPct: 3, incentivoPct: 8 });
  ok('campanha (8%) é cortada para o teto', r2.cortou && r2.incentivoPct === r2.tetoPct && r2.incentivoPct < 8);
  // Revendedor +0%, sem cupom: afiliado limitado à comissão embutida (k).
  const teto0 = tetoIncentivoPct({ acrescimoPct: 0, descontoPct: 0, impostoPct: 8, comissaoEmbutidaPct: 3 });
  ok('revendedor +0% sem cupom: teto = k (a comissão embutida)', Math.abs(teto0 - 3) < 0.01, String(teto0));
  const r3 = limitarIncentivo({ acrescimoPct: 0, descontoPct: 0, impostoPct: 8, comissaoEmbutidaPct: 3, incentivoPct: 4 });
  ok('afiliado 4% no revendedor vira 3% (k)', r3.cortou && r3.incentivoPct === 3);
  const r4 = limitarIncentivo({ acrescimoPct: 0, descontoPct: 10, impostoPct: 8, comissaoEmbutidaPct: 3, incentivoPct: 3 });
  ok('desconto que já come a margem: incentivo vira 0, nunca negativo', r4.cortou && r4.incentivoPct === 0 && r4.tetoPct < 0);
  const r5 = limitarIncentivo({ acrescimoPct: 20, descontoPct: 5, impostoPct: 8, comissaoEmbutidaPct: 3, incentivoPct: 3 });
  ok('cliente final +20% com cupom 5% e 3%: passa', !r5.cortou);
}

console.log('\n=== PERÍODOS (mensal/quinzenal, Brasília) ===');
{
  const d1 = new Date('2026-10-15T23:30:00-03:00'); // 15/10 à noite em Brasília
  const d2 = new Date('2026-10-16T00:30:00-03:00'); // já 16/10 em Brasília
  ok('mensal: 2026-10', chavePeriodo(d1, 'mensal') === '2026-10');
  ok('quinzenal: 15/10 é Q1, 16/10 é Q2', chavePeriodo(d1, 'quinzenal') === '2026-10-Q1' && chavePeriodo(d2, 'quinzenal') === '2026-10-Q2');
  ok('fim do mês de outubro = 31/10 23:59:59 BRT', fimPeriodo(d1, 'mensal').toISOString() === '2026-11-01T02:59:59.000Z', fimPeriodo(d1, 'mensal').toISOString());
  ok('fim da 1ª quinzena = 15/10 23:59:59 BRT', fimPeriodo(d1, 'quinzenal').toISOString() === '2026-10-16T02:59:59.000Z');
  ok('fim da 2ª quinzena = fim do mês', fimPeriodo(d2, 'quinzenal').toISOString() === '2026-11-01T02:59:59.000Z');
  ok('fevereiro bissexto: 29/02', fimPeriodo(new Date('2028-02-20T12:00:00-03:00'), 'mensal').toISOString() === '2028-03-01T02:59:59.000Z');
  ok('rótulo em português', rotuloPeriodo('2026-10-Q2') === '2ª quinzena de outubro/2026' && rotuloPeriodo('2026-10') === 'outubro/2026');
  // Virada de ano no fuso: 31/12 23:30 BRT ainda é dezembro.
  ok('31/12 23:30 BRT é dezembro', chavePeriodo(new Date('2026-12-31T23:30:00-03:00'), 'mensal') === '2026-12');
}

console.log('\n=== SUPER CUPOM: código ===');
{
  ok('sugere pelo primeiro nome + 2 dígitos', /^JOAO\d{2}$/.test(sugerirCodigo('João Vitor', 0.5)));
  ok('sem nome: CLIENTE + dígitos', /^NZCLIENT\d{2}$/.test(sugerirCodigo('', 0.5)) || /^CLIENTE\d{2}$/.test(sugerirCodigo('', 0.5)));
  ok('nome que começa com NZ não vira código NZ', !sugerirCodigo('Nzinga', 0.5).startsWith('NZ'));
  ok('acentos e espaços saem', /^MARIAJOS\d{2}$/.test(sugerirCodigo('Maria-José Silva', 0.2)) || /^MARIA\d{2}$/.test(sugerirCodigo('Maria-José Silva', 0.2)));
  ok('válido: 4 a 12 letras/números', codigoValido('joao10').ok && codigoValido('ABCDEFGHIJKL').ok);
  ok('inválido: curto, com espaço, com símbolo', !codigoValido('ABC').ok && !codigoValido('JOAO 10').ok && !codigoValido('JOÃO10').ok);
  ok('inválido: prefixo NZ (é da loja)', !codigoValido('NZ-ABCDE').ok && !codigoValido('NZTOP').ok);
  ok('inválido: palavrão', !codigoValido('MERDA10').ok);
}

console.log('\n=== CONFIG (padrões fictícios) ===');
{
  const c = montarConfig(null);
  ok('sem linha: padrão fictício (5/3/10/3, carência 7, validade 12)', c.pctDescontoIndicado === 5 && c.pctCashbackIndicador === 3 && c.pctAtivacaoAfiliado === 10 && c.pctRecorrenciaAfiliado === 3 && c.diasLiberacao === 7 && c.mesesValidade === 12);
  ok('trava desligada sem imposto/comissão', c.travaAtiva === false && c.impostoPct === null);
  const d = montarConfig({ pct_ativacao_afiliado: '12.5', trava_margem_ativa: true, imposto_pct: '8', comissao_embutida_pct: 3, periodicidade_padrao: 'quinzenal', linhas_excluidas: ['ppf'] });
  ok('linha vinda como texto vira número; trava ligada com t e k', d.pctAtivacaoAfiliado === 12.5 && d.travaAtiva && d.impostoPct === 8 && d.comissaoEmbutidaPct === 3 && d.periodicidadePadrao === 'quinzenal' && d.linhasExcluidas[0] === 'ppf');
  ok('CONFIG_PADRAO exportado', CONFIG_PADRAO.saqueMinimo === 50);
}

// ------------------------------------------------ banco em memória
function bancoFalso(tabelas) {
  let seq = 1;
  const db = {
    tabelas,
    from(nome) {
      const rows = () => (tabelas[nome] ??= []);
      let filtros = [];
      let contar = false;
      let modo = 'select';
      let payload = null;
      let ordem = null;
      let limite = null;
      const aplica = () => {
        let r = rows().filter((l) => filtros.every((f) => f(l)));
        if (ordem) r = [...r].sort((a, b) => (a[ordem.c] < b[ordem.c] ? -1 : 1) * (ordem.asc ? 1 : -1));
        if (limite != null) r = r.slice(0, limite);
        return r;
      };
      const q = {
        select(_c, opts) {
          contar = Boolean(opts?.count);
          return q;
        },
        insert(obj) {
          modo = 'insert';
          payload = obj;
          return q;
        },
        update(obj) {
          modo = 'update';
          payload = obj;
          return q;
        },
        upsert(obj) {
          modo = 'upsert';
          payload = obj;
          return q;
        },
        eq(c, v) {
          filtros.push((l) => l[c] === v);
          return q;
        },
        neq(c, v) {
          filtros.push((l) => l[c] !== v);
          return q;
        },
        in(c, vs) {
          filtros.push((l) => vs.includes(l[c]));
          return q;
        },
        is(c, v) {
          filtros.push((l) => (v === null ? l[c] == null : l[c] === v));
          return q;
        },
        gt(c, v) {
          filtros.push((l) => l[c] > v);
          return q;
        },
        lte(c, v) {
          filtros.push((l) => l[c] != null && l[c] <= v);
          return q;
        },
        gte(c, v) {
          filtros.push((l) => l[c] != null && l[c] >= v);
          return q;
        },
        or(expr) {
          const m = /^(\w+)\.is\.null,\1\.not\.in\.\(([^)]*)\)$/.exec(expr);
          if (m) {
            const lista = m[2].split(',');
            filtros.push((l) => l[m[1]] == null || !lista.includes(l[m[1]]));
            return q;
          }
          const m2 = /^(\w+)\.eq\.(\w+),(\w+)\.in\.\(([^)]*)\)$/.exec(expr);
          if (m2) {
            const lista = m2[4].split(',');
            filtros.push((l) => l[m2[1]] === m2[2] || lista.includes(l[m2[3]]));
            return q;
          }
          throw new Error('or() não suportado no teste: ' + expr);
        },
        order(c, o) {
          ordem = { c, asc: o?.ascending !== false };
          return q;
        },
        limit(n) {
          limite = n;
          return q;
        },
        maybeSingle: async () => ({ data: (await q.then((x) => x)).data?.[0] ?? null, error: null }),
        single: async () => {
          const r = await q.then((x) => x);
          return r.error ? { data: null, error: r.error } : { data: r.data?.[0] ?? null, error: r.data?.[0] ? null : { message: 'nada' } };
        },
        then(resolve, reject) {
          try {
            if (modo === 'insert' || modo === 'upsert') {
              const lista = Array.isArray(payload) ? payload : [payload];
              const inseridos = [];
              for (const obj of lista) {
                if (nome === 'carteira_devolucoes' && rows().some((l) => l.cancelamento_id === obj.cancelamento_id)) {
                  return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }).then(resolve, reject);
                }
                if (nome === 'carteira_movimentos' && obj.pedido_id && ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia'].includes(obj.tipo)) {
                  if (rows().some((l) => l.tipo === obj.tipo && l.pedido_id === obj.pedido_id && l.user_id === obj.user_id)) {
                    return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }).then(resolve, reject);
                  }
                }
                const linha = { id: seq++, criado_em: new Date().toISOString(), ...obj };
                rows().push(linha);
                inseridos.push(linha);
              }
              return Promise.resolve({ data: inseridos, error: null }).then(resolve, reject);
            }
            if (modo === 'update') {
              const alvo = aplica();
              for (const l of alvo) Object.assign(l, payload);
              return Promise.resolve({ data: alvo, error: null }).then(resolve, reject);
            }
            const r = aplica();
            return Promise.resolve({ data: contar ? null : r, count: contar ? r.length : null, error: null }).then(resolve, reject);
          } catch (e) {
            return Promise.resolve({ data: null, error: { message: String(e) } }).then(resolve, reject);
          }
        },
      };
      return q;
    },
  };
  // carteira_saldos como view: calcula em cima dos movimentos.
  const fromOriginal = db.from.bind(db);
  db.from = (nome) => {
    if (nome !== 'carteira_saldos') return fromOriginal(nome);
    const q = {
      select: () => q,
      eq(c, v) {
        q._user = v;
        return q;
      },
      maybeSingle: async () => {
        const movs = (tabelas.carteira_movimentos ?? []).filter((m) => m.user_id === q._user);
        const soma = (st) => Math.round(movs.filter((m) => st.includes(m.status)).reduce((s, m) => s + Number(m.valor), 0) * 100) / 100;
        return { data: { disponivel: soma(['disponivel']), a_liberar: soma(['a_liberar']), total: soma(['disponivel', 'a_liberar']) }, error: null };
      },
    };
    return q;
  };
  return db;
}

console.log('\n=== CARTEIRA (razão em memória) ===');
{
  const db = bancoFalso({ carteira_movimentos: [] });
  const amanha = new Date(Date.now() + 86400000);
  const c1 = await creditar(db, { userId: 'ana', tipo: 'cashback_indicacao', valor: 31.35, liberaEm: amanha, pedidoId: 'p1', origemUserId: 'beto', baseValor: 1045, percentualAplicado: 3 });
  ok('crédito com carência nasce a_liberar', c1.movimento?.status === 'a_liberar' && !c1.repetido);
  const c2 = await creditar(db, { userId: 'ana', tipo: 'cashback_indicacao', valor: 31.35, liberaEm: amanha, pedidoId: 'p1', origemUserId: 'beto' });
  ok('o mesmo pedido de novo: repetido, não duplica', c2.repetido && db.tabelas.carteira_movimentos.length === 1);
  const c3 = await creditar(db, { userId: 'ana', tipo: 'resgate_pontos', valor: 20 });
  ok('crédito sem carência nasce disponível', c3.movimento?.status === 'disponivel');
  let s = await saldoDe(db, 'ana');
  ok('saldo: 20 disponível, 31,35 a liberar', s.disponivel === 20 && s.aLiberar === 31.35 && s.total === 51.35, JSON.stringify(s));
  const d = await debitar(db, { userId: 'ana', tipo: 'uso_compra', valor: 12.5, pedidoId: 'p9' });
  ok('débito é negativo e disponível', d.movimento?.valor === -12.5 && d.movimento?.status === 'disponivel');
  s = await saldoDe(db, 'ana');
  ok('saldo depois do uso: 7,50', s.disponivel === 7.5, String(s.disponivel));
  ok('crédito zero é recusado', (await creditar(db, { userId: 'ana', tipo: 'ajuste', valor: 0 })).erro === 'valor-zero');
  // Estorno: a liberar → marcado; disponível → movimento negativo.
  await creditar(db, { userId: 'ana', tipo: 'comissao_ativacao', valor: 50, pedidoId: 'p2', origemUserId: 'caio' });
  const n = await estornarPorPedido(db, 'p1', 'cancelado');
  const n2 = await estornarPorPedido(db, 'p2', 'devolvido');
  ok('estorno do a liberar marca "estornado" (1 toque)', n === 1 && db.tabelas.carteira_movimentos.find((m) => m.pedido_id === 'p1' && m.tipo === 'cashback_indicacao').status === 'estornado');
  ok('estorno do disponível gera movimento negativo', n2 === 1 && db.tabelas.carteira_movimentos.some((m) => m.tipo === 'estorno' && m.valor === -50 && m.pedido_id === 'p2'));
  ok('estornar de novo não faz nada', (await estornarPorPedido(db, 'p2', 'de novo')) === 0);
  s = await saldoDe(db, 'ana');
  ok('saldo final: 7,50 disponível (50 − 50), 0 a liberar', s.disponivel === 7.5 && s.aLiberar === 0, JSON.stringify(s));
  // Liberação e expiração pelo cron.
  const db2 = bancoFalso({ carteira_movimentos: [] });
  // Nasceu a liberar (carência no futuro); depois a carência venceu.
  const pend = await creditar(db2, { userId: 'ana', tipo: 'comissao_recorrencia', valor: 10, liberaEm: new Date(Date.now() + 86400000), pedidoId: 'p3' });
  ok('crédito com carência no futuro nasce a_liberar', pend.movimento?.status === 'a_liberar');
  pend.movimento.libera_em = new Date(Date.now() - 1000).toISOString();
  const velho = await creditar(db2, { userId: 'ana', tipo: 'cashback_indicacao', valor: 5, pedidoId: 'p4' });
  velho.movimento.liberado_em = new Date(Date.now() - 400 * 86400000).toISOString();
  // A expiração em si é FIFO no banco (carteira_expirar_usuario, varredura
  // 22/10 — o teste de verdade dela roda contra o Postgres). Aqui: o cron acha
  // quem tem crédito vencido e chama a função com a régua certa.
  const chamadas = [];
  db2.rpc = async (nome, args) => {
    chamadas.push({ nome, args });
    return { data: [{ expirados: 1, valor: 5 }], error: null };
  };
  const m = await manutencaoCarteira(db2, 12);
  const ch = chamadas[0];
  const meses = ch ? (Date.now() - Date.parse(ch.args.p_limite)) / (30.44 * 86400000) : 0;
  ok('cron: libera o vencido e expira o de mais de 12 meses', m.liberados === 1 && m.expirados === 1 && m.valorExpirado === 5, JSON.stringify(m));
  ok('cron: expiração pela função FIFO, uma chamada por pessoa, régua de 12 meses', chamadas.length === 1 && ch.nome === 'carteira_expirar_usuario' && ch.args.p_user_id === 'ana' && ch.args.p_tipos.includes('cashback_indicacao') && !ch.args.p_tipos.includes('estorno') && meses > 11.5 && meses < 12.5, JSON.stringify(ch?.args));
  ok('crédito com libera_em no passado nasce já disponível', (await creditar(db2, { userId: 'ana', tipo: 'ajuste', valor: 1, liberaEm: new Date(Date.now() - 1000) })).movimento?.status === 'disponivel');
}

console.log('\n=== LIBERA DEPOIS DA ENTREGA E DEVOLUÇÃO PARCIAL (#10, 23/10) ===');
{
  const dia = 86400000;
  const db3 = bancoFalso({ carteira_movimentos: [], carteira_devolucoes: [] });
  db3.rpc = async () => ({ data: [{ expirados: 0, valor: 0 }], error: null });
  // Faturado há 10 dias: a carência antiga (7) já passou, mas o pedido não foi entregue.
  const c1 = await creditar(db3, { userId: 'ana', tipo: 'comissao_ativacao', valor: 40, liberaEm: new Date(Date.now() - 3 * dia), pedidoId: 'pe1', percentualAplicado: 4, baseValor: 1000, aguardaEntrega: true });
  ok('crédito de pedido nasce a liberar esperando a entrega, mesmo com a carência antiga vencida', c1.movimento?.status === 'a_liberar' && c1.movimento?.libera_apos_entrega === true);
  let m = await manutencaoCarteira(db3, 12);
  ok('sem entrega, o cron não libera', m.liberados === 0 && db3.tabelas.carteira_movimentos[0].status === 'a_liberar', JSON.stringify(m));
  // Entregue há 2 dias, carência 7: libera daqui a 5 dias.
  const entregue = new Date(Date.now() - 2 * dia);
  const n = await liberarAposEntrega(db3, 'pe1', entregue, 7);
  const mov = db3.tabelas.carteira_movimentos[0];
  ok('entregue: a data vira entrega + carência e o crédito para de esperar', n === 1 && mov.libera_apos_entrega === false && Math.abs(Date.parse(mov.libera_em) - (entregue.getTime() + 7 * dia)) < 1000);
  m = await manutencaoCarteira(db3, 12);
  ok('…e o cron ainda não libera antes da data', m.liberados === 0);
  // Recorrência com fim de período DEPOIS de entrega + carência: vale o fim do período.
  const fimPeriodo = new Date(Date.now() + 20 * dia);
  await creditar(db3, { userId: 'bia', tipo: 'comissao_recorrencia', valor: 10, liberaEm: fimPeriodo, pedidoId: 'pe2', percentualAplicado: 2, aguardaEntrega: true });
  await liberarAposEntrega(db3, 'pe2', new Date(), 7);
  ok('recorrência: vale o que vier depois (fim do período)', Date.parse(db3.tabelas.carteira_movimentos[1].libera_em) === fimPeriodo.getTime());
  // Entrega que nunca chega: depois de DIAS_SEM_ENTREGA o crédito deixa de esperar.
  const velho = await creditar(db3, { userId: 'caio', tipo: 'cashback_indicacao', valor: 5, liberaEm: new Date(Date.now() - 50 * dia), pedidoId: 'pe3', percentualAplicado: 1, aguardaEntrega: true });
  velho.movimento.criado_em = new Date(Date.now() - (DIAS_SEM_ENTREGA + 1) * dia).toISOString();
  m = await manutencaoCarteira(db3, 12);
  ok('pedido que o NZERP nunca marca entregue: libera depois de ' + DIAS_SEM_ENTREGA + ' dias', m.semEntrega === 1 && m.liberados === 1 && velho.movimento.status === 'disponivel', JSON.stringify(m));

  // Devolução parcial de R$ 250 no pedido pe1 (comissão de 4%): o crédito a liberar perde R$ 10.
  const d1 = await aplicarDevolucaoParcial(db3, { id: 'dev-1', pedidoId: 'pe1', valorMaterial: 250 });
  ok('devolução parcial: crédito a liberar perde a comissão da parte devolvida (40 → 30)', d1?.descontado === 10 && db3.tabelas.carteira_movimentos[0].valor === 30 && /devolução parcial/.test(db3.tabelas.carteira_movimentos[0].obs ?? ''), JSON.stringify(d1));
  ok('a mesma devolução não é aplicada duas vezes', (await aplicarDevolucaoParcial(db3, { id: 'dev-1', pedidoId: 'pe1', valorMaterial: 250 })) === null && db3.tabelas.carteira_movimentos[0].valor === 30);
  // Devolução maior que o que sobrou: o crédito zera e vira estornado.
  await aplicarDevolucaoParcial(db3, { id: 'dev-2', pedidoId: 'pe1', valorMaterial: 5000 });
  ok('devolução que leva tudo: crédito estornado, nunca negativo', db3.tabelas.carteira_movimentos[0].status === 'estornado' && db3.tabelas.carteira_movimentos[0].valor === 30);
  // Crédito já liberado: não mexe; vai para a equipe.
  const d3 = await aplicarDevolucaoParcial(db3, { id: 'dev-3', pedidoId: 'pe3', valorMaterial: 100 });
  ok('crédito já liberado não é mexido: vira caso da equipe', d3?.descontado === 0 && d3?.paraEquipe === 1 && velho.movimento.valor === 5, JSON.stringify(d3));
}

console.log('\n=== RÉGUA DO CUPOM (nominal, super, afiliado) ===');
{
  const cupons = [
    { codigo: 'JOAO27', tipo: 'super', desconto_pct: null, desconto_valor: null, afiliado_user_id: null, dono_user_id: 'joao', ativo: true, valido_de: null, valido_ate: null, limite_usos: null, usos: 0, so_conta_nova: true, usos_por_cliente: 1 },
    { codigo: 'NZ-AF001', tipo: 'afiliado', desconto_pct: null, desconto_valor: null, afiliado_user_id: 'afi', dono_user_id: null, ativo: true, valido_de: null, valido_ate: null, limite_usos: null, usos: 0, so_conta_nova: false, usos_por_cliente: null },
    { codigo: 'SOMARIA', tipo: 'nominal', desconto_pct: 10, desconto_valor: null, afiliado_user_id: null, dono_user_id: 'maria', ativo: true, valido_de: null, valido_ate: null, limite_usos: null, usos: 0, so_conta_nova: false, usos_por_cliente: null },
    { codigo: 'CAMP10', tipo: 'campanha', desconto_pct: 10, desconto_valor: null, afiliado_user_id: null, dono_user_id: null, ativo: true, valido_de: null, valido_ate: null, limite_usos: 2, usos: 1, so_conta_nova: false, usos_por_cliente: null },
  ];
  const pedidos = [
    { id: 'pg', user_id: 'veterano', cupom: null, cupom_consumido_em: null, status: 'ENTREGUE', pagamento_status: 'pago' },
    { id: 'pr', user_id: 'novo2', cupom: 'JOAO27', cupom_consumido_em: null, status: 'SOLICITADO', pagamento_status: null },
    { id: 'px', user_id: 'x', cupom: 'CAMP10', cupom_consumido_em: null, status: 'RASCUNHO', pagamento_status: 'aguardando' },
  ];
  const cupom_usos = [{ cupom_codigo: 'JOAO27', user_id: 'jausou', pedido_id: 'p-old' }];
  const afiliados = [{ user_id: 'afi', status: 'aprovado', ativo: true, desconto_cupom_pct: 2 }];
  const loja_config = [{ id: 1, pct_desconto_indicado: 5, super_cupom_ativo: true, desconto_cupom_afiliado_pct: 0 }];
  const db = bancoFalso({ cupons, pedidos, cupom_usos, afiliados, loja_config });
  const achar = (c) => cupons.find((x) => x.codigo === c);
  ok('super cupom vale para conta nova de outra pessoa', (await motivoCupomInvalido(db, achar('JOAO27'), 'novo')) === null);
  ok('super cupom: o dono não usa o próprio', (await motivoCupomInvalido(db, achar('JOAO27'), 'joao')) === 'proprio');
  ok('super cupom: quem já comprou não usa (só conta nova)', (await motivoCupomInvalido(db, achar('JOAO27'), 'veterano')) === 'so-conta-nova');
  ok('super cupom: quem já usou uma vez não usa de novo', (await motivoCupomInvalido(db, achar('JOAO27'), 'jausou')) === 'ja-usou');
  ok('super cupom: orçamento em aberto já reserva o único uso', (await motivoCupomInvalido(db, achar('JOAO27'), 'novo2')) === 'ja-usou');
  ok('sem login: super cupom passa (o checkout confere de novo)', (await motivoCupomInvalido(db, achar('JOAO27'), null)) === null);
  ok('nominal: só a dona', (await motivoCupomInvalido(db, achar('SOMARIA'), 'maria')) === null && (await motivoCupomInvalido(db, achar('SOMARIA'), 'outro')) === 'nominal' && (await motivoCupomInvalido(db, achar('SOMARIA'), null)) === 'login');
  ok('afiliado: ninguém usa o próprio', (await motivoCupomInvalido(db, achar('NZ-AF001'), 'afi')) === 'proprio' && (await motivoCupomInvalido(db, achar('NZ-AF001'), 'novo')) === null);
  ok('campanha com limite 2: 1 uso + 1 reserva = esgotado', (await motivoCupomInvalido(db, achar('CAMP10'), 'novo')) === 'esgotado');
  ok('cupom inexistente', (await motivoCupomInvalido(db, null, 'novo')) === 'inexistente');
  const rs = await resolverCupom(db, 'joao27', 200, 'novo');
  ok('resolverCupom: super dá o desconto da configuração (5% de 200 = 10) e não atribui afiliado', rs.codigo === 'JOAO27' && rs.desconto === 10 && rs.afiliadoUserId === null && rs.tipo === 'super');
  const ra = await resolverCupom(db, 'NZ-AF001', 200, 'novo');
  ok('resolverCupom: afiliado dá o desconto DO afiliado (2% = 4) e atribui o afiliado', ra.desconto === 4 && ra.afiliadoUserId === 'afi' && ra.tipo === 'afiliado');
  const rn = await resolverCupom(db, 'SOMARIA', 200, 'outro');
  ok('resolverCupom: nominal de outra pessoa é inválido com motivo', rn.invalido && rn.motivo === 'nominal');
}

// ================================================ FASE 4: SAQUE (regras puras)
console.log('\n=== SAQUE: chave Pix e vencimento ===');
{
  const { validarChavePix, calcularVencimentoSaque } = await import(pathToFileURL(join(outDir, 'incentivos/saqueRegras.js')).href);
  ok('CPF com pontuação vira só dígitos', JSON.stringify(validarChavePix('cpf_cnpj', '529.982.247-25')) === JSON.stringify({ ok: true, tipo: 'cpf_cnpj', chave: '52998224725' }));
  ok('CNPJ com 14 dígitos passa; 12 dígitos não', validarChavePix('cpf_cnpj', '37.816.257/0001-26').ok && !validarChavePix('cpf_cnpj', '123456789012').ok);
  ok('documento com dígitos repetidos não passa', !validarChavePix('cpf_cnpj', '11111111111').ok);
  ok('e-mail vira minúsculo; sem @ não passa', validarChavePix('email', 'Joao@Exemplo.com').chave === 'joao@exemplo.com' && !validarChavePix('email', 'joao').ok);
  ok('telefone com DDD ganha +55', validarChavePix('telefone', '(11) 99999-0000').chave === '+5511999990000' && !validarChavePix('telefone', '9999').ok);
  ok('chave aleatória com ou sem hífens', validarChavePix('aleatoria', '123E4567-E89B-12D3-A456-426614174000').ok && validarChavePix('aleatoria', '123e4567e89b12d3a456426614174000').ok && !validarChavePix('aleatoria', 'abc').ok);
  ok('tipo desconhecido não passa', !validarChavePix('cartao', 'x').ok);

  // Vencimento: quarta 21/10/2026 em Brasília (UTC−3).
  const quartaManha = new Date('2026-10-21T13:59:00-03:00');
  const quartaTarde = new Date('2026-10-21T14:01:00-03:00');
  const sextaTarde = new Date('2026-10-23T15:00:00-03:00');
  ok('antes da hora de corte: +2 dias úteis = sexta 23/10', calcularVencimentoSaque(quartaManha, 2, '14:00') === '2026-10-23');
  ok('depois da hora de corte: conta como quinta → +2 úteis = segunda 26/10', calcularVencimentoSaque(quartaTarde, 2, '14:00') === '2026-10-26');
  ok('sexta à tarde, 1 dia útil: pula o fim de semana → terça 27/10', calcularVencimentoSaque(sextaTarde, 1, '14:00') === '2026-10-27');
  ok('zero dias úteis antes do corte: o próprio dia', calcularVencimentoSaque(quartaManha, 0, '14:00') === '2026-10-21');
  ok('sábado com zero dias: cai na segunda', calcularVencimentoSaque(new Date('2026-10-24T10:00:00-03:00'), 0, '14:00') === '2026-10-26');
  ok('hora de corte inválida cai em 14:00', calcularVencimentoSaque(quartaTarde, 1, 'xx') === '2026-10-23');
}

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
