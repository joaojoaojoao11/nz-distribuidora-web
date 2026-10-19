// Garantias no servidor: as linhas (anos de garantia e vida útil), a validação
// do registro e o formato do que é gravado em `garantias_nz`.
//
// Espelha src/lib/garantia.ts (o front valida para dar erro na hora; o
// servidor valida de novo porque o front é sugestão). Os ANOS saem daqui, não
// do corpo da requisição: quem mandasse "garantia_anos: 99" ganharia 99 anos.

import { randomBytes } from 'node:crypto';
import { somenteDigitos, validarCpf, validarCnpj } from '../conta/documento.js';
import { EMAIL_VALIDO } from '../email.js';

export interface LinhaServidor {
  nome: string;
  rotulo: string;
  anos: number;
  durabilidade: number;
  /** /assets/email/linha-<foto>.jpg */
  foto: string;
}

// Mesmos anos das páginas /ppf/* (conferidos em 16/10/2026).
export const LINHAS_PPF: LinhaServidor[] = [
  { nome: 'NZPPF LUXURY', rotulo: 'Luxury', anos: 12, durabilidade: 15, foto: 'luxury' },
  { nome: 'NZPPF PRIME', rotulo: 'Prime', anos: 10, durabilidade: 12, foto: 'prime' },
  { nome: 'NZPPF FLOW', rotulo: 'Flow', anos: 7, durabilidade: 9, foto: 'flow' },
  { nome: 'NZPPF CORE', rotulo: 'Core', anos: 4, durabilidade: 5, foto: 'core' },
  { nome: 'NZPPF HEADLIGHT', rotulo: 'Headlight', anos: 10, durabilidade: 12, foto: 'headlight' },
  { nome: 'NZPPF WINDSHIELD', rotulo: 'Windshield', anos: 2, durabilidade: 3, foto: 'windshield' },
];

// D2 do plano: envelopamento com 3 anos — o que a tela sempre mostrou.
export const ENVELOPAMENTO = { anos: 3, durabilidade: 3, foto: 'nzwrap' };

export const AREAS = [
  'Capô', 'Teto', 'Para-choque Dianteiro', 'Para-choque Traseiro',
  'Laterais', 'Portas', 'Para-lamas', 'Retrovisores', 'Faróis', 'Parabrisa', 'Interno',
];

const SERVICOS = ['Total/Full', 'Parcial', 'Movel/Eletro'] as const;
type Servico = (typeof SERVICOS)[number];

/** A linha de `garantias_nz` como o servidor lê. */
export interface Garantia {
  id: string;
  protocolo: string;
  status: 'pendente' | 'aprovada' | 'recusada';
  cliente_cpf: string;
  cliente_nome_completo: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cep: string | null;
  cliente_endereco: string | null;
  cliente_numero: string | null;
  cliente_complemento: string | null;
  cliente_bairro: string | null;
  cliente_cidade: string | null;
  cliente_estado: string | null;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  produto_nome: string;
  linha_escolhida: string | null;
  tipo_servico: string | null;
  areas_protegidas: string[] | null;
  codigo_autenticacao: string;
  /** Código do selo do batente (8 caracteres, sem hífen) que veio no registro. */
  selo_codigo?: string | null;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  created_at: string;
  aprovada_em: string | null;
  motivo_recusa: string | null;
  certificado_enviado_em: string | null;
  certificado_enviado_para: string | null;
  envios_certificado: number | null;
}

export function linhaPpf(produto: string): LinhaServidor | null {
  return LINHAS_PPF.find((l) => l.nome === produto.trim().toUpperCase()) ?? null;
}

export function nomeDeExibicao(produto: string): string {
  const l = linhaPpf(produto);
  return l ? `NZPPF ${l.rotulo}` : produto.trim();
}

export function fotoDaGarantia(g: Pick<Garantia, 'produto_nome' | 'linha_escolhida'>): string {
  return g.linha_escolhida === 'NZWrap' ? ENVELOPAMENTO.foto : linhaPpf(g.produto_nome)?.foto ?? 'prime';
}

/** "2026-10-15" → "15/10/2026", sem passar por fuso. */
export function dataBr(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export function validaAte(iso: string | null | undefined, anos: number | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m || !anos) return '';
  return `${m[3]}/${m[2]}/${Number(m[1]) + anos}`;
}

/** Data e hora de Brasília, para "registrado em". */
export function dataHoraBr(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function textoDaCobertura(servico: string | null, areas: string[] | null): string {
  if (servico === 'Total/Full') return 'Carro inteiro';
  if (servico === 'Movel/Eletro') return 'Móvel / eletrodoméstico';
  return (areas ?? []).filter((a) => a !== 'Veículo Completo' && a !== 'Item Completo').join(', ') || 'Parcial';
}

export function primeiroNome(nome: string | null): string {
  const p = (nome ?? '').trim().split(/\s+/)[0] ?? '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
}

/** j***@gmail.com — para mostrar no painel para onde foi o certificado. */
export function mascararEmail(e: string | null): string {
  const [u, d] = (e ?? '').split('@');
  if (!u || !d) return '';
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}`;
}

// ------------------------------------------------------------- validação

const PLACA = /^([A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2}|[A-HJ-NPR-Z0-9]{17})$/;
const limparPlaca = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');

function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function hojeEmBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export type ErroRegistro =
  | 'produto-invalido'
  | 'servico-invalido'
  | 'areas-invalidas'
  | 'placa-invalida'
  | 'modelo-invalido'
  | 'data-invalida'
  | 'aplicador-invalido'
  | 'documento-invalido'
  | 'nome-invalido'
  | 'email-invalido'
  | 'telefone-invalido'
  | 'endereco-incompleto';

/**
 * Código do selo de garantia como o banco guarda: caixa-alta, sem hífen nem
 * espaço. Aceita também o endereço inteiro do QR (…/S/7KQ2XM9P). Vazio = sem selo.
 * Mesma regra de public.selo_normalizar (migrations/2026-10-19_selos_garantia.sql).
 */
export function normalizarSelo(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.replace(/^.*\/s\//i, '').replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 40);
}

/** 8 caracteres do alfabeto dos selos (sem 0, O, 1 e I). */
export const SELO_VALIDO = /^[2-9A-HJ-NP-Z]{8}$/;

/**
 * Confere e normaliza o que veio do formulário. Devolve a linha pronta para
 * o insert (sem protocolo, status e datas — quem põe é o trigger do banco).
 */
export function validarRegistro(d: Record<string, unknown>): { ok: true; linha: Record<string, unknown> } | { ok: false; erro: ErroRegistro } {
  const linhaEscolhida = d.linha_escolhida === 'NZWrap' ? 'NZWrap' : d.linha_escolhida === 'PPF' ? 'PPF' : '';
  const produto = texto(d.produto_nome, 120);
  const ppf = linhaEscolhida === 'PPF' ? linhaPpf(produto) : null;
  if (!linhaEscolhida || (linhaEscolhida === 'PPF' && !ppf) || produto.length < 2) return { ok: false, erro: 'produto-invalido' };

  const servico = SERVICOS.includes(d.tipo_servico as Servico) ? (d.tipo_servico as Servico) : null;
  if (!servico || (servico === 'Movel/Eletro' && linhaEscolhida !== 'PPF')) return { ok: false, erro: 'servico-invalido' };

  let areas: string[];
  if (servico === 'Total/Full') areas = ['Veículo Completo'];
  else if (servico === 'Movel/Eletro') areas = ['Item Completo'];
  else {
    areas = Array.isArray(d.areas_protegidas) ? [...new Set(d.areas_protegidas.filter((a): a is string => typeof a === 'string' && AREAS.includes(a)))] : [];
    if (!areas.length) return { ok: false, erro: 'areas-invalidas' };
  }

  const movel = servico === 'Movel/Eletro';
  const placaBruta = texto(d.veiculo_placa_chassi, 60);
  const placaLimpa = limparPlaca(placaBruta);
  if (movel ? placaBruta.length < 3 : !PLACA.test(placaLimpa)) return { ok: false, erro: 'placa-invalida' };
  const placa = movel ? placaBruta : /^[A-Z]{3}\d{4}$/.test(placaLimpa) ? `${placaLimpa.slice(0, 3)}-${placaLimpa.slice(3)}` : placaLimpa;

  const modelo = texto(d.veiculo_modelo, 120);
  if (modelo.length < 2) return { ok: false, erro: 'modelo-invalido' };

  const data = texto(d.data_aplicacao, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > hojeEmBrasilia() || data < '2015-01-01' || Number.isNaN(Date.parse(data))) {
    return { ok: false, erro: 'data-invalida' };
  }

  const aplicador = texto(d.aplicador_nome, 120);
  if (aplicador.length < 2) return { ok: false, erro: 'aplicador-invalido' };

  const doc = somenteDigitos(d.cliente_cpf);
  if (!(doc.length === 11 ? validarCpf(doc) : doc.length === 14 ? validarCnpj(doc) : false)) return { ok: false, erro: 'documento-invalido' };
  const cpf =
    doc.length === 11
      ? doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

  const nome = texto(d.cliente_nome_completo, 120);
  if (nome.length < 3) return { ok: false, erro: 'nome-invalido' };

  // O certificado chega por e-mail depois da aprovação: sem e-mail não há
  // para onde mandar.
  const email = texto(d.cliente_email, 160).toLowerCase();
  if (!EMAIL_VALIDO.test(email)) return { ok: false, erro: 'email-invalido' };

  const telDigitos = somenteDigitos(d.cliente_telefone);
  if (telDigitos && telDigitos.length !== 10 && telDigitos.length !== 11) return { ok: false, erro: 'telefone-invalido' };
  const telefone = texto(d.cliente_telefone, 20);

  const impresso = Boolean(d.cliente_cep && d.cliente_endereco);
  const cep = impresso ? somenteDigitos(d.cliente_cep) : '';
  if (impresso && (cep.length !== 8 || !texto(d.cliente_numero, 20) || !texto(d.cliente_cidade, 80))) return { ok: false, erro: 'endereco-incompleto' };

  return {
    ok: true,
    linha: {
      cliente_cpf: cpf,
      cliente_nome_completo: nome,
      cliente_email: email,
      cliente_telefone: telefone,
      cliente_cep: impresso ? `${cep.slice(0, 5)}-${cep.slice(5)}` : null,
      cliente_endereco: impresso ? texto(d.cliente_endereco, 160) : null,
      cliente_numero: impresso ? texto(d.cliente_numero, 20) : null,
      cliente_complemento: impresso ? texto(d.cliente_complemento, 80) : null,
      cliente_bairro: impresso ? texto(d.cliente_bairro, 80) : null,
      cliente_cidade: texto(d.cliente_cidade, 80),
      cliente_estado: texto(d.cliente_estado, 2).toUpperCase(),
      veiculo_placa_chassi: placa,
      veiculo_modelo: modelo,
      aplicador_nome: aplicador,
      data_aplicacao: data,
      produto_nome: ppf ? ppf.nome : produto,
      linha_escolhida: linhaEscolhida,
      tipo_servico: servico,
      areas_protegidas: areas,
      garantia_anos: ppf ? ppf.anos : ENVELOPAMENTO.anos,
      durabilidade_anos: ppf ? ppf.durabilidade : ENVELOPAMENTO.durabilidade,
    },
  };
}

/** NZ-DDMMAAAA-PLACA-XXXXX, o formato de sempre, com sorteio criptográfico. */
export function gerarCodigo(dataIso: string, placa: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataIso);
  const data = m ? `${m[3]}${m[2]}${m[1]}` : '';
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const sufixo = Array.from(randomBytes(5), (b) => alfabeto[b % alfabeto.length]).join('');
  return `NZ-${data}-${limparPlaca(placa).slice(0, 20)}-${sufixo}`;
}
