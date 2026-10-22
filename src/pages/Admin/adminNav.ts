// Menu do painel: os grupos e o título de cada rota.
//
// Fica fora de AdminLayout.tsx porque o Fast Refresh do Vite só funciona em
// arquivo que exporta apenas componentes.

export interface ItemNav {
  para: string;
  icone: string;
  rotulo: string;
  titulo: string;
  badge?: 'clientes' | 'garantias' | 'promo' | 'central' | 'pedidos';
  /**
   * Botão "Como funciona" no cabeçalho da casca (id de src/lib/tutoriais/admin.ts).
   * Só na rota exata: subrotas e telas com <PaginaAdmin tutorial> põem o seu.
   */
  tutorial?: string;
}

interface Grupo {
  id: string;
  nome: string;
  itens: ItemNav[];
}

export const GRUPOS: Grupo[] = [
  {
    id: 'loja',
    nome: 'Loja',
    itens: [
      { para: '/admin/produtos', icone: '🏷️', rotulo: 'Produtos', titulo: 'Produtos da loja', tutorial: 'admin.produtos' },
      // Pedidos é só pedidos desde 20/10/2026; a configuração do checkout e a
      // integração Asaas foram para "Pagamento online", e a entrega para
      // Logística. O contador é o que pede um clique + o que está pago esperando.
      { para: '/admin/pedidos', icone: '🧾', rotulo: 'Pedidos', titulo: 'Pedidos da loja', badge: 'pedidos', tutorial: 'admin.pedidos' },
      { para: '/admin/pagamentos', icone: '💳', rotulo: 'Pagamento online', titulo: 'Pagamento online (Asaas)', tutorial: 'admin.pagamentos' },
      { para: '/admin/precos', icone: '🏷', rotulo: 'Tipos de acesso', titulo: 'Tipos de acesso: preço e visibilidade', tutorial: 'admin.precos' },
      { para: '/admin/logistica', icone: '📦', rotulo: 'Logística', titulo: 'Logística & Transportadoras', tutorial: 'admin.logistica' },
      { para: '/admin/erp', icone: '🔗', rotulo: 'Integração ERP', titulo: 'Integração NZERP', tutorial: 'admin.erp' },
      // Três telas desde 21/10/2026 (pedido do João): afiliados (com a tela de
      // cada um), cupons da NZ (campanha e nominal) e o super cupom dos clientes.
      { para: '/admin/afiliados', icone: '🤝', rotulo: 'Afiliados', titulo: 'Afiliados' },
      { para: '/admin/cupons', icone: '🎫', rotulo: 'Cupons', titulo: 'Cupons' },
      { para: '/admin/super-cupons', icone: '⭐', rotulo: 'Super cupons', titulo: 'Super cupons' },
      // Fase 4 (21/10/2026): saques da carteira — só leitura, o pagamento é no NZERP.
      { para: '/admin/saques', icone: '💸', rotulo: 'Saques', titulo: 'Saques de cashback' },
      { para: '/admin/avaliacoes', icone: '★', rotulo: 'Avaliações', titulo: 'Avaliações & Cashback', tutorial: 'admin.avaliacoes' },
    ],
  },
  {
    id: 'conteudo',
    nome: 'Conteúdo',
    itens: [
      { para: '/admin/blog', icone: '✍️', rotulo: 'Blog', titulo: 'Blog & Conteúdos', tutorial: 'admin.blog' },
      { para: '/admin/blog-ia', icone: '🧠', rotulo: 'Motor SEO IA', titulo: 'Motor IA (SEO autônomo)', tutorial: 'admin.blog-ia' },
      { para: '/admin/promo', icone: '🎟️', rotulo: 'Páginas promocionais', titulo: 'Páginas promocionais', badge: 'promo', tutorial: 'admin.promo' },
    ],
  },
  {
    id: 'marketing',
    nome: 'Marketing',
    itens: [
      { para: '/admin/agencia', icone: '🎨', rotulo: 'Agência NZ', titulo: 'Agência NZ', tutorial: 'admin.agencia' },
      { para: '/admin/agenda-social', icone: '📅', rotulo: 'Agenda Social', titulo: 'Agenda Social Media', tutorial: 'admin.agenda-social' },
      { para: '/admin/leads', icone: '📩', rotulo: 'Leads', titulo: 'Leads & Contatos', tutorial: 'admin.leads' },
    ],
  },
  {
    id: 'clientes',
    nome: 'Clientes',
    itens: [
      { para: '/admin/clientes', icone: '🛒', rotulo: 'Clientes & Revendedores', titulo: 'Clientes & Revendedores', badge: 'clientes', tutorial: 'admin.clientes' },
      { para: '/admin/garantias', icone: '🛡️', rotulo: 'Garantias', titulo: 'Garantias oficiais', badge: 'garantias', tutorial: 'admin.garantias' },
    ],
  },
  {
    id: 'sistema',
    nome: 'Sistema',
    itens: [
      // Primeiro do grupo de propósito: é a caixa de entrada do que deu errado.
      { para: '/admin/central', icone: '🚨', rotulo: 'Central', titulo: 'Central de erros e mudanças', badge: 'central', tutorial: 'admin.central' },
      { para: '/admin/usuarios', icone: '🔐', rotulo: 'Usuários', titulo: 'Usuários do sistema', tutorial: 'admin.equipe' },
      { para: '/admin/configuracoes', icone: '⛭', rotulo: 'Configurações', titulo: 'Configurações globais' },
    ],
  },
];

/** Tutorial do cabeçalho da casca: só na rota exata do item. */
export function tutorialDaRota(pathname: string): string | undefined {
  const limpo = pathname.replace(/\/+$/, '');
  if (limpo === '/admin') return 'admin.home';
  for (const g of GRUPOS) {
    for (const i of g.itens) {
      if (limpo === i.para) return i.tutorial;
    }
  }
  return undefined;
}

/** Título do cabeçalho a partir da rota (o editor de produto põe o seu). */
export function tituloDaRota(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/') return 'Dashboard';
  for (const g of GRUPOS) {
    for (const i of g.itens) {
      if (pathname === i.para || pathname.startsWith(i.para + '/')) return i.titulo;
    }
  }
  return 'Painel';
}
