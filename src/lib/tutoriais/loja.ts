// Tutoriais da loja: cadastro, vitrine, página do produto, carrinho e
// checkout. Escritos a partir do código em 22/10/2026 (Register, Loja,
// LojaProduct, Carrinho, Checkout; handlers pedido, checkout, precos, estoque,
// prazo). Números que vêm da configuração do banco não aparecem aqui: o texto
// manda olhar a tela. Mudou a regra, mude aqui. Ver index.ts.

import type { Tutorial } from '../../components/Tutorial/tipos';

export const TUTORIAIS_LOJA: Tutorial[] = [
  {
    id: 'loja.cadastro',
    publico: 'cliente',
    titulo: 'Criar conta na NZ',
    resumo: 'Como funciona o cadastro: tipo de conta, confirmação do e-mail e a liberação dos preços.',
    passos: [
      {
        titulo: 'Escolha o tipo de conta',
        texto:
          '**Cliente final** é para quem compra para o próprio uso. **Lojista / aplicador** e **Revendedor** informam CNPJ, razão social e inscrição estadual (ou ISENTO). O cliente final só informa o CPF na hora de comprar.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Cliente final', icone: 'usuario', tom: 'info', itens: ['Uso próprio', 'CPF só na compra'] },
            { titulo: 'Lojista / aplicador', icone: 'loja', tom: 'marca', itens: ['Aplica e vende', 'CNPJ e razão social'] },
            { titulo: 'Revendedor', icone: 'caixa', tom: 'ok', itens: ['Revende material', 'CNPJ e razão social'] },
          ],
        },
      },
      {
        titulo: 'Confirme o e-mail',
        texto:
          'Depois de **Criar minha conta**, chega um e-mail com o link de confirmação. Clique nele e entre com a sua senha. Não chegou? Use **Reenviar e-mail** (a cada 60 segundos) e olhe o spam. Conta que nunca é confirmada é apagada depois de dois dias.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Cria a conta' },
            { icone: 'email', rotulo: 'Clica no link do e-mail' },
            { icone: 'cadeado', rotulo: 'Entra com a senha', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'A NZ libera os preços',
        texto:
          'Toda conta nasce **em análise**: você já vê o catálogo, mas o preço aparece depois que a NZ confere o cadastro e libera o seu tipo de conta. A NZ avisa por e-mail quando libera. Já é cliente da NZ como lojista ou revendedor, com o mesmo e-mail? A liberação pode sair na hora.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Em análise', tom: 'atencao', sub: 'catálogo sem preço' },
            { texto: 'Liberada', tom: 'ok', sub: 'preço do seu tipo de conta' },
          ],
        },
      },
      {
        titulo: 'Cupom de indicação',
        texto:
          'Foi indicado por um **afiliado** da NZ? Digite o código dele (**NZ-…**) aqui: sua conta fica ligada a ele. Ganhou o **cupom de um amigo** (como MARIA27)? Esse você digita no **carrinho ou no checkout** da sua primeira compra.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Código NZ-… (afiliado)', icone: 'selo', tom: 'info', itens: ['Digite no cadastro', 'Liga sua conta ao afiliado'] },
            { titulo: 'Cupom de amigo', icone: 'cupom', tom: 'marca', itens: ['Digite no carrinho ou checkout', 'Desconto na 1ª compra'] },
          ],
        },
      },
    ],
  },

  {
    id: 'loja.vitrine',
    publico: 'cliente',
    titulo: 'Como achar o produto',
    resumo: 'Busca, filtros, busca por foto e a ação de moto na loja da NZ.',
    passos: [
      {
        titulo: 'Busque e filtre',
        texto:
          'Digite cor, acabamento, marca ou código na busca (a tecla **/** já leva até ela). Em **Filtros**, combine segmento, disponibilidade, cor, acabamento, linha, fabricante, tipo e padrão; cada filtro vira uma etiqueta com ✕. **Ordenar por** muda a ordem.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'busca', rotulo: 'Busca por cor, marca ou código' },
            { icone: 'percentual', rotulo: 'Filtros e ordem' },
            { icone: 'olho', rotulo: 'Só o que interessa', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Busque por uma foto',
        texto:
          'O botão de **câmera** (ou arrastar e colar uma imagem) abre a busca por imagem: o site lê as cores da foto, você toca para pegar a cor de um ponto, escolhe o acabamento e clica **Buscar essa cor**. A cor da foto depende da luz: confirme no mostruário físico.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'camera', rotulo: 'Foto ou print' },
            { icone: 'olho', rotulo: 'Toca na cor' },
            { icone: 'busca', rotulo: 'Buscar essa cor' },
            { icone: 'check', rotulo: 'Mais parecidas primeiro', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'O que o card mostra',
        texto:
          'O selo diz **Pronta entrega · SP** ou **Últimas unidades**. O preço é o do **seu tipo de conta**: sem entrar aparece "Entre para ver o preço", e com o cadastro em análise, "Cadastro em análise". Clique no card para ver tudo do produto.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Sem entrar', tom: 'neutro', sub: 'sem preço' },
            { texto: 'Em análise', tom: 'atencao', sub: 'aguarde a liberação' },
            { texto: 'Liberada', tom: 'ok', sub: 'preço do seu tipo' },
          ],
        },
      },
      {
        titulo: 'Ação de envelopamento de moto',
        texto:
          'O botão **Ação envelopamento de moto** mostra as cores que estão na ação, com foto de moto e o preço do **metro** "de/por". Referência de quanto usar: naked de 2 a 3 m, esportiva carenada e big trail de 3 a 4 m.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Naked', icone: 'bandeira', tom: 'info', itens: ['2 a 3 metros'] },
            { titulo: 'Esportiva carenada', icone: 'bandeira', tom: 'marca', itens: ['3 a 4 metros'] },
            { titulo: 'Big trail', icone: 'bandeira', tom: 'ok', itens: ['3 a 4 metros'] },
          ],
        },
      },
    ],
  },

  {
    id: 'loja.produto',
    publico: 'cliente',
    titulo: 'Como comprar este produto',
    resumo: 'Rolo ou metro, disponibilidade, prazo e os materiais da página do produto.',
    passos: [
      {
        titulo: 'Rolo fechado ou por metro',
        texto:
          'Com a conta liberada, escolha **Rolo fechado** ou **Por metro**, a **quantidade** e veja o **subtotal**. Rolo vai de 1 em 1; metro, de 0,5 em 0,5. **Adicionar ao carrinho** guarda o item; o frete é calculado depois.',
        cena: {
          tipo: 'formulario',
          titulo: 'Comprar',
          campos: [{ rotulo: 'Como comprar', valor: 'Rolo fechado' }, { rotulo: 'Quantidade', valor: '2' }, { rotulo: 'Subtotal', valor: 'preço do seu tipo' }],
        },
      },
      {
        titulo: 'Disponibilidade e prazo',
        texto:
          'O selo mostra **Pronta entrega · SP**, **Últimas unidades** ou **Sob encomenda**; alguns tipos de conta veem também os metros e rolos em estoque. Em **Prazo de entrega**, digite o CEP para ver os prazos em dias úteis.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Pedido pago', sub: 'no site' },
            { rotulo: 'Separação', sub: 'em SP', tom: 'atencao' },
            { rotulo: 'Transporte', sub: 'prazo pelo CEP', tom: 'info' },
            { rotulo: 'Entregue', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Ficha, catálogo e mostruário',
        texto:
          'Embaixo ficam a **ficha técnica** da linha, o **catálogo em PDF** e a página da linha. O **mostruário da cor** em PDF (com ou sem o contato da NZ, sempre sem preço) é feito para você mandar ao seu cliente.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Para você', icone: 'nota', tom: 'info', itens: ['Ficha técnica', 'Catálogo da linha'] },
            { titulo: 'Para o seu cliente', icone: 'download', tom: 'marca', itens: ['Mostruário da cor (PDF)', 'Com ou sem contato NZ'] },
          ],
        },
      },
      {
        titulo: 'Achou algo errado?',
        texto:
          '**Informar um problema nesta página** manda direto para a equipe NZ: preço que não aparece, foto errada, estoque ou ficha. Pode anexar uma foto e deixar um contato; não precisa entrar na conta.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'olho', rotulo: 'Viu algo errado' },
            { icone: 'nota', rotulo: 'Informar um problema' },
            { icone: 'usuarios', rotulo: 'Equipe NZ recebe', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'loja.carrinho',
    publico: 'cliente',
    titulo: 'Carrinho',
    resumo: 'Revisar os itens e escolher entre pagar online ou mandar como orçamento.',
    passos: [
      {
        titulo: 'Revise os itens',
        texto:
          'Ajuste as quantidades com **−** e **+** ou tire com **✕**. O **total é estimado**: o frete entra no passo seguinte. Logado, o carrinho fica guardado na sua conta e aparece no celular e no computador.',
        cena: {
          tipo: 'formulario',
          titulo: 'Carrinho',
          campos: [{ rotulo: 'Rolo fechado', valor: '2 rolos' }, { rotulo: 'Por metro', valor: '3,5 m' }, { rotulo: 'Total estimado', valor: 'sem frete' }],
        },
      },
      {
        titulo: 'Dois jeitos de fechar',
        texto:
          '**Ir para entrega e pagamento**: você paga agora por Pix, cartão ou boleto e o pedido vai direto para a NZ separar. **Enviar como orçamento**: sem pagar agora, um vendedor confere estoque, frete e condição de pagamento e fecha com você.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pagar online', icone: 'cartao', tom: 'ok', itens: ['Pix, cartão ou boleto', 'Frete no próximo passo', 'Pago, vai para separação'] },
            { titulo: 'Orçamento', icone: 'whatsapp', tom: 'info', itens: ['Sem pagar agora', 'Vendedor fecha com você'] },
          ],
        },
      },
      {
        titulo: 'Cupom',
        texto:
          'Digite o código e clique **Aplicar** para conferir o desconto, que vale nos produtos (o frete não entra). Vai pagar online? Digite o cupom de novo no **resumo do checkout**: é lá que ele entra no pagamento.',
        cena: {
          tipo: 'cupom',
          codigo: 'SEUCUPOM',
          selos: [
            { texto: 'desconto nos produtos', tom: 'ok' },
            { texto: 'frete fora', tom: 'neutro' },
            { texto: 'no checkout: digite de novo', tom: 'atencao' },
          ],
        },
      },
      {
        titulo: 'Cadastro completo',
        texto:
          'Para pedir, o cadastro precisa de nome, CPF ou CNPJ, WhatsApp e endereço com CEP. Se faltar algo, o carrinho mostra o que é e o atalho **Completar agora**.',
        cena: {
          tipo: 'formulario',
          titulo: 'Para fechar o pedido',
          campos: [{ rotulo: 'Nome completo', valor: '✓' }, { rotulo: 'CPF ou CNPJ', valor: '✓' }, { rotulo: 'WhatsApp', valor: '✓' }, { rotulo: 'Endereço com CEP', valor: 'falta' }],
        },
      },
    ],
  },

  {
    id: 'loja.checkout',
    publico: 'cliente',
    titulo: 'Checkout',
    resumo: 'Entrega, cupom, saldo da carteira e pagamento, em uma tela.',
    passos: [
      {
        titulo: 'Entrega',
        texto:
          'Confira o endereço (ele fica salvo no seu cadastro) e escolha **como quer receber**: cada opção mostra o prazo e o valor do frete. **Retirar em São Paulo** sai sem frete, com o dia combinado com a NZ.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Transportadora', icone: 'caminhao', tom: 'info', itens: ['Prazo em dias úteis', 'Valor do frete'] },
            { titulo: 'Retirar em SP', icone: 'mapa', tom: 'ok', itens: ['Sem frete', 'Dia combinado'] },
          ],
        },
      },
      {
        titulo: 'Cupom e saldo da carteira',
        texto:
          'No **Resumo**, digite o cupom e clique **Aplicar**. Tem saldo de cashback? Marque **Usar meu saldo**: ele abate do total, e o que sobra para pagar nunca fica abaixo de um valor mínimo. Se o saldo cobre tudo, o botão vira **Concluir com meu saldo**.',
        cena: {
          tipo: 'carteira',
          titulo: 'Resumo do pedido',
          linhas: [
            { rotulo: 'Itens', valor: 620, tom: 'neutro' },
            { rotulo: 'Cupom', valor: -31, tom: 'ok' },
            { rotulo: 'Entrega', valor: 48, tom: 'neutro' },
            { rotulo: 'Saldo da carteira', valor: -40, tom: 'ok' },
          ],
          total: { rotulo: 'A pagar', valor: 597 },
        },
      },
      {
        titulo: 'Pix, cartão ou boleto',
        texto:
          '**Pix**: aprovação na hora, com código que vale alguns minutos. **Cartão**: parcelas sem juros (o número aparece na tela); os dados do cartão não ficam guardados na NZ. **Boleto**: vence em dias úteis. Marque o aceite dos termos e confirme.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pix', icone: 'pix', tom: 'ok', itens: ['Aprovação na hora', 'Código com validade'] },
            { titulo: 'Cartão', icone: 'cartao', tom: 'marca', itens: ['Parcelas sem juros', 'Resposta na hora'] },
            { titulo: 'Boleto', icone: 'nota', tom: 'info', itens: ['Vence em dias úteis', 'Compensa em até 3 dias úteis'] },
          ],
        },
      },
      {
        titulo: 'Depois de pagar',
        texto:
          'Você vai para a página do pedido, com o QR do Pix ou a linha do boleto. Ela confere o pagamento sozinha. Confirmado, o pedido vai para a NZ separar; acompanhe em **Meus pedidos**. Se o Pix vencer ou o cartão for recusado, **Pagar de novo** gera outra cobrança.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Cobrança gerada', sub: 'Pix, cartão ou boleto' },
            { rotulo: 'Pagamento confirmado', tom: 'ok' },
            { rotulo: 'NZ separa', sub: 'pedido no NZERP', tom: 'atencao' },
            { rotulo: 'Faturado e enviado', tom: 'ok' },
          ],
        },
      },
    ],
  },
  {
    id: 'loja.selecao',
    publico: 'cliente',
    titulo: 'Seleção da NZ para você',
    resumo: 'Uma lista de produtos que a equipe NZ montou para você, com validade.',
    passos: [
      {
        titulo: 'Escolhida pela equipe NZ',
        texto:
          'Um vendedor da NZ separou estes produtos para você. A lista vale até a data e a hora mostradas no topo; depois disso, o link deixa de abrir e é só pedir outro.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuarios', rotulo: 'Vendedor monta a lista' },
            { icone: 'link', rotulo: 'Você recebe o link' },
            { icone: 'relogio', rotulo: 'Vale até a data do topo', tom: 'atencao' },
          ],
        },
      },
      {
        titulo: 'Preço desta seleção',
        texto:
          'Quando a seleção mostra preço, ele vale **só para os itens desta lista** e só por este link, mesmo sem cadastro. Quando não mostra, os valores são combinados com a equipe.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Com preço', icone: 'percentual', tom: 'ok', itens: ['Valor exclusivo da seleção', 'Só nestes itens'] },
            { titulo: 'Sem preço', icone: 'whatsapp', tom: 'info', itens: ['Valor sob consulta', 'Fale com a equipe'] },
          ],
        },
      },
      {
        titulo: 'Como pedir',
        texto:
          'Abra o produto e chame a equipe pelo **botão de WhatsApp** da página: o pedido é fechado com a NZ, com o frete à parte. Quer ver o resto da loja? **Ver o catálogo completo**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'olho', rotulo: 'Abre o produto' },
            { icone: 'whatsapp', rotulo: 'Chama no WhatsApp' },
            { icone: 'check', rotulo: 'Equipe NZ fecha com você', tom: 'ok' },
          ],
        },
      },
    ],
  },
];
