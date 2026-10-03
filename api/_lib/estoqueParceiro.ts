// Estoque do PARCEIRO — a terceira bolinha do admin, a vermelha.
//
// Verde e laranja contam o NOSSO pátio (espelho do ERP). A vermelha conta o
// que está no estoque da Inova, do Jardel: rolo aberto ou fechado que é DELE
// (não é consignado), mas que a NZ consegue vender fracionado. Pedido do João
// em 2026-10-03.
//
// A fonte é a tabela `estoque_parceiro` (migrations/2026-10-03_estoque_parceiro.sql),
// uma linha por PEDAÇO. Não vem do ERP: a lista chega em foto, de vez em quando,
// e a Cledna regrava a lista inteira. Por isso cada pedaço carrega `lista_de` —
// a tela apaga a bolinha quando a lista fica velha (ver PARCEIRO_DIAS_VALIDADE).
//
// SÓ ADMIN. A tabela não tem policy nenhuma: só a service role lê, e só os
// handlers de admin chamam isto.

import type { Db } from './papel.js';

export interface PecaParceiro {
  metros: number;
  status: 'aberto' | 'fechado';
}

export interface EstoqueParceiro {
  /** Quem tem o material, como o João fala: "Inova (Jardel)". */
  nome: string;
  /** Data da lista (AAAA-MM-DD). */
  listaDe: string;
  /** Do maior para o menor: é a ordem em que o vendedor procura. */
  pecas: PecaParceiro[];
}

interface Linha {
  parceiro: string;
  erp_sku: string;
  metros: number | string;
  status_rolo: 'aberto' | 'fechado';
  lista_de: string;
}

/** SKU → um registro por parceiro que tem aquele SKU. SKU sem nada não entra. */
export async function lerEstoqueParceiro(site: Db, skus: string[]): Promise<Map<string, EstoqueParceiro[]>> {
  const porSku = new Map<string, EstoqueParceiro[]>();
  if (!skus.length) return porSku;

  const { data, error } = await site
    .from('estoque_parceiro')
    .select('parceiro, erp_sku, metros, status_rolo, lista_de')
    .in('erp_sku', skus);
  // Falhar aqui não pode derrubar o preço nem o estoque do pátio: sem a lista,
  // a bolinha vermelha só não aparece.
  if (error || !data) return porSku;

  for (const l of data as Linha[]) {
    const lista = porSku.get(l.erp_sku) ?? [];
    let reg = lista.find((r) => r.nome === l.parceiro);
    if (!reg) {
      reg = { nome: l.parceiro, listaDe: l.lista_de, pecas: [] };
      lista.push(reg);
    }
    if (l.lista_de > reg.listaDe) reg.listaDe = l.lista_de;
    reg.pecas.push({ metros: Number(l.metros), status: l.status_rolo });
    porSku.set(l.erp_sku, lista);
  }
  for (const lista of porSku.values()) {
    for (const r of lista) r.pecas.sort((a, b) => b.metros - a.metros);
  }
  return porSku;
}

/** Todos os SKUs que o parceiro tem hoje — para o filtro do catálogo inteiro. */
export async function skusDoParceiro(site: Db): Promise<string[]> {
  const { data, error } = await site.from('estoque_parceiro').select('erp_sku');
  if (error || !data) return [];
  return [...new Set((data as { erp_sku: string }[]).map((l) => l.erp_sku))];
}
