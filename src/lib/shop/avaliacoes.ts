// Cliente de /api/nz/avaliacoes.
//
// Nenhuma regra mora aqui: quem decide se a pessoa comprou, quanto vale a
// avaliação em pontos e se o resgate pode sair é o servidor. Este arquivo só
// fala HTTP e guarda tipos.

import { supabase } from '../supabase';

export interface ResumoAvaliacoes {
  produto_slug: string;
  total: number;
  media: number;
  n5: number;
  n4: number;
  n3: number;
  n2: number;
  n1: number;
}

export interface AvaliacaoPublica {
  id: string;
  produto_slug: string;
  nota: number;
  titulo: string | null;
  texto: string;
  foto_url: string | null;
  autor_nome: string;
  autor_cidade: string | null;
  aplicador: boolean;
  incentivada: boolean;
  resposta_loja: string | null;
  resposta_em: string | null;
  criado_em: string;
}

export interface MinhaAvaliacao {
  id: string;
  produto_slug: string;
  nota: number;
  titulo: string | null;
  texto: string;
  foto_url: string | null;
  status: 'pendente' | 'aprovada' | 'recusada';
  motivo_recusa: string | null;
  resposta_loja: string | null;
  criado_em: string;
}

export interface ProdutoAvaliavel {
  slug: string;
  nome: string;
  imagem: string | null;
  origem: 'site' | 'nzerp';
  quando: string | null;
  pontos: number;
}

export interface RegrasDePonto {
  base: number;
  foto: number;
  textoLongo: number;
  minimoTextoLongo: number;
}

export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  pontos: number;
  valor: number;
  validade_dias: number;
  limite_por_usuario: number | null;
  limite_total: number | null;
  resgatados: number;
}

export interface MovimentoDePonto {
  id: number;
  pontos: number;
  motivo: string;
  descricao: string | null;
  criado_em: string;
}

export interface CupomDoCliente {
  codigo: string;
  desconto_valor: number | null;
  valido_ate: string | null;
  usos: number;
  limite_usos: number | null;
  ativo: boolean;
}

export class AvaliacaoError extends Error {
  // Campos declarados um a um: o projeto compila com `erasableSyntaxOnly`, que
  // proíbe propriedade de parâmetro no construtor.
  codigo: string;
  status: number;

  constructor(codigo: string, status: number, mensagem?: string) {
    super(mensagem || codigo);
    this.codigo = codigo;
    this.status = status;
  }
}

async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch('/api/nz/avaliacoes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(corpo),
  });
  const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new AvaliacaoError(String(json.error ?? 'falhou'), r.status, typeof json.message === 'string' ? json.message : undefined);
  return json as T;
}

// ------------------------------------------------------------------ público
export const listarAvaliacoes = (slug: string) => chamar<{ avaliacoes: AvaliacaoPublica[]; resumo: ResumoAvaliacoes | null }>({ op: 'listar', slug });

export const resumoDeVarios = (slugs: string[]) => chamar<{ resumos: Record<string, { total: number; media: number }> }>({ op: 'resumo', slugs });

// ------------------------------------------------------------------- logado
export const possoAvaliar = () => chamar<{ produtos: ProdutoAvaliavel[]; regras: RegrasDePonto }>({ op: 'posso-avaliar' });

/**
 * A pagina do produto precisa saber se ESTE visitante pode avaliar ESTE
 * produto. A resposta vale para o catalogo inteiro, entao e uma chamada so por
 * sessao — sem isto, abrir dez produtos seriam dez consultas ao ERP.
 *
 * Visitante deslogado nem chega a perguntar.
 */
let cacheAvaliaveis: Promise<Set<string>> | null = null;

export function esquecerAvaliaveis(): void {
  cacheAvaliaveis = null;
}

export async function possoAvaliarSlug(slug: string): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  cacheAvaliaveis ??= possoAvaliar()
    .then((r) => new Set(r.produtos.map((p) => p.slug)))
    .catch(() => new Set<string>());
  return (await cacheAvaliaveis).has(slug);
}

export const minhasAvaliacoes = () => chamar<{ avaliacoes: MinhaAvaliacao[] }>({ op: 'minhas' });

export const enviarAvaliacao = (a: { slug: string; nota: number; titulo?: string; texto: string; fotoUrl?: string }) =>
  chamar<{ ok: true; id: string; pontosPrevistos: number }>({ op: 'enviar', ...a });

export const meusPontos = () =>
  chamar<{ saldo: number; extrato: MovimentoDePonto[]; campanhas: Campanha[]; cupons: CupomDoCliente[]; regras: RegrasDePonto }>({ op: 'pontos' });

export const resgatarCampanha = (campanhaId: string) =>
  chamar<{ ok: true; cupom: string; valor: number; pontos: number; validoAte: string; saldo: number }>({ op: 'resgatar', campanhaId });

// -------------------------------------------------------------------- admin
export const filaDeModeracao = (status = 'pendente') =>
  chamar<{ avaliacoes: (AvaliacaoPublica & { status: string; motivo_recusa: string | null })[]; pendentes: number }>({ op: 'fila', status });

export const moderar = (id: string, aprovar: boolean, motivo?: string) =>
  chamar<{ ok: true; status: string; pontosCreditados: number }>({ op: 'moderar', id, aprovar, motivo });

export const responderAvaliacao = (id: string, resposta: string) => chamar<{ ok: true }>({ op: 'responder', id, resposta });

export const listarCampanhasAdmin = () => chamar<{ campanhas: (Campanha & { ativo: boolean })[] }>({ op: 'campanhas-admin', acao: 'listar' });

export const salvarCampanha = (campanha: Record<string, unknown>) => chamar<{ ok: true }>({ op: 'campanhas-admin', acao: 'salvar', campanha });

/** Texto de erro pronto para a tela, em português de cliente. */
export function textoDoErro(e: unknown): string {
  const codigo = e instanceof AvaliacaoError ? e.codigo : '';
  const mapa: Record<string, string> = {
    'login-necessario': 'Entre na sua conta para avaliar.',
    'nao-comprou': 'Só quem comprou este produto pode avaliá-lo.',
    'ja-avaliou': 'Você já avaliou este produto.',
    'texto-curto': 'Escreva um pouco mais — pelo menos 20 caracteres.',
    'nota-invalida': 'Escolha uma nota de 1 a 5.',
    'pontos-insuficientes': 'Você ainda não tem pontos suficientes para este resgate.',
    'campanha-inativa': 'Esta campanha não está mais disponível.',
    'limite-do-usuario': 'Você já resgatou esta campanha o número máximo de vezes.',
    'limite-da-campanha': 'Esta campanha esgotou.',
  };
  return mapa[codigo] ?? (e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
}
