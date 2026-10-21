// Super cupom (D22): o cupom pessoal que QUALQUER cliente aprovado tem. Quem
// compra com ele ganha desconto; quem o indicou ganha cashback; vale UMA
// compra por indicado, só para conta nova. Um por cliente, código fixo (o
// cliente pode trocar o código uma vez por dia, com validação).

import type { Db } from '../papel.js';
import type { ConfigIncentivos } from './config.js';

export const CODIGO_RE = /^[A-Z0-9]{4,12}$/;

// Lista curta; o objetivo é não deixar passar o óbvio, não censurar o mundo.
const BLOQUEADOS = ['PORRA', 'CARALHO', 'MERDA', 'PUTA', 'PUTO', 'BOSTA', 'VIADO', 'BUCETA', 'CACETE', 'FODA', 'FODER', 'CU', 'PENIS', 'PINTO', 'XOTA', 'NAZI', 'HITLER'];

export function codigoValido(codigo: string): { ok: boolean; motivo?: string } {
  const c = codigo.trim().toUpperCase();
  if (!CODIGO_RE.test(c)) return { ok: false, motivo: 'use de 4 a 12 letras ou números, sem espaço' };
  if (c.startsWith('NZ')) return { ok: false, motivo: 'códigos NZ são da loja' };
  if (BLOQUEADOS.some((p) => c.includes(p))) return { ok: false, motivo: 'esse código não pode' };
  return { ok: true };
}

/** Primeiro nome sem acento + 2 dígitos: JOAO27. */
export function sugerirCodigo(nome: string | null | undefined, semente = Math.random()): string {
  const primeiro = (nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, ' ')
    .trim()
    .split(/\s+/)[0] ?? '';
  const base = (primeiro || 'NZCLIENTE').slice(0, 8);
  const dig = String(Math.floor(semente * 90) + 10);
  const cand = `${base}${dig}`;
  return cand.startsWith('NZ') ? `CLIENTE${dig}` : cand;
}

export interface SuperCupom {
  codigo: string;
  desconto_pct: number | null;
  comissao_pct: number | null;
  usos: number;
  ativo: boolean;
  criado_em: string;
}

const COLUNAS = 'codigo, desconto_pct, comissao_pct, usos, ativo, criado_em';

export async function superCupomDe(site: Db, userId: string): Promise<SuperCupom | null> {
  const { data } = await site.from('cupons').select(COLUNAS).eq('tipo', 'super').eq('dono_user_id', userId).order('criado_em', { ascending: false }).limit(1).maybeSingle();
  return (data as SuperCupom | null) ?? null;
}

/**
 * Garante que o cliente tem o seu super cupom (cria se não tem). O desconto
 * e a comissão ficam NULOS no cupom de propósito: valem os da configuração na
 * hora da compra, então mudar a regra muda para todo mundo.
 */
export async function garantirSuperCupom(site: Db, userId: string, nome: string | null | undefined, cfg: ConfigIncentivos): Promise<SuperCupom | null> {
  const atual = await superCupomDe(site, userId);
  if (atual) return atual;
  if (!cfg.superCupomAtivo) return null;
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const codigo = sugerirCodigo(nome, (tentativa + 1) / 9 + Math.random() / 9);
    const { data, error } = await site
      .from('cupons')
      .insert({ codigo, tipo: 'super', dono_user_id: userId, ativo: true, so_conta_nova: true, usos_por_cliente: 1, desconto_pct: null, comissao_pct: null, descricao: 'Super cupom pessoal' })
      .select(COLUNAS)
      .single();
    if (!error && data) return data as SuperCupom;
    if (error && String(error.code) !== '23505') {
      console.warn('[super-cupom] não criou:', error.message);
      return null;
    }
  }
  return null;
}

/** Troca o código do super cupom (o antigo deixa de valer). */
export async function trocarCodigo(site: Db, userId: string, novo: string): Promise<{ ok: boolean; motivo?: string; cupom?: SuperCupom }> {
  const codigo = novo.trim().toUpperCase();
  const v = codigoValido(codigo);
  if (!v.ok) return { ok: false, motivo: v.motivo };
  const atual = await superCupomDe(site, userId);
  if (!atual) return { ok: false, motivo: 'você ainda não tem super cupom' };
  if (atual.codigo === codigo) return { ok: true, cupom: atual };
  // Trocar o código = um cupom novo (o código é a chave; os usos antigos
  // ficam no histórico do antigo, que é desativado).
  const { data, error } = await site
    .from('cupons')
    .insert({ codigo, tipo: 'super', dono_user_id: userId, ativo: true, so_conta_nova: true, usos_por_cliente: 1, descricao: 'Super cupom pessoal', atualizado_em: new Date().toISOString() })
    .select(COLUNAS)
    .single();
  if (error) return { ok: false, motivo: String(error.code) === '23505' ? 'esse código já é de outra pessoa' : error.message };
  await site.from('cupons').update({ ativo: false, atualizado_em: new Date().toISOString() }).eq('codigo', atual.codigo);
  return { ok: true, cupom: data as SuperCupom };
}
