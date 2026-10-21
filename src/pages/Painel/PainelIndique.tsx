// /painel/indique — "Indique e ganhe" (Fase 2 do plano de indicação, 21/10/2026).
//
// De cima para baixo (§11.6 do plano): comemoração (uma vez por evento), o
// nível com a barra, o saldo, o super cupom com o botão de compartilhar, a
// parte de afiliado (saldo, periodicidade, contagens — nunca a base de vendas
// dos indicados, D26), os momentos, as conquistas e o extrato.
//
// Tudo vem de uma chamada só (op minha-carteira), calculada no servidor. O
// indicado aparece como "indicado nº N", nunca pelo nome. Animação respeita
// "reduzir movimento" e nada depende de hover.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BRL } from '../../lib/shop/precos';
import { IncentivoError, marcarMomentosVistos, minhaCarteira, mudarMinhaPeriodicidade, PIX_TIPO_LABEL, PIX_TIPOS_LISTA, quererSerAfiliado, salvarPix, solicitarSaque, STATUS_MOVIMENTO, STATUS_SAQUE, textoDoMomento, trocarSuperCupom, type MinhaCarteira, type PixTipo } from '../../lib/shop/incentivos';
import styles from './Painel.module.css';

const dia = (s: string | null) => (s ? (s.length === 10 ? s.split('-').reverse().join('/') : new Date(s).toLocaleDateString('pt-BR')) : '');

function usaReducaoDeMovimento(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Número que sobe até o valor (ou fica parado com "reduzir movimento"). */
function Contador({ ate, reduzido }: { ate: number; reduzido: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    // "Reduzir movimento": sem animação, o valor final vai direto na tela.
    if (reduzido) return;
    const inicio = performance.now();
    const dur = 1200;
    let raf = 0;
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / dur);
      setV(ate * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ate, reduzido]);
  return <span>{BRL.format(reduzido ? ate : v)}</span>;
}

export default function PainelIndique() {
  const { user } = useAuth();
  const [dados, setDados] = useState<MinhaCarteira | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [trocando, setTrocando] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mostrarComemoracao, setMostrarComemoracao] = useState(false);
  const reduzido = useMemo(usaReducaoDeMovimento, []);
  const comemorou = useRef(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    try {
      const d = await minhaCarteira();
      setDados(d);
      setErro('');
      if (!comemorou.current && d.gamificacao.naoVistos > 0) {
        comemorou.current = true;
        setMostrarComemoracao(true);
      }
    } catch (e) {
      setErro(e instanceof IncentivoError ? (e.codigo === 'login-necessario' ? 'Entre de novo para ver sua carteira.' : e.message) : 'Não consegui carregar agora. Atualize a página em instantes.');
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const copiar = async (texto: string, chave: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado((c) => (c === chave ? null : c)), 1800);
    } catch {
      /* área de transferência bloqueada: o texto continua selecionável */
    }
  };

  const fecharComemoracao = async () => {
    setMostrarComemoracao(false);
    try {
      await marcarMomentosVistos();
    } catch {
      /* se não marcou, mostra de novo na próxima; melhor do que esconder para sempre */
    }
  };

  const trocar = async () => {
    const c = novoCodigo.trim().toUpperCase();
    if (!c) return;
    setTrocando(true);
    setErro('');
    setMsg('');
    try {
      const r = await trocarSuperCupom(c);
      if (!r.ok) setErro(r.motivo ?? 'Não deu para trocar.');
      else {
        setMsg(`Seu super cupom agora é ${c}.`);
        setNovoCodigo('');
        await carregar();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setTrocando(false);
    }
  };

  const pedirAfiliacao = async () => {
    if (!aceite) {
      setErro('Para pedir, marque que leu as regras do programa de afiliados.');
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await quererSerAfiliado(true);
      setMsg('Pedido enviado. A NZ confere e libera; você recebe o aviso aqui.');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  };

  const mudarPeriodo = async (p: 'mensal' | 'quinzenal') => {
    setOcupado(true);
    try {
      await mudarMinhaPeriodicidade(p);
      await carregar();
      setMsg(`Sua recorrência agora fecha por ${p === 'mensal' ? 'mês' : 'quinzena'}.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  };

  if (carregando) return <p className={styles.mudo}>Carregando…</p>;
  if (!dados) return <p className={styles.mudo}>{erro || 'Não consegui carregar agora.'}</p>;

  const { saldo, superCupom, afiliado, contagens, gamificacao, regras } = dados;
  const nivel = gamificacao.nivel;
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://www.nzgroup.com.br';
  const linkCupom = superCupom ? `${origem}/cadastro?ref=${encodeURIComponent(superCupom.codigo)}` : '';
  const mensagemZap = superCupom
    ? `Oi! Uso a NZ para película e envelopamento. Cadastre-se com meu super cupom ${superCupom.codigo} e ganhe ${superCupom.descontoPct}% na primeira compra: ${linkCupom}`
    : '';
  const naoVistos = gamificacao.momentos.filter((m) => !m.visto_em);
  const liberadoRecente = naoVistos.filter((m) => m.tipo === 'cashback_liberado' || m.tipo === 'indicado_comprou').reduce((s, m) => s + Number(m.payload?.valor ?? 0), 0);
  const conquistasNovas = gamificacao.conquistas.filter((c) => c.obtida_em && !c.vista_em);

  return (
    <>
      {mostrarComemoracao && (
        <div className={styles.comemoracao} role="dialog" aria-label="Novidades na sua carteira">
          <div className={styles.comemoracaoCaixa}>
            {!reduzido && (
              <div className={styles.confete} aria-hidden="true">
                {Array.from({ length: 18 }).map((_, i) => (
                  <i key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * 0.12}s` }} />
                ))}
              </div>
            )}
            <h2 className={styles.subtitulo}>Tem novidade por aqui</h2>
            {liberadoRecente > 0 && (
              <p className={styles.saldoGrande}>
                <Contador ate={liberadoRecente} reduzido={reduzido} />
                <small>a caminho da sua carteira</small>
              </p>
            )}
            <ul className={styles.momentos}>
              {naoVistos.slice(0, 5).map((m) => (
                <li key={m.id} className={styles.momento}>
                  <span>{textoDoMomento(m)}</span>
                  <small>{dia(m.criado_em)}</small>
                </li>
              ))}
            </ul>
            {conquistasNovas.length > 0 && (
              <div className={styles.conquistas}>
                {conquistasNovas.map((c) => (
                  <div key={c.codigo} className={styles.conquista}>
                    <span className={styles.conquistaIcone}>{c.icone ?? '🏅'}</span>
                    <strong>{c.nome}</strong>
                    <small>{c.descricao}</small>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className={styles.botaoPrincipal} onClick={() => void fecharComemoracao()}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {erro && <p className={styles.erro}>{erro}</p>}
      {msg && <p className={styles.ok}>{msg}</p>}

      {/* ------------------------------------------------------------- nível */}
      <section className={styles.nivelCartao}>
        <div className={styles.nivelTopo}>
          <span className={styles.nivelIcone} aria-hidden="true">
            {nivel.atual?.icone ?? '🏁'}
          </span>
          <div>
            <span className={styles.rotulo}>Seu nível</span>
            <strong className={styles.nivelNome}>{nivel.atual?.nome ?? 'Largada'}</strong>
            <small className={styles.mudo}>
              {nivel.publico === 'afiliado' ? `${BRL.format(nivel.metrica)} gerados nos últimos 12 meses` : `${nivel.metrica} indicado${nivel.metrica === 1 ? '' : 's'} que compraram nos últimos 12 meses`}
              {nivel.multiplicador > 1 ? ` · seu cashback vale ${nivel.multiplicador.toString().replace('.', ',')}×` : ''}
            </small>
          </div>
        </div>
        <div className={styles.nivelBarra} role="progressbar" aria-valuenow={nivel.progressoPct} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.nivelBarraFill} style={{ width: `${nivel.progressoPct}%` }} />
        </div>
        <p className={styles.mudo}>
          {nivel.proximo
            ? `${nivel.progressoPct}% até ${nivel.proximo.nome}${nivel.proximo.icone ? ` ${nivel.proximo.icone}` : ''} — ${
                nivel.publico === 'afiliado' ? `faltam ${BRL.format(nivel.faltam)}` : `falta${nivel.faltam === 1 ? '' : 'm'} ${nivel.faltam} indicado${nivel.faltam === 1 ? '' : 's'} comprando`
              }${nivel.progressoPct >= 80 ? ' · falta pouco!' : ''}`
            : 'Você está no último nível. Campeão de verdade.'}
        </p>
      </section>

      {/* ------------------------------------------------------------- saldo */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Sua carteira</h2>
        <div className={styles.saldoLinha}>
          <div>
            <span className={styles.rotulo}>Disponível</span>
            <strong className={styles.saldoValor}>{BRL.format(saldo.disponivel)}</strong>
          </div>
          <div>
            <span className={styles.rotulo}>A liberar</span>
            <strong className={styles.saldoValor}>{BRL.format(saldo.aLiberar)}</strong>
            <small className={styles.mudo}>libera {regras.diasLiberacao} dias depois do faturamento</small>
          </div>
        </div>
        <p className={styles.mudo}>
          O saldo vale por {regras.mesesValidade} meses. Use no checkout ("Usar meu saldo") ou saque por Pix logo abaixo.
        </p>
      </section>

      {/* ------------------------------------------------------- saque Pix */}
      <BlocoSaque dados={dados} onMudou={carregar} />

      {/* ------------------------------------------------------- super cupom */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Seu super cupom</h2>
        {!superCupom ? (
          <p className={styles.mudo}>
            {dados.aprovado ? 'O super cupom está desligado no momento.' : 'Seu super cupom nasce assim que a NZ aprovar o seu cadastro.'}
          </p>
        ) : (
          <>
            <div className={styles.cupomGrande}>
              <code>{superCupom.codigo}</code>
              <div className={styles.cupomAcoes}>
                <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(superCupom.codigo, 'codigo')}>
                  {copiado === 'codigo' ? 'Copiado' : 'Copiar código'}
                </button>
                <a className={styles.botaoPrincipal} href={`https://wa.me/?text=${encodeURIComponent(mensagemZap)}`} target="_blank" rel="noreferrer">
                  Compartilhar no WhatsApp
                </a>
                <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(linkCupom, 'link')}>
                  {copiado === 'link' ? 'Copiado' : 'Copiar link'}
                </button>
              </div>
            </div>
            <ol className={styles.passos}>
              <li>
                <strong>Você compartilha</strong> o código ou o link.
              </li>
              <li>
                <strong>Quem é novo na NZ</strong> usa o cupom na primeira compra e ganha {superCupom.descontoPct}% de desconto.
              </li>
              <li>
                <strong>Você ganha</strong> {superCupom.cashbackPct}% dessa compra na sua carteira, liberado {regras.diasLiberacao} dias depois do faturamento. Vale uma compra por pessoa indicada.
              </li>
            </ol>
            <div className={styles.form} style={{ marginTop: '0.75rem' }}>
              <label className={styles.campo}>
                <span>Quer outro código? (4 a 12 letras ou números)</span>
                <input value={novoCodigo} onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())} placeholder={superCupom.codigo} />
              </label>
              <div className={styles.acoesBloco}>
                <button type="button" className={styles.salvar} disabled={trocando || !novoCodigo.trim()} onClick={() => void trocar()}>
                  {trocando ? 'Trocando…' : 'Trocar código'}
                </button>
              </div>
            </div>
            <p className={styles.mudo}>
              {contagens.usaramSuperCupom} pessoa{contagens.usaramSuperCupom === 1 ? '' : 's'} já comprou com o seu cupom.
            </p>
          </>
        )}
      </section>

      {/* ----------------------------------------------------------- afiliado */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Programa de afiliados</h2>
        {!afiliado ? (
          <>
            <p className={styles.mudo}>
              Afiliado é o parceiro da NZ (instalador, influenciador, representante). Ele tem um cupom permanente: quem se cadastra com ele fica ligado a ele, e ele ganha comissão na primeira compra
              e em todas as compras seguintes, fechada por mês ou quinzena. A NZ aprova cada afiliado.
            </p>
            <label className={styles.campo} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <span>Li as regras: a NZ aprova, pode suspender, e a comissão passa pela regra de margem da loja.</span>
            </label>
            <div className={styles.acoesBloco}>
              <button type="button" className={styles.salvar} disabled={ocupado || !dados.aprovado} onClick={() => void pedirAfiliacao()}>
                {dados.aprovado ? 'Quero ser afiliado' : 'Disponível depois da aprovação do cadastro'}
              </button>
            </div>
          </>
        ) : afiliado.status === 'pendente' ? (
          <p className={styles.mudo}>Seu pedido de afiliação está com a NZ. Assim que for aprovado, seu cupom {afiliado.codigo} passa a valer e você vê tudo aqui.</p>
        ) : afiliado.status === 'suspenso' ? (
          <p className={styles.mudo}>Sua afiliação está suspensa. Fale com a NZ pelo WhatsApp para entender o motivo.</p>
        ) : (
          <>
            <div className={styles.cupomGrande}>
              <code>{afiliado.codigo}</code>
              <div className={styles.cupomAcoes}>
                <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(afiliado.codigo, 'af')}>
                  {copiado === 'af' ? 'Copiado' : 'Copiar cupom'}
                </button>
                <button type="button" className={styles.botaoSecundario} onClick={() => void copiar(`${origem}/cadastro?ref=${afiliado.codigo}`, 'aflink')}>
                  {copiado === 'aflink' ? 'Copiado' : 'Copiar link de cadastro'}
                </button>
              </div>
            </div>
            <p className={styles.mudo}>
              Quem se cadastra com o seu cupom fica ligado a você. Ativação: <strong>{afiliado.pctAtivacao}%</strong> da primeira compra. Recorrência: <strong>{afiliado.pctRecorrencia}%</strong> das
              compras seguintes, fechada por {afiliado.periodicidade === 'quinzenal' ? 'quinzena' : 'mês'}.
              {afiliado.descontoCupomPct > 0 ? ` Seu cupom dá ${afiliado.descontoCupomPct}% de desconto a quem usa.` : ''}
            </p>
            <div className={styles.saldoLinha}>
              <div>
                <span className={styles.rotulo}>Cadastrados</span>
                <strong className={styles.saldoValor}>{contagens.cadastrados}</strong>
              </div>
              <div>
                <span className={styles.rotulo}>Aprovados</span>
                <strong className={styles.saldoValor}>{contagens.aprovados}</strong>
              </div>
              <div>
                <span className={styles.rotulo}>Compraram</span>
                <strong className={styles.saldoValor}>{contagens.compraram}</strong>
              </div>
            </div>
            <label className={styles.campo}>
              <span>Fechamento da recorrência</span>
              <select value={afiliado.periodicidade} disabled={ocupado} onChange={(e) => void mudarPeriodo(e.target.value as 'mensal' | 'quinzenal')}>
                <option value="mensal">por mês</option>
                <option value="quinzenal">por quinzena</option>
              </select>
            </label>
            <p className={styles.mudo}>Por privacidade, você vê números e o seu saldo; os dados de quem você indicou ficam com a NZ.</p>
          </>
        )}
      </section>

      {/* ----------------------------------------------------------- momentos */}
      {gamificacao.momentos.length > 0 && (
        <section className={styles.bloco}>
          <h2 className={styles.subtitulo}>Momentos</h2>
          <ul className={styles.momentos}>
            {gamificacao.momentos.slice(0, 12).map((m) => (
              <li key={m.id} className={styles.momento}>
                <span>{textoDoMomento(m)}</span>
                <small>{dia(m.criado_em)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --------------------------------------------------------- conquistas */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Conquistas</h2>
        <div className={styles.conquistas}>
          {gamificacao.conquistas.map((c) => (
            <div key={c.codigo} className={`${styles.conquista} ${c.obtida_em ? '' : styles.conquistaBloqueada}`} title={c.obtida_em ? `Conquistada em ${dia(c.obtida_em)}` : 'Ainda não'}>
              <span className={styles.conquistaIcone} aria-hidden="true">
                {c.icone ?? '🏅'}
              </span>
              <strong>{c.nome}</strong>
              <small>{c.descricao}</small>
              {c.bonus_valor > 0 && <small className={styles.conquistaBonus}>{c.obtida_em ? 'bônus recebido' : `+${BRL.format(c.bonus_valor)} na carteira`}</small>}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ extrato */}
      <section className={styles.bloco}>
        <h2 className={styles.subtitulo}>Extrato</h2>
        {dados.extrato.length === 0 ? (
          <p className={styles.mudo}>
            Nada ainda. O primeiro crédito entra quando uma compra com o seu cupom é faturada. Enquanto isso, <Link to="/painel/avaliacoes">avalie o que já comprou</Link> e junte pontos.
          </p>
        ) : (
          <ul className={styles.cartoes}>
            {dados.extrato.map((m) => (
              <li key={m.id} className={styles.linhaExtrato}>
                <span className={styles.extratoQuando}>{dia(m.criado_em)}</span>
                <span className={styles.extratoQue}>
                  {m.rotulo}
                  {m.indicado ? ` · ${m.indicado}` : ''}
                  {m.periodo ? ` · ${m.periodo}` : ''}
                  {m.status !== 'disponivel' ? ` · ${STATUS_MOVIMENTO[m.status] ?? m.status}${m.status === 'a_liberar' && m.libera_em ? ` em ${dia(m.libera_em)}` : ''}` : ''}
                  {m.obs ? ` · ${m.obs}` : ''}
                </span>
                <span className={`${styles.extratoPontos} ${m.valor > 0 ? styles.extratoMais : styles.extratoMenos}`}>
                  {m.valor > 0 ? '+' : ''}
                  {BRL.format(m.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// ================================================================= saque Pix
//
// Fase 4 (mínima, 21/10/2026): o cliente cadastra a chave Pix e pede o saque.
// O pedido vira um título no Contas a Pagar do NZERP; o financeiro paga e o
// site mostra "pago". Título cancelado devolve o valor à carteira.
const MOTIVO_SAQUE: Record<string, string> = {
  'pix-nao-cadastrado': 'Cadastre a chave Pix antes de sacar.',
  'abaixo-do-minimo': 'O valor está abaixo do mínimo.',
  'saldo-insuficiente': 'Você não tem esse valor disponível.',
  'valor-invalido': 'Informe o valor do saque.',
  'aguardando-aprovacao': 'Seu cadastro ainda está em análise.',
};

function BlocoSaque({ dados, onMudou }: { dados: MinhaCarteira; onMudou: () => Promise<void> }) {
  const { regras, saldo, pix, saques } = dados;
  const [tipo, setTipo] = useState<PixTipo>(pix?.tipo ?? 'cpf_cnpj');
  const [chave, setChave] = useState(pix?.chave ?? '');
  const [editandoPix, setEditandoPix] = useState(!pix);
  const [valor, setValor] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const podeSacar = Boolean(pix) && saldo.disponivel >= regras.saqueMinimo;

  const salvarChave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    setMsg('');
    try {
      const r = await salvarPix(tipo, chave);
      if (!r.ok) setErro(r.motivo ?? 'Chave inválida.');
      else {
        setMsg('Chave Pix salva.');
        setEditandoPix(false);
        await onMudou();
      }
    } catch (err) {
      setErro(err instanceof IncentivoError ? err.message : err instanceof Error ? err.message : String(err));
    } finally {
      setOcupado(false);
    }
  };

  const pedir = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const v = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) {
      setErro('Informe o valor do saque.');
      return;
    }
    if (!window.confirm(`Pedir saque de ${BRL.format(v)} para a chave Pix ${pix?.chave}?`)) return;
    setOcupado(true);
    setErro('');
    setMsg('');
    try {
      const r = await solicitarSaque(v);
      if (!r.ok) setErro(MOTIVO_SAQUE[r.motivo ?? ''] ?? 'Não deu para pedir o saque agora.');
      else {
        setMsg(`Saque pedido. Pagamento por Pix previsto até ${dia(r.saque?.vencimento ?? null)}.`);
        setValor('');
        await onMudou();
      }
    } catch (err) {
      // A API responde 4xx com `motivo`; o cliente guarda isso em `codigo`.
      const motivo = err instanceof IncentivoError ? err.codigo : '';
      setErro(MOTIVO_SAQUE[motivo] ?? (err instanceof Error ? err.message : String(err)));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className={styles.bloco}>
      <h2 className={styles.subtitulo}>Sacar por Pix</h2>
      <p className={styles.mudo}>
        Mínimo {BRL.format(regras.saqueMinimo)}. Pedido até {regras.saqueHoraCorte} conta como do dia; pagamos em até {regras.saqueDiasVencimento} dia(s) útil(eis). Pedindo agora, o Pix sai até{' '}
        {dia(regras.vencimentoSeSacarAgora)}.
      </p>

      {editandoPix || !pix ? (
        <form className={styles.form} onSubmit={salvarChave}>
          <label className={styles.campo}>
            <span>Tipo da chave Pix</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as PixTipo)} disabled={ocupado}>
              {PIX_TIPOS_LISTA.map((t) => (
                <option key={t} value={t}>
                  {PIX_TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            <span>Chave Pix (a conta precisa ser sua)</span>
            <input value={chave} onChange={(e) => setChave(e.target.value)} placeholder={tipo === 'cpf_cnpj' ? 'só números' : tipo === 'email' ? 'voce@exemplo.com' : tipo === 'telefone' ? '(11) 99999-9999' : 'chave aleatória'} disabled={ocupado} />
          </label>
          <div className={styles.acoesBloco}>
            <button type="submit" className={styles.salvar} disabled={ocupado || !chave.trim()}>
              Salvar chave
            </button>
            {pix && (
              <button type="button" className={styles.botaoSecundario} onClick={() => setEditandoPix(false)} disabled={ocupado}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className={styles.ok}>
          Chave Pix: {PIX_TIPO_LABEL[pix.tipo]} · {pix.chave}{' '}
          <button type="button" className={styles.botaoSecundario} onClick={() => setEditandoPix(true)} disabled={ocupado}>
            Trocar
          </button>
        </p>
      )}

      <form className={styles.form} onSubmit={pedir}>
        <label className={styles.campo}>
          <span>Valor do saque (disponível {BRL.format(saldo.disponivel)})</span>
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={`mínimo ${BRL.format(regras.saqueMinimo)}`} disabled={!podeSacar || ocupado} />
        </label>
        <div className={styles.acoesBloco}>
          <button type="submit" className={styles.botaoPrincipal} disabled={!podeSacar || ocupado || !valor.trim()}>
            {ocupado ? 'Enviando…' : 'Pedir saque'}
          </button>
        </div>
        {!pix && <p className={styles.mudo}>Cadastre a chave Pix para sacar.</p>}
        {pix && saldo.disponivel < regras.saqueMinimo && <p className={styles.mudo}>Você ainda não tem o mínimo disponível para sacar.</p>}
      </form>
      {erro && <p className={styles.erro}>{erro}</p>}
      {msg && <p className={styles.ok}>{msg}</p>}

      {saques.length > 0 && (
        <ul className={styles.cartoes}>
          {saques.map((s) => (
            <li key={s.id} className={styles.linhaExtrato}>
              <span className={styles.extratoQuando}>{dia(s.criado_em)}</span>
              <span className={styles.extratoQue}>
                Saque · {STATUS_SAQUE[s.status]}
                {(s.status === 'enviado' || s.status === 'solicitado') && s.vencimento ? ` · previsto até ${dia(s.vencimento)}` : ''}
                {s.status === 'pago' && s.pago_em ? ` · em ${dia(s.pago_em)}` : ''}
                {s.status === 'cancelado' ? ' · valor devolvido à carteira' : ''}
              </span>
              <span className={styles.extratoPontos}>{BRL.format(Number(s.valor))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
