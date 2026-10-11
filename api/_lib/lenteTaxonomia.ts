// Vocabulário fechado que o modelo de visão da Lente é obrigado a usar.
//
// É uma CÓPIA dos ids que a loja conhece (src/lib/shop/color/lexicon.ts,
// finish/tree.ts, pattern/taxonomy.ts). A API não importa de `src/` — os dois
// lados compilam separados —, então a cópia é deliberada, e o autoteste
// (`npm run lente:test`) confere que as listas continuam iguais. Mudou a loja,
// o teste quebra antes de o deploy sair.

export const FAMILIAS = [
  'branco',
  'preto',
  'cinza',
  'prata',
  'vermelho',
  'laranja',
  'amarelo',
  'verde',
  'azul',
  'roxo',
  'rosa',
  'marrom',
  'bege',
  'dourado',
  'bronze',
  'transparente',
  'multicolor',
] as const;

export const SUBFAMILIAS = [
  'azul-claro',
  'azul-royal',
  'azul-marinho',
  'azul-bebe',
  'turquesa',
  'verde-limao',
  'verde-agua',
  'verde-militar',
  'verde-escuro',
  'vermelho-vinho',
  'vermelho-coral',
  'cinza-claro',
  'grafite',
  'chumbo',
  'rosa-claro',
  'magenta',
  'lilas',
  'violeta',
  'pessego',
  'creme',
  'caramelo',
  'chocolate',
  'off-white',
  'gelo',
] as const;

export const ACABAMENTOS = [
  'brilhante',
  'fosco',
  'acetinado',
  'metalico',
  'cromado',
  'escovado',
  'perolado',
  'camaleao',
  'carbono',
  'texturizado',
  'transparente',
  'solido',
  'refletivo',
] as const;

export const PADROES = [
  'madeira',
  'pedra',
  'marmore',
  'cimento',
  'couro',
  'tecido',
  'formica',
  'metal',
  'estampado',
  'geometrico',
  'piso',
  'tijolo',
  'solido',
] as const;

export const TONS = ['claro', 'medio', 'escuro'] as const;
export const CONFIANCAS = ['alta', 'media', 'baixa'] as const;

/** O que o modelo devolve. Chaves em snake_case, como o schema. */
export interface LeituraBruta {
  hex_dominante: string;
  familias: string[];
  subfamilias: string[];
  tom: string;
  acabamentos: string[];
  familia_padrao: string | null;
  transparente: boolean;
  descricao_curta: string;
  confianca: string;
}

/** JSON Schema do structured output. Tudo obrigatório, nada além disto. */
export const SCHEMA_LEITURA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'hex_dominante',
    'familias',
    'subfamilias',
    'tom',
    'acabamentos',
    'familia_padrao',
    'transparente',
    'descricao_curta',
    'confianca',
  ],
  properties: {
    hex_dominante: {
      type: 'string',
      description: 'Cor do material em #rrggbb minúsculo, descontando fundo, logo, reflexo e sombra.',
    },
    familias: {
      type: 'array',
      items: { type: 'string', enum: [...FAMILIAS] },
      description: 'Uma ou duas famílias de cor, a principal primeiro.',
    },
    subfamilias: {
      type: 'array',
      items: { type: 'string', enum: [...SUBFAMILIAS] },
      description: 'Só quando evidente. Vazio na dúvida.',
    },
    tom: { type: 'string', enum: [...TONS] },
    acabamentos: {
      type: 'array',
      items: { type: 'string', enum: [...ACABAMENTOS] },
      description: 'De zero a três.',
    },
    familia_padrao: {
      anyOf: [{ type: 'string', enum: [...PADROES] }, { type: 'null' }],
      description: 'Só para padrão decorativo (madeira, mármore, tecido...). Senão null.',
    },
    transparente: { type: 'boolean' },
    descricao_curta: { type: 'string', description: 'Até 12 palavras, em português.' },
    confianca: { type: 'string', enum: [...CONFIANCAS] },
  },
} as const;

/**
 * Prompt de sistema. Estável de propósito (sem data, sem id): é o prefixo que o
 * cache da API reaproveita de uma consulta para a outra.
 */
export const SISTEMA = `Você classifica a FOTO de um material de envelopamento — vinil adesivo (wrap, decorativo, de recorte) ou película de proteção (PPF) — ou de uma superfície já envelopada, no vocabulário fixo da loja NZ Group. Responda somente o JSON pedido.

Regras:
- hex_dominante: a cor do MATERIAL em si (o rolo, o filme, a superfície envelopada), ignorando fundo, logotipo, reflexo especular e sombra. Se a foto é um carro, é a cor da lataria envelopada. Formato #rrggbb minúsculo.
- familias: uma ou duas famílias, a principal primeiro: ${FAMILIAS.join(', ')}. "prata" é cinza claro metálico; "dourado" e "bronze" só com aspecto metálico; "multicolor" só para camaleão ou estampa de várias cores; "transparente" só para filme incolor (PPF).
- subfamilias: só quando evidente: ${SUBFAMILIAS.join(', ')}. Vazio na dúvida.
- tom: claro, medio ou escuro, pela luminosidade do material.
- acabamentos: de zero a três de ${ACABAMENTOS.join(', ')}. brilhante = reflexo nítido, espelhado; fosco = sem reflexo; acetinado = brilho suave; metalico = partículas metálicas visíveis; cromado = espelho; escovado = riscas finas de metal; perolado = brilho perolado; camaleao = muda de cor com o ângulo; carbono = trama de fibra de carbono; texturizado = relevo; transparente = incolor; solido = cor chapada sem efeito; refletivo = retrorrefletivo.
- familia_padrao: só para padrão decorativo, senão null: ${PADROES.join(', ')}.
- transparente: true só para filme incolor.
- descricao_curta: até 12 palavras, em português, do que você vê (ex.: "azul-marinho fosco em rolo").
- confianca: alta se a foto é nítida e o material domina a imagem; baixa se há pouca luz, muito reflexo ou o material é pequeno na cena.`;
