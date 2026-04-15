import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import BrazilMap from '../../components/BrazilMap/BrazilMap';
import styles from './FindInstaller.module.css';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const SERVICES = ['PPF', 'Envelopamento', 'Insulfilm', 'Outro'];

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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function FindInstaller() {
  const navigate = useNavigate();
  const [activeState, setActiveState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [serviceType, setServiceType] = useState('PPF');
  const [notes, setNotes] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !whatsapp || !state || !city || !serviceType) return;
    
    setSubmitting(true);
    try {
      await supabase.from('installer_leads').insert({
        full_name: fullName,
        whatsapp,
        state,
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
    if (!state) setState(uf);
  };

  return (
    <div className={styles.page}>
      {/* ══════ HERO ══════ */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className={styles.heroTag}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Rede Nacional de Aplicadores Certificados
        </motion.div>

        <h1 className={styles.heroTitle}>
          {'NÃO PROCURE.'.split('').map((char, i) => (
            <motion.span
              key={`a-${i}`}
              style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
              initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.3, y: Math.random() * 40 - 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >{char === ' ' ? '\u00A0' : char}</motion.span>
          ))}
          <br />
          {'NÓS ENCONTRAMOS PARA VOCÊ.'.split('').map((char, i) => (
            <motion.span
              key={`b-${i}`}
              style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
              initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.3, y: Math.random() * 40 - 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 + i * 0.03, ease: [0.22, 1, 0.36, 1] }}
            >{char === ' ' ? '\u00A0' : char}</motion.span>
          ))}
        </h1>

        <motion.p
          className={styles.heroSubtitle}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          Seu veículo merece o melhor. Um <strong>especialista em proteção automotiva da própria NZ</strong> vai cuidar de cada detalhe — da escolha do aplicador certificado ideal à <strong>melhor negociação</strong> — com total responsabilidade e garantia nossa.
        </motion.p>

        <motion.div
          className={styles.counters}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.6 }}
        >
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
      </motion.section>

      {/* ══════ GRID: FORM + MAP ══════ */}
      <div className={styles.mainGrid}>
        {/* Form Panel */}
        <motion.div
          className={styles.formPanel}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className={styles.formHeader}>
            <h2>Solicite um Especialista NZ</h2>
            <p>Preencha seus dados e um especialista entrará em contato em até 2 horas úteis para cuidar de tudo por você.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nome completo *</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>WhatsApp *</label>
              <input
                type="tel"
                className={styles.formInput}
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado *</label>
                <select
                  className={styles.formSelect}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cidade *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Sua cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Veículo (opcional)</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ex: BMW X5 2024 Branca"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Serviço desejado *</label>
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
              <label className={styles.formLabel}>Observação (opcional)</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Conte-nos mais sobre o que precisa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'ENVIANDO...' : 'SOLICITAR CONTATO DE UM ESPECIALISTA'}
            </button>
            <p className={styles.submitSub}>Sem compromisso. Resposta em até 2h úteis.</p>
          </form>
        </motion.div>

        {/* Map Panel */}
        <motion.div
          className={styles.mapPanel}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className={styles.mapContainer}>
            <BrazilMap activeState={activeState} onStateClick={handleStateClick} />
          </div>
        </motion.div>
      </div>

      {/* ══════ STEPS ══════ */}
      <motion.section
        className={styles.stepsSection}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={styles.stepsTitle}>Como Funciona</h2>
        <div className={styles.stepsGrid}>
          {[
            { num: '1', title: 'Solicite', text: 'Preencha o formulário em 30 segundos. Sem compromisso, sem complicação.' },
            { num: '2', title: 'Especialista NZ', text: 'Um profissional NZ entra em contato em até 2h úteis pelo WhatsApp para entender suas necessidades.' },
            { num: '3', title: 'Instalação Garantida', text: 'Conectamos você ao aplicador certificado ideal, com a melhor negociação e garantia total NZ.' },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              <div className={styles.stepNumber}>{step.num}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ TRUST BAR ══════ */}
      <section className={styles.trustSection}>
        <div className={styles.trustGrid}>
          {[
            { icon: '🛡️', title: 'Garantia NZ sobre a instalação', text: 'A NZ assume a responsabilidade. Se algo sair errado, nós resolvemos.' },
            { icon: '💰', title: 'Melhor negociação garantida', text: 'Nosso especialista negocia diretamente com o aplicador para garantir o melhor custo-benefício.' },
            { icon: '🧑‍🔧', title: 'Suporte do início ao fim', text: 'Do primeiro contato à entrega do veículo, um especialista NZ acompanha cada etapa.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={styles.trustCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <span className={styles.trustIcon}>{item.icon}</span>
              <div>
                <h4 className={styles.trustTitle}>{item.title}</h4>
                <p className={styles.trustText}>{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ SUCCESS MODAL ══════ */}
      <AnimatePresence>
        {success && (
          <motion.div
            className={styles.successOverlay}
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
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Solicitação Enviada!</h3>
              <p className={styles.successText}>
                Obrigado, <strong>{submittedName}</strong>!<br /><br />
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
