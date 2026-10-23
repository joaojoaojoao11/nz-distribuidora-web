// Tutoriais da área do cliente (/painel). O id de cada tela está em
// src/pages/Painel/painelNav.ts (campo `tutorial`), com a variante por tipo de
// acesso. Escritos a partir do código em 22/10/2026; mudou a regra, mude aqui.
// Ver index.ts.

import type { Tutorial } from '../../components/Tutorial/tipos';

export const TUTORIAIS_CONTA: Tutorial[] = [
  {
    id: 'conta.inicio',
    publico: 'cliente',
    titulo: 'Sua conta na NZ',
    resumo: 'O que tem em cada parte da sua conta e como saber se ela está pronta para comprar.',
    passos: [
      {
        titulo: 'Quatro partes',
        texto:
          '**Compras**: pedidos, pagamentos e carrinho guardado. **Catálogo**: favoritos e vistos. **Conta**: seus dados, senha e garantias. **Vantagens**: pontos, avaliações, Indique e ganhe e cupons. No celular, esta página é o próprio menu.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Compras', icone: 'carrinho', tom: 'marca', itens: ['Pedidos', 'Pagamentos', 'Carrinho guardado'] },
            { titulo: 'Conta', icone: 'usuario', tom: 'info', itens: ['Meus dados', 'Senha', 'Garantias'] },
            { titulo: 'Vantagens', icone: 'presente', tom: 'ok', itens: ['Indique e ganhe', 'Pontos e cupons'] },
          ],
        },
      },
      {
        titulo: 'Sua conta está pronta?',
        texto:
          'A faixa do topo diz se o cadastro está **aprovado** (preços liberados) ou **em análise**, e se falta algum dado para fechar pedido pelo site. Faltou? **Completar agora** leva direto aos campos.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Em análise', tom: 'atencao', sub: 'NZ conferindo' },
            { texto: 'Aprovado', tom: 'ok', sub: 'preços liberados' },
            { texto: 'Cadastro completo', tom: 'ok', sub: 'pronto para pedir' },
          ],
        },
      },
      {
        titulo: 'A central da sua conta',
        texto:
          'Três cartões juntam o que importa: o **último pedido** e a situação dele, o **próximo vencimento** com a NZ (com **Pagar** ou **Gerar Pix/boleto**) e o **saldo da carteira**. Se houver parcela vencida, um aviso aparece logo abaixo da faixa do topo. Embaixo ficam os atalhos e os últimos pedidos, do site e da NZ juntos.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Último pedido', icone: 'caminhao', tom: 'marca', itens: ['Situação', 'Transportadora'] },
            { titulo: 'Próximo vencimento', icone: 'calendario', tom: 'info', itens: ['Data e valor', 'Pagar pelo site'] },
            { titulo: 'Carteira', icone: 'carteira', tom: 'ok', itens: ['Disponível', 'A liberar'] },
          ],
        },
      },
      {
        titulo: 'Cada tela explica a sua parte',
        texto: 'Em cada tela da conta, o botão **Como funciona** ao lado do título explica aquela parte.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'usuario', rotulo: 'Minha conta' },
            { icone: 'nota', rotulo: 'Abre uma seção' },
            { icone: 'olho', rotulo: 'Como funciona', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.pedidos',
    publico: 'cliente',
    titulo: 'Meus pedidos',
    resumo: 'Os pedidos feitos no site, os pedidos com a NZ, comprar de novo e cancelar.',
    passos: [
      {
        titulo: 'Site e NZ',
        texto:
          'Em cima, os **pedidos feitos no site**: número, data, pagamento, situação, itens e total; **Ver pedido** abre o detalhe. Embaixo, os **pedidos com a NZ** (balcão, WhatsApp ou vendedor), com a nota fiscal, a transportadora quando sai para entrega e **Comprar de novo**. Eles aparecem quando sua conta está ligada ao cadastro da NZ; orçamento ainda em negociação não entra.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pedidos do site', icone: 'carrinho', tom: 'marca', itens: ['Pagamento e situação', 'Ver pedido', 'Comprar de novo'] },
            { titulo: 'Pedidos com a NZ', icone: 'nota', tom: 'info', itens: ['Balcão, WhatsApp, vendedor', 'Nota fiscal e transportadora', 'Comprar de novo'] },
          ],
        },
      },
      {
        titulo: 'A situação do pedido',
        texto:
          'Ela acompanha o pedido dentro da NZ: **orçamento** esperando o vendedor, **recebido**, **faturado** (nota emitida), **enviado** e **entregue**. O pagamento aparece num selo à parte: aguardando, pago, vencido ou recusado.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Recebido', sub: 'pela NZ' },
            { rotulo: 'Faturado', sub: 'nota emitida', tom: 'atencao' },
            { rotulo: 'Enviado', tom: 'info' },
            { rotulo: 'Entregue', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Comprar de novo',
        texto:
          '**Comprar de novo** põe os mesmos itens e quantidades no carrinho, somando ao que já estiver lá. Item que saiu de linha fica de fora, com aviso. Depois é só revisar e fechar.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'nota', rotulo: 'Pedido antigo' },
            { icone: 'carrinho', rotulo: 'Comprar de novo' },
            { icone: 'check', rotulo: 'Itens no carrinho', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Cancelar',
        texto:
          '**Cancelar** aparece enquanto o pedido não foi pago e a NZ ainda não o aprovou. Ele derruba a cobrança em aberto e devolve o saldo da carteira que você usou. Depois disso, fale com a NZ.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Aguardando pagamento', tom: 'atencao', sub: 'dá para cancelar' },
            { texto: 'Pago ou aprovado', tom: 'ok', sub: 'fale com a NZ' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.pedido',
    publico: 'cliente',
    titulo: 'Seu pedido',
    resumo: 'Pagar, acompanhar a confirmação e ver tudo do pedido.',
    passos: [
      {
        titulo: 'Pagar',
        texto:
          '**Pix**: leia o QR ou use **Copiar código Pix** antes do tempo acabar. **Boleto**: **Copiar linha digitável** ou **Abrir boleto (PDF)**. **Cartão**: a resposta vem na hora. Enquanto espera, a página confere o pagamento sozinha a cada poucos segundos.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pix', icone: 'pix', tom: 'ok', itens: ['QR ou copiar código', 'Contagem regressiva'] },
            { titulo: 'Boleto', icone: 'nota', tom: 'info', itens: ['Linha digitável', 'PDF do boleto'] },
            { titulo: 'Cartão', icone: 'cartao', tom: 'marca', itens: ['Resposta na hora'] },
          ],
        },
      },
      {
        titulo: 'Pagamento confirmado',
        texto:
          'Confirmado, aparece **Pagamento confirmado ✓** com o comprovante, e o pedido segue para a NZ. A partir daí, a situação muda conforme a NZ fatura e envia; acompanhe também em **Meus pedidos**.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Aguardando', sub: 'pagamento', tom: 'atencao' },
            { rotulo: 'Confirmado', tom: 'ok' },
            { rotulo: 'Na NZ', sub: 'faturar e enviar', tom: 'info' },
          ],
        },
      },
      {
        titulo: 'Se não deu certo',
        texto:
          'Pix que venceu, boleto vencido ou cartão recusado: use **Pagar de novo**, escolha Pix, boleto ou cartão e uma cobrança nova é gerada para o mesmo pedido.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pix expirado', tom: 'neutro', sub: 'pague de novo' },
            { texto: 'Cartão recusado', tom: 'erro', sub: 'tente outro meio' },
            { texto: 'Pago', tom: 'ok', sub: 'tudo certo' },
          ],
        },
      },
      {
        titulo: 'O resto do pedido',
        texto:
          'Embaixo ficam os **itens**, o **cupom**, o **frete**, o **saldo da carteira** usado e o **endereço de entrega**, além do número do pedido no NZERP depois que ele chega à NZ.',
        cena: {
          tipo: 'carteira',
          titulo: 'Resumo do pedido',
          linhas: [
            { rotulo: 'Itens', valor: 480, tom: 'neutro' },
            { rotulo: 'Cupom', valor: -24, tom: 'ok' },
            { rotulo: 'Frete', valor: 39, tom: 'neutro' },
            { rotulo: 'Saldo da carteira', valor: -30, tom: 'ok' },
          ],
          total: { rotulo: 'Cobrado', valor: 465 },
        },
      },
    ],
  },

  {
    id: 'conta.pagamentos',
    publico: 'cliente',
    titulo: 'Pagamentos',
    resumo: 'As parcelas com a NZ (vencidas, a vencer e pagas), como pagar pelo site e as cobranças dos pedidos do site.',
    passos: [
      {
        titulo: 'Com a NZ',
        texto:
          'Em cima, as parcelas das suas compras com a NZ em três blocos: **vencidos**, **a vencer** e **pagos** nos últimos 12 meses, cada uma com vencimento, valor, pedido e nota fiscal. Sentiu falta de alguma? Fale com a NZ.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Vencido', tom: 'atencao', sub: 'pagar ou combinar' },
            { texto: 'A vencer', tom: 'info', sub: 'pagar pelo site' },
            { texto: 'Pago', tom: 'ok', sub: 'ver cobrança' },
          ],
        },
      },
      {
        titulo: 'Pagar pelo site',
        texto:
          'Com a cobrança já emitida, **Pagar** abre a página segura do Asaas com Pix e boleto; dá também para **Copiar Pix** e baixar a **2ª via**. Sem cobrança e dentro do prazo, **Gerar Pix/boleto** cria a cobrança na hora. Vencida sem cobrança ou combinada com a NZ: **Fale com a NZ**. Depois de pago, a parcela passa para **Pagos** sozinha.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'nota', rotulo: 'Parcela em aberto' },
            { icone: 'pix', rotulo: 'Pagar ou gerar Pix/boleto' },
            { icone: 'check', rotulo: 'Vai para Pagos', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Cobranças do site',
        texto:
          'Embaixo, cada Pix, boleto e cartão dos seus pedidos do site: **Copiar Pix** (enquanto vale), **Copiar linha digitável**, **2ª via do boleto** e **Recibo** do que já foi pago.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Aguardando', tom: 'atencao', sub: 'copiar Pix ou boleto' },
            { texto: 'Pago', tom: 'ok', sub: 'recibo' },
            { texto: 'Vencido', tom: 'neutro', sub: 'pague de novo no pedido' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.carrinho',
    publico: 'cliente',
    titulo: 'Carrinho guardado',
    resumo: 'O carrinho fica na sua conta: monte num aparelho e termine em outro.',
    passos: [
      {
        titulo: 'Guardado na sua conta',
        texto:
          'O que você põe no carrinho logado fica guardado: dá para começar no celular e terminar no computador. Aqui você ajusta com **−** e **+**, **remove** um item ou **esvazia** tudo.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'carrinho', rotulo: 'Monta no celular' },
            { icone: 'cadeado', rotulo: 'Fica na sua conta' },
            { icone: 'check', rotulo: 'Fecha no computador', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Retomar a compra',
        texto:
          '**Retomar a compra** leva ao carrinho, onde você escolhe entre **pagar online** ou **enviar como orçamento** para um vendedor.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Pagar online', icone: 'cartao', tom: 'ok', itens: ['Pix, cartão ou boleto'] },
            { titulo: 'Orçamento', icone: 'whatsapp', tom: 'info', itens: ['Vendedor fecha com você'] },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.listas',
    publico: 'cliente',
    titulo: 'Favoritos e vistos',
    resumo: 'As cores que você separou e os últimos produtos que abriu.',
    passos: [
      {
        titulo: 'Favoritos',
        texto:
          'Na página do produto, **Salvar nos favoritos** separa a cor para depois, com o preço do seu tipo de conta. Os favoritos ficam **neste navegador**: em outro aparelho, a lista é outra.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'olho', rotulo: 'Abre o produto' },
            { icone: 'coracao', rotulo: 'Salvar nos favoritos' },
            { icone: 'check', rotulo: 'Aparece aqui', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Vistos recentemente',
        texto:
          'Os últimos **24** produtos que você abriu, do mais recente para o mais antigo. **Limpar histórico** apaga a lista. Também fica só neste navegador.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Abriu o produto', tom: 'info', sub: 'entra no topo' },
            { texto: '24 no máximo', tom: 'neutro', sub: 'o mais antigo sai' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.dados',
    publico: 'cliente',
    titulo: 'Meus dados',
    resumo: 'O cadastro que o pedido usa: o que é obrigatório e o que dá para mudar aqui.',
    passos: [
      {
        titulo: 'O que o pedido precisa',
        texto:
          'Para fechar pedido pelo site: **nome completo**, **CPF ou CNPJ**, **WhatsApp** com DDD e **endereço** com rua, número, cidade, UF e CEP. A caixa no topo lista o que ainda falta; bairro e complemento não são obrigatórios.',
        cena: {
          tipo: 'formulario',
          titulo: 'Meus dados',
          campos: [{ rotulo: 'Nome completo', valor: '✓' }, { rotulo: 'CPF ou CNPJ', valor: '✓' }, { rotulo: 'WhatsApp', valor: '(11) …' }, { rotulo: 'CEP', valor: 'preenche a rua' }],
        },
      },
      {
        titulo: 'Empresa e endereço',
        texto:
          'Lojista e revendedor precisam de **CNPJ** e **razão social**; a inscrição estadual pode ser **ISENTO**. Ao completar o **CEP**, a rua, o bairro, a cidade e a UF se preenchem sozinhos; confira e ponha o número.',
        cena: {
          tipo: 'formulario',
          titulo: 'Empresa',
          campos: [{ rotulo: 'CNPJ' }, { rotulo: 'Razão social' }, { rotulo: 'Inscrição estadual', valor: 'ou ISENTO' }],
        },
      },
      {
        titulo: 'Cobrança do cartão',
        texto:
          'Se o endereço da fatura do seu cartão é outro, marque **O endereço de cobrança do cartão é diferente** e informe o CEP e o número. **Salvar dados** grava tudo. E-mail, tipo de conta e liberação não mudam por aqui.',
        cena: {
          tipo: 'formulario',
          titulo: 'Cobrança do cartão',
          campos: [{ rotulo: 'CEP de cobrança' }, { rotulo: 'Número de cobrança' }],
        },
      },
    ],
  },

  {
    id: 'conta.seguranca',
    publico: 'cliente',
    titulo: 'Senha e segurança',
    resumo: 'E-mail de acesso, troca de senha e os aparelhos conectados.',
    passos: [
      {
        titulo: 'Trocar a senha',
        texto:
          '**Alterar senha** pede a senha atual e a nova duas vezes (mínimo de 8 caracteres). Depois de trocar, os **outros aparelhos saem** da conta. Quem entra só pelo Google vê **Definir senha**. Para trocar o e-mail da conta, fale com a NZ.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'cadeado', rotulo: 'Senha atual' },
            { icone: 'check', rotulo: 'Nova senha (8+)' },
            { icone: 'usuarios', rotulo: 'Outros aparelhos saem', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Aparelhos e atividade',
        texto:
          '**Sair de todos os aparelhos** desconecta a conta em todo lugar, inclusive aqui. Em **Atividade da conta** você vê o último acesso, quando a conta foi criada e de onde ela veio.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Sair de todos', icone: 'cadeado', tom: 'erro', itens: ['Desconecta tudo', 'Entre de novo depois'] },
            { titulo: 'Atividade', icone: 'relogio', tom: 'info', itens: ['Último acesso', 'Criação e origem'] },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.pontos',
    publico: 'cliente',
    titulo: 'Pontos e cashback',
    resumo: 'Pontos de avaliação e a troca por crédito na sua carteira.',
    passos: [
      {
        titulo: 'Como ganhar pontos',
        texto:
          'Avalie o que você comprou em **Minhas avaliações**. Cada avaliação publicada dá **40 pontos**, mais **20** se o texto tiver 240 caracteres ou mais. A nota não muda os pontos.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'carrinho', rotulo: 'Comprou' },
            { icone: 'estrela', rotulo: 'Avaliou' },
            { icone: 'check', rotulo: 'NZ publicou', tom: 'ok' },
            { icone: 'trofeu', rotulo: '+40 pontos', tom: 'marca' },
          ],
        },
      },
      {
        titulo: 'Trocar por crédito',
        texto:
          'Em **Trocar por crédito**, cada campanha diz quantos pontos valem quanto em R$. Com pontos suficientes, **Resgatar** desconta os pontos e põe o valor na sua **carteira**, disponível na hora.',
        cena: {
          tipo: 'carteira',
          titulo: 'Sua carteira',
          linhas: [{ rotulo: 'Resgate de pontos', valor: 50, tom: 'ok', status: 'disponível' }],
          total: { rotulo: 'Disponível', valor: 50 },
        },
      },
      {
        titulo: 'Usar o crédito',
        texto:
          'O crédito da carteira se usa no checkout (**Usar meu saldo**) ou se saca por Pix em **Indique e ganhe**, onde também ficam o extrato e a validade do saldo.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'No checkout', icone: 'carrinho', tom: 'ok', itens: ['Usar meu saldo', 'Abate do pedido'] },
            { titulo: 'Saque Pix', icone: 'pix', tom: 'info', itens: ['Em Indique e ganhe', 'A partir do mínimo'] },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.avaliacoes',
    publico: 'cliente',
    titulo: 'Minhas avaliações',
    resumo: 'Avaliar o que você comprou e acompanhar a publicação.',
    passos: [
      {
        titulo: 'O que dá para avaliar',
        texto:
          'Aparecem os produtos que você **comprou** (no site ou com a NZ) e ainda não avaliou. É uma avaliação por produto. Toque em **Avaliar**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'carrinho', rotulo: 'Comprou' },
            { icone: 'estrela', rotulo: 'Avaliar' },
            { icone: 'relogio', rotulo: 'Em análise', tom: 'atencao' },
          ],
        },
      },
      {
        titulo: 'Como avaliar',
        texto:
          'Dê a **nota** de 1 a 5 estrelas, um título se quiser e conte **como foi usar**, com pelo menos 20 caracteres. O contador mostra os pontos que a avaliação vale. **Enviar avaliação** manda para a NZ.',
        cena: {
          tipo: 'formulario',
          titulo: 'Avaliar',
          campos: [{ rotulo: 'Sua nota', valor: '★★★★★' }, { rotulo: 'Título (opcional)' }, { rotulo: 'Como foi usar', valor: '20+ caracteres' }],
        },
      },
      {
        titulo: 'Publicação e pontos',
        texto:
          'A NZ confere antes de publicar. **Publicada**: os pontos entram (vale para qualquer nota). **Não publicada**: o motivo aparece aqui. Quando a NZ responde, a **Resposta da NZ** aparece embaixo da sua avaliação.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Em análise', tom: 'atencao', sub: 'NZ conferindo' },
            { texto: 'Publicada', tom: 'ok', sub: 'pontos na conta' },
            { texto: 'Não publicada', tom: 'neutro', sub: 'com o motivo' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.cupons',
    publico: 'cliente',
    titulo: 'Meus cupons',
    resumo: 'Os seus códigos e um conferidor para saber se um cupom vale para você.',
    passos: [
      {
        titulo: 'Seus códigos',
        texto:
          'Aparecem os cupons que a NZ criou **para você** e os seus códigos de indicação. O **super cupom** e o cupom de **afiliado** são para **dar a outras pessoas**: você mesmo não usa. **Copiar** leva o código.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Para você usar', icone: 'cupom', tom: 'ok', itens: ['Cupom criado pela NZ', 'Use no carrinho ou checkout'] },
            { titulo: 'Para indicar', icone: 'usuarios', tom: 'marca', itens: ['Super cupom', 'Cupom de afiliado NZ-…'] },
          ],
        },
      },
      {
        titulo: 'Conferir um código',
        texto:
          'Digite qualquer código e toque em **Conferir**: a mesma regra do checkout diz se ele vale para você agora ou por quê não (venceu, esgotou, é de outra pessoa, só vale na primeira compra, já foi usado).',
        cena: {
          tipo: 'cupom',
          codigo: 'CODIGO',
          selos: [
            { texto: 'vale para você', tom: 'ok' },
            { texto: 'só primeira compra', tom: 'atencao' },
            { texto: 'de outra pessoa', tom: 'erro' },
          ],
          legenda: 'O conferidor usa a mesma regra do checkout',
        },
      },
      {
        titulo: 'Onde usar',
        texto:
          'Digite o cupom no carrinho e, na hora de pagar online, no **resumo do checkout**. O desconto vale nos produtos; o frete não entra.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'cupom', rotulo: 'Copia o código' },
            { icone: 'carrinho', rotulo: 'Resumo do checkout' },
            { icone: 'check', rotulo: 'Desconto nos produtos', tom: 'ok' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.indique',
    publico: 'cliente',
    titulo: 'Indique e ganhe',
    resumo: 'Seu super cupom: o amigo ganha desconto na primeira compra e você ganha cashback na carteira.',
    passos: [
      {
        titulo: 'Seu super cupom',
        texto:
          'Ele nasce quando a NZ aprova seu cadastro, com o seu primeiro nome e dois números. **Copiar código** ou **Compartilhar no WhatsApp** para mandar aos amigos. Quer outro? Troque o código (4 a 12 letras ou números, sem começar com NZ).',
        cena: {
          tipo: 'cupom',
          codigo: 'MARIA27',
          selos: [
            { texto: 'seu código pessoal', tom: 'info' },
            { texto: 'dá para trocar', tom: 'neutro' },
          ],
        },
      },
      {
        titulo: 'Como o amigo usa',
        texto:
          'O amigo cria a conta na NZ e, na **primeira compra**, digita o seu código no **carrinho ou no checkout**: ganha desconto nos produtos. Vale uma vez por pessoa, só para conta nova.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'whatsapp', rotulo: 'Você manda o código' },
            { icone: 'usuario', rotulo: 'Amigo cria a conta' },
            { icone: 'cupom', rotulo: 'Usa na 1ª compra' },
            { icone: 'presente', rotulo: 'Desconto para ele', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Quando você ganha',
        texto:
          'Quando a NZ **fatura** a compra do amigo, o seu **cashback** entra na carteira como **a liberar**. Ele fica **disponível** alguns dias depois que a compra é **entregue** (o número de dias aparece em Sua carteira). Se o amigo devolver parte da compra, o cashback daquela parte sai.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Amigo compra', sub: 'com seu código' },
            { rotulo: 'NZ fatura', sub: 'cashback nasce' },
            { rotulo: 'A liberar', sub: 'entrega + carência', tom: 'atencao' },
            { rotulo: 'Disponível', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Usar ou sacar',
        texto:
          'Saldo disponível se usa no checkout (**Usar meu saldo**) ou se saca: cadastre sua **chave Pix**, digite o valor e **Pedir saque** (a partir do mínimo mostrado). O pagamento sai em alguns dias úteis. O saldo tem validade, escrita em Sua carteira.',
        cena: {
          tipo: 'carteira',
          titulo: 'Sua carteira',
          linhas: [
            { rotulo: 'Cashback · indicado nº 1', valor: 28.5, tom: 'ok', status: 'disponível' },
            { rotulo: 'Cashback · indicado nº 2', valor: 41.2, tom: 'ok', status: 'disponível' },
            { rotulo: 'Cashback · indicado nº 3', valor: 19.9, tom: 'atencao', status: 'a liberar' },
          ],
          total: { rotulo: 'Disponível', valor: 69.7 },
        },
      },
      {
        titulo: 'Níveis e conquistas',
        texto:
          'Quanto mais amigos compram em 12 meses, mais você sobe de nível (**Largada → Campeão**) e maior fica o multiplicador do cashback. As **conquistas** marcam cada etapa, e algumas dão um bônus na carteira.',
        cena: {
          tipo: 'niveis',
          niveis: [{ nome: 'Largada' }, { nome: 'Volta Rápida' }, { nome: 'Pódio' }, { nome: 'Pole Position' }, { nome: 'Campeão' }],
        },
      },
    ],
  },

  {
    id: 'conta.indique-afiliado',
    publico: 'afiliado',
    titulo: 'Programa de afiliados',
    resumo: 'Seu cupom NZ-…, os clientes filiados a você e as suas comissões.',
    passos: [
      {
        titulo: 'Seu cupom de afiliado',
        texto:
          'Seu código **NZ-…** é a porta de entrada dos seus clientes. Enquanto a NZ não aprova a sua afiliação, ele **ainda não vale** em compra. Aprovado, use **Copiar cupom** e **Copiar link de cadastro** para divulgar.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Pedido enviado', tom: 'atencao', sub: 'NZ analisando' },
            { texto: 'Aprovado', tom: 'ok', sub: 'cupom vale' },
          ],
        },
      },
      {
        titulo: 'Clientes filiados a você',
        texto:
          'Quem **se cadastra** com o seu código ou pelo seu link, ou **compra** com o seu cupom, fica **filiado a você para sempre**. Cada cliente tem um afiliado só: vale o primeiro.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'link', rotulo: 'Seu link ou código' },
            { icone: 'usuario', rotulo: 'Cliente entra' },
            { icone: 'selo', rotulo: 'Filiado a você para sempre', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Suas comissões',
        texto:
          'Quando a NZ **fatura** uma compra feita no site por um filiado, nasce a comissão, sobre o valor sem frete: **ativação** na primeira compra de cada filiado e **recorrência** nas seguintes. Toda comissão libera alguns dias depois que a compra é **entregue**; a recorrência, também só no fim do período que você escolhe em **Fechamento da recorrência** (mês ou quinzena). Devolução parcial desconta a parte devolvida.',
        cena: {
          tipo: 'linhaTempo',
          marcos: [
            { rotulo: 'Compra faturada', sub: 'do filiado' },
            { rotulo: 'A liberar', sub: 'entrega + carência', tom: 'atencao' },
            { rotulo: 'Fim do período', sub: 'só recorrência', tom: 'atencao' },
            { rotulo: 'Disponível', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Acompanhar',
        texto:
          'Os contadores mostram quantos filiados **se cadastraram**, foram **aprovados** e **compraram**. No extrato, cada comissão aparece como **indicado nº N**: por privacidade, sem nomes. Seu nível sobe pelas vendas geradas em 12 meses e multiplica a comissão.',
        cena: {
          tipo: 'carteira',
          titulo: 'Extrato',
          linhas: [
            { rotulo: 'Ativação · indicado nº 1', valor: 200, tom: 'ok', status: 'disponível' },
            { rotulo: 'Recorrência · indicado nº 1', valor: 30, tom: 'atencao', status: 'a liberar' },
          ],
          total: { rotulo: 'Disponível', valor: 200 },
        },
      },
      {
        titulo: 'Receber',
        texto:
          'A comissão disponível fica na sua carteira: use no checkout (**Usar meu saldo**) ou cadastre sua chave Pix e **Pedir saque**. Seu super cupom continua valendo para indicar amigos.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'No checkout', icone: 'carrinho', tom: 'ok', itens: ['Usar meu saldo'] },
            { titulo: 'Saque Pix', icone: 'pix', tom: 'info', itens: ['Chave Pix cadastrada', 'Pago em dias úteis'] },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.selecoes',
    publico: 'admin',
    titulo: 'Minhas seleções',
    resumo: 'Listas de produtos montadas na loja para mandar a um cliente, com ou sem preço.',
    passos: [
      {
        titulo: 'Montar na loja',
        texto:
          'Na **/loja**, filtre o que quer mostrar e clique **MONTAR SELEÇÃO**: a seleção é o que está na tela, e o **×** tira um item. Depois, **CONFIGURAR E GERAR LINK**.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'busca', rotulo: 'Filtra na loja' },
            { icone: 'caixa', rotulo: 'Montar seleção' },
            { icone: 'check', rotulo: 'Tira com o ×' },
            { icone: 'link', rotulo: 'Gerar link', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Com ou sem preço',
        texto:
          'Com **Mostrar preço**, quem abre o link vê o atacado **mais o acréscimo** que você escolher, só nos itens da lista, e nunca vê o percentual. Sem preço, vê só os produtos. O link é copiado na hora; **ENVIAR NO WHATSAPP** abre a conversa para você escolher o contato.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Com preço', icone: 'percentual', tom: 'ok', itens: ['Atacado + acréscimo', 'Só nos itens da lista', 'Sem cadastro'] },
            { titulo: 'Sem preço', icone: 'olho', tom: 'info', itens: ['Só os produtos', 'Para mostrar opções'] },
          ],
        },
      },
      {
        titulo: 'O cliente pede pelo WhatsApp',
        texto:
          'A seleção não vira pedido no site: o cliente chama a equipe pelo WhatsApp (com preço, o botão do produto é **PEDIR PELO WHATSAPP**), e o frete é combinado à parte. O link vale por um tempo limitado (o prazo aparece na seleção).',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'link', rotulo: 'Cliente abre o link' },
            { icone: 'olho', rotulo: 'Vê a lista' },
            { icone: 'whatsapp', rotulo: 'Pede pelo WhatsApp', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'Acompanhar',
        texto:
          'Abas **Ativas** e **Expiradas**, com quantas vezes cada link foi aberto (visitas da equipe não contam). **Renovar** faz a validade recomeçar a partir de agora, com o mesmo link. **Encerrar** faz o link parar de abrir na hora. A lista mostra as seleções de toda a equipe.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Ativa', tom: 'ok', sub: 'link abre' },
            { texto: 'Expirada', tom: 'atencao', sub: 'Renovar reativa' },
            { texto: 'Encerrada', tom: 'neutro', sub: 'parou na hora' },
          ],
        },
      },
    ],
  },

  {
    id: 'conta.garantias',
    publico: 'cliente',
    titulo: 'Minhas garantias',
    resumo: 'As garantias registradas no seu nome, com o andamento e o certificado.',
    passos: [
      {
        titulo: 'Como elas chegam aqui',
        texto:
          'Aparecem as garantias em que **você é o dono**: achamos pelo **CPF/CNPJ** e pelo **e-mail** do seu cadastro. Quem registra pode ser você ou o aplicador; o que importa é o dono informado no registro.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'nota', rotulo: 'Registro com seu CPF ou e-mail' },
            { icone: 'relogio', rotulo: 'NZ confere', tom: 'atencao' },
            { icone: 'selo', rotulo: 'Aparece aqui', tom: 'ok' },
          ],
        },
      },
      {
        titulo: 'O andamento',
        texto:
          '**Em análise**: a NZ está conferindo o registro. **Certificado emitido**: aprovada; o botão **Ver certificado** abre o certificado com o QR. **Não aprovada**: fale com a NZ pelo WhatsApp informando o protocolo.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Em análise', tom: 'atencao', sub: 'NZ conferindo' },
            { texto: 'Certificado emitido', tom: 'ok', sub: 'Ver certificado' },
            { texto: 'Não aprovada', tom: 'erro', sub: 'fale com a NZ' },
          ],
        },
      },
      {
        titulo: 'Não achou uma garantia?',
        texto:
          'Confira em **Meus dados** se o CPF/CNPJ e o e-mail são os mesmos usados no registro. Se a aplicação ainda não foi registrada, use **Registrar uma garantia**: leva poucos minutos.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Confira', icone: 'usuario', tom: 'info', itens: ['CPF/CNPJ do cadastro', 'E-mail do cadastro'] },
            { titulo: 'Ou registre', icone: 'selo', tom: 'marca', itens: ['Registrar uma garantia', 'Protocolo na hora'] },
          ],
        },
      },
    ],
  },
];
