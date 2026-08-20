// FAQ visível das 6 páginas NZPPF. ESPELHO de api/_lib/ppfLines.ts (que gera o
// FAQPage schema no edge) — se mudar uma pergunta aqui, mude lá também.
// A regra do Google: schema de FAQ só vale se as perguntas aparecem na página.

export interface PpfFaqItem {
  question: string;
  answer: string;
}

export const PPF_FAQS: Record<string, PpfFaqItem[]> = {
  '/ppf/luxury-gloss': [
    { question: 'Qual a espessura e a garantia do NZPPF Luxury Gloss?', answer: 'O Luxury Gloss usa TPU alifático de 190 micras e tem 12 anos de garantia — a maior da linha NZPPF.' },
    { question: 'O NZPPF Luxury Gloss se regenera sozinho?', answer: 'Sim. Micro-riscos desaparecem com o calor do sol ou água morna, graças à tecnologia de auto-regeneração térmica do top coat.' },
    { question: 'O Luxury Gloss deixa o carro mais brilhante?', answer: 'Sim: o nano-revestimento japonês potencializa o brilho original da pintura em até 32%, além de repelir água e sujeira.' },
    { question: 'Como valer a garantia de 12 anos?', answer: 'A aplicação precisa ser feita por instalador credenciado NZ, que registra a apólice oficial com QR code no momento do serviço.' },
  ],
  '/ppf/prime-gloss': [
    { question: 'Qual a diferença entre o Prime Gloss e o Luxury Gloss?', answer: 'Ambos têm 190 micras; o Prime Gloss oferece 10 anos de garantia (contra 12 do Luxury) com custo menor — o melhor equilíbrio para a maioria dos projetos premium.' },
    { question: 'O NZPPF Prime Gloss protege contra o quê?', answer: 'Riscos, pedras da estrada, oxidação, chuva ácida e detritos — a película absorve o impacto no lugar da pintura.' },
    { question: 'Quanto tempo dura o Prime Gloss?', answer: 'A garantia oficial é de 10 anos quando aplicado por instalador credenciado NZ com apólice registrada.' },
    { question: 'Quem pode aplicar o Prime Gloss?', answer: 'Qualquer estética pode comprar no atacado com a NZ, mas só instaladores credenciados emitem a garantia oficial de 10 anos.' },
  ],
  '/ppf/flow-gloss': [
    { question: 'Qual a espessura e a garantia do NZPPF Flow Gloss?', answer: 'O Flow Gloss passou a ter 185 micras de espessura e, com a nova formulação G2, 7 anos de garantia registrada em apólice.' },
    { question: 'O que mudou na nova formulação do Flow Gloss?', answer: 'A linha ganhou dez micras a mais de corpo, subindo de 175 para 185 micras, e estreou o TPU Técnico G2 com um novo top coat nano-hidrofóbico: mais absorção de impacto, mais estabilidade sob UV, repelência reforçada e auto-cura mais rápida de micro-riscos. Foi esse conjunto que permitiu estender a garantia de 4 para 7 anos.' },
    { question: 'Para quem é o Flow Gloss?', answer: 'É a linha intermediária de performance da NZPPF: para quem quer durabilidade real de longo prazo em um filme de 185 micras, bem acima da Core e logo abaixo dos 190 micras das linhas Prime e Luxury.' },
    { question: 'O Flow Gloss amarela com o tempo?', answer: 'Não dentro do prazo de garantia: o TPU G2 resiste a UV e oxidação por 7 anos com manutenção adequada.' },
    { question: 'Como ativar a garantia do Flow Gloss?', answer: 'A aplicação por instalador credenciado NZ gera a apólice oficial com QR code — sem ela, não há garantia de fábrica.' },
  ],
  '/ppf/core-gloss': [
    { question: 'Qual a espessura e a garantia do NZPPF Core Gloss?', answer: 'O Core Gloss tem 175 micras e 3 anos de garantia — a porta de entrada da proteção NZPPF.' },
    { question: 'Vale a pena o Core Gloss em vez de não usar PPF?', answer: 'Sim: mesmo a linha de entrada absorve riscos e pedradas que iriam direto para a pintura, preservando o valor de revenda do veículo.' },
    { question: 'O Core Gloss serve para frota?', answer: 'É a linha ideal para volume: custo acessível no atacado e proteção real por 3 anos.' },
    { question: 'Quem aplica o Core Gloss com garantia?', answer: 'Instaladores credenciados NZ, que registram a apólice oficial na hora da aplicação.' },
  ],
  '/ppf/headlight': [
    { question: 'O que o NZPPF Headlight protege?', answer: 'Os faróis do veículo — contra amarelamento por UV, riscos, pedradas e trincas, mantendo a transparência original por 10 anos de garantia.' },
    { question: 'PPF de farol escurece a iluminação?', answer: 'Não: a película é opticamente transparente e não interfere no facho de luz nem na homologação do farol.' },
    { question: 'Quanto tempo dura o NZPPF Headlight?', answer: 'A garantia oficial é de 10 anos quando aplicado por instalador credenciado NZ.' },
    { question: 'Farol já amarelado pode receber Headlight?', answer: 'Sim, após polimento de revitalização o instalador aplica a película, que impede o farol de amarelar de novo.' },
  ],
  '/ppf/windshield': [
    { question: 'O que o NZPPF Windshield faz?', answer: 'Protege o para-brisa contra impactos de pedras e detritos com uma película de 190 micras, reduzindo drasticamente trincas e substituições de vidro.' },
    { question: 'A película atrapalha a visão do motorista?', answer: 'Não: é opticamente transparente, sem distorção, e compatível com sensores e câmeras do para-brisa.' },
    { question: 'Qual a garantia do NZPPF Windshield?', answer: 'De 2 anos, registrada em apólice por instalador credenciado NZ.' },
    { question: 'Vale a pena para quem roda em estrada?', answer: 'É o principal público: quem roda em rodovia troca para-brisa com frequência, e a película custa uma fração do vidro com sensores.' },
  ],
};
