// Adapter Melhor Envio — cotação por volumes.
//
// Escrito contra a documentação oficial (docs.melhorenvio.com.br, "Cálculo de
// Fretes" e "Cotação de fretes", revisão de 2026-06). O que a doc fixa:
//
//   POST {base}/api/v2/me/shipment/calculate
//   Headers: Accept + Content-Type application/json, Authorization: Bearer <token>
//            e User-Agent OBRIGATÓRIO com nome da aplicação e e-mail de contato
//   Corpo:   { from:{postal_code}, to:{postal_code}, volumes:[...], options, services? }
//   Volta:   ARRAY com UMA ENTRADA POR SERVIÇO (PAC, SEDEX, .Package, Azul…)
//
// Quatro coisas que a doc é explícita e que mudam o desenho:
//
//   1. O Melhor Envio NÃO é uma transportadora: é intermediador. Uma chamada
//      devolve vários serviços de várias transportadoras. Por isso este adapter
//      devolve QuoteResult[] e não QuoteResult.
//   2. Usar `custom_price` e `custom_delivery_time`, não `price`/`delivery_time`:
//      os "custom" já trazem os descontos e acréscimos configurados na conta
//      Melhor Envio da NZ. A doc pede isso em letras maiúsculas.
//   3. Um serviço que não atende o volume volta com `error` DENTRO da entrada —
//      não é falha da cotação. Rolo de 1,52 m derruba PAC/SEDEX (Correios
//      limitam o maior lado a 100 cm) e ainda assim a resposta é 200 com as
//      demais opções. Filtramos a entrada, nunca a resposta.
//   4. Ids de serviço podem mudar de ordem entre versões e nomes podem mudar:
//      a doc manda identificar por `id`, nunca por nome. É o que guardamos em
//      `servico`.
//
// Cubagem: aqui mandamos DIMENSÃO, então o peso enviado é o REAL — quem cuba é
// o Melhor Envio. Mandar `pesoKg` (já cubado por carriers/cubagem.ts, para a
// Jadlog, que não aceita dimensão) cobraria a cubagem duas vezes.
//
// Falta só a credencial: sem MELHORENVIO_TOKEN o isConfigured() é false e o
// endpoint cai no mock. Nada roda por acidente.

import { CarrierError, type CarrierAdapter, type QuoteInput, type QuoteResult } from './types.js';

const BASE = process.env.MELHORENVIO_ENDPOINT || 'https://melhorenvio.com.br';
const ENDPOINT = `${BASE.replace(/\/+$/, '')}/api/v2/me/shipment/calculate`;

/** Mais folgado que a Jadlog: o ME consulta várias transportadoras por trás. */
const TIMEOUT_MS = 8000;

interface ServicoRetorno {
  id?: number | string;
  name?: string;
  price?: number | string;
  custom_price?: number | string;
  delivery_time?: number | string;
  custom_delivery_time?: number | string;
  company?: { id?: number; name?: string };
  error?: string;
}

/** Lista de ids de serviço vinda de shipping_carriers.config.servicos. */
function servicosDaConfig(config: unknown): string[] {
  const bruto = (config as { servicos?: unknown } | null)?.servicos;
  if (!Array.isArray(bruto)) return [];
  return bruto
    .map((s) => String(s).trim())
    .filter((s) => /^\d+$/.test(s));
}

/**
 * Teto da dimensão DECLARADA na cotação, em cm (shipping_carriers.config).
 *
 * Existe por uma decisão comercial explícita do João: as transportadoras
 * recusam o rolo de 1,52 m na tabela do Melhor Envio ("Dimensões do objeto
 * ultrapassam o limite"), mas na prática levam — a NZ despacha por elas todo
 * dia, pelos contratos diretos. Sem o teto, a loja só conseguiria mostrar
 * Jadlog; com ele, a cotação volta de todas as que atendem o trecho.
 *
 * O que isso NÃO faz: mexer no cadastro. `shipping_profiles` continua com a
 * medida real — que é o que a Jadlog recebe (via peso cubado) e o que o painel
 * mostra. O teto vale só para o que é declarado a esta transportadora.
 *
 * Sobre o preço: praticamente não muda. Em todos os perfis da NZ o peso REAL
 * (11 a 33 kg) supera o cubado com folga, e é ele que define a tarifa — a
 * dimensão decide se o serviço aceita, não quanto cobra.
 */
function limiteDimensao(config: unknown): number | null {
  const bruto = (config as { limite_dimensao_cm?: unknown } | null)?.limite_dimensao_cm;
  const n = Number(bruto);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function num(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function round(valor: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

export const melhorenvio: CarrierAdapter = {
  slug: 'melhorenvio',
  nome: 'Melhor Envio',

  isConfigured() {
    // O User-Agent com e-mail é exigência da API, não capricho: sem ele a
    // requisição é recusada. Por isso conta como credencial.
    return Boolean(process.env.MELHORENVIO_TOKEN && process.env.MELHORENVIO_UA_EMAIL);
  },

  async quoteDeadline(input: QuoteInput): Promise<QuoteResult[]> {
    const token = process.env.MELHORENVIO_TOKEN;
    const email = process.env.MELHORENVIO_UA_EMAIL;
    if (!token) throw new CarrierError('melhorenvio', 'MELHORENVIO_TOKEN não configurado');
    if (!email) throw new CarrierError('melhorenvio', 'MELHORENVIO_UA_EMAIL não configurado');

    const qtd = Math.max(1, Math.floor(input.quantidade) || 1);
    const pesoPorVolume = round(input.pesoRealKg / qtd, 3);
    const seguroPorVolume = round(input.valorDeclarado / qtd, 2);

    // Um volume por rolo. `shipping_profiles` já descreve UM volume físico —
    // é a mesma unidade, então não há empacotamento a inventar aqui.
    const teto = limiteDimensao(input.config);
    const cm = (valor: number) => Math.ceil(teto ? Math.min(valor, teto) : valor);
    const limitado =
      teto != null &&
      Math.max(input.comprimentoCm, input.larguraCm, input.alturaCm) > teto;

    const volume = {
      width: cm(input.larguraCm),
      height: cm(input.alturaCm),
      length: cm(input.comprimentoCm),
      // A especificação OpenAPI do Melhor Envio grafa `heigth`/`lenght` (com o
      // erro de digitação), enquanto os exemplos da mesma página usam
      // `height`/`length`. Mandamos as duas grafias: campos desconhecidos são
      // ignorados pelo validador, e assim a cotação não depende de qual das
      // duas o servidor realmente lê.
      heigth: cm(input.alturaCm),
      lenght: cm(input.comprimentoCm),
      weight: pesoPorVolume,
      insurance: seguroPorVolume,
      insurance_value: seguroPorVolume,
    };

    const servicos = servicosDaConfig(input.config);

    const body = {
      from: { postal_code: input.cepOrigem },
      to: { postal_code: input.cepDestino },
      volumes: Array.from({ length: qtd }, () => volume),
      options: { receipt: false, own_hand: false },
      // Sem `services` vêm todos os serviços habilitados na conta — que é o que
      // queremos por padrão. A lista existe para o admin restringir sem deploy.
      ...(servicos.length ? { services: servicos.join(',') } : {}),
    };

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          // Obrigatório pela doc: nome da aplicação + e-mail de contato técnico.
          'User-Agent': `NZSTORE (${email})`,
        },
        body: JSON.stringify(body),
        // AbortSignal cancela o fetch de verdade, diferente do Promise.race do
        // withTimeout(), que só abandona a promessa e deixa a conexão aberta.
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      const nome = (err as { name?: string })?.name;
      if (nome === 'TimeoutError' || nome === 'AbortError') {
        throw new CarrierError('melhorenvio', `Tempo esgotado após ${TIMEOUT_MS}ms`, err);
      }
      throw new CarrierError('melhorenvio', 'Falha de rede ao cotar frete', err);
    }

    if (res.status === 401 || res.status === 403) {
      throw new CarrierError(
        'melhorenvio',
        'Token inválido, expirado ou sem a permissão shipping-calculate'
      );
    }
    if (res.status === 429) {
      throw new CarrierError('melhorenvio', 'Limite de 250 requisições/min do Melhor Envio');
    }

    const json: unknown = await res.json().catch(() => null);

    if (res.status === 422) {
      // { message, errors: { 'from.postal_code': ['...'] } }
      const erros = (json as { errors?: Record<string, string[]> } | null)?.errors;
      const detalhe = erros
        ? Object.entries(erros)
            .map(([campo, msgs]) => `${campo}: ${msgs.join(' ')}`)
            .join(' | ')
        : (json as { message?: string } | null)?.message;
      throw new CarrierError('melhorenvio', detalhe || 'Dados inválidos na cotação');
    }

    if (!res.ok) {
      throw new CarrierError('melhorenvio', `HTTP ${res.status} ao cotar frete`);
    }

    if (!Array.isArray(json)) {
      const msg = (json as { message?: string } | null)?.message;
      throw new CarrierError('melhorenvio', msg || 'Resposta inesperada da cotação');
    }

    const servicosRetorno = json as ServicoRetorno[];
    const recusados: string[] = [];
    const opcoes: QuoteResult[] = [];

    for (const s of servicosRetorno) {
      const nomeServico = s.name ?? `Serviço ${s.id ?? '?'}`;
      const transportadora = s.company?.name;

      // `error` na entrada = este serviço não atende ESTE volume (dimensão
      // acima do limite, destino não atendido). Os outros continuam válidos.
      if (s.error) {
        recusados.push(`${transportadora ?? ''} ${nomeServico}: ${s.error}`.trim());
        continue;
      }

      const dias = num(s.custom_delivery_time ?? s.delivery_time);
      if (dias == null) {
        recusados.push(`${nomeServico}: resposta sem prazo`);
        continue;
      }

      const valor = num(s.custom_price ?? s.price);

      opcoes.push({
        dias,
        valorTotal: valor != null && valor > 0 ? valor : null,
        servico: String(s.id ?? nomeServico),
        servicoNome: nomeServico,
        transportadora,
        modalidade: [transportadora, nomeServico].filter(Boolean).join(' '),
        raw: s,
      });
    }

    if (!opcoes.length) {
      throw new CarrierError(
        'melhorenvio',
        recusados.length
          ? `Nenhum serviço atende este volume — ${recusados.join(' | ')}`
          : 'Nenhum serviço retornado pelo Melhor Envio',
        json
      );
    }

    // Quem foi recusado viaja junto com quem foi aceito: é o que responde
    // "por que a Buslog não apareceu?" no painel, sem precisar do payload cru.
    if (recusados.length) opcoes[0]!.recusados = recusados;
    // E fica registrado quando a dimensão declarada foi limitada — para quem
    // olhar o diagnóstico não achar que o cadastro está errado.
    if (limitado) {
      opcoes[0]!.recusados = [
        `(dimensão declarada limitada a ${teto} cm — o volume real tem ${Math.ceil(input.comprimentoCm)} cm)`,
        ...(opcoes[0]!.recusados ?? []),
      ];
    }

    return opcoes;
  },
};
