// Tutoriais do painel administrativo — telas de incentivos (afiliados, super
// cupons, cupons e saques). Escritos a partir do código em 22/10/2026: cada
// frase descreve o que o sistema faz hoje. Mudou a regra no código? Mude aqui.
//
// Regra do repositório (público): nenhum percentual real, código de cupom real
// ou dado de cliente. Os valores das cenas de carteira são exemplos e aparecem
// marcados como "exemplo"; os percentuais em vigor ficam nas telas de Regras.

import type { Tutorial } from '../../components/Tutorial/tipos';

export const TUTORIAIS_ADMIN: Tutorial[] = [
  {
    id: 'admin.afiliados',
    publico: 'admin',
    titulo: 'Afiliados',
    resumo: 'O parceiro que traz clientes para a NZ e ganha comissão sobre as compras deles.',
    passos: [
      {
        titulo: 'Quem é o afiliado',
        texto:
          'É um parceiro (aplicador, loja, criador de conteúdo) que traz clientes. O próprio cliente aprovado pede a adesão no painel dele, em **Indique e ganhe → Quero ser afiliado**, aceitando as regras. Ele recebe na hora um código **NZ-XXXXX** e aparece aqui como **Aguardando aprovação**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cliente aprovado' },
            { icone: 'presente', rotulo: 'Pede para ser afiliado' },
            { icone: 'relogio', rotulo: 'Aguardando aprovação', tom: 'atencao' },
            { icone: 'check', rotulo: 'Você aprova', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Aprovar, suspender e reativar',
        texto:
          'Enquanto aguarda, o cupom dele não vale em compra. **Aprovar** libera o cupom e a comissão. **Suspender** corta os dois sem apagar nada: os filiados continuam ligados a ele e as próximas compras voltam a contar se você **reativar**.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Aguardando', tom: 'atencao', sub: 'cupom ainda não vale' },
            { texto: 'Aprovado', tom: 'ok', sub: 'cupom vale e gera comissão' },
            { texto: 'Suspenso', tom: 'erro', sub: 'cupom e comissão parados' },
          ],
        },
      },
      {
        titulo: 'O cupom é a senha de entrada',
        texto:
          'Quem **se cadastra** com o código (ou entrando pelo link dele) ou **compra** com o cupom fica **filiado** a esse afiliado para sempre. É um afiliado por cliente: vale o primeiro. O cupom pode dar desconto a quem usa; com desconto 0 ele só identifica.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'link', rotulo: 'Link ou código NZ-XXXXX' },
            { icone: 'usuario', rotulo: 'Cliente se cadastra ou compra' },
            { icone: 'selo', rotulo: 'Filiado para sempre', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Como ele ganha',
        texto:
          'A comissão nasce quando o NZERP **fatura** o pedido que o filiado fez no site, sobre o valor sem o frete. Na **primeira** compra faturada de cada filiado entra a comissão de **ativação**; nas seguintes, a de **recorrência**, que só libera no **fim do período** (mês ou quinzena). O nível do afiliado (Largada → Campeão) multiplica a comissão.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Pedido faturado', sub: 'no NZERP' },
            { rotulo: 'A liberar', sub: 'carência', tom: 'atencao' },
            { rotulo: 'Fim do período', sub: 'só na recorrência', tom: 'atencao' },
            { rotulo: 'Disponível', sub: 'usa ou saca', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Os números desta tela',
        texto:
          '**Saldo a pagar** é o que já está disponível na carteira dos afiliados. **A liberar** está na carência ou esperando o fim do período. **Comissões no mês** soma o que nasceu neste mês. Clique no nome de um afiliado para ver a carteira dele, os filiados e fazer ajustes.',
        cena: {
          tipo: 'carteira',
          titulo: 'Carteira do afiliado',
          linhas: [
            { rotulo: 'Ativação · indicado nº 1', valor: 200, tom: 'ok', status: 'disponível' },
            { rotulo: 'Recorrência · indicado nº 1', valor: 30, tom: 'atencao', status: 'a liberar' },
            { rotulo: 'Ativação · indicado nº 2', valor: 120, tom: 'atencao', status: 'a liberar' },
          ],
          total: { rotulo: 'Saldo a pagar', valor: 200 },
        },
      },
    ],
  },

  {
    id: 'admin.afiliado-detalhe',
    publico: 'admin',
    titulo: 'Tela do afiliado',
    resumo: 'Configuração individual, carteira com ajuste manual e a lista de filiados de um afiliado.',
    passos: [
      {
        titulo: 'Configuração só para ele',
        texto:
          'Aqui você muda o **status**, liga ou desliga o **cupom** e pode dar percentuais **só para este afiliado**. Campo vazio segue a regra geral (o valor geral aparece apagado dentro do campo). A periodicidade (mês ou quinzena) o afiliado também troca no painel dele. As observações só a equipe vê.',
        cena: {
          tipo: 'formulario',
          titulo: 'Configuração individual',
          campos: [
            { rotulo: 'Status', valor: 'Aprovado' },
            { rotulo: 'Cupom ativo', valor: 'Sim' },
            { rotulo: 'Ativação (%)', valor: 'vazio = geral' },
            { rotulo: 'Recorrência (%)', valor: 'vazio = geral' },
          ],
        },
      },
      {
        titulo: 'Carteira e ajuste manual',
        texto:
          'O extrato mostra cada comissão com o filiado que a gerou (o afiliado vê só **indicado nº N**, nunca o nome). Para um acerto, use o **ajuste**: valor positivo credita, negativo debita, sempre com motivo. O motivo aparece no extrato e fica no registro da equipe.',
        cena: {
          tipo: 'carteira',
          titulo: 'Extrato',
          linhas: [
            { rotulo: 'Ativação · indicado nº 3', valor: 150, tom: 'ok', status: 'disponível' },
            { rotulo: 'Ajuste · acerto de campanha', valor: 50, tom: 'ok', status: 'disponível' },
            { rotulo: 'Saque Pix', valor: -100, tom: 'neutro' },
          ],
          total: { rotulo: 'Disponível', valor: 100 },
        },
      },
      {
        titulo: 'Os filiados',
        texto:
          'A lista de quem entrou pelo cupom deste afiliado, com pedidos, total comprado e última compra. A ligação é **permanente**: o cliente não muda de afiliado. Cada compra **feita no site** por um filiado, depois de faturada, vira comissão aqui.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuarios', rotulo: 'Filiados deste afiliado' },
            { icone: 'carrinho', rotulo: 'Compram no site' },
            { icone: 'nota', rotulo: 'NZERP fatura' },
            { icone: 'carteira', rotulo: 'Comissão na carteira', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.afiliados-regras',
    publico: 'admin',
    titulo: 'Regras gerais dos afiliados',
    resumo: 'Os valores padrão do programa: comissões, carteira, saque, níveis e conquistas.',
    passos: [
      {
        titulo: 'Para quem valem',
        texto:
          'Estas regras valem para todo afiliado que não tem valor próprio na tela dele. Cada bloco tem o seu botão **Salvar**: salvar um bloco não mexe nos outros. A carteira e o saque valem também para o super cupom.',
        cena: {
          tipo: 'formulario',
          titulo: 'Comissões e cupom do afiliado',
          campos: [{ rotulo: 'Ativação (%)' }, { rotulo: 'Recorrência (%)' }, { rotulo: 'Desconto do cupom (%)' }, { rotulo: 'Periodicidade padrão', valor: 'Mensal' }],
        },
      },
      {
        titulo: 'Comissões, cupom e janela do link',
        texto:
          '**Ativação**: sobre a 1ª compra faturada de cada filiado. **Recorrência**: sobre as seguintes, liberada no fim do período. **Desconto do cupom**: o que o cliente ganha ao usar o código (0 = só identifica). **Janela do link**: por quantos dias o site lembra o código de quem entrou pelo link do afiliado, para filiar a pessoa se ela se cadastrar nesse prazo.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'link', rotulo: 'Clica no link do afiliado' },
            { icone: 'calendario', rotulo: 'Janela do link', tom: 'atencao' },
            { icone: 'usuario', rotulo: 'Cadastra dentro do prazo' },
            { icone: 'selo', rotulo: 'Fica filiado', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Carteira',
        texto:
          '**Carência**: dias entre o faturamento no NZERP e o saldo ficar disponível. **Validade**: depois desse prazo, o saldo não usado volta para a NZ. **Usar o saldo no checkout** deixa o cliente abater o pedido com a carteira, e a **cobrança mínima** garante que o que sobra para o Asaas nunca fica abaixo do valor definido.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Faturado', sub: 'no NZERP' },
            { rotulo: 'Carência', sub: 'a liberar', tom: 'atencao' },
            { rotulo: 'Disponível', sub: 'checkout ou saque', tom: 'ok' },
            { rotulo: 'Validade', sub: 'o que sobrar vence', tom: 'neutro' },
          ],
        },
      },
      {
        titulo: 'Saque por Pix',
        texto:
          'O cliente pede o saque em **Indique e ganhe** a partir do **saque mínimo**. O pedido vira um título no **Contas a Pagar** do NZERP, com vencimento em **dias úteis**; pedido feito depois da **hora de corte** conta como do dia seguinte. Acompanhe em **Saques**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'carteira', rotulo: 'Saldo disponível' },
            { icone: 'pix', rotulo: 'Pede o saque' },
            { icone: 'banco', rotulo: 'Contas a Pagar do NZERP', tom: 'info' },
            { icone: 'check', rotulo: 'Pix pago', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Níveis e conquistas',
        texto:
          'Os **níveis** sobem pelo resultado dos últimos 12 meses (indicados que compraram; para o afiliado, as vendas geradas) e cada um tem um **multiplicador** sobre o cashback e a comissão. As **conquistas** são medalhas; o bônus em R$ só sai dentro do **teto mensal de prêmios**. Conquista nova só é concedida quando o sistema tiver a regra dela.',
        cena: {
          tipo: 'niveis',
          niveis: [{ nome: 'Largada' }, { nome: 'Volta Rápida' }, { nome: 'Pódio' }, { nome: 'Pole Position' }, { nome: 'Campeão' }],
        },
      },
    ],
  },

  {
    id: 'admin.super-cupons',
    publico: 'admin',
    titulo: 'Super cupons',
    resumo: 'O cupom pessoal de cada cliente para indicar amigos: desconto para o amigo, cashback para quem indicou.',
    passos: [
      {
        titulo: 'Um cupom para cada cliente',
        texto:
          'Todo cliente aprovado tem um super cupom. Ele nasce quando o cliente abre **Indique e ganhe** pela primeira vez, com o primeiro nome e dois números. O cliente pode trocar o código no painel; o antigo é desligado e fica aqui como **trocado**.',
        cena: {
          tipo: 'cupom',
          codigo: 'MARIA27',
          selos: [
            { texto: 'um por cliente', tom: 'info' },
            { texto: 'nasce no Indique e ganhe', tom: 'neutro' },
            { texto: 'código trocável', tom: 'neutro' },
          ],
        },
      },
      {
        titulo: 'Como o amigo usa',
        texto:
          'O amigo digita o código no carrinho ou no checkout da **primeira compra** e ganha desconto nos produtos (o frete não entra). Vale **uma vez** por pessoa, **só para conta nova**, e nunca para o próprio dono.',
        cena: {
          tipo: 'cupom',
          codigo: 'MARIA27',
          selos: [
            { texto: 'só conta nova', tom: 'atencao' },
            { texto: '1 compra por indicado', tom: 'info' },
            { texto: 'desconto nos produtos', tom: 'ok' },
            { texto: 'não vale para o dono', tom: 'erro' },
          ],
          legenda: 'O que o checkout confere antes de aceitar o código',
        },
      },
      {
        titulo: 'Como o dono ganha',
        texto:
          'Quando o NZERP **fatura** a compra do amigo, o dono ganha **cashback** na carteira, sobre o valor sem frete, multiplicado pelo nível dele. O valor fica **a liberar** durante a carência; depois fica disponível para usar no site ou sacar por Pix.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Amigo compra', sub: 'com o cupom' },
            { rotulo: 'NZERP fatura', sub: 'cashback nasce' },
            { rotulo: 'Carência', sub: 'a liberar', tom: 'atencao' },
            { rotulo: 'Disponível', sub: 'usa ou saca', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Diferente do afiliado',
        texto:
          'O super cupom **não filia** ninguém: ele rende uma compra por indicado. Quem quer ganhar sobre **todas** as compras de um cliente é o **afiliado**, que precisa da aprovação da NZ.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Super cupom', icone: 'cupom', tom: 'marca', itens: ['Todo cliente aprovado tem', '1ª compra de cada amigo', 'Cashback na carteira', 'Não filia ninguém'] },
            { titulo: 'Afiliado', icone: 'selo', tom: 'info', itens: ['Só com aprovação da NZ', 'Todas as compras do filiado', 'Ativação + recorrência', 'Filiado para sempre'] },
          ],
        },
      },
      {
        titulo: 'Números e regras',
        texto:
          'Os cartões mostram quantos clientes têm super cupom, quantas compras usaram um e quanto cashback foi gerado. Desconto, cashback, carência e validade se mudam em **Regras do super cupom**.',
        cena: {
          tipo: 'carteira',
          titulo: 'Cashback de quem indicou',
          linhas: [
            { rotulo: 'Cashback · indicado nº 1', valor: 28.5, tom: 'ok', status: 'disponível' },
            { rotulo: 'Cashback · indicado nº 2', valor: 41.2, tom: 'atencao', status: 'a liberar' },
          ],
          total: { rotulo: 'Disponível', valor: 28.5 },
        },
      },
    ],
  },

  {
    id: 'admin.super-cupons-regras',
    publico: 'admin',
    titulo: 'Regras do super cupom',
    resumo: 'Liga o programa e define o desconto de quem compra, o cashback de quem indica e a carteira.',
    passos: [
      {
        titulo: 'Ligar e desligar o programa',
        texto:
          'Com o **Programa** desligado, ninguém gera nem usa super cupom: o código deixa de dar desconto e não nasce cashback novo. O que já estava na carteira continua lá.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Ligado', tom: 'ok', sub: 'gera e aceita super cupom' },
            { texto: 'Desligado', tom: 'neutro', sub: 'ninguém gera nem usa' },
          ],
        },
      },
      {
        titulo: 'Desconto e cashback',
        texto:
          '**Desconto para quem compra**: o percentual que o amigo ganha nos produtos. **Cashback para quem indicou**: o percentual que vai para a carteira do dono, multiplicado pelo nível dele. **Compras por indicado** e **quem pode usar** são regras fixas: uma compra, só conta nova.',
        cena: {
          tipo: 'formulario',
          titulo: 'Super cupom',
          campos: [{ rotulo: 'Programa', valor: 'Ligado' }, { rotulo: 'Desconto para quem compra (%)' }, { rotulo: 'Cashback para quem indicou (%)' }, { rotulo: 'Compras por indicado', valor: '1 (fixo)' }],
        },
      },
      {
        titulo: 'A carteira é uma só',
        texto:
          '**Carência**, **validade** e **teto mensal de prêmios** são os mesmos para super cupom e afiliados: mudar aqui muda lá também. A carência corre do faturamento no NZERP até o saldo ficar disponível.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Faturado', sub: 'no NZERP' },
            { rotulo: 'Carência', sub: 'a liberar', tom: 'atencao' },
            { rotulo: 'Disponível', tom: 'ok' },
            { rotulo: 'Validade', sub: 'o que sobrar vence', tom: 'neutro' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.cupons',
    publico: 'admin',
    titulo: 'Cupons',
    resumo: 'Cupons de campanha e nominais criados pela NZ, e os cupons dos afiliados.',
    passos: [
      {
        titulo: 'Os tipos de cupom',
        texto:
          '**Campanha**: qualquer cliente usa (uma ação do mês, por exemplo). **Nominal**: só um cliente, escolhido por você. **Afiliado**: aparece nesta lista, mas se configura na tela do afiliado. O **super cupom** de cada cliente tem tela própria.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Campanha', icone: 'cupom', tom: 'marca', itens: ['Qualquer cliente', 'Prazo e limite de usos'] },
            { titulo: 'Nominal', icone: 'usuario', tom: 'info', itens: ['Um cliente só', 'Ele usa logado'] },
            { titulo: 'Afiliado', icone: 'selo', tom: 'ok', itens: ['Código NZ-XXXXX', 'Edita na tela do afiliado'] },
          ],
        },
      },
      {
        titulo: 'Quando o cupom vale',
        texto:
          'Cada cupom pode ter período (**vale de / até**), **limite total** de usos, **usos por cliente** e **só conta nova** (quem já comprou não usa). A etiqueta da lista mostra a situação de cada um.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Agendado', tom: 'info', sub: 'ainda não começou' },
            { texto: 'Ativo', tom: 'ok', sub: 'vale agora' },
            { texto: 'Esgotado', tom: 'atencao', sub: 'bateu o limite' },
            { texto: 'Vencido', tom: 'neutro', sub: 'passou do prazo' },
          ],
        },
      },
      {
        titulo: 'Como o cliente usa',
        texto:
          'O cliente digita o código no carrinho ou no checkout. O desconto vale **só nos produtos**, nunca no frete, e vai para o NZERP repartido item a item na nota. O uso só conta quando o pedido é **pago** (ou, no orçamento, quando o NZERP fatura).',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'cupom', rotulo: 'Digita o código' },
            { icone: 'carrinho', rotulo: 'Desconto nos produtos' },
            { icone: 'nota', rotulo: 'Desconto por item na nota', tom: 'info' },
            { icone: 'check', rotulo: 'Uso conta no pagamento', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Criar, ligar e desligar',
        texto:
          'Para criar, use **+ Novo cupom**. O botão de cada linha desliga o cupom na hora, sem apagar o histórico de quem usou; ligue de novo quando quiser. Clique na linha para editar.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Ativo', tom: 'ok', sub: 'aceito no checkout' },
            { texto: 'Desligado', tom: 'neutro', sub: 'recusado, histórico mantido' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.cupom-editor',
    publico: 'admin',
    titulo: 'Criar ou editar cupom',
    resumo: 'Código, desconto e limites de um cupom de campanha ou nominal.',
    passos: [
      {
        titulo: 'Código e tipo',
        texto:
          'Letras, números ou hífen. O código **não muda** depois de criado. Não reaproveite o código de um super cupom ou de um afiliado: salvar aqui transforma aquele cupom em campanha ou nominal.',
        cena: {
          tipo: 'cupom',
          codigo: 'EXEMPLO10',
          selos: [
            { texto: 'campanha ou nominal', tom: 'info' },
            { texto: 'código fixo depois de criado', tom: 'atencao' },
          ],
        },
      },
      {
        titulo: 'Desconto',
        texto: 'Escolha **percentual** ou **valor em R$**. O desconto vale só nos produtos, nunca no frete.',
        cena: {
          tipo: 'formulario',
          titulo: 'Regras do cupom',
          campos: [{ rotulo: 'Código', valor: 'EXEMPLO10' }, { rotulo: 'Tipo', valor: 'Campanha' }, { rotulo: 'Desconto (%)' }, { rotulo: 'ou desconto (R$)' }],
        },
      },
      {
        titulo: 'Limites',
        texto:
          '**Vale de / até**: o período. **Limite de usos**: o total do cupom. **Usos por cliente**: quantas vezes cada pessoa usa. **Só conta nova**: só para quem nunca comprou. Um pedido ainda em aberto já segura um uso, para o cupom não passar do limite.',
        cena: {
          tipo: 'formulario',
          campos: [{ rotulo: 'Vale de' }, { rotulo: 'Vale até' }, { rotulo: 'Limite de usos (total)' }, { rotulo: 'Usos por cliente' }, { rotulo: 'Só conta nova', valor: 'Sim' }],
        },
      },
      {
        titulo: 'Nominal e quem usou',
        texto:
          'No tipo **nominal**, escolha o cliente: só ele consegue usar, e precisa estar logado. Embaixo, **Quem usou** lista um registro por pedido pago ou faturado com este cupom.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Você escolhe o cliente' },
            { icone: 'cupom', rotulo: 'Só ele usa, logado' },
            { icone: 'check', rotulo: 'Pedido pago entra em Quem usou', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.clientes',
    publico: 'admin',
    titulo: 'Clientes & Revendedores',
    resumo: 'Liberar as contas do site, escolher tipo e faixa de preço e ligar a conta ao cliente do NZERP.',
    passos: [
      {
        titulo: 'Ninguém nasce aprovado',
        texto:
          'Toda conta criada no site chega aqui como **Pendente** (filtro **Aguardando aprovação**). Até ser aprovada, a pessoa vê o catálogo **sem preço** e não compra. A NZ recebe um e-mail quando a pessoa confirma o e-mail e entra pela primeira vez.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cria a conta' },
            { icone: 'email', rotulo: 'Confirma o e-mail' },
            { icone: 'relogio', rotulo: 'Aguardando aprovação', tom: 'atencao' },
            { icone: 'check', rotulo: 'Você aprova', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Aprovar com tipo e faixa',
        texto:
          'Escolha o **tipo** (Cliente final, Lojista/aplicador ou Revendedor) e a **faixa** (Padrão, Gold, Platinum ou uma criada) e clique **Aprovar**. O cliente recebe o e-mail de acesso liberado com o tipo e a faixa, e a faixa vai também para o cadastro dele no NZERP. Se o e-mail falhar, a tela avisa: mande pelo WhatsApp.',
        cena: {
          tipo: 'formulario',
          titulo: 'Conta pendente',
          campos: [{ rotulo: 'Aprovar como', valor: 'Lojista / aplicador' }, { rotulo: 'Faixa', valor: 'Gold' }],
        },
      },
      {
        titulo: 'Indicação e pré-análise',
        texto:
          'A etiqueta **indicação de NZ-XXXXX** mostra quem chegou por um afiliado. Clique na linha para a **Pré-análise do consultor**: volume, perfil, linhas de interesse, preço do concorrente e **faixa sugerida**. Para quem está pendente, a faixa sugerida já vem escolhida na hora de aprovar.',
        cena: {
          tipo: 'formulario',
          titulo: 'Pré-análise do consultor',
          campos: [{ rotulo: 'Volume estimado (R$/mês)' }, { rotulo: 'Linhas de interesse' }, { rotulo: 'Preço do concorrente' }, { rotulo: 'Faixa sugerida', valor: 'Platinum' }],
        },
      },
      {
        titulo: 'Depois de aprovado',
        texto:
          'Trocar o **tipo** vale na hora e volta a faixa para **Padrão** (a faixa é de cada tipo). Trocar a **faixa** também vale na hora. **Revogar** tira o preço e a compra; o cliente não recebe e-mail disso. Tudo fica no registro da equipe.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pendente', tom: 'atencao', sub: 'sem preço, sem compra' },
            { texto: 'Aprovado', tom: 'ok', sub: 'preço do tipo e da faixa' },
            { texto: 'Revogado', tom: 'erro', sub: 'volta a ficar sem preço' },
          ],
        },
      },
      {
        titulo: 'Clientes que já compram com a NZ',
        texto:
          'Cliente qualificado no CRM ou com pedido entregue no NZERP ganha uma **conta pronta** no site: lojista, ainda não aprovada e já ligada ao NZERP. Isso roda uma vez por dia ou em **Criar contas do ERP agora**. A pessoa só entra depois do **Convidar** (link para criar a senha, por e-mail ou WhatsApp) e só vê preço depois que você aprovar. Filtros: **Vindos do ERP** e **ERP sem convite**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'Cliente no NZERP' },
            { icone: 'cadeado', rotulo: 'Conta criada, bloqueada' },
            { icone: 'email', rotulo: 'Convidar: link da senha', tom: 'info' },
            { icone: 'check', rotulo: 'Você aprova', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Ligação com o NZERP',
        texto:
          'Quem não virou conta fica em **ERP sem conta**, com o motivo. **Procurar no ERP** e **Confirmar vínculo** ligam uma conta à mão; atenção: lojista ou revendedor pendente com o mesmo e-mail de um cliente ativo é **aprovado na hora**, na faixa Padrão. Em **Títulos do NZERP sem dono**, atribua a parcela para ela aparecer em Pagamentos do cliente.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Conta do site' },
            { icone: 'busca', rotulo: 'Procura por documento e e-mail' },
            { icone: 'banco', rotulo: 'Cliente do NZERP', tom: 'info' },
            { icone: 'link', rotulo: 'Vinculado', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.precos',
    publico: 'admin',
    titulo: 'Tipos de acesso',
    resumo: 'Quanto cada tipo de conta paga e o que cada um vê na loja.',
    passos: [
      {
        titulo: 'Um preço por tipo de conta',
        texto:
          'Cada conta aprovada tem um tipo: **Cliente final**, **Lojista/aplicador** ou **Revendedor** (o **Administrador** vê tudo e compra pela base de atacado). Cada cartão resume o preço, o que o tipo vê e as faixas; **Configurar** abre o tipo.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Cliente final', icone: 'usuario', tom: 'info', itens: ['Base varejo por padrão', 'Preço do tipo'] },
            { titulo: 'Lojista / aplicador', icone: 'loja', tom: 'marca', itens: ['Base atacado por padrão', 'Faixas Gold e Platinum'] },
            { titulo: 'Revendedor', icone: 'caixa', tom: 'ok', itens: ['Base atacado por padrão', 'Faixas Gold e Platinum'] },
          ],
        },
      },
      {
        titulo: 'Como o preço é calculado',
        texto:
          '**Preço = base do NZERP × (1 + %)**. A base é o **atacado** (mínimo) ou o **varejo** (publicado), escolhida por tipo. O percentual pode ser geral, por linha comercial ou por produto, e vale o **mais específico**: produto, depois linha, depois geral.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'Base do NZERP' },
            { icone: 'percentual', rotulo: '+ % do tipo (produto > linha > geral)' },
            { icone: 'usuario', rotulo: 'Preço que a conta vê e paga', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Faixas dentro do tipo',
        texto:
          '**Gold**, **Platinum** ou uma faixa criada para um cliente só têm percentuais próprios sobre a **mesma base** do tipo. A faixa de cada pessoa é escolhida na aprovação, em **Clientes**, e pode ser trocada depois.',
        cena: {
          tipo: 'niveis',
          niveis: [{ nome: 'Padrão' }, { nome: 'Gold' }, { nome: 'Platinum' }],
        },
      },
      {
        titulo: 'O que cada tipo vê',
        texto:
          'Na aba **Visibilidade** de cada tipo: linhas comerciais visíveis, rolo fechado, metro fracionado, estoque detalhado, Promoção Moto e pagamento online. Quem desobedece a regra não é a tela: o **servidor** tira o preço e recusa o item no pedido. Conta sem aprovação nunca vê preço.',
        cena: {
          tipo: 'formulario',
          titulo: 'Visibilidade',
          campos: [{ rotulo: 'Rolo fechado', valor: 'Sim' }, { rotulo: 'Metro fracionado', valor: 'Sim' }, { rotulo: 'Estoque detalhado', valor: 'Não' }, { rotulo: 'Pagamento online', valor: 'Sim' }],
        },
      },
    ],
  },

  {
    id: 'admin.precos-tipo',
    publico: 'admin',
    titulo: 'Configurar um tipo de acesso',
    resumo: 'Base, percentuais por linha e produto, faixas, visibilidade e simulador de um tipo.',
    passos: [
      {
        titulo: 'Regra geral e por linha',
        texto:
          'Em **Preço**: a **base** (atacado ou varejo) e o **percentual geral**. Na tabela de linhas comerciais, o percentual da linha; vazio herda o geral. Clique no nome da linha para dar percentual **por produto**. Marque várias e use **Aplicar às selecionadas** para fazer em lote.',
        cena: {
          tipo: 'formulario',
          titulo: 'Preço',
          campos: [{ rotulo: 'Base (tabela do ERP)', valor: 'atacado (mínimo)' }, { rotulo: 'Percentual geral (%)' }, { rotulo: 'Linha comercial (%)', valor: 'vazio = geral' }, { rotulo: 'Produto (%)', valor: 'vazio = linha' }],
        },
      },
      {
        titulo: 'Faixas',
        texto:
          'Os botões no topo trocam entre **Padrão** e as faixas; **+ nova faixa** cria uma. Com uma faixa aberta, os percentuais valem só para ela, e a base é sempre a do tipo. Atenção: se a faixa tiver **percentual geral**, ele vale para todas as linhas dela. Percentual nunca é negativo. Faixa com contas não se exclui.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Padrão', icone: 'usuarios', tom: 'info', itens: ['Regra do tipo', 'Geral, linha e produto'] },
            { titulo: 'Faixa (ex.: Gold)', icone: 'trofeu', tom: 'marca', itens: ['Percentuais próprios', 'Mesma base do tipo', 'O que ficar vazio segue o tipo'] },
          ],
        },
      },
      {
        titulo: 'Visibilidade',
        texto:
          'A aba **Visibilidade** é do tipo (some quando uma faixa está aberta): rolo fechado, metro fracionado (não dá para desligar os dois), estoque detalhado, Promoção Moto, pagamento online e as **linhas comerciais visíveis**. Linha oculta fica sem preço e não entra em pedido.',
        cena: {
          tipo: 'formulario',
          titulo: 'Visibilidade',
          campos: [{ rotulo: 'Rolo fechado', valor: 'Sim' }, { rotulo: 'Metro fracionado', valor: 'Sim' }, { rotulo: 'Promoção Moto', valor: 'Sim' }, { rotulo: 'Linhas visíveis', valor: '12 de 14' }],
        },
      },
      {
        titulo: 'Simular e salvar',
        texto:
          'O **simulador** mostra o atacado, o varejo e o preço deste tipo para um produto, com as regras **já salvas**. **Salvar N alterações** pede confirmação e guarda o histórico; o preço novo vale no próximo preço pedido. Quem está com a loja aberta pode precisar recarregar para ver uma mudança de visibilidade.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'percentual', rotulo: 'Ajusta os percentuais' },
            { icone: 'check', rotulo: 'Salvar N alterações' },
            { icone: 'olho', rotulo: 'Simulador confere', tom: 'info' },
            { icone: 'usuarios', rotulo: 'Vale para o próximo preço', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.pedidos',
    publico: 'admin',
    titulo: 'Pedidos da loja',
    resumo: 'Os pedidos do site organizados em filas, do que precisa de ação ao que já foi entregue.',
    passos: [
      {
        titulo: 'As filas',
        texto:
          '**Precisa de ação**, **Pagos · a separar**, **Aguardando cliente** (Pix ou boleto em aberto, cartão em análise), **Em andamento** (faturado até enviado), **Concluídos** e **Não concluídos**. A tela abre na primeira fila que tiver pedido, e o número do menu soma as duas primeiras.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Precisa de ação', tom: 'erro', sub: 'resolva primeiro' },
            { texto: 'Pagos · a separar', tom: 'atencao', sub: 'pago e no NZERP' },
            { texto: 'Em andamento', tom: 'info', sub: 'faturado até enviado' },
            { texto: 'Concluídos', tom: 'ok', sub: 'entregues' },
          ],
        },
      },
      {
        titulo: 'Dois caminhos de pedido',
        texto:
          '**Pago online**: quando o Asaas confirma, o pedido vai sozinho ao NZERP. **Orçamento**: o cliente enviou sem pagar; fica **aguardando vendedor** em Precisa de ação até alguém montar e clicar **Enviar ao NZERP**.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pago online', icone: 'cartao', tom: 'ok', itens: ['Pix, boleto ou cartão', 'Confirmou: vai sozinho ao NZERP'] },
            { titulo: 'Orçamento', icone: 'nota', tom: 'atencao', itens: ['Cliente enviou sem pagar', 'Vendedor monta', 'Enviar ao NZERP à mão'] },
          ],
        },
      },
      {
        titulo: 'O que pede ação',
        texto:
          'Pedido **pago que não chegou ao NZERP** (ou que o NZERP não soube do pagamento), orçamento **aguardando vendedor**, **dados incompletos** do cliente e pedido **não entregue**. O botão da linha resolve o caso mais comum; os outros se resolvem no detalhe.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'olho', rotulo: 'Precisa de ação' },
            { icone: 'nota', rotulo: 'Abre o pedido' },
            { icone: 'banco', rotulo: 'Enviar ao NZERP', tom: 'info' },
            { icone: 'check', rotulo: 'Sai da fila', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Carrinhos parados e cartões recusados',
        texto:
          '**Carrinhos parados**: carrinhos de clientes logados sem mexer há mais de algumas horas (você escolhe; começa em 24), bons para um contato. **Cartões recusados**: as recusas dos últimos 7 dias. O pedido com cartão recusado na primeira tentativa não fica na lista: sobra só este registro.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Carrinhos parados', icone: 'carrinho', tom: 'atencao', itens: ['Cliente logado', 'Parado há mais de X horas', 'Oportunidade de contato'] },
            { titulo: 'Cartões recusados', icone: 'cartao', tom: 'erro', itens: ['Últimos 7 dias', 'Pedido não ficou criado'] },
          ],
        },
      },
      {
        titulo: 'Abrir um pedido',
        texto:
          'Clique na linha para o detalhe: itens com foto, cliente, cobranças do Asaas e linha do tempo. **Abrir já confere** o Asaas e manda ao NZERP o que tinha ficado para trás. A lista mostra os 300 pedidos mais recentes; use a busca para os antigos.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'busca', rotulo: 'Busca ou fila' },
            { icone: 'nota', rotulo: 'Abre o detalhe' },
            { icone: 'cartao', rotulo: 'Confere o Asaas', tom: 'info' },
            { icone: 'banco', rotulo: 'Atualiza o NZERP', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.pedido-detalhe',
    publico: 'admin',
    titulo: 'Detalhe do pedido',
    resumo: 'Tudo de um pedido e as ações: enviar ao NZERP, estornar e cancelar.',
    passos: [
      {
        titulo: 'O que tem aqui',
        texto:
          'Cartões de **Cliente**, **Entrega**, **Pagamento** e **NZERP**; os itens; as **cobranças no Asaas**; a **linha do tempo**; e os eventos do webhook deste pedido. Abrir esta tela já confere o Asaas e reenvia ao NZERP o que estava pendente; **Atualizar** faz de novo.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Quem e onde', icone: 'usuario', tom: 'info', itens: ['Cliente', 'Entrega e frete'] },
            { titulo: 'Dinheiro', icone: 'cartao', tom: 'ok', itens: ['Pagamento', 'Cobranças no Asaas'] },
            { titulo: 'NZERP', icone: 'banco', tom: 'marca', itens: ['Orçamento', 'Linha do tempo'] },
          ],
        },
      },
      {
        titulo: 'Enviar ao NZERP',
        texto:
          '**Enviar ao NZERP** cria o orçamento lá: é o caminho do pedido que o cliente mandou como orçamento. Pago online vai sozinho; se o NZERP não soube do pagamento, aparece **Avisar o NZERP do pagamento**. Cuidado: enviar um pedido com Pix ou boleto em aberto manda um pedido ainda não pago.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'nota', rotulo: 'Pedido do site' },
            { icone: 'banco', rotulo: 'Enviar ao NZERP' },
            { icone: 'check', rotulo: 'Orçamento criado no NZERP', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Estornar',
        texto:
          'Só para cobrança **paga por Pix ou cartão** (boleto se estorna no próprio Asaas). Pode ser total ou parcial e **não dá para desfazer**. O estorno total devolve o saldo da carteira que o cliente usou. O estorno não cancela o orçamento no NZERP: cancele lá também.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pago', tom: 'ok', sub: 'Pix ou cartão' },
            { texto: 'Estornado', tom: 'neutro', sub: 'total ou parcial' },
          ],
        },
      },
      {
        titulo: 'Cancelar pedido',
        texto:
          'Só para pedido **não pago**: remove as cobranças em aberto no Asaas, cancela no NZERP e devolve o saldo da carteira. Se o vendedor já avançou o pedido no NZERP, o cancelamento é recusado (e as cobranças já terão sido removidas).',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'cartao', rotulo: 'Remove cobranças em aberto' },
            { icone: 'banco', rotulo: 'Cancela no NZERP' },
            { icone: 'carteira', rotulo: 'Saldo volta ao cliente', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.pagamentos',
    publico: 'admin',
    titulo: 'Pagamento online (Asaas)',
    resumo: 'Ligar o checkout, ajustar Pix, boleto e cartão e acompanhar a integração com o Asaas.',
    passos: [
      {
        titulo: 'Ligar e desligar',
        texto:
          '**Pagamento online** abre ou fecha o checkout para todo mundo. Além dessa chave geral, cada tipo de acesso tem a sua em **Tipos de acesso → Visibilidade**. Desligado, o cliente ainda pode mandar o pedido como **orçamento**.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Aberto ao público', tom: 'ok', sub: 'Pix, boleto e cartão' },
            { texto: 'Desligado', tom: 'neutro', sub: 'só orçamento' },
          ],
        },
      },
      {
        titulo: 'Pix, boleto e cartão',
        texto:
          'Validade do Pix, vencimento do boleto (dias úteis), multa e juros, boleto a partir de um valor, número máximo de parcelas e parcela mínima. Vale para o **próximo** pedido. Não há liga/desliga por forma: para tirar o boleto dos pedidos pequenos, suba o **boleto a partir de**.',
        cena: {
          tipo: 'formulario',
          titulo: 'Pix, boleto e cartão',
          campos: [{ rotulo: 'Pix expira em (min)' }, { rotulo: 'Boleto vence em (dias úteis)' }, { rotulo: 'Boleto a partir de (R$)' }, { rotulo: 'Parcelas no cartão (máx.)' }],
        },
      },
      {
        titulo: 'Saúde da integração',
        texto:
          'A chave do Asaas, o **webhook** (se aparecer **fila pausada**, religue no painel do Asaas), o último evento e os erros. **Rodar manutenção agora** reprocessa eventos com erro, expira Pix vencido, reconsulta cobranças e reenvia ao NZERP os pedidos pagos. Ela também roda sozinha todo dia.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'cartao', rotulo: 'Asaas avisa (webhook)' },
            { icone: 'nota', rotulo: 'Site confere a cobrança' },
            { icone: 'check', rotulo: 'Pedido pago', tom: 'ok' },
            { icone: 'banco', rotulo: 'Vai ao NZERP', tom: 'info' },
          ],
        },
      },
      {
        titulo: 'Eventos e cobrança órfã',
        texto:
          'A conta do Asaas é a mesma do NZERP: por padrão a lista mostra os eventos da loja e os que deram erro; **resolvido** tira um erro já tratado. **Remover cobrança órfã** apaga no Asaas uma cobrança `pay_…` que sobrou, só se ela não estiver paga.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Processado', tom: 'ok', sub: 'evento aplicado' },
            { texto: 'Com erro', tom: 'erro', sub: 'manutenção tenta de novo' },
            { texto: 'Resolvido', tom: 'neutro', sub: 'tratado à mão' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.logistica',
    publico: 'admin',
    titulo: 'Logística & Transportadoras',
    resumo: 'Embalagens, transportadoras, retirada e frete grátis: a base da cotação de frete do checkout.',
    passos: [
      {
        titulo: 'Entrega da loja',
        texto:
          '**Retirada em São Paulo** (liga, desliga e o endereço mostrado ao cliente; custa R$ 0) e **frete grátis acima de** um valor (vazio = nunca). O frete grátis olha os produtos já com o cupom e zera **todas** as opções de transportadora.',
        cena: {
          tipo: 'formulario',
          titulo: 'Entrega da loja',
          campos: [{ rotulo: 'Retirada', valor: 'Oferecida' }, { rotulo: 'Endereço mostrado ao cliente' }, { rotulo: 'Frete grátis acima de (R$)', valor: 'vazio = nunca' }],
        },
      },
      {
        titulo: 'Perfis de embalagem',
        texto:
          'Cada linha comercial precisa de um **perfil**: formato (rolo, caixa, tubo), peso, medidas, valor declarado e dias de produção. A cotação usa o perfil do produto, senão o **padrão da linha** (★, duplo clique), senão qualquer um da linha. Linha sem perfil: o carrinho só oferece retirada.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'caixa', rotulo: 'Produto no carrinho' },
            { icone: 'nota', rotulo: 'Perfil do produto ou da linha' },
            { icone: 'caminhao', rotulo: 'Volumes cotados', tom: 'info' },
            { icone: 'check', rotulo: 'Opções no checkout', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Transportadoras',
        texto:
          'Só as **ativas** entram na cotação. CEP de origem, dias de manuseio e serviços são salvos ao sair do campo; as credenciais ficam no servidor. Uma opção só aparece se atende todos os volumes do carrinho. No modo simulado, os valores não são reais.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Ativa', tom: 'ok', sub: 'entra na cotação' },
            { texto: 'Desativada', tom: 'neutro', sub: 'fica de fora' },
          ],
        },
      },
      {
        titulo: 'Teste de cotação',
        texto:
          'Escolha o perfil, o CEP de destino e a quantidade e clique **Consultar** para ver o que o cliente veria. Mudou embalagem ou transportadora? Use **Limpar cache de cotações**: as respostas ficam guardadas por alguns dias.',
        cena: {
          tipo: 'formulario',
          titulo: 'Teste de cotação',
          campos: [{ rotulo: 'Perfil', valor: 'Rolo 1,52 m' }, { rotulo: 'CEP de destino', valor: '00000-000' }, { rotulo: 'Quantidade', valor: '2' }],
        },
      },
    ],
  },

  {
    id: 'admin.garantias',
    publico: 'admin',
    titulo: 'Garantias oficiais',
    resumo: 'A fila de aprovação dos registros de garantia e o envio do certificado oficial.',
    passos: [
      {
        titulo: 'Todo registro chega aqui',
        texto:
          'Cada registro feito em **/registro-garantia** entra como protocolo em **Para aprovar**, e a NZ recebe um e-mail de aviso. As abas separam **Para aprovar**, **Aprovadas**, **Recusadas** e **Todas**; a busca acha por protocolo, placa, nome, CPF, e-mail, aplicador ou selo.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Para aprovar', tom: 'atencao', sub: 'protocolo novo' },
            { texto: 'Aprovada', tom: 'ok', sub: 'certificado emitido' },
            { texto: 'Recusada', tom: 'erro', sub: 'com motivo' },
          ],
        },
      },
      {
        titulo: 'Aprovar e enviar o certificado',
        texto:
          'Em **Aprovar**, deixe marcado **enviar o certificado por e-mail agora** (dá para corrigir o e-mail; o novo passa a valer na garantia). O sistema gera o **PDF oficial**, baixa uma cópia para você e manda anexo ao cliente. Aprove pelo site no ar: o QR do PDF usa o endereço de onde você está.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'check', rotulo: 'Aprovar', tom: 'ok' },
            { icone: 'nota', rotulo: 'PDF oficial gerado' },
            { icone: 'download', rotulo: 'Cópia baixada para você', tom: 'info' },
            { icone: 'selo', rotulo: 'Certificado no e-mail do cliente', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Recusar',
        texto:
          '**Recusar** pede um motivo (de 3 a 500 letras), que fica na garantia. O cliente **não recebe e-mail** da recusa: avise pelo WhatsApp. **Aprovar mesmo assim** reverte uma recusa.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Recusada', tom: 'erro', sub: 'motivo obrigatório' },
            { texto: 'Aprovar mesmo assim', tom: 'info', sub: 'reverte a recusa' },
          ],
        },
      },
      {
        titulo: 'Depois de aprovada',
        texto:
          '**Reenviar certificado**, **Ver certificado**, **Copiar link**, **WhatsApp** (mensagem já com o link) e **Baixar certificado**. Pediu **via impressa**? O botão **Etiqueta** gera o endereço para os Correios; o envio é feito à mão. **Excluir** é definitivo e solta o selo.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Para o cliente', icone: 'usuario', tom: 'ok', itens: ['Reenviar por e-mail', 'Copiar link', 'WhatsApp com o link'] },
            { titulo: 'Para a equipe', icone: 'nota', tom: 'info', itens: ['Baixar o PDF', 'Etiqueta da via impressa', 'Excluir (definitivo)'] },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.saques',
    publico: 'admin',
    titulo: 'Saques',
    resumo: 'Os pedidos de saque por Pix da carteira dos clientes e afiliados.',
    passos: [
      {
        titulo: 'De onde vem o saque',
        texto:
          'O cliente junta saldo na carteira (cashback, comissão, bônus, pontos) e pede o saque por Pix em **Indique e ganhe**, com a chave cadastrada e a partir do **saque mínimo**. O valor sai da carteira na hora do pedido.',
        cena: {
          tipo: 'carteira',
          titulo: 'Carteira do cliente',
          linhas: [
            { rotulo: 'Cashback · indicado nº 1', valor: 45, tom: 'ok', status: 'disponível' },
            { rotulo: 'Comissão · indicado nº 2', valor: 60, tom: 'ok', status: 'disponível' },
            { rotulo: 'Saque Pix', valor: -80, tom: 'neutro' },
          ],
          total: { rotulo: 'Fica disponível', valor: 25 },
        },
      },
      {
        titulo: 'Vira conta a pagar no NZERP',
        texto:
          'Cada saque vira um título em aberto no **Contas a Pagar** do NZERP: fornecedor **CASHBACK: nome do cliente**, número **SAQ-…** e forma Pix com a chave. O vencimento conta **dias úteis**; pedido depois da **hora de corte** conta do dia seguinte.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cliente pede' },
            { icone: 'carteira', rotulo: 'Sai da carteira' },
            { icone: 'banco', rotulo: 'Título SAQ- no NZERP', tom: 'info' },
            { icone: 'pix', rotulo: 'Financeiro paga o Pix', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Os status',
        texto:
          '**Solicitado**: ainda não chegou ao NZERP (estava fora do ar); o site tenta de novo. **Em pagamento**: está no Contas a Pagar esperando. **Pago**: baixado no NZERP. **Cancelado**: cancelado no NZERP, e o valor volta para a carteira do cliente.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Solicitado', tom: 'erro', sub: 'não chegou ao NZERP' },
            { texto: 'Em pagamento', tom: 'atencao', sub: 'no Contas a Pagar' },
            { texto: 'Pago', tom: 'ok', sub: 'baixado no NZERP' },
          ],
        },
      },
      {
        titulo: 'Esta tela só mostra',
        texto:
          'Pagar, dar baixa ou cancelar é no **NZERP**. O site confere o NZERP **uma vez por dia**, de madrugada: um saque pago hoje aparece como pago aqui (e para o cliente) no dia seguinte. Cancelado lá, o saldo volta sozinho.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'Baixa ou cancela no NZERP' },
            { icone: 'relogio', rotulo: 'Conferência diária', tom: 'atencao' },
            { icone: 'check', rotulo: 'Atualiza aqui e no painel', tom: 'ok' },
          ],
        },
      },
    ],
  },
  {
    id: 'admin.home',
    publico: 'admin',
    titulo: 'Dashboard',
    resumo: 'Tráfego do site, leads e cadastros do período escolhido.',
    passos: [
      {
        titulo: 'Escolha o período',
        texto:
          'Hoje, 7 dias, Mês (o padrão), Trimestre, Semestre ou Ano. **Visitantes únicos** contam sessões; **rejeição** é a sessão que viu uma página só (acima de 70% o número fica em alerta); **conversão** é leads ÷ visitantes.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Tráfego', icone: 'olho', tom: 'info', itens: ['Visitantes únicos', 'Page views e tempo médio', 'Rejeição'] },
            { titulo: 'Captação', icone: 'email', tom: 'ok', itens: ['Leads captados', 'Atendidos e pendentes', 'Conversão'] },
          ],
        },
      },
      {
        titulo: 'Gráficos e mapa de cliques',
        texto:
          'Visitantes por dia, leads por origem, as 10 páginas mais vistas, a localização dos acessos e o **mapa térmico** de cliques por página. O mapa é uma aproximação: serve para ver tendência, não o botão exato.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'calendario', rotulo: 'Visitantes por dia' },
            { icone: 'nota', rotulo: 'Top 10 páginas' },
            { icone: 'mapa', rotulo: 'Localização e cliques', tom: 'info' },
          ],
        },
      },
      {
        titulo: 'Cadastros: aprove em Clientes',
        texto:
          'Os cartões mostram novos cadastros e os que aguardam aprovação. Para aprovar, use **Clientes & Revendedores**: lá você escolhe o tipo e a faixa, e o cliente recebe o e-mail de acesso liberado. A faixa no topo avisa quando há ocorrências abertas na **Central**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cadastro pendente' },
            { icone: 'usuarios', rotulo: 'Clientes & Revendedores' },
            { icone: 'check', rotulo: 'Aprovar com tipo e faixa', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.central',
    publico: 'admin',
    titulo: 'Central de erros e mudanças',
    resumo: 'A caixa de entrada do que o site precisa contar à equipe.',
    passos: [
      {
        titulo: 'Três tipos de aviso',
        texto:
          '**Erros**: atacado zerado (produto sem preço de atacado no NZERP) e sync que falhou. **Mudanças**: SKU novo, SKU removido e preço que mudou muito. **Problemas informados**: o que clientes mandaram pelo botão da página do produto. Só o sistema cria avisos; nada é apagado.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Erros', icone: 'relogio', tom: 'erro', itens: ['Atacado zerado', 'Sync falhou'] },
            { titulo: 'Mudanças', icone: 'nota', tom: 'atencao', itens: ['SKU novo ou removido', 'Preço mudou'] },
            { titulo: 'Problemas', icone: 'usuario', tom: 'info', itens: ['Informado pelo cliente', 'Com foto e contato'] },
          ],
        },
      },
      {
        titulo: '“Resolver” não conserta',
        texto:
          '**Resolver** só registra que alguém tratou. Atacado zerado se corrige no **NZERP**: no próximo sync (até 5 minutos) o aviso fecha sozinho; se continuar zerado, ele volta. Sync que falhou fecha sozinho no próximo sync que passar.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'Corrige no NZERP' },
            { icone: 'relogio', rotulo: 'Próximo sync (até 5 min)' },
            { icone: 'check', rotulo: 'Aviso fecha sozinho', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Mudanças do catálogo',
        texto:
          'Aparecem no sync diário ou quando você clica **Rodar sync agora**. Preço que mudou acima do limite configurado gera um aviso por SKU. Conferiu? **Marcar como visto**, ou **Marcar as N como vistas** de uma vez.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Nova', tom: 'atencao', sub: 'no sync diário' },
            { texto: 'Vista', tom: 'ok', sub: 'conferida' },
          ],
        },
      },
      {
        titulo: 'Problemas informados',
        texto:
          'O cliente (sem precisar de conta) escolhe o motivo, escreve, pode anexar foto e deixar contato; a equipe também recebe por e-mail. Responda pelo contato, deixe uma **nota** e **Resolver**. As resolvidas ficam 30 dias na aba e podem ser **reabertas**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cliente informa' },
            { icone: 'email', rotulo: 'Equipe recebe' },
            { icone: 'whatsapp', rotulo: 'Responde o contato' },
            { icone: 'check', rotulo: 'Resolver com nota', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.produtos',
    publico: 'admin',
    titulo: 'Produtos da loja',
    resumo: 'O lado editorial dos produtos: fotos, textos, ficha, SEO e publicação.',
    passos: [
      {
        titulo: 'O que vem de onde',
        texto:
          '**SKU, nome oficial, preço e estoque vêm do NZERP.** Aqui fica o editorial: fotos e vídeo, descrição, ficha técnica, SEO e a publicação na loja.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Vem do NZERP', icone: 'banco', tom: 'info', itens: ['SKU e nome oficial', 'Preço', 'Estoque'] },
            { titulo: 'Feito aqui', icone: 'camera', tom: 'marca', itens: ['Fotos e vídeo', 'Descrição e ficha', 'SEO e publicação'] },
          ],
        },
      },
      {
        titulo: 'O cadastro em 5 pontos',
        texto:
          'A barrinha de cadastro soma 5 pontos: **capa**, **2 fotos ou mais**, **descrição**, **ficha** com 3 linhas ou mais e **título SEO**. Com menos de 3, o produto entra em **Cadastro incompleto**. Os cartões do topo filtram: sem foto, incompleto, sem conexão, inativo no ERP.',
        cena: {
          tipo: 'niveis',
          niveis: [{ nome: 'Capa' }, { nome: '2 fotos' }, { nome: 'Descrição' }, { nome: 'Ficha' }, { nome: 'SEO' }],
        },
      },
      {
        titulo: 'Quando aparece na loja',
        texto:
          'O produto está **visível** quando está **publicado**, **não oculto à mão**, com o **SKU ativo no NZERP** e, se tiver data de lançamento, depois dela. Sem SKU, não dá para publicar.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'check', rotulo: 'Publicado' },
            { icone: 'olho', rotulo: 'Não oculto' },
            { icone: 'banco', rotulo: 'SKU ativo no NZERP' },
            { icone: 'loja', rotulo: 'Visível na loja', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Em lote',
        texto:
          'Marque vários e use **Publicar**, **Ocultar** ou **Mostrar**. Se algum marcado não tiver SKU, o Publicar em lote falha inteiro. **↓ CSV** exporta a página que está na tela. **+ Novo produto** abre o editor vazio.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Publicar', tom: 'ok', sub: 'todos com SKU' },
            { texto: 'Ocultar', tom: 'neutro', sub: 'some da loja' },
            { texto: 'Mostrar', tom: 'info', sub: 'volta a aparecer' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.produto-editor',
    publico: 'admin',
    titulo: 'Editor de produto',
    resumo: 'Dados, mídia, ficha, vínculo com o ERP e SEO de um produto.',
    passos: [
      {
        titulo: 'As abas',
        texto:
          '**Dados**, **Mídia**, **Ficha**, **ERP** e **SEO**; um ponto na aba avisa que falta algo. A lateral mostra como o produto aparece na loja e no Google. **Salvar** (ou Ctrl+S) e **Salvar e próximo** gravam.',
        cena: {
          tipo: 'formulario',
          titulo: 'Abas do editor',
          campos: [{ rotulo: 'Dados', valor: 'nome, descrição, publicação' }, { rotulo: 'Mídia', valor: 'grava na hora' }, { rotulo: 'Ficha' }, { rotulo: 'ERP' }, { rotulo: 'SEO' }],
        },
      },
      {
        titulo: 'Mídia grava na hora',
        texto:
          'Arraste as fotos: elas viram WebP (até 1.600 px; mínimo de 600 px no lado menor). A primeira foto de um produto sem capa vira a **capa**; **☆ capa** troca, **← →** ordena, e o texto alternativo ajuda o Google. Vídeo: MP4/WebM de até 20 s, ou link. A Mídia grava sozinha; o resto só com **Salvar**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'camera', rotulo: 'Arrasta a foto' },
            { icone: 'download', rotulo: 'Vira WebP' },
            { icone: 'selo', rotulo: '1ª foto vira capa', tom: 'info' },
            { icone: 'check', rotulo: 'Já está na loja', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Ficha e SEO',
        texto:
          'Na **Ficha**, **+ Linha** ou **Puxar do ERP**. No **SEO**, título (até 70 caracteres) e descrição (até 180); **Sugerir a partir dos dados** dá um ponto de partida. Lembre de **Salvar**: a ficha e o SEO não gravam sozinhos.',
        cena: {
          tipo: 'formulario',
          titulo: 'SEO',
          campos: [{ rotulo: 'Título SEO', valor: 'até 70' }, { rotulo: 'Descrição', valor: 'até 180' }],
        },
      },
      {
        titulo: 'ERP e publicação',
        texto:
          'Na aba **ERP**, o vínculo (próprio, alias ou pendente) e **Procurar SKU**. Em Dados, **Publicado** e **Oculto à mão**. O endereço (slug) não muda depois de criado. **Duplicar** cria uma cópia pendente sem fotos nem SKU.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pendente', tom: 'atencao', sub: 'sem SKU' },
            { texto: 'Vinculado', tom: 'info', sub: 'SKU do NZERP' },
            { texto: 'Visível na loja', tom: 'ok', sub: 'publicado' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.avaliacoes',
    publico: 'admin',
    titulo: 'Avaliações & Cashback',
    resumo: 'Moderar as avaliações dos clientes, responder e definir a troca de pontos por crédito.',
    passos: [
      {
        titulo: 'Quem pode avaliar',
        texto:
          'Só quem **comprou** o produto (pedido do site pago ou pedido do NZERP aprovado em diante), **uma vez por produto**, com nota de 1 a 5 e texto de pelo menos 20 caracteres. Toda avaliação chega em **Esperando moderação**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'carrinho', rotulo: 'Cliente comprou' },
            { icone: 'estrela', rotulo: 'Avaliou' },
            { icone: 'relogio', rotulo: 'Esperando moderação', tom: 'atencao' },
          ],
        },
      },
      {
        titulo: 'Publicar ou recusar',
        texto:
          '**Publicar** põe a avaliação na página do produto e dá os pontos ao cliente (40, mais 30 com foto e mais 20 com texto longo), uma vez só, qualquer que seja a nota. **Recusar** pede um motivo, que o cliente vê na conta (sem e-mail). Recusar uma já publicada não tira os pontos.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Esperando', tom: 'atencao', sub: 'moderar' },
            { texto: 'Publicada', tom: 'ok', sub: 'pontos ao cliente' },
            { texto: 'Recusada', tom: 'neutro', sub: 'com motivo' },
          ],
        },
      },
      {
        titulo: 'Responder',
        texto:
          'Nas publicadas, escreva a resposta e **Salvar resposta**: ela aparece embaixo da avaliação, na loja e na conta do cliente. Resposta vazia apaga.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'estrela', rotulo: 'Avaliação publicada' },
            { icone: 'nota', rotulo: 'Resposta da NZ' },
            { icone: 'loja', rotulo: 'Aparece na loja', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Pontos viram crédito',
        texto:
          'As **campanhas** dizem quantos pontos valem quanto em R$. O cliente resgata em **Pontos e cashback** e o valor entra na **carteira** dele na hora (usa no checkout ou saca por Pix). Campanha não se edita: crie outra e desligue a antiga.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'trofeu', rotulo: 'Pontos do cliente' },
            { icone: 'presente', rotulo: 'Campanha de troca' },
            { icone: 'carteira', rotulo: 'R$ na carteira', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.erp',
    publico: 'admin',
    titulo: 'Integração NZERP',
    resumo: 'O espelho do NZERP no site e o mapa de SKU dos produtos.',
    passos: [
      {
        titulo: 'O espelho do NZERP',
        texto:
          'SKUs, preço de venda (atacado e varejo) e estoque vêm do NZERP; custo e margem não. O sync roda quando o NZERP avisa (a cada 5 minutos) e uma vez por dia; **Sincronizar agora** roda na hora. A tabela mostra os últimos syncs.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'NZERP' },
            { icone: 'relogio', rotulo: 'Sync (5 min e diário)' },
            { icone: 'loja', rotulo: 'Preço e estoque no site', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Mapa de SKU',
        texto:
          'Liga cada produto do site a um SKU do NZERP. Nos **pendentes**, confira e **Confirmar**: o SKU vai para o produto e ele é **publicado** (menos alias). Editar o SKU e sair do campo faz o mesmo. **Remover** apaga o vínculo e tira o produto da loja.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pendente', tom: 'atencao', sub: 'conferir' },
            { texto: 'Conferido', tom: 'ok', sub: 'publicado' },
            { texto: 'Removido', tom: 'neutro', sub: 'fora da loja' },
          ],
        },
      },
      {
        titulo: 'Configuração',
        texto:
          '**Últimas unidades (m)**: abaixo desse saldo o produto mostra "Últimas unidades", quando o SKU não tem estoque mínimo no NZERP. **Ativa — desativar** desliga **todo** o sync, inclusive os botões manuais: use só em emergência.',
        cena: {
          tipo: 'formulario',
          titulo: 'Configuração',
          campos: [{ rotulo: 'Limite de “últimas unidades” (m)' }, { rotulo: 'Sincronização', valor: 'Ativa' }],
        },
      },
    ],
  },

  {
    id: 'admin.leads',
    publico: 'admin',
    titulo: 'Leads & Contatos',
    resumo: 'Os contatos que chegam pelos formulários do site.',
    passos: [
      {
        titulo: 'Uma lista só',
        texto:
          'Junta os leads de **cupom** das páginas NZPPF e os pedidos do **Encontre um aplicador**, os 200 mais recentes de cada. O WhatsApp é clicável para responder na hora; a origem e o detalhe dizem de onde veio.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Cupom NZPPF', icone: 'cupom', tom: 'marca', itens: ['Páginas da linha', 'Nome e WhatsApp'] },
            { titulo: 'Encontre um aplicador', icone: 'mapa', tom: 'info', itens: ['Cidade e serviço', 'Pedido de contato'] },
          ],
        },
      },
      {
        titulo: 'Pendente e atendido',
        texto: 'Clique no status para alternar entre **Pendente** e **Atendido**. Ele muda na hora, sem pedir confirmação.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pendente', tom: 'atencao', sub: 'responder' },
            { texto: 'Atendido', tom: 'ok', sub: 'contato feito' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.promo',
    publico: 'admin',
    titulo: 'Páginas promocionais',
    resumo: 'As landing pages de campanha e os cadastros de cada uma.',
    passos: [
      {
        titulo: 'As campanhas',
        texto:
          'Cada cartão é uma campanha (hoje, Festival Interlagos e Coleção NZPPF 2026): **Abrir página**, **Copiar link**, **Link do QR** (com UTM, para impresso) e **Ver cadastros**. Campanha nova precisa ser criada no código.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'link', rotulo: 'Link ou QR da campanha' },
            { icone: 'usuario', rotulo: 'Pessoa se cadastra' },
            { icone: 'nota', rotulo: 'Aparece aqui', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Cadastros e brinde',
        texto:
          'Filtre pelos chips de status e **Exportar CSV** leva o que está filtrado. No Interlagos, o brinde anda por **pendente → validado → enviado** (ou recusado), e **Copiar** monta a etiqueta.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pendente', tom: 'atencao' },
            { texto: 'Validado', tom: 'info' },
            { texto: 'Enviado', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.equipe',
    publico: 'admin',
    titulo: 'Usuários do sistema',
    resumo: 'Quem da equipe tem acesso de administrador ao site.',
    passos: [
      {
        titulo: 'Só o convite dá acesso',
        texto:
          'A lista vem da equipe do NZERP, mas estar no NZERP **não basta**: só **Convidar** transforma a pessoa em administrador do site (e a conta precisa ter o e-mail confirmado). **Sincronizar com o ERP** atualiza quem já tem acesso e bloqueia quem saiu do NZERP; não dá acesso a ninguém.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'banco', rotulo: 'Pessoa no NZERP' },
            { icone: 'email', rotulo: 'Convidar' },
            { icone: 'cadeado', rotulo: 'Aceita e cria a senha' },
            { icone: 'check', rotulo: 'Com acesso', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Convite e acesso',
        texto:
          '**Enviar convite por e-mail** ou **Copiar link** para mandar por outro canal; link vencido, **Novo link**. **Remover acesso** bloqueia a conta e tira o administrador; ninguém remove a si mesmo.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Sem acesso', tom: 'neutro' },
            { texto: 'Convidado', tom: 'atencao' },
            { texto: 'Com acesso', tom: 'ok' },
            { texto: 'Bloqueado', tom: 'erro' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.blog',
    publico: 'admin',
    titulo: 'Blog & Conteúdos',
    resumo: 'Escrever, publicar e editar os posts do blog.',
    passos: [
      {
        titulo: 'Escrever um post',
        texto:
          '**+ Nova Postagem**: título, meta description, palavra-chave foco, imagem (UPLOAD DA MÁQUINA) e o corpo em Markdown. Em post longo, copie o texto antes de salvar: se der erro, o editor fecha.',
        cena: {
          tipo: 'formulario',
          titulo: 'Nova postagem',
          campos: [{ rotulo: 'Título' }, { rotulo: 'Meta Description' }, { rotulo: 'Palavra-chave foco' }, { rotulo: 'Status', valor: 'Rascunho' }],
        },
      },
      {
        titulo: 'O status manda',
        texto:
          'O site só mostra posts **Publicados**. O seletor de status começa em **Rascunho**: troque para Publicado antes de salvar para o post ir ao ar. **Excluir** apaga de vez.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Rascunho', tom: 'atencao', sub: 'só aqui' },
            { texto: 'Publicado', tom: 'ok', sub: 'no blog' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.blog-ia',
    publico: 'admin',
    titulo: 'Motor IA (SEO autônomo)',
    resumo: 'Campanhas de temas que geram posts para o blog sozinhas.',
    passos: [
      {
        titulo: 'Campanhas de temas',
        texto:
          'Cada campanha tem os temas, a **frequência** (12, 24, 48 ou 168 horas), o modo de publicação (**rascunho para revisão** ou **publicar automaticamente**) e o status **ALIVE** ou **PAUSED** (clique para trocar).',
        cena: {
          tipo: 'formulario',
          titulo: 'Ajustar motor',
          campos: [{ rotulo: 'Frequência', valor: '24 h' }, { rotulo: 'Publicação', valor: 'Rascunho para revisão' }, { rotulo: 'Status', valor: 'ALIVE' }],
        },
      },
      {
        titulo: 'Quando roda',
        texto:
          'O motor roda **uma vez por dia** e gera **no máximo um post por dia**, da campanha mais atrasada: frequência de 12 horas não vira dois posts no dia. **Disparar Agora** gera na hora, só em campanha ativa.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Rodada diária', sub: '1 vez por dia' },
            { rotulo: 'Campanha mais atrasada', tom: 'atencao' },
            { rotulo: '1 post gerado', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Revisar antes de publicar',
        texto:
          'Em **rascunho para revisão**, o post espera em **Blog & Conteúdos** até alguém revisar e publicar. Em **publicar automaticamente**, ele vai direto ao ar: confira os posts com frequência.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Rascunho para revisão', icone: 'olho', tom: 'ok', itens: ['Espera no Blog', 'Você publica'] },
            { titulo: 'Automático', icone: 'relogio', tom: 'atencao', itens: ['Vai direto ao ar', 'Revise depois'] },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.agencia',
    publico: 'admin',
    titulo: 'Agência NZ',
    resumo: 'Geradores de material de marketing feitos no próprio navegador.',
    passos: [
      {
        titulo: 'Os geradores',
        texto:
          'O **Catálogo Físico NZPPF** gera um PDF A5 de 20 páginas, em 300 DPI e com sangria de 3 mm, pronto para gráfica (leva de 25 a 45 segundos). Os outros motores fazem imagens e carrosséis por família. A **Oficina NZ** cria geradores novos.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'nota', rotulo: 'Escolhe o gerador' },
            { icone: 'camera', rotulo: 'Ajusta o conteúdo' },
            { icone: 'download', rotulo: 'PDF ou imagem', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Fica neste navegador',
        texto:
          'As edições do catálogo e os motores criados na Oficina ficam **só neste navegador**: outro computador não vê, e limpar os dados do navegador apaga. Baixe o arquivo pronto ao terminar.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Neste navegador', tom: 'atencao', sub: 'não sincroniza' },
            { texto: 'Arquivo baixado', tom: 'ok', sub: 'guardado de vez' },
          ],
        },
      },
    ],
  },

  {
    id: 'admin.agenda-social',
    publico: 'admin',
    titulo: 'Agenda Social Media',
    resumo: 'O planejamento dos posts das três contas.',
    passos: [
      {
        titulo: 'Planejar',
        texto:
          'Veja os posts em **Kanban**, **Calendário** ou **Plano**, das três contas. **+ Novo post** cria um; **Gerar ideias** sugere posts a partir de modelos prontos; **Importar / Comandar** e **Exportar** levam e trazem a agenda.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Kanban', icone: 'nota', tom: 'info', itens: ['Por status'] },
            { titulo: 'Calendário', icone: 'calendario', tom: 'marca', itens: ['Por data'] },
            { titulo: 'Plano', icone: 'olho', tom: 'ok', itens: ['Visão do mês'] },
          ],
        },
      },
      {
        titulo: 'Ela não publica',
        texto: 'A agenda organiza; a publicação nas redes é feita fora dela. Mude o status do post conforme ele anda até ser publicado.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'presente', rotulo: 'Ideia' },
            { icone: 'camera', rotulo: 'Produção' },
            { icone: 'check', rotulo: 'Publicado fora', tom: 'ok' },
          ],
        },
      },
    ],
  },
];
