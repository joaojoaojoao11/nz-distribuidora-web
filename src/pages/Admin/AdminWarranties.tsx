// Admin → Garantias: a fila de aprovação.
//
// Desde 17/10/2026 o registro de garantia é um PROTOCOLO: nasce pendente e só
// vale depois que alguém daqui aprova. Aprovar pode já mandar o certificado
// por e-mail (/api/nz/garantia, Resend); depois dá para reenviar, inclusive
// para um e-mail corrigido. Recusar pede o motivo.
//
// O certificado oficial em PDF é o MESMO arquivo de sempre (certificadoPdf.ts,
// código congelado do Admin antigo). Como o antigo "GERAR", aprovar gera e
// baixa o PDF no computador de quem aprovou; "Baixar certificado" gera de novo.
//
// Enviar por e-mail manda ESSE arquivo em anexo. Ele tem ~4,8 MB — mais do que
// a Vercel aceita no corpo de uma requisição — então o navegador do admin o
// guarda no bucket PRIVADO `certificados` e o servidor anexa de lá.

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { gerarCertificadoPdf, gerarEtiquetaEnvio, type CertificadoPdf } from './certificadoPdf';
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
  /** Selo NZPPF do batente que veio no registro (8 caracteres, sem hífen). */
  selo_codigo: string | null;
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
        [w.protocolo, w.veiculo_placa_chassi, w.veiculo_modelo, w.cliente_nome_completo, w.cliente_cpf, w.cliente_email, w.aplicador_nome, w.produto_nome, w.selo_codigo ?? ''].join(' ')
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

  const executar = async (w: Warranty, corpo: Record<string, unknown>, sucesso: (r: RespostaAcao) => string): Promise<RespostaAcao | null> => {
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
      return r;
    } catch (e) {
      setRetorno({ id: w.id, ok: false, texto: textoErro(e) });
      return null;
    } finally {
      setOcupado(null);
    }
  };

  // Gera o PDF oficial (também baixa uma cópia, como sempre) e o guarda para o
  // servidor anexar ao e-mail.
  const prepararAnexo = async (w: Warranty) => {
    const blob = await baixarPdf(w);
    const { error } = await supabase.storage
      .from('certificados')
      .upload(`${w.codigo_autenticacao}.pdf`, blob, { upsert: true, contentType: 'application/pdf' });
    if (error) throw new GarantiaAdminError('pdf-upload');
  };

  const enviarComAnexo = async (w: Warranty, sucessoAprovacao = '') => {
    setOcupado(w.id);
    try {
      await prepararAnexo(w);
    } catch (e) {
      setRetorno({ id: w.id, ok: false, texto: `${sucessoAprovacao}${textoErro(e)}` });
      setOcupado(null);
      return;
    }
    await executar(w, { op: 'enviar', para }, (r) => (r.envio?.ok ? `${sucessoAprovacao}Certificado enviado para ${r.envio.para}, com o PDF em anexo.` : sucessoAprovacao));
  };

  const aprovar = async (w: Warranty) => {
    const mandar = enviarJunto && Boolean(config?.email);
    const r = await executar(w, { op: 'aprovar', enviar: false }, () => 'Garantia aprovada. O PDF do certificado foi baixado.');
    if (r?.garantia?.status !== 'aprovada') return;
    // Como o "GERAR" antigo: aprovou, o certificado oficial sai em PDF na hora.
    if (mandar) await enviarComAnexo(r.garantia, 'Aprovada. ');
    else await baixarPdf(r.garantia);
  };
  const recusar = (w: Warranty) => executar(w, { op: 'recusar', motivo }, () => 'Garantia recusada.');
  const enviar = (w: Warranty) => enviarComAnexo(w);

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
                  {w.selo_codigo && (
                    <div>
                      <dt>Selo do batente</dt>
                      <dd>
                        <a href={`/s/${w.selo_codigo}`} target="_blank" rel="noopener noreferrer">
                          {w.selo_codigo.slice(0, 4)}-{w.selo_codigo.slice(4)}
                        </a>
                      </dd>
                    </div>
                  )}
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
                          ⬇ Baixar certificado
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

// A linha do banco vai como veio, igual o Admin antigo passava — o gerador é
// o mesmo, então o arquivo sai o mesmo.
function baixarPdf(w: Warranty): Promise<Blob> {
  return gerarCertificadoPdf(w as unknown as CertificadoPdf);
}

function etiqueta(w: Warranty) {
  gerarEtiquetaEnvio(w as unknown as CertificadoPdf);
}
