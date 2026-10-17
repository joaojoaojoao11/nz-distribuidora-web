// ─────────────────────────────────────────────────────────────
// Coleção NZPPF 2026 · Os Clãs — página /colecao (alias /clas)
//
// É o único arquivo que muda no dia a dia da campanha: data de lançamento,
// preço, link da loja de cada camiseta e os textos dos clãs.
// Textos aprovados pela Cledna em 17/10/2026 ("Textos dos clas (para
// aprovar).md", pasta 02 - SITE E LOJA). Marcação: *trecho* vira itálico.
//
// Depois do lançamento: preencha `lojaSlug` de cada clã com o slug do produto
// na loja (/loja/<slug>). Enquanto estiver vazio, o "Comprar" leva para
// LOJA_COLECAO_URL.
// ─────────────────────────────────────────────────────────────

/** Quinta, 29/10/2026, 18h (horário de Brasília, sem horário de verão). */
export const LANCAMENTO = new Date('2026-10-29T18:00:00-03:00');
export const LANCAMENTO_DIA = '29/10';
export const LANCAMENTO_TEXTO = 'quinta, 29/10, às 18h';

/** Só aparece na página depois do lançamento. */
export const PRECO = 'R$ 189';
export const PRECO_NUMERO = 189;
export const TAMANHOS = ['P', 'M', 'G', 'GG'] as const;

/** Destino do "Comprar" quando o clã ainda não tem produto próprio na loja. */
export const LOJA_COLECAO_URL = '/loja?colecao=2026';

/** Tabela de leads no Supabase (migrations/2026-10-17_leads_colecao_2026.sql). */
export const TABELA_LEADS = 'leads_colecao_2026';

export const INTRO =
  'Cada camiseta da Coleção NZPPF 2026 é um clã. Dizem que não é você que escolhe a estampa: é a estampa que escolhe você. Leia com atenção, porque alguma delas vai saber demais sobre você.';

export const SUBTITULO = 'Dizem que não é você que escolhe a estampa: é a estampa que escolhe você.';

/** Espelhado em api/_lib/routeMeta.ts ('/colecao') — mudou aqui, mude lá. */
export const SEO_TITULO = 'Coleção NZPPF 2026 · Os Clãs';
export const SEO_DESCRICAO =
  'Cinco camisetas pretas, cinco clãs. Conheça a Coleção NZPPF 2026, leia a lenda de cada estampa e entre na lista do lançamento: quinta, 29/10, às 18h.';

export type ClaSlug = 'sol-nascente' | 'detalhe' | 'meia-noite' | 'fumaca' | 'night-riders';

export interface Cla {
  n: 1 | 2 | 3 | 4 | 5;
  /** "01" */
  numero: string;
  /** Nome da camiseta, como está na estampa. */
  camisa: string;
  /** "Clã do Sol Nascente" */
  nome: string;
  slug: ClaSlug;
  /** Cor de acento do clã. */
  cor: string;
  /** Cor do texto sobre a cor de acento (contraste). */
  corTexto: string;
  /** Uma linha, no cartão "Qual é o seu clã?". */
  dica: string;
  quem: {
    bom: string;
    /** Sem o "O lado ruim:" — a página põe o rótulo. */
    ruim: string;
  };
  ficha: {
    pontoForte: string;
    pontoFraco: string;
    combinaCom: string;
    evite: string;
    horaDeSorte: string;
    amuleto: string;
  };
  supersticao: {
    frase: string;
    origem: string;
  };
  lenda: string[];
  /** Texto alternativo da foto principal (pessoa de costas no cenário do clã). */
  altChave: string;
  /** Slug do produto na loja, quando existir (/loja/<slug>). */
  lojaSlug?: string;
}

export const CLAS: readonly Cla[] = [
  {
    n: 1,
    numero: '01',
    camisa: 'TRUE PROTECT',
    nome: 'Clã do Sol Nascente',
    slug: 'sol-nascente',
    cor: '#E0322B',
    corTexto: '#FFFFFF',
    dica: 'Acorda antes do sol.',
    quem: {
      bom: 'Acorda antes de todo mundo e já quer ir para a serra. É disciplinado, fiel às próprias regras e faz a mesma curva cem vezes até ela sair perfeita. É leal: se te chamou de amigo, é para a vida.',
      ruim: 'é teimoso como montanha e não muda de ideia nem com o GPS recalculando. Acha que o jeito dele é o único jeito certo. Às vezes é mesmo, e isso só piora tudo. Organiza o porta-luvas por ordem de tamanho.',
    },
    ficha: {
      pontoForte: 'paciência',
      pontoFraco: 'não sabe dirigir devagar quando ninguém está olhando',
      combinaCom: 'Clã do Detalhe',
      evite: 'Clã da Fumaça antes do café',
      horaDeSorte: '5h47, quando o sol encosta no Fuji',
      amuleto: 'o carimbo 保護 ("proteção")',
    },
    supersticao: {
      frase: 'Dizem que quem veste a Nº 01 nunca pega pedra na pintura na primeira curva do dia.',
      origem: 'A crença vem dos pilotos de montanha do Japão. Eles só subiam a serra depois de ver o sol nascer atrás do Fuji, porque acreditavam que o sol vermelho "carimbava" o carro como protegido. Quem leva 保護 no peito não precisa de sorte. Mas também não custa nada.',
    },
    lenda: [
      'Na estrada que desce o Fuji, existia um sedã branco que fazia a serra toda madrugada sem nunca levar um risco. Os outros pilotos achavam que era sorte. O velho dono da oficina no pé da montanha sabia que não: antes de cada descida, ele passava a mão no capô e dizia baixinho, *true protect*.',
      'Numa manhã, uma pedra do tamanho de um punho voou de um caminhão bem na frente do sedã. Quem estava na curva jura que viu a pedra bater e voltar, como se o capô fosse feito de luz. O carro seguiu sem marca, o sol terminou de nascer e a curva ganhou nome: a Curva do Sol Nascente.',
      'Desde então, quem desce aquela serra antes do amanhecer leva um sol vermelho em algum lugar. Por via das dúvidas.',
    ],
    altChave: 'De costas, um homem veste a camiseta Nº 01 True Protect diante do monte Fuji ao nascer do sol, ao lado de um sedã branco parado na serra.',
  },
  {
    n: 2,
    numero: '02',
    camisa: 'PROTECTED',
    nome: 'Clã do Detalhe',
    slug: 'detalhe',
    cor: '#EFEADF',
    corTexto: '#0A0A0A',
    dica: 'Repara em tudo.',
    quem: {
      bom: 'Repara em tudo: na costura da sua calça, no risco que ninguém viu, na bolha de um milímetro no canto do para-choque. É perfeccionista e metódico, e tem opinião sobre tipo de pano de microfibra. Quando gosta de alguma coisa, estuda até virar especialista.',
      ruim: 'demora quatro horas para escolher um tênis e ainda volta para trocar. Fala "na verdade..." mais do que deveria. Não consegue fazer um elogio sem uma ressalva técnica.',
    },
    ficha: {
      pontoForte: 'olho clínico',
      pontoFraco: 'nunca acha que está pronto',
      combinaCom: 'Clã do Sol Nascente',
      evite: 'quem lava o carro com detergente de cozinha',
      horaDeSorte: '10h, luz boa e nenhum reflexo',
      amuleto: 'a régua (e as 190 micras, que ele sabe de cor)',
    },
    supersticao: {
      frase: 'Dizem que quem veste a Nº 02 enxerga o defeito antes de ele acontecer.',
      origem: 'Começou nas oficinas de São Paulo. O instalador mais velho só liberava um carro depois de olhar o capô contra a luz por exatamente dois minutos, a tal "Figura 02". Quem pulava essa vistoria via o problema aparecer na semana seguinte. Quem fazia, nunca.',
    },
    lenda: [
      'Existe um caderno de desenho técnico que passa de mão em mão entre os instaladores mais caprichosos de São Paulo. Na primeira página está a Figura 01, um carro qualquer. Na segunda está a Figura 02: o mesmo carro, desenhado com tanto cuidado que dá para contar as gotas de água sobre o capô. Ninguém sabe quem desenhou.',
      'O que se sabe é que todo mundo que recebeu o caderno passou a enxergar o mundo em camadas: o PPF, o verniz, a pintura e a lataria. E a cada carro entregue perfeito, uma linha nova aparece sozinha no papel. Já são milhares.',
      'Dizem que, quando o caderno acabar, vai existir o carro perfeito. Até lá, o clã continua medindo, 190 micras de cada vez.',
    ],
    altChave: 'De costas, um homem com a camiseta Nº 02 Protected inspeciona com uma lanterna a pintura de um esportivo preto num estúdio iluminado.',
  },
  {
    n: 3,
    numero: '03',
    camisa: 'SHINE AFTER DARK',
    nome: 'Clã da Meia-Noite',
    slug: 'meia-noite',
    cor: '#19C3FF',
    corTexto: '#0A0A0A',
    dica: 'Só brilha depois da meia-noite.',
    quem: {
      bom: 'Funciona melhor depois que o sol vai embora. É criativo e charmoso, e conhece um lugar bom para comer às duas da manhã em qualquer bairro. Tem estilo: o carro está sempre brilhando, mesmo quando a vida está meio bagunçada.',
      ruim: 'só responde mensagem à noite, chega atrasado em tudo que acontece antes das 10h e jura que "só vai dar uma voltinha". É um pouco vaidoso: tira foto do carro em cada poça que reflete neon.',
    },
    ficha: {
      pontoForte: 'brilha no escuro',
      pontoFraco: 'horário comercial',
      combinaCom: 'Clã dos Night Riders',
      evite: 'Clã do Sol Nascente (o despertador deles é o seu pesadelo)',
      horaDeSorte: '23:59',
      amuleto: 'a lua crescente',
    },
    supersticao: {
      frase: 'Dizem que o carro de quem veste a Nº 03 brilha mais à noite do que de dia.',
      origem: 'Nasceu nos encontros da madrugada perto da Ponte Estaiada. Quem chegava com o carro mais brilhante ganhava "a lua", que dava o direito de puxar o comboio pela marginal. A turma reparou que o vencedor era sempre alguém que só lavava o carro sob a luz da lua. O clã garante que não é coincidência.',
    },
    lenda: [
      'Toda noite, às 23:59, a Ponte Estaiada acende e um clube que não existe se reúne embaixo dela. Não tem placa, lista nem convite: só aparece quem tem brilho.',
      'Contam que, numa noite de chuva, chegou um esportivo clássico prateado, de motor traseiro, tão espelhado que a cidade inteira se refletiu na lataria: os prédios, o neon e a própria ponte. Ninguém viu quem dirigia. Ele deu uma volta só, deixou uma frase escrita no vapor do vidro de um carro estacionado, *chase the gloss*, e sumiu antes de a meia-noite virar.',
      'Desde então, o Midnight Club tem uma regra: chegar limpo, sair brilhando e nunca contar nada para quem não brilha.',
    ],
    altChave: 'De costas, um homem com a camiseta Nº 03 Shine After Dark diante da Ponte Estaiada iluminada à noite, ao lado de um esportivo clássico prateado molhado de chuva.',
  },
  {
    n: 4,
    numero: '04',
    camisa: 'PPF',
    nome: 'Clã da Fumaça',
    slug: 'fumaca',
    cor: '#E0322B',
    corTexto: '#FFFFFF',
    dica: 'Não sabe o que é devagar.',
    quem: {
      bom: 'É intenso e direto, sem meio-termo: ou está acelerando, ou está dormindo. Fala alto, ri alto e, se aparecer uma rotatória vazia, já sabe o que vai fazer. É corajoso e generoso: empresta a ferramenta, o macaco e o ombro.',
      ruim: 'tem zero paciência. Chega primeiro e sai primeiro. Gasta mais com pneu do que com roupa, e por isso esta camiseta é especial. Acha que "devagar" é um tipo de defeito.',
    },
    ficha: {
      pontoForte: 'coragem',
      pontoFraco: 'não tem freio de mão emocional',
      combinaCom: 'Clã dos Night Riders',
      evite: 'Clã do Detalhe (vão discutir a marca de borracha no para-lama)',
      horaDeSorte: 'aos 9 mil giros',
      amuleto: 'a placa 04',
    },
    supersticao: {
      frase: 'Dizem que quem veste a Nº 04 pode sair de lado em qualquer curva que a pintura nem sente.',
      origem: 'Vem das pistas de drift. O piloto que corria com a camisa vermelha da equipe nunca voltava com o carro riscado, mesmo atravessando nuvens de fumaça e cascalho. Os outros chamavam isso de sorte. Ele chamava de *burn rubber, not paint*.',
    },
    lenda: [
      'Na última volta do campeonato, o superesportivo branco entrou na curva tão de lado que o público perdeu o carro de vista. Sobrou só fumaça, e por três segundos ninguém respirou.',
      'Do meio da nuvem saiu primeiro o som do motor, depois o brilho dos faróis e, por fim, o carro inteiro: impecável, sem uma marca, enquanto a pista atrás dele ficava preta de borracha. O piloto desceu, olhou o capô e disse só: "a borracha fica no chão, a pintura fica no carro".',
      'Ninguém lembra quem ganhou o campeonato naquele ano, mas todo mundo lembra da fumaça. E o clã guarda até hoje a placa número 04 pendurada na parede da garagem, como se fosse um troféu.',
    ],
    altChave: 'De costas, um homem com a camiseta Nº 04 PPF assiste a um superesportivo branco fazendo drift no meio da fumaça, ao pôr do sol.',
  },
  {
    n: 5,
    numero: '05',
    camisa: 'EMOTION & PROTECT',
    nome: 'Clã dos Night Riders',
    slug: 'night-riders',
    cor: '#FF2BD6',
    corTexto: '#0A0A0A',
    dica: 'Equilibra emoção e juízo.',
    quem: {
      bom: 'Vive no limite entre a emoção e o juízo e, de algum jeito, equilibra os dois. É livre, intuitivo e apaixonado por tudo que tem duas rodas e uma avenida vazia. É leal ao bando, mas precisa do próprio espaço.',
      ruim: 'some sem avisar e reaparece com uma história em que ninguém acredita. É dramático: transforma uma ida à padaria em filme. Diz que "é só emoção", mas confere a proteção três vezes antes de sair.',
    },
    ficha: {
      pontoForte: 'equilíbrio (E+P)',
      pontoFraco: 'não sabe ficar parado',
      combinaCom: 'Clã da Meia-Noite',
      evite: 'quem acha que moto é "só um meio de transporte"',
      horaDeSorte: '01:07',
      amuleto: 'o sinal de +',
    },
    supersticao: {
      frase: 'Dizem que quem veste a Nº 05 nunca toma pedrada na carenagem.',
      origem: 'A crença nasceu com os Night Riders da Avenida Paulista, que se encontravam à 01:07 em frente ao MASP. Antes de sair, cada um batia duas vezes no tanque e dizia "emoção mais proteção". Um esquecia, outro lembrava. Os que lembravam voltavam inteiros.',
    },
    lenda: [
      'À 01:07 de uma madrugada qualquer, a Avenida Paulista estava vazia, molhada e cor-de-rosa de neon. Uma superbike branca apareceu do nada, empinou na frente do museu e atravessou a avenida inteira numa roda só.',
      'Atrás dela vinha um caminhão de obra perdendo cascalho. As pedras voaram como chuva, e quem estava no ponto de ônibus jura que viu: cada pedra batia num brilho rosa em volta da moto e voltava para o asfalto. Ela não parou nem acelerou mais. Só seguiu, como quem já sabia.',
      'No dia seguinte, a única prova era um adesivo cor-de-rosa colado num poste: "E+P". Hoje tem um desses em cada garagem dos Night Riders. Ninguém conta de onde veio, e todo mundo sabe o que significa.',
    ],
    altChave: 'De costas, um homem com a camiseta Nº 05 Emotion & Protect na Avenida Paulista molhada e iluminada de neon rosa, segurando o capacete ao lado de uma superbike branca.',
  },
];

export const CLA_POR_SLUG: Record<ClaSlug, Cla> = Object.fromEntries(
  CLAS.map((c) => [c.slug, c]),
) as Record<ClaSlug, Cla>;

export function ehClaSlug(v: string | null | undefined): v is ClaSlug {
  return !!v && v in CLA_POR_SLUG;
}

/** Linhas da ficha, na ordem do texto aprovado. */
export const FICHA_ROTULOS: ReadonlyArray<[keyof Cla['ficha'], string]> = [
  ['pontoForte', 'Ponto forte'],
  ['pontoFraco', 'Ponto fraco'],
  ['combinaCom', 'Combina com'],
  ['evite', 'Evite'],
  ['horaDeSorte', 'Hora de sorte'],
  ['amuleto', 'Amuleto'],
];

const PASTA = '/assets/images/colecao-2026';

export type TipoImagem = 'chave' | 'costas' | 'peito' | 'etiqueta' | 'tag' | 'adesivo' | 'simbolo' | 'arte';

export const imagemCla = (n: Cla['n'], tipo: TipoImagem) => `${PASTA}/cla-${n}-${tipo}.webp`;

export const IMAGENS = {
  fila: `${PASTA}/fila-5-clas.webp`,
  heroPosterMobile: `${PASTA}/hero-mobile-poster.webp`,
  heroPosterDesktop: `${PASTA}/hero-desktop-poster.webp`,
  kitTag: `${PASTA}/kit-tag.webp`,
  kitAdesivo: `${PASTA}/kit-adesivo.webp`,
  kitTecido: `${PASTA}/kit-tecido.webp`,
} as const;

export const VIDEOS = {
  heroMobile: '/assets/videos/colecao-2026-hero-mobile.mp4',
  heroDesktop: '/assets/videos/colecao-2026-hero-desktop.mp4',
  filme: '/assets/videos/colecao-2026-filme.mp4',
} as const;

/** Faixa de fotos de cada clã. `encaixe`: cobrir (foto) ou conter (peça recortada). */
export const GALERIA: ReadonlyArray<{
  tipo: TipoImagem;
  legenda: string;
  encaixe: 'cobrir' | 'conter';
  largura: number;
  altura: number;
  alt: (c: Cla) => string;
}> = [
  {
    tipo: 'arte', legenda: 'Arte da estampa', encaixe: 'conter', largura: 900, altura: 1320,
    alt: (c) => `Arte da estampa das costas da Nº ${c.numero} ${c.camisa}`,
  },
  {
    tipo: 'costas', legenda: 'Estampa nas costas', encaixe: 'cobrir', largura: 1100, altura: 1375,
    alt: (c) => `Camiseta preta Nº ${c.numero} ${c.camisa} no cabide, de costas, com a estampa do ${c.nome}`,
  },
  {
    tipo: 'peito', legenda: 'Logo no peito', encaixe: 'cobrir', largura: 900, altura: 476,
    alt: (c) => `Detalhe do logo NZPPF no peito da camiseta Nº ${c.numero} ${c.camisa}`,
  },
  {
    tipo: 'etiqueta', legenda: 'Etiqueta interna numerada', encaixe: 'cobrir', largura: 900, altura: 596,
    alt: (c) => `Etiqueta impressa por dentro da gola da Nº ${c.numero}, com o número ${c.numero} de 05`,
  },
  {
    tipo: 'tag', legenda: 'Tag do clã', encaixe: 'conter', largura: 500, altura: 865,
    alt: (c) => `Tag da camiseta Nº ${c.numero} ${c.camisa}`,
  },
  {
    tipo: 'adesivo', legenda: 'Adesivo do clã', encaixe: 'conter', largura: 700, altura: 700,
    alt: (c) => `Adesivo recortado do ${c.nome}`,
  },
];

/** "O kit": o que vem com cada camiseta. */
export const KIT_ITENS = [
  { titulo: 'Camiseta 100% algodão', detalhe: 'Preta, nos tamanhos P, M, G e GG.' },
  { titulo: 'Estampa de 38 × 56 cm', detalhe: 'Nas costas, com a arte do clã.' },
  { titulo: 'Logo no peito', detalhe: 'NZPPF com o número e o nome da camiseta.' },
  { titulo: 'Etiqueta interna numerada', detalhe: 'Impressa na gola, com o número do clã.' },
  { titulo: 'Etiqueta de composição', detalhe: 'Tecido e cuidados de lavagem.' },
  { titulo: 'Tag e adesivo exclusivos', detalhe: 'Com a arte e o número de cada clã.' },
] as const;

export const KIT_FOTOS = [
  { src: IMAGENS.kitTecido, legenda: 'O tecido', alt: 'Mão segurando a barra da manga da camiseta preta, mostrando a costura e o tecido de algodão' },
  { src: IMAGENS.kitTag, legenda: 'A tag', alt: 'Mãos segurando a tag exclusiva de um dos clãs da coleção' },
  { src: IMAGENS.kitAdesivo, legenda: 'O adesivo', alt: 'Mãos segurando o adesivo recortado de um dos clãs da coleção' },
] as const;

/** Destino do "Comprar" de um clã. */
export function linkLoja(c: Cla): string {
  return c.lojaSlug ? `/loja/${c.lojaSlug}` : LOJA_COLECAO_URL;
}

/** "#E0322B" -> "rgba(224, 50, 43, a)" — brilho de fundo de cada seção. */
export function corComAlfa(hex: string, alfa: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}
