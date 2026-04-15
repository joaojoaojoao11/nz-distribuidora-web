import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import BrazilMap from '../../components/BrazilMap/BrazilMap';
import styles from './FindInstaller.module.css';

// NZ SVG icons
const EscudoIcon = '/assets/simbolos/simbolo-escudo-vazio.svg';
const CertoIcon = '/assets/simbolos/simbolo-certo.svg';
const RegeneracaoIcon = '/assets/simbolos/simbolo-regeneracao.svg';
const EscudoComBracoIcon = '/assets/simbolos/simbolo-escudo-com-braco.svg';

const SERVICES = ['PPF', 'Envelopamento'];

// Framer variants
const blurReveal = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};
const slideFromRight = {
  hidden: { opacity: 0, x: 60, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};
const slideFromLeft = {
  hidden: { opacity: 0, x: -60, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Multi-step form state
const TOTAL_STEPS = 3;

export default function FindInstaller() {
  const navigate = useNavigate();
  const [activeState, setActiveState] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [formStep, setFormStep] = useState(1);

  // Form state
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [serviceType, setServiceType] = useState('PPF');
  const [notes, setNotes] = useState('');

  const openForm = () => {
    setFormStep(1);
    setIsFormOpen(true);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const parseLocation = (loc: string) => {
    const cepMatch = loc.replace(/\D/g, '');
    if (cepMatch.length >= 8) return { state: '', city: loc.trim() };
    const parts = loc.split(/[-–,\/]/);
    if (parts.length >= 2) return { state: parts[parts.length - 1].trim().toUpperCase().slice(0, 2), city: parts[0].trim() };
    return { state: '', city: loc.trim() };
  };

  const canAdvanceStep1 = fullName.trim().length > 2 && whatsapp.replace(/\D/g, '').length >= 10;
  const canAdvanceStep2 = location.trim().length > 2;

  const handleNextStep = () => {
    if (formStep === 1 && !canAdvanceStep1) return;
    if (formStep === 2 && !canAdvanceStep2) return;
    setFormStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handlePrevStep = () => setFormStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !whatsapp || !location || !serviceType) return;

    setSubmitting(true);
    const { state, city } = parseLocation(location);
    try {
      await supabase.from('installer_leads').insert({
        full_name: fullName,
        whatsapp,
        state: state || null,
        city,
        vehicle: vehicle || null,
        service_type: serviceType,
        notes: notes || null,
      });
      setSubmittedName(fullName.split(' ')[0]);
      setSuccess(true);
    } catch {
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStateClick = (uf: string) => {
    setActiveState(uf === activeState ? null : uf);
  };

  const stepLabels = ['Identificação', 'Localização', 'Serviço'];

  return (
    <div className={styles.page}>

      {/* ═══════════════════════════════════════════
          SEÇÃO 1: HERO
          ═══════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <h1 className={styles.heroTitle}>
              <motion.span
                className={styles.heroLine}
                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                NÃO PROCURE.
              </motion.span>
              <br />
              <motion.span
                className={styles.heroLine}
                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                NÓS ENCONTRAMOS
              </motion.span>
              <br />
              <motion.span
                className={styles.heroLine}
                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                PARA VOCÊ.
              </motion.span>
            </h1>
            <motion.p className={styles.heroSub} variants={blurReveal}>
              Seu veículo merece o melhor. Um <strong>especialista da própria NZ</strong> cuida de tudo — do aplicador ideal à melhor negociação — com total <strong>responsabilidade e garantia</strong>.
            </motion.p>
            <motion.div className={styles.heroActions} variants={blurReveal}>
              <button className={styles.heroCta} onClick={openForm}>
                SOLICITAR UM ESPECIALISTA NZ
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 2: MAPA + COUNTERS (Presença Nacional)
          ═══════════════════════════════════════════ */}
      <section className={styles.mapSection}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>

          <motion.div className={styles.mapManifesto} variants={blurReveal}>
            <div className={styles.mapManifestoInner}>
              <span className={styles.mapManifestoTag}>REDE NACIONAL NZ</span>
              <h2 className={styles.sectionTitle}>Presença em Todo o Brasil</h2>
              <p className={styles.sectionSub}>
                Mais de 500 aplicadores certificados distribuídos em todas as capitais e em mais de 300 cidades. Onde você estiver, a NZ chega primeiro.
              </p>
              <button className={styles.heroCta} onClick={openForm}>
                SOLICITAR UM ESPECIALISTA NZ
              </button>
            </div>
          </motion.div>

          <motion.div className={styles.counters} variants={scaleIn}>
            <div className={styles.counterItem}>
              <span className={styles.counterValue}><AnimatedCounter target={27} /></span>
              <span className={styles.counterLabel}>Capitais</span>
            </div>
            <div className={styles.counterItem}>
              <span className={styles.counterValue}>+<AnimatedCounter target={300} /></span>
              <span className={styles.counterLabel}>Cidades</span>
            </div>
            <div className={styles.counterItem}>
              <span className={styles.counterValue}>+<AnimatedCounter target={500} /></span>
              <span className={styles.counterLabel}>Aplicadores</span>
            </div>
          </motion.div>

          <motion.div className={styles.mapContainer} variants={scaleIn}>
            <BrazilMap activeState={activeState} onStateClick={handleStateClick} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 3: PASSO 01
          ═══════════════════════════════════════════ */}
      <section className={styles.stepSectionDark}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <div className={styles.stepLayout}>
            <motion.div className={styles.stepVisualBlock} variants={slideFromLeft}>
              <span className={styles.stepBigNum}>01</span>
              <div className={styles.stepIconWrap}>
                <img src={CertoIcon} alt="" className={styles.stepIconLarge} />
              </div>
            </motion.div>
            <motion.div className={styles.stepTextBlock} variants={blurReveal}>
              <span className={styles.stepTag}>100% gratuito e sem compromisso</span>
              <h2 className={styles.stepTitle}>Solicite em 30 Segundos</h2>
              <p className={styles.stepDesc}>
                Chega de perder tempo pesquisando aplicadores sem referência. Preencha apenas 4 campos e nossa equipe assume o controle. Sem burocracia, sem ligações inconvenientes. Você recebe confirmação instantânea e um especialista dedicado entra em ação imediatamente.
              </p>
              <p className={styles.stepDescAccent}>
                Mais de <strong>2.000 proprietários</strong> já confiaram esse processo à NZ — e nenhum se arrependeu.
              </p>
              <button className={styles.stepCta} onClick={openForm}>
                SOLICITAR AGORA
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 4: PASSO 02
          ═══════════════════════════════════════════ */}
      <section className={styles.stepSectionMid}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <div className={`${styles.stepLayout} ${styles.stepLayoutReverse}`}>
            <motion.div className={styles.stepTextBlock} variants={blurReveal}>
              <span className={styles.stepTag}>Atendimento humano e personalizado</span>
              <h2 className={styles.stepTitle}>Especialista NZ Dedicado a Você</h2>
              <p className={styles.stepDesc}>
                Em até 2 horas úteis, um profissional exclusivo da NZ entra em contato pelo WhatsApp. Ele analisa o seu veículo, entende suas necessidades reais e seleciona o aplicador certificado ideal na sua região — sem achismos, sem indicações genéricas.
              </p>
              <p className={styles.stepDescAccent}>
                Você não fala com um robô. Fala com quem <strong>conhece cada aplicador da rede</strong> e sabe exatamente quem é o melhor para o seu caso.
              </p>
            </motion.div>
            <motion.div className={styles.stepVisualBlock} variants={slideFromRight}>
              <span className={styles.stepBigNum}>02</span>
              <div className={styles.stepIconWrap}>
                <img src={EscudoComBracoIcon} alt="" className={styles.stepIconLarge} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 5: PASSO 03
          ═══════════════════════════════════════════ */}
      <section className={styles.stepSectionDark}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <div className={styles.stepLayout}>
            <motion.div className={styles.stepVisualBlock} variants={slideFromLeft}>
              <span className={styles.stepBigNum}>03</span>
              <div className={styles.stepIconWrap}>
                <img src={EscudoIcon} alt="" className={styles.stepIconLarge} />
              </div>
            </motion.div>
            <motion.div className={styles.stepTextBlock} variants={blurReveal}>
              <span className={styles.stepTag}>Garantia NZ sobre todo o processo</span>
              <h2 className={styles.stepTitle}>Instalação com Garantia Total NZ</h2>
              <p className={styles.stepDesc}>
                Negociamos a melhor condição para você — preços de rede que você não consegue sozinho. E se algo sair do esperado em qualquer etapa, a NZ assume a responsabilidade e resolve. Sem desculpas, sem empurra-empurra.
              </p>
              <p className={styles.stepDescAccent}>
                Você entrega o carro. Nós entregamos o resultado. <strong>Simples assim.</strong>
              </p>
              <button className={styles.stepCta} onClick={openForm}>
                QUERO ESSA GARANTIA
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 6: DIFERENCIAIS (Trust Cards)
          ═══════════════════════════════════════════ */}
      <section className={styles.trustSection}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Por Que Escolher a NZ</motion.h2>
          <div className={styles.trustGrid}>
            {[
              {
                icon: EscudoIcon,
                accent: 'Risco Zero',
                title: 'Risco Zero para Você',
                text: 'A NZ assume total responsabilidade sobre a instalação. Qualquer imprevisto é problema nosso, não seu. Sua tranquilidade é inegociável.'
              },
              {
                icon: RegeneracaoIcon,
                accent: 'Negociação Exclusiva',
                title: 'Condições que Você Não Consegue Sozinho',
                text: 'Nosso time negocia condições especiais de rede. Acesso a preços e prioridade que um cliente individual jamais obteria no mercado.'
              },
              {
                icon: CertoIcon,
                accent: 'Do Contato à Entrega',
                title: 'Acompanhamento do Início ao Fim',
                text: 'Um especialista NZ acompanha cada etapa — da análise do veículo à entrega final. Você não precisa se preocupar com absolutamente nada.'
              },
            ].map((item, i) => (
              <motion.div key={i} className={styles.trustCard} variants={scaleIn}>
                <div className={styles.trustCardTop}>
                  <img src={item.icon} alt="" className={styles.trustIcon} />
                  <span className={styles.trustAccent}>{item.accent}</span>
                </div>
                <h4 className={styles.trustTitle}>{item.title}</h4>
                <p className={styles.trustText}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 7: CTA FINAL
          ═══════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <motion.div className={styles.container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.div className={styles.ctaCard} variants={scaleIn}>
            <div className={styles.ctaText}>
              <h2 className={styles.sectionTitle}>Pronto para Proteger Seu Veículo?</h2>
              <p>Solicite agora e receba o contato de um especialista NZ em até 2 horas úteis. Sem compromisso, sem custo.</p>
            </div>
            <button className={styles.ctaBtn} onClick={openForm}>
              SOLICITAR CONTATO
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          MODAL: FORMULÁRIO MULTI-ETAPAS GAMIFICADO
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isFormOpen && !success && (
          <motion.div
            className={styles.formOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              className={styles.formModal}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.formClose} onClick={() => setIsFormOpen(false)}>FECHAR ✕</button>

              {/* Progress bar */}
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(formStep / TOTAL_STEPS) * 100}%` }} />
              </div>

              {/* Step indicators */}
              <div className={styles.stepIndicators}>
                {stepLabels.map((label, i) => (
                  <div key={i} className={`${styles.stepIndicator} ${formStep > i ? styles.stepIndicatorDone : ''} ${formStep === i + 1 ? styles.stepIndicatorActive : ''}`}>
                    <div className={styles.stepDot}>
                      {formStep > i + 1 ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span className={styles.stepDotLabel}>{label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.formHeader}>
                <img src={EscudoComBracoIcon} alt="" className={styles.formHeaderIcon} />
                <h3>Solicite um Especialista NZ</h3>
                <p>
                  {formStep === 1 && 'Como podemos te chamar? Precisamos do seu contato para o especialista chegar até você.'}
                  {formStep === 2 && 'Onde você está? Vamos encontrar o aplicador certificado mais próximo de você.'}
                  {formStep === 3 && 'Qual serviço você precisa? Personalizamos a indicação para o seu caso.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.formBody}>

                {/* ETAPA 1: Nome + WhatsApp */}
                <AnimatePresence mode="wait">
                  {formStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className={styles.formStepContent}
                    >
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome completo</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="Seu nome completo"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>WhatsApp</label>
                        <input
                          type="tel"
                          className={styles.formInput}
                          placeholder="(11) 99999-9999"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.formNext}
                        onClick={handleNextStep}
                        disabled={!canAdvanceStep1}
                      >
                        CONTINUAR
                      </button>
                    </motion.div>
                  )}

                  {/* ETAPA 2: Localização + Veículo */}
                  {formStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className={styles.formStepContent}
                    >
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Localização</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="CEP, Cidade ou Cidade - UF (ex: São Paulo - SP)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          autoFocus
                        />
                        <span className={styles.formHint}>Aceita CEP, nome da cidade ou cidade com estado</span>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Veículo <span className={styles.formOptional}>(opcional)</span></label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="Ex: BMW X5 2024 Branca"
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                        />
                      </div>
                      <div className={styles.formNavRow}>
                        <button type="button" className={styles.formBack} onClick={handlePrevStep}>
                          VOLTAR
                        </button>
                        <button
                          type="button"
                          className={styles.formNext}
                          onClick={handleNextStep}
                          disabled={!canAdvanceStep2}
                        >
                          CONTINUAR
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ETAPA 3: Serviço + Observação */}
                  {formStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className={styles.formStepContent}
                    >
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Serviço desejado</label>
                        <div className={styles.chipGroup}>
                          {SERVICES.map((svc) => (
                            <button
                              key={svc}
                              type="button"
                              className={serviceType === svc ? styles.chipActive : styles.chip}
                              onClick={() => setServiceType(svc)}
                            >
                              {svc}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Observação <span className={styles.formOptional}>(opcional)</span></label>
                        <textarea
                          className={styles.formTextarea}
                          placeholder="Conte-nos mais sobre o que precisa..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <div className={styles.formNavRow}>
                        <button type="button" className={styles.formBack} onClick={handlePrevStep}>
                          VOLTAR
                        </button>
                        <button type="submit" className={styles.formSubmit} disabled={submitting}>
                          {submitting ? 'ENVIANDO...' : 'ENVIAR SOLICITAÇÃO'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className={styles.formDisclaimer}>Sem compromisso. Resposta em até 2h úteis.</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          MODAL: SUCESSO
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {success && (
          <motion.div
            className={styles.formOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.successCard}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <img src={CertoIcon} alt="" className={styles.successIcon} />
              <h3 className={styles.successTitle}>Solicitação Enviada</h3>
              <p className={styles.successText}>
                Obrigado, <strong>{submittedName}</strong>.<br /><br />
                Um especialista NZ entrará em contato pelo WhatsApp <strong>{whatsapp}</strong> em até 2 horas úteis.<br /><br />
                Ele vai cuidar de encontrar o aplicador certificado ideal na sua região, com a melhor negociação e a garantia total NZ.
              </p>
              <button className={styles.successBtn} onClick={() => navigate('/')}>
                VOLTAR AO INÍCIO
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
