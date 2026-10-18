// Admin → Garantias: a fila de aprovação.
//
// Desde 17/10/2026 o registro de garantia é um PROTOCOLO: nasce pendente e só
// vale depois que alguém daqui aprova. Aprovar pode já mandar o certificado
// por e-mail (/api/nz/garantia, Resend); depois dá para reenviar, inclusive
// para um e-mail corrigido. Recusar pede o motivo.
//
// Antes o botão "GERAR" fazia tudo no navegador: PDF, upload num bucket
// público e um e-mail pelo EmailJS que nunca teve as chaves. O PDF e a
// etiqueta continuam aqui (servem para a via impressa); o upload público e o
// EmailJS saíram.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import { copiar } from '../../lib/shop/checkout';
import {
  GarantiaAdminError,
  TEXTO_ERRO_ADMIN,
  chamarGarantiaAdmin,
  dataHoraBr,
  formatarDataISO,
  nomeDeExibicao,
  textoDaCobertura,
  urlDeValidacao,
  validaAte,
} from '../../lib/garantia';
import base from './Admin.module.css';
import styles from './AdminWarranties.module.css';

type Status = 'pendente' | 'aprovada' | 'recusada';

interface Warranty {
  id: string;
  protocolo: string | null;
  status: Status;
  cliente_cpf: string;
  cliente_nome_completo: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cidade: string | null;
  cliente_estado: string | null;
  cliente_cep: string | null;
  cliente_endereco: string | null;
  cliente_numero: string | null;
  cliente_complemento: string | null;
  cliente_bairro: string | null;
  veiculo_placa_chassi: string;
  veiculo_modelo: string;
  aplicador_nome: string;
  data_aplicacao: string;
  linha_escolhida: string | null;
  produto_nome: string;
  tipo_servico: string | null;
  codigo_autenticacao: string;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  areas_protegidas: string[] | null;
  created_at: string;
  aprovada_em: string | null;
  recusada_em: string | null;
  motivo_recusa: string | null;
  certificado_enviado_em: string | null;
  certificado_enviado_para: string | null;
  envios_certificado: number | null;
}

interface Config {
  email: boolean;
  remetente: string;
  avisoPara: string[];
}

interface RespostaAcao {
  ok: boolean;
  garantia?: Warranty;
  envio?: { ok: boolean; para: string; motivo: string | null } | null;
}

type Aba = Status | 'todas';
type Painel = { id: string; modo: 'aprovar' | 'recusar' | 'enviar' } | null;

const ROTULO: Record<Status, string> = { pendente: 'Para aprovar', aprovada: 'Aprovada', recusada: 'Recusada' };
const CHIP: Record<Status, string> = { pendente: styles.chipPendente, aprovada: styles.chipAprovada, recusada: styles.chipRecusada };

const textoErro = (e: unknown) =>
  e instanceof GarantiaAdminError ? TEXTO_ERRO_ADMIN[e.codigo] ?? `Erro: ${e.codigo}` : 'Algo deu errado. Tente de novo.';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function linkWhatsCliente(w: Warranty): string | null {
  const d = (w.cliente_telefone ?? '').replace(/\D/g, '');
  if (d.length !== 10 && d.length !== 11) return null;
  const nome = (w.cliente_nome_completo ?? '').trim().split(/\s+/)[0] ?? '';
  const texto = `Olá${nome ? `, ${nome}` : ''}! Aqui é da NZ. A garantia ${nomeDeExibicao(w.produto_nome)} do seu ${w.veiculo_modelo} (${w.veiculo_placa_chassi.toUpperCase()}) foi aprovada. Seu certificado: ${urlDeValidacao(w.codigo_autenticacao)}`;
  return `https://wa.me/55${d}?text=${encodeURIComponent(texto)}`;
}

export default function AdminWarranties({ onUpdate }: { onUpdate?: () => void }) {
  const [lista, setLista] = useState<Warranty[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [aba, setAba] = useState<Aba | null>(null);
  const [busca, setBusca] = useState('');
  const [painel, setPainel] = useState<Painel>(null);
  const [para, setPara] = useState('');
  const [enviarJunto, setEnviarJunto] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [retorno, setRetorno] = useState<{ id: string; ok: boolean; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('garantias_nz').select('*').order('created_at', { ascending: false });
    setLista((data ?? []) as Warranty[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
    void chamarGarantiaAdmin<Config>({ op: 'config' })
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [carregar]);

  const contagem = useMemo(
    () => ({
      pendente: lista.filter((w) => w.status === 'pendente').length,
      aprovada: lista.filter((w) => w.status === 'aprovada').length,
      recusada: lista.filter((w) => w.status === 'recusada').length,
      todas: lista.length,
    }),
    [lista]
  );
  // Abre na fila de aprovação quando há o que aprovar; senão, nas aprovadas.
  const abaAtual: Aba = aba ?? (contagem.pendente ? 'pendente' : 'aprovada');

  const visiveis = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean);
    return lista.filter((w) => {
      if (abaAtual !== 'todas' && w.status !== abaAtual) return false;
      if (!termos.length) return true;
      const alvo = normalizar(
        [w.protocolo, w.veiculo_placa_chassi, w.veiculo_modelo, w.cliente_nome_completo, w.cliente_cpf, w.cliente_email, w.aplicador_nome, w.produto_nome].join(' ')
      );
      return termos.every((t) => alvo.includes(t));
    });
  }, [lista, abaAtual, busca]);

  const trocar = (g: Warranty) => setLista((l) => l.map((w) => (w.id === g.id ? { ...w, ...g } : w)));

  const abrir = (w: Warranty, modo: NonNullable<Painel>['modo']) => {
    setPainel({ id: w.id, modo });
    setPara(w.cliente_email ?? '');
    setEnviarJunto(Boolean(config?.email));
    setMotivo('');
    setRetorno(null);
  };

  const executar = async (w: Warranty, corpo: Record<string, unknown>, sucesso: (r: RespostaAcao) => string) => {
    setOcupado(w.id);
    setRetorno(null);
    try {
      const r = await chamarGarantiaAdmin<RespostaAcao>({ ...corpo, id: w.id });
      if (r.garantia) trocar(r.garantia);
      const falhaEnvio = r.envio && !r.envio.ok;
      setRetorno({
        id: w.id,
        ok: !falhaEnvio,
        texto: falhaEnvio ? `${sucesso(r)} O e-mail não saiu: ${TEXTO_ERRO_ADMIN[r.envio?.motivo ?? ''] ?? r.envio?.motivo}` : sucesso(r),
      });
      setPainel(null);
      onUpdate?.();
    } catch (e) {
      setRetorno({ id: w.id, ok: false, texto: textoErro(e) });
    } finally {
      setOcupado(null);
    }
  };

  const aprovar = (w: Warranty) =>
    executar(w, { op: 'aprovar', enviar: enviarJunto, para }, (r) =>
      r.envio?.ok ? `Aprovada. Certificado enviado para ${r.envio.para}.` : 'Garantia aprovada.'
    );
  const recusar = (w: Warranty) => executar(w, { op: 'recusar', motivo }, () => 'Garantia recusada.');
  const enviar = (w: Warranty) => executar(w, { op: 'enviar', para }, (r) => (r.envio?.ok ? `Certificado enviado para ${r.envio.para}.` : ''));

  const excluir = async (w: Warranty) => {
    if (!window.confirm(`Excluir de vez a garantia ${w.protocolo ?? ''} (${w.veiculo_placa_chassi})? Não dá para desfazer.`)) return;
    const { error } = await supabase.from('garantias_nz').delete().eq('id', w.id);
    if (error) {
      setRetorno({ id: w.id, ok: false, texto: `Não consegui excluir: ${error.message}` });
      return;
    }
    setLista((l) => l.filter((x) => x.id !== w.id));
    onUpdate?.();
  };

  const copiarLink = async (w: Warranty) => {
    const ok = await copiar(urlDeValidacao(w.codigo_autenticacao));
    setRetorno({ id: w.id, ok, texto: ok ? 'Link do certificado copiado.' : 'Não consegui copiar.' });
  };

  return (
    <div className={base.tableSection}>
      <p className={base.tabDescription}>
        Todo registro de garantia chega aqui como protocolo. O certificado só passa a valer — e só pode ser enviado ao cliente —
        depois que alguém aprova.
      </p>

      {config && !config.email && (
        <p className={styles.faixaAtencao}>
          O e-mail do site ainda não está ligado. Aprovar funciona, mas o certificado e o aviso de garantia nova não saem por e-mail até a
          chave <code>RESEND_API_KEY</code> entrar na Vercel. Enquanto isso, use <strong>WhatsApp</strong> ou <strong>Copiar link</strong>.
        </p>
      )}
      {config?.email && (
        <p className={styles.faixaInfo}>
          E-mail ligado. Aviso de garantia nova vai para {config.avisoPara.join(', ')}; o certificado sai como {config.remetente}.
        </p>
      )}

      <div className={styles.resumo}>
        {(['pendente', 'aprovada', 'recusada', 'todas'] as Aba[]).map((a) => (
          <button key={a} type="button" className={abaAtual === a ? `${styles.cartao} ${styles.cartaoAtivo}` : styles.cartao} onClick={() => setAba(a)}>
            <span className={`${styles.cartaoNumero} ${a === 'pendente' && contagem.pendente ? styles.numeroPendente : ''}`}>{contagem[a]}</span>
            <span className={styles.cartaoRotulo}>{a === 'todas' ? 'Todas' : a === 'pendente' ? 'Para aprovar' : a === 'aprovada' ? 'Aprovadas' : 'Recusadas'}</span>
          </button>
        ))}
        <input
          type="search"
          className={styles.busca}
          placeholder="Buscar protocolo, placa, nome, CPF…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar garantia"
        />
      </div>

      {carregando ? (
        <p className={base.emptyState}>Carregando…</p>
      ) : visiveis.length === 0 ? (
        <p className={base.emptyState}>{abaAtual === 'pendente' ? 'Nenhuma garantia esperando aprovação.' : 'Nada por aqui.'}</p>
      ) : (
        <ul className={styles.lista}>
          {visiveis.map((w) => {
            const aberto = painel?.id === w.id ? painel.modo : null;
            const ocupadoAqui = ocupado === w.id;
            const whats = w.status === 'aprovada' ? linkWhatsCliente(w) : null;
            const endereco = w.cliente_endereco
              ? `${w.cliente_endereco}, ${w.cliente_numero ?? ''}${w.cliente_complemento ? ` — ${w.cliente_complemento}` : ''} · ${w.cliente_bairro ?? ''} · ${w.cliente_cidade ?? ''}/${w.cliente_estado ?? ''} · CEP ${w.cliente_cep ?? ''}`
              : '';
            return (
              <li key={w.id} className={`${styles.item} ${styles[`faixa_${w.status}`]}`}>
                <div className={styles.itemTopo}>
                  <div className={styles.itemCabecalho}>
                    <span className={styles.itemTitulo}>
                      {nomeDeExibicao(w.produto_nome)} · {w.veiculo_placa_chassi.toUpperCase()}
                    </span>
                    <span className={styles.itemMeta}>
                      {w.protocolo ?? 'sem protocolo'} · registrado em {dataHoraBr(w.created_at)}
                    </span>
                  </div>
                  <span className={`${styles.chip} ${CHIP[w.status]}`}>{ROTULO[w.status]}</span>
                </div>

                <dl className={styles.pares}>
                  <div>
                    <dt>Proprietário</dt>
                    <dd>
                      {w.cliente_nome_completo || '—'} · {w.cliente_cpf}
                    </dd>
                  </div>
                  <div>
                    <dt>Contato</dt>
                    <dd>{[w.cliente_email, w.cliente_telefone].filter(Boolean).join(' · ') || '—'}</dd>
                  </div>
                  <div>
                    <dt>{w.tipo_servico === 'Movel/Eletro' ? 'Item' : 'Veículo'}</dt>
                    <dd>{w.veiculo_modelo}</dd>
                  </div>
                  <div>
                    <dt>Cobertura</dt>
                    <dd>{textoDaCobertura(w.tipo_servico ?? '', (w.areas_protegidas ?? []).filter((a) => a !== 'Veículo Completo' && a !== 'Item Completo'))}</dd>
                  </div>
                  <div>
                    <dt>Aplicado por</dt>
                    <dd>
                      {w.aplicador_nome} em {formatarDataISO(w.data_aplicacao)}
                    </dd>
                  </div>
                  <div>
                    <dt>Garantia</dt>
                    <dd>
                      {w.garantia_anos ? `${w.garantia_anos} anos` : '—'}
                      {validaAte(w.data_aplicacao, w.garantia_anos) ? ` · até ${validaAte(w.data_aplicacao, w.garantia_anos)}` : ''}
                    </dd>
                  </div>
                  {endereco && (
                    <div className={styles.parLargo}>
                      <dt>Via impressa</dt>
                      <dd>{endereco}</dd>
                    </div>
                  )}
                  {w.status === 'recusada' && w.motivo_recusa && (
                    <div className={styles.parLargo}>
                      <dt>Motivo da recusa</dt>
                      <dd>{w.motivo_recusa}</dd>
                    </div>
                  )}
                  {w.status === 'aprovada' && (
                    <div className={styles.parLargo}>
                      <dt>Certificado</dt>
                      <dd>
                        {w.aprovada_em ? `Aprovado em ${dataHoraBr(w.aprovada_em)}. ` : ''}
                        {w.certificado_enviado_em
                          ? `Enviado por e-mail em ${dataHoraBr(w.certificado_enviado_em)} para ${w.certificado_enviado_para}${(w.envios_certificado ?? 0) > 1 ? ` (${w.envios_certificado} envios)` : ''}.`
                          : 'Ainda não enviado por e-mail.'}
                      </dd>
                    </div>
                  )}
                </dl>

                {retorno?.id === w.id && <p className={retorno.ok ? styles.retornoOk : styles.retornoErro}>{retorno.texto}</p>}

                {aberto === 'aprovar' && (
                  <div className={styles.painel}>
                    <label className={styles.marcar}>
                      <input type="checkbox" checked={enviarJunto} onChange={(e) => setEnviarJunto(e.target.checked)} disabled={!config?.email} />
                      Enviar o certificado por e-mail agora
                    </label>
                    {enviarJunto && config?.email && (
                      <input type="email" className={styles.campo} value={para} onChange={(e) => setPara(e.target.value)} aria-label="E-mail do cliente" />
                    )}
                    {!config?.email && <p className={styles.nota}>E-mail não configurado: aprove e mande o link pelo WhatsApp.</p>}
                    <div className={styles.painelAcoes}>
                      <button type="button" className={`${base.actionBtn} ${base.actionBtnApprove}`} onClick={() => void aprovar(w)} disabled={ocupadoAqui}>
                        {ocupadoAqui ? 'Aprovando…' : 'Confirmar aprovação'}
                      </button>
                      <button type="button" className={base.actionBtn} onClick={() => setPainel(null)} disabled={ocupadoAqui}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {aberto === 'recusar' && (
                  <div className={styles.painel}>
                    <textarea
                      className={styles.campo}
                      rows={2}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Motivo (fica no registro). Ex.: aplicador não confirmou a aplicação."
                      aria-label="Motivo da recusa"
                      maxLength={500}
                    />
                    <div className={styles.painelAcoes}>
                      <button type="button" className={`${base.actionBtn} ${base.actionBtnDeny}`} onClick={() => void recusar(w)} disabled={ocupadoAqui || motivo.trim().length < 3}>
                        {ocupadoAqui ? 'Recusando…' : 'Confirmar recusa'}
                      </button>
                      <button type="button" className={base.actionBtn} onClick={() => setPainel(null)} disabled={ocupadoAqui}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {aberto === 'enviar' && (
                  <div className={styles.painel}>
                    <input type="email" className={styles.campo} value={para} onChange={(e) => setPara(e.target.value)} aria-label="E-mail do cliente" />
                    <p className={styles.nota}>Se mudar o e-mail aqui, o cadastro da garantia passa a usar o novo.</p>
                    <div className={styles.painelAcoes}>
                      <button type="button" className={`${base.actionBtn} ${base.actionBtnApprove}`} onClick={() => void enviar(w)} disabled={ocupadoAqui}>
                        {ocupadoAqui ? 'Enviando…' : 'Enviar certificado'}
                      </button>
                      <button type="button" className={base.actionBtn} onClick={() => setPainel(null)} disabled={ocupadoAqui}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {!aberto && (
                  <div className={styles.acoes}>
                    {w.status === 'pendente' && (
                      <>
                        <button type="button" className={`${base.actionBtn} ${base.actionBtnApprove}`} onClick={() => abrir(w, 'aprovar')}>
                          Aprovar
                        </button>
                        <button type="button" className={`${base.actionBtn} ${base.actionBtnDeny}`} onClick={() => abrir(w, 'recusar')}>
                          Recusar
                        </button>
                      </>
                    )}
                    {w.status === 'recusada' && (
                      <button type="button" className={`${base.actionBtn} ${base.actionBtnApprove}`} onClick={() => abrir(w, 'aprovar')}>
                        Aprovar mesmo assim
                      </button>
                    )}
                    {w.status === 'aprovada' && (
                      <>
                        <button
                          type="button"
                          className={`${base.actionBtn} ${base.actionBtnApprove}`}
                          onClick={() => abrir(w, 'enviar')}
                          disabled={!config?.email}
                          title={config?.email ? undefined : 'E-mail do site ainda não configurado'}
                        >
                          {w.certificado_enviado_em ? 'Reenviar certificado' : 'Enviar certificado por e-mail'}
                        </button>
                        <a className={base.actionBtn} href={`/validar-garantia?id=${encodeURIComponent(w.codigo_autenticacao)}`} target="_blank" rel="noopener noreferrer">
                          Ver certificado ↗
                        </a>
                        <button type="button" className={base.actionBtn} onClick={() => void copiarLink(w)}>
                          Copiar link
                        </button>
                        {whats && (
                          <a className={base.actionBtn} href={whats} target="_blank" rel="noopener noreferrer">
                            WhatsApp
                          </a>
                        )}
                        <button type="button" className={base.actionBtn} onClick={() => void baixarPdf(w)}>
                          PDF
                        </button>
                      </>
                    )}
                    {endereco && (
                      <button type="button" className={base.actionBtn} onClick={() => etiqueta(w)}>
                        Etiqueta
                      </button>
                    )}
                    <button type="button" className={`${base.actionBtn} ${styles.excluir}`} onClick={() => void excluir(w)}>
                      Excluir
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ PDF
// O certificado em PDF e a etiqueta de envio, IGUAIS ao Admin anterior
// (restaurados de 7410907 a pedido do João — o layout de impressão não muda
// sem autorização dele). Diferenças, só as obrigatórias: campos que agora podem
// vir nulos e a data da aplicação, que passava por new Date() e saía um dia
// antes no Brasil.

async function baixarPdf(warranty: Warranty) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background
  doc.setFillColor(15, 15, 17); // tactical dark
  doc.rect(0, 0, 297, 210, 'F');

  // Inner Border
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 277, 190);
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('CERTIFICADO OFICIAL DE GARANTIA', 20, 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 180);
  doc.text('NZ DISTRIBUIDORA E IMPORTADORA LTDA | SISTEMA DE AUTENTICAÇÃO E RASTREABILIDADE', 20, 38);

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);
  doc.line(20, 48, 277, 48);

  // Grid details
  const drawLabelValue = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(label, x, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    // Limit length or generic text wrap if needed, but these are short
    doc.text(value, x, y + 7);
  };

  // ROW 1: PROPRIETÁRIO (DESTAQUE MÁXIMO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('PROPRIETÁRIO DO VEÍCULO', 20, 65);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(212, 175, 55); // Destaque Ouro NZ
  doc.text(warranty.cliente_nome_completo ? warranty.cliente_nome_completo.toUpperCase() : 'NÃO INFORMADO', 20, 73);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`DOCUMENTO REGISTRADO: ${warranty.cliente_cpf}`, 20, 79);

  // ROW 2: INFO VEÍCULO E PRODUTO
  drawLabelValue('VEÍCULO (MODELO)', warranty.veiculo_modelo.toUpperCase(), 20, 95);
  drawLabelValue('PLACA / CHASSI', warranty.veiculo_placa_chassi.toUpperCase(), 110, 95);
  drawLabelValue('PRODUTO / LINHA', (warranty.produto_nome || warranty.linha_escolhida || '').toUpperCase(), 180, 95);
  
  // ROW 3: INSTALADOR E SERVICO
  drawLabelValue('ESTÚDIO APLICADOR OFICIAL', warranty.aplicador_nome.toUpperCase(), 20, 115);
  drawLabelValue('DATA DE APLICAÇÃO', formatarDataISO(warranty.data_aplicacao), 180, 115);

  let servicoText = (warranty.tipo_servico ?? '').toUpperCase();
  if ((warranty.tipo_servico ?? '').toUpperCase() === 'PARCIAL' && warranty.areas_protegidas && warranty.areas_protegidas.length > 0) {
    servicoText += ` (${warranty.areas_protegidas.join(', ')})`.toUpperCase();
  }
  
  let servicoFontSize = 14;
  if (servicoText.length > 30) servicoFontSize = 10;
  if (servicoText.length > 50) servicoFontSize = 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('TIPO DE SERVIÇO / COBERTURA', 110, 115);
  doc.setFontSize(servicoFontSize);
  doc.setTextColor(255, 255, 255);
  const splitServico = doc.splitTextToSize(servicoText, 65);
  doc.text(splitServico, 110, 122);

  // Dynamic Warranty Terms Text
  const termsTitle = 'TERMOS DE COBERTURA OFICIAL';
  
  const garAnos = warranty.garantia_anos || 0;
  const durAnos = warranty.durabilidade_anos || 0;
  
  let termsText = '';

  if ((warranty.linha_escolhida ?? '').toUpperCase() === 'NZWRAP') {
    termsText = `Garantia oficial NZWrap contra defeitos de fabricação. Cobertura válida por ${garAnos || 3} ANOS a partir da data de aplicação, sujeita às avaliações técnicas e manutenções preventivas corretas. Expectativa de durabilidade: ${durAnos || 5} ANOS.`;
  } else {
    termsText = `Garantia Autêntica NZPPF: ${garAnos} ANOS de cobertura oficial contra amarelamento precoce, delaminação e rachaduras estruturais sob condições normais de uso. Expectativa de Vida Útil e Durabilidade: ${durAnos} ANOS, desde que preservadas as manutenções trimestrais exigidas e excluindo polimentos agressivos.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(termsTitle, 20, 142);
  
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(termsText, 20, 148, { maxWidth: 250, lineHeightFactor: 1.5 });

  // Auth box
  doc.setFillColor(25, 25, 28);
  doc.rect(20, 160, 257, 30, 'F');
  doc.setDrawColor(50, 50, 50);
  doc.rect(20, 160, 257, 30);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('HASH DE ATIVAÇÃO / CÓDIGO DE SEGURANÇA ÚNICO:', 25, 170);
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55); // Gold highlight
  doc.text(warranty.codigo_autenticacao, 25, 182);

  try {
    const validationUrl = `${window.location.origin}/validar-garantia?id=${warranty.codigo_autenticacao}`;
    const qrDataUrl = await QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'H',
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    doc.addImage(qrDataUrl, 'PNG', 236, 161, 28, 28);
  } catch (qrErr) {
    console.error("Erro ao gerar QR Code:", qrErr);
  }

  try {
    const logoUrl = (warranty.linha_escolhida ?? '').toUpperCase() === 'NZWRAP' 
      ? '/assets/simbolos/LOGO-NZWRAP-BRANCO.svg' 
      : '/assets/simbolos/LOGO-NZPPF-BRANCO.svg';

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    await new Promise<void>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          // Posiciona a logo no lado superior direito, grande.
          // A largura total da border é 287mm. x=230, y=10.
          doc.addImage(dataUrl, 'PNG', 230, 8, 52, 52);
        }
        resolve();
      };
      img.onerror = () => resolve(); // resolve silently to not break download
      img.src = logoUrl;
    });
  } catch(e) {
    console.error('Falha ao carregar a logo para o PDF', e);
  }

  doc.save(`Certificado_NZ_${warranty.codigo_autenticacao}.pdf`);
  return doc.output('blob');
}

function etiqueta(warranty: Warranty) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' 
  });

  // Outer Box for cutting (100x150 mm Thermal Label Ratio)
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 100, 150);

  // Header - Remetente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('REMETENTE (SENDER)', 10, 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('NZ DISTRIBUIDORA DE ADESIVOS LTDA', 10, 21);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('RUA FELIX ALVINO DA SILVA - 65', 10, 26);
  doc.text('VILA DO CONDE - BARUERI - SP', 10, 31);
  doc.text('CEP: 06445-140', 10, 36);

  doc.line(5, 42, 105, 42); // Line separator

  // Body - Destinatario
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('DESTINATÁRIO (RECEIVER)', 10, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const nomeDest = doc.splitTextToSize(warranty.cliente_nome_completo?.toUpperCase() || 'N/A', 90);
  doc.text(nomeDest, 10, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let startY = 56 + (nomeDest.length * 6);
  
  const enderecoFormatado = `${warranty.cliente_endereco || ''}, ${warranty.cliente_numero || ''} ${warranty.cliente_complemento ? '- ' + warranty.cliente_complemento : ''}`;
  const endArr = doc.splitTextToSize(enderecoFormatado.toUpperCase(), 90);
  doc.text(endArr, 10, startY);
  startY += (endArr.length * 5);

  doc.text(`BAIRRO: ${warranty.cliente_bairro?.toUpperCase() || 'N/A'}`, 10, startY);
  startY += 6;
  doc.text(`${warranty.cliente_cidade?.toUpperCase()} - ${warranty.cliente_estado?.toUpperCase()}`, 10, startY);
  startY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`CEP: ${warranty.cliente_cep || 'N/A'}`, 10, startY + 4);

  if (warranty.cliente_telefone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`TEL: ${warranty.cliente_telefone}`, 10, startY + 14);
  }

  doc.save(`Etiqueta_Envio_NZ_${warranty.codigo_autenticacao}.pdf`);
}
