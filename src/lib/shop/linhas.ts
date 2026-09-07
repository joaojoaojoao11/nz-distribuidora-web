// Ficha técnica em camadas: o que é da COR, o que é do ROLO e o que é da LINHA.
//
// Antes, `produtos.ficha` carregava as três coisas misturadas. O resultado
// medido em 07/09/2026: a Etherna tinha 159 produtos com ficha e 4 fichas
// DISTINTAS — a mesma ficha da linha, copiada 159 vezes e já divergida.
//
// As quatro camadas, do mais específico ao mais geral:
//
//   A. variante  produtos.ficha        código, hex, RGB, CMYK, Pantone…
//   D. rolo      erp_produtos          largura e metragem, nunca digitadas
//   B. família   linha_familias.ficha  MPI ≠ SLP; Luxury ≠ Core
//   C. linha     linhas.ficha          o que o site-mãe publica
//
// Precedência A > D > B > C, por RÓTULO: se a variante já disse "Acabamento",
// a linha não repete. É o que permite a Etherna manter "Espessura frontal: 140
// micras" em 35 padrões enquanto a linha afirma o adesivo e o liner para os
// 168 — sem que uma coisa apague a outra.

import { normalize, type ShopItem, type ShopSpec } from './types';

/** Espelho 1:1 da view `loja_linhas` (migrations/2026-09-07_ficha_por_linha.sql). */
export interface LojaLinhaRow {
  linha_key: string;
  /** `null` na linha; preenchido na sub-família. */
  familia_key: string | null;
  label: string;
  marca_key: string | null;
  ficha: ShopSpec[] | null;
  chamada: string | null;
  descricao: string | null;
  texto_venda: string | null;
  aplicacoes: string[] | null;
  cuidados: string | null;
  tds_url: string | null;
  tds_titulo: string | null;
  fonte_url: string | null;
  conferido_em: string | null;
  /** Prefixos de SKU desta família. */
  prefixos: string[] | null;
  /** Prefixos do NOME. Em avery o SKU não discrimina: AAT cobre MPI, SLP e SW900. */
  nome_prefixos: string[] | null;
  /** Página de apresentação da linha no próprio site ('/ppf/luxury-gloss'). */
  pagina_url: string | null;
  /** Chave no gerador de portfólio NZPPF, quando a linha tem catálogo gerado. */
  catalogo_slug: string | null;
  /** PDF pronto e hospedado, para catálogo que não geramos. */
  catalogo_url: string | null;
  /** Fotos da linha: a primeira é a capa, as demais são acabamentos. */
  galeria: FotoDaLinha[] | null;
  ordem: number | null;
  atualizado_em: string | null;
}

export interface FotoDaLinha {
  url: string;
  titulo: string | null;
  sub: string | null;
}

/**
 * Marcas fabricadas para a NZ. Só elas ganham o bloco de linha na página do
 * produto — nas outras, o material de apoio é do fabricante e mora no site
 * dele. A lista é curta e explícita de propósito: é uma afirmação sobre o
 * negócio, não algo para inferir de um prefixo.
 */
const MARCAS_PROPRIAS = new Set(['nzppf', 'nzwrap']);

export interface FichaDoProduto {
  /**
   * Há alguma coisa para mostrar no bloco de ficha. Separado do resto porque
   * `descricao` é usada em outro lugar da página (o parágrafo ao lado da
   * foto): um produto pode não ter ficha nenhuma e ainda assim herdar o texto
   * da linha. Antes isto era um retorno `null`, e o texto ia junto com a ficha.
   */
  temFicha: boolean;
  /** Camadas A + D: o que vale só para este item. */
  variante: ShopSpec[];
  /** Camadas B + C: o que vale para a linha inteira, já sem rótulo repetido. */
  linha: ShopSpec[];
  /** "NZPPF Luxury Gloss" ou "Etherna Decor" — o que a ficha da linha cobre. */
  linhaLabel: string | null;
  descricao: string | null;
  textoVenda: string | null;
  aplicacoes: string[];
  cuidados: string | null;
  tds: { url: string; titulo: string } | null;
  fonteUrl: string | null;
  conferidoEm: string | null;
  /** Materiais da linha. Ver BlocoDaLinha.tsx. */
  paginaUrl: string | null;
  catalogoSlug: string | null;
  catalogoUrl: string | null;
  galeria: FotoDaLinha[];
  marcaPropria: boolean;
}

/** Índice por linha_key, com a linha e as famílias dela juntas. */
export interface IndiceDeLinhas {
  porLinha: ReadonlyMap<string, LojaLinhaRow>;
  familiasPorLinha: ReadonlyMap<string, LojaLinhaRow[]>;
}

export const INDICE_VAZIO: IndiceDeLinhas = { porLinha: new Map(), familiasPorLinha: new Map() };

export function indexarLinhas(linhas: LojaLinhaRow[]): IndiceDeLinhas {
  const porLinha = new Map<string, LojaLinhaRow>();
  const familiasPorLinha = new Map<string, LojaLinhaRow[]>();
  for (const l of linhas) {
    if (l.familia_key == null) {
      porLinha.set(l.linha_key, l);
    } else {
      const lista = familiasPorLinha.get(l.linha_key);
      if (lista) lista.push(l);
      else familiasPorLinha.set(l.linha_key, [l]);
    }
  }
  return { porLinha, familiasPorLinha };
}

/**
 * Qual sub-família cobre este item.
 *
 * Casa por prefixo de SKU OU por prefixo de nome, e o prefixo MAIS LONGO ganha
 * — 'SPWECH' (cromado) precisa vencer 'SPWE' (a linha toda). Empate não existe
 * porque a comparação é pelo tamanho do prefixo que casou, não pela ordem da
 * lista.
 */
export function familiaDoItem(item: ShopItem, indice: IndiceDeLinhas): LojaLinhaRow | null {
  const familias = indice.familiasPorLinha.get(item.lineKey);
  if (!familias || familias.length === 0) return null;

  const codigo = normalize(item.code ?? '');
  const nome = normalize(item.name);
  let melhor: LojaLinhaRow | null = null;
  let melhorTamanho = 0;

  for (const f of familias) {
    for (const p of f.prefixos ?? []) {
      const pref = normalize(p);
      if (pref && codigo.startsWith(pref) && pref.length > melhorTamanho) {
        melhor = f;
        melhorTamanho = pref.length;
      }
    }
    for (const p of f.nome_prefixos ?? []) {
      const pref = normalize(p);
      if (pref && nome.startsWith(pref) && pref.length > melhorTamanho) {
        melhor = f;
        melhorTamanho = pref.length;
      }
    }
  }
  return melhor;
}

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/**
 * Camada D — o que vem do ERP e nunca deve ser digitado.
 *
 * "Largura do rolo", e não "Largura", porque a ficha da cor pode trazer
 * "Larguras: até 1.220 mm" (o que existe naquela cor) e as duas convivem na
 * mesma lista. Sem o rótulo distinto, viram duas linhas que parecem se
 * contradizer. Pela mesma razão, nenhuma ficha de LINHA repete dimensão de
 * rolo: quem sabe a medida real do que está sendo vendido é o ERP.
 *
 * A armadilha aqui é real: quando `unidade` é 'M2', o campo `metragem_padrao`
 * guarda ÁREA, não comprimento. São 64 SKUs com 1,52 × 22,86 M2, e 22,86 é m²
 * (1,524 × 15). Rotular isso como "metragem do rolo: 22,86 m" publicaria um
 * número errado em 174 produtos.
 */
export function fichaDoRolo(item: ShopItem): ShopSpec[] {
  const linhas: ShopSpec[] = [];
  if (item.larguraM && item.larguraM > 0) {
    linhas.push({ label: 'Largura do rolo', value: `${nf.format(item.larguraM)} m` });
  }
  if (item.metragemPadrao && item.metragemPadrao > 0) {
    const areaM2 = (item.unidadeVenda ?? '').toUpperCase() === 'M2';
    linhas.push(
      areaM2
        ? { label: 'Área do rolo', value: `${nf.format(item.metragemPadrao)} m²` }
        : { label: 'Metragem do rolo', value: `${nf.format(item.metragemPadrao)} m` }
    );
  }
  return linhas;
}

/** Junta duas listas descartando rótulo já usado. O primeiro a chegar manda. */
function semRepetir(destino: ShopSpec[], usados: Set<string>, novas: ShopSpec[]): void {
  for (const s of novas) {
    const chave = normalize(s.label);
    if (!chave || usados.has(chave)) continue;
    usados.add(chave);
    destino.push(s);
  }
}

/**
 * Monta a ficha completa de um item. Sempre devolve o objeto; quem decide se
 * abre o bloco é `temFicha` — a página do produto depende disso para não abrir
 * uma seção vazia.
 */
export function fichaDoItem(item: ShopItem, indice: IndiceDeLinhas): FichaDoProduto {
  const linha = indice.porLinha.get(item.lineKey) ?? null;
  const familia = familiaDoItem(item, indice);

  const usados = new Set<string>();
  const variante: ShopSpec[] = [];
  semRepetir(variante, usados, item.specs);
  semRepetir(variante, usados, fichaDoRolo(item));

  const daLinha: ShopSpec[] = [];
  semRepetir(daLinha, usados, familia?.ficha ?? []);
  semRepetir(daLinha, usados, linha?.ficha ?? []);

  const fonte = familia ?? linha;
  const tdsUrl = familia?.tds_url ?? linha?.tds_url ?? null;
  const tdsTitulo = familia?.tds_titulo ?? linha?.tds_titulo ?? null;

  const ficha: FichaDoProduto = {
    temFicha: false,
    variante,
    linha: daLinha,
    linhaLabel: familia?.label ?? linha?.label ?? null,
    // A descrição da cor sempre ganha da descrição da linha: a Etherna tem 159
    // textos distintos, um por padrão, e seria uma perda trocá-los por um só.
    descricao: item.description ?? familia?.descricao ?? linha?.descricao ?? null,
    textoVenda: familia?.texto_venda ?? linha?.texto_venda ?? null,
    aplicacoes: familia?.aplicacoes?.length ? familia.aplicacoes : (linha?.aplicacoes ?? []),
    cuidados: familia?.cuidados ?? linha?.cuidados ?? null,
    tds: tdsUrl ? { url: tdsUrl, titulo: tdsTitulo ?? 'Ficha técnica do fabricante (PDF)' } : null,
    fonteUrl: fonte?.fonte_url ?? null,
    conferidoEm: fonte?.conferido_em ?? null,
    paginaUrl: familia?.pagina_url ?? linha?.pagina_url ?? null,
    catalogoSlug: familia?.catalogo_slug ?? linha?.catalogo_slug ?? null,
    catalogoUrl: familia?.catalogo_url ?? linha?.catalogo_url ?? null,
    galeria: (familia?.galeria?.length ? familia.galeria : linha?.galeria) ?? [],
    marcaPropria: MARCAS_PROPRIAS.has((familia?.marca_key ?? linha?.marca_key ?? '').toLowerCase()),
  };

  ficha.temFicha =
    ficha.variante.length > 0 ||
    ficha.linha.length > 0 ||
    Boolean(ficha.textoVenda) ||
    ficha.aplicacoes.length > 0 ||
    Boolean(ficha.tds);
  return ficha;
}
