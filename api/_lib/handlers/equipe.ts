// POST /api/nz/equipe — quem trabalha na NZ tem acesso administrativo ao site.
//
// A fonte da verdade é o NZERP: `users_safe` (view sem a coluna de senha). Quem
// está ativo lá deve ter conta de admin aqui; quem sai de lá perde o acesso.
//
// Ops (todas exigem admin, exceto `sincronizar` quando vem do cron):
//   listar       cruza os usuários do ERP com os perfis do site
//   convidar     cria o convite e devolve o link para definir a senha
//   reenviar     novo link para quem ainda não entrou
//   desativar    bloqueia o acesso ao site (não mexe no ERP)
//   reativar     desfaz
//   sincronizar  o que o cron chama: convites para quem entrou, bloqueio para
//                quem saiu, papéis atualizados
//
// O site NUNCA lê nem valida a senha do ERP (ela está em texto puro em
// public.users, com RLS aberta). O acesso nasce aqui, com senha própria, pelo
// fluxo de convite do Supabase Auth.
//
// Sem SMTP configurado o Supabase entrega no máximo 2 e-mails por hora, o que
// não serve para convidar a equipe. Por isso o padrão é GERAR o link e deixar o
// admin copiar (WhatsApp); com `enviarEmail: true` o convite sai por e-mail.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { normalizarEmail } from '../conta/documento.js';
import { usuariosErp, type UsuarioErp } from '../conta/erpClientes.js';
import { registrarLog } from '../conta/vinculo.js';
import { SITE_URL } from './conta.js';

/** ~100 anos: o Supabase não tem "banir para sempre", tem duração. */
const BAN_LONGO = '876000h';

export type StatusEquipe = 'sem-conta' | 'convidado' | 'ativo' | 'bloqueado' | 'fora-do-erp';

export interface LinhaEquipe {
  erpUserId: string | null;
  nome: string;
  email: string;
  erpRole: string | null;
  ativoErp: boolean;
  permissoes: string[];
  status: StatusEquipe;
  siteUserId: string | null;
  convidadoEm: string | null;
  ultimoAcesso: string | null;
  ultimoLogin: string | null;
}

interface PerfilEquipe {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_approved: boolean;
  erp_user_id: string | null;
  erp_role: string | null;
  erp_permissions: string[] | null;
  origem: string;
  convidado_em: string | null;
  ultimo_acesso_em: string | null;
  last_sign_in_at: string | null;
  bloqueado: boolean;
  created_at: string;
}

interface Convite {
  email: string;
  erp_user_id: string | null;
  usado_em: string | null;
  revogado_em: string | null;
  criado_em: string;
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function carregar(site: Db): Promise<{ erp: UsuarioErp[]; perfis: PerfilEquipe[]; convites: Convite[] }> {
  const [erp, { data: perfis }, { data: convites }] = await Promise.all([
    usuariosErp(),
    site.rpc('equipe_site'),
    site.from('equipe_convites').select('email, erp_user_id, usado_em, revogado_em, criado_em'),
  ]);
  // Interessa quem já é admin, quem já está ligado ao ERP e — o caso que
  // escapava — quem tem conta comum de cliente com o e-mail de alguém do ERP:
  // é essa pessoa que a sincronização precisa promover.
  const emailsErp = new Set(erp.map((u) => u.email));
  return {
    erp,
    perfis: ((perfis ?? []) as PerfilEquipe[]).filter(
      (p) => p.role === 'admin' || p.erp_user_id || emailsErp.has(normalizarEmail(p.email))
    ),
    convites: (convites ?? []) as Convite[],
  };
}

/** Uma linha por pessoa do ERP + os admins do site que não estão mais lá. */
export function montarLista(erp: UsuarioErp[], perfis: PerfilEquipe[], convites: Convite[]): LinhaEquipe[] {
  const porEmail = new Map(perfis.map((p) => [normalizarEmail(p.email), p]));
  const porErpId = new Map(perfis.filter((p) => p.erp_user_id).map((p) => [p.erp_user_id as string, p]));
  const conviteDe = new Map(convites.filter((c) => !c.revogado_em).map((c) => [c.email, c]));

  const linhas: LinhaEquipe[] = erp.map((u) => {
    const perfil = porErpId.get(u.id) ?? porEmail.get(u.email) ?? null;
    const convite = conviteDe.get(u.email) ?? null;
    let status: StatusEquipe;
    if (!perfil) status = convite ? 'convidado' : 'sem-conta';
    else if (perfil.bloqueado || perfil.role !== 'admin') status = 'bloqueado';
    else status = 'ativo';
    return {
      erpUserId: u.id,
      nome: u.nome || perfil?.full_name || u.email,
      email: u.email,
      erpRole: u.papel,
      ativoErp: u.ativo,
      permissoes: u.permissoes,
      status,
      siteUserId: perfil?.id ?? null,
      convidadoEm: perfil?.convidado_em ?? convite?.criado_em ?? null,
      ultimoAcesso: perfil?.ultimo_acesso_em ?? null,
      ultimoLogin: perfil?.last_sign_in_at ?? null,
    };
  });

  // Admin do site que não tem (mais) usuário no ERP — aparece para o admin ver.
  const emailsErp = new Set(erp.map((u) => u.email));
  for (const p of perfis) {
    const email = normalizarEmail(p.email);
    if (p.role !== 'admin' || emailsErp.has(email)) continue;
    linhas.push({
      erpUserId: null,
      nome: p.full_name || email,
      email,
      erpRole: p.erp_role,
      ativoErp: false,
      permissoes: p.erp_permissions ?? [],
      status: p.bloqueado ? 'bloqueado' : 'fora-do-erp',
      siteUserId: p.id,
      convidadoEm: p.convidado_em,
      ultimoAcesso: p.ultimo_acesso_em,
      ultimoLogin: p.last_sign_in_at,
    });
  }
  return linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

async function anotarConvite(site: Db, u: UsuarioErp, quem: string | null): Promise<void> {
  await site.from('equipe_convites').upsert(
    {
      email: u.email,
      erp_user_id: u.id,
      erp_role: u.papel,
      erp_permissions: u.permissoes,
      nome: u.nome,
      criado_por: quem,
      criado_em: new Date().toISOString(),
      revogado_em: null,
    },
    { onConflict: 'email' }
  );
}

/**
 * Já existe conta com este e-mail? Então não é convite: é promoção. Vale para o
 * João, que criou a conta do site antes de tudo isso existir.
 */
async function promover(site: Db, perfilId: string, u: UsuarioErp): Promise<void> {
  await site
    .from('user_profiles')
    .update({
      role: 'admin',
      is_approved: true,
      erp_user_id: u.id,
      erp_role: u.papel,
      erp_permissions: u.permissoes,
      convidado_em: new Date().toISOString(),
      aprovado_em: new Date().toISOString(),
      aprovado_motivo: 'usuário ativo no NZERP',
    })
    .eq('id', perfilId);
  await site.auth.admin.updateUserById(perfilId, { ban_duration: 'none' }).then(
    () => undefined,
    () => undefined
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }
  const site = createClient(siteUrl, siteKey);

  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel !== 'admin' || !userId) {
    res.status(papel === 'anonimo' ? 401 : 403).json({ error: papel === 'anonimo' ? 'login-necessario' : 'apenas-admin' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const op = typeof body.op === 'string' ? body.op : '';
  const alvoId = typeof body.erpUserId === 'string' ? body.erpUserId : '';

  if (op === 'listar') {
    const { erp, perfis, convites } = await carregar(site);
    res.status(200).json({ pessoas: montarLista(erp, perfis, convites), erpDisponivel: erp.length > 0 });
    return;
  }

  if (op === 'convidar' || op === 'reenviar') {
    const erp = await usuariosErp();
    const u = erp.find((x) => x.id === alvoId);
    if (!u) {
      res.status(404).json({ error: 'usuario-erp-nao-encontrado' });
      return;
    }
    await anotarConvite(site, u, userId);

    const { data: existente } = await site.from('user_profiles').select('id, role').ilike('email', u.email).maybeSingle();
    if (existente) {
      await promover(site, (existente as { id: string }).id, u);
      await registrarLog(site, 'promover', u.email, { erp_user_id: u.id }, userId);
      res.status(200).json({ status: 'promovido', email: u.email });
      return;
    }

    const enviarEmail = body.enviarEmail === true;
    const dados = { full_name: u.nome, origem: 'convite' };
    if (enviarEmail) {
      const { error } = await site.auth.admin.inviteUserByEmail(u.email, { data: dados, redirectTo: `${SITE_URL}/nova-senha` });
      if (error) {
        res.status(502).json({ error: 'convite-nao-enviado', detalhe: error.message });
        return;
      }
      await registrarLog(site, 'convidar-email', u.email, { erp_user_id: u.id }, userId);
      res.status(200).json({ status: 'convidado', email: u.email, porEmail: true });
      return;
    }

    const { data, error } = await site.auth.admin.generateLink({
      type: 'invite',
      email: u.email,
      options: { data: dados, redirectTo: `${SITE_URL}/nova-senha` },
    });
    if (error) {
      res.status(502).json({ error: 'link-nao-gerado', detalhe: error.message });
      return;
    }
    await registrarLog(site, 'convidar-link', u.email, { erp_user_id: u.id }, userId);
    // O link é segredo de uso único: vai para a tela do admin e some. Nunca logar.
    res.status(200).json({ status: 'convidado', email: u.email, link: data?.properties?.action_link ?? null });
    return;
  }

  if (op === 'desativar' || op === 'reativar') {
    const siteUserId = typeof body.siteUserId === 'string' ? body.siteUserId : '';
    if (!siteUserId) {
      res.status(400).json({ error: 'sem-usuario' });
      return;
    }
    if (siteUserId === userId) {
      res.status(400).json({ error: 'nao-pode-se-desativar' });
      return;
    }
    const { data: p } = await site.from('user_profiles').select('email').eq('id', siteUserId).maybeSingle();
    const email = normalizarEmail((p as { email?: string } | null)?.email);

    if (op === 'desativar') {
      await site.auth.admin.updateUserById(siteUserId, { ban_duration: BAN_LONGO });
      await site.from('user_profiles').update({ role: 'client', is_approved: false }).eq('id', siteUserId);
      if (email) await site.from('equipe_convites').update({ revogado_em: new Date().toISOString() }).eq('email', email);
      await registrarLog(site, 'desativar', email, null, userId);
      res.status(200).json({ ok: true });
      return;
    }

    const erp = await usuariosErp();
    const u = erp.find((x) => x.email === email);
    if (!u) {
      res.status(400).json({ error: 'sem-usuario-no-erp' });
      return;
    }
    await anotarConvite(site, u, userId);
    await promover(site, siteUserId, u);
    await registrarLog(site, 'reativar', email, null, userId);
    res.status(200).json({ ok: true });
    return;
  }

  if (op === 'sincronizar') {
    const r = await sincronizarEquipe(site, userId);
    res.status(200).json(r);
    return;
  }

  res.status(400).json({ error: 'op-desconhecida' });
}

export interface ResultadoSincronia {
  convitesCriados: number;
  perfisAtualizados: number;
  bloqueados: number;
  erros: string[];
}

/**
 * Alinha o site com o ERP. Chamada pelo cron (api/nz/sync) e pelo botão do
 * painel. Não envia e-mail: cria o convite (que é o que autoriza a pessoa a
 * nascer admin quando entrar) e atualiza papel/permissões de quem já entrou.
 */
export async function sincronizarEquipe(site: Db, quem: string | null): Promise<ResultadoSincronia> {
  const r: ResultadoSincronia = { convitesCriados: 0, perfisAtualizados: 0, bloqueados: 0, erros: [] };
  try {
    const { erp, perfis, convites } = await carregar(site);
    if (!erp.length) {
      r.erros.push('ERP sem usuários (ou credencial ausente)');
      return r;
    }
    const conviteDe = new Map(convites.map((c) => [c.email, c]));
    const perfilPorEmail = new Map(perfis.map((p) => [normalizarEmail(p.email), p]));

    for (const u of erp.filter((x) => x.ativo)) {
      const convite = conviteDe.get(u.email);
      if (!convite || convite.revogado_em) {
        await anotarConvite(site, u, quem);
        r.convitesCriados++;
      }
      const perfil = perfilPorEmail.get(u.email);
      if (!perfil) continue;
      const mudou =
        perfil.role !== 'admin' ||
        perfil.erp_user_id !== u.id ||
        perfil.erp_role !== u.papel ||
        JSON.stringify(perfil.erp_permissions ?? []) !== JSON.stringify(u.permissoes);
      if (mudou && !perfil.bloqueado) {
        await site
          .from('user_profiles')
          .update({ role: 'admin', is_approved: true, erp_user_id: u.id, erp_role: u.papel, erp_permissions: u.permissoes })
          .eq('id', perfil.id);
        r.perfisAtualizados++;
      }
    }

    // Saiu do ERP (ou foi desativado lá) e ainda é admin aqui → bloqueia.
    const ativosErp = new Set(erp.filter((x) => x.ativo).map((x) => x.email));
    for (const p of perfis) {
      const email = normalizarEmail(p.email);
      if (p.role !== 'admin' || !p.erp_user_id || ativosErp.has(email)) continue;
      await site.auth.admin.updateUserById(p.id, { ban_duration: BAN_LONGO }).then(
        () => undefined,
        () => undefined
      );
      await site.from('user_profiles').update({ role: 'client', is_approved: false }).eq('id', p.id);
      await site.from('equipe_convites').update({ revogado_em: new Date().toISOString() }).eq('email', email);
      await registrarLog(site, 'bloquear-automatico', email, { motivo: 'usuário inativo ou ausente no NZERP' }, quem);
      r.bloqueados++;
    }
  } catch (e) {
    r.erros.push(e instanceof Error ? e.message : String(e));
  }
  return r;
}
