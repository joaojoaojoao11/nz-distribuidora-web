// Tipos do botão "Como funciona" (tutorial de cada tela).
//
// Um tutorial é uma lista curta de passos. Cada passo tem um título, um texto
// (com **negrito** simples) e uma CENA: uma animação pequena, montada só com
// dados, que mostra o mecanismo daquela parte (o caminho do cupom, a carência
// do saldo, os status de um saque...). As cenas ficam em Cenas.tsx e são
// reaproveitadas por todas as telas; o conteúdo fica em src/lib/tutoriais/.
//
// Público: o mesmo assunto é explicado de um jeito para o admin (como
// configurar e aprovar) e de outro para o cliente, o lojista ou o afiliado
// (como ganhar e usar). Por isso o `publico` faz parte do tutorial.

export type Tom = 'ok' | 'atencao' | 'erro' | 'info' | 'neutro' | 'marca';

export type Icone =
  | 'usuario'
  | 'usuarios'
  | 'loja'
  | 'cupom'
  | 'carrinho'
  | 'nota'
  | 'relogio'
  | 'carteira'
  | 'pix'
  | 'banco'
  | 'check'
  | 'selo'
  | 'trofeu'
  | 'link'
  | 'bandeira'
  | 'presente'
  | 'percentual'
  | 'calendario'
  | 'dinheiro'
  | 'download'
  | 'whatsapp'
  | 'busca'
  | 'caminhao'
  | 'cartao'
  | 'estrela'
  | 'olho'
  | 'coracao'
  | 'cadeado'
  | 'email'
  | 'mapa'
  | 'camera'
  | 'caixa';

export type Cena =
  /** Caminho em etapas: um ponto de luz percorre as setas, uma etapa por vez. */
  | { tipo: 'fluxo'; etapas: { icone: Icone; rotulo: string; tom?: Tom }[] }
  /** Linha do tempo: a barra enche e cada marco acende quando é alcançado. */
  | { tipo: 'linhaTempo'; marcos: { rotulo: string; sub?: string; tom?: Tom }[] }
  /** Extrato de carteira: as linhas entram uma a uma e o total sobe contando. */
  | { tipo: 'carteira'; titulo: string; linhas: { rotulo: string; valor: number; tom: Tom; status?: string }[]; total?: { rotulo: string; valor: number } }
  /** Cupom: o código se escreve letra a letra e as regras entram como selos. */
  | { tipo: 'cupom'; codigo: string; selos: { texto: string; tom: Tom }[]; legenda?: string }
  /** Estados em sequência: o destaque passa de um status para o seguinte. */
  | { tipo: 'status'; estados: { texto: string; tom: Tom; sub?: string }[] }
  /** Trilha de níveis: o carrinho anda até o nível `ate` e volta. */
  | { tipo: 'niveis'; niveis: { nome: string; sub?: string }[]; ate?: number }
  /** Formulário: o destaque passa de campo em campo, na ordem de preencher. */
  | { tipo: 'formulario'; titulo?: string; campos: { rotulo: string; valor?: string }[] }
  /** Comparação lado a lado (duas ou três colunas). */
  | { tipo: 'comparacao'; colunas: { titulo: string; icone: Icone; tom?: Tom; itens: string[] }[] };

export type PassoTutorial = {
  titulo: string;
  /** Parágrafo curto. `**trecho**` vira negrito. */
  texto: string;
  cena: Cena;
};

export type Publico = 'admin' | 'cliente' | 'lojista' | 'revendedor' | 'afiliado';

export type Tutorial = {
  id: string;
  publico: Publico;
  /** Nome da tela/função, aparece no topo da janela. */
  titulo: string;
  /** Uma linha de resumo, embaixo do título. */
  resumo: string;
  passos: PassoTutorial[];
};
