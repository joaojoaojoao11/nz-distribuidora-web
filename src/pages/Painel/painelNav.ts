// Menu da área do cliente: os grupos, o título de cada tela e a frase de
// contexto que aparece embaixo do nome no celular.
//
// Fica fora do PainelLayout pelo mesmo motivo do adminNav: o Fast Refresh do
// Vite só funciona em arquivo que exporta apenas componentes.
//
// A `dica` não é enfeite — no celular a página inicial É o menu, e uma lista de
// doze títulos sem contexto ("Pagamentos", "Cupons") faz o cliente abrir tela
// por tela para descobrir o que tem dentro.

export type Contador = 'pedidos' | 'carrinho' | 'garantias' | 'favoritos' | 'cupons';

export interface ItemPainel {
  para: string;
  icone: string;
  rotulo: string;
  titulo: string;
  dica: string;
  contador?: Contador;
}

export interface GrupoPainel {
  id: string;
  nome: string;
  itens: ItemPainel[];
}

export const GRUPOS: GrupoPainel[] = [
  {
    id: 'compras',
    nome: 'Compras',
    itens: [
      {
        para: '/painel/pedidos',
        icone: '▤',
        rotulo: 'Pedidos',
        titulo: 'Meus pedidos',
        dica: 'Status, itens e comprar de novo',
        contador: 'pedidos',
      },
      {
        para: '/painel/pagamentos',
        icone: '◎',
        rotulo: 'Pagamentos',
        titulo: 'Pagamentos',
        dica: '2ª via de boleto, Pix e recibo',
      },
      {
        para: '/painel/carrinho',
        icone: '▭',
        rotulo: 'Carrinho guardado',
        titulo: 'Carrinho guardado',
        dica: 'O que você deixou para depois',
        contador: 'carrinho',
      },
    ],
  },
  {
    id: 'catalogo',
    nome: 'Catálogo',
    itens: [
      {
        para: '/painel/favoritos',
        icone: '♥',
        rotulo: 'Favoritos',
        titulo: 'Favoritos',
        dica: 'As cores que você separou',
        contador: 'favoritos',
      },
      {
        para: '/painel/vistos',
        icone: '◷',
        rotulo: 'Vistos recentemente',
        titulo: 'Vistos recentemente',
        dica: 'Os últimos produtos que você abriu',
      },
    ],
  },
  {
    id: 'conta',
    nome: 'Conta',
    itens: [
      {
        para: '/painel/dados',
        icone: '✎',
        rotulo: 'Meus dados',
        titulo: 'Meus dados',
        dica: 'Nome, CPF/CNPJ, telefone e endereço',
      },
      {
        para: '/painel/seguranca',
        icone: '⚿',
        rotulo: 'Senha e segurança',
        titulo: 'Senha e segurança',
        dica: 'E-mail de acesso, senha e último acesso',
      },
      {
        para: '/painel/garantias',
        icone: '⛊',
        rotulo: 'Minhas garantias',
        titulo: 'Minhas garantias',
        dica: 'Certificados emitidos no seu nome',
        contador: 'garantias',
      },
    ],
  },
  {
    id: 'vantagens',
    nome: 'Vantagens',
    itens: [
      {
        para: '/painel/indique',
        icone: '⇄',
        rotulo: 'Indique e ganhe',
        titulo: 'Indique e ganhe',
        dica: 'Seu link, seu cupom e suas comissões',
      },
      {
        para: '/painel/cupons',
        icone: '◇',
        rotulo: 'Meus cupons',
        titulo: 'Meus cupons',
        dica: 'Códigos disponíveis para usar',
        contador: 'cupons',
      },
    ],
  },
];

export const TODOS_ITENS: ItemPainel[] = GRUPOS.flatMap((g) => g.itens);

/** Título do cabeçalho a partir da rota. */
export function tituloDaRota(pathname: string): string {
  if (pathname === '/painel' || pathname === '/painel/') return 'Minha conta';
  if (pathname.startsWith('/painel/pedido/')) return 'Pedido';
  for (const i of TODOS_ITENS) {
    if (pathname === i.para || pathname.startsWith(i.para + '/')) return i.titulo;
  }
  return 'Minha conta';
}
