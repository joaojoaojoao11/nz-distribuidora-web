import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, MapPin, Gift, CircleAlert, LoaderCircle } from 'lucide-react';
import { InstagramLogo } from '@phosphor-icons/react';
import SEO from '../../components/SEO/SEO';
import { supabase } from '../../lib/supabase';
import {
  formatPhone, toE164, isValidPhone,
  normalizeInstagram, isValidInstagram,
  formatCep, buscarCep, isValidEmail,
} from '../../lib/formatters';
import {
  INTERLAGOS, PERFIS, PERFIL_LABEL, isProfissional,
  SERVICOS_INTERESSE, LINHAS, DIFERENCIAIS,
  type PerfilValue,
} from './interlagosConfig';
import styles from './Interlagos.module.css';

/* ═══════════════════════════════════════════
   Estado do quiz
   ═══════════════════════════════════════════ */

interface Answers {
  perfil: PerfilValue | '';
  quer_indicacao_aplicador: boolean | null;
  servico_interesse: string;
  nome: string;
  telefone: string;
  instagram: string;
  email: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
  consentimento_lgpd: boolean;
  segue_instagram: boolean;
}

const EMPTY: Answers = {
  perfil: '',
  quer_indicacao_aplicador: null, servico_interesse: '',
  nome: '', telefone: '', instagram: '', email: '',
  cep: '', logradouro: '', bairro: '', cidade: '', uf: '',
  numero: '', complemento: '',
  consentimento_lgpd: false, segue_instagram: false,
};

const STORAGE_KEY = 'nz_interlagos_quiz_v1';

type StepId =
  | 'perfil' | 'ramo' | 'nome' | 'whatsapp' | 'instagram'
  | 'email' | 'cep' | 'endereco' | 'lgpd' | 'seguir';

const easing = [0.22, 1, 0.36, 1] as const;

/** Recupera o rascunho salvo. Chamado uma vez, no inicializador do useState. */
function carregarRascunho(): { answers: Answers; stepIndex: number; retomado: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { answers?: Partial<Answers>; stepIndex?: number };
      // Só retoma se houver conteúdo de verdade — um rascunho vazio abriria
      // o quiz sozinho para quem só passou pela página antes.
      if (saved.answers?.perfil) {
        return {
          answers: { ...EMPTY, ...saved.answers },
          stepIndex: saved.stepIndex ?? 0,
          retomado: true,
        };
      }
    }
  } catch { /* storage indisponível — segue com estado limpo */ }
  return { answers: EMPTY, stepIndex: 0, retomado: false };
}

/* ═══════════════════════════════════════════
   Cards das linhas — usados na página e no fim do cadastro
   ═══════════════════════════════════════════ */

function LinhaCard({ linha, index, compact = false }: {
  linha: (typeof LINHAS)[number];
  index: number;
  compact?: boolean;
}) {
  const conteudo = (
    <>
      <div className={styles.lineImgWrap}>
        <img
          src={linha.img}
          alt={`${linha.nome} — ${linha.titulo}`}
          className={styles.lineImg}
          loading="lazy"
          decoding="async"
          width={720}
          height={405}
        />
        <span className={styles.lineName}>{linha.nome}</span>
      </div>
      <div className={styles.lineBody}>
        <h3 className={styles.lineTitle}>{linha.titulo}</h3>
        <p className={styles.lineDesc}>{compact ? linha.resumo : linha.desc}</p>
        <span className={styles.lineCta}>{linha.cta} <ArrowRight size={14} /></span>
      </div>
    </>
  );

  const className = compact ? styles.lineCardCompact : styles.lineCard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index, 3) * 0.07, ease: easing }}
    >
      {linha.externo ? (
        <a href={linha.href} target="_blank" rel="noreferrer" className={className}>{conteudo}</a>
      ) : (
        <Link to={linha.href} className={className}>{conteudo}</Link>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */

export default function Interlagos() {
  const [searchParams] = useSearchParams();

  const [rascunho] = useState(carregarRascunho);
  const [answers, setAnswers] = useState<Answers>(rascunho.answers);
  const [stepIndex, setStepIndex] = useState(rascunho.stepIndex);
  const [quizOpen, setQuizOpen] = useState(rascunho.retomado);

  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle');
  const [cepMsg, setCepMsg] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  // Honeypot: bot preenche, humano não vê.
  const honeypotRef = useRef<HTMLInputElement>(null);

  /* ── Persistência local: rede ruim não pode apagar o que foi digitado ── */
  useEffect(() => {
    // Nada a salvar antes do quiz começar — evita gravar rascunho vazio.
    if (success || !quizOpen || !answers.perfil) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, stepIndex }));
    } catch { /* quota/privado — persistência é bônus, não pode quebrar o fluxo */ }
  }, [answers, stepIndex, success, quizOpen]);

  const set = useCallback(<K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  /* ── Ramificação: só o proprietário tem pergunta extra.
        Profissional vai direto para os dados — quanto menos etapa, mais cadastro. ── */
  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ['perfil'];
    if (answers.perfil && !isProfissional(answers.perfil)) base.push('ramo');
    return [...base, 'nome', 'whatsapp', 'instagram', 'email', 'cep', 'endereco', 'lgpd', 'seguir'];
  }, [answers.perfil]);

  // Clamp: um rascunho salvo com índice além do fluxo atual (troca de perfil,
  // versão anterior da página) deixaria a etapa em branco e sem saída.
  const maxIndex = steps.length - 1;
  const safeIndex = Math.min(stepIndex, maxIndex);
  const current = steps[safeIndex];
  const progress = ((safeIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    switch (current) {
      case 'perfil': return answers.perfil !== '';
      case 'ramo': return answers.quer_indicacao_aplicador !== null && answers.servico_interesse !== '';
      case 'nome': return answers.nome.trim().length > 2 && answers.nome.trim().includes(' ');
      case 'whatsapp': return isValidPhone(answers.telefone);
      case 'instagram': return isValidInstagram(answers.instagram);
      case 'email': return answers.email.trim() === '' || isValidEmail(answers.email);
      case 'cep': return answers.logradouro.trim() !== '' && answers.cidade.trim() !== '' && answers.uf.trim() !== '';
      case 'endereco': return answers.numero.trim() !== '';
      case 'lgpd': return answers.consentimento_lgpd;
      case 'seguir': return true;
      default: return false;
    }
  }, [current, answers]);

  const next = () => {
    if (!canAdvance) return;
    if (safeIndex < maxIndex) setStepIndex(safeIndex + 1);
    else void handleSubmit();
  };
  const back = () => setStepIndex(Math.max(0, safeIndex - 1));

  /* ── ViaCEP ── */
  const onCepChange = async (raw: string) => {
    const masked = formatCep(raw);
    set('cep', masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepStatus('idle');
      setCepMsg('');
      return;
    }
    setCepStatus('loading');
    setCepMsg('');
    const res = await buscarCep(digits);
    if (res.ok) {
      setAnswers(prev => ({ ...prev, ...res.data }));
      setCepStatus('ok');
    } else {
      setCepStatus('erro');
      setCepMsg(
        res.reason === 'nao_encontrado'
          ? 'CEP não encontrado. Confira ou preencha o endereço abaixo.'
          : 'Não conseguimos buscar o CEP. Preencha o endereço abaixo.',
      );
    }
  };

  /* ── Submissão ── */
  const handleSubmit = async () => {
    // Honeypot preenchido = bot. Sucesso falso, nada gravado.
    if (honeypotRef.current?.value) {
      setSuccess(true);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const instagram = normalizeInstagram(answers.instagram);
    const telefone = toE164(answers.telefone);
    const profissional = isProfissional(answers.perfil);

    const payload = {
      perfil: answers.perfil,
      nome: answers.nome.trim(),
      telefone,
      email: answers.email.trim() || null,
      instagram,
      cep: answers.cep.replace(/\D/g, ''),
      logradouro: answers.logradouro.trim(),
      numero: answers.numero.trim(),
      complemento: answers.complemento.trim() || null,
      bairro: answers.bairro.trim(),
      cidade: answers.cidade.trim(),
      uf: answers.uf.trim().toUpperCase(),
      quer_indicacao_aplicador: profissional ? false : answers.quer_indicacao_aplicador ?? false,
      servico_interesse: profissional ? null : answers.servico_interesse || null,
      segue_instagram: answers.segue_instagram,
      consentimento_lgpd: answers.consentimento_lgpd,
      origem: 'qr_festival_interlagos',
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      user_agent: navigator.userAgent,
    };

    // Diferente das outras telas do site: supabase-js RESOLVE em erro de RLS
    // em vez de lançar. Sem checar `error` aqui, um lead perdido mostraria
    // tela de sucesso — inaceitável com brinde envolvido.
    const { error } = await supabase.from('leads_festival_interlagos').insert([payload]);

    if (error) {
      setSubmitting(false);
      if (error.code === '23505') {
        setSubmitError(
          error.message.includes('instagram')
            ? 'Esse Instagram já está cadastrado — é um brinde por pessoa.'
            : 'Esse número já está cadastrado — é um brinde por pessoa.',
        );
      } else {
        setSubmitError('Não conseguimos enviar agora. Confira sua conexão e toque em tentar de novo — suas respostas estão salvas.');
      }
      return;
    }

    // Notificação por e-mail: mesmo mecanismo do resto do site (FormSubmit.co).
    // Não-awaited e com catch próprio — nunca bloqueia a tela de sucesso.
    try {
      const endereco =
        `${payload.logradouro}, ${payload.numero}` +
        `${payload.complemento ? ' — ' + payload.complemento : ''}\n` +
        `${payload.bairro} — ${payload.cidade}/${payload.uf}\nCEP ${answers.cep}`;

      fetch(`https://formsubmit.co/ajax/${INTERLAGOS.EMAIL_LEAD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `[Interlagos] Novo lead — ${payload.nome} (${PERFIL_LABEL[answers.perfil as PerfilValue]})`,
          _honey: '',
          Perfil: PERFIL_LABEL[answers.perfil as PerfilValue],
          Nome: payload.nome,
          WhatsApp: answers.telefone,
          Instagram: `@${instagram}`,
          Email: payload.email || '—',
          Endereco_para_etiqueta: endereco,
          Quer_indicacao_aplicador: profissional ? '—' : (payload.quer_indicacao_aplicador ? 'Sim' : 'Não'),
          Servico_interesse: payload.servico_interesse || '—',
          Segue_instagram: payload.segue_instagram ? 'Sim (declarado)' : 'Não',
          Origem: payload.utm_source ? `${payload.utm_source} / ${payload.utm_medium} / ${payload.utm_campaign}` : 'direto',
          Data: new Date().toLocaleString('pt-BR'),
        }),
      }).catch(e => console.error('[Interlagos] notificação falhou', e));
    } catch (e) {
      console.error('[Interlagos] notificação falhou', e);
    }

    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setSubmitting(false);
    setSuccess(true);
  };

  const startQuiz = () => {
    setQuizOpen(true);
    requestAnimationFrame(() => {
      document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /* ═══════════════════════════════════════════
     Tela de sucesso
     ═══════════════════════════════════════════ */
  if (success) {
    return (
      <div className={styles.page}>
        <SEO
          title="Brinde desbloqueado | Festival Interlagos"
          description="Seu cadastro no Festival Interlagos foi registrado."
          canonicalUrl="/interlagos"
          noindex
        />
        <section className={styles.successSection}>
          <div className={styles.container}>
            <motion.div
              className={styles.successCard}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: easing }}
            >
              <motion.div
                className={styles.successCheck}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15, ease: easing }}
              >
                <Check size={36} strokeWidth={3} />
              </motion.div>

              <span className={styles.stepTag}>Brinde desbloqueado</span>
              <h1 className={styles.successTitle}>
                Pronto, {answers.nome.trim().split(' ')[0] || 'tudo certo'}.
              </h1>
              <p className={styles.successText}>
                Seu cadastro foi registrado. Vamos conferir a lista de seguidores e despachar
                {' '}{INTERLAGOS.BRINDE} para o endereço abaixo em {INTERLAGOS.PRAZO_ENVIO}.
              </p>

              <div className={styles.addressBox}>
                <span className={styles.addressLabel}><MapPin size={12} /> Endereço de envio</span>
                <p className={styles.addressText}>
                  {answers.logradouro}, {answers.numero}
                  {answers.complemento ? ` — ${answers.complemento}` : ''}<br />
                  {answers.bairro} — {answers.cidade}/{answers.uf}<br />
                  CEP {answers.cep}
                </p>
              </div>

              {!answers.segue_instagram && (
                <p className={styles.successWarn}>
                  <CircleAlert size={14} />
                  Você ainda não marcou que segue a NZ Group. Conferimos a lista antes de despachar —
                  siga <a href={INTERLAGOS.INSTAGRAM_URL} target="_blank" rel="noreferrer">@{INTERLAGOS.INSTAGRAM_HANDLE}</a> para garantir o brinde.
                </p>
              )}

              <a href={INTERLAGOS.WHATSAPP_URL} target="_blank" rel="noreferrer" className={styles.successCta}>
                Falar agora com a equipe
                <ArrowRight size={16} />
              </a>

              {INTERLAGOS.ESTANDE && (
                <p className={styles.successFoot}>Passe no estande {INTERLAGOS.ESTANDE} para conhecer as linhas de perto.</p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Enquanto o brinde não chega: o que a NZ trabalha, com link direto */}
        <section className={styles.linesSection}>
          <div className={styles.container}>
            <span className={styles.stepTag}>Enquanto isso</span>
            <h2 className={styles.sectionTitle}>O que a gente trabalha</h2>
            <p className={styles.sectionSub}>
              Toque em qualquer linha para ver o catálogo completo no site.
            </p>
            <div className={styles.lineGrid}>
              {LINHAS.map((l, i) => (
                <LinhaCard key={l.nome} linha={l} index={i} compact />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Página
     ═══════════════════════════════════════════ */
  return (
    <div className={styles.page}>
      <SEO
        title="Festival Interlagos 2026 — Brinde exclusivo NZ Group"
        description={`A NZ Group está no Festival Interlagos, de ${INTERLAGOS.DATAS}. Responda em menos de 1 minuto e desbloqueie ${INTERLAGOS.BRINDE}, enviado no seu endereço.`}
        canonicalUrl="/interlagos"
        noindex
      />

      {/* ═══ HERO ═══ */}
      <section className={styles.heroSection}>
        <img
          src="/assets/images/interlagos/hero.webp"
          alt=""
          aria-hidden="true"
          className={styles.heroImg}
          fetchPriority="high"
          decoding="async"
          width={1280}
          height={720}
        />
        <div className={styles.heroScrim} />
        <div className={styles.heroSpeedLines} aria-hidden="true" />

        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: easing }}
          >
            <div className={styles.eventBadge}>
              <span className={styles.eventBadgeMain}>{INTERLAGOS.EVENTO}</span>
              <span className={styles.eventBadgeSub}>{INTERLAGOS.EDICAO}</span>
            </div>

            <h1 className={styles.heroTitle}>
              Você achou<br />o brinde.
            </h1>

            <p className={styles.heroSub}>
              A NZ Group está no Autódromo de Interlagos. Responda algumas perguntas
              rápidas e enviamos <strong>{INTERLAGOS.BRINDE}</strong> no seu endereço, sem custo.
            </p>

            {/* Faixa de datas no estilo grid de largada */}
            <div className={styles.dateStrip}>
              {INTERLAGOS.DIAS.map(d => (
                <span key={d} className={styles.dateDay}>{d}</span>
              ))}
              <span className={styles.dateMonth}>AGO</span>
            </div>

            <button className={styles.heroCta} onClick={startQuiz}>
              <Gift size={18} />
              Desbloquear meu brinde
            </button>
            <p className={styles.heroMicro}>Leva menos de 1 minuto</p>
          </motion.div>
        </div>

        <div className={styles.checkerStrip} aria-hidden="true" />
      </section>

      {/* ═══ URGÊNCIA ═══ */}
      <section className={styles.urgencyBar}>
        <div className={styles.container}>
          <div className={styles.urgencyInner}>
            <span className={styles.urgencyPulse} />
            <p>
              <strong>{INTERLAGOS.UNIDADES}</strong> — só durante o festival, {INTERLAGOS.DATAS}.
              {INTERLAGOS.ESTANDE ? ` Estande ${INTERLAGOS.ESTANDE}.` : ''}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ QUIZ ═══ */}
      <section className={styles.quizSection} id="quiz">
        <div className={styles.container}>
          {!quizOpen ? (
            <div className={styles.quizTeaser}>
              <h2 className={styles.sectionTitle}>Desbloqueie seu brinde</h2>
              <p className={styles.sectionSub}>
                Perguntas rápidas, uma por tela. Precisamos do seu endereço só para enviar o brinde.
              </p>
              <button className={styles.formSubmit} onClick={startQuiz}>
                Começar <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.quizCard}>
              {/* Barra de progresso */}
              <div className={styles.progressWrap}>
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: easing }}
                  />
                </div>
                <span className={styles.progressLabel}>{safeIndex + 1}/{steps.length}</span>
              </div>

              {/* Honeypot — fora da tela, nunca focável */}
              <input
                ref={honeypotRef}
                type="text"
                name="empresa_site"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                className={styles.honeypot}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  /* Só opacidade: mover o card no eixo X fazia o alvo do toque
                     andar durante a animação e o dedo errava o campo. */
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16, ease: 'linear' }}
                  className={styles.stepBody}
                >
                  {current === 'perfil' && (
                    <>
                      <h2 className={styles.quizQuestion}>Como você se identifica?</h2>
                      <p className={styles.quizHelp}>Isso define o que perguntamos a seguir.</p>
                      <div className={styles.optionList}>
                        {PERFIS.map(p => (
                          <button
                            key={p.value}
                            type="button"
                            className={answers.perfil === p.value ? styles.optionActive : styles.option}
                            onClick={() => { set('perfil', p.value); setStepIndex(1); }}
                          >
                            <span className={styles.optionLabel}>{p.label}</span>
                            <span className={styles.optionDesc}>{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {current === 'ramo' && (
                    <>
                      <h2 className={styles.quizQuestion}>O que você quer fazer no seu carro?</h2>
                      <p className={styles.quizHelp}>
                        A NZ tem rede de aplicadores credenciados no Brasil inteiro.
                      </p>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Serviço de interesse</label>
                        <div className={styles.optionList}>
                          {SERVICOS_INTERESSE.map(s => (
                            <button
                              key={s}
                              type="button"
                              className={answers.servico_interesse === s ? styles.chipActive : styles.chip}
                              onClick={() => set('servico_interesse', s)}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Quer indicação de um aplicador credenciado?</label>
                        <div className={styles.chipGroup}>
                          <button
                            type="button"
                            className={answers.quer_indicacao_aplicador === true ? styles.chipActive : styles.chip}
                            onClick={() => set('quer_indicacao_aplicador', true)}
                          >Sim, quero</button>
                          <button
                            type="button"
                            className={answers.quer_indicacao_aplicador === false ? styles.chipActive : styles.chip}
                            onClick={() => set('quer_indicacao_aplicador', false)}
                          >Agora não</button>
                        </div>
                      </div>
                    </>
                  )}

                  {current === 'nome' && (
                    <>
                      <h2 className={styles.quizQuestion}>Qual é o seu nome completo?</h2>
                      <p className={styles.quizHelp}>É o nome que vai na etiqueta do envio.</p>
                      <input
                        className={styles.formInputLarge}
                        value={answers.nome}
                        onChange={e => set('nome', e.target.value)}
                        placeholder="Nome e sobrenome"
                        autoComplete="name"
                      />
                    </>
                  )}

                  {current === 'whatsapp' && (
                    <>
                      <h2 className={styles.quizQuestion}>Seu WhatsApp</h2>
                      <p className={styles.quizHelp}>É por aqui que avisamos quando o brinde sair.</p>
                      <input
                        className={styles.formInputLarge}
                        value={answers.telefone}
                        onChange={e => set('telefone', formatPhone(e.target.value))}
                        placeholder="(11) 90000-0000"
                        inputMode="numeric"
                        autoComplete="tel"
                      />
                    </>
                  )}

                  {current === 'instagram' && (
                    <>
                      <h2 className={styles.quizQuestion}>Seu Instagram</h2>
                      <p className={styles.quizHelp}>Pode colar com @ ou o link, a gente arruma.</p>
                      <input
                        className={styles.formInputLarge}
                        value={answers.instagram}
                        onChange={e => set('instagram', e.target.value)}
                        placeholder="@seuperfil"
                        autoCapitalize="none"
                        autoCorrect="off"
                      />
                      {answers.instagram && isValidInstagram(answers.instagram) && (
                        <p className={styles.quizHint}>Vamos registrar como @{normalizeInstagram(answers.instagram)}</p>
                      )}
                    </>
                  )}

                  {current === 'email' && (
                    <>
                      <h2 className={styles.quizQuestion}>Seu e-mail</h2>
                      <p className={styles.quizHelp}>
                        Opcional — mas é como mandamos o código de rastreio do envio.
                      </p>
                      <input
                        className={styles.formInputLarge}
                        type="email"
                        value={answers.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="voce@email.com"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </>
                  )}

                  {current === 'cep' && (
                    <>
                      <h2 className={styles.quizQuestion}>Para onde mandamos?</h2>
                      <p className={styles.quizHelp}>Digite o CEP que preenchemos o resto.</p>
                      <input
                        className={styles.formInputLarge}
                        value={answers.cep}
                        onChange={e => void onCepChange(e.target.value)}
                        placeholder="00000-000"
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                      {cepStatus === 'loading' && <p className={styles.quizHint}>Buscando endereço...</p>}
                      {cepStatus === 'erro' && <p className={styles.quizWarn}><CircleAlert size={13} /> {cepMsg}</p>}

                      {(cepStatus === 'ok' || cepStatus === 'erro') && (
                        <div className={styles.addressFields}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Rua</label>
                            <input className={styles.formInput} value={answers.logradouro}
                              onChange={e => set('logradouro', e.target.value)} placeholder="Rua / Avenida" />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Bairro</label>
                            <input className={styles.formInput} value={answers.bairro}
                              onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
                          </div>
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>Cidade</label>
                              <input className={styles.formInput} value={answers.cidade}
                                onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
                            </div>
                            <div className={styles.formGroupSmall}>
                              <label className={styles.formLabel}>UF</label>
                              <input className={styles.formInput} value={answers.uf} maxLength={2}
                                onChange={e => set('uf', e.target.value.toUpperCase())} placeholder="SP" />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {current === 'endereco' && (
                    <>
                      <h2 className={styles.quizQuestion}>Número e complemento</h2>
                      <p className={styles.quizHelp}>
                        {answers.logradouro}{answers.bairro ? `, ${answers.bairro}` : ''} — {answers.cidade}/{answers.uf}
                      </p>
                      <div className={styles.formRow}>
                        <div className={styles.formGroupSmall}>
                          <label className={styles.formLabel}>Número</label>
                          <input className={styles.formInput} value={answers.numero} inputMode="numeric"
                            onChange={e => set('numero', e.target.value)} placeholder="123" />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Complemento <span className={styles.formOptional}>(opcional)</span></label>
                          <input className={styles.formInput} value={answers.complemento}
                            onChange={e => set('complemento', e.target.value)} placeholder="Apto, bloco, referência" />
                        </div>
                      </div>
                    </>
                  )}

                  {current === 'lgpd' && (
                    <>
                      <h2 className={styles.quizQuestion}>Só falta autorizar.</h2>
                      <button
                        type="button"
                        className={answers.consentimento_lgpd ? styles.consentBoxActive : styles.consentBox}
                        onClick={() => set('consentimento_lgpd', !answers.consentimento_lgpd)}
                      >
                        <span className={styles.consentCheck}>
                          {answers.consentimento_lgpd && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className={styles.consentText}>
                          Autorizo a NZ Group a usar meus dados para <strong>enviar o brinde</strong> no
                          endereço informado e para <strong>contato comercial</strong>. Posso pedir a
                          exclusão a qualquer momento.
                        </span>
                      </button>
                    </>
                  )}

                  {current === 'seguir' && (
                    <>
                      <h2 className={styles.quizQuestion}>Última etapa.</h2>
                      <p className={styles.quizHelp}>
                        O brinde é para quem acompanha a NZ Group.
                      </p>
                      <a
                        href={INTERLAGOS.INSTAGRAM_URL}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.igButton}
                        onClick={() => set('segue_instagram', true)}
                      >
                        <InstagramLogo size={18} />
                        Abrir @{INTERLAGOS.INSTAGRAM_HANDLE}
                      </a>
                      <button
                        type="button"
                        className={answers.segue_instagram ? styles.consentBoxActive : styles.consentBox}
                        onClick={() => set('segue_instagram', !answers.segue_instagram)}
                      >
                        <span className={styles.consentCheck}>
                          {answers.segue_instagram && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className={styles.consentText}>Já estou seguindo a NZ Group</span>
                      </button>
                      <p className={styles.quizWarn}>
                        <CircleAlert size={13} />
                        Conferimos a lista de seguidores antes de despachar o brinde.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {submitError && (
                <div className={styles.errorBox}>
                  <CircleAlert size={15} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className={styles.formNavRow}>
                {safeIndex > 0 && (
                  <button type="button" className={styles.formBack} onClick={back} disabled={submitting}>
                    <ArrowLeft size={15} />
                  </button>
                )}
                {current !== 'perfil' && (
                  <button
                    type="button"
                    className={styles.formSubmit}
                    onClick={next}
                    disabled={!canAdvance || submitting}
                  >
                    {submitting ? (<><LoaderCircle size={16} className={styles.spin} /> Enviando...</>)
                      : current === 'seguir' ? (submitError ? 'Tentar de novo' : 'Confirmar meu brinde')
                      : current === 'email' && !answers.email.trim() ? 'Pular esta'
                      : (<>Continuar <ArrowRight size={16} /></>)}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ QUEM É A NZ ═══ */}
      <section className={styles.aboutSection}>
        <div className={styles.container}>
          <span className={styles.stepTag}>Quem está no estande</span>
          <h2 className={styles.sectionTitle}>Quem é a NZ Group</h2>
          <ul className={styles.bulletList}>
            {DIFERENCIAIS.map((d, i) => (
              <li key={d} className={styles.bullet}>
                <span className={styles.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ AS 4 LINHAS ═══ */}
      <section className={styles.linesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>As 4 linhas</h2>
          <p className={styles.sectionSub}>Tudo que você vai encontrar no nosso estande.</p>
          <div className={styles.lineGrid}>
            {LINHAS.map((l, i) => (
              <LinhaCard key={l.nome} linha={l} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className={styles.ctaSection}>
        <div className={styles.checkerStrip} aria-hidden="true" />
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Seu brinde ainda está esperando.</h2>
          <p className={styles.sectionSub}>{INTERLAGOS.UNIDADES} — {INTERLAGOS.DATAS}.</p>
          <button className={styles.heroCta} onClick={startQuiz}>
            <Gift size={18} />
            Desbloquear meu brinde
          </button>
        </div>
      </section>
    </div>
  );
}
