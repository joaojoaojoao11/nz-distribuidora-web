// Cliente da rota /api/nz/incentivos: carteira, super cupom, afiliados e
// cupons (Fase 2 do plano de indicação, 21/10/2026). Tudo que mexe em
// dinheiro ou em dado de terceiro passa por aqui, nunca pela tabela.

import { supabase } from '../supabase';

export class IncentivoError extends Error {
  codigo: string;
  status: number;
  constructor(codigo: string, status: number, mensagem?: string) {
    super(mensagem || codigo);
    this.codigo = codigo;
    this.status = status;
  }
}

export async function chamarIncentivos<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch('/api/nz/incentivos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(corpo),
  });
  const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new IncentivoError(String(json.error ?? json.motivo ?? 'falhou'), r.status, typeof json.message === 'string' ? json.message : typeof json.motivo === 'string' ? json.motivo : undefined);
  return json as T;
}

export interface Saldo {
  disponivel: number;
  aLiberar: number;
  total: number;
}

export interface LinhaExtrato {
  id: number;
  tipo: string;
  rotulo: string;
  valor: number;
  status: 'a_liberar' | 'disponivel' | 'estornado' | 'expirado';
  libera_em: string | null;
  criado_em: string;
  periodo: string | null;
  percentual: number | null;
  indicado: string | null;
  obs: string | null;
}

export interface NivelInfo {
  id: number;
  ordem: number;
  nome: string;
  icone: string | null;
  criterio_tipo: 'indicados_12m' | 'faturamento_12m';
  criterio_valor: number;
  multiplicador: number;
}

export interface ConquistaInfo {
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  bonus_valor: number;
  obtida_em: string | null;
  vista_em: string | null;
}

export interface Momento {
  id: number;
  tipo: string;
  payload: Record<string, unknown>;
  criado_em: string;
  visto_em: string | null;
}

export interface MinhaCarteira {
  aprovado: boolean;
  saldo: Saldo;
  extrato: LinhaExtrato[];
  superCupom: { codigo: string; descontoPct: number; cashbackPct: number; usos: number; ativo: boolean } | null;
  afiliado: { codigo: string; status: 'pendente' | 'aprovado' | 'suspenso'; ativo: boolean; pctAtivacao: number; pctRecorrencia: number; descontoCupomPct: number; periodicidade: 'mensal' | 'quinzenal'; desde: string } | null;
  contagens: { cadastrados: number; aprovados: number; compraram: number; usaramSuperCupom: number };
  regras: { diasLiberacao: number; mesesValidade: number; saqueMinimo: number };
  gamificacao: {
    nivel: { publico: 'indicador' | 'afiliado'; atual: NivelInfo | null; proximo: NivelInfo | null; metrica: number; progressoPct: number; faltam: number; multiplicador: number };
    conquistas: ConquistaInfo[];
    momentos: Momento[];
    naoVistos: number;
  };
}

export const minhaCarteira = () => chamarIncentivos<MinhaCarteira>({ op: 'minha-carteira' });
export const trocarSuperCupom = (codigo: string) => chamarIncentivos<{ ok: boolean; motivo?: string; cupom?: { codigo: string } }>({ op: 'trocar-super-cupom', codigo });
export const quererSerAfiliado = (aceite: boolean) => chamarIncentivos<{ ok: boolean; codigo: string; status: string }>({ op: 'quero-ser-afiliado', aceite });
export const mudarMinhaPeriodicidade = (periodicidade: 'mensal' | 'quinzenal') => chamarIncentivos<{ ok: boolean }>({ op: 'minha-periodicidade', periodicidade });
export const marcarMomentosVistos = () => chamarIncentivos<{ ok: boolean }>({ op: 'marcar-vistos' });
export const resgatarPontosNaCarteira = (campanhaId: string) => chamarIncentivos<{ ok: true; valor: number; pontos: number; saldoPontos: number; saldoCarteira: Saldo }>({ op: 'resgatar-pontos', campanhaId });

export const MOMENTO_TEXTO: Record<string, (p: Record<string, unknown>) => string> = {
  indicado_cadastrou: () => 'Alguém se cadastrou com a sua indicação',
  conquista_devolvida: (p) => `Conquista "${String(p.nome ?? p.codigo ?? '')}" devolvida: o pedido que a gerou foi cancelado`,
  indicado_aprovado: () => 'Um indicado seu foi aprovado',
  indicado_comprou: (p) => `Um indicado comprou: ${BRL(Number(p.valor ?? 0))} a caminho da sua carteira`,
  cashback_liberado: (p) => `${BRL(Number(p.valor ?? 0))} liberados na sua carteira`,
  conquista: (p) => `Conquista nova: ${String(p.nome ?? '')}${Number(p.bonus ?? 0) > 0 ? ` (+${BRL(Number(p.bonus))})` : ''}`,
  afiliado_aprovado: () => 'Você foi aprovado como afiliado NZ',
};

export function textoDoMomento(m: Momento): string {
  const f = MOMENTO_TEXTO[m.tipo];
  return f ? f(m.payload ?? {}) : m.tipo;
}

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const STATUS_MOVIMENTO: Record<string, string> = {
  a_liberar: 'a liberar',
  disponivel: 'disponível',
  estornado: 'estornado',
  expirado: 'expirado',
};

// ------------------------------------------------------------------ admin
export interface ConfigIncentivos {
  pctDescontoIndicado: number;
  pctCashbackIndicador: number;
  pctAtivacaoAfiliado: number;
  pctRecorrenciaAfiliado: number;
  descontoCupomAfiliadoPct: number;
  diasLiberacao: number;
  mesesValidade: number;
  saqueMinimo: number;
  saqueHoraCorte: string;
  impostoPct: number | null;
  comissaoEmbutidaPct: number | null;
  travaAtiva: boolean;
  linhasExcluidas: string[];
  periodicidadePadrao: 'mensal' | 'quinzenal';
  superCupomAtivo: boolean;
  tetoMensalPremios: number | null;
  diasAtribuicao: number;
  estornarConquistaCancelamento: boolean;
}

export interface AfiliadoLista {
  user_id: string;
  codigo: string;
  status: 'pendente' | 'aprovado' | 'suspenso';
  ativo: boolean;
  percentual: number | null;
  pct_ativacao: number | null;
  pct_recorrencia: number | null;
  desconto_cupom_pct: number | null;
  periodicidade: 'mensal' | 'quinzenal';
  criado_em: string;
  aprovado_em: string | null;
  nome: string | null;
  empresa: string | null;
  email: string | null;
  tipo: string | null;
  filiados: number;
  filiadosAprovados: number;
  compraram: number;
  comissaoTotal: number;
  comissaoMes: number;
  saldoDisponivel: number;
  saldoALiberar: number;
}

export const lerConfigIncentivos = () => chamarIncentivos<{ config: ConfigIncentivos }>({ op: 'config-ler' });
export const salvarConfigIncentivos = (config: Partial<ConfigIncentivos>) => chamarIncentivos<{ ok: boolean; config: ConfigIncentivos }>({ op: 'config-salvar', config });

/** Motivo do `validar` (api/nz/afiliado) em texto para a pessoa. */
export function textoMotivoCupom(motivo?: string | null): string {
  switch (motivo) {
    case 'ainda-nao-vale':
      return 'Este cupom ainda não começou a valer.';
    case 'expirado':
      return 'Este cupom venceu.';
    case 'esgotado':
      return 'Este cupom esgotou.';
    case 'login':
      return 'Entre na sua conta para usar este cupom.';
    case 'nominal':
      return 'Este cupom é de outra pessoa.';
    case 'proprio':
      return 'Você não pode usar o seu próprio cupom.';
    case 'so-conta-nova':
      return 'Este cupom vale só para a primeira compra.';
    case 'ja-usou':
      return 'Você já usou este cupom.';
    case 'afiliado-inativo':
      return 'Este cupom não está ativo.';
    default:
      return 'Cupom inválido.';
  }
}

/** Valida um cupom com a sessão atual (as regras "próprio", "só conta nova" e "já usou" precisam da pessoa). */
export async function validarCupomNaApi(codigo: string): Promise<{ valido: boolean; tipo?: string; descontoPct?: number | null; descontoValor?: number | null; motivo?: string; precisaLogin?: boolean }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch('/api/nz/afiliado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ op: 'validar', codigo }),
  });
  return r.ok ? ((await r.json()) as { valido: boolean }) : { valido: false };
}
export const listarAfiliados = () => chamarIncentivos<{ afiliados: AfiliadoLista[]; config: ConfigIncentivos }>({ op: 'afiliados-listar' });
export const verAfiliado = (userId: string) => chamarIncentivos<Record<string, unknown>>({ op: 'afiliado-ver', userId });
export const salvarAfiliado = (dados: Record<string, unknown>) => chamarIncentivos<{ ok: boolean }>({ op: 'afiliado-salvar', ...dados });
export const ajustarCarteira = (userId: string, valor: number, obs: string) => chamarIncentivos<{ ok: boolean; saldo: Saldo }>({ op: 'afiliado-ajuste', userId, valor, obs });
export const listarCupons = (tipos?: string[]) => chamarIncentivos<{ cupons: Record<string, unknown>[]; config: ConfigIncentivos }>({ op: 'cupons-listar', tipos });
export const salvarCupom = (dados: Record<string, unknown>) => chamarIncentivos<{ ok: boolean; codigo: string }>({ op: 'cupom-salvar', ...dados });
export const ativarCupom = (codigo: string, ativo: boolean) => chamarIncentivos<{ ok: boolean }>({ op: 'cupom-ativar', codigo, ativo });
export const listarSuperCupons = () => chamarIncentivos<{ superCupons: Record<string, unknown>[]; config: ConfigIncentivos; totalCupons: number; totalUsos: number }>({ op: 'super-cupons-listar' });
