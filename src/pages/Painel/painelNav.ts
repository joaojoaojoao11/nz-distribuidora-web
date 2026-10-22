// Menu da área do cliente: os grupos, o título de cada tela e a frase de
// contexto que aparece embaixo do nome no celular.
//
// Fica fora do PainelLayout pelo mesmo motivo do adminNav: o Fast Refresh do
// Vite só funciona em arquivo que exporta apenas componentes.
//
// A `dica` não é enfeite — no celular a página inicial É o menu, e uma lista de
// doze títulos sem contexto ("Pagamentos", "Cupons") faz o cliente abrir tela
// por tela para descobrir o que tem dentro.

export type Contador = 'pedidos' | 'carrinho' | 'garantias' | 'favoritos' | 'cupons' | 'selecoes';

export interface ItemPainel {
  para: string;
  icone: string;
  rotulo: string;
  titulo: string;
  dica: string;
  contador?: Contador;
  /**
   * Ferramenta de trabalho da equipe NZ, não da conta do cliente. Some do menu
   * para quem não é admin — e a rota também redireciona, porque esconder o item
   * não é o mesmo que proteger a tela.
   */
  soAdmin?: boolean;
  /** Botão "Como funciona" ao lado do título (ids de src/lib/tutoriais/conta.ts), com variante por tipo de acesso. */
  tutorial?: TutorialDaTela;
}

/** `padrao` vale para todos; as outras chaves trocam o tutorial para quem é daquele tipo (afiliado vem primeiro). */
export interface TutorialDaTela {
  padrao: string;
  afiliado?: string;
  lojista?: string;
  revendedor?: string;
  admin?: string;
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
        tutorial: { padrao: 'conta.pedidos' },
        contador: 'pedidos',
      },
      {
        para: '/painel/pagamentos',
        icone: '◎',
        rotulo: 'Pagamentos',
        titulo: 'Pagamentos',
        dica: 'Parcelas com a NZ, pagar pelo site e 2ª via',
        tutorial: { padrao: 'conta.pagamentos' },
      },
      {
        para: '/painel/carrinho',
        icone: '▭',
        rotulo: 'Carrinho guardado',
        titulo: 'Carrinho guardado',
        dica: 'O que você deixou para depois',
        tutorial: { padrao: 'conta.carrinho' },
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
        tutorial: { padrao: 'conta.listas' },
        contador: 'favoritos',
      },
      {
        para: '/painel/vistos',
        icone: '◷',
        rotulo: 'Vistos recentemente',
        titulo: 'Vistos recentemente',
        dica: 'Os últimos produtos que você abriu',
        tutorial: { padrao: 'conta.listas' },
      },
      {
        para: '/painel/selecoes',
        icone: '⊞',
        rotulo: 'Minhas seleções',
        titulo: 'Minhas seleções',
        dica: 'Links que você montou para clientes',
        tutorial: { padrao: 'conta.selecoes' },
        contador: 'selecoes',
        soAdmin: true,
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
        tutorial: { padrao: 'conta.dados' },
      },
      {
        para: '/painel/seguranca',
        icone: '⚿',
        rotulo: 'Senha e segurança',
        titulo: 'Senha e segurança',
        dica: 'E-mail de acesso, senha e último acesso',
        tutorial: { padrao: 'conta.seguranca' },
      },
      {
        para: '/painel/garantias',
        icone: '⛊',
        rotulo: 'Minhas garantias',
        titulo: 'Minhas garantias',
        dica: 'Certificados emitidos no seu nome',
        tutorial: { padrao: 'conta.garantias' },
        contador: 'garantias',
      },
    ],
  },
  {
    id: 'vantagens',
    nome: 'Vantagens',
    itens: [
      {
        para: '/painel/pontos',
        icone: '◆',
        rotulo: 'Pontos e cashback',
        titulo: 'Pontos e cashback',
        dica: 'Seu saldo e as trocas por crédito',
        tutorial: { padrao: 'conta.pontos' },
      },
      {
        para: '/painel/avaliacoes',
        icone: '★',
        rotulo: 'Minhas avaliações',
        titulo: 'Minhas avaliações',
        dica: 'Avalie o que comprou e ganhe pontos',
        tutorial: { padrao: 'conta.avaliacoes' },
      },
      {
        para: '/painel/indique',
        icone: '⇄',
        rotulo: 'Indique e ganhe',
        titulo: 'Indique e ganhe',
        dica: 'Seu link, seu cupom e suas comissões',
        tutorial: { padrao: 'conta.indique', afiliado: 'conta.indique-afiliado' },
      },
      {
        para: '/painel/cupons',
        icone: '◇',
        rotulo: 'Meus cupons',
        titulo: 'Meus cupons',
        dica: 'Códigos disponíveis para usar',
        tutorial: { padrao: 'conta.cupons' },
        contador: 'cupons',
      },
    ],
  },
];

export const TODOS_ITENS: ItemPainel[] = GRUPOS.flatMap((g) => g.itens);

/** Os grupos como este usuário os vê. Grupo que fica vazio some inteiro. */
export function gruposVisiveis(isAdmin: boolean): GrupoPainel[] {
  if (isAdmin) return GRUPOS;
  return GRUPOS.map((g) => ({ ...g, itens: g.itens.filter((i) => !i.soAdmin) })).filter((g) => g.itens.length > 0);
}

/** Título do cabeçalho a partir da rota. */
/** O tutorial da tela aberta, escolhido pelo tipo de acesso de quem está vendo. */
export function tutorialDaRota(pathname: string, quem: { role?: string | null; isAdmin: boolean; afiliado: boolean }): string | undefined {
  const item = TODOS_ITENS.find((i) => pathname === i.para || pathname.startsWith(i.para + '/'));
  const t = item?.tutorial;
  if (!t) return undefined;
  if (quem.afiliado && t.afiliado) return t.afiliado;
  if (quem.isAdmin && t.admin) return t.admin;
  if (quem.role === 'lojista' && t.lojista) return t.lojista;
  if (quem.role === 'reseller' && t.revendedor) return t.revendedor;
  return t.padrao;
}

export function tituloDaRota(pathname: string): string {
  if (pathname === '/painel' || pathname === '/painel/') return 'Minha conta';
  if (pathname.startsWith('/painel/pedido/')) return 'Pedido';
  for (const i of TODOS_ITENS) {
    if (pathname === i.para || pathname.startsWith(i.para + '/')) return i.titulo;
  }
  return 'Minha conta';
}
