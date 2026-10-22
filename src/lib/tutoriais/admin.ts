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
];
