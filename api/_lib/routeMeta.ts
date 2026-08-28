// Meta tags por rota estática, espelhando os <SEO> definidos nas páginas React.
// Usado por api/render.ts para injetar title/description/OG no HTML servido —
// é o que crawlers sem JS (WhatsApp, Facebook, LinkedIn, Bing) enxergam.
// Se mudar um title numa página, atualize aqui também.

export interface RouteMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

export const routeMeta: Record<string, RouteMeta> = {
  '/': {
    title: 'O Melhor Envelopamento PPF e Adesivo Premium do Brasil',
    description: 'A NZ Distribuidora oferece o portfólio definitivo em envelopamento: PPF, vinil automotivo premium, comunicação visual Avery Dennison e vinil decorativo SH Decor e Etherna Decor.',
  },
  '/ppf': {
    title: 'Envelopamento PPF Premium | Catálogo Completo',
    description: 'As melhores linhas de Envelopamento PPF do Brasil. Proteção veicular com regeneração térmica, hidrofobia e até 12 anos de garantia.',
  },
  '/ppf/luxury-gloss': {
    title: 'NZPPF Luxury Gloss — PPF 190μ com 12 Anos de Garantia',
    description: 'PPF TPU alifático com nano-revestimento japonês: +32% de brilho, regeneração térmica e autolimpeza. 190μ e 12 anos de garantia. Para instaladores exigentes.',
  },
  '/ppf/prime-gloss': {
    title: 'NZPPF Prime Gloss — PPF 190μ com 10 Anos de Garantia',
    description: 'PPF de TPU 100% virgem com revestimento nano-dúplex, regeneração térmica e repelência. 190μ e 10 anos de garantia para proteção de pintura premium.',
  },
  '/ppf/flow-gloss': {
    title: 'NZPPF Flow Gloss — Nova Formulação com 7 Anos de Garantia',
    description: 'Nova formulação G2: TPU técnico de 2ª geração com top coat nano-hidrofóbico, agora em 185μ. Mais corpo, mais proteção e 7 anos de garantia — a linha intermediária de performance da NZPPF.',
  },
  '/ppf/core-gloss': {
    title: 'NZPPF Core Gloss — PPF 175μ com 3 Anos de Garantia',
    description: 'PPF híbrido projetado para máxima rentabilidade do instalador. 175μ, 3 anos de garantia e o melhor custo-benefício da linha NZPPF.',
  },
  '/ppf/headlight': {
    title: 'NZ PPF Headlight — Película para Faróis com 10 Anos de Garantia',
    description: 'PPF para faróis com estabilização UV em 3 tonalidades. Personalize o farol sem comprometer a luminosidade. 10 anos de garantia NZPPF.',
  },
  '/ppf/windshield': {
    title: 'NZ PPF Windshield — Película de Proteção para Parabrisa 190μ',
    description: 'PPF de parabrisa com absorção de impacto, compatível com sensores e ADAS. 190μ e 2 anos de garantia. Proteção invisível para o vidro do seu carro.',
  },
  '/wrap': {
    title: 'Adesivo Automotivo Premium | Catálogo de Envelopamento',
    description: 'Encontre o melhor adesivo automotivo e vinil para envelopamento na NZ Distribuidora. Marcas líderes como Oracal e NZWrap com centenas de cores.',
  },
  '/wrap/nzwrap-premium': {
    title: 'NZWRAP Premium — Envelopamento PVC Alto Brilho',
    description: 'Linha proprietária NZWRAP Premium: PVC alto brilho com curadoria exclusiva de cores, 3 anos de garantia e suporte direto da NZ Distribuidora.',
  },
  '/wrap/sh-colors': {
    title: 'SH Wrapping Colors — Vinil de Envelopamento 180μ',
    description: 'PVC multidirecional anti-bolhas 180μ nas versões Gloss, Matte, Color Shift e Metallic. Catálogo completo SH Wrapping Colors na NZ Distribuidora.',
  },
  '/wrap/oracal-970ra': {
    title: 'ORACAL 970RA — Vinil Premium de Envelopamento',
    description: 'ORACAL 970RA com tecnologia RapidAir anti-bolhas: o vinil alemão premium para envelopamento automotivo completo. Distribuição oficial NZ.',
  },
  '/wrap/oracal-651': {
    title: 'ORACAL 651 — Vinil para Recortes e Sinalização',
    description: 'ORACAL 651 com mais de 62 cores: vinil intermediário para recortes, sinalização e detalhes, 63μ e 6 anos de durabilidade. Pronta entrega NZ.',
  },
  '/wrap/oracal-670ra': {
    title: 'ORACAL 670RA — Vinil de Envelopamento RapidAir',
    description: 'ORACAL 670RA: evolução do 651 para envelopamento completo com tecnologia RapidAir anti-bolhas, 70μ em rolo de 1,52m. Distribuição oficial NZ.',
  },
  '/wrap/metamark-mcx': {
    title: 'MetaCast MCX — Envelopamento Cast Premium Metamark',
    description: 'MetaCast® MCX da Metamark: filme cast premium 100μ com adesivo MetaGlide®, 37 cores e garantia MetaSure™ de até 12 anos. Distribuição autorizada NZ.',
  },
  '/wrap/metamark-7-series': {
    title: 'Metamark 7 Series — Vinil de Recorte 70μ com 92 Cores',
    description: 'Metamark 7 Series: vinil polimérico calandrado 70μ com adesivo Apex, reação ao fogo Classe B e 92 cores com Pantone® e CMYK publicados. Larguras de 380 a 1.600 mm.',
  },
  '/sign': {
    title: 'NZSIGN — Comunicação Visual Avery Dennison',
    description: 'Distribuição Avery Dennison para comunicação visual no Brasil. Vinis calandrados MPI, sobrelaminados DOL, ETCHMARK, refletivos e filmes para vidros.',
  },
  '/decor': {
    title: 'NZDECOR — Envelopamento Decorativo Técnico | NZ Group',
    description: 'Vinil decorativo profissional: antibacteriano, antifúngico, resistente a chamas. SH Decor + Etherna Decor + consultoria técnica.',
  },
  '/decor/sh': {
    title: 'Catálogo SH Decor — Vinil Decorativo | NZDECOR',
    description: 'Todos os padrões SH Decor: madeira, pedra, cimento, couro, tecido, sólido, piso e tijolo. Vinil autoadesivo atóxico, lavável, Bubble Free. Orçamento via NZDecor.',
  },
  '/decor/etherna': {
    title: 'Catálogo Etherna Decor — Vinil Adesivo Decorativo | NZDECOR',
    description: 'Todos os padrões Etherna Decor: madeiras, marmorizados, fórmicas, pedras, metais, tecidos e geométricos. Indústria nacional, Sistema Shield®, entrega rápida. Orçamento via NZDecor.',
  },
  '/sobre': {
    title: 'Sobre a NZ Group — Distribuidora de PPF e Envelopamento',
    description: 'Conheça a NZ Group: operação completa de distribuição com inteligência comercial, logística nacional e compromisso real com o crescimento dos parceiros.',
  },
  '/encontre-aplicador': {
    title: 'Encontre um Aplicador Credenciado de PPF e Envelopamento',
    description: 'A NZ encaminha um especialista que negocia com a rede credenciada por você. Mais de 500 aplicadores certificados no Brasil. Contato em até 2h úteis.',
  },
  '/blog': {
    title: 'Blog - Tudo sobre PPF e Envelopamento Premium',
    description: 'Fique por dentro das novidades, tutoriais de aplicação e vantagens do Envelopamento PPF e Vinil Automotivo com o Blog da NZ Distribuidora.',
  },
  '/registro-garantia': {
    title: 'Registro de Garantia NZPPF — Certificado Digital',
    description: 'Registre a garantia da sua película NZPPF: certificado com hash único e assinatura digital vinculada a placa e chassi. Proteção Elite validada em tempo real.',
  },
  '/validar-garantia': {
    title: 'Validar Certificado de Garantia NZPPF',
    description: 'Valide a autenticidade do seu certificado de garantia NZPPF em tempo real usando o código do certificado.',
  },
  '/contato': {
    title: 'Fale Conosco — Atendimento a Lojistas e Aplicadores',
    description: 'Fale com a NZ Distribuidora: WhatsApp comercial, e-mail e atendimento de segunda a sexta, 08h às 18h. Consultoria técnica para lojistas e aplicadores de PPF e envelopamento.',
  },
  '/privacidade': {
    title: 'Política de Privacidade',
    description: 'Como a NZ Distribuidora coleta, utiliza e protege os dados pessoais informados no site, em conformidade com a LGPD.',
  },
  '/termos': {
    title: 'Termos de Uso',
    description: 'Condições de uso do site da NZ Distribuidora: conteúdo, garantias, registro de produtos e responsabilidades.',
  },
  // Campanha de evento: página de QR Code do estande, não deve ser indexada
  // (o brinde é para quem está no festival), mas precisa de OG para compartilhamento.
  '/interlagos': {
    title: 'Festival Interlagos 2026 — Brinde exclusivo NZ Group',
    description: 'A NZ Group está no Festival Interlagos, de 27 a 30 de agosto. Responda em menos de 1 minuto e desbloqueie um brinde exclusivo, enviado no seu endereço.',
    noindex: true,
  },
  // Rotas internas: servem o app normalmente, mas sinalizam noindex.
  '/admin': { title: 'Painel Administrativo', description: 'Área interna NZ.', noindex: true },
  '/login': { title: 'Login', description: 'Acesso ao painel NZ.', noindex: true },
  '/cadastro': { title: 'Cadastro', description: 'Cadastro no painel NZ.', noindex: true },
  '/ppf-promo': { title: 'NZPPF', description: 'Links NZPPF.', noindex: true },
  '/nzgroup-promo': { title: 'NZ Group', description: 'Links NZ Group.', noindex: true },
};
