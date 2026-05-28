export type AverySpec = { label: string; value: string };
export type AverySubLine = { code: string; name: string; description: string };

export type AveryFamily = {
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  longDescription: string;
  badges: string[];
  applications: string[];
  specs: AverySpec[];
  subLines?: AverySubLine[];
  features: { title: string; text: string }[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  available: boolean;
};

export const averyFamilies: AveryFamily[] = [
  {
    slug: 'mpi',
    name: 'MPI · IMPRESSÃO DIGITAL',
    shortName: 'MPI',
    subtitle: 'Calandrado polimérico premium para impressão',
    description:
      'Linha de filmes calandrados receptivos a impressão digital. MPI 1105 (premium 5–7 anos), MPI 2105 (médio prazo), MPI 2800 (paredes texturizadas), MPI 3000/3100 (impressão eco-solvente/solvente/látex/UV), MPI 3800 Value Film (curto prazo, alto giro).',
    longDescription:
      'A família MPI é o coração da linha Avery Dennison para comunicação visual impressa. São filmes calandrados poliméricos receptivos a impressão digital em todas as tecnologias do mercado — eco-solvente, solvente, látex HP e UV — com topcoat especialmente formulado para reproduzir cores vivas, gradientes suaves e detalhes finos com fidelidade. Combinada com o sobrelaminado DOL correspondente, a linha MPI integra o sistema ICS (Integrated Component System), que garante cobertura técnica integral do conjunto filme + laminado conforme especificação Avery.',
    badges: ['5 SUB-LINHAS', '5–7 ANOS', 'EASY APPLY RS'],
    applications: [
      'Envelopamento de frotas comerciais e veículos publicitários',
      'Comunicação visual de fachadas e empenas',
      'Sinalização interna corporativa',
      'Stands de feira e ambientações temporárias',
      'Adesivos decorativos de paredes (linha 2800)',
      'Sinalização de obra e canteiro',
    ],
    specs: [
      { label: 'Tipo de filme', value: 'Calandrado polimérico' },
      { label: 'Espessura', value: '60–80 microns (varia por sub-linha)' },
      { label: 'Durabilidade externa', value: 'Até 7 anos (MPI 1105)' },
      { label: 'Tecnologia adesiva', value: 'Easy Apply RS reposicionável' },
      { label: 'Impressão compatível', value: 'Eco-solvente, solvente, látex HP, UV' },
      { label: 'Largura padrão', value: '1,37m e 1,52m' },
    ],
    subLines: [
      {
        code: 'MPI 1105',
        name: 'Premium 5–7 anos',
        description:
          'Top de linha. Calandrado polimérico premium com Easy Apply RS e topcoat de altíssima fidelidade cromática. Ideal para frotas, fachadas e comunicação visual de longo prazo.',
      },
      {
        code: 'MPI 2105',
        name: 'Médio prazo',
        description:
          'Equilíbrio entre custo e durabilidade. Recomendado para sinalização externa de médio prazo (3–5 anos) e produção em escala.',
      },
      {
        code: 'MPI 2800',
        name: 'Paredes texturizadas',
        description:
          'Filme calandrado com adesivo desenvolvido especificamente para superfícies texturizadas — paredes pintadas com textura grossa, tijolinho, gesso aparente. Aderência superior em substratos difíceis.',
      },
      {
        code: 'MPI 3000/3100',
        name: 'Impressão multi-tecnologia',
        description:
          'Linha econômica receptiva a eco-solvente, solvente, látex e UV. Excelente custo-benefício para alto giro e impressão em grande formato.',
      },
      {
        code: 'MPI 3800 Value Film',
        name: 'Curto prazo, alto giro',
        description:
          'Solução econômica para campanhas curtas (1–3 anos), eventos sazonais, promoções e comunicação temporária com alta rotatividade.',
      },
    ],
    features: [
      {
        title: 'Easy Apply RS · Aplicação reposicionável',
        text: 'Adesivo especial que permite reposicionar o filme antes da aderência final, liberando bolhas de ar para uma aplicação limpa e sem refugo. Reduz tempo de instalação em até 40%.',
      },
      {
        title: 'Sistema ICS · Cobertura integrada',
        text: 'Quando o MPI é aplicado em combinação com o sobrelaminado DOL correspondente, a Avery cobre o conjunto completo conforme a especificação técnica de fábrica.',
      },
      {
        title: 'Topcoat receptivo',
        text: 'A camada de superfície foi projetada para receber tinta de todas as principais tecnologias de impressão digital (eco-solvente, solvente, látex e UV) com excelente definição de cor.',
      },
      {
        title: 'Conformabilidade',
        text: 'Filme polimérico com boa conformabilidade para curvas suaves e superfícies levemente onduladas, ideal para CV de frota e fachada plana.',
      },
    ],
    seo: {
      title: 'Avery MPI 1105 · MPI 2105 · MPI 3000 — Vinil Calandrado para Impressão Digital',
      description:
        'Filmes calandrados Avery Dennison para impressão digital: MPI 1105, MPI 2105, MPI 2800, MPI 3000, MPI 3100 e MPI 3800 Value Film. Distribuição NZSIGN no Brasil.',
      keywords:
        'avery mpi 1105, avery mpi 2105, avery mpi 2800, avery mpi 3000, vinil calandrado impressão digital, comunicação visual, easy apply rs, sistema ics',
    },
    available: true,
  },
  {
    slug: 'slp',
    name: 'SLP · RECORTES PREMIUM',
    shortName: 'SLP',
    subtitle: 'Supreme Light Plot — recortes finos e letreiramento',
    description:
      'Filme calandrado de alta qualidade para letreiramentos complexos e recortes em letras pequenas. Estabilidade dimensional superior, recorte limpo, durabilidade 5–7 anos.',
    longDescription:
      'A linha SLP — Supreme Light Plot — foi formulada para um problema específico do comunicador visual: recortar letras pequenas, símbolos finos e formas complexas sem que o filme se distorça, rasgue ou perca definição na hora do transfer. É um calandrado com estabilidade dimensional acima da média, comportamento previsível no plotter e remoção limpa dos negativos. Indicado para letreiramento de fachada, identificação de frota com tipografia delicada, e qualquer aplicação onde a precisão do recorte importa mais que o volume impresso.',
    badges: ['RECORTE FINO', '5–7 ANOS', 'LETREIRAMENTO'],
    applications: [
      'Letreiramento de fachadas e vitrines',
      'Identificação corporativa em frota leve',
      'Recortes tipográficos em letras pequenas',
      'Sinalização interna premium',
      'Logos e símbolos com geometria complexa',
      'Comunicação visual de varejo',
    ],
    specs: [
      { label: 'Tipo de filme', value: 'Calandrado polimérico premium' },
      { label: 'Espessura', value: '~70 microns' },
      { label: 'Durabilidade externa', value: '5–7 anos' },
      { label: 'Estabilidade dimensional', value: 'Superior (recorte preciso)' },
      { label: 'Acabamentos', value: 'Gloss e Matte' },
      { label: 'Largura padrão', value: '1,22m e 1,52m' },
    ],
    features: [
      {
        title: 'Estabilidade dimensional',
        text: 'Filme com baixa retração e comportamento previsível no plotter — o recorte fica fiel ao traço, mesmo em letras pequenas e detalhes finos.',
      },
      {
        title: 'Remoção limpa do negativo',
        text: 'A linha SLP foi formulada para que o "esqueleto" do recorte saia inteiro, sem rasgar ou deixar resíduo, agilizando o trabalho de preparo do transfer.',
      },
      {
        title: 'Durabilidade externa',
        text: '5–7 anos de durabilidade externa em aplicações verticais, equivalente às melhores linhas de impressão da Avery.',
      },
      {
        title: 'Paleta de cores selecionada',
        text: 'Cores selecionadas para letreiramento profissional, com excelente fidelidade cromática e resistência ao desbotamento UV.',
      },
    ],
    seo: {
      title: 'Avery SLP Supreme Light Plot — Vinil para Recortes e Letreiramento',
      description:
        'Vinil calandrado Avery SLP para recortes finos, letreiramento de fachadas, identificação de frota e sinalização premium. Distribuição NZSIGN.',
      keywords:
        'avery slp, supreme light plot, vinil recorte, letreiramento fachada, vinil letra pequena, plotter recorte, comunicação visual',
    },
    available: true,
  },
  {
    slug: 'dol',
    name: 'DOL · SOBRELAMINAÇÃO',
    shortName: 'DOL',
    subtitle: 'Proteção UV e mecânica para impressos',
    description:
      'Sobrelaminados para os filmes impressos. DOL 1080/1360/1460 (linha padrão gloss/matte/luster), DOL 2080/2460 (premium com anti-graffiti e anti-risco). Aumenta a vida útil do conjunto em 30–50%.',
    longDescription:
      'A linha DOL — Digital Overlaminate — é o sobrelaminado que fecha o sistema ICS junto com os filmes MPI/SLP. É uma camada transparente aplicada sobre o impresso que protege contra raios UV, abrasão mecânica, riscos, agentes químicos de limpeza e, nas versões premium, contra grafites e pichação. Sem sobrelaminado, a tinta digital exposta perde vida rapidamente — com DOL, a durabilidade do conjunto pode aumentar de 30% a 50%, mantendo brilho, cor e legibilidade ao longo de toda a vida útil do filme base.',
    badges: ['GLOSS · MATTE · LUSTER', 'ANTI-GRAFFITI', 'PROTEÇÃO UV'],
    applications: [
      'Sobrelaminação de envelopamento impresso de frota',
      'Proteção de comunicação visual externa',
      'Adesivos de fachada e sinalização urbana',
      'Frota pública e veículos de transporte (anti-graffiti)',
      'Pisos vinílicos com tráfego intenso',
      'Sinalização de obra com risco de manuseio',
    ],
    specs: [
      { label: 'Tipo', value: 'Sobrelaminado calandrado transparente' },
      { label: 'Acabamentos', value: 'Gloss, Matte, Luster' },
      { label: 'Proteção UV', value: 'Sim, todas as versões' },
      { label: 'Anti-graffiti', value: 'Versões premium (DOL 2080/2460)' },
      { label: 'Anti-risco', value: 'Topcoat resistente à abrasão' },
      { label: 'Ganho de durabilidade', value: '30–50% sobre filme nu' },
    ],
    subLines: [
      {
        code: 'DOL 1080',
        name: 'Gloss padrão',
        description:
          'Sobrelaminado gloss padrão para uso com os filmes MPI da linha 1000. Acabamento brilhante que realça as cores do impresso e protege contra UV e abrasão.',
      },
      {
        code: 'DOL 1360',
        name: 'Matte padrão',
        description:
          'Versão matte (fosca) com acabamento sem reflexo, ideal para fachadas, sinalização e aplicações que precisam evitar brilho indesejado.',
      },
      {
        code: 'DOL 1460',
        name: 'Luster padrão',
        description:
          'Acabamento luster (semi-gloss) que combina o realce de cor do gloss com a sofisticação visual do matte. Equilíbrio premium.',
      },
      {
        code: 'DOL 2080',
        name: 'Premium anti-graffiti gloss',
        description:
          'Versão premium com tecnologia anti-graffiti — tinta spray e pichação podem ser limpas sem dano ao filme. Ideal para frota pública e fachadas urbanas.',
      },
      {
        code: 'DOL 2460',
        name: 'Premium anti-graffiti luster',
        description:
          'Acabamento luster premium com anti-graffiti e maior resistência mecânica. Aplicação em ambientes urbanos críticos.',
      },
    ],
    features: [
      {
        title: 'Proteção UV completa',
        text: 'Bloqueia raios UV-A e UV-B que degradam as tintas digitais, mantendo as cores vivas por anos a mais.',
      },
      {
        title: 'Anti-graffiti (premium)',
        text: 'Nas versões DOL 2080/2460, a tinta de grafite pode ser removida com solvente apropriado sem danificar a camada de proteção.',
      },
      {
        title: 'Resistência mecânica',
        text: 'Topcoat resistente a riscos de chaves, manuseio, lavagem automatizada e abrasão por agentes de limpeza.',
      },
      {
        title: 'Sistema ICS',
        text: 'Quando combinado com o filme MPI correspondente, integra o sistema ICS que garante cobertura técnica do conjunto pela Avery.',
      },
    ],
    seo: {
      title: 'Avery DOL 1080 · DOL 1360 · DOL 2080 — Sobrelaminado para Comunicação Visual',
      description:
        'Sobrelaminados Avery Dennison DOL para proteção UV, anti-graffiti e anti-risco. Aumenta durabilidade do conjunto em 30–50%. Distribuição NZSIGN.',
      keywords:
        'avery dol 1080, avery dol 1360, avery dol 2080, sobrelaminado vinil, laminação anti-graffiti, proteção uv comunicação visual',
    },
    available: true,
  },
  {
    slug: 'etchmark',
    name: 'ETCHMARK · EFEITO JATEADO',
    shortName: 'ETCHMARK',
    subtitle: 'Decoração de vidro com efeito jateado premium',
    description:
      'Filme calandrado com acabamento fosco translúcido que reproduz a aparência do vidro jateado, sem o custo e a permanência do jateamento real. Ideal para portas de escritório, divisórias e fachadas comerciais.',
    longDescription:
      'O Avery Etchmark é a alternativa profissional ao jateamento real de vidro. É um filme calandrado com acabamento fosco translúcido que simula com altíssima fidelidade a aparência do vidro jateado — mesma textura visual, mesma capacidade de filtrar a luz mantendo a luminosidade, mesma elegância. A diferença está na reversibilidade: o Etchmark é aplicado e removido sem dano ao vidro, permitindo trocar a comunicação visual a qualquer momento. É a solução padrão para portas de escritório, divisórias internas, fachadas comerciais e identidade visual em ambientes corporativos.',
    badges: ['INDOOR', '5–7 ANOS', 'REVERSÍVEL'],
    applications: [
      'Portas de escritório e salas de reunião',
      'Divisórias internas corporativas',
      'Fachadas e vitrines comerciais',
      'Identificação de departamentos e setores',
      'Sinalização interna premium',
      'Privacidade visual em ambientes corporativos',
    ],
    specs: [
      { label: 'Tipo de filme', value: 'Calandrado polimérico com topcoat fosco' },
      { label: 'Acabamento', value: 'Fosco translúcido (efeito jateado)' },
      { label: 'Durabilidade', value: '5–7 anos (indoor)' },
      { label: 'Compatível com', value: 'Recorte e impressão digital' },
      { label: 'Substrato', value: 'Vidro liso (limpo e desengordurado)' },
      { label: 'Remoção', value: 'Limpa, sem resíduo' },
    ],
    features: [
      {
        title: 'Efeito visual idêntico ao jateamento',
        text: 'Textura fosca translúcida que reproduz com fidelidade a aparência do vidro jateado real, sem distinção visual à distância normal.',
      },
      {
        title: 'Reversível',
        text: 'Diferente do jateamento permanente, o Etchmark pode ser removido a qualquer momento sem danificar o vidro. Permite trocar a comunicação conforme a necessidade.',
      },
      {
        title: 'Recortável e imprimível',
        text: 'Aceita recorte para logos, textos e formas, ou impressão digital para padrões customizados — flexibilidade total de design.',
      },
      {
        title: 'Custo-benefício',
        text: 'Investimento muito menor que jateamento real, com instalação mais rápida e sem exigir profissional especializado em vidraçaria.',
      },
    ],
    seo: {
      title: 'Avery Etchmark — Filme Adesivo Efeito Jateado para Vidros',
      description:
        'Avery Etchmark: filme adesivo com efeito vidro jateado para portas, divisórias e fachadas. Reversível, fácil aplicação. Distribuição NZSIGN.',
      keywords:
        'avery etchmark, vidro jateado adesivo, filme jateado, decoração vidro escritório, divisória de vidro, comunicação visual corporativa',
    },
    available: true,
  },
  {
    slug: 'mascara',
    name: 'MASCARA · APPLICATION TAPE',
    shortName: 'MASCARA',
    subtitle: 'Fita de transferência profissional',
    description:
      'Application tape Avery para transferência de letras e recortes em vinil. Tack médio calibrado pra não rasgar o recorte, com transparências variáveis para conferência no momento da aplicação.',
    longDescription:
      'A linha Mascara é a fita de transferência (application tape) profissional da Avery. É o que o aplicador usa entre o recorte e o substrato final: a fita pega o vinil recortado do papel de base, leva ele inteiro até o lugar de aplicação, e depois é removida deixando o recorte alinhado no destino. O ponto crítico é o tack — adesão da fita. Forte demais, rasga o recorte. Fraco demais, perde letras no caminho. A linha Mascara tem tack médio calibrado para os filmes Avery, e oferece variantes transparentes que permitem ver e ajustar o alinhamento antes da aplicação final.',
    badges: ['TRANSFER PRO', 'TACK MÉDIO'],
    applications: [
      'Transferência de recortes em letras e logos',
      'Aplicação de sinalização vinílica em ambientes corporativos',
      'Letreiramento de fachadas',
      'Aplicação de identificação em frota',
      'Comunicação visual em geral com recorte',
      'Stands, eventos e ambientações temporárias',
    ],
    specs: [
      { label: 'Tipo', value: 'Application tape (fita de transferência)' },
      { label: 'Tack', value: 'Médio calibrado' },
      { label: 'Variantes', value: 'Translúcida e transparente' },
      { label: 'Compatibilidade', value: 'Todos os filmes Avery (MPI/SLP)' },
      { label: 'Largura', value: 'Variável conforme bobina' },
    ],
    features: [
      {
        title: 'Tack calibrado',
        text: 'Adesão na medida certa: forte o suficiente para erguer recortes finos sem perder letras, suave o suficiente para não rasgar o vinil no destino.',
      },
      {
        title: 'Variante transparente',
        text: 'Permite enxergar o recorte através da fita, facilitando o alinhamento no substrato antes da aplicação definitiva.',
      },
      {
        title: 'Compatibilidade Avery',
        text: 'Formulação calibrada para o sistema completo Avery — funciona perfeitamente com os filmes MPI, SLP e demais linhas.',
      },
      {
        title: 'Performance profissional',
        text: 'Material de qualidade industrial usado pelos principais comunicadores visuais do mundo. Sem rasgo, sem resíduo, sem dor de cabeça.',
      },
    ],
    seo: {
      title: 'Avery Mascara — Application Tape Profissional para Vinil',
      description:
        'Fita de transferência Avery Mascara: tack médio calibrado, variantes transparentes. Para transferência de recortes em vinil. Distribuição NZSIGN.',
      keywords:
        'avery mascara, application tape, fita de transferência, transfer tape vinil, fita transferência letras, comunicação visual aplicação',
    },
    available: true,
  },
  {
    slug: 'reflective-window',
    name: 'REFLECTIVE · WINDOW FILMS',
    shortName: 'REFLECTIVE & WINDOW',
    subtitle: 'Refletivos viários e filmes para vidros',
    description:
      'Filmes refletivos (MPI 1900) com microesferas para sinalização viária, faixas de segurança e identificação de frota. Filmes para janelas (estáticos, adesivos e perfurados one-way vision) para vitrines e ambientes corporativos.',
    longDescription:
      'Esta família agrupa duas categorias técnicas que compartilham um perfil: especialidades para aplicações onde o filme tem função além da estética. Os refletivos MPI 1900 incorporam microesferas que devolvem luz à fonte — usados em sinalização viária, faixas de segurança DENATRAN, identificação noturna de frota e veículos de emergência. Já os Window Films cobrem desde filmes estáticos para vitrines (sem cola, fácil troca de campanha) até os perfurados one-way vision, que permitem comunicação externa sem bloquear a visibilidade de dentro pra fora — usados em ônibus, vitrines e fachadas corporativas.',
    badges: ['DENATRAN/INMETRO', 'ONE-WAY VISION', 'MICROESFERAS'],
    applications: [
      'Sinalização viária e faixas de segurança',
      'Identificação noturna de frota',
      'Faixas DENATRAN em veículos comerciais',
      'Comunicação visual em vitrines (window film)',
      'Adesivação de ônibus e veículos de transporte público',
      'Privacidade visual com one-way vision',
      'Sinalização de emergência e socorro',
    ],
    specs: [
      { label: 'Refletivo · Tipo', value: 'MPI 1900 com microesferas' },
      { label: 'Refletivo · Certificações', value: 'DENATRAN / INMETRO (linhas certificadas)' },
      { label: 'Window · One-way vision', value: 'Sim — comunicação externa, visão interna' },
      { label: 'Window · Variantes', value: 'Estático, adesivo, perfurado' },
      { label: 'Aplicação', value: 'Vidros, frota, sinalização viária' },
      { label: 'Durabilidade', value: 'Varia por sub-linha (consultar)' },
    ],
    features: [
      {
        title: 'Reflexão por microesferas',
        text: 'Os filmes MPI 1900 incorporam microesferas que retornam a luz incidente à fonte, garantindo visibilidade noturna mesmo a longas distâncias.',
      },
      {
        title: 'Certificações DENATRAN',
        text: 'Linhas refletivas atendem às normas brasileiras DENATRAN e INMETRO para sinalização veicular obrigatória e faixas de segurança.',
      },
      {
        title: 'One-Way Vision',
        text: 'Filme perfurado que permite imprimir gráficos do lado externo sem bloquear a visão de dentro para fora — usado em vitrines, ônibus e fachadas.',
      },
      {
        title: 'Window film estático',
        text: 'Versão sem cola, aderência por estática molecular ao vidro. Permite trocar campanhas frequentes sem resíduo e sem dano ao vidro.',
      },
    ],
    seo: {
      title: 'Avery MPI 1900 Reflective · Window Films — Refletivos e Filmes para Vidros',
      description:
        'Avery MPI 1900 refletivo com microesferas (DENATRAN/INMETRO) e linha Window Films one-way vision. Sinalização viária e vitrines. Distribuição NZSIGN.',
      keywords:
        'avery mpi 1900, vinil refletivo, faixa denatran, sinalização viária, one way vision, window film, vinil perfurado, adesivo vitrine',
    },
    available: true,
  },
];

export function getFamilyBySlug(slug: string | undefined): AveryFamily | undefined {
  if (!slug) return undefined;
  return averyFamilies.find((f) => f.slug === slug);
}
