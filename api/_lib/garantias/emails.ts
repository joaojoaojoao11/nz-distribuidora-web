// Os e-mails da garantia: certificado aprovado (para o cliente), protocolo
// recebido (para o cliente) e aviso de registro novo (para a NZ).
//
// HTML de e-mail não é HTML de site: tabelas, estilo inline, nada de SVG
// (o Gmail não mostra), nada de imagem em data: (bloqueada), nada de fonte web.
// As imagens moram em /assets/email/ e o QR vem de /api/nz/garantia?op=qr.
// Fundo escuro com `bgcolor` nas tabelas — é o que o Outlook respeita.
//
// O visual segue o certificado do site: tinta preta, rótulos pequenos, um
// botão vermelho, e o dourado uma vez só, no selo dos anos. As peças de
// layout são exportadas para os avisos à NZ (api/_lib/avisos.ts).

import { esc } from '../email.js';
import { dataBr, dataHoraBr, fotoDaGarantia, mascararEmail, nomeDeExibicao, primeiroNome, textoDaCobertura, validaAte, type Garantia } from './dados.js';

export const SITE = (process.env.SITE_URL || 'https://www.nzgroup.com.br').replace(/\/$/, '');

export const FONTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MONO = "'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace";
export const COR = {
  fundo: '#050505',
  cartao: '#0e0e0e',
  documento: '#080808',
  borda: '#232323',
  texto: '#f5f5f7',
  secundario: '#a1a1a6',
  mudo: '#6b6b70',
  vermelho: '#d11e1e',
  ouro: '#c9a54a',
  ouroTexto: '#dcbc66',
  ok: '#4ade80',
};

export interface Mensagem {
  assunto: string;
  html: string;
  texto: string;
}

const urlCertificado = (codigo: string) => `${SITE}/validar-garantia?id=${encodeURIComponent(codigo)}`;
const urlQr = (codigo: string) => `${SITE}/api/nz/garantia?op=qr&c=${encodeURIComponent(codigo)}`;
const logoDaLinha = (g: Pick<Garantia, 'linha_escolhida'>) =>
  `${SITE}/assets/email/${g.linha_escolhida === 'NZWrap' ? 'logo-nzwrap' : 'logo-nzppf'}.png`;

// ------------------------------------------------------------------ peças

export function rotulo(t: string, cor = COR.mudo): string {
  return `<div style="font-family:${FONTE};font-size:10px;line-height:14px;letter-spacing:1.6px;text-transform:uppercase;color:${cor};">${esc(t)}</div>`;
}

function dado(titulo: string, valor: string, largo = false): string {
  return `<td class="col" ${largo ? 'colspan="2"' : 'width="50%"'} valign="top" style="padding:0 12px 16px 0;">
    ${rotulo(titulo)}
    <div style="font-family:${FONTE};font-size:15px;line-height:21px;color:${valor ? COR.texto : COR.mudo};padding-top:3px;word-break:break-word;">${esc(valor || '—')}</div>
  </td>`;
}

export function botao(texto: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
    <tr><td bgcolor="${COR.vermelho}" style="border-radius:10px;">
      <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:16px 28px;font-family:${FONTE};font-size:13px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(texto)}</a>
    </td></tr>
  </table>`;
}

export function divisoria(): string {
  return `<tr><td style="padding:0;"><div style="height:1px;line-height:1px;font-size:1px;background:${COR.borda};">&nbsp;</div></td></tr>`;
}

function rodape(protocolo: string, motivo: string): string {
  return `<tr><td align="center" style="padding:28px 24px 8px;">
    <img src="${SITE}/assets/email/logo-nz.png" width="57" height="24" alt="NZ" style="display:block;width:57px;height:24px;border:0;outline:none;margin:0 auto 14px;" />
    <div style="font-family:${FONTE};font-size:12px;line-height:19px;color:${COR.secundario};">NZ Distribuidora · Barueri/SP</div>
    <div style="font-family:${FONTE};font-size:12px;line-height:19px;color:${COR.secundario};padding-top:2px;">
      <a href="${SITE}" style="color:${COR.secundario};text-decoration:underline;">nzgroup.com.br</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/5511953037391" style="color:${COR.secundario};text-decoration:underline;">WhatsApp (11) 95303-7391</a>
    </div>
    <div style="font-family:${FONTE};font-size:11px;line-height:17px;color:${COR.mudo};padding-top:16px;max-width:460px;">
      ${esc(motivo)} Protocolo ${esc(protocolo)}.
    </div>
  </td></tr>`;
}

export function pagina(titulo: string, preheader: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${esc(titulo)}</title>
<style>
  body { margin:0; padding:0; background:${COR.fundo}; }
  a { color:${COR.texto}; }
  @media (max-width: 620px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .col { display:block !important; width:100% !important; }
    .h1 { font-size:25px !important; line-height:31px !important; }
    .qr { width:92px !important; height:92px !important; }
    .doc { padding:20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COR.fundo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COR.fundo};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COR.fundo}" style="background:${COR.fundo};">
  <tr><td align="center" style="padding:28px 12px 36px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
${corpo}
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function topo(direita: string): string {
  return `<tr><td style="padding:0 4px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle"><img src="${SITE}/assets/email/logo-nz.png" width="66" height="28" alt="NZ" style="display:block;width:66px;height:28px;border:0;outline:none;" /></td>
      <td valign="middle" align="right">${rotulo(direita)}</td>
    </tr></table>
  </td></tr>`;
}

// Cuidados dos primeiros dias, os mesmos da tela de registro (resumidos).
function cuidados(g: Garantia): [string, string][] {
  if (g.tipo_servico === 'Movel/Eletro') {
    return [
      ['Os primeiros 7 dias', 'Evite limpar a superfície. Pequenas bolhas nesse período somem sozinhas.'],
      ['Limpeza', 'Pano macio de microfibra com água e detergente neutro. Nada de solvente ou esponja abrasiva.'],
      ['Calor e bordas', 'Não apoie panelas quentes e não puxe nem raspe as bordas do filme.'],
    ];
  }
  if (g.linha_escolhida === 'NZWrap') {
    return [
      ['Os primeiros 7 dias', 'Não lave o carro: a cola do vinil ainda está chegando à aderência final.'],
      ['Lavagem', 'À mão, com shampoo neutro e microfibra. Rolos de lava-rápido riscam e levantam as bordas.'],
      ['Fosco e acetinado', 'Nada de cera, polidor ou massa de polir — mancham o vinil.'],
    ];
  }
  return [
    ['Os primeiros 7 dias', 'Não lave o carro. Bolhas de água nesse período são normais e somem com o sol.'],
    ['Lavagem', 'Shampoo neutro e nada de água de reuso, que risca como lixa.'],
    ['Alta pressão', 'Jato a mais de 50 cm e longe das bordas do filme.'],
  ];
}

// ------------------------------------------------------------ certificado

export function emailCertificado(g: Garantia): Mensagem {
  const produto = nomeDeExibicao(g.produto_nome);
  const anos = g.garantia_anos || 0;
  const ate = validaAte(g.data_aplicacao, anos);
  const nome = primeiroNome(g.cliente_nome_completo);
  const movel = g.tipo_servico === 'Movel/Eletro';
  const item = movel ? 'item' : 'veículo';
  const url = urlCertificado(g.codigo_autenticacao);

  const corpo = `
${topo('Certificado de garantia')}
<tr><td bgcolor="${COR.cartao}" style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:18px;overflow:hidden;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:0;">
      <img src="${SITE}/assets/email/linha-${fotoDaGarantia(g)}.jpg" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;border-radius:18px 18px 0 0;" />
    </td></tr>
    <tr><td class="px" style="padding:34px 36px 8px;">
      ${rotulo('✓  Garantia aprovada', COR.ok)}
      <h1 class="h1" style="margin:12px 0 12px;font-family:${FONTE};font-size:30px;line-height:36px;font-weight:bold;letter-spacing:-0.5px;color:${COR.texto};">
        ${nome ? `${esc(nome)}, sua proteção está garantida.` : 'Sua proteção está garantida.'}
      </h1>
      <p style="margin:0 0 26px;font-family:${FONTE};font-size:15px;line-height:24px;color:${COR.secundario};">
        A NZ conferiu a aplicação de <strong style="color:${COR.texto};">${esc(produto)}</strong> no seu ${item}
        <strong style="color:${COR.texto};">${esc(g.veiculo_modelo)}</strong> e aprovou a garantia.
        <strong style="color:${COR.texto};">O certificado oficial está anexado a este e-mail, em PDF.</strong>
        Ele já vale e qualquer pessoa pode conferi-lo pelo código ou pelo QR.
      </p>
    </td></tr>

    <!-- o documento -->
    <tr><td class="px" style="padding:0 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COR.documento}" style="background:${COR.documento};border:1px solid #2c2c2c;border-radius:14px;">
        <tr><td class="doc" style="padding:26px 26px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top">
              <img src="${logoDaLinha(g)}" width="${g.linha_escolhida === 'NZWrap' ? 86 : 89}" height="16" alt="${g.linha_escolhida === 'NZWrap' ? 'NZWRAP' : 'NZPPF'}" style="display:block;width:${g.linha_escolhida === 'NZWrap' ? 86 : 89}px;height:16px;border:0;outline:none;" />
              <div style="padding-top:10px;">${rotulo('Resumo da garantia')}</div>
            </td>
            <td valign="top" align="right" width="84">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>
                <td align="center" valign="middle" width="70" height="70" style="width:70px;height:70px;border:1px solid ${COR.ouro};border-radius:50%;">
                  <div style="font-family:${FONTE};font-size:24px;line-height:24px;font-weight:bold;color:${COR.ouroTexto};">${anos || '—'}</div>
                  <div style="font-family:${FONTE};font-size:8px;line-height:12px;letter-spacing:1.6px;text-transform:uppercase;color:${COR.ouroTexto};padding-top:3px;">${anos === 1 ? 'ano' : 'anos'}</div>
                </td>
              </tr></table>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 26px 0;"><div style="height:1px;line-height:1px;font-size:1px;background:${COR.borda};">&nbsp;</div></td></tr>
        <tr><td class="doc" style="padding:20px 26px 4px;">
          <div style="font-family:${FONTE};font-size:24px;line-height:30px;font-weight:bold;color:${COR.texto};">${esc(produto)}</div>
          <div style="font-family:${FONTE};font-size:14px;line-height:21px;color:${COR.secundario};padding-top:3px;">
            ${anos ? `${anos} anos de garantia` : 'Garantia'}${ate ? ` · válida até ${ate}` : ''}
          </div>
        </td></tr>
        <tr><td class="doc" style="padding:18px 26px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${dado(movel ? 'Item' : 'Veículo', g.veiculo_modelo)}${dado(movel ? 'Identificação' : 'Placa / chassi', g.veiculo_placa_chassi.toUpperCase())}</tr>
            <tr>${dado('Cobertura', textoDaCobertura(g.tipo_servico, g.areas_protegidas), true)}</tr>
            <tr>${dado('Aplicado por', g.aplicador_nome)}${dado('Data da aplicação', dataBr(g.data_aplicacao))}</tr>
            <tr>${dado('Proprietário', g.cliente_nome_completo ?? '', true)}</tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 26px;"><div style="height:1px;line-height:1px;font-size:1px;background:${COR.borda};">&nbsp;</div></td></tr>
        <tr><td class="doc" style="padding:20px 26px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="bottom" style="padding-right:14px;">
              ${rotulo('Código do certificado')}
              <div style="font-family:${MONO};font-size:15px;line-height:22px;letter-spacing:0.5px;color:${COR.texto};padding-top:5px;word-break:break-all;">${esc(g.codigo_autenticacao)}</div>
              <div style="font-family:${FONTE};font-size:12px;line-height:18px;color:${COR.mudo};padding-top:4px;">Confira em nzgroup.com.br/validar-garantia</div>
            </td>
            <td valign="bottom" align="right" width="112">
              <a href="${esc(url)}" target="_blank" style="text-decoration:none;">
                <img class="qr" src="${esc(urlQr(g.codigo_autenticacao))}" width="104" height="104" alt="QR do certificado" style="display:block;width:104px;height:104px;border:6px solid #ffffff;border-radius:8px;background:#ffffff;" />
              </a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="px" style="padding:28px 36px 8px;">
      ${botao('Conferir no site', url)}
      <p style="margin:14px 0 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.mudo};">
        Guarde o PDF anexado: é o seu certificado oficial de garantia.
      </p>
    </td></tr>

    <tr><td class="px" style="padding:26px 36px 30px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${divisoria()}
        <tr><td style="padding:24px 0 6px;">
          <div style="font-family:${FONTE};font-size:17px;line-height:24px;font-weight:bold;color:${COR.texto};">Para a proteção durar</div>
        </td></tr>
        ${cuidados(g)
          .map(
            ([t, d]) => `<tr><td style="padding:10px 0 0;">
          <div style="font-family:${FONTE};font-size:14px;line-height:21px;color:${COR.texto};font-weight:bold;">${esc(t)}</div>
          <div style="font-family:${FONTE};font-size:14px;line-height:21px;color:${COR.secundario};">${esc(d)}</div>
        </td></tr>`
          )
          .join('')}
      </table>
    </td></tr>
  </table>
</td></tr>
${rodape(g.protocolo, 'Você recebeu este e-mail porque uma garantia foi registrada com este endereço. Se não reconhece este registro, responda esta mensagem.')}`;

  const texto = [
    nome ? `${nome}, sua proteção está garantida.` : 'Sua proteção está garantida.',
    '',
    `A NZ aprovou a garantia de ${produto} no ${item} ${g.veiculo_modelo} (${g.veiculo_placa_chassi.toUpperCase()}).`,
    `${anos} anos de garantia${ate ? `, válida até ${ate}` : ''}.`,
    `Cobertura: ${textoDaCobertura(g.tipo_servico, g.areas_protegidas)}`,
    `Aplicado por ${g.aplicador_nome} em ${dataBr(g.data_aplicacao)}.`,
    '',
    'O certificado oficial está anexado a este e-mail, em PDF.',
    `Código do certificado: ${g.codigo_autenticacao}`,
    `Conferir no site: ${url}`,
    '',
    `NZ Distribuidora · ${SITE.replace(/^https?:\/\//, '')} · protocolo ${g.protocolo}`,
  ].join('\n');

  return {
    assunto: `Seu certificado de garantia ${produto} — ${g.veiculo_placa_chassi.toUpperCase()}`,
    html: pagina('Certificado de garantia NZ', `${anos} anos de garantia${ate ? `, válida até ${ate}` : ''}. Seu certificado está aqui.`, corpo),
    texto,
  };
}

// --------------------------------------------------------------- protocolo

export function emailProtocolo(g: Garantia): Mensagem {
  const produto = nomeDeExibicao(g.produto_nome);
  const nome = primeiroNome(g.cliente_nome_completo);
  const movel = g.tipo_servico === 'Movel/Eletro';
  const passo = (n: string, titulo: string, texto: string, feito: boolean) => `<tr>
    <td width="34" valign="top" style="padding:0 0 14px;">
      <div style="width:24px;height:24px;line-height:24px;border-radius:50%;text-align:center;font-family:${FONTE};font-size:12px;font-weight:bold;${feito ? `background:${COR.vermelho};color:#ffffff;` : `border:1px solid #3a3a3a;color:${COR.secundario};line-height:22px;width:22px;height:22px;`}">${feito ? '✓' : n}</div>
    </td>
    <td valign="top" style="padding:1px 0 14px;">
      <div style="font-family:${FONTE};font-size:14px;line-height:21px;font-weight:bold;color:${COR.texto};">${esc(titulo)}</div>
      <div style="font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.secundario};">${esc(texto)}</div>
    </td>
  </tr>`;

  const corpo = `
${topo('Registro de garantia')}
<tr><td bgcolor="${COR.cartao}" class="px" style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:18px;padding:34px 36px 30px;">
  ${rotulo('Registro recebido')}
  <h1 class="h1" style="margin:12px 0 12px;font-family:${FONTE};font-size:28px;line-height:34px;font-weight:bold;letter-spacing:-0.5px;color:${COR.texto};">
    ${nome ? `${esc(nome)}, recebemos o registro da sua garantia.` : 'Recebemos o registro da sua garantia.'}
  </h1>
  <p style="margin:0 0 24px;font-family:${FONTE};font-size:15px;line-height:24px;color:${COR.secundario};">
    A NZ vai conferir os dados com o aplicador. Assim que aprovar, o certificado chega neste e-mail.
  </p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COR.documento}" style="background:${COR.documento};border:1px solid #2c2c2c;border-radius:14px;">
    <tr><td class="doc" style="padding:22px 24px;">
      ${rotulo('Protocolo')}
      <div style="font-family:${MONO};font-size:24px;line-height:32px;letter-spacing:1px;color:${COR.texto};padding-top:4px;">${esc(g.protocolo)}</div>
      <div style="font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.secundario};padding-top:4px;">Registrado em ${esc(dataHoraBr(g.created_at))} · <span style="color:#fbbf24;">em análise</span></div>
    </td></tr>
    <tr><td style="padding:0 24px;"><div style="height:1px;line-height:1px;font-size:1px;background:${COR.borda};">&nbsp;</div></td></tr>
    <tr><td class="doc" style="padding:18px 24px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${dado('Produto', produto)}${dado('Cobertura', textoDaCobertura(g.tipo_servico, g.areas_protegidas))}</tr>
        <tr>${dado(movel ? 'Item' : 'Veículo', g.veiculo_modelo)}${dado(movel ? 'Identificação' : 'Placa / chassi', g.veiculo_placa_chassi.toUpperCase())}</tr>
        <tr>${dado('Aplicado por', g.aplicador_nome)}${dado('Data da aplicação', dataBr(g.data_aplicacao))}</tr>
      </table>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
    ${passo('1', 'Registro recebido', 'Você está aqui.', true)}
    ${passo('2', 'Conferência da NZ', `Confirmamos a aplicação com ${g.aplicador_nome}.`, false)}
    ${passo('3', 'Certificado no seu e-mail', 'Com código único e QR para qualquer pessoa conferir.', false)}
  </table>
</td></tr>
${rodape(g.protocolo, 'Você recebeu este e-mail porque uma garantia foi registrada com este endereço. Se não foi você, responda esta mensagem.')}`;

  const texto = [
    nome ? `${nome}, recebemos o registro da sua garantia.` : 'Recebemos o registro da sua garantia.',
    '',
    `Protocolo: ${g.protocolo} (em análise)`,
    `${produto} · ${g.veiculo_modelo} · ${g.veiculo_placa_chassi.toUpperCase()}`,
    `Aplicado por ${g.aplicador_nome} em ${dataBr(g.data_aplicacao)}.`,
    '',
    'A NZ vai conferir os dados com o aplicador. Assim que aprovar, o certificado chega neste e-mail.',
  ].join('\n');

  return {
    assunto: `Recebemos o registro da sua garantia — protocolo ${g.protocolo}`,
    html: pagina('Registro de garantia recebido', `Protocolo ${g.protocolo}. O certificado chega por e-mail depois da conferência da NZ.`, corpo),
    texto,
  };
}

// ------------------------------------------------------------- aviso à NZ

export function emailAvisoNz(g: Garantia): Mensagem {
  const produto = nomeDeExibicao(g.produto_nome);
  const endereco = g.cliente_endereco
    ? `${g.cliente_endereco}, ${g.cliente_numero ?? ''}${g.cliente_complemento ? ` — ${g.cliente_complemento}` : ''} · ${g.cliente_bairro ?? ''} · ${g.cliente_cidade ?? ''}/${g.cliente_estado ?? ''} · CEP ${g.cliente_cep ?? ''}`
    : '';
  const linhas: [string, string][] = [
    ['Produto', produto],
    ['Cobertura', textoDaCobertura(g.tipo_servico, g.areas_protegidas)],
    [g.tipo_servico === 'Movel/Eletro' ? 'Item' : 'Veículo', `${g.veiculo_modelo} · ${g.veiculo_placa_chassi.toUpperCase()}`],
    ['Aplicado por', `${g.aplicador_nome} em ${dataBr(g.data_aplicacao)}`],
    ...(g.selo_codigo ? ([['Selo do batente', `${g.selo_codigo.slice(0, 4)}-${g.selo_codigo.slice(4)}`]] as [string, string][]) : []),
    ['Proprietário', `${g.cliente_nome_completo ?? ''} · ${g.cliente_cpf}`],
    ['Contato', [g.cliente_email, g.cliente_telefone].filter(Boolean).join(' · ')],
    ['Cidade', [g.cliente_cidade, g.cliente_estado].filter(Boolean).join('/')],
    ...(endereco ? ([['Via impressa', endereco]] as [string, string][]) : []),
  ];

  const corpo = `
${topo('Garantia para aprovar')}
<tr><td bgcolor="${COR.cartao}" class="px" style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:18px;padding:30px 32px 28px;">
  ${rotulo('Nova garantia registrada', '#fbbf24')}
  <h1 class="h1" style="margin:10px 0 6px;font-family:${FONTE};font-size:24px;line-height:30px;font-weight:bold;color:${COR.texto};">${esc(produto)} · ${esc(g.veiculo_placa_chassi.toUpperCase())}</h1>
  <div style="font-family:${MONO};font-size:14px;line-height:20px;color:${COR.secundario};">${esc(g.protocolo)} · ${esc(dataHoraBr(g.created_at))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 24px;">
    ${linhas
      .map(
        ([t, v]) => `<tr>
      <td width="120" valign="top" style="padding:7px 12px 7px 0;border-bottom:1px solid ${COR.borda};">${rotulo(t)}</td>
      <td valign="top" style="padding:7px 0;border-bottom:1px solid ${COR.borda};font-family:${FONTE};font-size:14px;line-height:20px;color:${COR.texto};word-break:break-word;">${esc(v || '—')}</td>
    </tr>`
      )
      .join('')}
  </table>
  ${botao('Abrir no painel', `${SITE}/admin/garantias`)}
  <p style="margin:14px 0 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.mudo};">
    O certificado só sai depois que alguém do admin aprovar. Ao aprovar, ele vai para ${esc(mascararEmail(g.cliente_email) || 'o e-mail do cliente')}.
  </p>
</td></tr>
${rodape(g.protocolo, 'Aviso automático do registro de garantia do site.')}`;

  const texto = [
    `Nova garantia para aprovar — ${g.protocolo}`,
    '',
    ...linhas.map(([t, v]) => `${t}: ${v || '—'}`),
    '',
    `Abrir no painel: ${SITE}/admin/garantias`,
  ].join('\n');

  return {
    assunto: `Garantia para aprovar — ${produto} · ${g.veiculo_placa_chassi.toUpperCase()} · ${g.protocolo}`,
    html: pagina('Garantia para aprovar', `${produto} · ${g.veiculo_modelo} · aplicado por ${g.aplicador_nome}`, corpo),
    texto,
  };
}
