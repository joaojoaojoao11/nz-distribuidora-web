// Regras puras das seleções — sem rede, sem React, sem Supabase.
//
// Ficam separadas para poder rodar no autoteste (`npm run selecoes:test`): são
// exatamente as contas que, se errarem, o cliente vê preço errado ou vê um link
// morto como se estivesse vivo. Testar isso no navegador é caro e o olho não
// pega arredondamento de centavo.
//
// O ACRÉSCIMO NUNCA É APLICADO NO NAVEGADOR. `aplicarAcrescimo` existe aqui só
// para o teste conferir a mesma conta do servidor (api/_lib/pedido/dinheiro.ts).
// A tela desenha o número que a API mandou.

/**
 * Teto de itens numa seleção. Era 120 porque a lista inteira ia na URL; com o
 * token, o limite passou a ser só o bom senso — 300 cabe uma linha inteira (a
 * Etherna tem 145 SKUs).
 */
export const MAX_SELECAO = 300;

/** Espelha o check do banco e o do servidor. */
export const MAX_ACRESCIMO_PCT = 100;
export const MAX_TITULO = 80;

export interface JanelaSelecao {
  expira_em: string;
  encerrada_em?: string | null;
}

/**
 * Ativa = dentro do prazo e não encerrada. Mesma pergunta que o servidor faz
 * (api/_lib/handlers/selecoes.ts). Divergir daqui significa a tela mostrar
 * "válida até" num link que a API já recusa.
 */
export function estaAtiva(s: JanelaSelecao | null | undefined, agora: number = Date.now()): boolean {
  if (!s || s.encerrada_em) return false;
  const t = new Date(s.expira_em).getTime();
  return Number.isFinite(t) && t > agora;
}

/** Duas casas, igual ao r2 do servidor. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** A conta do acréscimo. Só para o teste — a tela usa o valor da API. */
export function aplicarAcrescimo(valor: number | null | undefined, pct: number): number | null {
  const base = Number(valor);
  if (!(base > 0)) return null;
  const p = Number(pct);
  if (!Number.isFinite(p) || p <= 0) return r2(base);
  return r2(base * (1 + p / 100));
}

export interface ConfigSelecao {
  slugs: readonly string[];
  mostrarPreco: boolean;
  acrescimoPct: number;
  titulo?: string;
}

export interface ProblemaConfig {
  campo: 'slugs' | 'acrescimoPct' | 'titulo';
  mensagem: string;
}

/**
 * Valida o que a telinha vai mandar. Devolve a lista de problemas em vez de um
 * booleano: a tela precisa dizer QUAL campo está errado, e o teste precisa
 * distinguir "300 itens" de "acréscimo 150%".
 */
export function validarConfig(cfg: ConfigSelecao): ProblemaConfig[] {
  const problemas: ProblemaConfig[] = [];

  const unicos = new Set(cfg.slugs.map((s) => s.trim().toLowerCase()).filter(Boolean));
  if (unicos.size === 0) {
    problemas.push({ campo: 'slugs', mensagem: 'Escolha ao menos um produto.' });
  } else if (unicos.size > MAX_SELECAO) {
    problemas.push({
      campo: 'slugs',
      mensagem: `Reduza para ${MAX_SELECAO} itens ou menos (você tem ${unicos.size}).`,
    });
  }

  if (cfg.mostrarPreco) {
    const p = Number(cfg.acrescimoPct);
    if (!Number.isFinite(p) || p < 0 || p > MAX_ACRESCIMO_PCT) {
      problemas.push({ campo: 'acrescimoPct', mensagem: `O acréscimo vai de 0 a ${MAX_ACRESCIMO_PCT}%.` });
    }
  }

  if (cfg.titulo && cfg.titulo.length > MAX_TITULO) {
    problemas.push({ campo: 'titulo', mensagem: `O título cabe em ${MAX_TITULO} caracteres.` });
  }

  return problemas;
}

/** Slugs como o servidor vai guardá-los: sem repetição, minúsculos, na ordem curada. */
export function normalizarSlugs(slugs: readonly string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const bruto of slugs) {
    const s = bruto.trim().toLowerCase();
    if (!s || vistos.has(s)) continue;
    vistos.add(s);
    saida.push(s);
  }
  return saida;
}

/**
 * "Expira em 5 h" / "Expirou há 2 d". A frase é o que faz o vendedor decidir se
 * renova antes de mandar mensagem para o cliente.
 */
export function textoDeValidade(expiraEm: string, agora: number = Date.now()): string {
  const t = new Date(expiraEm).getTime();
  if (!Number.isFinite(t)) return '';
  const min = Math.round((t - agora) / 60000);

  if (min <= 0) {
    const passados = -min;
    if (passados < 60) return `expirou há ${passados} min`;
    if (passados < 60 * 24) return `expirou há ${Math.round(passados / 60)} h`;
    return `expirou há ${Math.round(passados / 1440)} d`;
  }
  if (min < 60) return `expira em ${min} min`;
  if (min < 60 * 24) return `expira em ${Math.round(min / 60)} h`;
  return `expira em ${Math.round(min / 1440)} d`;
}
