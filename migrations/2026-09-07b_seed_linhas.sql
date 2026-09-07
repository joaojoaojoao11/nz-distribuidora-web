-- Conteúdo das fichas de linha — SÓ o que já estava publicado e validado no
-- site da NZ. RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Regra que separou o que entra do que não entra (pedido do João, 07/09/2026):
--   "o que voce tiver acesso ja validado no nosso site, pode fazer;
--    o que for criado do 0, faça um por linha me apresente"
--
-- Então aqui só entra conteúdo que JÁ ESTAVA NO AR, com a origem anotada em
-- `fonte_nota`. Nada foi escrito do zero. As linhas sem fonte no repositório
-- (Speed Wrapping, NZWRAP Import, NAR, AD Pro, SHNext, SW900, UWF, Ad Color)
-- ficam de fora deste arquivo, de propósito.
--
-- `conferido_em` fica NULO em quase tudo: conferido significa batido contra o
-- fabricante, e o que fiz aqui foi mover conteúdo do próprio site. A única
-- exceção é a MD-80, cuja conferência está registrada no cabeçalho de
-- src/pages/Sign/metamarkMd80.ts (12/08/2026, catálogo Metamark UK).
--
-- Como as fichas duplicadas foram desmontadas: promovi para a linha APENAS os
-- rótulos cujo valor é idêntico em 100% dos produtos da linha. Espessura e
-- durabilidade da Etherna NÃO entram — variam de verdade por coleção
-- (160/140/100 micras), e um script que promovesse "a maioria" teria apagado
-- essa diferença em 38 produtos.
--
-- Aplicada em produção em: 2026-09-07

-- ================================================================ linhas

insert into public.linhas (linha_key, label, marca_key, ordem, ficha, chamada, descricao, texto_venda, aplicacoes, tds_url, tds_titulo, fonte_url, fonte_nota, conferido_em)
values

-- ---------------------------------------------------------------- etherna
('etherna', 'Etherna Decor', 'etherna', 10,
 '[{"label":"Adesivo","value":"Cola acrílica aquosa permanente de alta adesão"},
   {"label":"Dimensões do rolo","value":"1,22 m × 25 m"},
   {"label":"Liner","value":"Papel couché 120 g/m² siliconado"},
   {"label":"Proteção","value":"Sistema Shield® — antifúngico, bactericida, não propaga fogo"},
   {"label":"Fabricação","value":"Indústria nacional — Etherna, São Paulo, desde 1984"}]'::jsonb,
 'Laminado decorativo nacional com tecnologia Shield®, frontal de dupla camada e pronta entrega.',
 'Indústria brasileira de laminados plásticos com mais de 40 anos de mercado. Em 2024 lançou a linha Decor com tecnologia Shield® — antifúngico, antibacteriano e resistente a chamas. Mais de 150 padrões ativos em 8 famílias. Fábrica em São Paulo dispensa importação.',
 'A Etherna é uma indústria de São Paulo que fabrica laminado plástico desde 1984. A linha Decor nasceu em 2024 com o sistema Shield® aplicado ao filme: proteção antifúngica e antibacteriana na própria superfície, e comportamento de não propagação de chama.

Para quem aplica, a diferença prática é o abastecimento. Por ser fabricação nacional, o padrão que acabou não depende de contêiner: o reabastecimento é de dias, não de meses. É o que permite fechar um projeto grande de móveis ou de parede sem calcular sobra de importação.

A espessura frontal varia por coleção — 100, 140 ou 160 micras — e por isso está na ficha de cada padrão, não aqui. As coleções de 160 micras são de dupla camada, com mais corpo para esconder imperfeição do substrato.',
 '{"Móveis planejados e reforma de mobiliário","Paredes e painéis internos","Portas e batentes","Comércio e ambientação de loja"}',
 null, null,
 'https://ethernaprodutos.com.br',
 'Conteúdo já publicado em /decor e em src/pages/Decor/brandData.ts. Espessura frontal e durabilidade ficam no produto: variam por coleção. O Shield® foi promovido para a linha porque já é badge de linha na página /decor — confirmar com o fabricante se vale para as 8 famílias.',
 null),

-- --------------------------------------------------------------- sh-decor
('sh-decor', 'SH Decor', 'sh', 20,
 '[{"label":"Material","value":"PVC Calandrado"},
   {"label":"Adesivo","value":"Acrílico semi permanente"},
   {"label":"Liner","value":"Papel siliconado 120gr"},
   {"label":"Tecnologia","value":"Bubble Free — canais de ar no adesivo"},
   {"label":"Uso","value":"Interno"},
   {"label":"Limpeza","value":"Lavável, atóxico"}]'::jsonb,
 'Linha decorativa da Sign House, com textura tátil realista e adesivo Bubble Free. Uso interno.',
 'Linha decorativa da Sign House, distribuidora da Orafol Alemanha no Brasil há mais de 20 anos. Portfólio organizado em famílias temáticas: madeira, pedra, cimento, metal, tecido, couro, tijolo e sólidos. Textura tátil realista, tecnologia Bubble Free, uso interno.',
 'A SH Decor é a linha decorativa da Sign House, casa que distribui Orafol no Brasil desde 2005. O portfólio é organizado por família temática, e a característica que mais aparece na aplicação é a textura: o filme não é só impresso, tem relevo — a madeira tem veio que se sente com a mão, a pedra tem poro.

O adesivo é Bubble Free, com canais que deixam o ar sair durante a aplicação. Em superfície grande — uma porta inteira, um painel de parede — é o que diferencia um trabalho de meia hora de um trabalho de duas.

Espessura, durabilidade, largura e metragem variam por coleção e estão na ficha de cada padrão.',
 '{"Móveis e marcenaria","Paredes e painéis internos","Portas","Ambientação comercial"}',
 null, null,
 'https://www.shdecorbrasil.com.br',
 'Conteúdo já publicado em /decor e em src/pages/Decor/brandData.ts. Espessura (200/500 microns), durabilidade (9/5 anos), tamanho e metragem do rolo ficam no produto: variam por coleção.',
 null),

-- ------------------------------------------------------------------- m7
('m7', 'Metamark 7 Series', 'metamark', 30,
 '[{"label":"Face film","value":"70μ PVC polimérico"},
   {"label":"Adesivo","value":"Apex permanente"},
   {"label":"Liner","value":"Kraft layflat clay coated"},
   {"label":"Durabilidade","value":"8 anos (cores sólidas) · 7 anos · 5 anos, conforme a cor"},
   {"label":"Larguras de bobina","value":"380, 610, 760, 1.220 e 1.600 mm"}]'::jsonb,
 'Vinil polimérico de recorte da Metamark, com 92 cores e valores CMYK e Pantone® publicados pelo fabricante.',
 'A 7 Series é o vinil de recorte da Metamark: 70 micras de PVC polimérico com adesivo Apex permanente. É a linha em que o fabricante publica RGB, CMYK e referência Pantone® de cada cor — o que permite fechar aprovação de arte antes de cortar.',
 'A Metamark é fabricante inglesa, e a 7 Series é a linha de recorte dela: filme polimérico de 70 micras, adesivo permanente, liner kraft.

O que distingue a 7 Series de outras linhas de recorte é a documentação de cor. A Metamark publica, para cada uma das cores, o valor RGB, o CMYK e a referência Pantone® correspondente. Na prática isso resolve a conversa mais cara de um serviço de comunicação visual: o cliente aprova a cor pelo Pantone®, e o que sai do rolo é o que foi aprovado.

Cada cor está disponível em bobinas de 380 a 1.600 mm — a largura de 1.600 mm só em parte da paleta, indicada na ficha da cor.',
 '{"Recorte eletrônico e letras","Sinalização interna e externa","Identidade visual de frota","Vitrines e comunicação de loja"}',
 null, null,
 'https://metamark.co.uk/products/metamark-7-series',
 'Ficha já publicada em /wrap/metamark (src/pages/Wrap/WrapMetamark.tsx). Cor por cor: src/lib/data/metamark7Colors.ts, gerado do HTML oficial do fabricante.',
 null),

-- ------------------------------------------------------------------ mcx
('mcx', 'MetaCast MCX', 'metamark', 40,
 '[{"label":"Face film","value":"100μ Cast Premium"},
   {"label":"Adesivo","value":"MetaGlide® micro canal"},
   {"label":"Liner","value":"PE Layflat 140 g/m²"},
   {"label":"Durabilidade","value":"12 anos (vertical) · 10 anos · 5 anos, conforme o acabamento"},
   {"label":"Rolo","value":"1.525 mm × 15 m ou 30 m"},
   {"label":"Proteção de superfície","value":"MetaSure™"}]'::jsonb,
 'Filme cast de envelopamento da Metamark, 100 micras, com adesivo de micro canal MetaGlide®.',
 'MetaCast MCX é a linha cast de envelopamento da Metamark: 100 micras fundidas, adesivo MetaGlide® com micro canais para saída de ar e proteção de superfície MetaSure™. Parte da paleta é Inspire Colours™, desenvolvida para reproduzir tons de pintura de fábrica.',
 'Filme cast — fundido, não calandrado. É a diferença que aparece seis meses depois: o filme calandrado guarda tensão do processo e tende a voltar, o cast não. Em curva fechada de para-choque e em rebaixo de maçaneta, é o que decide se a ponta levanta.

O adesivo MetaGlide® tem micro canais: o ar sai durante a aplicação em vez de ficar preso em bolha. Sobre isso vem o MetaSure™, que é a camada de proteção da superfície.

Parte das cores é da série Inspire Colours™, desenvolvida para reproduzir tons de pintura original de montadora — é a paleta usada quando o serviço precisa combinar com um painel que não vai ser envelopado.

A MetaCast não publica valor hexadecimal por cor: a referência é a foto oficial do filme e, para fechar, a amostra física.',
 '{"Envelopamento automotivo completo","Detalhes: teto, capô, retrovisor, friso","Frota e identidade visual","Personalização de moto e capacete"}',
 null, null,
 'https://metamark.co.uk/pages/mcx',
 'Ficha já publicada em /wrap/metamark (src/pages/Wrap/WrapMetamark.tsx). Cor por cor: src/lib/data/metamarkMcxColors.ts, gerado do HTML oficial do fabricante.',
 null),

-- ----------------------------------------------------------- oracal-651
('oracal-651', 'Oracal 651', 'orafol', 50,
 '[{"label":"Espessura","value":"63μ (2.5 mil)"},
   {"label":"Material","value":"PVC calandrado monomérico"},
   {"label":"Adesivo","value":"Transparente permanente, base solvente"},
   {"label":"Durabilidade externa","value":"Até 6 anos"},
   {"label":"Acabamento","value":"Brilhante (paleta principal)"},
   {"label":"Uso","value":"Recorte eletrônico, letras, sinalização e detalhes"}]'::jsonb,
 'O vinil de recorte mais usado do mundo: 63 micras, adesivo permanente e até 6 anos de durabilidade externa.',
 'Referência mundial para recorte e sinalização. Filme fino de 63 micras, formulado para plotter de corte — weeding fácil e borda limpa em letra pequena. Até 6 anos de exposição externa.',
 'O 651 é o vinil mais vendido da história da ORAFOL, e o motivo é o comportamento no corte. Com 63 micras, o filme é fino o bastante para a lâmina passar limpo e o weeding sair sem levar a letra junto — o que importa quando a arte tem tipografia pequena ou contorno fino.

O adesivo é permanente de base solvente, transparente. Em vidro, isso significa que o fundo não interfere na cor aplicada.

Não é filme de envelopamento: a largura da bobina é de recorte, e ele não tem a conformabilidade de um cast. Para envelopar painel inteiro com o mesmo DNA, a linha é a 670RA.

O documento técnico oficial da ORAFOL está disponível para download nesta página.',
 '{"Recorte eletrônico e letras","Sinalização comercial","Detalhamento automotivo","Vitrine e comunicação de PDV"}',
 '/assets/docs/oracal-651-tds.pdf', 'Ficha técnica oficial ORAFOL (PDF)',
 'https://www.orafol.com',
 'Ficha já publicada em /wrap/oracal-651 (src/pages/Wrap/WrapProducts.tsx). O TDS oficial do fabricante já estava hospedado em public/assets/docs/ e linkado em duas páginas.',
 null),

-- ----------------------------------------------------------- oracal-670
('oracal-670', 'Oracal 670RA', 'orafol', 60,
 '[{"label":"Espessura","value":"70μ (0,07 mm)"},
   {"label":"Material","value":"PVC polimérico super calandrado"},
   {"label":"Largura","value":"1,52 m"},
   {"label":"Rolo","value":"1,52 m × 20 m"},
   {"label":"Tecnologia","value":"RapidAir® — microcanais anti-bolha no adesivo"},
   {"label":"Cores","value":"18 sólidas: 15 brilho e 3 foscas"},
   {"label":"Durabilidade externa","value":"Até 5 anos (vertical)"}]'::jsonb,
 'O 651 redesenhado para envelopamento: 1,52 m de largura e adesivo RapidAir® anti-bolhas.',
 'Mesma base do 651 em formato de envelopamento. A largura de 1,52 m cobre capô, porta e teto sem emenda, e o adesivo RapidAir® deixa o ar sair durante a aplicação. 18 cores sólidas, até 5 anos de durabilidade externa.',
 'O 670RA existe para resolver uma limitação do 651: a largura. O 651 vem em bobina de recorte, insuficiente para cobrir um painel inteiro — e emenda no meio de um capô é problema, não acabamento. O 670RA vem com 1,52 m, que é a medida profissional.

A segunda diferença é o adesivo. O RapidAir® tem microcanais que permitem a saída total do ar durante a aplicação; a bolha que ficar sai com a espátula, sem furar.

É filme polimérico calandrado, não cast: rende bem em superfície plana e curva suave, e não é o material indicado para rebaixo profundo ou curva reversa. Para isso a linha é cast.',
 '{"Envelopamento de painéis e capôs","Frota e comunicação visual de veículo","Sinalização de grande formato","Recorte em larga escala"}',
 null, null,
 'https://www.orafol.com',
 'Ficha já publicada em /wrap/oracal-670ra (src/pages/Wrap/WrapProducts.tsx). Código e hex de cada cor ficam no produto.',
 null),

-- ---------------------------------------------------------- sh-wrapping
('sh-wrapping', 'SH Wrapping', 'sh', 70,
 '[{"label":"Espessura","value":"165–180μ"},
   {"label":"Material","value":"PVC multidirecional"},
   {"label":"Rolo","value":"1,52 m × 15 m"},
   {"label":"Adesivo","value":"Solvente anti-bolhas, permanente reposicionável"},
   {"label":"Acabamentos","value":"Gloss, Matte e Color Shift"},
   {"label":"Garantia","value":"3 anos contra descoloração"}]'::jsonb,
 'O maior portfólio de cores de envelopamento do Brasil, com adesivo anti-bolhas e 3 anos de garantia.',
 'PVC multidirecional de 165 a 180 micras, com cola anti-bolhas e base solvente reposicionável. Acabamentos do Gloss ao Color Shift, em rolo de 1,52 m × 15 m.',
 'A SH Wrapping é a linha de envelopamento da Sign House e o portfólio de cor mais amplo que a NZ distribui. Vai do brilho sólido ao Color Shift, que muda de tom conforme o ângulo.

O filme é multidirecional: estica em qualquer direção, o que ajuda em curva composta e recorte complexo. A cola é anti-bolhas e reposicionável enquanto se trabalha — dá margem para levantar e reassentar antes de fixar.

A garantia de fábrica é de 3 anos contra descoloração.',
 '{"Envelopamento automotivo completo","Troca de cor e detalhes","Motos e capacetes","Personalização de frota"}',
 null, null,
 null,
 'Ficha já publicada em /wrap/sh-wrapping (src/pages/Wrap/WrapProducts.tsx). Código, hex e acabamento de cada cor ficam no produto.',
 null),

-- --------------------------------------------------------------- nzwrap
('nzwrap', 'NZWRAP Premium', 'nzwrap', 80,
 '[{"label":"Material","value":"PVC premium com laminação híbrida"},
   {"label":"Acabamento","value":"Ultra Gloss e Deep Pearl"},
   {"label":"Largura","value":"1,52 m"},
   {"label":"Adesivo","value":"Permanente air-free reposicionável"},
   {"label":"Garantia","value":"3 anos"}]'::jsonb,
 'Linha proprietária da NZ: PVC de alto brilho com curadoria própria de cores e 3 anos de garantia.',
 'Adesivo PVC de alta performance com laminação estrutural NZ. Acabamento Ultra Gloss e Deep Pearl, largura de 1,52 m, adesivo air-free reposicionável e 3 anos de garantia.',
 'A NZWRAP Premium é linha própria: a curadoria de cor é feita aqui, olhando o que as montadoras estão lançando e o que o aplicador brasileiro pede.

A laminação híbrida é o ponto técnico: uma camada estrutural que segura a tensão do filme nas pontas complexas — o canto de para-choque, a saia lateral — onde o PVC comum esbranquiça com o tempo.

O adesivo é air-free reposicionável: sai ar durante a aplicação e o filme aceita ser levantado e reassentado antes da fixação definitiva.

Como é linha própria, o suporte técnico é direto: quem atende conhece o rolo que você comprou.',
 '{"Envelopamento automotivo completo","Capô, teto e detalhes","Frota e identidade visual","Personalização"}',
 null, null,
 null,
 'Ficha já publicada em /wrap/nzwrap-premium (src/pages/Wrap/WrapProducts.tsx). Marca própria: a ficha é responsabilidade da NZ, não de um fabricante externo.',
 null),

-- ----------------------------------------------------------------- md80
('md80', 'Metamark MD-80', 'metamark', 90,
 '[{"label":"Película","value":"PVC calandrado monomérico 80μm"},
   {"label":"Liner","value":"Papel kraft 140 g/m²"},
   {"label":"Adesivo · MD-80 / MD-81M","value":"Acrílico permanente livre de solvente, transparente"},
   {"label":"Adesivo · MD-80B / MD-81MB","value":"Acrílico permanente livre de solvente, cinza pigmentado"},
   {"label":"Durabilidade externa","value":"Até 3 anos"},
   {"label":"Classificação de fogo","value":"Classe B"},
   {"label":"Larguras de bobina","value":"1.370 mm · 1.600 mm"},
   {"label":"Comprimento da bobina","value":"50 m"},
   {"label":"Compatibilidade de tintas","value":"Solvente · Eco-solvente · Látex · UV"},
   {"label":"Laminação recomendada","value":"MetaGuard MG-80"},
   {"label":"Temperatura de aplicação","value":"+10°C a +60°C"},
   {"label":"Temperatura de serviço","value":"-20°C a +70°C"},
   {"label":"Estocagem","value":"1 ano a 15–20°C e 50% UR"},
   {"label":"Certificações do fabricante","value":"ISO 9001, 14001, 45001, 50001 · Ecovadis Platinum"},
   {"label":"Aplicações típicas","value":"Vitrines, PDV, painéis promocionais, etiquetas e sinalização de curto prazo"},
   {"label":"Origem","value":"Reino Unido — Metamark (UK) Limited, grupo UPM Raflatac"}]'::jsonb,
 'Vinil calandrado monomérico de 80μm para impressão digital, em quatro versões de adesivo e acabamento.',
 'PVC calandrado monomérico de 80 micras com adesivo acrílico permanente livre de solvente. Quatro versões: adesivo transparente ou cinza blockout, cada uma em brilho ou fosco. Até 3 anos de durabilidade externa.',
 'A MD-80 é a linha de impressão de curto e médio prazo da Metamark. São quatro produtos, e a diferença entre eles está em duas escolhas.

A primeira é o adesivo. O transparente (MD-80 e MD-81M) é o padrão. O cinza pigmentado (MD-80B e MD-81MB) é blockout: bloqueia o que está atrás, e é o que se usa quando a aplicação vai cobrir uma comunicação antiga ou um vidro com fundo indesejado.

A segunda é o acabamento. O fosco tem código próprio de fábrica — MD-81M e MD-81MB, não "MD-80 fosco" — e é o indicado onde há reflexo: vitrine com sol direto, ambiente com luz dura.

A laminação recomendada pelo fabricante é a MetaGuard MG-80.',
 '{"Vitrines e PDV","Painéis promocionais","Etiquetas e rotulagem","Sinalização de curto prazo"}',
 null, null,
 'https://metamark.co.uk/products/metamark-md-80',
 'Códigos e specs conferidos contra o catálogo Metamark UK em 12/08/2026 (registro em src/pages/Sign/metamarkMd80.ts). O briefing interno trazia SKUs "MD-V80/MD-V81M" que não existem no catálogo do fabricante.',
 date '2026-08-12'),

-- ---------------------------------------------------------------- avery
('avery', 'Avery Dennison', 'avery', 100,
 '[{"label":"Fabricante","value":"Avery Dennison"},
   {"label":"Sistema","value":"ICS — Integrated Component System: filme + laminado com cobertura técnica do conjunto"}]'::jsonb,
 'Filmes Avery Dennison para comunicação visual e envelopamento, em famílias com ficha própria.',
 'A Avery Dennison agrupa famílias com finalidades bem diferentes — impressão digital, recorte premium, sobrelaminação, efeito jateado, fitas de transferência e filmes para vidro. A ficha técnica é por família; escolha a família na lista abaixo.',
 null,
 '{}',
 null, null,
 'https://graphics.averydennison.com',
 'Conteúdo das famílias já publicado em /sign (src/pages/Sign/averyLines.ts). ATENÇÃO: linha_key avery agrupa também SW900 (109 SKUs), UWF (72) e Ad Color (27), que NÃO têm ficha no repositório e não recebem conteúdo aqui.',
 null),

-- ------------------------------------------------------------------ ppf
('ppf', 'NZPPF', 'nzppf', 110,
 '[{"label":"Fabricante","value":"NZPPF — linha própria NZ Group"},
   {"label":"Autenticidade","value":"Selo de Autenticidade NZPPF por rolo"}]'::jsonb,
 'Películas de proteção de pintura NZPPF, em cinco linhas com espessura e garantia próprias.',
 'A NZPPF tem cinco linhas de proteção de pintura, mais a de parabrisa e a de farol. Espessura, base e garantia mudam de uma para a outra — a ficha técnica é por linha; escolha a linha na lista abaixo.',
 null,
 '{"Proteção de pintura automotiva","Capô, para-choque e soleira","Parabrisa","Faróis e lanternas"}',
 null, null,
 null,
 'Conteúdo de cada linha já publicado em /ppf/* (src/pages/Ppf/*Data.ts). Os comparativos de desempenho publicados nessas páginas NÃO entram na ficha: não há ensaio de origem registrado no repositório.',
 null),

-- -------------------------------------------------------------- nz-farol
('nz-farol', 'NZPPF Headlight', 'nzppf', 120,
 '[{"label":"Espessura total","value":"150 micras"},
   {"label":"Material base","value":"TPU pigmentado anti-UV"},
   {"label":"Arquitetura","value":"Multicamada coextrudada: top coat, camada pigmentada, core TPU e adesivo PSA"},
   {"label":"Top coat","value":"Hidrofóbico anti-UV"},
   {"label":"Adesivo","value":"PSA reposicionável, remoção sem resíduo na lente"},
   {"label":"Garantia de fábrica","value":"10 anos"}]'::jsonb,
 'Película de TPU pigmentado para farol e lanterna, 150 micras, com 10 anos de garantia de fábrica.',
 'TPU pigmentado anti-UV de 150 micras, dimensionado para proteger a lente sem distorção óptica. Top coat hidrofóbico, adesivo PSA reposicionável e remoção sem resíduo.',
 'A película de farol tem dois trabalhos ao mesmo tempo: proteger a lente de policarbonato do amarelamento — que é dano de UV, não sujeira — e dar o tom fumê sem comprometer o facho.

São 150 micras: espessura suficiente para absorver pedrisco, fina o bastante para não distorcer a imagem projetada. O TPU é pigmentado na massa, não pintado por cima; é o que mantém o tom uniforme ao longo dos anos.

O adesivo é PSA reposicionável. Numa lente com curva composta, poder levantar e reassentar durante a aplicação é a diferença entre um acabamento limpo e uma dobra permanente.

Os tons disponíveis vão do Light Gray ao Dark Black. Verifique a legislação de trânsito aplicável antes de escolher o tom.',
 '{"Faróis dianteiros","Lanternas traseiras","Faróis de milha e auxiliares"}',
 null, null,
 null,
 'Ficha já publicada em /ppf/headlight (src/pages/Ppf/headlightData.ts). Os comparativos de desempenho dessa página não entram na ficha: sem ensaio de origem registrado.',
 null)

on conflict (linha_key) do update set
  label = excluded.label,
  marca_key = excluded.marca_key,
  ordem = excluded.ordem,
  ficha = excluded.ficha,
  chamada = excluded.chamada,
  descricao = excluded.descricao,
  texto_venda = excluded.texto_venda,
  aplicacoes = excluded.aplicacoes,
  tds_url = excluded.tds_url,
  tds_titulo = excluded.tds_titulo,
  fonte_url = excluded.fonte_url,
  fonte_nota = excluded.fonte_nota,
  conferido_em = excluded.conferido_em;

-- ======================================================= linha_familias

insert into public.linha_familias (linha_key, familia_key, label, nome_prefixos, prefixos, ordem, ficha, chamada, descricao, texto_venda, aplicacoes, fonte_url, fonte_nota)
values

-- ------------------------------------------------------------ avery/mpi
('avery', 'mpi', 'MPI · Impressão digital', '{"mpi"}', '{}', 10,
 '[{"label":"Tipo de filme","value":"Calandrado polimérico"},
   {"label":"Espessura","value":"60–80 microns (varia por sub-linha)"},
   {"label":"Durabilidade externa","value":"Até 7 anos (MPI 1105)"},
   {"label":"Tecnologia adesiva","value":"Easy Apply RS reposicionável"},
   {"label":"Impressão compatível","value":"Eco-solvente, solvente, látex HP, UV"},
   {"label":"Largura padrão","value":"1,37 m e 1,52 m"}]'::jsonb,
 'Filmes calandrados poliméricos receptivos a impressão digital em todas as tecnologias do mercado.',
 'Linha de filmes calandrados receptivos a impressão digital. MPI 1105 (premium, 5–7 anos), MPI 2105 (médio prazo), MPI 2800 (paredes texturizadas), MPI 3000/3100 (eco-solvente, solvente, látex e UV) e MPI 3800 Value Film (curto prazo, alto giro).',
 'A família MPI é o coração da linha Avery Dennison para comunicação visual impressa. São filmes calandrados poliméricos receptivos a impressão digital em todas as tecnologias do mercado — eco-solvente, solvente, látex HP e UV — com topcoat formulado para reproduzir cores vivas, gradientes suaves e detalhe fino com fidelidade.

Combinada com o sobrelaminado DOL correspondente, a MPI integra o sistema ICS (Integrated Component System), que dá cobertura técnica ao conjunto filme + laminado conforme especificação Avery.',
 '{"Envelopamento de frota e veículo publicitário","Fachadas e empenas","Sinalização interna corporativa","Stands e ambientação temporária","Adesivo decorativo de parede (linha 2800)"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- ------------------------------------------------------------ avery/slp
('avery', 'slp', 'SLP · Recortes premium', '{"slp"}', '{}', 20,
 '[{"label":"Tipo de filme","value":"Calandrado polimérico premium"},
   {"label":"Espessura","value":"~70 microns"},
   {"label":"Durabilidade externa","value":"5–7 anos"},
   {"label":"Estabilidade dimensional","value":"Superior — recorte preciso"},
   {"label":"Acabamentos","value":"Gloss e Matte"},
   {"label":"Largura padrão","value":"1,22 m e 1,52 m"}]'::jsonb,
 'Calandrado polimérico premium para recorte, com estabilidade dimensional superior.',
 'Filme de recorte premium da Avery Dennison. Estabilidade dimensional superior para corte preciso, em acabamento brilho e fosco, com 5 a 7 anos de durabilidade externa.',
 null,
 '{"Recorte eletrônico e letras","Sinalização","Identidade visual de frota"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- ------------------------------------------------------------ avery/dol
('avery', 'dol', 'DOL · Sobrelaminação', '{"dol"}', '{}', 30,
 '[{"label":"Tipo","value":"Sobrelaminado calandrado transparente"},
   {"label":"Acabamentos","value":"Gloss, Matte e Luster"},
   {"label":"Proteção UV","value":"Sim, todas as versões"},
   {"label":"Anti-graffiti","value":"Versões premium (DOL 2080/2460)"},
   {"label":"Anti-risco","value":"Topcoat resistente à abrasão"},
   {"label":"Ganho de durabilidade","value":"30–50% sobre o filme nu"}]'::jsonb,
 'Sobrelaminados transparentes que protegem a impressão e estendem a durabilidade em 30 a 50%.',
 'Sobrelaminado calandrado transparente, em brilho, fosco e luster. Protege a impressão contra UV, risco e abrasão, e estende a durabilidade do conjunto em 30 a 50% sobre o filme nu.',
 null,
 '{"Proteção de frota envelopada","Fachadas e sinalização externa","Aplicações sujeitas a pichação (versões anti-graffiti)"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- ------------------------------------------------------- avery/etchmark
('avery', 'etchmark', 'Etchmark · Efeito jateado', '{"etchmark"}', '{}', 40,
 '[{"label":"Tipo de filme","value":"Calandrado polimérico com topcoat fosco"},
   {"label":"Acabamento","value":"Fosco translúcido — efeito jateado"},
   {"label":"Durabilidade","value":"5–7 anos (interno)"},
   {"label":"Compatível com","value":"Recorte e impressão digital"},
   {"label":"Substrato","value":"Vidro liso, limpo e desengordurado"},
   {"label":"Remoção","value":"Limpa, sem resíduo"}]'::jsonb,
 'Filme fosco translúcido que reproduz o efeito de vidro jateado, com remoção limpa.',
 'Reproduz o efeito de vidro jateado sem jatear: filme fosco translúcido para vidro liso, compatível com recorte e impressão digital, com remoção limpa e sem resíduo.',
 null,
 '{"Divisórias e vidros de escritório","Fachadas comerciais","Privacidade em ambiente corporativo","Decoração de vidro"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- -------------------------------------------------------- avery/mascara
('avery', 'mascara', 'Mascara · Application tape', '{"mascara"}', '{}', 50,
 '[{"label":"Tipo","value":"Application tape — fita de transferência"},
   {"label":"Tack","value":"Médio calibrado"},
   {"label":"Variantes","value":"Translúcida e transparente"},
   {"label":"Compatibilidade","value":"Todos os filmes Avery (MPI/SLP)"},
   {"label":"Largura","value":"Variável conforme a bobina"}]'::jsonb,
 'Fita de transferência com tack calibrado para levar o recorte do liner à superfície.',
 'Fita de transferência (application tape) com tack médio calibrado, em versão translúcida e transparente, compatível com os filmes Avery de recorte e impressão.',
 null,
 '{"Transferência de recorte","Aplicação de letras e logos"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- --------------------------------------------- avery/reflective-window
('avery', 'reflective-window', 'Reflective & Window Films', '{}', '{}', 60,
 '[{"label":"Refletivo · Tipo","value":"MPI 1900 com microesferas"},
   {"label":"Refletivo · Certificações","value":"DENATRAN / INMETRO (linhas certificadas)"},
   {"label":"Window · One-way vision","value":"Sim — comunicação externa, visão interna"},
   {"label":"Window · Variantes","value":"Estático, adesivo e perfurado"},
   {"label":"Aplicação","value":"Vidros, frota e sinalização viária"},
   {"label":"Durabilidade","value":"Varia por sub-linha — consultar"}]'::jsonb,
 'Filmes refletivos para sinalização viária e filmes para vidro, incluindo one-way vision.',
 'Duas famílias que compartilham a aplicação em vidro e via: refletivos com microesferas para sinalização viária e filmes para vidro em versão estática, adesiva e perfurada (one-way vision).',
 null,
 '{"Sinalização viária","Faixa refletiva de frota","Comunicação em vitrine","One-way vision"}',
 'https://graphics.averydennison.com',
 'Conteúdo já publicado em /sign (src/pages/Sign/averyLines.ts).'),

-- ----------------------------------------------------------- ppf/luxury
('ppf', 'luxury', 'NZPPF Luxury Gloss', '{"nzppf luxury","nz ppf luxury"}', '{}', 10,
 '[{"label":"Espessura total","value":"190 micras (7.5 mil)"},
   {"label":"Material base","value":"TPU alifático premium, com estabilização anti-UV"},
   {"label":"Arquitetura do filme","value":"Coextrusão em 4 camadas: liner, adesivo PSA, core TPU e top coat"},
   {"label":"Top coat","value":"Nano-revestimento japonês, hidrofóbico, com auto-cura térmica"},
   {"label":"Adesivo","value":"Acrílico PSA reposicionável, remoção sem resíduo"},
   {"label":"Garantia de fábrica","value":"12 anos"}]'::jsonb,
 'O topo da linha NZPPF: 190 micras de TPU alifático com top coat japonês e 12 anos de garantia.',
 'TPU alifático de 190 micras em coextrusão de quatro camadas, com nano-revestimento japonês de auto-cura térmica e adesivo PSA reposicionável. Garantia de fábrica de 12 anos contra amarelamento, delaminação e perda de adesão.',
 null,
 '{"Proteção integral de pintura","Carros de coleção e alto valor","Capô, para-choque e soleira"}',
 null,
 'Ficha já publicada em /ppf/luxury-gloss (src/pages/Ppf/luxuryGlossData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.'),

-- ------------------------------------------------------------ ppf/prime
('ppf', 'prime', 'NZPPF Prime Gloss', '{"nzppf prime","nz ppf prime"}', '{}', 20,
 '[{"label":"Espessura total","value":"190 micras (7.5 mil)"},
   {"label":"Material base","value":"TPU 100% virgem"},
   {"label":"Arquitetura do filme","value":"Multicamada: top coat, core TPU e adesivo flexível"},
   {"label":"Top coat","value":"Hidrofóbico nano-dúplex"},
   {"label":"Adesivo","value":"Flexível, de alta conformação"},
   {"label":"Garantia de fábrica","value":"10 anos"}]'::jsonb,
 'TPU 100% virgem de 190 micras com top coat nano-dúplex e 10 anos de garantia.',
 'TPU 100% virgem de 190 micras, mais flexível e durável que blends reciclados, com top coat hidrofóbico de dupla camada e adesivo de alta conformação. Garantia de 10 anos contra amarelamento, trinca e descolamento.',
 null,
 '{"Proteção integral de pintura","Frente completa","Capô, para-choque e retrovisores"}',
 null,
 'Ficha já publicada em /ppf/prime-gloss (src/pages/Ppf/primeGlossData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.'),

-- ------------------------------------------------------------- ppf/flow
('ppf', 'flow', 'NZPPF Flow Gloss', '{"nzppf flow","nz ppf flow"}', '{}', 30,
 '[{"label":"Espessura total","value":"185 micras"},
   {"label":"Material base","value":"TPU técnico G2 — mais estável sob UV que a formulação anterior"},
   {"label":"Arquitetura do filme","value":"Multicamada reformulada"},
   {"label":"Top coat","value":"Nano-hidrofóbico G2, com auto-cura"},
   {"label":"Adesivo","value":"Alta conformação, remoção limpa"},
   {"label":"Garantia de fábrica","value":"7 anos"}]'::jsonb,
 'A geração G2 da linha intermediária: 185 micras, química nova e 7 anos de garantia.',
 'TPU técnico de segunda geração com 185 micras — dez a mais que a geração anterior — e top coat nano-hidrofóbico G2 com auto-cura mais rápida. Garantia de fábrica de 7 anos.',
 null,
 '{"Proteção de pintura","Frente parcial e áreas de impacto","Uso urbano intenso"}',
 null,
 'Ficha já publicada em /ppf/flow-gloss (src/pages/Ppf/flowGlossData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.'),

-- ------------------------------------------------------------- ppf/core
('ppf', 'core', 'NZPPF Core Gloss', '{"nzppf core","nz ppf core"}', '{}', 40,
 '[{"label":"Espessura média","value":"150–180 micras"},
   {"label":"Engenharia de base","value":"Híbrido 80% TPU + 20% PVC"},
   {"label":"Estruturação","value":"Multicamadas, projetada para não rasgar sob tensionamento"},
   {"label":"Top coat","value":"Camada de fechamento com repelência hidrofóbica"},
   {"label":"Adesivo","value":"Easy-Tack reposicionável, sem marca de tração"},
   {"label":"Garantia de fábrica","value":"3 anos"}]'::jsonb,
 'A entrada da linha: híbrido TPU/PVC de 150 a 180 micras com adesivo reposicionável.',
 'Filme híbrido de 80% TPU e 20% PVC, entre 150 e 180 micras, com adesivo Easy-Tack reposicionável. Garantia de fábrica de 3 anos.',
 null,
 '{"Proteção de pintura de custo controlado","Áreas de impacto pontual","Alto giro de oficina"}',
 null,
 'Ficha já publicada em /ppf/core-gloss (src/pages/Ppf/coreGlossData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.'),

-- ------------------------------------------------------- ppf/windshield
('ppf', 'windshield', 'NZPPF Windshield', '{"nzppf windshield","nz ppf windshield"}', '{}', 50,
 '[{"label":"Espessura total","value":"190 micras (7.5 mil)"},
   {"label":"Material base","value":"TPU de alta performance com estabilização UV"},
   {"label":"Arquitetura do filme","value":"Coextrusão multicamada: liner, adesivo PSA, core TPU e top coat anti-UV"},
   {"label":"Top coat","value":"Hidrofóbico anti-UV"},
   {"label":"Aplicação","value":"Face externa do parabrisa — compatível com sensores ADAS e câmeras"},
   {"label":"Garantia de fábrica","value":"2 anos"}]'::jsonb,
 'Película de 190 micras para a face externa do parabrisa, compatível com sensores ADAS.',
 'TPU de alta performance com 190 micras, aplicado na face externa do parabrisa. Absorve impacto de pedrisco sem distorção óptica e é compatível com sensores ADAS e câmeras de assistência. Garantia de 2 anos.',
 null,
 '{"Parabrisa","Veículos com ADAS","Uso rodoviário e estrada de terra"}',
 null,
 'Ficha já publicada em /ppf/windshield (src/pages/Ppf/windshieldData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.'),

-- -------------------------------------------------------- ppf/headlight
('ppf', 'headlight', 'NZPPF Headlight', '{"nzppf headlight","nz ppf headlight"}', '{}', 60,
 '[{"label":"Espessura total","value":"150 micras"},
   {"label":"Material base","value":"TPU pigmentado anti-UV"},
   {"label":"Arquitetura do filme","value":"Multicamada coextrudada: top coat, camada pigmentada, core TPU e adesivo PSA"},
   {"label":"Top coat","value":"Hidrofóbico anti-UV"},
   {"label":"Adesivo","value":"PSA reposicionável, remoção sem resíduo na lente"},
   {"label":"Garantia de fábrica","value":"10 anos"}]'::jsonb,
 'Película de TPU pigmentado para farol e lanterna, 150 micras, com 10 anos de garantia.',
 'TPU pigmentado anti-UV de 150 micras, dimensionado para proteger a lente sem distorção óptica, com adesivo PSA reposicionável.',
 null,
 '{"Faróis dianteiros","Lanternas traseiras","Faróis auxiliares"}',
 null,
 'Ficha já publicada em /ppf/headlight (src/pages/Ppf/headlightData.ts). O comparativo de desempenho da página não entra: sem ensaio de origem registrado.')

on conflict (linha_key, familia_key) do update set
  label = excluded.label,
  nome_prefixos = excluded.nome_prefixos,
  prefixos = excluded.prefixos,
  ordem = excluded.ordem,
  ficha = excluded.ficha,
  chamada = excluded.chamada,
  descricao = excluded.descricao,
  texto_venda = excluded.texto_venda,
  aplicacoes = excluded.aplicacoes,
  fonte_url = excluded.fonte_url,
  fonte_nota = excluded.fonte_nota;
