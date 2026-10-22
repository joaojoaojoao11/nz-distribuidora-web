// /registro-garantia — registrar a garantia de uma aplicação NZPPF ou de um
// envelopamento. Desde 17/10/2026 o fim é um PROTOCOLO: o certificado só sai
// depois que alguém do admin aprova, e chega por e-mail (/api/nz/garantia).
//
// Redesenho de 17/10/2026 (plano em FIRECRAL/PLANO_REGISTRO_GARANTIA.md). Uma
// pergunta por tela, na ordem em que a pessoa sabe a resposta: produto →
// onde → veículo → proprietário → revisão. Com as peças da loja: cartões,
// um botão vermelho por tela, barra fixa no rodapé do celular e a prévia do
// certificado montando ao vivo (lateral no computador, folha no celular).
//
// O que mudou por baixo, e por quê:
//   - o passo mora na URL (?passo=): o "voltar" do celular volta um passo em
//     vez de sair do formulário e perder tudo;
//   - o rascunho fica no sessionStorage: recarregar não apaga o que foi digitado;
//   - toda troca de passo sobe a página e põe o foco no título — antes o
//     passo seguinte abria rolado e, no fim, o certificado ficava fora da tela;
//   - quem grava é o servidor (valida de novo, decide os anos, gera o código
//     e avisa a NZ por e-mail); a tabela não aceita mais insert do navegador.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import { useAuth } from '../../contexts/AuthContext';
import Certificado, { type DadosCertificado } from './Certificado';
import PassoProduto from './registro/PassoProduto';
import PassoCobertura from './registro/PassoCobertura';
import PassoVeiculo from './registro/PassoVeiculo';
import PassoProprietario, { type MeusDados } from './registro/PassoProprietario';
import Revisao from './registro/Revisao';
import Protocolo from './registro/Protocolo';
import Cuidados from './registro/Cuidados';
import BarraDoPasso from './registro/BarraDoPasso';
import {
  PASSOS,
  RASCUNHO_VAZIO,
  apagarRascunho,
  ehMovel,
  errosDoPasso,
  garantiaDoRascunho,
  guardarUltimoAplicador,
  hojeISO,
  lerRascunho,
  lerUltimoAplicador,
  linhaPorId,
  primeiroPassoPendente,
  produtoDoRascunho,
  registrarGarantia,
  salvarRascunho,
  type Erros,
  type LinhaGarantia,
  type Passo,
  type Rascunho,
  type TipoServico,
} from '../../lib/garantia';
import { ehEmpresa } from '../../lib/shop/papeis';
import TituloComTutorial from '../../components/Tutorial/TituloComTutorial';
import styles from './registro/Registro.module.css';

const ETAPAS: { passo: Passo; rotulo: string }[] = [
  { passo: 'produto', rotulo: 'Produto' },
  { passo: 'cobertura', rotulo: 'Onde' },
  { passo: 'veiculo', rotulo: 'Veículo' },
  { passo: 'proprietario', rotulo: 'Proprietário' },
];

function textosDoPasso(passo: Passo, movel: boolean): { titulo: string; sub: string } {
  switch (passo) {
    case 'produto':
      return { titulo: 'O que foi aplicado?', sub: 'Escolha a linha do material.' };
    case 'cobertura':
      return { titulo: 'Onde foi aplicado?', sub: 'Carro inteiro, algumas peças ou um móvel.' };
    case 'veiculo':
      return movel
        ? { titulo: 'Item e aplicação', sub: 'O que recebeu a proteção, quando e por quem.' }
        : { titulo: 'Veículo e aplicação', sub: 'O carro que recebeu a proteção, quando e por quem.' };
    case 'proprietario':
      return { titulo: 'Proprietário', sub: 'Os dados de quem é dono. A garantia fica vinculada a este CPF ou CNPJ.' };
    case 'revisao':
      return { titulo: 'Confira antes de enviar', sub: 'É assim que o certificado vai sair depois da aprovação.' };
  }
}

function rascunhoInicial(): Rascunho {
  return lerRascunho() ?? { ...RASCUNHO_VAZIO, data: hojeISO(), aplicador: lerUltimoAplicador() };
}

function previaDe(r: Rascunho): DadosCertificado {
  const linha = linhaPorId(r.linhaId);
  return {
    produto: produtoDoRascunho(r),
    linha: linha?.tipo ?? 'PPF',
    servico: r.servico,
    areas: r.servico === 'Parcial' ? r.areas : [],
    modelo: r.modelo.trim(),
    placa: r.placa.trim(),
    aplicador: r.aplicador.trim(),
    data: r.data,
    garantiaAnos: garantiaDoRascunho(r).anos,
    proprietario: r.nome.trim(),
  };
}

export default function WarrantyRegistration() {
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reduzir = useReducedMotion();

  const [r, setR] = useState<Rascunho>(rascunhoInicial);
  const [tentou, setTentou] = useState<Partial<Record<Passo, boolean>>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [recebido, setRecebido] = useState<{ protocolo: string; criadoEm: string; emailEnviado: boolean; dados: DadosCertificado; email: string } | null>(null);
  // Honeypot: robô preenche todo campo que encontra; gente não vê este.
  const [mel, setMel] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeiraVez = useRef(true);

  // A URL pede um passo; o rascunho diz até onde dá para ir.
  const pedido = (PASSOS as readonly string[]).includes(params.get('passo') ?? '') ? (params.get('passo') as Passo) : 'produto';
  const limite = primeiroPassoPendente(r);
  const passo: Passo = PASSOS.indexOf(pedido) > PASSOS.indexOf(limite) ? limite : pedido;
  const indice = PASSOS.indexOf(passo);
  const linha = linhaPorId(r.linhaId);
  const movel = ehMovel(r);
  const erros: Erros = errosDoPasso(passo, r);
  const mostrar = Boolean(tentou[passo]);
  const previa = previaDe(r);

  // Direção da troca (avançar entra pela direita, voltar pela esquerda) —
  // o padrão do React para "estado derivado do anterior", sem efeito.
  const [ultimoIndice, setUltimoIndice] = useState(indice);
  const [direcao, setDirecao] = useState(1);
  if (indice !== ultimoIndice) {
    setDirecao(indice > ultimoIndice ? 1 : -1);
    setUltimoIndice(indice);
  }

  useEffect(() => {
    salvarRascunho(r);
  }, [r]);

  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus({ preventScroll: true });
  }, [passo, recebido]);

  const mudar = useCallback((patch: Partial<Rascunho>) => setR((x) => ({ ...x, ...patch })), []);

  const ir = (p: Passo, replace = false) =>
    setParams(p === 'produto' ? {} : { passo: p }, { replace, state: { de: passo } });

  const voltar = () => {
    const anterior = PASSOS[indice - 1];
    if (!anterior) return;
    // Se viemos do passo anterior, volta pelo histórico — o "voltar" do
    // navegador e o desta tela andam juntos. Senão (link direto), troca.
    const de = (location.state as { de?: string } | null)?.de;
    if (de === anterior) navigate(-1);
    else ir(anterior, true);
  };

  const focarErro = (e: Erros) => {
    const campo = Object.keys(e)[0];
    if (!campo) return;
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[name="${campo}"]`);
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
    });
  };

  const avancar = () => {
    if (Object.keys(erros).length) {
      setTentou((t) => ({ ...t, [passo]: true }));
      focarErro(erros);
      return;
    }
    ir(PASSOS[indice + 1]);
  };

  // "Próximo" do teclado do celular: Enter num campo vai para o campo
  // seguinte; no último, fecha o teclado e tenta avançar o passo. Sem isso a
  // pessoa tinha de fechar o teclado e tocar no campo seguinte, um a um.
  const teclaNoFormulario = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return;
    const alvo = e.target;
    if (!(alvo instanceof HTMLInputElement) || alvo.type === 'checkbox') return;
    e.preventDefault();
    const campos = [...e.currentTarget.querySelectorAll<HTMLElement>('input:not([type="checkbox"]):not([disabled]), select:not([disabled])')];
    const proximo = campos[campos.indexOf(alvo) + 1];
    if (proximo) {
      proximo.focus();
      return;
    }
    alvo.blur();
    avancar();
  };

  // Escolha única avança sozinha, com um respiro para o toque aparecer.
  const depois = (fn: () => void) => window.setTimeout(fn, reduzir ? 0 : 220);

  const escolherLinha = (l: LinhaGarantia) => {
    const anterior = linhaPorId(r.linhaId);
    const patch: Partial<Rascunho> = { linhaId: l.id };
    if (l.areasFixas) {
      patch.servico = 'Parcial';
      patch.areas = l.areasFixas;
    } else if (anterior?.areasFixas || (l.tipo !== 'PPF' && r.servico === 'Movel/Eletro')) {
      patch.servico = '';
      patch.areas = [];
    }
    if (l.tipo === 'PPF') patch.material = '';
    mudar(patch);
    if (l.tipo === 'PPF') {
      // Faróis e para-brisa: a peça já está dita, pula o "onde".
      depois(() => ir(l.areasFixas ? 'veiculo' : 'cobertura'));
    } else {
      window.requestAnimationFrame(() => {
        const el = document.getElementById('g-material');
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
      });
    }
  };

  const escolherServico = (s: TipoServico) => {
    if (s === 'Parcial') {
      setR((x) => ({ ...x, servico: 'Parcial', areas: x.servico === 'Parcial' ? x.areas : [] }));
      // No celular as peças abrem abaixo da dobra: leva a pessoa até elas.
      if (window.matchMedia('(max-width: 900px)').matches) {
        window.setTimeout(() => document.getElementById('titulo-areas')?.scrollIntoView({ block: 'start', behavior: reduzir ? 'auto' : 'smooth' }), 60);
      }
      return;
    }
    mudar({ servico: s, areas: [] });
    depois(() => ir('veiculo'));
  };

  const enviar = async () => {
    for (const p of PASSOS) {
      if (p === 'revisao') break;
      if (Object.keys(errosDoPasso(p, r)).length) {
        setTentou((t) => ({ ...t, [p]: true }));
        ir(p);
        return;
      }
    }
    setEnviando(true);
    setErroEnvio('');
    try {
      const resposta = await registrarGarantia(r, mel);
      guardarUltimoAplicador(r.aplicador);
      setRecebido({ ...resposta, emailEnviado: resposta.emailCliente, dados: previaDe(r), email: r.email.trim().toLowerCase() });
      apagarRascunho();
      setR({ ...RASCUNHO_VAZIO, data: hojeISO(), aplicador: r.aplicador.trim() });
      setTentou({});
      setParams({}, { replace: true });
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Não conseguimos registrar agora.');
    } finally {
      setEnviando(false);
    }
  };

  const outra = () => {
    setRecebido(null);
    setErroEnvio('');
  };

  // ---------------------------------------------------------- dados da conta
  const meusDados: MeusDados | null = user
    ? { nome: profile?.full_name ?? '', cpf: profile?.cpf_cnpj ?? '', email: profile?.email ?? user.email ?? '', telefone: profile?.phone ?? '' }
    : null;
  const aplicadorDaConta = profile && ehEmpresa(profile.role) ? (profile.company_name || profile.full_name || '').trim() : '';

  // -------------------------------------------------------------- ação do passo
  const acao: { rotulo: string; onClick: () => void; carregando?: boolean } | null =
    passo === 'revisao'
      ? { rotulo: enviando ? 'Enviando…' : 'Enviar para aprovação', onClick: () => void enviar(), carregando: enviando }
      : passo === 'produto' && !linha
        ? null
        : passo === 'cobertura' && !r.servico
          ? null
          : { rotulo: passo === 'proprietario' ? 'Revisar' : 'Continuar', onClick: avancar };

  const { titulo: tituloPasso, sub } = textosDoPasso(passo, movel);
  // Curto, para caber ao lado do botão numa tela de 360 px: "Luxury · 12 anos".
  const resumoBarra = linha
    ? `${linha.tipo === 'PPF' ? linha.rotulo : r.material.trim() || linha.rotulo} · ${linha.garantiaAnos} anos`
    : 'Escolha o que foi aplicado';
  const rotuloPasso = passo === 'revisao' ? 'Revisão' : `Passo ${indice + 1} de 4`;

  const props = { r, mudar, erros, mostrar };

  return (
    <div className={styles.pagina}>
      <SEO
        title="Registro de Garantia NZPPF — Certificado Digital"
        description="Registre a garantia da sua película NZPPF ou do envelopamento NZWRAP. A NZ confere o registro e envia o certificado por e-mail, com código único e QR para conferência pública."
        canonicalUrl="/registro-garantia"
      />

      {!recebido && (
        <header className={passo === 'produto' ? styles.topo : `${styles.topo} ${styles.topoCompacto}`}>
          <p className={styles.eyebrow}>Garantia NZ</p>
          <TituloComTutorial tutorial={profile && ehEmpresa(profile.role) ? 'garantia.registro-aplicador' : 'garantia.registro'}>
            <h1 className={styles.titulo}>Registrar garantia</h1>
          </TituloComTutorial>
          {passo === 'produto' && (
            <p className={styles.lede}>Leva dois minutos. A NZ confere o registro com o aplicador e envia o certificado por e-mail.</p>
          )}
          <ol className={styles.progresso} aria-label="Etapas">
            {ETAPAS.map((e, i) => {
              const feita = i < indice;
              const atual = i === indice;
              return (
                <li key={e.passo}>
                  <button
                    type="button"
                    className={[styles.etapa, feita ? styles.etapaFeita : '', atual ? styles.etapaAtual : ''].filter(Boolean).join(' ')}
                    onClick={feita ? () => ir(e.passo) : undefined}
                    disabled={!feita}
                    aria-current={atual ? 'step' : undefined}
                    aria-label={`${e.rotulo}${feita ? ' — concluído, alterar' : atual ? ' — etapa atual' : ''}`}
                  >
                    {e.passo === 'veiculo' && movel ? 'Item' : e.rotulo}
                  </button>
                </li>
              );
            })}
          </ol>
        </header>
      )}

      {recebido ? (
        <div className={`${styles.layout} ${styles.layoutUnico}`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Protocolo
              protocolo={recebido.protocolo}
              criadoEm={recebido.criadoEm}
              dados={recebido.dados}
              email={recebido.email}
              emailEnviado={recebido.emailEnviado}
              logado={Boolean(user)}
              onOutra={outra}
            />
          </motion.div>
        </div>
      ) : (
        <>
          <div className={styles.layout}>
            <section className={styles.palco} aria-labelledby="titulo-passo">
              <motion.div
                key={passo}
                initial={reduzir ? { opacity: 0 } : { opacity: 0, x: 24 * direcao }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className={styles.passoNumero}>{passo === 'revisao' ? 'Revisão' : `Passo ${indice + 1} de 4`}</p>
                <h2 className={styles.passoTitulo} id="titulo-passo" ref={titulo} tabIndex={-1}>
                  {tituloPasso}
                </h2>
                <p className={styles.passoSub}>{sub}</p>

                <form noValidate onSubmit={(e) => e.preventDefault()} onKeyDown={teclaNoFormulario}>
                  {passo === 'produto' && <PassoProduto {...props} onEscolher={escolherLinha} />}
                  {passo === 'cobertura' && <PassoCobertura {...props} onEscolher={escolherServico} />}
                  {passo === 'veiculo' && <PassoVeiculo {...props} aplicadorDaConta={aplicadorDaConta} />}
                  {passo === 'proprietario' && <PassoProprietario {...props} meusDados={meusDados} />}
                  {passo === 'revisao' && <Revisao r={r} previa={previa} onAlterar={(p) => ir(p)} />}
                  {passo === 'revisao' && (
                    <input className={styles.mel} name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" value={mel} onChange={(e) => setMel(e.target.value)} />
                  )}
                </form>

                {erroEnvio && passo === 'revisao' && (
                  <p className={styles.erroGeral} role="alert">
                    {erroEnvio}
                  </p>
                )}

                <div className={styles.acoes}>
                  {indice > 0 ? (
                    <button type="button" className={styles.voltar} onClick={voltar}>
                      <ChevronLeft size={18} aria-hidden="true" /> Voltar
                    </button>
                  ) : (
                    <span />
                  )}
                  {acao && (
                    <button type="button" className={styles.primario} onClick={acao.onClick} disabled={acao.carregando}>
                      {acao.rotulo}
                      {passo !== 'revisao' && <ChevronRight size={16} aria-hidden="true" />}
                    </button>
                  )}
                </div>
              </motion.div>
            </section>

            <aside className={styles.lateral} aria-label="Prévia do certificado">
              <p className={styles.lateralRotulo}>Prévia do certificado</p>
              <Certificado dados={previa} compacto />
              <p className={styles.confianca}>
                O certificado sai depois que a NZ confere o registro, com um código único que qualquer pessoa confere em{' '}
                <a href="/validar-garantia">nzgroup.com.br/validar-garantia</a>.
              </p>
            </aside>
          </div>

          {passo === 'produto' && <Cuidados tipo={linha?.tipo ?? ''} movel={movel} />}

          {(acao || indice > 0) && (
            <BarraDoPasso
              rotuloPasso={rotuloPasso}
              resumo={resumoBarra}
              onVoltar={indice > 0 ? voltar : undefined}
              acao={acao}
              previa={linha ? previa : null}
            />
          )}
        </>
      )}
    </div>
  );
}
