// Diagnóstico da classificação de cor — por que uma busca por "vermelho"
// devolve um item rosa.
//
// A busca em si não erra: `applyFilters` transforma "vermelho" num filtro
// exato de família e nenhum resultado vem de fora dela. O que produz o item
// errado na tela é a CLASSIFICAÇÃO do produto: ele carrega uma segunda família
// que contradiz o próprio nome ("LUXURY BRITISH PINK" classificado como
// vermelho+rosa porque o hex #ffb6c1 cai na fronteira do vermelho).
//
// Este relatório é a régua para medir antes e depois de mexer no resolvedor:
// para cada cor, quantos itens entram só pela família secundária, e quais.
//
// Uso: npm run shop:cores

import { SHOP_ITEMS } from './catalog';
import { applyFilters, EMPTY_FILTERS } from './search/match';
import { COLOR_PARENT, matchLexicon } from './color/lexicon';
import { normalize } from './types';
import type { ShopItem } from './types';
import type { ColorFamilyId } from './color/lexicon';

const CORES: ColorFamilyId[] = [
  'vermelho',
  'azul',
  'verde',
  'amarelo',
  'laranja',
  'rosa',
  'roxo',
  'preto',
  'branco',
  'cinza',
  'dourado',
  'bege',
  'marrom',
];

/** Famílias que o NOME declara: tokens não-fracos, suas secundárias de léxico
 *  e os pais das subfamílias que eles trazem. */
export function familiasDoNome(item: ShopItem, incluirFracos = false): ColorFamilyId[] {
  const hits = matchLexicon(normalize(`${item.name} ${item.code ?? ''}`)).filter(
    (h) => incluirFracos || !h.weak
  );
  const fams = hits.flatMap((h) => [
    h.family,
    ...(h.secondary ? [h.secondary] : []),
    ...(h.subfamily ? [COLOR_PARENT[h.subfamily]] : []),
  ]);
  return [...new Set(fams)];
}

/**
 * Um item com 2+ famílias é LEGÍTIMO quando a segunda família é afirmação, e
 * não subproduto de arredondamento de matiz. Três casos:
 *
 *  1. o fabricante declarou a família (a M7 classifica o próprio "Ivory" como
 *     brown — é a palavra dele, não nossa);
 *  2. todas as famílias saem do NOME, incluindo as secundárias do léxico
 *     ('Orange Red', 'Aqua Jewel', 'Cimento Texturizado Oliva');
 *  3. o filme é CAMALEÃO — muda de cor com o ângulo, então nome e hex são
 *     ambos verdade.
 *
 * Tokens fracos contam AQUI (mas não como autoridade): 'Diamond Silver' com
 * hex cinza vira prata+cinza, e as duas são verdade sobre um filme prateado.
 *
 * Tudo o mais é suspeito: veio do hex contradizendo o nome.
 */
export function duploLegitimo(item: ShopItem): boolean {
  if (item.colorConfidence === 'declarada') return true;
  if (item.finishes.includes('camaleao')) return true;

  // A primária vem da fonte com autoridade (o nome quando há nome, o hex
  // quando não há) e é vigiada pelo check "NOME MANDA". Aqui a pergunta é
  // outra: as famílias EXTRA se explicam pelo nome, ou apareceram do nada?
  const doNome = familiasDoNome(item, true);
  const extras = item.colorFamilies.slice(1);
  return extras.every(
    (f) => doNome.includes(f) || f === 'multicolor' || f === 'transparente'
  );
}

function linha(i: ShopItem): string {
  return (
    '   ' +
    (i.code ?? '').padEnd(11).slice(0, 11) +
    ' ' +
    i.name.padEnd(34).slice(0, 34) +
    ' ' +
    i.colorFamilies.join('+').padEnd(26).slice(0, 26) +
    ' ' +
    String(i.colorConfidence ?? '-').padEnd(9) +
    ' ' +
    (i.hex ?? '-').padEnd(8) +
    ' ' +
    i.source
  );
}

export function runColorDiag(): number {
  console.log('=== BUSCA POR COR: quem entra pela família SECUNDÁRIA ===');
  console.log('(a busca filtra por família exata; quem aparece aqui entra por classificação, não por erro de busca)\n');

  for (const cor of CORES) {
    const res = applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q: cor });
    const fora = res.filter((i) => !i.colorFamilies.includes(cor));
    const secundarios = res.filter(
      (i) => i.colorFamilies.includes(cor) && i.colorFamilies[0] !== cor
    );
    const suspeitos = secundarios.filter((i) => !duploLegitimo(i));

    console.log(
      `"${cor}" → ${res.length} resultados · ${fora.length} fora da família · ` +
        `${secundarios.length} por família secundária (${suspeitos.length} suspeitos)`
    );
    for (const i of suspeitos) console.log(linha(i));
  }

  // ------------------------------------------------- itens com 2+ famílias
  const multi = SHOP_ITEMS.filter((i) => i.colorFamilies.length > 1);
  const suspeitos = multi.filter((i) => !duploLegitimo(i));

  console.log(`\n=== ITENS COM 2+ FAMÍLIAS: ${multi.length} de ${SHOP_ITEMS.length} ===`);
  console.log(`  legítimos (turquesa, orange red, prata/cinza…): ${multi.length - suspeitos.length}`);
  console.log(`  SUSPEITOS: ${suspeitos.length}\n`);
  for (const i of suspeitos) console.log(linha(i));

  // ------------------------------------- o nome manda: violações explícitas
  // Se o fabricante escreveu a cor no nome, o hex aproximado não pode
  // adicionar outra família. É a regra que este relatório existe para vigiar.
  const violacoes = SHOP_ITEMS.filter((i) => {
    const doNome = familiasDoNome(i);
    if (!doNome.length) return false;
    if (duploLegitimo(i)) return false;
    return i.colorFamilies.some(
      (f) => !doNome.includes(f) && f !== 'multicolor' && f !== 'transparente'
    );
  });

  console.log(`\n=== NOME MANDA: ${violacoes.length} item(ns) com família que o nome não declara ===`);
  for (const i of violacoes) {
    console.log(linha(i) + '   nome→[' + familiasDoNome(i).join('+') + ']');
  }

  console.log(
    `\nRESUMO: ${suspeitos.length} duplos suspeitos · ${violacoes.length} violações de "nome manda"`
  );
  return suspeitos.length + violacoes.length;
}
