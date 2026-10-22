// POST /api/nz/incentivos — carteira, super cupom, afiliados e cupons.
//
// Tudo que mexe em dinheiro ou em dado de terceiro passa por aqui, com service
// role: o cliente nunca lê a carteira direto da tabela (o extrato devolve o
// indicado por NÚMERO, nunca por nome — D26), e o admin grava config, cupons
// e ajustes com rastro em equipe_log.
//
// Ops do cliente (logado):
//   meu-saldo             só o saldo (disponível / a liberar), sem efeito colateral — o Início do painel
//   minha-carteira        saldo, extrato anônimo, super cupom, contagens de indicados, gamificação
//   trocar-super-cupom    { codigo }
//   quero-ser-afiliado    cria o pedido de adesão (status pendente; D6)
//   minha-periodicidade   { periodicidade } mensal | quinzenal (afiliado aprovado)
//   marcar-vistos         a comemoração foi vista
//   resgatar-pontos       { campanhaId } pontos → crédito na carteira (D14)
// Ops do admin:
//   config-ler / config-salvar
//   afiliados-listar / afiliado-ver { userId } / afiliado-salvar { userId, ... } / afiliado-ajuste { userId, valor, obs }
//   cupons-listar / cupom-salvar { ... } / cupom-ativar { codigo, ativo }
//   super-cupons-listar
//   carteira-de { userId }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { registrarLog } from '../conta/vinculo.js';
import { r2 } from '../pedido/dinheiro.js';
import { COLUNAS_CONFIG, carregarConfigIncentivos, montarConfig } from '../incentivos/config.js';
import { COLUNAS_MOVIMENTO, ROTULO_TIPO, creditar, debitar, extratoDe, saldoDe, type Movimento } from '../incentivos/carteira.js';
import { garantirSuperCupom, superCupomDe, trocarCodigo } from '../incentivos/superCupom.js';
import { avaliarConquistas, marcarVistos, registrarEvento, resumoGamificacao } from '../incentivos/gamificacao.js';
import { COLUNAS_SAQUE, calcularVencimentoSaque, enviarSaqueAoErp, validarChavePix, type SaqueRow } from '../incentivos/saque.js';
import { rotuloPeriodo } from '../incentivos/periodos.js';
import { campanhasAtivas, saldoDePontos } from '../loja/avaliacoes.js';

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const num = (v: unknown): number | null => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const texto = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Código de afiliado NZ-XXXXX (mesma régua de afiliado.ts). */
function gerarCodigo(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'NZ-';
  for (let i = 0; i < 5; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return s;
}

/**
 * Extrato para o PRÓPRIO usuário: sem origem_user_id. O indicado vira "indicado
 * nº N" pela ordem em que apareceu na carteira dessa pessoa.
 */
/** O saque como o dono vê: sem `user_id` (a rota já é dele). */
function semDono(s: SaqueRow): Omit<SaqueRow, 'user_id'> {
  return Object.fromEntries(Object.entries(s).filter(([k]) => k !== 'user_id')) as Omit<SaqueRow, 'user_id'>;
}

function extratoAnonimo(movs: Movimento[]) {
  const numeroDe = new Map<string, number>();
  for (const m of [...movs].sort((a, b) => a.criado_em.localeCompare(b.criado_em))) {
    if (m.origem_user_id && !numeroDe.has(m.origem_user_id)) numeroDe.set(m.origem_user_id, numeroDe.size + 1);
  }
  return movs.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    rotulo: ROTULO_TIPO[m.tipo] ?? m.tipo,
    valor: Number(m.valor),
    status: m.status,
    libera_em: m.libera_em,
    criado_em: m.criado_em,
    periodo: m.periodo ? rotuloPeriodo(m.periodo) : null,
    percentual: m.percentual_aplicado,
    indicado: m.origem_user_id ? `indicado nº ${numeroDe.get(m.origem_user_id)}` : null,
    obs: m.obs && /trava de margem/.test(m.obs) ? 'ajustado pela regra de margem' : null,
  }));
}

async function contagensDe(site: Db, userId: string) {
  const [{ data: fil }, { data: cred }, { data: usosSuper }] = await Promise.all([
    site.from('user_profiles').select('id, is_approved').eq('indicado_por', userId),
    site.from('carteira_movimentos').select('origem_user_id').eq('user_id', userId).in('tipo', ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia']).neq('status', 'estornado'),
    site.from('cupom_usos').select('user_id, cupons!inner(dono_user_id, tipo)').eq('cupons.dono_user_id', userId).eq('cupons.tipo', 'super'),
  ]);
  const filiados = (fil ?? []) as { id: string; is_approved: boolean }[];
  const compraram = new Set(((cred ?? []) as { origem_user_id: string | null }[]).map((c) => c.origem_user_id).filter(Boolean));
  const usaramSuper = new Set(((usosSuper ?? []) as { user_id: string }[]).map((u) => u.user_id));
  return { cadastrados: filiados.length, aprovados: filiados.filter((f) => f.is_approved).length, compraram: compraram.size, usaramSuperCupom: usaramSuper.size };
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
    res.status(500).json({ error: 'ENV ausente' });
    return;
  }
  const site = createClient(siteUrl, siteKey);
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const op = typeof body.op === 'string' ? body.op : '';

  const { papel, aprovado, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }
  const cfg = await carregarConfigIncentivos(site);

  try {
    // ================================================================ cliente
    // Central do cliente (Fase D): o cartão de saldo do Início. Só leitura — a
    // minha-carteira gera super cupom e avalia conquistas, e isso não pode
    // acontecer a cada visita ao Início.
    if (op === 'meu-saldo') {
      res.status(200).json({ saldo: await saldoDe(site, userId) });
      return;
    }

    if (op === 'minha-carteira') {
      const { data: pf } = await site.from('user_profiles').select('full_name, indicado_por, filiado_em, pix_tipo, pix_chave').eq('id', userId).maybeSingle();
      const perfil = pf as { full_name: string | null; indicado_por: string | null; filiado_em: string | null; pix_tipo: string | null; pix_chave: string | null } | null;
      const { data: saquesData } = await site.from('saques').select(COLUNAS_SAQUE).eq('user_id', userId).order('criado_em', { ascending: false }).limit(20);
      const { data: afData } = await site.from('afiliados').select('codigo, status, ativo, pct_ativacao, pct_recorrencia, desconto_cupom_pct, periodicidade, criado_em').eq('user_id', userId).maybeSingle();
      const af = afData as { codigo: string; status: string; ativo: boolean; pct_ativacao: number | null; pct_recorrencia: number | null; desconto_cupom_pct: number | null; periodicidade: string; criado_em: string } | null;
      const ehAfiliado = Boolean(af && af.status === 'aprovado' && af.ativo);
      const superCupom = aprovado ? await garantirSuperCupom(site, userId, perfil?.full_name, cfg) : await superCupomDe(site, userId);
      const [saldo, movs, contagens] = await Promise.all([saldoDe(site, userId), extratoDe(site, userId, 200), contagensDe(site, userId)]);
      await avaliarConquistas(site, userId, cfg, ehAfiliado).catch(() => []);
      const gamificacao = await resumoGamificacao(site, userId, ehAfiliado);
      res.status(200).json({
        aprovado,
        saldo,
        extrato: extratoAnonimo(movs),
        superCupom: superCupom ? { codigo: superCupom.codigo, descontoPct: superCupom.desconto_pct ?? cfg.pctDescontoIndicado, cashbackPct: superCupom.comissao_pct ?? cfg.pctCashbackIndicador, usos: superCupom.usos, ativo: superCupom.ativo && cfg.superCupomAtivo } : null,
        afiliado: af
          ? { codigo: af.codigo, status: af.status, ativo: af.ativo, pctAtivacao: af.pct_ativacao ?? cfg.pctAtivacaoAfiliado, pctRecorrencia: af.pct_recorrencia ?? cfg.pctRecorrenciaAfiliado, descontoCupomPct: af.desconto_cupom_pct ?? cfg.descontoCupomAfiliadoPct, periodicidade: af.periodicidade, desde: af.criado_em }
          : null,
        contagens,
        regras: {
          diasLiberacao: cfg.diasLiberacao,
          mesesValidade: cfg.mesesValidade,
          saqueMinimo: cfg.saqueMinimo,
          saqueHoraCorte: cfg.saqueHoraCorte,
          saqueDiasVencimento: cfg.saqueDiasVencimento,
          vencimentoSeSacarAgora: calcularVencimentoSaque(new Date(), cfg.saqueDiasVencimento, cfg.saqueHoraCorte),
        },
        // Fase 4: chave Pix da conta e os últimos saques (sem nada de terceiros).
        pix: perfil?.pix_chave ? { tipo: perfil.pix_tipo, chave: perfil.pix_chave } : null,
        saques: ((saquesData ?? []) as SaqueRow[]).map(semDono),
        gamificacao,
      });
      return;
    }

    // ---------------------------------------------------------- Fase 4: Pix e saque
    if (op === 'pix-salvar') {
      const v = validarChavePix(texto(body.tipo, 20), texto(body.chave, 120));
      if (!v.ok) {
        res.status(400).json({ ok: false, motivo: v.motivo });
        return;
      }
      const { error } = await site.from('user_profiles').update({ pix_tipo: v.tipo, pix_chave: v.chave }).eq('id', userId);
      if (error) {
        res.status(500).json({ ok: false, motivo: error.message });
        return;
      }
      await registrarLog(site, 'pix-salvo', null, { tipo: v.tipo }, userId);
      res.status(200).json({ ok: true, pix: { tipo: v.tipo, chave: v.chave } });
      return;
    }

    if (op === 'saque-solicitar') {
      if (!aprovado) {
        res.status(403).json({ error: 'aguardando-aprovacao' });
        return;
      }
      const valor = r2(Number(String(body.valor ?? '').replace(',', '.')));
      if (!Number.isFinite(valor) || valor <= 0) {
        res.status(400).json({ ok: false, motivo: 'valor-invalido' });
        return;
      }
      const { data: pfx } = await site.from('user_profiles').select('pix_tipo, pix_chave').eq('id', userId).maybeSingle();
      const pix = pfx as { pix_tipo: string | null; pix_chave: string | null } | null;
      if (!pix?.pix_chave || !pix.pix_tipo) {
        res.status(409).json({ ok: false, motivo: 'pix-nao-cadastrado' });
        return;
      }
      if (valor < cfg.saqueMinimo) {
        res.status(409).json({ ok: false, motivo: 'abaixo-do-minimo', minimo: cfg.saqueMinimo });
        return;
      }
      // Atômico: trava por pessoa, confere o disponível, debita e cria a solicitação.
      const { data: sid, error: eRpc } = await site.rpc('carteira_solicitar_saque', { p_user_id: userId, p_valor: valor, p_minimo: cfg.saqueMinimo, p_pix_tipo: pix.pix_tipo, p_pix_chave: pix.pix_chave });
      if (eRpc || !sid) {
        const m = eRpc?.message ?? '';
        if (/saldo-insuficiente/.test(m)) res.status(409).json({ ok: false, motivo: 'saldo-insuficiente' });
        else if (/abaixo-do-minimo/.test(m)) res.status(409).json({ ok: false, motivo: 'abaixo-do-minimo', minimo: cfg.saqueMinimo });
        else res.status(500).json({ ok: false, motivo: 'erro', message: m });
        return;
      }
      const saqueId = String(sid);
      const vencimento = calcularVencimentoSaque(new Date(), cfg.saqueDiasVencimento, cfg.saqueHoraCorte);
      await site.from('saques').update({ vencimento }).eq('id', saqueId);
      // Vai ao NZERP agora; se o ERP estiver fora, o cron remanda (fica `solicitado`).
      const envio = await enviarSaqueAoErp(site, saqueId).catch((e) => ({ ok: false, erro: e instanceof Error ? e.message : String(e) }));
      await registrarEvento(site, userId, 'saque_solicitado', { valor, vencimento, saqueId });
      await registrarLog(site, 'saque-solicitado', null, { saqueId, valor, erp: envio }, userId);
      const { data: s } = await site.from('saques').select(COLUNAS_SAQUE).eq('id', saqueId).maybeSingle();
      res.status(200).json({ ok: true, saque: s ? semDono(s as SaqueRow) : null, erpPendente: !envio.ok, saldo: await saldoDe(site, userId) });
      return;
    }

    if (op === 'trocar-super-cupom') {
      if (!aprovado) {
        res.status(403).json({ error: 'aguardando-aprovacao' });
        return;
      }
      const r = await trocarCodigo(site, userId, texto(body.codigo, 20));
      res.status(r.ok ? 200 : 400).json(r);
      return;
    }

    if (op === 'quero-ser-afiliado') {
      if (!aprovado) {
        res.status(403).json({ error: 'aguardando-aprovacao' });
        return;
      }
      const { data: existe } = await site.from('afiliados').select('codigo, status').eq('user_id', userId).maybeSingle();
      if (existe) {
        res.status(200).json({ ok: true, repetido: true, ...(existe as object) });
        return;
      }
      let criado: { codigo: string; status: string } | null = null;
      for (let t = 0; t < 5 && !criado; t++) {
        const codigo = gerarCodigo();
        const { data, error } = await site.from('afiliados').insert({ user_id: userId, codigo, status: 'pendente', ativo: true, aceite_termos_em: body.aceite === true ? new Date().toISOString() : null }).select('codigo, status').single();
        if (!error && data) criado = data as { codigo: string; status: string };
      }
      if (!criado) {
        res.status(500).json({ error: 'nao-consegui-gerar-codigo' });
        return;
      }
      // O cupom do afiliado nasce junto (a "senha" de entrada); o desconto vem da config/afiliado na hora.
      await site.from('cupons').upsert({ codigo: criado.codigo, tipo: 'afiliado', afiliado_user_id: userId, ativo: true, descricao: 'Cupom de afiliado' }, { onConflict: 'codigo' });
      await registrarLog(site, 'afiliado-pedido', null, { userId, codigo: criado.codigo }, userId);
      res.status(200).json({ ok: true, ...criado });
      return;
    }

    if (op === 'minha-periodicidade') {
      const p = body.periodicidade === 'quinzenal' ? 'quinzenal' : body.periodicidade === 'mensal' ? 'mensal' : null;
      if (!p) {
        res.status(400).json({ error: 'periodicidade-invalida' });
        return;
      }
      const { data } = await site.from('afiliados').update({ periodicidade: p, atualizado_em: new Date().toISOString() }).eq('user_id', userId).eq('status', 'aprovado').select('periodicidade');
      res.status(200).json({ ok: (data ?? []).length > 0, periodicidade: p });
      return;
    }

    if (op === 'marcar-vistos') {
      await marcarVistos(site, userId);
      res.status(200).json({ ok: true });
      return;
    }

    if (op === 'resgatar-pontos') {
      // Pontos de avaliação viram CRÉDITO na carteira (D14, conserta o B1).
      const campanhaId = texto(body.campanhaId, 60);
      const campanha = (await campanhasAtivas(site)).find((c) => c.id === campanhaId);
      if (!campanha) {
        res.status(409).json({ ok: false, motivo: 'campanha-inativa' });
        return;
      }
      if (campanha.limite_total != null && campanha.resgatados >= campanha.limite_total) {
        res.status(409).json({ ok: false, motivo: 'limite-da-campanha' });
        return;
      }
      if (campanha.limite_por_usuario != null) {
        const { count } = await site.from('resgates').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('campanha_id', campanhaId);
        if (Number(count ?? 0) >= campanha.limite_por_usuario) {
          res.status(409).json({ ok: false, motivo: 'limite-do-usuario' });
          return;
        }
      }
      const saldoPontos = await saldoDePontos(site, userId);
      if (saldoPontos < campanha.pontos) {
        res.status(409).json({ ok: false, motivo: 'pontos-insuficientes' });
        return;
      }
      const { data: debito, error: eDeb } = await site.from('pontos_movimentos').insert({ user_id: userId, pontos: -campanha.pontos, motivo: 'resgate', referencia: campanhaId, descricao: `Resgate: ${campanha.nome}` }).select('id').single();
      if (eDeb) {
        res.status(500).json({ ok: false, motivo: 'erro', message: eDeb.message });
        return;
      }
      const cred = await creditar(site, { userId, tipo: 'resgate_pontos', valor: Number(campanha.valor), obs: `${campanha.nome} (${campanha.pontos} pontos)`, criadoPor: 'resgate' });
      if (!cred.movimento) {
        await site.from('pontos_movimentos').insert({ user_id: userId, pontos: campanha.pontos, motivo: 'estorno', referencia: String((debito as { id: number }).id), descricao: `Estorno: ${campanha.nome}` });
        res.status(500).json({ ok: false, motivo: 'erro', message: cred.erro });
        return;
      }
      await site.from('resgates').insert({ user_id: userId, campanha_id: campanhaId, pontos: campanha.pontos, valor: campanha.valor, cupom_codigo: null });
      await site.from('campanhas_cashback').update({ resgatados: campanha.resgatados + 1 }).eq('id', campanhaId);
      res.status(200).json({ ok: true, valor: Number(campanha.valor), pontos: campanha.pontos, saldoPontos: saldoPontos - campanha.pontos, saldoCarteira: await saldoDe(site, userId) });
      return;
    }

    // ================================================================== admin
    if (papel !== 'admin') {
      res.status(403).json({ error: 'apenas-admin' });
      return;
    }

    if (op === 'config-ler') {
      res.status(200).json({ config: cfg });
      return;
    }

    if (op === 'saques-listar') {
      // Fase 4: a lista dos saques para a NZ (só leitura; o pagamento é no NZERP).
      const status = texto(body.status, 20);
      let q = site.from('saques').select(COLUNAS_SAQUE).order('criado_em', { ascending: false }).limit(500);
      if (['solicitado', 'enviado', 'pago', 'cancelado'].includes(status)) q = q.eq('status', status);
      const { data: lista, error } = await q;
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      const saques = (lista ?? []) as SaqueRow[];
      const ids = [...new Set(saques.map((s) => s.user_id))];
      const { data: perfis } = ids.length ? await site.from('user_profiles').select('id, full_name, company_name, email, cpf_cnpj').in('id', ids) : { data: [] };
      const porId = new Map(((perfis ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null; cpf_cnpj: string | null }[]).map((p) => [p.id, p]));
      res.status(200).json({ saques: saques.map((s) => ({ ...s, cliente: porId.get(s.user_id) ?? null })), config: { saqueMinimo: cfg.saqueMinimo, saqueHoraCorte: cfg.saqueHoraCorte, saqueDiasVencimento: cfg.saqueDiasVencimento } });
      return;
    }

    if (op === 'config-salvar') {
      const c = (body.config && typeof body.config === 'object' ? body.config : {}) as Record<string, unknown>;
      const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
      const mapa: Record<string, string> = {
        pctDescontoIndicado: 'pct_desconto_indicado',
        pctCashbackIndicador: 'pct_cashback_indicador',
        pctAtivacaoAfiliado: 'pct_ativacao_afiliado',
        pctRecorrenciaAfiliado: 'pct_recorrencia_afiliado',
        descontoCupomAfiliadoPct: 'desconto_cupom_afiliado_pct',
        diasLiberacao: 'dias_liberacao_cashback',
        mesesValidade: 'meses_validade_cashback',
        saqueMinimo: 'saque_minimo',
        impostoPct: 'imposto_pct',
        comissaoEmbutidaPct: 'comissao_embutida_pct',
        tetoMensalPremios: 'teto_mensal_premios',
        diasAtribuicao: 'dias_atribuicao',
        cobrancaMinima: 'cobranca_minima',
        saqueDiasVencimento: 'saque_dias_vencimento',
      };
      for (const [k, col] of Object.entries(mapa)) {
        if (!(k in c)) continue;
        const v = num(c[k]);
        if (v != null && v < 0) {
          res.status(400).json({ error: 'valor-negativo', campo: k });
          return;
        }
        patch[col] = v;
      }
      if ('travaAtiva' in c) patch.trava_margem_ativa = c.travaAtiva === true;
      if ('superCupomAtivo' in c) patch.super_cupom_ativo = c.superCupomAtivo !== false;
      if ('estornarConquistaCancelamento' in c) patch.estornar_conquista_cancelamento = c.estornarConquistaCancelamento !== false;
      if ('saldoNoCheckout' in c) patch.saldo_no_checkout = c.saldoNoCheckout !== false;
      if ('periodicidadePadrao' in c) patch.periodicidade_padrao = c.periodicidadePadrao === 'quinzenal' ? 'quinzenal' : 'mensal';
      if ('saqueHoraCorte' in c && /^\d{2}:\d{2}$/.test(String(c.saqueHoraCorte))) patch.saque_hora_corte = String(c.saqueHoraCorte);
      if ('linhasExcluidas' in c) patch.linhas_excluidas = Array.isArray(c.linhasExcluidas) ? (c.linhasExcluidas as unknown[]).map(String).slice(0, 100) : [];
      const { data, error } = await site.from('loja_config').update(patch).eq('id', 1).select(COLUNAS_CONFIG).maybeSingle();
      if (error) {
        res.status(500).json({ error: 'nao-gravou', message: error.message });
        return;
      }
      await registrarLog(site, 'incentivos-config', null, { patch }, userId);
      res.status(200).json({ ok: true, config: montarConfig(data as Record<string, unknown> | null) });
      return;
    }

    if (op === 'afiliados-listar') {
      const { data: afs } = await site.from('afiliados').select('user_id, codigo, status, ativo, percentual, pct_ativacao, pct_recorrencia, desconto_cupom_pct, periodicidade, criado_em, aprovado_em').order('criado_em', { ascending: false }).limit(500);
      const lista = (afs ?? []) as { user_id: string; codigo: string; status: string; ativo: boolean; percentual: number | null; pct_ativacao: number | null; pct_recorrencia: number | null; desconto_cupom_pct: number | null; periodicidade: string; criado_em: string; aprovado_em: string | null }[];
      const ids = lista.map((a) => a.user_id);
      const [{ data: perfis }, { data: saldos }, { data: filiados }, { data: creditos }] = await Promise.all([
        ids.length ? site.from('user_profiles').select('id, full_name, company_name, email, role, cpf_cnpj').in('id', ids) : Promise.resolve({ data: [] }),
        ids.length ? site.from('carteira_saldos').select('user_id, disponivel, a_liberar').in('user_id', ids) : Promise.resolve({ data: [] }),
        ids.length ? site.from('user_profiles').select('indicado_por, is_approved').in('indicado_por', ids) : Promise.resolve({ data: [] }),
        ids.length ? site.from('carteira_movimentos').select('user_id, origem_user_id, valor, tipo, criado_em').in('user_id', ids).in('tipo', ['comissao_ativacao', 'comissao_recorrencia', 'cashback_indicacao']).neq('status', 'estornado') : Promise.resolve({ data: [] }),
      ]);
      const perfilDe = new Map(((perfis ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null; role: string; cpf_cnpj: string | null }[]).map((p) => [p.id, p]));
      const saldoDeId = new Map(((saldos ?? []) as { user_id: string; disponivel: number; a_liberar: number }[]).map((s) => [s.user_id, s]));
      const fil = (filiados ?? []) as { indicado_por: string; is_approved: boolean }[];
      const cred = (creditos ?? []) as { user_id: string; origem_user_id: string | null; valor: number; tipo: string; criado_em: string }[];
      const mesAtual = new Date().toISOString().slice(0, 7);
      res.status(200).json({
        afiliados: lista.map((a) => {
          const p = perfilDe.get(a.user_id);
          const meus = fil.filter((f) => f.indicado_por === a.user_id);
          const cs = cred.filter((c) => c.user_id === a.user_id);
          return {
            ...a,
            nome: p?.full_name ?? null,
            empresa: p?.company_name ?? null,
            email: p?.email ?? null,
            tipo: p?.role ?? null,
            filiados: meus.length,
            filiadosAprovados: meus.filter((f) => f.is_approved).length,
            compraram: new Set(cs.map((c) => c.origem_user_id).filter(Boolean)).size,
            comissaoTotal: r2(cs.reduce((s, c) => s + Number(c.valor), 0)),
            comissaoMes: r2(cs.filter((c) => c.criado_em.startsWith(mesAtual)).reduce((s, c) => s + Number(c.valor), 0)),
            saldoDisponivel: Number(saldoDeId.get(a.user_id)?.disponivel ?? 0),
            saldoALiberar: Number(saldoDeId.get(a.user_id)?.a_liberar ?? 0),
          };
        }),
        config: cfg,
      });
      return;
    }

    if (op === 'afiliado-ver') {
      const alvo = texto(body.userId, 40);
      const { data: a } = await site.from('afiliados').select('*').eq('user_id', alvo).maybeSingle();
      if (!a) {
        res.status(404).json({ error: 'afiliado-nao-encontrado' });
        return;
      }
      const [{ data: perfil }, saldo, movs, { data: filiados }] = await Promise.all([
        site.from('user_profiles').select('id, full_name, company_name, email, phone, role, cpf_cnpj, faixa_id, is_approved, created_at').eq('id', alvo).maybeSingle(),
        saldoDe(site, alvo),
        extratoDe(site, alvo, 300),
        site.from('user_profiles').select('id, full_name, company_name, email, is_approved, filiado_em, created_at, faixa_id').eq('indicado_por', alvo).order('created_at', { ascending: false }),
      ]);
      const fil = (filiados ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null; is_approved: boolean; filiado_em: string | null; created_at: string; faixa_id: number | null }[];
      const filIds = fil.map((f) => f.id);
      const { data: pedidos } = filIds.length
        ? await site.from('pedidos').select('user_id, numero, status, total_erp, total_final, total_estimado, criado_em, incentivos_processados_em').in('user_id', filIds).order('criado_em', { ascending: false }).limit(500)
        : { data: [] };
      const peds = (pedidos ?? []) as { user_id: string; numero: number; status: string; total_erp: number | null; total_final: number | null; total_estimado: number | null; criado_em: string; incentivos_processados_em: string | null }[];
      // Admin vê tudo (D28): nome do filiado, última compra, total comprado.
      const filiadosDetalhe = fil.map((f) => {
        const ps = peds.filter((p) => p.user_id === f.id);
        const faturados = ps.filter((p) => p.incentivos_processados_em);
        return {
          ...f,
          pedidos: ps.length,
          pedidosFaturados: faturados.length,
          totalComprado: r2(faturados.reduce((s, p) => s + Number(p.total_erp ?? p.total_final ?? p.total_estimado ?? 0), 0)),
          ultimaCompra: ps[0]?.criado_em ?? null,
        };
      });
      res.status(200).json({ afiliado: a, perfil, saldo, extrato: movs, filiados: filiadosDetalhe, config: cfg });
      return;
    }

    if (op === 'afiliado-salvar') {
      const alvo = texto(body.userId, 40);
      const { data: antes } = await site.from('afiliados').select('*').eq('user_id', alvo).maybeSingle();
      if (!antes) {
        res.status(404).json({ error: 'afiliado-nao-encontrado' });
        return;
      }
      const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
      if ('status' in body && ['pendente', 'aprovado', 'suspenso'].includes(String(body.status))) {
        patch.status = String(body.status);
        if (body.status === 'aprovado' && !(antes as { aprovado_em: string | null }).aprovado_em) patch.aprovado_em = new Date().toISOString();
      }
      if ('ativo' in body) patch.ativo = body.ativo !== false;
      for (const k of ['pct_ativacao', 'pct_recorrencia', 'desconto_cupom_pct'] as const) {
        if (!(k in body)) continue;
        const v = num(body[k]);
        if (v != null && (v < 0 || v > 100)) {
          res.status(400).json({ error: 'percentual-invalido', campo: k });
          return;
        }
        patch[k] = v;
      }
      if ('periodicidade' in body) patch.periodicidade = body.periodicidade === 'quinzenal' ? 'quinzenal' : 'mensal';
      if ('obs_admin' in body) patch.obs_admin = texto(body.obs_admin, 1000) || null;
      const { error } = await site.from('afiliados').update(patch).eq('user_id', alvo);
      if (error) {
        res.status(500).json({ error: 'nao-gravou', message: error.message });
        return;
      }
      // O cupom do afiliado acompanha o status (suspenso/pendente = cupom parado).
      if ('status' in patch || 'ativo' in patch) {
        const ligado = (patch.status ?? (antes as { status: string }).status) === 'aprovado' && (patch.ativo ?? (antes as { ativo: boolean }).ativo) !== false;
        await site.from('cupons').update({ ativo: ligado, atualizado_em: new Date().toISOString() }).eq('codigo', (antes as { codigo: string }).codigo).eq('tipo', 'afiliado');
        if (patch.status === 'aprovado') await site.from('eventos_programa').insert({ user_id: alvo, tipo: 'afiliado_aprovado', payload: {} });
      }
      await registrarLog(site, 'afiliado-salvar', null, { userId: alvo, patch }, userId);
      res.status(200).json({ ok: true });
      return;
    }

    if (op === 'afiliado-ajuste') {
      const alvo = texto(body.userId, 40);
      const valor = r2(Number(body.valor) || 0);
      const obs = texto(body.obs, 300);
      if (!alvo || valor === 0 || !obs) {
        res.status(400).json({ error: 'ajuste-invalido', message: 'informe o cliente, um valor diferente de zero e o motivo' });
        return;
      }
      const r = valor > 0 ? await creditar(site, { userId: alvo, tipo: 'ajuste', valor, obs, criadoPor: `admin:${userId}` }) : await debitar(site, { userId: alvo, tipo: 'ajuste', valor: -valor, obs, criadoPor: `admin:${userId}` });
      if (!r.movimento) {
        res.status(500).json({ error: 'nao-gravou', message: r.erro });
        return;
      }
      await registrarLog(site, 'carteira-ajuste', null, { userId: alvo, valor, obs }, userId);
      res.status(200).json({ ok: true, movimento: r.movimento, saldo: await saldoDe(site, alvo) });
      return;
    }

    if (op === 'carteira-de') {
      const alvo = texto(body.userId, 40);
      res.status(200).json({ saldo: await saldoDe(site, alvo), extrato: await extratoDe(site, alvo, 300) });
      return;
    }

    if (op === 'cupons-listar') {
      const tipos = Array.isArray(body.tipos) ? (body.tipos as unknown[]).map(String) : ['campanha', 'nominal', 'afiliado'];
      const { data: cs } = await site
        .from('cupons')
        .select('codigo, tipo, descricao, desconto_pct, desconto_valor, comissao_pct, dono_user_id, afiliado_user_id, valido_de, valido_ate, limite_usos, usos, usos_por_cliente, so_conta_nova, ativo, criado_em')
        .in('tipo', tipos)
        .order('criado_em', { ascending: false })
        .limit(500);
      const lista = (cs ?? []) as { codigo: string; dono_user_id: string | null; afiliado_user_id: string | null }[];
      const ids = [...new Set(lista.flatMap((c) => [c.dono_user_id, c.afiliado_user_id]).filter((x): x is string => Boolean(x)))];
      const { data: perfis } = ids.length ? await site.from('user_profiles').select('id, full_name, company_name, email').in('id', ids) : { data: [] };
      const perfilDe = new Map(((perfis ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null }[]).map((p) => [p.id, p]));
      const codigos = lista.map((c) => c.codigo);
      const { data: ganhos } = codigos.length ? await site.from('carteira_movimentos').select('cupom_codigo, valor').in('cupom_codigo', codigos).eq('tipo', 'cashback_indicacao').neq('status', 'estornado') : { data: [] };
      const cashbackDe = new Map<string, number>();
      for (const g of (ganhos ?? []) as { cupom_codigo: string; valor: number }[]) cashbackDe.set(g.cupom_codigo, r2((cashbackDe.get(g.cupom_codigo) ?? 0) + Number(g.valor)));
      res.status(200).json({
        cupons: lista.map((c) => ({ ...c, dono: c.dono_user_id ? perfilDe.get(c.dono_user_id) ?? null : null, afiliado: c.afiliado_user_id ? perfilDe.get(c.afiliado_user_id) ?? null : null, cashbackGerado: cashbackDe.get(c.codigo) ?? 0 })),
        config: cfg,
      });
      return;
    }

    if (op === 'cupom-ver') {
      const codigo = texto(body.codigo, 24).toUpperCase();
      const { data: c } = await site
        .from('cupons')
        .select('codigo, tipo, descricao, desconto_pct, desconto_valor, comissao_pct, dono_user_id, afiliado_user_id, valido_de, valido_ate, limite_usos, usos, usos_por_cliente, so_conta_nova, ativo, criado_em')
        .eq('codigo', codigo)
        .maybeSingle();
      if (!c) {
        res.status(404).json({ error: 'cupom-nao-encontrado' });
        return;
      }
      const cup = c as { dono_user_id: string | null; afiliado_user_id: string | null };
      const ids = [cup.dono_user_id, cup.afiliado_user_id].filter((x): x is string => Boolean(x));
      const { data: perfis } = ids.length ? await site.from('user_profiles').select('id, full_name, company_name, email, cpf_cnpj').in('id', ids) : { data: [] };
      const perfilDe = new Map(((perfis ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null; cpf_cnpj: string | null }[]).map((p) => [p.id, p]));
      const { data: usos } = await site.from('cupom_usos').select('user_id, pedido_id, usado_em').eq('cupom_codigo', codigo).order('usado_em', { ascending: false }).limit(200);
      const lu = (usos ?? []) as { user_id: string; pedido_id: string | null; usado_em: string }[];
      const uids = [...new Set(lu.map((u) => u.user_id))];
      const pids = lu.map((u) => u.pedido_id).filter((x): x is string => Boolean(x));
      const [{ data: quem }, { data: peds }] = await Promise.all([
        uids.length ? site.from('user_profiles').select('id, full_name, email').in('id', uids) : Promise.resolve({ data: [] }),
        pids.length ? site.from('pedidos').select('id, numero, status, total_final, total_estimado').in('id', pids) : Promise.resolve({ data: [] }),
      ]);
      const quemDe = new Map(((quem ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((p) => [p.id, p]));
      const pedDe = new Map(((peds ?? []) as { id: string; numero: number; status: string; total_final: number | null; total_estimado: number | null }[]).map((p) => [p.id, p]));
      res.status(200).json({
        cupom: { ...(c as object), dono: cup.dono_user_id ? perfilDe.get(cup.dono_user_id) ?? null : null, afiliado: cup.afiliado_user_id ? perfilDe.get(cup.afiliado_user_id) ?? null : null },
        usos: lu.map((u) => ({ ...u, cliente: quemDe.get(u.user_id) ?? null, pedido: u.pedido_id ? pedDe.get(u.pedido_id) ?? null : null })),
        config: cfg,
      });
      return;
    }

    if (op === 'cupom-salvar') {
      const codigo = texto(body.codigo, 24).toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(codigo)) {
        res.status(400).json({ error: 'codigo-invalido' });
        return;
      }
      const tipo = body.tipo === 'nominal' ? 'nominal' : 'campanha';
      const dono = tipo === 'nominal' ? texto(body.donoUserId, 40) : '';
      if (tipo === 'nominal' && !dono) {
        res.status(400).json({ error: 'nominal-sem-cliente' });
        return;
      }
      const descontoPct = num(body.descontoPct);
      const descontoValor = num(body.descontoValor);
      if ((descontoPct == null || descontoPct <= 0) && (descontoValor == null || descontoValor <= 0)) {
        res.status(400).json({ error: 'sem-desconto' });
        return;
      }
      const linha = {
        codigo,
        tipo,
        descricao: texto(body.descricao, 200) || null,
        desconto_pct: descontoPct && descontoPct > 0 ? Math.min(100, descontoPct) : null,
        desconto_valor: descontoValor && descontoValor > 0 ? descontoValor : null,
        dono_user_id: dono || null,
        valido_de: texto(body.validoDe, 30) || null,
        valido_ate: texto(body.validoAte, 30) || null,
        limite_usos: num(body.limiteUsos),
        usos_por_cliente: num(body.usosPorCliente),
        so_conta_nova: body.soContaNova === true,
        ativo: body.ativo !== false,
        criado_por: userId,
        atualizado_em: new Date().toISOString(),
      };
      const { error } = await site.from('cupons').upsert(linha, { onConflict: 'codigo' });
      if (error) {
        res.status(500).json({ error: 'nao-gravou', message: error.message });
        return;
      }
      await registrarLog(site, 'cupom-salvar', null, linha, userId);
      res.status(200).json({ ok: true, codigo });
      return;
    }

    if (op === 'cupom-ativar') {
      const codigo = texto(body.codigo, 24).toUpperCase();
      const { error } = await site.from('cupons').update({ ativo: body.ativo !== false, atualizado_em: new Date().toISOString() }).eq('codigo', codigo);
      if (error) {
        res.status(500).json({ error: 'nao-gravou', message: error.message });
        return;
      }
      await registrarLog(site, 'cupom-ativar', null, { codigo, ativo: body.ativo !== false }, userId);
      res.status(200).json({ ok: true });
      return;
    }

    if (op === 'super-cupons-listar') {
      const { data: cs } = await site.from('cupons').select('codigo, dono_user_id, usos, ativo, criado_em, desconto_pct, comissao_pct').eq('tipo', 'super').order('usos', { ascending: false }).order('criado_em', { ascending: false }).limit(1000);
      const lista = (cs ?? []) as { codigo: string; dono_user_id: string | null; usos: number; ativo: boolean; criado_em: string; desconto_pct: number | null; comissao_pct: number | null }[];
      const ids = [...new Set(lista.map((c) => c.dono_user_id).filter((x): x is string => Boolean(x)))];
      const { data: perfis } = ids.length ? await site.from('user_profiles').select('id, full_name, company_name, email, role').in('id', ids) : { data: [] };
      const perfilDe = new Map(((perfis ?? []) as { id: string; full_name: string | null; company_name: string | null; email: string | null; role: string }[]).map((p) => [p.id, p]));
      const codigos = lista.map((c) => c.codigo);
      const { data: ganhos } = codigos.length ? await site.from('carteira_movimentos').select('cupom_codigo, valor').in('cupom_codigo', codigos).eq('tipo', 'cashback_indicacao').neq('status', 'estornado') : { data: [] };
      const cashbackDe = new Map<string, number>();
      for (const g of (ganhos ?? []) as { cupom_codigo: string; valor: number }[]) cashbackDe.set(g.cupom_codigo, r2((cashbackDe.get(g.cupom_codigo) ?? 0) + Number(g.valor)));
      res.status(200).json({ superCupons: lista.map((c) => ({ ...c, dono: c.dono_user_id ? perfilDe.get(c.dono_user_id) ?? null : null, cashbackGerado: cashbackDe.get(c.codigo) ?? 0 })), config: cfg, totalCupons: lista.length, totalUsos: lista.reduce((s, c) => s + Number(c.usos), 0) });
      return;
    }

    res.status(400).json({ error: 'op-desconhecida' });
  } catch (err) {
    console.error('[incentivos] erro:', op, err instanceof Error ? err.message : err);
    if (!res.headersSent) res.status(500).json({ error: 'erro-interno', message: err instanceof Error ? err.message : String(err) });
  }
}

export type { Movimento };
export { COLUNAS_MOVIMENTO };
