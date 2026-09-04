// Adapter Jadlog — Simulador de Frete.
//
// Escrito contra a documentação oficial "Integração API JADLOG", versão 2.3
// (28/08/2025), seção "Simulador de Frete", página 21. O que a doc fixa:
//
//   POST https://www.jadlog.com.br/embarcador/api/frete/valor
//   Header: Content-Type: application/json + Authorization: <token>
//   Corpo:  { "frete": [ { ... } ] }  — de 1 a 3 itens por chamada
//   Volta:  frete[0].prazo (dias) e frete[0].vltotal (BRL)
//
// Três detalhes que a doc deixa explícitos e que o código anterior errava:
//   1. A cotação NÃO tem campos de dimensão. O peso enviado já tem que ser o
//      maior entre real e cubado — a conta é nossa (carriers/cubagem.ts).
//   2. `cnpj` é obrigatório (1-1): é o que vincula a tabela negociada. Sem ele
//      não há cotação, por isso entra no isConfigured().
//   3. O header é `Authorization: <token>`, sem esquema. Ver nota no fetch.
//
// Falta só a credencial: enquanto JADLOG_TOKEN/JADLOG_CNPJ não existirem no
// ambiente, isConfigured() é false e o endpoint cai no mock. Nada roda por
// acidente.

import { CarrierError, withTimeout, type CarrierAdapter, type QuoteInput, type QuoteResult } from './types.js';

const ENDPOINT =
  process.env.JADLOG_ENDPOINT || 'https://www.jadlog.com.br/embarcador/api/frete/valor';

const TIMEOUT_MS = 6000;

/**
 * Modalidade contratada (doc v2.3, tabela "Modalidades", p. 8):
 * 0 EXPRESSO · 3 .PACKAGE · 4 RODOVIÁRIO · 5 ECONÔMICO · 6 DOC ·
 * 7 CORPORATE · 9 .COM · 10 INTERNACIONAL · 12 CARGO · 14 EMERGENCIAL ·
 * 40 PICKUP (exige cdPickupDes). 3 = .PACKAGE é o default do projeto; a
 * franquia confirma qual foi negociada.
 */
function modalidade(): number {
  const n = Number(process.env.JADLOG_MODALIDADE);
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

const MODALIDADE_LABEL: Record<number, string> = {
  0: 'Expresso',
  3: '.Package',
  4: 'Rodoviário',
  5: 'Econômico',
  6: 'Doc',
  7: 'Corporate',
  9: '.Com',
  12: 'Cargo',
  14: 'Emergencial',
  40: 'Pickup',
};

interface FreteRetorno {
  prazo?: number;
  vltotal?: number | string;
  modalidade?: number;
  erro?: { id?: number; descricao?: string; detalhe?: string } | string;
  error?: { id?: number; descricao?: string; detalhe?: string } | string;
}

/** A doc usa `erro` e `error`, ora objeto {id, descricao, detalhe}, ora texto. */
function textoErro(bruto: unknown): string | null {
  if (!bruto) return null;
  if (typeof bruto === 'string') return bruto;
  const e = bruto as { id?: number; descricao?: string; detalhe?: string };
  const partes = [e.descricao, e.detalhe].filter(Boolean);
  const texto = partes.join(' — ') || 'erro sem descrição';
  return e.id != null ? `[${e.id}] ${texto}` : texto;
}

export const jadlog: CarrierAdapter = {
  slug: 'jadlog',
  nome: 'Jadlog',

  isConfigured() {
    // CNPJ é obrigatório na cotação (doc p. 21, campo 6, ocorrência 1-1).
    return Boolean(process.env.JADLOG_TOKEN && process.env.JADLOG_CNPJ);
  },

  async quoteDeadline(input: QuoteInput): Promise<QuoteResult> {
    const token = process.env.JADLOG_TOKEN;
    const cnpj = (process.env.JADLOG_CNPJ || '').replace(/\D/g, '');
    if (!token) throw new CarrierError('jadlog', 'JADLOG_TOKEN não configurado');
    if (!cnpj) throw new CarrierError('jadlog', 'JADLOG_CNPJ não configurado');

    const mod = modalidade();

    const body = {
      frete: [
        {
          cepori: input.cepOrigem,
          cepdes: input.cepDestino,
          // Frete a pagar no destino: sempre não — quem cota é o remetente.
          frap: 'N',
          // Já vem cubado e multiplicado pela quantidade.
          peso: input.pesoKg,
          cnpj,
          // "Preencher somente se for correntista, caso não seja deixar branco."
          conta: process.env.JADLOG_CONTA || '',
          // "Caso não [seja disponibilizado pela Jadlog], deixar como null."
          contrato: process.env.JADLOG_CONTRATO || null,
          modalidade: mod,
          tpentrega: 'D', // D=Domicílio, R=Retira
          tpseguro: 'N', // N=Normal, A=Apólice
          vldeclarado: input.valorDeclarado,
          vlcoleta: 0,
        },
      ],
    };

    const res = await withTimeout(
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // A doc mostra o token cru, sem "Bearer". Mandamos exatamente o que
          // está na variável: se a franquia entregar um token que precise de
          // prefixo, ele entra no próprio valor da env var — assim o formato
          // fica com quem tem a credencial, e não hardcoded aqui.
          Authorization: token,
        },
        body: JSON.stringify(body),
      }),
      TIMEOUT_MS,
      'jadlog'
    );

    if (!res.ok) {
      throw new CarrierError('jadlog', `HTTP ${res.status} ao cotar frete`);
    }

    const json = (await res.json()) as { frete?: FreteRetorno[]; erro?: unknown; error?: unknown };

    // Erro do serviço vem fora do array (doc p. 22, "Retorno com Erro"), e o
    // array ainda assim volta ecoando a entrada — checar o topo primeiro.
    const erroGeral = textoErro(json.error ?? json.erro);
    if (erroGeral) throw new CarrierError('jadlog', erroGeral);

    const primeiro = json.frete?.[0];
    if (!primeiro) throw new CarrierError('jadlog', 'Resposta sem cotação');

    const erroItem = textoErro(primeiro.error ?? primeiro.erro);
    if (erroItem) throw new CarrierError('jadlog', erroItem);

    if (typeof primeiro.prazo !== 'number') {
      throw new CarrierError('jadlog', 'Resposta sem campo de prazo');
    }

    const valor = Number(primeiro.vltotal);

    return {
      dias: primeiro.prazo,
      valorTotal: Number.isFinite(valor) && valor > 0 ? valor : null,
      modalidade: MODALIDADE_LABEL[primeiro.modalidade ?? mod] ?? `Modalidade ${mod}`,
      // `raw` fica só para o painel de diagnóstico admin.
      raw: json,
    };
  },
};
