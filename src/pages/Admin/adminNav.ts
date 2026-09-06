// Menu do painel: os grupos e o título de cada rota.
//
// Fica fora de AdminLayout.tsx porque o Fast Refresh do Vite só funciona em
// arquivo que exporta apenas componentes.

export interface ItemNav {
  para: string;
  icone: string;
  rotulo: string;
  titulo: string;
  badge?: 'clientes' | 'garantias' | 'promo';
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
      { para: '/admin/produtos', icone: '🏷️', rotulo: 'Produtos', titulo: 'Produtos da loja' },
      { para: '/admin/pedidos', icone: '💳', rotulo: 'Pedidos & Pagamentos', titulo: 'Pedidos & Pagamentos' },
      { para: '/admin/logistica', icone: '📦', rotulo: 'Logística', titulo: 'Logística & Transportadoras' },
      { para: '/admin/erp', icone: '🔗', rotulo: 'Integração ERP', titulo: 'Integração NZERP' },
      { para: '/admin/afiliados', icone: '🤝', rotulo: 'Afiliados & Cupons', titulo: 'Afiliados & Cupons' },
    ],
  },
  {
    id: 'conteudo',
    nome: 'Conteúdo',
    itens: [
      { para: '/admin/blog', icone: '✍️', rotulo: 'Blog', titulo: 'Blog & Conteúdos' },
      { para: '/admin/blog-ia', icone: '🧠', rotulo: 'Motor SEO IA', titulo: 'Motor IA (SEO autônomo)' },
      { para: '/admin/promo', icone: '🎟️', rotulo: 'Páginas promocionais', titulo: 'Páginas promocionais', badge: 'promo' },
    ],
  },
  {
    id: 'marketing',
    nome: 'Marketing',
    itens: [
      { para: '/admin/agencia', icone: '🎨', rotulo: 'Agência NZ', titulo: 'Agência NZ' },
      { para: '/admin/agenda-social', icone: '📅', rotulo: 'Agenda Social', titulo: 'Agenda Social Media' },
      { para: '/admin/leads', icone: '📩', rotulo: 'Leads', titulo: 'Leads & Contatos' },
    ],
  },
  {
    id: 'clientes',
    nome: 'Clientes',
    itens: [
      { para: '/admin/clientes', icone: '🛒', rotulo: 'Clientes & Revendedores', titulo: 'Clientes & Revendedores', badge: 'clientes' },
      { para: '/admin/garantias', icone: '🛡️', rotulo: 'Garantias', titulo: 'Garantias oficiais', badge: 'garantias' },
    ],
  },
  {
    id: 'sistema',
    nome: 'Sistema',
    itens: [
      { para: '/admin/usuarios', icone: '🔐', rotulo: 'Usuários', titulo: 'Usuários do sistema' },
      { para: '/admin/configuracoes', icone: '⛭', rotulo: 'Configurações', titulo: 'Configurações globais' },
    ],
  },
];

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
