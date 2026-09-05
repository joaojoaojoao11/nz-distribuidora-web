// Estrutura do menu MOBILE.
//
// Existe separado de propósito. O menu do desktop é uma fileira de logotipos
// com dropdowns posicionados — cada item tem tratamento visual próprio (alturas
// diferentes por marca, caixa roxa da Metamark, recorte da NZSIGN). Reaproveitar
// aquele markup dentro de um overlay foi exatamente o que deixou o menu do
// celular desconfigurado: logos de 80px empilhados, dropdowns virando duas
// colunas e a lista estourando a altura da tela.
//
// Aqui é o oposto: uma lista de texto, uma coluna, hierarquia por indentação.

export interface NavItem {
  label: string;
  to: string;
  /** Sub-itens sempre visíveis — o menu é lista, não acordeão. */
  children?: { label: string; to: string; hint?: string }[];
  /** Casar a rota exata em vez de por prefixo (Home). */
  exact?: boolean;
}

/**
 * `contagens` vem de fora porque os catálogos decor são carregados no Navbar
 * e não vale importá-los aqui só para contar.
 */
export function buildNavItems(contagens: { shDecor: number; etherna: number }): NavItem[] {
  return [
    { label: 'Home', to: '/', exact: true },
    { label: 'NZPPF', to: '/ppf' },
    {
      label: 'NZWRAP',
      to: '/wrap',
      children: [
        { label: 'NZWrap Premium', to: '/wrap/nzwrap-premium' },
        { label: 'SH Wrapping', to: '/wrap/sh-colors' },
        { label: 'MetaCast MCX', to: '/wrap/metamark-mcx' },
        { label: 'Metamark 7 Series', to: '/wrap/metamark-7-series' },
        { label: 'Oracal 970RA', to: '/wrap/oracal-970ra' },
        { label: 'Oracal 670RA', to: '/wrap/oracal-670ra' },
        { label: 'Oracal 651', to: '/wrap/oracal-651' },
      ],
    },
    { label: 'NZSIGN', to: '/sign' },
    {
      label: 'NZDECOR',
      to: '/decor',
      children: [
        { label: 'SH Decor', to: '/decor/sh', hint: `${contagens.shDecor} padrões` },
        { label: 'Etherna', to: '/decor/etherna', hint: `${contagens.etherna} padrões` },
      ],
    },
    { label: 'Empresa', to: '/sobre' },
    { label: 'Blog', to: '/blog' },
    { label: 'Encontre um aplicador', to: '/encontre-aplicador' },
    { label: 'Registro de garantia', to: '/registro-garantia' },
  ];
}
