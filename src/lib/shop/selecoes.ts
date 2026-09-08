// Seleções no cliente: falar com /api/nz/selecoes e nada mais.
//
// A conta do acréscimo NÃO mora aqui — mora no servidor. Este módulo pede,
// recebe e repassa. Se algum dia aparecer um `* (1 + pct/100)` neste arquivo,
// é bug: o percentual nunca chega ao navegador de quem abre o link.
//
// As regras puras (validação, validade, texto de "expira em") ficam em
// ./selecoes/regras.ts, que o autoteste importa sem subir React nem rede.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface SelecaoPublica {
  token: string;
  titulo: string | null;
  slugs: string[];
  mostrarPreco: boolean;
  expiraEm: string;
  expirada: false;
}

export interface SelecaoExpirada {
  token: string;
  titulo: string | null;
  expiraEm?: string;
  expirada: true;
}

export interface SelecaoCriada {
  id: string;
  token: string;
  url: string;
  expiraEm: string;
  itens: number;
  /** Slugs que não existem mais no cadastro e ficaram de fora. */
  ignorados: string[];
}

/** Linha como ela vem do banco em /painel/selecoes (RLS: dono ou equipe). */
export interface SelecaoDoPainel {
  id: string;
  token: string;
  titulo: string | null;
  slugs: string[];
  mostrar_preco: boolean;
  acrescimo_pct: number;
  expira_em: string;
  criado_em: string;
  renovada_em: string | null;
  encerrada_em: string | null;
  visitas: number;
  ultima_visita_em: string | null;
}

async function chamar<T>(corpo: Record<string, unknown>, comSessao = true): Promise<T> {
  const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
  if (comSessao) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) cabecalhos.Authorization = `Bearer ${token}`;
  }
  const res = await fetch('/api/nz/selecoes', { method: 'POST', headers: cabecalhos, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const erro = new Error(String(json.error ?? res.status));
    Object.assign(erro, { dados: json, status: res.status });
    throw erro;
  }
  return json as T;
}

export function textoDoErroSelecao(e: unknown): string {
  const codigo = e instanceof Error ? e.message : String(e);
  const dados = (e as { dados?: Record<string, unknown> } | undefined)?.dados;
  switch (codigo) {
    case 'so-admin':
      return 'Só a equipe NZ pode montar seleção.';
    case 'sem-itens':
      return 'Escolha ao menos um produto.';
    case 'itens-demais':
      return `Reduza para ${dados?.max ?? 300} itens ou menos.`;
    case 'acrescimo-invalido':
      return 'O acréscimo vai de 0 a 100%.';
    case 'nenhum-slug-valido':
      return 'Nenhum destes produtos existe mais no cadastro.';
    case 'nao-encontrada':
      return 'Esta seleção não existe mais.';
    default:
      return 'Não consegui falar com o servidor. Tente de novo.';
  }
}

export const criarSelecao = (cfg: {
  slugs: string[];
  titulo?: string;
  mostrarPreco: boolean;
  acrescimoPct: number;
}) => chamar<SelecaoCriada>({ op: 'criar', ...cfg });

export const renovarSelecao = (id: string) => chamar<{ expiraEm: string; url: string }>({ op: 'renovar', id });

export const encerrarSelecao = (id: string) => chamar<{ ok: true }>({ op: 'encerrar', id });

/** Link absoluto da seleção. Usa a origem da janela para funcionar em preview. */
export const urlDaSelecao = (token: string) => `${window.location.origin}/loja/s/${token}`;

/** Mensagem pronta de WhatsApp — com o link, que é o ponto da coisa. */
export function whatsappDaSelecao(token: string, titulo?: string | null, produto?: string): string {
  const texto = produto
    ? `Olá! Sobre o ${produto} desta seleção da NZ: ${urlDaSelecao(token)}`
    : `Olá! Segue a seleção da NZ${titulo ? ` — ${titulo}` : ''}: ${urlDaSelecao(token)}`;
  return `https://wa.me/5511920707565?text=${encodeURIComponent(texto)}`;
}

export type EstadoSelecao = 'carregando' | 'ok' | 'expirada' | 'inexistente' | 'erro';

/**
 * Lê a seleção de `/loja/s/:token`. Sem token, devolve 'inexistente' sem bater
 * na rede — é o caso da `/loja` normal, que usa o mesmo componente.
 */
export function useSelecaoRemota(token: string | undefined): {
  estado: EstadoSelecao;
  dados: SelecaoPublica | null;
  titulo: string | null;
} {
  const [resultado, setResultado] = useState<{
    token: string | undefined;
    estado: EstadoSelecao;
    dados: SelecaoPublica | null;
    titulo: string | null;
  }>({ token, estado: token ? 'carregando' : 'inexistente', dados: null, titulo: null });

  // Trocou de token (ou saiu da seleção): o resultado antigo não vale mais.
  // Ajustar durante o render, e não num efeito, evita um quadro mostrando a
  // seleção anterior — é o padrão que o React recomenda para estado derivado.
  if (resultado.token !== token) {
    setResultado({ token, estado: token ? 'carregando' : 'inexistente', dados: null, titulo: null });
  }

  const carregar = useCallback(async (t: string) => {
    try {
      // Vai com a sessão quando existe: é assim que o servidor reconhece o
      // admin conferindo o próprio link e NÃO conta a visita como do cliente.
      const r = await chamar<SelecaoPublica | SelecaoExpirada>({ op: 'abrir', token: t }, true);
      setResultado(
        r.expirada
          ? { token: t, estado: 'expirada', dados: null, titulo: r.titulo ?? null }
          : { token: t, estado: 'ok', dados: r, titulo: r.titulo ?? null }
      );
    } catch (e) {
      const estado: EstadoSelecao = (e as Error).message === 'nao-encontrada' ? 'inexistente' : 'erro';
      setResultado({ token: t, estado, dados: null, titulo: null });
    }
  }, []);

  useEffect(() => {
    // Buscar no servidor é efeito de verdade, e o estado só muda DEPOIS do
    // await — a regra não distingue isso de um setState síncrono. Mesmo padrão
    // do resto do projeto (PainelLayout, AdminHome).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) void carregar(token);
  }, [token, carregar]);

  return { estado: resultado.estado, dados: resultado.dados, titulo: resultado.titulo };
}
