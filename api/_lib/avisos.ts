// Avisos por e-mail para a NZ — o que chega na caixa do João quando alguém faz
// alguma coisa no site (decisão de 18/10/2026):
//
//   pedido novo · pagamento confirmado · cadastro novo
//   pedido de aplicador · cupom surpresa (páginas PPF) · informar um problema
//
// (O aviso de garantia nova mora em garantias/emails.ts, que veio antes.)
//
// Regras que valem para todos:
//   - NUNCA derrubam quem chamou: e-mail fora do ar, chave ausente ou erro de
//     rede viram um console.warn. O pedido, o pagamento e o cadastro seguem.
//   - Com `chave`, o aviso sai UMA vez: a chave é reservada em
//     `avisos_enviados` antes de enviar (índice único). Pagamento confirmado
//     chega por webhook E por cron; o pós-cadastro roda a cada login novo.
//   - Todo aviso deixa uma linha em `avisos_enviados` (sem chave, ganha uma
//     aleatória) com `ok` e o motivo do erro: é o registro de que saiu.
//   - Destino: AVISO_EMAIL (vários com vírgula) ou o mesmo da garantia.

import { randomUUID } from 'node:crypto';
import type { Db } from './papel.js';
import { enviarEmail, esc } from './email.js';
import { COR, FONTE, SITE, botao, pagina, rotulo, topo } from './garantias/emails.js';

export function avisoPara(): string[] {
  return (process.env.AVISO_EMAIL || process.env.GARANTIA_AVISO_EMAIL || 'joaovitor@nzdistribuidora.com.br')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const reais = (v: number | null | undefined) => BRL.format(Number(v ?? 0));

/** "(11) 99999-8888" → link de conversa no WhatsApp; null se não for telefone. */
export function linkWhats(telefone: string | null | undefined, texto?: string): string | null {
  let d = (telefone ?? '').replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (d.length < 12 || d.length > 13) return null;
  return `https://wa.me/${d}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

function quando(): string {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ------------------------------------------------------------- o modelo

export interface Aviso {
  tipo: string;
  /** Com chave, sai uma vez só (ver avisos_enviados). */
  chave?: string;
  assunto: string;
  /** Rótulo pequeno acima do título ("Pedido novo"). */
  etiqueta: string;
  corEtiqueta?: string;
  titulo: string;
  subtitulo?: string;
  linhas: [string, string][];
  /** Itens de pedido: nome, detalhe e valor. */
  itens?: { nome: string; detalhe: string; valor: string }[];
  totais?: [string, string][];
  botoes?: { texto: string; href: string }[];
  nota?: string;
  /** Responder o e-mail cai no cliente, não no nao-responda. */
  responderPara?: string | null;
  /** Destino diferente da caixa da NZ (o aviso ao CLIENTE de acesso liberado). */
  para?: string[];
}

function montar(a: Aviso): { html: string; texto: string } {
  const linhas = a.linhas.filter(([, v]) => v && v.trim());
  const tabelaLinhas = linhas
    .map(
      ([t, v]) => `<tr>
      <td width="128" valign="top" style="padding:8px 12px 8px 0;border-bottom:1px solid ${COR.borda};">${rotulo(t)}</td>
      <td valign="top" style="padding:8px 0;border-bottom:1px solid ${COR.borda};font-family:${FONTE};font-size:14px;line-height:20px;color:${COR.texto};word-break:break-word;white-space:pre-wrap;">${esc(v)}</td>
    </tr>`
    )
    .join('');

  const itens = a.itens?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 0;">
      ${a.itens
        .map(
          (i) => `<tr>
        <td valign="top" style="padding:9px 12px 9px 0;border-bottom:1px solid ${COR.borda};">
          <div style="font-family:${FONTE};font-size:14px;line-height:20px;color:${COR.texto};">${esc(i.nome)}</div>
          <div style="font-family:${FONTE};font-size:12px;line-height:18px;color:${COR.mudo};">${esc(i.detalhe)}</div>
        </td>
        <td valign="top" align="right" style="padding:9px 0;border-bottom:1px solid ${COR.borda};font-family:${FONTE};font-size:14px;line-height:20px;color:${COR.texto};white-space:nowrap;">${esc(i.valor)}</td>
      </tr>`
        )
        .join('')}
      ${(a.totais ?? [])
        .map(
          ([t, v], idx, arr) => `<tr>
        <td style="padding:${idx === 0 ? 12 : 4}px 12px 0 0;font-family:${FONTE};font-size:${idx === arr.length - 1 ? 15 : 13}px;line-height:20px;color:${idx === arr.length - 1 ? COR.texto : COR.secundario};${idx === arr.length - 1 ? 'font-weight:bold;' : ''}">${esc(t)}</td>
        <td align="right" style="padding:${idx === 0 ? 12 : 4}px 0 0;font-family:${FONTE};font-size:${idx === arr.length - 1 ? 15 : 13}px;line-height:20px;color:${idx === arr.length - 1 ? COR.texto : COR.secundario};${idx === arr.length - 1 ? 'font-weight:bold;' : ''}white-space:nowrap;">${esc(v)}</td>
      </tr>`
        )
        .join('')}
    </table>`
    : '';

  const botoes = (a.botoes ?? [])
    .map((b, i) =>
      i === 0
        ? botao(b.texto, b.href)
        : `<a href="${esc(b.href)}" target="_blank" style="display:inline-block;margin-top:12px;font-family:${FONTE};font-size:13px;color:${COR.texto};text-decoration:underline;">${esc(b.texto)}</a>`
    )
    .join('');

  const corpo = `
${topo(a.etiqueta)}
<tr><td bgcolor="${COR.cartao}" class="px" style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:18px;padding:30px 32px 28px;">
  ${rotulo(a.etiqueta, a.corEtiqueta ?? '#fbbf24')}
  <h1 class="h1" style="margin:10px 0 6px;font-family:${FONTE};font-size:24px;line-height:30px;font-weight:bold;color:${COR.texto};">${esc(a.titulo)}</h1>
  ${a.subtitulo ? `<div style="font-family:${FONTE};font-size:14px;line-height:20px;color:${COR.secundario};">${esc(a.subtitulo)}</div>` : ''}
  ${itens}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 24px;">${tabelaLinhas}</table>
  ${botoes}
  ${a.nota ? `<p style="margin:16px 0 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.mudo};">${esc(a.nota)}</p>` : ''}
</td></tr>
<tr><td align="center" style="padding:22px 24px 8px;font-family:${FONTE};font-size:11px;line-height:17px;color:${COR.mudo};">
  Aviso automático do site nzgroup.com.br · ${esc(quando())}
</td></tr>`;

  const texto = [
    a.titulo,
    a.subtitulo ?? '',
    '',
    ...(a.itens ?? []).map((i) => `- ${i.nome} (${i.detalhe}): ${i.valor}`),
    ...(a.totais ?? []).map(([t, v]) => `${t}: ${v}`),
    a.itens?.length ? '' : null,
    ...linhas.map(([t, v]) => `${t}: ${v}`),
    '',
    ...(a.botoes ?? []).map((b) => `${b.texto}: ${b.href}`),
    a.nota ?? '',
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { html: pagina(a.assunto, a.subtitulo ?? a.titulo, corpo), texto };
}

/** Manda o aviso. Nunca lança; devolve se saiu. */
export async function avisarNz(site: Db | null, a: Aviso): Promise<boolean> {
  const chave = a.chave ?? `${a.tipo}:${randomUUID()}`;
  try {
    if (site) {
      const { error } = await site.from('avisos_enviados').insert({ chave, tipo: a.tipo });
      // 23505: este aviso já saiu (ou está saindo) por outro caminho.
      if (error?.code === '23505') return false;
      if (error) console.warn('[avisos] não reservei a chave, envio assim mesmo:', error.message);
    }
    const { html, texto } = montar(a);
    const r = await enviarEmail({ para: a.para?.length ? a.para : avisoPara(), assunto: a.assunto, html, texto, ...(a.responderPara ? { responderPara: a.responderPara } : {}) });
    if (site) {
      await site.from('avisos_enviados').update({ ok: r.ok, erro: r.ok ? null : r.motivo }).eq('chave', chave);
    }
    if (!r.ok && r.motivo !== 'nao-configurado') console.warn(`[avisos] ${a.tipo} não saiu:`, r.motivo);
    return r.ok;
  } catch (err) {
    console.warn(`[avisos] ${a.tipo} falhou:`, err instanceof Error ? err.message : err);
    return false;
  }
}

// ------------------------------------------------------- os seis avisos

export interface ClienteAviso {
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  cpf_cnpj?: string | null;
  address_city?: string | null;
  address_state?: string | null;
}

const nomeCliente = (c: ClienteAviso | null | undefined) => (c?.company_name || c?.full_name || c?.email || 'Cliente').trim();
const cidade = (c: ClienteAviso | null | undefined) => [c?.address_city, c?.address_state].filter(Boolean).join('/');
const contato = (c: ClienteAviso | null | undefined) => [c?.email, c?.phone].filter(Boolean).join(' · ');

export interface ItemAviso {
  nome: string;
  sku: string;
  qtd: number;
  unidade: string;
  total: number;
}

const unidadeTexto = (qtd: number, u: string) =>
  u === 'rolo' ? (qtd === 1 ? 'rolo fechado' : 'rolos fechados') : u === 'metro' ? 'm' : qtd === 1 ? 'peça' : 'peças';

export function avisarPedidoNovo(
  site: Db,
  p: {
    pedidoId: string;
    numero: number;
    cliente: ClienteAviso;
    itens: ItemAviso[];
    subtotal: number;
    desconto: number;
    total: number;
    cupom?: string | null;
    afiliado?: string | null;
    frete?: Record<string, unknown> | null;
    observacoes?: string | null;
  }
) {
  const frete =
    p.frete && typeof p.frete.prazoDias === 'number'
      ? `${String(p.frete.transportadora ?? '')} · ${p.frete.prazoDias} dias úteis${typeof p.frete.valor === 'number' ? ` · ${reais(Number(p.frete.valor))}` : ''}`.trim()
      : '';
  return avisarNz(site, {
    tipo: 'pedido-novo',
    chave: `pedido-novo:${p.pedidoId}`,
    assunto: `Pedido novo #${p.numero} — ${nomeCliente(p.cliente)} — ${reais(p.total)}`,
    etiqueta: 'Pedido novo',
    corEtiqueta: '#f87171',
    titulo: `Pedido #${p.numero} · ${reais(p.total)}`,
    subtitulo: `${nomeCliente(p.cliente)} enviou um pedido pelo site. Ele fica parado até alguém despachar ao NZERP.`,
    itens: p.itens.map((i) => ({ nome: i.nome, detalhe: `${i.sku} · ${String(i.qtd).replace('.', ',')} ${unidadeTexto(i.qtd, i.unidade)}`, valor: reais(i.total) })),
    totais: [
      ['Subtotal', reais(p.subtotal)],
      ...(p.desconto > 0 ? ([[`Cupom ${p.cupom ?? ''}`.trim(), `− ${reais(p.desconto)}`]] as [string, string][]) : []),
      ['Total estimado', reais(p.total)],
    ],
    linhas: [
      ['Cliente', `${p.cliente.full_name ?? ''}${p.cliente.company_name ? ` · ${p.cliente.company_name}` : ''}`],
      ['Documento', p.cliente.cpf_cnpj ?? ''],
      ['Contato', contato(p.cliente)],
      ['Cidade', cidade(p.cliente)],
      ['Frete estimado', frete],
      ['Indicado por', p.afiliado ?? ''],
      ['Observações', p.observacoes ?? ''],
    ],
    botoes: [
      { texto: 'Abrir em Pedidos', href: `${SITE}/admin/pedidos` },
      ...(linkWhats(p.cliente.phone) ? [{ texto: 'Chamar o cliente no WhatsApp', href: linkWhats(p.cliente.phone, `Olá! Aqui é da NZ, sobre o seu pedido #${p.numero} no site.`)! }] : []),
    ],
    nota: 'Para virar orçamento no NZERP, abra o pedido e clique em "Enviar ao NZERP".',
    responderPara: p.cliente.email,
  });
}

const FORMA: Record<string, string> = { PIX: 'Pix', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão de crédito', SALDO: 'Saldo da carteira' };

export function avisarPagamentoConfirmado(
  site: Db,
  p: {
    pagamentoId: string;
    numero: number | null;
    cliente: ClienteAviso | null;
    valor: number;
    forma: string;
    parcelas: number;
    erp: { ok: boolean; estado: string; quoteNumber?: number | null };
  }
) {
  const forma = `${FORMA[p.forma] ?? p.forma}${p.forma === 'CREDIT_CARD' && p.parcelas > 1 ? ` em ${p.parcelas}x` : ''}`;
  const erp = p.erp.ok
    ? `Enviado ao NZERP${p.erp.quoteNumber ? ` (orçamento ${p.erp.quoteNumber})` : ''}`
    : p.erp.estado === 'sem-erp'
      ? 'NZERP não configurado neste ambiente'
      : 'O NZERP não respondeu agora; o sistema tenta de novo sozinho';
  return avisarNz(site, {
    tipo: 'pagamento-pago',
    chave: `pagamento-pago:${p.pagamentoId}`,
    assunto: `Pagamento confirmado — pedido #${p.numero ?? '?'} — ${reais(p.valor)} (${FORMA[p.forma] ?? p.forma})`,
    etiqueta: 'Pagamento confirmado',
    corEtiqueta: '#4ade80',
    titulo: `${reais(p.valor)} · ${forma}`,
    subtitulo: `Pedido #${p.numero ?? '?'} de ${nomeCliente(p.cliente)} foi pago.`,
    linhas: [
      ['Pedido', p.numero ? `#${p.numero}` : ''],
      ['Cliente', nomeCliente(p.cliente)],
      ['Contato', contato(p.cliente)],
      ['Cidade', cidade(p.cliente)],
      ['NZERP', erp],
    ],
    botoes: [{ texto: 'Abrir em Pedidos', href: `${SITE}/admin/pedidos` }],
    responderPara: p.cliente?.email,
  });
}

const TIPO_LABEL: Record<string, string> = { client: 'Cliente final', lojista: 'Lojista / aplicador', reseller: 'Revendedor', admin: 'Administrador' };
const tipoDe = (role: string | null | undefined) => TIPO_LABEL[role ?? 'client'] ?? TIPO_LABEL.client;

/**
 * Cadastro novo. Desde 20/10/2026 NINGUÉM nasce aprovado, então o e-mail é um
 * pedido de ação: "aprovar em Clientes". Quando o vínculo com o ERP já aprovou
 * (lojista/revendedor reconhecido), vira só um aviso.
 */
export function avisarCadastroNovo(
  site: Db,
  p: { userId: string; perfil: ClienteAviso & { role?: string | null; is_approved?: boolean | null }; aprovado: boolean; jaCliente: boolean }
) {
  const tipo = tipoDe(p.perfil.role);
  const esperando = !p.aprovado;
  return avisarNz(site, {
    tipo: 'cadastro-novo',
    chave: `cadastro:${p.userId}`,
    assunto: esperando ? `Cadastro esperando aprovação — ${nomeCliente(p.perfil)} (${tipo})` : `Cadastro novo no site — ${nomeCliente(p.perfil)} (${tipo})`,
    etiqueta: esperando ? 'Cadastro para aprovar' : 'Cadastro novo',
    corEtiqueta: esperando ? '#fbbf24' : '#60a5fa',
    titulo: nomeCliente(p.perfil),
    subtitulo: esperando
      ? `Criou conta de ${tipo.toLowerCase()} e está esperando a aprovação para ver preços e comprar. Combinado com o cliente: até 1 dia útil.`
      : `Criou conta de ${tipo.toLowerCase()} no site (aprovada automaticamente pelo vínculo com o NZERP).`,
    linhas: [
      ['Tipo', tipo],
      ['Situação', p.aprovado ? 'Aprovado' : 'Esperando aprovação'],
      ['Nome', p.perfil.full_name ?? ''],
      ['Empresa', p.perfil.company_name ?? ''],
      ['Documento', p.perfil.cpf_cnpj ?? ''],
      ['Contato', contato(p.perfil)],
      ['Cidade', cidade(p.perfil)],
      ['Já é cliente NZ', p.jaCliente ? 'Sim — achamos o cadastro no NZERP' : 'Não encontrado no NZERP'],
    ],
    botoes: [
      { texto: esperando ? 'Aprovar em Clientes' : 'Abrir em Clientes', href: `${SITE}/admin/clientes` },
      ...(linkWhats(p.perfil.phone) ? [{ texto: 'Chamar no WhatsApp', href: linkWhats(p.perfil.phone, 'Olá! Aqui é da NZ, vi seu cadastro no site.')! }] : []),
    ],
    responderPara: p.perfil.email,
  });
}

/**
 * Para o CLIENTE: o admin aprovou o cadastro. Sai pelo mesmo modelo, mas para o
 * e-mail da pessoa, e sem chave — se for revogado e aprovado de novo, avisa de novo.
 */
export function avisarClienteAcessoLiberado(site: Db, p: { perfil: ClienteAviso & { role?: string | null }; tipo: string; faixa?: string | null }) {
  const email = (p.perfil.email ?? '').trim();
  if (!email.includes('@')) return Promise.resolve(false);
  const tipo = tipoDe(p.tipo);
  const nome = (p.perfil.full_name || p.perfil.company_name || '').trim();
  // Faixa de preço (Fase 1): o e-mail diz a faixa quando o consultor deu uma.
  const faixa = (p.faixa ?? '').trim();
  return avisarNz(site, {
    tipo: 'acesso-liberado',
    para: [email],
    assunto: 'Seu acesso à loja NZ foi liberado',
    etiqueta: 'Acesso liberado',
    corEtiqueta: '#4ade80',
    titulo: nome ? `${nome}, seu cadastro foi aprovado` : 'Seu cadastro foi aprovado',
    subtitulo: `A NZ conferiu seus dados e liberou o acesso como ${tipo.toLowerCase()}${faixa ? `, na tabela ${faixa}` : ''}. Os preços já aparecem na loja, e você pode fechar pedido pelo site.`,
    linhas: [
      ['Tipo de acesso', faixa ? `${tipo} · tabela ${faixa}` : tipo],
      ['Como pagar', 'Pix, cartão em até 6x ou boleto, direto no site'],
      ['Dúvidas', 'WhatsApp +55 11 91890-7565'],
    ],
    botoes: [
      { texto: 'Entrar na loja', href: `${SITE}/loja` },
      { texto: 'Minha conta', href: `${SITE}/painel` },
    ],
    nota: 'Se você não criou conta no site nzgroup.com.br, ignore este e-mail.',
  });
}

export function avisarAplicador(
  site: Db,
  p: { nome: string; whatsapp: string; cidade: string; uf: string; servico: string; veiculo: string; obs: string }
) {
  const zap = linkWhats(p.whatsapp, `Olá, ${p.nome.split(' ')[0]}! Aqui é da NZ, sobre o aplicador de ${p.servico} que você pediu no site.`);
  return avisarNz(site, {
    tipo: 'aplicador',
    assunto: `Pedido de aplicador — ${p.servico} — ${[p.cidade, p.uf].filter(Boolean).join('/')} — ${p.nome}`,
    etiqueta: 'Pedido de aplicador',
    titulo: `${p.nome} quer um aplicador de ${p.servico}`,
    subtitulo: `${[p.cidade, p.uf].filter(Boolean).join('/')} · pela página "Encontre um aplicador". O site promete contato em até 2 horas úteis.`,
    linhas: [
      ['WhatsApp', p.whatsapp],
      ['Cidade', [p.cidade, p.uf].filter(Boolean).join('/')],
      ['Serviço', p.servico],
      ['Veículo', p.veiculo],
      ['Observações', p.obs],
    ],
    botoes: [...(zap ? [{ texto: 'Chamar no WhatsApp', href: zap }] : []), { texto: 'Abrir em Leads', href: `${SITE}/admin/leads` }],
  });
}

export function avisarCupom(site: Db, p: { nome: string; email: string; telefone: string; origem: string }) {
  const zap = linkWhats(p.telefone, `Olá, ${p.nome.split(' ')[0]}! Aqui é da NZ, sobre o cupom que você pediu no site.`);
  return avisarNz(site, {
    tipo: 'cupom',
    assunto: `Lead do site — ${p.origem} — ${p.nome}`,
    etiqueta: 'Lead do site',
    titulo: p.nome,
    subtitulo: `Pediu contato em ${p.origem}.`,
    linhas: [
      ['WhatsApp', p.telefone],
      ['E-mail', p.email],
      ['Origem', p.origem],
    ],
    botoes: [...(zap ? [{ texto: 'Chamar no WhatsApp', href: zap }] : []), { texto: 'Abrir em Leads', href: `${SITE}/admin/leads` }],
    responderPara: p.email || null,
  });
}

export function avisarProblema(
  site: Db,
  p: { produto: string; slug: string; motivo: string; mensagem: string; contato: string; url: string; temImagem: boolean }
) {
  return avisarNz(site, {
    tipo: 'problema-produto',
    assunto: `Problema informado — ${p.produto} — ${p.motivo}`,
    etiqueta: 'Problema informado',
    corEtiqueta: '#f87171',
    titulo: p.produto,
    subtitulo: `${p.motivo}. Um visitante avisou pela página do produto.`,
    linhas: [
      ['Motivo', p.motivo],
      ['Mensagem', p.mensagem],
      ['Contato', p.contato || 'não deixou'],
      ['Imagem', p.temImagem ? 'Sim — veja na Central' : ''],
      ['Página', p.url],
    ],
    botoes: [
      { texto: 'Abrir na Central', href: `${SITE}/admin/central` },
      { texto: 'Ver o produto', href: `${SITE}/loja/${encodeURIComponent(p.slug)}` },
    ],
    responderPara: p.contato.includes('@') ? p.contato : null,
  });
}
