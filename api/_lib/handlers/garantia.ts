// /api/nz/garantia — registro de garantia como PROTOCOLO, aprovação no admin
// e o certificado por e-mail.
//
//   POST { op: 'registrar', dados }  público   grava pendente, devolve o protocolo,
//                                              avisa a NZ e manda o protocolo ao cliente
//   POST { op: 'aprovar', id, enviar, para }   admin   aprova e (opcional) envia o certificado
//   POST { op: 'recusar', id, motivo }         admin
//   POST { op: 'enviar', id, para }            admin   (re)envia o certificado de uma aprovada
//   POST { op: 'config' }                      admin   o e-mail está configurado?
//   GET  ?op=qr&c=<código>                     público PNG do QR que vai no e-mail
//
// Por que pelo servidor: antes o navegador gravava direto na tabela (policy
// pública de insert) e já mostrava um certificado — qualquer um "emitia" uma
// garantia NZ. Aqui ficam a validação de novo (o front é sugestão), os anos de
// garantia decididos no servidor, o honeypot, o limite por IP e o e-mail, cuja
// chave não pode ir para o navegador. O estado inicial (pendente) e o protocolo
// quem põe é o trigger do banco (migrations/2026-10-17_garantias_aprovacao.sql).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { EMAIL_VALIDO, emailConfigurado, enviarEmail, remetente, type ResultadoEmail } from '../email.js';
import { SELO_VALIDO, gerarCodigo, normalizarSelo, validarRegistro, type Garantia } from '../garantias/dados.js';
import { SITE, emailAvisoNz, emailCertificado, emailProtocolo } from '../garantias/emails.js';

const COLUNAS =
  'id, protocolo, status, cliente_cpf, cliente_nome_completo, cliente_email, cliente_telefone, cliente_cep, cliente_endereco, cliente_numero, cliente_complemento, cliente_bairro, cliente_cidade, cliente_estado, veiculo_placa_chassi, veiculo_modelo, aplicador_nome, data_aplicacao, produto_nome, linha_escolhida, tipo_servico, areas_protegidas, codigo_autenticacao, garantia_anos, durabilidade_anos, created_at, aprovada_em, motivo_recusa, certificado_enviado_em, certificado_enviado_para, envios_certificado, selo_codigo';

/** Freio de spam por IP. Um aplicador registrando a semana de serviço cabe folgado. */
const MAX_POR_HORA = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Quem recebe o aviso de garantia nova. Vários separados por vírgula. */
function avisoPara(): string[] {
  return (process.env.GARANTIA_AVISO_EMAIL || 'joaovitor@nzdistribuidora.com.br')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Resposta do cliente ao e-mail cai num humano, não no nao-responda. */
function responderPara(): string | undefined {
  return process.env.GARANTIA_RESPONDER_PARA || avisoPara()[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (req.query.op === 'qr') return qr(req, res);
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'env-ausente' });
    return;
  }
  const site = createClient(siteUrl, siteKey);
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};

  if (body.op === 'registrar') return registrar(site, req, res, body);

  // Daqui para baixo, só admin.
  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel !== 'admin') {
    res.status(403).json({ error: 'so-admin' });
    return;
  }

  switch (body.op) {
    case 'config':
      res.status(200).json({ email: emailConfigurado(), remetente: remetente(), avisoPara: avisoPara() });
      return;
    case 'aprovar':
      return aprovar(site, res, body, userId);
    case 'recusar':
      return recusar(site, res, body);
    case 'enviar':
      return enviar(site, res, body);
    default:
      res.status(400).json({ error: 'op-desconhecida', disponiveis: ['registrar', 'aprovar', 'recusar', 'enviar', 'config'] });
  }
}

// ---------------------------------------------------------------- registrar

async function registrar(site: Db, req: VercelRequest, res: VercelResponse, body: Record<string, unknown>) {
  // Honeypot: humano não vê o campo; robô preenche tudo. Responde ok e não grava.
  if (typeof body.site === 'string' && body.site.trim()) {
    res.status(200).json({ ok: true, protocolo: null });
    return;
  }

  const dados = body.dados && typeof body.dados === 'object' ? (body.dados as Record<string, unknown>) : {};
  const v = validarRegistro(dados);
  if (!v.ok) {
    res.status(400).json({ error: v.erro });
    return;
  }

  const ipHash = hashIp(req);
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await site.from('garantias_nz').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', desde);
  if ((count ?? 0) >= MAX_POR_HORA) {
    res.status(429).json({ error: 'muitos-registros', porHora: MAX_POR_HORA });
    return;
  }

  // Selo do batente (opcional). Confere antes de gravar para o erro voltar na
  // hora; o freio por IP acima também segura quem tentasse adivinhar códigos.
  const selo = normalizarSelo(dados.selo_codigo);
  if (selo) {
    if (!SELO_VALIDO.test(selo)) {
      res.status(400).json({ error: 'selo-invalido' });
      return;
    }
    const { data: disp, error: erroSelo } = await site.rpc('selo_disponivel', { p_codigo: selo });
    if (erroSelo) {
      console.error('[garantia] selo_disponivel falhou:', erroSelo.code, erroSelo.message);
      res.status(500).json({ error: 'nao-consegui-registrar' });
      return;
    }
    if (disp !== 'ok') {
      res.status(400).json({ error: `selo-${String(disp)}` });
      return;
    }
  }

  // O código é único no banco; sorteio repetido (improvável) tenta de novo.
  let g: Garantia | null = null;
  for (let tentativa = 0; tentativa < 3 && !g; tentativa++) {
    const codigo = gerarCodigo(String(v.linha.data_aplicacao), String(v.linha.veiculo_placa_chassi));
    const { data, error } = await site
      .from('garantias_nz')
      .insert([{ ...v.linha, codigo_autenticacao: codigo, ip_hash: ipHash }])
      .select(COLUNAS)
      .single();
    if (!error) g = data as unknown as Garantia;
    else if (error.code !== '23505') {
      console.error('[garantia] insert falhou:', error.code, error.message);
      res.status(500).json({ error: 'nao-consegui-registrar' });
      return;
    }
  }
  if (!g) {
    res.status(500).json({ error: 'nao-consegui-registrar' });
    return;
  }

  // Liga o selo à garantia. Se outro registro levou o mesmo selo no meio do
  // caminho (corrida rara), a garantia fica sem selo e segue para análise.
  if (selo) {
    const { data: ligou, error: erroVinculo } = await site.rpc('vincular_selo', { p_codigo: selo, p_garantia: g.id });
    if (erroVinculo || ligou !== true) console.error('[garantia] selo não ligado:', selo, g.protocolo, erroVinculo?.message ?? 'ocupado');
    else g = { ...g, selo_codigo: selo };
  }

  // Avisos em paralelo; nenhum deles pode desfazer o registro.
  const aviso = emailAvisoNz(g);
  const protocolo = emailProtocolo(g);
  const [rAviso, rCliente] = await Promise.all([
    enviarEmail({ para: avisoPara(), assunto: aviso.assunto, html: aviso.html, texto: aviso.texto, ...(g.cliente_email ? { responderPara: g.cliente_email } : {}) }),
    g.cliente_email
      ? enviarEmail({ para: g.cliente_email, assunto: protocolo.assunto, html: protocolo.html, texto: protocolo.texto, responderPara: responderPara() })
      : Promise.resolve<ResultadoEmail>({ ok: false, motivo: 'nao-configurado' }),
  ]);
  if (rAviso.ok) await site.from('garantias_nz').update({ aviso_nz_enviado_em: new Date().toISOString() }).eq('id', g.id);

  res.status(200).json({
    ok: true,
    protocolo: g.protocolo,
    criadoEm: g.created_at,
    emailCliente: rCliente.ok,
    emailConfigurado: emailConfigurado(),
  });
}

// ------------------------------------------------------------------- admin

async function buscar(site: Db, id: unknown): Promise<Garantia | null> {
  if (typeof id !== 'string' || !UUID.test(id)) return null;
  const { data } = await site.from('garantias_nz').select(COLUNAS).eq('id', id).maybeSingle();
  return (data as unknown as Garantia | null) ?? null;
}

async function enviarCertificado(site: Db, g: Garantia, paraBruto: unknown): Promise<{ ok: boolean; para: string; motivo?: string; garantia: Garantia }> {
  const para = (typeof paraBruto === 'string' && paraBruto.trim() ? paraBruto : g.cliente_email ?? '').trim().toLowerCase();
  if (!EMAIL_VALIDO.test(para)) return { ok: false, para, motivo: 'email-invalido', garantia: g };
  // O certificado oficial em PDF vai anexado: é o arquivo que o Admin gera
  // (src/pages/Admin/certificadoPdf.ts) e guarda no bucket privado
  // `certificados` antes de pedir o envio. O Resend baixa pela URL assinada.
  const nomePdf = `${g.codigo_autenticacao}.pdf`;
  const { data: assinado, error: erroPdf } = await site.storage.from('certificados').createSignedUrl(nomePdf, 900);
  if (erroPdf || !assinado?.signedUrl) return { ok: false, para, motivo: 'sem-pdf', garantia: g };
  const m = emailCertificado(g);
  const r = await enviarEmail({
    para,
    assunto: m.assunto,
    html: m.html,
    texto: m.texto,
    responderPara: responderPara(),
    anexos: [{ nome: `Certificado_NZ_${g.codigo_autenticacao}.pdf`, caminho: assinado.signedUrl }],
  });
  if (!r.ok) return { ok: false, para, motivo: r.motivo, garantia: g };

  // Admin corrigiu o e-mail na hora de enviar: o cadastro passa a ter o certo.
  const patch: Record<string, unknown> = {
    certificado_enviado_em: new Date().toISOString(),
    certificado_enviado_para: para,
    envios_certificado: (g.envios_certificado ?? 0) + 1,
  };
  if (para !== (g.cliente_email ?? '').toLowerCase()) patch.cliente_email = para;
  const { data } = await site.from('garantias_nz').update(patch).eq('id', g.id).select(COLUNAS).single();
  return { ok: true, para, garantia: (data as unknown as Garantia | null) ?? g };
}

async function aprovar(site: Db, res: VercelResponse, body: Record<string, unknown>, userId: string | null) {
  const g = await buscar(site, body.id);
  if (!g) {
    res.status(404).json({ error: 'garantia-nao-encontrada' });
    return;
  }
  if (g.status === 'aprovada') {
    res.status(409).json({ error: 'ja-aprovada' });
    return;
  }
  const agora = new Date().toISOString();
  const { data, error } = await site
    .from('garantias_nz')
    .update({
      status: 'aprovada',
      aprovada_em: agora,
      aprovada_por: userId,
      recusada_em: null,
      motivo_recusa: null,
      // O Admin antigo e o painel do cliente ainda leem estes dois.
      certificado_gerado: true,
      data_geracao: agora,
    })
    .eq('id', g.id)
    .neq('status', 'aprovada')
    .select(COLUNAS)
    .single();
  if (error || !data) {
    console.error('[garantia] aprovar falhou:', error?.message);
    res.status(500).json({ error: 'nao-consegui-aprovar' });
    return;
  }
  const aprovada = data as unknown as Garantia;

  if (!body.enviar) {
    res.status(200).json({ ok: true, garantia: aprovada, envio: null });
    return;
  }
  const envio = await enviarCertificado(site, aprovada, body.para);
  res.status(200).json({ ok: true, garantia: envio.garantia, envio: { ok: envio.ok, para: envio.para, motivo: envio.motivo ?? null } });
}

async function recusar(site: Db, res: VercelResponse, body: Record<string, unknown>) {
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 500) : '';
  if (motivo.length < 3) {
    res.status(400).json({ error: 'motivo-curto' });
    return;
  }
  const g = await buscar(site, body.id);
  if (!g) {
    res.status(404).json({ error: 'garantia-nao-encontrada' });
    return;
  }
  if (g.status !== 'pendente') {
    res.status(409).json({ error: 'so-pendente' });
    return;
  }
  const { data, error } = await site
    .from('garantias_nz')
    .update({ status: 'recusada', recusada_em: new Date().toISOString(), motivo_recusa: motivo })
    .eq('id', g.id)
    .eq('status', 'pendente')
    .select(COLUNAS)
    .single();
  if (error || !data) {
    res.status(500).json({ error: 'nao-consegui-recusar' });
    return;
  }
  res.status(200).json({ ok: true, garantia: data });
}

async function enviar(site: Db, res: VercelResponse, body: Record<string, unknown>) {
  const g = await buscar(site, body.id);
  if (!g) {
    res.status(404).json({ error: 'garantia-nao-encontrada' });
    return;
  }
  if (g.status !== 'aprovada') {
    res.status(409).json({ error: 'nao-aprovada' });
    return;
  }
  const envio = await enviarCertificado(site, g, body.para);
  res.status(envio.ok ? 200 : 502).json({ ok: envio.ok, garantia: envio.garantia, envio: { ok: envio.ok, para: envio.para, motivo: envio.motivo ?? null } });
}

// ---------------------------------------------------------------------- qr

async function qr(req: VercelRequest, res: VercelResponse) {
  const codigo = String(req.query.c ?? '').toUpperCase();
  if (!/^[A-Z0-9-]{6,48}$/.test(codigo)) {
    res.status(400).json({ error: 'codigo-invalido' });
    return;
  }
  const png = await QRCode.toBuffer(`${SITE}/validar-garantia?id=${encodeURIComponent(codigo)}`, {
    type: 'png',
    width: 312,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
  res.setHeader('Content-Type', 'image/png');
  // O QR de um código nunca muda.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(png);
}

// -------------------------------------------------------------------- util

/** sha256(ip + salt): conta registros da mesma origem sem guardar o IP. */
function hashIp(req: VercelRequest): string {
  const bruto = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(bruto) ? bruto[0] : bruto || '').split(',')[0].trim() || 'desconhecido';
  const sal = process.env.OCORRENCIAS_SALT || process.env.CRON_SECRET || 'nz';
  return createHash('sha256').update(`garantia|${ip}|${sal}`).digest('hex');
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
