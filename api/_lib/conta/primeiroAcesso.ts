// "Esqueci minha senha / primeiro acesso" pelo CPF/CNPJ (plano de login por documento, Fase 2 — D4/D6).
//
// Quem pede só vê UMA resposta ("se tiver conta, o link está a caminho do e-mail
// cadastrado"). Por dentro, o documento cai em um destes caminhos:
//
//   · tem conta no site (cliente) → link de criar/trocar senha no e-mail da conta.
//     Serve igual para quem esqueceu e para a conta que o job do ERP criou sem senha;
//   · admin → nada (D2: conta com poder só entra e recupera por e-mail);
//   · não tem conta, mas é cliente ELEGÍVEL do NZERP (clientes_site: qualificado no
//     CRM ou com pedido entregue) com e-mail → a conta nasce na hora, bloqueada,
//     pelo mesmo job da Fase A, e o link sai;
//   · elegível sem e-mail no ERP, ou com algo que impede a conta (e-mail de outra
//     conta etc.) → vai para a fila "ERP sem conta" e a NZ recebe um aviso;
//   · cliente do ERP que NÃO é elegível → aviso para a NZ (o consultor decide);
//   · documento que ninguém conhece → nada.
//
// Avisos à NZ saem no máximo uma vez por cliente por dia.

import type { Db } from '../papel.js';
import { documentoComMascara, normalizarDocumento } from './documento.js';
import { clienteErp } from '../pedido/despachoErp.js';
import { criarContasDoErp } from './contasDoErp.js';
import { avisarNz, linkWhats } from '../avisos.js';

export type DesfechoRecuperacao =
  | 'link-enviado'
  | 'conta-criada'
  | 'admin'
  | 'sem-email-no-erp'
  | 'pendente'
  | 'nao-elegivel'
  | 'desconhecido'
  | 'sem-erp';

const SITE = 'https://www.nzgroup.com.br';

// Mora em documento.ts desde a varredura de 22/10 (o "só conta nova" do cupom também usa).
export { documentoComMascara } from './documento.js';

interface ClienteSiteErp {
  id: string;
  nome: string | null;
  fantasia: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  site_user_id: string | null;
}

async function mandarLink(site: Db, email: string, redirectTo: string): Promise<void> {
  await site.auth.resetPasswordForEmail(email, { redirectTo }).then(
    () => undefined,
    () => undefined
  );
}

function avisarPrimeiroAcesso(site: Db, p: { erpId: string; nome: string; doc: string; telefone: string | null; cidade: string; situacao: string; oQueFazer: string }) {
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return avisarNz(site, {
    tipo: 'primeiro-acesso',
    chave: `primeiro-acesso:${p.erpId}:${hoje}`,
    assunto: `Cliente do NZERP tentou entrar no site — ${p.nome}`,
    etiqueta: 'Primeiro acesso',
    corEtiqueta: '#fbbf24',
    titulo: p.nome,
    subtitulo: 'Pediu o primeiro acesso ao site pelo CPF/CNPJ, mas a conta não pôde ser liberada sozinha.',
    linhas: [
      ['Documento', p.doc],
      ['Situação', p.situacao],
      ['Cidade', p.cidade],
      ['Telefone no ERP', p.telefone ?? '—'],
    ],
    botoes: [
      { texto: 'Abrir Clientes no site', href: `${SITE}/admin/clientes` },
      ...(linkWhats(p.telefone) ? [{ texto: 'Chamar no WhatsApp', href: linkWhats(p.telefone, 'Olá! Aqui é da NZ. Vi que você tentou acessar o site da NZ — vou te ajudar com o acesso.')! }] : []),
    ],
    nota: p.oQueFazer,
  }).catch(() => false);
}

export async function recuperarPorDocumento(site: Db, docBruto: string, redirectTo: string): Promise<DesfechoRecuperacao> {
  const doc = normalizarDocumento(docBruto);

  // 1) Já tem conta no site.
  const { data: perfil } = await site.from('user_profiles').select('id, email, role').eq('cpf_cnpj', doc).maybeSingle();
  const conta = perfil as { id: string; email: string | null; role: string } | null;
  if (conta) {
    if (conta.role === 'admin' || conta.role === 'superadmin') return 'admin';
    if (conta.email) await mandarLink(site, conta.email, redirectTo);
    return 'link-enviado';
  }

  // 2) Não tem: é cliente do NZERP?
  const erp = await clienteErp();
  if (!erp) return 'sem-erp';
  const filtroDoc = `cpf_cnpj.eq.${doc},cpf_cnpj.eq.${documentoComMascara(doc)}`;
  const { data: candData } = await erp
    .from('clientes_site')
    .select('id, nome, fantasia, email, telefone, cidade, uf, site_user_id')
    .or(filtroDoc)
    .limit(1)
    .maybeSingle();
  const cand = candData as ClienteSiteErp | null;
  const docMascarado = documentoComMascara(doc);

  if (cand) {
    const nome = cand.fantasia || cand.nome || 'Cliente sem nome';
    const cidade = [cand.cidade, cand.uf].filter(Boolean).join('/') || '—';
    // Ligado a uma conta do site que está com outro documento: link para essa conta.
    if (cand.site_user_id) {
      const { data: ligado } = await site.from('user_profiles').select('email, role').eq('id', cand.site_user_id).maybeSingle();
      const l = ligado as { email: string | null; role: string } | null;
      if (l?.email && l.role !== 'admin' && l.role !== 'superadmin') {
        await mandarLink(site, l.email, redirectTo);
        return 'link-enviado';
      }
    }
    // Elegível, sem conta: o job da Fase A cria agora (ou manda para a fila com o motivo).
    await criarContasDoErp(site, 1, [cand.id]).catch(() => null);
    const { data: nova } = await site.from('user_profiles').select('email, role').or(`cpf_cnpj.eq.${doc},erp_client_id.eq.${cand.id}`).limit(1).maybeSingle();
    const n = nova as { email: string | null; role: string } | null;
    if (n?.email && n.role !== 'admin' && n.role !== 'superadmin') {
      await mandarLink(site, n.email, redirectTo);
      return 'conta-criada';
    }
    const { data: pend } = await site.from('erp_clientes_pendentes').select('motivo').eq('erp_client_id', cand.id).maybeSingle();
    const motivo = (pend as { motivo: string | null } | null)?.motivo ?? null;
    const semEmail = !cand.email || /sem e-mail/i.test(motivo ?? '');
    await avisarPrimeiroAcesso(site, {
      erpId: cand.id,
      nome,
      doc: docMascarado,
      telefone: cand.telefone,
      cidade,
      situacao: semEmail ? 'Cliente qualificado, mas SEM E-MAIL no NZERP' : `Conta não criada: ${motivo ?? 'motivo não registrado'}`,
      oQueFazer: semEmail
        ? 'Complete o e-mail do cliente no NZERP. Depois, em Clientes no site, use "Criar contas do ERP agora" e "Convidar" — ou peça para ele tentar o primeiro acesso de novo.'
        : 'Veja a fila "ERP sem conta" em Clientes no site: lá está o motivo e o que falta.',
    });
    return semEmail ? 'sem-email-no-erp' : 'pendente';
  }

  // 3) Cliente do NZERP que não é elegível (não qualificado, sem pedido entregue).
  const { data: outro } = await erp.from('clients').select('id, nome, fantasia, telefone, celular, cidade, estado').or(filtroDoc).limit(1).maybeSingle();
  const o = outro as { id: string; nome: string | null; fantasia: string | null; telefone: string | null; celular: string | null; cidade: string | null; estado: string | null } | null;
  if (o) {
    await avisarPrimeiroAcesso(site, {
      erpId: o.id,
      nome: o.fantasia || o.nome || 'Cliente sem nome',
      doc: docMascarado,
      telefone: o.celular || o.telefone,
      cidade: [o.cidade, o.estado].filter(Boolean).join('/') || '—',
      situacao: 'Está no NZERP, mas não é qualificado no CRM nem tem pedido entregue — por isso não tem conta',
      oQueFazer: 'Se for cliente de verdade, qualifique a oportunidade no CRM: a conta nasce no próximo sync (ou no botão "Criar contas do ERP agora") e você manda o convite.',
    });
    return 'nao-elegivel';
  }
  return 'desconhecido';
}
