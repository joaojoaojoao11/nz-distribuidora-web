// Registro das páginas promocionais / de campanha do site.
//
// Cada campanha tem uma página pública própria e uma tabela de leads no
// Supabase. O painel (/admin → Páginas Promocionais) lê daqui para montar
// a lista, os links e a tabela de cadastros — não há nada hardcoded lá.
//
// Para adicionar uma campanha nova: crie a página, a tabela com RLS
// (insert anon + leitura admin) e acrescente um objeto neste array.

export type ColunaTipo = 'texto' | 'data' | 'endereco' | 'instagram' | 'telefone' | 'bool';

export interface PromoColuna {
  key: string;
  label: string;
  tipo?: ColunaTipo;
  /** Fora da tabela na tela, mas presente na exportação CSV. */
  soCsv?: boolean;
}

export interface PromoPage {
  id: string;
  nome: string;
  descricao: string;
  /** Rota canônica no site. */
  path: string;
  /** Outros caminhos que redirecionam para a rota canônica (vercel.json). */
  aliases: string[];
  periodo: string;
  local: string;
  /** Tabela no Supabase com os cadastros. */
  tabela: string;
  /** Coluna de status do envio, se a campanha tiver brinde. */
  statusColuna?: string;
  statusValores?: readonly string[];
  statusLabels?: Record<string, string>;
  colunas: readonly PromoColuna[];
  /** URL impressa no QR Code, com UTMs. */
  qrUrl: string;
  ativa: boolean;
}

export const PROMO_PAGES: readonly PromoPage[] = [
  {
    id: 'festival-interlagos-2026',
    nome: 'Festival Interlagos 2026',
    descricao: 'Captação por QR Code no estande, com brinde enviado no endereço do lead.',
    path: '/interlagos',
    aliases: ['/festival', '/festinterlagos'],
    periodo: '27 a 30 de agosto de 2026',
    local: 'Autódromo José Carlos Pace — São Paulo/SP',
    tabela: 'leads_festival_interlagos',
    statusColuna: 'brinde_status',
    statusValores: ['pendente', 'validado', 'enviado', 'recusado'],
    statusLabels: {
      pendente: 'Pendente',
      validado: 'Validado',
      enviado: 'Enviado',
      recusado: 'Recusado',
    },
    colunas: [
      { key: 'nome', label: 'Nome' },
      { key: 'perfil', label: 'Perfil' },
      { key: 'telefone', label: 'WhatsApp', tipo: 'telefone' },
      { key: 'instagram', label: 'Instagram', tipo: 'instagram' },
      { key: 'segue_instagram', label: 'Segue', tipo: 'bool' },
      { key: 'endereco', label: 'Endereço de envio', tipo: 'endereco' },
      { key: 'email', label: 'E-mail', soCsv: true },
      { key: 'servico_interesse', label: 'Interesse', soCsv: true },
      { key: 'quer_indicacao_aplicador', label: 'Quer indicação', tipo: 'bool', soCsv: true },
      { key: 'utm_source', label: 'Origem', soCsv: true },
      { key: 'created_at', label: 'Data', tipo: 'data' },
    ],
    qrUrl: 'https://www.nzgroup.com.br/interlagos?utm_source=qrcode&utm_medium=evento&utm_campaign=festival_interlagos_2026',
    ativa: true,
  },
];

export const PERFIL_LABELS: Record<string, string> = {
  envelopador: 'Envelopador',
  aplicador_ppf: 'Aplicador de PPF',
  ambos: 'Envelopador + PPF',
  proprietario: 'Proprietário',
};

/** Linha genérica de lead — as colunas variam por campanha. */
export type PromoLead = Record<string, unknown> & { id: string; created_at: string };

/** Endereço em uma linha, pronto para etiqueta de envio. */
export function formatarEndereco(lead: PromoLead): string {
  const v = (k: string) => String(lead[k] ?? '').trim();
  const rua = [v('logradouro'), v('numero')].filter(Boolean).join(', ');
  const comp = v('complemento');
  const bairro = v('bairro');
  const cidadeUf = [v('cidade'), v('uf')].filter(Boolean).join('/');
  const cep = v('cep');
  const cepFmt = cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

  return [
    comp ? `${rua} — ${comp}` : rua,
    bairro,
    cidadeUf,
    cepFmt ? `CEP ${cepFmt}` : '',
  ].filter(Boolean).join(' · ');
}

/** Bloco multilinha para colar direto numa etiqueta dos Correios. */
export function etiquetaEnvio(lead: PromoLead): string {
  const v = (k: string) => String(lead[k] ?? '').trim();
  const cep = v('cep');
  const cepFmt = cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
  const comp = v('complemento');

  return [
    v('nome'),
    comp ? `${v('logradouro')}, ${v('numero')} — ${comp}` : `${v('logradouro')}, ${v('numero')}`,
    v('bairro'),
    `${v('cidade')}/${v('uf')} — CEP ${cepFmt}`,
    v('telefone'),
  ].filter(Boolean).join('\n');
}
