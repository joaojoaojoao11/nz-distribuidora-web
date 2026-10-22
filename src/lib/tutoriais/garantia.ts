// Tutoriais da garantia: registro (versão do dono e do aplicador) e
// conferência do certificado. Escritos a partir do código em 22/10/2026
// (WarrantyRegistration + registro/*, handler garantia, RPC validar_garantia).
// O selo do batente não entra mais no registro desde 22/10 (QR único, página /s). Cada frase descreve o que o sistema faz
// hoje; mudou a regra, mude aqui. Ver index.ts.

import type { Tutorial } from '../../components/Tutorial/tipos';

const PRODUTOS = {
  tipo: 'comparacao' as const,
  colunas: [
    {
      titulo: 'NZPPF · proteção de pintura',
      icone: 'selo' as const,
      tom: 'marca' as const,
      itens: ['Luxury: 12 anos', 'Prime: 10 anos', 'Flow: 7 anos', 'Core: 4 anos', 'Headlight (faróis): 10 anos', 'Windshield (para-brisa): 2 anos'],
    },
    { titulo: 'Envelopamento', icone: 'presente' as const, tom: 'info' as const, itens: ['Digite o vinil aplicado', 'O prazo aparece no cartão'] },
  ],
};

const ONDE = {
  tipo: 'comparacao' as const,
  colunas: [
    { titulo: 'Carro inteiro', icone: 'check' as const, tom: 'ok' as const, itens: ['O veículo todo'] },
    { titulo: 'Parte do carro', icone: 'percentual' as const, tom: 'marca' as const, itens: ['Marque as peças', 'Atalho “Kit frontal”'] },
    { titulo: 'Móvel ou eletro', icone: 'loja' as const, tom: 'info' as const, itens: ['Só com NZPPF', 'Identifique o item'] },
  ],
};

const DEPOIS = {
  tipo: 'linhaTempo' as const,
  marcos: [
    { rotulo: 'Registro recebido', sub: 'protocolo GAR-…' },
    { rotulo: 'Conferência da NZ', sub: 'em análise', tom: 'atencao' as const },
    { rotulo: 'Certificado no e-mail', sub: 'PDF com QR', tom: 'ok' as const },
  ],
};

export const TUTORIAIS_GARANTIA: Tutorial[] = [
  {
    id: 'garantia.registro',
    publico: 'cliente',
    titulo: 'Registrar garantia',
    resumo: 'Quatro passos para registrar a aplicação; aprovada pela NZ, o certificado chega por e-mail.',
    passos: [
      {
        titulo: 'O que foi aplicado',
        texto:
          'Escolha a linha **NZPPF** (cada cartão mostra os anos de garantia) ou **Envelopamento**, digitando o vinil aplicado. Os anos não se digitam: saem da linha escolhida.',
        cena: PRODUTOS,
      },
      {
        titulo: 'Onde foi aplicado',
        texto:
          '**Carro inteiro**, **parte do carro** (marque as peças; o botão **Kit frontal** marca capô, para-choque dianteiro, para-lamas, retrovisores e faróis) ou **móvel/eletrodoméstico**, só com NZPPF. Headlight e Windshield pulam este passo.',
        cena: ONDE,
      },
      {
        titulo: 'Veículo e data',
        texto: 'Placa (Mercosul ou antiga) ou chassi, modelo, **data da aplicação** e quem aplicou.',
        cena: {
          tipo: 'formulario',
          titulo: 'Veículo e aplicação',
          campos: [{ rotulo: 'Placa ou chassi', valor: 'ABC1D23' }, { rotulo: 'Modelo do veículo' }, { rotulo: 'Data da aplicação', valor: 'Hoje' }, { rotulo: 'Aplicado por' }],
        },
      },
      {
        titulo: 'Dados do dono',
        texto:
          'CPF ou CNPJ, nome e **e-mail do proprietário**: é por ele que o certificado chega. Telefone e CEP são opcionais. Quer uma **via impressa** pelos Correios? Marque a opção e preencha o endereço completo. Logado, **Usar meus dados** preenche tudo com o seu cadastro.',
        cena: {
          tipo: 'formulario',
          titulo: 'Proprietário',
          campos: [{ rotulo: 'CPF ou CNPJ' }, { rotulo: 'Nome completo' }, { rotulo: 'E-mail do proprietário', valor: 'certificado vai para cá' }, { rotulo: 'Telefone (opcional)' }],
        },
      },
      {
        titulo: 'Depois de enviar',
        texto:
          'Você recebe um **protocolo** e o registro fica **em análise**. A NZ confere e, aprovado, o **certificado em PDF** chega no e-mail do dono. Quem tem conta com o mesmo CPF ou e-mail acompanha em **Minhas garantias**.',
        cena: DEPOIS,
      },
    ],
  },

  {
    id: 'garantia.registro-aplicador',
    publico: 'lojista',
    titulo: 'Registrar garantia do seu cliente',
    resumo: 'Como o aplicador registra a garantia no nome do dono do carro.',
    passos: [
      {
        titulo: 'Produto e onde foi aplicado',
        texto:
          'Escolha a linha **NZPPF** ou **Envelopamento** e onde foi aplicado: carro inteiro, parte do carro (com o atalho **Kit frontal**) ou móvel. Os anos de garantia saem da linha, não se digitam.',
        cena: PRODUTOS,
      },
      {
        titulo: '“Fui eu” e o selo',
        texto:
          'No campo **Aplicado por**, o botão **Fui eu** preenche o nome da sua empresa. Cole o **selo NZPPF** no batente da porta: o QR dele mostra ao dono que o carro está protegido e apresenta as linhas NZPPF. O selo não tem código para digitar.',
        cena: {
          tipo: 'formulario',
          titulo: 'Veículo e aplicação',
          campos: [{ rotulo: 'Placa ou chassi', valor: 'ABC1D23' }, { rotulo: 'Aplicado por', valor: 'Fui eu: sua empresa' }, { rotulo: 'Data da aplicação', valor: 'Hoje' }],
        },
      },
      {
        titulo: 'Os dados são do DONO',
        texto:
          'No passo **Proprietário**, preencha o CPF/CNPJ, o nome e o **e-mail do dono do carro**, não os seus: o certificado vai para esse e-mail. **Usar meus dados** é só para quando a garantia é sua.',
        cena: {
          tipo: 'comparacao',
          colunas: [
            { titulo: 'Certo', icone: 'check', tom: 'ok', itens: ['CPF do dono do carro', 'E-mail do dono', 'Certificado chega para ele'] },
            { titulo: 'Evite', icone: 'usuario', tom: 'erro', itens: ['Seus dados no lugar do dono', 'Certificado iria para você'] },
          ],
        },
      },
      {
        titulo: 'Depois de enviar',
        texto:
          'Sai um **protocolo** e o registro fica em análise; aprovado, o dono recebe o certificado por e-mail. O registro **não fica na sua conta**: use **Salvar comprovante** ou copie o protocolo. Muitos registros seguidos da mesma internet podem ser barrados por uma hora.',
        cena: DEPOIS,
      },
    ],
  },

  {
    id: 'garantia.validar',
    publico: 'cliente',
    titulo: 'Conferir certificado',
    resumo: 'Qualquer pessoa confere se um certificado de garantia NZ é verdadeiro.',
    passos: [
      {
        titulo: 'Digite o código ou use o QR',
        texto:
          'O código fica no certificado (começa com **NZ-**, com os hífens). Também dá para apontar a câmera do celular para o **QR** do certificado: ele abre esta página já conferida.',
        cena: {
          tipo: 'formulario',
          titulo: 'Conferir certificado',
          campos: [{ rotulo: 'Código do certificado', valor: 'NZ-DDMMAAAA-PLACA-XXXXX' }],
        },
      },
      {
        titulo: 'O que aparece',
        texto:
          '**Certificado válido** mostra o produto, os anos e a data até quando vale, o veículo, quem aplicou e a data. O dono aparece só com o **CPF mascarado**. Garantia ainda em análise ou não aprovada aparece como **não encontrada**.',
        cena: {
          tipo: 'status',
          estados: [
            { texto: 'Certificado válido', tom: 'ok', sub: 'garantia aprovada' },
            { texto: 'Não encontrado', tom: 'neutro', sub: 'código errado, em análise ou não aprovada' },
          ],
        },
      },
      {
        titulo: 'Guardar e mandar',
        texto:
          '**Copiar link** manda a conferência para outra pessoa; **Salvar PDF ou imprimir** imprime esta página. O PDF oficial do certificado é o que chegou anexado no e-mail do dono.',
        cena: {
          tipo: 'fluxo',
          etapas: [
            { icone: 'selo', rotulo: 'Certificado válido', tom: 'ok' },
            { icone: 'link', rotulo: 'Copiar link' },
            { icone: 'nota', rotulo: 'PDF oficial: o do e-mail', tom: 'info' },
          ],
        },
      },
    ],
  },
];
