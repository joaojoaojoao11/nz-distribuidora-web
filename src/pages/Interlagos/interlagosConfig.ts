// ─────────────────────────────────────────────────────────────
// Festival Interlagos 2026 — Edição Auto
// TODO João: trocar os valores marcados abaixo e fazer deploy.
// É o único arquivo que precisa mudar — a página inteira lê daqui.
// ─────────────────────────────────────────────────────────────

export const INTERLAGOS = {
  // ── PENDENTE: dados do brinde ──────────────────────────────
  /** Nome do brinde. Ex.: 'um kit exclusivo NZPPF'. */
  BRINDE: 'um brinde exclusivo NZ Group',
  /** Chamada de escassez. Ex.: 'Só 200 unidades'. */
  UNIDADES: 'Unidades limitadas',
  /** Prazo comunicado na tela de sucesso. Ex.: 'até 15 dias úteis'. */
  PRAZO_ENVIO: 'até 15 dias úteis após a conferência',
  /** Número/setor do estande. Deixe '' para esconder a menção. */
  ESTANDE: '',

  // ── Confirmados ────────────────────────────────────────────
  EVENTO: 'Festival Interlagos 2026',
  EDICAO: 'Edição Auto',
  DATAS: '27 a 30 de agosto',
  DIAS: ['27', '28', '29', '30'] as const,
  LOCAL: 'Autódromo José Carlos Pace — São Paulo/SP',
  INSTAGRAM_HANDLE: 'nzgroup.br',
  INSTAGRAM_URL: 'https://www.instagram.com/nzgroup.br',
  /** Mesmo destinatário já usado no resto do site (FormSubmit já ativado). */
  EMAIL_LEAD: 'joaovitor@nzdistribuidora.com.br',
  WHATSAPP_URL: 'https://wa.me/message/3DBGPIZF4EMWO1',
} as const;

export const PERFIS = [
  { value: 'envelopador', label: 'Envelopador', desc: 'Trabalho com envelopamento automotivo' },
  { value: 'aplicador_ppf', label: 'Aplicador de PPF', desc: 'Trabalho com proteção de pintura' },
  { value: 'ambos', label: 'Os dois', desc: 'Envelopamento e PPF' },
  { value: 'proprietario', label: 'Sou dono de um veículo', desc: 'Quero envelopar ou proteger meu carro' },
] as const;

export type PerfilValue = (typeof PERFIS)[number]['value'];

export const PERFIL_LABEL: Record<PerfilValue, string> = {
  envelopador: 'Envelopador',
  aplicador_ppf: 'Aplicador de PPF',
  ambos: 'Envelopador + Aplicador de PPF',
  proprietario: 'Proprietário de veículo',
};

export function isProfissional(perfil: PerfilValue | ''): boolean {
  return perfil === 'envelopador' || perfil === 'aplicador_ppf' || perfil === 'ambos';
}

export const SERVICOS_INTERESSE = ['Envelopamento', 'PPF', 'Os dois', 'Ainda não sei'] as const;

/**
 * As 4 linhas. Cada card leva para a página da linha no site.
 * Importação Direta não tem página própria — o destino é o WhatsApp comercial.
 * Imagens geradas por scripts/gen-interlagos-images.mjs (WebP, ~13-42 KB cada).
 */
export const LINHAS = [
  {
    nome: 'NZWRAP',
    titulo: 'Envelopamento automotivo',
    desc: 'Linha proprietária de PVC alto brilho, com curadoria exclusiva de cores e suporte direto.',
    resumo: 'Mais de 250 cores a pronta entrega e acesso a qualquer cor do mundo.',
    img: '/assets/images/interlagos/nzwrap.webp',
    href: '/wrap/nzwrap-premium',
    externo: false,
    cta: 'Ver a linha',
  },
  {
    nome: 'NZPPF',
    titulo: 'Proteção de pintura',
    desc: 'PPF em TPU com regeneração térmica, hidrofobia e até 12 anos de garantia.',
    resumo: 'Seis linhas, de 175μ a 190μ, com garantia de 3 a 12 anos.',
    img: '/assets/images/interlagos/nzppf.webp',
    href: '/ppf',
    externo: false,
    cta: 'Ver a linha',
  },
  {
    nome: 'ORACAL',
    titulo: 'Vinis decorativos e comunicação visual',
    desc: 'Linha alemã completa para recortes, sinalização e envelopamento com tecnologia anti-bolhas.',
    resumo: 'Vinil alemão para recortes, sinalização e detalhes — 77+ cores.',
    img: '/assets/images/interlagos/oracal.webp',
    href: '/wrap/oracal-651',
    externo: false,
    cta: 'Ver a linha',
  },
  {
    nome: 'IMPORTAÇÃO DIRETA',
    titulo: 'Linha exclusiva',
    desc: 'Materiais que não estão disponíveis no mercado nacional, trazidos direto pela NZ.',
    resumo: 'Materiais que ninguém mais tem no Brasil, trazidos sob demanda.',
    img: '/assets/images/interlagos/importacao.webp',
    href: INTERLAGOS.WHATSAPP_URL,
    externo: true,
    cta: 'Falar com especialista',
  },
] as const;

export const DIFERENCIAIS = [
  'Distribuidora e importadora autorizada — PPF, envelopamento e vinis decorativos',
  'Materiais premium com garantia de fábrica e procedência rastreável',
  'Rede nacional de aplicadores credenciados',
  'Suporte técnico real: gente que já aplicou, não call center',
] as const;
