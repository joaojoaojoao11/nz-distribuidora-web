// POST /api/nz/conta — cadastro do usuário: o que falta, quem já é cliente da
// NZ e recuperação de senha.
//
// Ops (campo `op`):
//   completude          logado  — o que falta no cadastro para poder comprar
//   consultar-documento logado  — CPF/CNPJ já é cliente no NZERP? devolve os
//                                 dados para pré-preencher SÓ se o e-mail bater
//   pos-cadastro        logado  — vincula ao cliente do ERP e aplica a
//                                 aprovação automática do lojista
//   historico-erp       logado  — pedidos, notas e parcelas que o cliente já
//                                 tinha no NZERP (lista branca de colunas)
//   pagar-titulo        logado  — "Pagar" / "Gerar Pix/boleto" num título do
//                                 cliente na NZ (Central do cliente, Fase C);
//                                 quem emite é o ERP (api/asaas/emit, origem site)
//   atribuir-titulos    admin   — roda o job que decide de quem é cada título
//   titulos-sem-dono    admin   — o que sobrou, para atribuir à mão
//   atribuir-titulo     admin   — atribui um título a um cliente
//   aprovar             admin   — libera o cadastro (com o tipo de acesso e a
//                                 faixa de preço) e avisa o cliente por e-mail
//   revogar             admin   — tira a aprovação, com motivo
//   mudar-tipo          admin   — cliente final ↔ lojista ↔ revendedor
//   mudar-faixa         admin   — faixa de preço dentro do tipo (Padrão, Gold,
//                                 Platinum ou uma faixa individual) — Fase 1
//   trocar-documento    admin   — troca o CPF/CNPJ de uma conta (travado para o
//                                 cliente depois de aprovada/ligada ao ERP)
//   recuperar-senha     público — envia o e-mail de redefinição; com CPF/CNPJ é
//                                 também o PRIMEIRO ACESSO das contas do ERP
//                                 (conta/primeiroAcesso.ts)
//   entrar-documento    público — CPF/CNPJ + senha: confere no banco e devolve
//                                 o e-mail da conta só com a senha certa
//
// Por que `recuperar-senha` passa pelo servidor em vez de o front chamar o
// Supabase direto: assim a resposta é sempre 200 (não dá para descobrir quais
// e-mails têm conta) e o redirectTo não depende do que o navegador mandar.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { ipDoCliente } from '../asaas/cliente.js';
import { completude } from '../conta/completude.js';
import { normalizarEmail, somenteDigitos, validarCpfCnpj } from '../conta/documento.js';
import { consultarDocumento, registrarLog, vincularComErp, type PerfilVinculo } from '../conta/vinculo.js';
import { emailVerificado } from '../conta/emailVerificado.js';
import { clienteDoUsuario, pedidosDoCliente, titulosDoCliente } from '../conta/erpHistorico.js';
import { atribuirTitulos, titulosSemDono } from '../conta/atribuirTitulos.js';
import { avisarCadastroNovo, avisarClienteAcessoLiberado } from '../avisos.js';
import { clienteErp } from '../pedido/despachoErp.js';
import { criarContasDoErp } from '../conta/contasDoErp.js';
import { pagarTitulo } from '../conta/pagarTitulo.js';
import { chaveDoc, conferirSenhaDocumento, passouDoLimite, registrarTentativaLogin } from '../conta/loginDocumento.js';
import { recuperarPorDocumento } from '../conta/primeiroAcesso.js';
import { espelharAcessoNoErp } from '../conta/acessoNoErp.js';

const TIPOS_ACESSO = ['client', 'lojista', 'reseller'];

/** Confere que a faixa existe, está ativa e é do tipo. Nulo = Padrão do tipo (sempre vale). */
async function conferirFaixa(site: Db, faixaId: number | null, papel: string): Promise<{ ok: boolean; nome: string | null; erro?: string }> {
  if (!faixaId) return { ok: true, nome: null };
  const { data } = await site.from('faixas_preco').select('id, nome, papel, ativa').eq('id', faixaId).maybeSingle();
  const f = data as { id: number; nome: string; papel: string; ativa: boolean } | null;
  if (!f) return { ok: false, nome: null, erro: 'faixa-inexistente' };
  if (!f.ativa) return { ok: false, nome: null, erro: 'faixa-inativa' };
  if (f.papel !== papel) return { ok: false, nome: null, erro: 'faixa-de-outro-tipo' };
  return { ok: true, nome: f.nome };
}

/**
 * Espelha o NOME da faixa no cliente do NZERP (clients.faixa_preco_site, só
 * leitura lá), para o consultor ver no CRM. Nunca derruba a aprovação: sem ERP
 * ou sem cliente lá, segue; o próximo pedido leva a faixa de novo no payload.
 */
async function espelharFaixaNoErp(alvo: { id: string; cpf_cnpj?: string | null; email?: string | null }, faixaNome: string | null): Promise<boolean> {
  try {
    const erp = await clienteErp();
    if (!erp) return false;
    const { data, error } = await erp.rpc('site_faixa_cliente', { p: { site_user_id: alvo.id, cpf_cnpj: alvo.cpf_cnpj ?? '', email: alvo.email ?? '', faixa: faixaNome ?? '' } });
    if (error) {
      console.warn('[conta] faixa não espelhada no ERP:', error.message);
      return false;
    }
    return Boolean((data as { atualizado?: boolean } | null)?.atualizado);
  } catch (err) {
    console.warn('[conta] faixa não espelhada no ERP:', err instanceof Error ? err.message : err);
    return false;
  }
}

export const SITE_URL = 'https://www.nzgroup.com.br';

const CAMPOS_PERFIL =
  'id, role, email, is_approved, erp_client_id, full_name, company_name, ie, phone, cpf_cnpj, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, cadastro_completo_em';

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Reusa checkout_tentativas (mesma ideia, outra `forma`). */
async function excedeu(site: Db, forma: string, chave: { userId?: string | null; ip?: string | null }, maximo: number, minutos: number): Promise<boolean> {
  const desde = new Date(Date.now() - minutos * 60_000).toISOString();
  let q = site.from('checkout_tentativas').select('id', { count: 'exact', head: true }).eq('forma', forma).gte('criado_em', desde);
  q = chave.userId ? q.eq('user_id', chave.userId) : q.eq('ip', chave.ip ?? '');
  const { count } = await q;
  return Number(count ?? 0) >= maximo;
}

async function registrarTentativa(site: Db, forma: string, userId: string | null, ip: string | null): Promise<void> {
  await site
    .from('checkout_tentativas')
    .insert({ user_id: userId, ip, forma, resultado: 'tentativa' })
    .then(
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
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const op = typeof body.op === 'string' ? body.op : '';
  const ip = ipDoCliente(req.headers as Record<string, string | string[] | undefined>);

  // ------------------------------------------------------------- público
  if (op === 'recuperar-senha') {
    // Aceita e-mail OU CPF/CNPJ (login por documento, Fase 2). `email` continua
    // valendo para quem ainda manda o campo antigo.
    const bruto = typeof body.identificador === 'string' ? body.identificador : typeof body.email === 'string' ? body.email : '';
    // Resposta sempre igual: nunca revela se o e-mail ou o documento têm conta.
    const generico = { ok: true as const };
    if (!bruto.includes('@')) {
      const doc = somenteDigitos(bruto);
      if (!validarCpfCnpj(doc)) {
        res.status(400).json({ error: 'documento-invalido' });
        return;
      }
      // 5 pedidos por IP por hora (como no e-mail) e 3 por documento por hora —
      // o e-mail do cliente não vira alvo de enxurrada de links.
      const porDoc = `doc:${chaveDoc(doc)}`;
      if ((await excedeu(site, 'RECUPERAR_SENHA', { ip }, 5, 60)) || (await excedeu(site, 'RECUPERAR_DOC', { ip: porDoc }, 3, 60))) {
        res.status(200).json(generico);
        return;
      }
      await registrarTentativa(site, 'RECUPERAR_SENHA', null, ip);
      await registrarTentativa(site, 'RECUPERAR_DOC', null, porDoc);
      const desfecho = await recuperarPorDocumento(site, doc, `${SITE_URL}/nova-senha`).catch(() => 'erro');
      // Rastro sem o número: o começo do HMAC basta para o admin ver repetição.
      await registrarLog(site, 'recuperar-por-documento', null, { doc: chaveDoc(doc).slice(0, 12), desfecho }, null);
      res.status(200).json(generico);
      return;
    }
    const email = normalizarEmail(bruto);
    if (!email.includes('@') || email.length > 200) {
      res.status(200).json(generico);
      return;
    }
    if (await excedeu(site, 'RECUPERAR_SENHA', { ip }, 5, 60)) {
      res.status(200).json(generico);
      return;
    }
    await registrarTentativa(site, 'RECUPERAR_SENHA', null, ip);
    await site.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/nova-senha` }).then(
      () => undefined,
      () => undefined
    );
    res.status(200).json(generico);
    return;
  }

  // Login com CPF/CNPJ (Fase 1). O servidor NÃO faz o login: confere a senha no
  // banco (login_conferir_documento) e, só com a senha certa, devolve o e-mail
  // da própria conta — o navegador entra com ele, pelo IP do cliente (o limite
  // do Supabase é por IP de origem e ignora X-Forwarded-For). Documento sem
  // conta, senha errada, admin (D2) e conta sem senha própria respondem igual
  // (D3). Limites: 5 senhas erradas por documento em 15 min, 20 tentativas por
  // IP por hora (D5).
  if (op === 'entrar-documento') {
    const doc = somenteDigitos(body.documento);
    const senha = typeof body.senha === 'string' ? body.senha : '';
    if (!validarCpfCnpj(doc)) {
      await registrarTentativaLogin(site, null, ip || null, 'invalido');
      res.status(400).json({ error: 'documento-invalido' });
      return;
    }
    const chave = chaveDoc(doc);
    if (await passouDoLimite(site, chave, ip || null)) {
      await registrarTentativaLogin(site, chave, ip || null, 'limite');
      res.status(429).json({ error: 'muitas-tentativas' });
      return;
    }
    if (!senha) {
      res.status(401).json({ error: 'credenciais' });
      return;
    }
    let r: Awaited<ReturnType<typeof conferirSenhaDocumento>>;
    try {
      r = await conferirSenhaDocumento(site, doc, senha);
    } catch {
      res.status(503).json({ error: 'indisponivel' });
      return;
    }
    await registrarTentativaLogin(site, chave, ip || null, r.resultado);
    if (r.resultado !== 'ok' || !r.email) {
      res.status(401).json({ error: 'credenciais' });
      return;
    }
    res.status(200).json({ ok: true, email: r.email });
    return;
  }

  // -------------------------------------------------------------- logado
  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }

  const { data: perfilData } = await site.from('user_profiles').select(CAMPOS_PERFIL).eq('id', userId).maybeSingle();
  const perfil = (perfilData ?? null) as (PerfilVinculo & Record<string, string | null>) | null;
  if (!perfil) {
    res.status(404).json({ error: 'perfil-nao-encontrado' });
    return;
  }

  if (op === 'completude') {
    res.status(200).json({ ...completude(perfil), papel, aprovado: perfil.is_approved, vinculadoErp: Boolean(perfil.erp_client_id) });
    return;
  }

  if (op === 'consultar-documento') {
    const doc = body.cpf_cnpj;
    if (!validarCpfCnpj(doc)) {
      res.status(400).json({ error: 'documento-invalido' });
      return;
    }
    if (await excedeu(site, 'CONSULTA_DOC', { userId }, 10, 1)) {
      res.status(429).json({ error: 'muitas-consultas' });
      return;
    }
    await registrarTentativa(site, 'CONSULTA_DOC', userId, ip);
    const r = await consultarDocumento(doc, normalizarEmail(perfil.email), await emailVerificado(site, userId));
    res.status(200).json(r);
    return;
  }

  if (op === 'pos-cadastro') {
    const r = await vincularComErp(site, perfil, { confirmado: await emailVerificado(site, userId) });
    // Conta nova no site: e-mail para a NZ uma vez por usuário (o pós-cadastro
    // roda de novo em outros logins; a chave segura). Admin não avisa.
    if (perfil.role !== 'admin') {
      await avisarCadastroNovo(site, {
        userId,
        perfil,
        aprovado: Boolean(perfil.is_approved) || r.aprovouAgora,
        jaCliente: r.jaCliente,
      });
      // Login por CPF/CNPJ, Fase 3: roda uma vez por sessão, logo depois do
      // login — o NZERP fica sabendo do último acesso e se a conta está liberada.
      // O navegador dispara tocar_acesso e este pós-cadastro AO MESMO TEMPO (visto
      // em produção, 22/10): sem gravar o acesso aqui, o espelho saía antes e o
      // ERP ficava com o acesso anterior. Isto É um acesso — grava e espelha.
      await site.from('user_profiles').update({ ultimo_acesso_em: new Date().toISOString() }).eq('id', userId);
      await espelharAcessoNoErp(site, [userId]).catch(() => null);
    }
    res.status(200).json(r);
    return;
  }

  // O histórico que o cliente já tinha na NZ antes do site existir: pedidos de
  // balcão, notas fiscais e parcelas. Tudo lido pelo módulo com lista branca —
  // preço de custo, margem, limite de crédito e vendedor nunca saem do ERP.
  if (op === 'historico-erp') {
    // O admin pode ver o histórico de um cliente (D12: o consultor vê o que o
    // cliente vê). Qualquer outro só vê o próprio.
    const alvo = papel === 'admin' && typeof body.userId === 'string' && body.userId ? body.userId : userId;
    const cliente = await clienteDoUsuario(site, alvo);
    if (!cliente) {
      res.status(200).json({ vinculado: false, cliente: null, pedidos: [], titulos: [] });
      return;
    }
    const [pedidos, titulos] = await Promise.all([pedidosDoCliente(site, alvo), titulosDoCliente(site, alvo)]);
    res.status(200).json({ vinculado: true, cliente, pedidos, titulos });
    return;
  }

  // Central do cliente (Fase C, D7): "Pagar" / "Gerar Pix/boleto" num título
  // do PRÓPRIO cliente. O site confere o dono e as regras; quem emite é o ERP.
  // Não exige aprovação do cadastro: a dívida é dele, bloqueado ou não.
  if (op === 'pagar-titulo') {
    const tituloId = typeof body.tituloId === 'string' ? body.tituloId : '';
    if (!/^[0-9a-f-]{36}$/i.test(tituloId)) {
      res.status(400).json({ error: 'titulo-invalido' });
      return;
    }
    const r = await pagarTitulo(site, userId, tituloId);
    if (!r.ok) {
      res.status(r.status).json({ error: r.erro, mensagem: r.mensagem });
      return;
    }
    res.status(200).json({ ok: true, titulo: r.titulo, emitiu: r.emitiu });
    return;
  }

  if (op === 'atribuir-titulos' || op === 'titulos-sem-dono' || op === 'atribuir-titulo') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    if (op === 'atribuir-titulos') {
      const r = await atribuirTitulos(site);
      res.status(r.erro ? 502 : 200).json({ ok: !r.erro, ...r });
      return;
    }
    if (op === 'titulos-sem-dono') {
      const { data: log } = await site.from('erp_atribuicao_log').select('*').order('rodou_em', { ascending: false }).limit(1).maybeSingle();
      res.status(200).json({ ok: true, ultimaRodada: log ?? null, titulos: await titulosSemDono(site) });
      return;
    }
    // Atribuição à mão: o admin diz de quem é. Nunca é sobrescrita pelo job.
    const tituloId = typeof body.tituloId === 'string' ? body.tituloId : '';
    const clientId = typeof body.erpClientId === 'string' ? body.erpClientId : '';
    if (!tituloId || !clientId) {
      res.status(400).json({ error: 'faltam-ids' });
      return;
    }
    const { error } = await site
      .from('erp_titulo_dono')
      .upsert({ titulo_id: tituloId, erp_client_id: clientId, chave: 'manual', confianca: 'manual', confirmado_por: userId, atualizado_em: new Date().toISOString() }, { onConflict: 'titulo_id' });
    res.status(error ? 500 : 200).json(error ? { error: 'nao-gravou', message: error.message } : { ok: true });
    return;
  }

  // Aprovação, revogação e tipo de acesso — só admin e sempre pelo servidor:
  // grava o motivo, deixa rastro em equipe_log e avisa o cliente por e-mail
  // quando libera. Até 20/10/2026 o painel escrevia direto na tabela, sem
  // e-mail e sem log — e o cliente final nem passava por aqui (nascia aprovado).
  // ----------------------------------------- Login com CPF/CNPJ, Fase 0 (D7)
  // Depois de aprovada ou ligada ao NZERP, a conta tem o CPF/CNPJ travado para
  // o cliente (gatilho trg_trava_documento): ele é login e chave com o ERP.
  // Quem troca é a NZ, por aqui, com rastro em equipe_log.
  if (op === 'trocar-documento') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    const alvo = typeof body.userId === 'string' ? body.userId : '';
    const novo = somenteDigitos(body.documento);
    if (!alvo || !validarCpfCnpj(novo)) {
      res.status(400).json({ error: 'documento-invalido' });
      return;
    }
    const { data: atual } = await site.from('user_profiles').select('id, email, cpf_cnpj, role, erp_client_id').eq('id', alvo).maybeSingle();
    const conta = atual as { id: string; email: string | null; cpf_cnpj: string | null; role: string; erp_client_id: string | null } | null;
    if (!conta) {
      res.status(404).json({ error: 'conta-nao-encontrada' });
      return;
    }
    if (conta.cpf_cnpj === novo) {
      res.status(200).json({ ok: true, igual: true });
      return;
    }
    if (conta.role !== 'client' && conta.role !== 'admin' && novo.length !== 14) {
      res.status(400).json({ error: 'lojista-precisa-de-cnpj' });
      return;
    }
    const { data: dono } = await site.from('user_profiles').select('id').eq('cpf_cnpj', novo).neq('id', alvo).maybeSingle();
    if (dono) {
      res.status(409).json({ error: 'documento-em-uso' });
      return;
    }
    const { error } = await site.from('user_profiles').update({ cpf_cnpj: novo }).eq('id', alvo);
    if (error) {
      res.status(500).json({ error: 'nao-gravou', message: error.message });
      return;
    }
    await registrarLog(site, 'trocar-documento', conta.email, { de: conta.cpf_cnpj, para: novo, vinculadoErp: Boolean(conta.erp_client_id) }, userId);
    // Ligada ao NZERP: o vínculo continua pelo erp_client_id, mas o consultor
    // precisa conferir se o documento lá bate com o novo.
    res.status(200).json({ ok: true, conferirErp: Boolean(conta.erp_client_id) });
    return;
  }

  // ------------------------------------------- Central do cliente, Fase A
  // Contas criadas a partir da base do NZERP (bloqueadas) e o convite para a
  // pessoa definir a senha. Só admin.
  if (op === 'erp-criar-contas' || op === 'erp-pendentes' || op === 'convidar-cliente') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    if (op === 'erp-criar-contas') {
      const r = await criarContasDoErp(site, 300);
      await registrarLog(site, 'erp-criar-contas', null, { ...r, erros: r.erros.slice(0, 20) }, userId);
      res.status(200).json({ ok: true, ...r });
      return;
    }
    if (op === 'erp-pendentes') {
      const { data } = await site.from('erp_clientes_pendentes').select('*').order('atualizado_em', { ascending: false }).limit(500);
      res.status(200).json({ pendentes: data ?? [] });
      return;
    }
    // convidar-cliente: link (padrão, para o consultor mandar no WhatsApp) ou
    // e-mail. A conta já existe sem senha: o link é o de redefinir a senha.
    const alvoId = typeof body.userId === 'string' ? body.userId : '';
    const { data: alvoData } = await site.from('user_profiles').select('id, email, role, full_name, origem').eq('id', alvoId).maybeSingle();
    const alvo = alvoData as { id: string; email: string | null; role: string; full_name: string | null; origem: string } | null;
    if (!alvo || !alvo.email) {
      res.status(404).json({ error: 'perfil-nao-encontrado' });
      return;
    }
    if (alvo.role === 'admin') {
      res.status(409).json({ error: 'admin-nao-por-aqui' });
      return;
    }
    const agora = new Date().toISOString();
    if (body.enviarEmail === true) {
      const { error } = await site.auth.resetPasswordForEmail(alvo.email, { redirectTo: `${SITE_URL}/nova-senha` });
      if (error) {
        res.status(502).json({ error: 'convite-nao-enviado', detalhe: error.message });
        return;
      }
      await site.from('user_profiles').update({ convite_enviado_em: agora, convite_enviado_por: userId }).eq('id', alvo.id);
      await registrarLog(site, 'convidar-cliente-email', alvo.email, { origem: alvo.origem }, userId);
      res.status(200).json({ status: 'convidado', email: alvo.email, porEmail: true });
      return;
    }
    const { data: link, error: eLink } = await site.auth.admin.generateLink({ type: 'recovery', email: alvo.email, options: { redirectTo: `${SITE_URL}/nova-senha` } });
    if (eLink || !link?.properties?.action_link) {
      res.status(502).json({ error: 'link-nao-gerado', detalhe: eLink?.message ?? 'sem link na resposta' });
      return;
    }
    await site.from('user_profiles').update({ convite_enviado_em: agora, convite_enviado_por: userId }).eq('id', alvo.id);
    await registrarLog(site, 'convidar-cliente-link', alvo.email, { origem: alvo.origem }, userId);
    // O link é segredo de uso único: vai para a tela do admin e some. Nunca logar.
    res.status(200).json({ status: 'convidado', email: alvo.email, link: link.properties.action_link });
    return;
  }

  if (op === 'aprovar' || op === 'revogar' || op === 'mudar-tipo' || op === 'mudar-faixa') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    const alvoId = typeof body.userId === 'string' ? body.userId : '';
    const { data: alvoData } = await site.from('user_profiles').select(`${CAMPOS_PERFIL}, address_city, address_state, faixa_id`).eq('id', alvoId).maybeSingle();
    const alvo = alvoData as (PerfilVinculo & { role: string; full_name: string | null; company_name: string | null; phone: string | null; address_city: string | null; address_state: string | null; faixa_id: number | null }) | null;
    if (!alvo) {
      res.status(404).json({ error: 'perfil-nao-encontrado' });
      return;
    }
    if (alvo.role === 'admin') {
      // Admin se cria e se tira por equipe.ts (convite), nunca por aqui.
      res.status(409).json({ error: 'admin-nao-por-aqui' });
      return;
    }
    const tipo = typeof body.tipo === 'string' && TIPOS_ACESSO.includes(body.tipo) ? body.tipo : null;
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 300) : '';
    // Faixa de preço (Fase 1): nulo/vazio = Padrão do tipo. Conferida contra a
    // tabela: existe, está ativa e é do tipo que a pessoa vai ter.
    const faixaBruta = body.faixaId;
    const faixaPedida = faixaBruta == null || faixaBruta === '' ? null : Number(faixaBruta);
    if (faixaPedida !== null && (!Number.isFinite(faixaPedida) || faixaPedida <= 0)) {
      res.status(400).json({ error: 'faixa-invalida' });
      return;
    }
    const patch: Record<string, unknown> = {};
    let faixaNome: string | null = null;
    if (op === 'aprovar') {
      const conf = await conferirFaixa(site, faixaPedida, tipo ?? alvo.role);
      if (!conf.ok) {
        res.status(400).json({ error: conf.erro });
        return;
      }
      faixaNome = conf.nome;
      patch.is_approved = true;
      patch.aprovado_em = new Date().toISOString();
      patch.aprovado_motivo = motivo || 'liberado pelo painel administrativo';
      if (tipo) patch.role = tipo;
      patch.faixa_id = faixaPedida;
    } else if (op === 'revogar') {
      patch.is_approved = false;
      patch.aprovado_em = null;
      patch.aprovado_motivo = motivo ? `revogado: ${motivo}` : null;
    } else if (op === 'mudar-faixa') {
      const conf = await conferirFaixa(site, faixaPedida, alvo.role);
      if (!conf.ok) {
        res.status(400).json({ error: conf.erro });
        return;
      }
      faixaNome = conf.nome;
      patch.faixa_id = faixaPedida;
    } else {
      if (!tipo) {
        res.status(400).json({ error: 'tipo-invalido' });
        return;
      }
      patch.role = tipo;
      // A faixa é DO tipo: trocou o tipo, a faixa antiga não serve mais (volta ao Padrão).
      if (alvo.faixa_id) {
        const conf = await conferirFaixa(site, Number(alvo.faixa_id), tipo);
        if (!conf.ok) patch.faixa_id = null;
        else faixaNome = conf.nome;
      }
    }
    const { error } = await site.from('user_profiles').update(patch).eq('id', alvoId);
    if (error) {
      res.status(500).json({ error: 'nao-gravou', message: error.message });
      return;
    }
    await registrarLog(site, op, normalizarEmail(alvo.email), { de: { role: alvo.role, is_approved: alvo.is_approved, faixa_id: alvo.faixa_id }, para: patch, motivo: motivo || null }, userId);
    let emailEnviado = false;
    if (op === 'aprovar' && !alvo.is_approved) {
      emailEnviado = await avisarClienteAcessoLiberado(site, { perfil: alvo, tipo: tipo ?? alvo.role, faixa: faixaNome });
    }
    // Espelho no ERP (só o nome da faixa, para o CRM). Nunca segura a resposta.
    let faixaNoErp = false;
    if ('faixa_id' in patch) faixaNoErp = await espelharFaixaNoErp(alvo, faixaNome);
    // Login por CPF/CNPJ, Fase 3: a ficha do cliente no NZERP mostra "liberada"/"bloqueada" na hora.
    if (op === 'aprovar' || op === 'revogar') await espelharAcessoNoErp(site, [alvoId]).catch(() => null);
    res.status(200).json({
      ok: true,
      emailEnviado,
      role: (patch.role as string | undefined) ?? alvo.role,
      is_approved: op === 'aprovar' ? true : op === 'revogar' ? false : alvo.is_approved,
      faixa_id: 'faixa_id' in patch ? (patch.faixa_id as number | null) : alvo.faixa_id,
      faixaNoErp,
    });
    return;
  }

  if (op === 'reavaliar') {
    // Admin pede a reavaliação de um cadastro (botão "procurar no ERP").
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }
    const alvo = typeof body.userId === 'string' ? body.userId : '';
    const { data } = await site.from('user_profiles').select(CAMPOS_PERFIL).eq('id', alvo).maybeSingle();
    if (!data) {
      res.status(404).json({ error: 'perfil-nao-encontrado' });
      return;
    }
    const r = await vincularComErp(site, data as unknown as PerfilVinculo, { confirmado: true });
    await registrarLog(site, 'reavaliar', normalizarEmail((data as { email?: string }).email), r, userId);
    res.status(200).json(r);
    return;
  }

  res.status(400).json({ error: 'op-desconhecida' });
}
