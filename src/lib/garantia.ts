// Registro de garantia — fonte única das linhas, das regras e do que vai para
// `garantias_nz`.
//
// Antes a lista de linhas morava dentro do formulário, com um `fetch` em
// `web_catalog_products` que nunca trouxe nada (a tabela não tem nenhuma linha
// NZPPF): valia sempre a cópia fixa. Agora a cópia fixa é a fonte, assumida, e
// o formulário, o certificado, o validador e o painel leem daqui.
//
// O formato gravado NÃO muda: o Admin → Garantias (PDF), o `validar_garantia`
// e o `minhas_garantias` dependem dele. `tipo_servico` só aceita os três
// valores do CHECK do banco.

import { formatarCpfCnpj, somenteDigitos, validarCpfCnpj } from './documento';
import { formatarTelefone, telefoneOk } from './shop/conta';
import { formatarCep } from './shop/checkout';

export type TipoLinha = 'PPF' | 'NZWrap';
export type TipoServico = 'Total/Full' | 'Parcial' | 'Movel/Eletro';

export interface LinhaGarantia {
  id: string;
  /** Exatamente o texto gravado em `produto_nome` (o mesmo de sempre). */
  nome: string;
  rotulo: string;
  detalhe: string;
  tipo: TipoLinha;
  garantiaAnos: number;
  durabilidadeAnos: number;
  foto: string;
  /** Linha que só existe para uma peça: a cobertura já vem escolhida. */
  areasFixas?: string[];
}

// Anos conferidos com as páginas das linhas (/ppf/*) em 16/10/2026.
export const LINHAS_PPF: LinhaGarantia[] = [
  { id: 'luxury', nome: 'NZPPF LUXURY', rotulo: 'Luxury', detalhe: 'TPU alifático 190 μ', tipo: 'PPF', garantiaAnos: 12, durabilidadeAnos: 15, foto: '/assets/garantia/linha-luxury.webp' },
  { id: 'prime', nome: 'NZPPF PRIME', rotulo: 'Prime', detalhe: 'TPU 190 μ · nano-dúplex', tipo: 'PPF', garantiaAnos: 10, durabilidadeAnos: 12, foto: '/assets/garantia/linha-prime.webp' },
  { id: 'flow', nome: 'NZPPF FLOW', rotulo: 'Flow', detalhe: 'TPU G2 185 μ · hidrofóbico', tipo: 'PPF', garantiaAnos: 7, durabilidadeAnos: 9, foto: '/assets/garantia/linha-flow.webp' },
  { id: 'core', nome: 'NZPPF CORE', rotulo: 'Core', detalhe: 'Híbrido 175 μ', tipo: 'PPF', garantiaAnos: 4, durabilidadeAnos: 5, foto: '/assets/garantia/linha-core.webp' },
  { id: 'headlight', nome: 'NZPPF HEADLIGHT', rotulo: 'Headlight', detalhe: 'Faróis · 3 tonalidades', tipo: 'PPF', garantiaAnos: 10, durabilidadeAnos: 12, foto: '/assets/garantia/linha-headlight.webp', areasFixas: ['Faróis'] },
  { id: 'windshield', nome: 'NZPPF WINDSHIELD', rotulo: 'Windshield', detalhe: 'Para-brisa · 190 μ', tipo: 'PPF', garantiaAnos: 2, durabilidadeAnos: 3, foto: '/assets/garantia/linha-windshield.webp', areasFixas: ['Parabrisa'] },
];

// Envelopamento: o `produto_nome` é o vinil que o aplicador digita.
// D2 do plano (PLANO_REGISTRO_GARANTIA.md) ainda em aberto: 3 anos é o que a
// tela e o validador já mostravam ao cliente. Antes o banco gravava 0 — agora
// grava o mesmo número que aparece.
export const ENVELOPAMENTO: LinhaGarantia = {
  id: 'envelopamento',
  nome: '',
  rotulo: 'Envelopamento',
  detalhe: 'NZWRAP e demais vinis de envelopamento',
  tipo: 'NZWrap',
  garantiaAnos: 3,
  durabilidadeAnos: 3,
  foto: '/assets/garantia/linha-nzwrap.webp',
};

export const LOGO_DA_LINHA: Record<TipoLinha, string> = {
  PPF: '/assets/logos/logo-nzppf-tamanho-certo.svg',
  NZWrap: '/assets/logos/logo-nzwrap-tamanho-certo.svg',
};

export function linhaPorId(id: string): LinhaGarantia | null {
  if (id === ENVELOPAMENTO.id) return ENVELOPAMENTO;
  return LINHAS_PPF.find((l) => l.id === id) ?? null;
}

/** "NZPPF LUXURY" → "NZPPF Luxury"; o resto (vinil digitado) fica como veio. */
export function nomeDeExibicao(produto: string): string {
  const l = LINHAS_PPF.find((x) => x.nome === produto.trim().toUpperCase());
  return l ? `NZPPF ${l.rotulo}` : produto.trim();
}

export const AREAS = [
  'Capô', 'Teto', 'Para-choque Dianteiro', 'Para-choque Traseiro',
  'Laterais', 'Portas', 'Para-lamas', 'Retrovisores', 'Faróis', 'Parabrisa', 'Interno',
] as const;

/** O "Parcial frontal / kit" de antes, num toque. */
export const KIT_FRONTAL = ['Capô', 'Para-choque Dianteiro', 'Para-lamas', 'Retrovisores', 'Faróis'];

export function textoDaCobertura(servico: string, areas: string[]): string {
  if (servico === 'Total/Full') return 'Carro inteiro';
  if (servico === 'Movel/Eletro') return 'Móvel / eletrodoméstico';
  if (servico === 'Parcial') return areas.length ? areas.join(', ') : 'Parcial';
  return '';
}

// -------------------------------------------------------------- rascunho

export interface Rascunho {
  linhaId: string;
  /** Envelopamento: o vinil aplicado. */
  material: string;
  servico: TipoServico | '';
  areas: string[];
  placa: string;
  modelo: string;
  data: string;
  aplicador: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  cidade: string;
  uf: string;
  impresso: boolean;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
}

export const RASCUNHO_VAZIO: Rascunho = {
  linhaId: '',
  material: '',
  servico: '',
  areas: [],
  placa: '',
  modelo: '',
  data: '',
  aplicador: '',
  cpf: '',
  nome: '',
  email: '',
  telefone: '',
  cep: '',
  cidade: '',
  uf: '',
  impresso: false,
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
};

const CHAVE_RASCUNHO = 'nz-garantia-rascunho-v1';
const CHAVE_APLICADOR = 'nz-garantia-aplicador';

// Armazenamento é conveniência: aba anônima, cookies bloqueados ou cota cheia
// não podem quebrar o formulário.
export function lerRascunho(): Rascunho | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return null;
    const r = JSON.parse(bruto) as Partial<Rascunho>;
    return { ...RASCUNHO_VAZIO, ...r, areas: Array.isArray(r.areas) ? r.areas.filter((a) => typeof a === 'string') : [] };
  } catch {
    return null;
  }
}

export function salvarRascunho(r: Rascunho) {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(r));
  } catch {
    /* sem armazenamento: segue sem rascunho */
  }
}

export function apagarRascunho() {
  try {
    sessionStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    /* idem */
  }
}

/** O aplicador que registra vários carros não digita o nome toda vez. */
export function lerUltimoAplicador(): string {
  try {
    return localStorage.getItem(CHAVE_APLICADOR) ?? '';
  } catch {
    return '';
  }
}

export function guardarUltimoAplicador(nome: string) {
  try {
    if (nome.trim()) localStorage.setItem(CHAVE_APLICADOR, nome.trim());
  } catch {
    /* idem */
  }
}

// ----------------------------------------------------------------- datas

/** Hoje no fuso de quem está usando — `toISOString()` daria o dia de Greenwich. */
export function hojeISO(deslocamentoDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + deslocamentoDias);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * "2026-10-15" → "15/10/2026" sem passar por `new Date()`: a data pura vira
 * meia-noite UTC e, no Brasil, aparecia como o dia anterior.
 */
export function formatarDataISO(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Data da aplicação + anos de garantia, no mesmo formato. */
export function validaAte(iso: string | null | undefined, anos: number | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m || !anos) return '';
  return `${m[3]}/${m[2]}/${Number(m[1]) + anos}`;
}

function dataValida(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
}

// ----------------------------------------------------------------- placa

const PLACA_ANTIGA = /^[A-Z]{3}\d{4}$/;
const PLACA_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
// Chassi (VIN): 17 caracteres, sem I, O e Q.
const CHASSI = /^[A-HJ-NPR-Z0-9]{17}$/;

export function limparPlaca(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function placaOk(v: string): boolean {
  const p = limparPlaca(v);
  return PLACA_ANTIGA.test(p) || PLACA_MERCOSUL.test(p) || CHASSI.test(p);
}

/** Enquanto digita: só maiúsculas, letras, números e hífen. */
export function digitandoPlaca(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 18);
}

/** Ao sair do campo: "abc1234" → "ABC-1234"; Mercosul e chassi sem hífen. */
export function formatarPlaca(v: string): string {
  const p = limparPlaca(v);
  if (PLACA_ANTIGA.test(p)) return `${p.slice(0, 3)}-${p.slice(3)}`;
  if (PLACA_MERCOSUL.test(p) || CHASSI.test(p)) return p;
  return digitandoPlaca(v);
}

// -------------------------------------------------------------- validação

export const PASSOS = ['produto', 'cobertura', 'veiculo', 'proprietario', 'revisao'] as const;
export type Passo = (typeof PASSOS)[number];

export type Erros = Partial<Record<keyof Rascunho, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ehMovel(r: Rascunho): boolean {
  return r.servico === 'Movel/Eletro';
}

export function errosDoPasso(passo: Passo, r: Rascunho): Erros {
  const e: Erros = {};
  const linha = linhaPorId(r.linhaId);
  if (passo === 'produto') {
    if (!linha) e.linhaId = 'Escolha o que foi aplicado.';
    else if (linha.tipo === 'NZWrap' && r.material.trim().length < 2) e.material = 'Informe o vinil aplicado.';
  }
  if (passo === 'cobertura') {
    if (!r.servico) e.servico = 'Escolha onde foi aplicado.';
    else if (r.servico === 'Movel/Eletro' && linha?.tipo !== 'PPF') e.servico = 'Móvel e eletrodoméstico só com NZPPF.';
    else if (r.servico === 'Parcial' && r.areas.length === 0) e.areas = 'Marque ao menos uma peça.';
  }
  if (passo === 'veiculo') {
    const movel = ehMovel(r);
    if (movel ? r.placa.trim().length < 3 : !placaOk(r.placa)) {
      e.placa = movel ? 'Informe o número de série ou a etiqueta.' : 'Placa (ABC1D23 ou ABC-1234) ou chassi de 17 caracteres.';
    }
    if (r.modelo.trim().length < 2) e.modelo = movel ? 'Descreva o item.' : 'Informe o modelo.';
    if (!dataValida(r.data)) e.data = 'Informe a data da aplicação.';
    else if (r.data > hojeISO()) e.data = 'A data não pode ser no futuro.';
    else if (r.data < '2015-01-01') e.data = 'Confira o ano.';
    if (r.aplicador.trim().length < 2) e.aplicador = 'Informe quem aplicou.';
  }
  if (passo === 'proprietario') {
    if (!validarCpfCnpj(r.cpf)) e.cpf = 'CPF ou CNPJ inválido.';
    if (r.nome.trim().length < 3) e.nome = 'Informe o nome completo.';
    if (r.email.trim() && !EMAIL.test(r.email.trim())) e.email = 'E-mail inválido.';
    if (r.telefone.trim() && !telefoneOk(r.telefone)) e.telefone = 'Telefone com DDD.';
    if (r.uf && r.uf.length !== 2) e.uf = 'UF com 2 letras.';
    if (r.impresso) {
      if (somenteDigitos(r.cep).length !== 8) e.cep = 'CEP com 8 dígitos.';
      if (!r.rua.trim()) e.rua = 'Informe a rua.';
      if (!r.numero.trim()) e.numero = 'Informe o número.';
      if (!r.cidade.trim()) e.cidade = 'Informe a cidade.';
      if (r.uf.length !== 2) e.uf = 'Escolha a UF.';
    }
  }
  return e;
}

/** O primeiro passo com pendência — até onde a URL pode levar. */
export function primeiroPassoPendente(r: Rascunho): Passo {
  for (const p of PASSOS) {
    if (p === 'revisao') return p;
    if (Object.keys(errosDoPasso(p, r)).length) return p;
  }
  return 'revisao';
}

// ------------------------------------------------------------------ envio

/** NZ-DDMMAAAA-PLACA-XXXXX, o formato de sempre. */
export function gerarCodigo(dataISO: string, placa: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataISO);
  const data = m ? `${m[3]}${m[2]}${m[1]}` : '';
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const sufixo = Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
  return `NZ-${data}-${limparPlaca(placa)}-${sufixo}`;
}

export function garantiaDoRascunho(r: Rascunho): { anos: number; durabilidade: number } {
  const l = linhaPorId(r.linhaId);
  return { anos: l?.garantiaAnos ?? 0, durabilidade: l?.durabilidadeAnos ?? 0 };
}

export function produtoDoRascunho(r: Rascunho): string {
  const l = linhaPorId(r.linhaId);
  if (!l) return '';
  return l.tipo === 'NZWrap' ? r.material.trim() : l.nome;
}

/** A linha de `garantias_nz` — mesmas colunas e formatos de antes. */
export function montarPayload(r: Rascunho, codigo: string) {
  const l = linhaPorId(r.linhaId);
  const { anos, durabilidade } = garantiaDoRascunho(r);
  const comEndereco = r.impresso;
  return {
    cliente_cpf: formatarCpfCnpj(r.cpf),
    cliente_nome_completo: r.nome.trim(),
    cliente_email: r.email.trim().toLowerCase(),
    cliente_telefone: r.telefone.trim() ? formatarTelefone(r.telefone) : '',
    cliente_cep: comEndereco ? formatarCep(r.cep) : null,
    cliente_endereco: comEndereco ? r.rua.trim() : null,
    cliente_numero: comEndereco ? r.numero.trim() : null,
    cliente_complemento: comEndereco ? r.complemento.trim() : null,
    cliente_bairro: comEndereco ? r.bairro.trim() : null,
    cliente_cidade: r.cidade.trim(),
    cliente_estado: r.uf.trim().toUpperCase(),
    veiculo_placa_chassi: ehMovel(r) ? r.placa.trim() : formatarPlaca(r.placa),
    veiculo_modelo: r.modelo.trim(),
    aplicador_nome: r.aplicador.trim(),
    data_aplicacao: r.data,
    produto_nome: produtoDoRascunho(r) || (l?.tipo ?? ''),
    linha_escolhida: l?.tipo ?? '',
    tipo_servico: r.servico,
    areas_protegidas: r.servico === 'Total/Full' ? ['Veículo Completo'] : r.servico === 'Movel/Eletro' ? ['Item Completo'] : r.areas,
    codigo_autenticacao: codigo,
    garantia_anos: anos,
    durabilidade_anos: durabilidade,
  };
}

export function urlDeValidacao(codigo: string): string {
  return `${window.location.origin}/validar-garantia?id=${encodeURIComponent(codigo)}`;
}
