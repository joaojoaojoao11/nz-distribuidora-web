// Cópia durável do carrinho, no Supabase (tabela `carrinhos`).
//
// Fica separada de `carrinho.ts` de propósito: aquele módulo é a fonte imediata
// e não pode depender da rede — somar um item tem que responder no toque, com
// ou sem internet. Este aqui só espelha, com atraso, e nunca bloqueia a tela.
//
// O que isso destrava: montar o carrinho no celular e fechar no computador; o
// cliente reencontrar o que deixou em /painel/carrinho; e a NZ enxergar
// carrinho abandonado, que antes simplesmente não existia como dado.
//
// Importado uma vez em App.tsx pelo efeito colateral — não exporta nada que a
// interface use.

import { supabase } from '../supabase';
import { assinarCarrinho, carrinhoEhDeUsuario, fundirNoCarrinho, itensDoCarrinho, type ItemCarrinho } from './carrinho';

/** Espera antes de gravar: mexer no contador dispara várias mudanças seguidas. */
const ATRASO_MS = 1500;

let usuario: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
/** Enquanto aplicamos o que veio do servidor, não devolvemos para ele. */
let aplicando = false;
/** Assinatura do que foi gravado por último — evita regravar o mesmo. */
let ultimoEnviado = '';

const assinatura = (lista: readonly ItemCarrinho[]) =>
  JSON.stringify(lista.map((i) => [i.slug, i.unidade, i.qtd]).sort());

async function puxar(uid: string) {
  const { data, error } = await supabase.from('carrinhos').select('itens').eq('user_id', uid).maybeSingle();
  if (error || !data) return;
  const doServidor = Array.isArray(data.itens) ? (data.itens as ItemCarrinho[]) : [];
  const bons = doServidor.filter((i) => i && typeof i.slug === 'string' && Number(i.qtd) > 0);
  if (!bons.length) return;
  aplicando = true;
  try {
    // Funde em vez de substituir: quem acabou de adicionar num aparelho não
    // pode perder o item porque o outro aparelho tinha uma lista antiga.
    fundirNoCarrinho(bons);
  } finally {
    aplicando = false;
  }
  ultimoEnviado = '';
  agendar();
}

async function empurrar(uid: string, lista: readonly ItemCarrinho[]) {
  const agora = assinatura(lista);
  if (agora === ultimoEnviado) return;
  ultimoEnviado = agora;
  const { error } = await supabase
    .from('carrinhos')
    .upsert({ user_id: uid, itens: lista, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' });
  // Falhou? Solta a assinatura para tentar de novo na próxima mudança. Sem
  // alarme na tela: o carrinho local segue valendo.
  if (error) ultimoEnviado = '';
}

function agendar() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const uid = usuario;
    if (!uid || !carrinhoEhDeUsuario()) return;
    void empurrar(uid, itensDoCarrinho());
  }, ATRASO_MS);
}

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    const novo = sessao?.user?.id ?? null;
    if (novo === usuario) return;
    usuario = novo;
    ultimoEnviado = '';
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    // O carrinho.ts já trocou de chave neste mesmo evento; puxar depois dele
    // garante que a fusão pegue a lista certa.
    if (novo) setTimeout(() => void puxar(novo), 0);
  });

  assinarCarrinho(() => {
    if (aplicando) return;
    agendar();
  });

  // Fechar a aba antes do atraso não pode perder a última mudança.
  window.addEventListener('pagehide', () => {
    if (!timer || !usuario || !carrinhoEhDeUsuario()) return;
    clearTimeout(timer);
    timer = null;
    void empurrar(usuario, itensDoCarrinho());
  });
}
