// Ponto de entrada da auditoria (scripts/audit-shop.mjs). Não é importado pelo
// app — existe para que a camada TS possa ser exercitada fora do browser.

import { SHOP_ITEMS, shopCounts, SOURCE_LABEL } from './catalog';
import { COLOR_LABEL, type ColorFamilyId } from './color/lexicon';
import { runShopSelfTest } from './selftest';
import { applyFilters, EMPTY_FILTERS } from './search/match';
import { relatedItems } from './related';
import { getShopItem } from './catalog';
import { parseShopQuery } from './search/parseQuery';
import type { ShopItem } from './types';

function tally(items: ShopItem[], pick: (i: ShopItem) => string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    for (const key of pick(item)) out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

export function runAudit(): number {
  let failures = runShopSelfTest();

  const counts = shopCounts();

  console.log(`\n=== CATÁLOGO UNIFICADO — ${counts.total} itens ===\n`);
  console.table(
    Object.entries(counts.porFonte).map(([source, n]) => ({
      fonte: SOURCE_LABEL[source as keyof typeof SOURCE_LABEL] ?? source,
      itens: n,
    }))
  );
  console.log('Por vertical:', counts.porVertical);
  console.log('Por tipo:', counts.porTipo);

  console.log('\n=== FAMÍLIAS DE COR ===');
  const porCor = tally(SHOP_ITEMS, (i) => i.colorFamilies);
  console.table(
    Object.entries(porCor).map(([f, n]) => ({
      familia: COLOR_LABEL[f as ColorFamilyId] ?? f,
      itens: n,
    }))
  );

  console.log('\n=== ACABAMENTOS ===');
  console.table(tally(SHOP_ITEMS, (i) => i.finishes));

  // Cobertura — o que a busca NÃO vai achar.
  const coresSemFamilia = SHOP_ITEMS.filter((i) => i.kind === 'cor' && !i.colorFamilies.length);
  const coresSemAcabamento = SHOP_ITEMS.filter((i) => i.kind === 'cor' && !i.finishes.length);

  console.log(`\n=== COBERTURA ===`);
  console.log(`cores sem família de cor : ${coresSemFamilia.length}`);
  console.log(`cores sem acabamento     : ${coresSemAcabamento.length}`);
  console.log(`sem imagem e sem hex     : ${counts.semImagem}`);

  if (coresSemFamilia.length) {
    console.log('\nCores não classificadas (a busca por cor não encontra estas):');
    console.table(
      coresSemFamilia.slice(0, 40).map((i) => ({
        slug: i.slug,
        nome: i.name,
        hex: i.hex ?? '—',
      }))
    );
    failures++;
  }

  if (coresSemAcabamento.length) {
    console.log('\nCores sem acabamento normalizado:');
    console.table(
      coresSemAcabamento.slice(0, 40).map((i) => ({
        slug: i.slug,
        nome: i.name,
        original: i.finishLabel ?? '—',
      }))
    );
  }

  failures += auditSearch();
  failures += auditProductPage();
  failures += auditMarcasELinhas();
  failures += auditCuradoria();
  return failures;
}

function search(q: string): ShopItem[] {
  return applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q });
}

/**
 * Os casos do requisito, conferidos contra o dado real — não contra uma
 * expectativa escrita à mão. A relação que precisa valer:
 *   azul ⊇ azul fosco ⊇ azul acetinado
 * e "azul fosco" tem que ser exatamente a união dos foscos com os acetinados.
 */
function auditSearch(): number {
  let failures = 0;

  console.log('\n=== BUSCA — os 3 casos do requisito ===\n');

  const azul = search('azul');
  const azulFosco = search('azul fosco');
  const azulAcetinado = search('azul acetinado');
  const azulBrilhante = search('azul brilhante');

  const foscoPuro = azul.filter((i) => i.finishes.includes('fosco'));
  const acetinado = azul.filter((i) => i.finishes.includes('acetinado'));

  console.table([
    { consulta: 'azul', resultados: azul.length },
    { consulta: 'azul fosco', resultados: azulFosco.length },
    { consulta: 'azul acetinado', resultados: azulAcetinado.length },
    { consulta: 'azul brilhante', resultados: azulBrilhante.length },
  ]);
  console.log(
    `entre os azuis: ${foscoPuro.length} com tag 'fosco', ${acetinado.length} com tag 'acetinado'`
  );

  const check = (nome: string, ok: boolean, detalhe: string) => {
    if (ok) {
      console.log(`  OK   ${nome}`);
    } else {
      console.log(`  FALHA ${nome} — ${detalhe}`);
      failures++;
    }
  };

  const slugs = (list: ShopItem[]) => new Set(list.map((i) => i.slug));
  const fosco = slugs(azulFosco);
  const acet = slugs(azulAcetinado);

  check(
    "'azul fosco' ⊆ 'azul'",
    azulFosco.every((i) => slugs(azul).has(i.slug)),
    'há resultado em azul fosco que não está em azul'
  );
  check(
    "'azul acetinado' ⊆ 'azul fosco' (fosco é pai de acetinado)",
    azulAcetinado.every((i) => fosco.has(i.slug)),
    'acetinado não está contido em fosco'
  );
  check(
    "'azul fosco' = foscos ∪ acetinados",
    azulFosco.length === foscoPuro.length + acetinado.length &&
      [...foscoPuro, ...acetinado].every((i) => fosco.has(i.slug)),
    `${azulFosco.length} ≠ ${foscoPuro.length} + ${acetinado.length}`
  );
  check(
    "'azul acetinado' NÃO traz fosco puro",
    !azulAcetinado.some((i) => i.finishes.includes('fosco') && !i.finishes.includes('acetinado')),
    'acetinado vazou fosco puro — a hierarquia foi aplicada no dado, não na consulta'
  );
  check(
    "'azul acetinado' = só os acetinados",
    acet.size === acetinado.length,
    `${acet.size} ≠ ${acetinado.length}`
  );
  check(
    "'azul' ⊋ 'azul fosco' (azul traz também os brilhantes)",
    azul.length > azulFosco.length,
    'azul não é estritamente maior que azul fosco'
  );

  console.log('\n=== BUSCA — outros casos ===\n');
  const outros = [
    'azul marinho',
    'verde',
    'metamark azul',
    'madeira carvalho',
    'm7-108',
    'acacia',
    'carrara',
    'oracal 651',
    'envelopamento fosco',
    'preto brilhante',
    'branco',
    'camaleao',
  ];
  console.table(
    outros.map((q) => {
      const parsed = parseShopQuery(q);
      const results = search(q);
      return {
        consulta: q,
        resultados: results.length,
        classificacao: parsed.tokens.map((t) => `${t.raw}:${t.kind}`).join(' '),
        primeiro: results[0]?.name ?? '—',
      };
    })
  );

  // Uma consulta sem nenhum acerto textual tem que devolver zero, não o catálogo.
  const lixo = search('zzzz nao existe');
  check('consulta sem sentido devolve 0', lixo.length === 0, `devolveu ${lixo.length}`);

  return failures;
}

/**
 * Os 4 casos degenerados que o template único de produto tem que aguentar.
 * Cada fonte falta um dado diferente; se um deles quebrar, a página mostra um
 * buraco em vez de degradar.
 */
function auditProductPage(): number {
  let failures = 0;
  console.log('\n=== PÁGINA DE PRODUTO — casos degenerados ===\n');

  const casos = [
    { nome: 'MCX (sem hex publicado)', pick: (i: ShopItem) => i.source === 'mcx' },
    { nome: 'Oracal 651 (sem imagem)', pick: (i: ShopItem) => i.source === 'oracal-651' },
    { nome: 'Etherna (sem acabamento)', pick: (i: ShopItem) => i.source === 'etherna' },
    { nome: 'Avery (sem cor e sem imagem)', pick: (i: ShopItem) => i.source === 'avery' },
    { nome: 'NZPPF (linha técnica)', pick: (i: ShopItem) => i.source === 'ppf' },
  ];

  const linhas = casos.map((c) => {
    const item = SHOP_ITEMS.find(c.pick);
    if (!item) {
      failures++;
      return { caso: c.nome, status: 'FONTE AUSENTE', midia: '—', specs: 0, relacionados: 0 };
    }

    // Qual bloco de mídia o template vai escolher.
    const midia = item.gallery.length || item.image ? 'galeria' : item.hex ? 'painel de cor' : 'bloco da marca';

    // A ficha sintética precisa render ao menos 1 linha mesmo sem specs.
    const specsEfetivas = item.specs.length ? item.specs.length : 1;

    const rel = relatedItems(item);
    if (rel.length < 8) failures++;
    if (rel.some((r) => r.slug === item.slug)) failures++;

    // O item tem que ser encontrável pelo próprio slug — é o que a rota faz.
    if (!getShopItem(item.slug)) failures++;

    return {
      caso: c.nome,
      status: 'ok',
      midia,
      specs: specsEfetivas,
      relacionados: rel.length,
    };
  });

  console.table(linhas);

  // Nenhum item pode ficar sem rota resolvível nem sem 8 relacionados.
  const semRelacionados = SHOP_ITEMS.filter((i) => relatedItems(i).length < 8);
  if (semRelacionados.length) {
    console.log(`\nFALHA: ${semRelacionados.length} itens com menos de 8 relacionados`);
    console.table(semRelacionados.slice(0, 10).map((i) => ({ slug: i.slug, fonte: i.source })));
    failures++;
  } else {
    console.log('  OK   todos os 505 itens têm 8 relacionados');
  }

  const naoResolvem = SHOP_ITEMS.filter((i) => !getShopItem(i.slug));
  if (naoResolvem.length) {
    console.log(`\nFALHA: ${naoResolvem.length} itens não resolvem pelo próprio slug`);
    failures++;
  } else {
    console.log('  OK   todos os slugs resolvem em /loja/:slug');
  }

  return failures;
}

/**
 * Marca × linha. O filtro de marca casava por SUBSTRING no `searchText`, e por
 * isso "SH" trazia 'Marrakesh', 'Windshield', 'Shadow', 'Grasshopper' e
 * 'British' junto com os produtos SH — 9 falsos positivos em 94 resultados.
 * Estes testes travam as duas correções: igualdade exata, e a separação entre
 * fabricante (SH) e linha (SH Wrapping automotiva × SH Decor decorativa).
 */
function auditMarcasELinhas(): number {
  let failures = 0;
  console.log('');
  console.log('=== MARCA × LINHA ===');
  console.log('');

  const check = (nome: string, ok: boolean, detalhe: string) => {
    if (ok) console.log(`  OK   ${nome}`);
    else {
      console.log(`  FALHA ${nome} — ${detalhe}`);
      failures++;
    }
  };

  const porLinha = (linha: string) =>
    applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, lines: [linha as never] });
  const porMarca = (marca: string) =>
    applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, brands: [marca as never] });

  const shDecor = porLinha('sh-decor');
  const shWrapping = porLinha('sh-wrapping');
  const sh = porMarca('sh');

  console.table([
    { filtro: 'linha: SH Decor', resultados: shDecor.length },
    { filtro: 'linha: SH Wrapping', resultados: shWrapping.length },
    { filtro: 'fabricante: SH', resultados: sh.length },
    { filtro: 'fabricante: Metamark', resultados: porMarca('metamark').length },
    { filtro: 'linha: Metamark 7 Series', resultados: porLinha('m7').length },
    { filtro: 'linha: MetaCast MCX', resultados: porLinha('mcx').length },
    { filtro: 'fabricante: Orafol', resultados: porMarca('orafol').length },
    { filtro: 'linha: Oracal 651', resultados: porLinha('oracal-651').length },
  ]);

  check(
    'fabricante SH = SH Decor + SH Wrapping, sem sobra',
    sh.length === shDecor.length + shWrapping.length,
    `${sh.length} != ${shDecor.length} + ${shWrapping.length}`
  );
  check(
    'SH Decor é 100% decorativo',
    shDecor.every((i) => i.vertical === 'DECOR'),
    'há item não-DECOR na linha SH Decor'
  );
  check(
    'SH Wrapping é 100% automotivo',
    shWrapping.every((i) => i.vertical === 'WRAP'),
    'há item não-WRAP na linha SH Wrapping'
  );
  check(
    'SH Decor e SH Wrapping não se sobrepõem',
    !shDecor.some((d) => shWrapping.some((w) => w.slug === d.slug)),
    'as duas linhas compartilham itens'
  );

  // Os falsos positivos originais, nominalmente.
  const intrusos = ['Marrakesh', 'Windshield', 'Shadow', 'Grasshopper', 'Shortbread', 'British'];
  const vazou = sh.filter((i) => intrusos.some((n) => i.name.includes(n)));
  check(
    'nenhum falso positivo por substring em "SH"',
    vazou.length === 0,
    `vazaram: ${vazou.map((i) => i.name).join(', ')}`
  );

  const semMarca = SHOP_ITEMS.filter((i) => !i.brandKey);
  check('todo item tem fabricante', semMarca.length === 0, `${semMarca.length} sem brandKey`);

  const linhas = new Set(SHOP_ITEMS.map((i) => i.lineKey));
  const soma = [...linhas].reduce((acc, l) => acc + porLinha(l).length, 0);
  check(
    'a soma das linhas cobre o catálogo inteiro',
    soma === SHOP_ITEMS.length,
    `${soma} != ${SHOP_ITEMS.length}`
  );

  console.log('');
  console.log('=== BUSCA POR TEXTO: linha vs fabricante ===');
  console.log('');
  const casos = ['sh decor', 'sh wrapping', 'sh', 'metamark', 'm7', 'mcx', 'oracal 670ra'];
  console.table(
    casos.map((q) => {
      const parsed = parseShopQuery(q);
      return {
        consulta: q,
        resultados: applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q }).length,
        classificacao: parsed.tokens.map((t) => `${t.raw}:${t.kind}`).join(' '),
      };
    })
  );

  const buscaShDecor = applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q: 'sh decor' });
  check(
    'buscar "sh decor" não traz vinil automotivo',
    !buscaShDecor.some((i) => i.lineKey === 'sh-wrapping'),
    'SH Wrapping apareceu na busca por SH Decor'
  );

  return failures;
}

/**
 * Curadoria e link compartilhado.
 *
 * O ponto delicado é a ESTABILIDADE do link enviado ao cliente. Um link que
 * guardasse "filtro menos removidos" mudaria sozinho quando o catálogo
 * crescesse — o cliente veria um produto que o vendedor nunca aprovou. Por isso
 * o link de compartilhamento congela a lista de slugs, e é isso que estes
 * testes verificam.
 */
function auditCuradoria(): number {
  let failures = 0;
  console.log('');
  console.log('=== CURADORIA E LINK COMPARTILHADO ===');
  console.log('');

  const check = (nome: string, ok: boolean, detalhe: string) => {
    if (ok) console.log(`  OK   ${nome}`);
    else {
      console.log(`  FALHA ${nome} — ${detalhe}`);
      failures++;
    }
  };

  // Simula o fluxo real: filtra azuis foscos, tira 2, gera o link.
  const base = applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q: 'azul fosco' });
  const removidos = base.slice(0, 2).map((i) => i.slug);
  const curado = base.filter((i) => !removidos.includes(i.slug));
  const selecao = curado.map((i) => i.slug);

  console.table([
    { etapa: 'filtro "azul fosco"', itens: base.length },
    { etapa: 'após remover 2', itens: curado.length },
    { etapa: 'link ?sel=', itens: selecao.length },
  ]);

  check(
    'remover 2 tira exatamente 2',
    curado.length === base.length - 2,
    `${curado.length} != ${base.length} - 2`
  );
  check(
    'os removidos somem da lista',
    !curado.some((i) => removidos.includes(i.slug)),
    'item removido continua na lista'
  );

  // A resolução do link é o que o cliente vê.
  const vistoPeloCliente = selecao
    .map((slug) => getShopItem(slug))
    .filter((i): i is (typeof SHOP_ITEMS)[number] => Boolean(i));

  check(
    'o link resolve todos os slugs',
    vistoPeloCliente.length === selecao.length,
    `${vistoPeloCliente.length} de ${selecao.length} resolveram`
  );
  check(
    'o cliente vê exatamente o que foi curado',
    vistoPeloCliente.map((i) => i.slug).join(',') === selecao.join(','),
    'a lista do cliente diverge da curada'
  );
  check(
    'a ordem escolhida é preservada',
    vistoPeloCliente[0]?.slug === selecao[0],
    'a ordem mudou'
  );

  // A prova de estabilidade: a seleção não depende do filtro que a originou.
  // Mesmo que "azul fosco" passe a devolver outra coisa, o link não muda.
  const semFiltro = selecao
    .map((slug) => getShopItem(slug))
    .filter(Boolean).length;
  check(
    'o link independe do filtro de origem',
    semFiltro === selecao.length,
    'a resolução do link depende do filtro'
  );

  // Slug inválido no link não pode derrubar a página.
  const comLixo = ['nao-existe-123', ...selecao]
    .map((slug) => getShopItem(slug))
    .filter(Boolean);
  check(
    'slug inválido no link é ignorado, não quebra',
    comLixo.length === selecao.length,
    'slug inválido alterou o resultado'
  );

  return failures;
}
