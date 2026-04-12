import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FlowGloss.module.css';

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

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const staggerCards = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

// Icons
const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Total', spec: '175 Micras', detalhe: 'Proteção equilibrada para o dia a dia.' },
  { icon: EscudoVazioIcon, info: 'Material Base (Core)', spec: 'TPU Técnico', detalhe: 'Flexibilidade superior ao PU comum.' },
  { icon: CamadaIcon, info: 'Arquitetura', spec: 'Multicamada Otimizada', detalhe: 'Foco em custo-benefício sem perder durabilidade.' },
  { icon: RepelenciaIcon, info: 'Top Coating', spec: 'Revestimento Hidrofóbico', detalhe: 'Alta eficiência contra retenção de água.' },
  { icon: CertoIcon, info: 'Adesivo', spec: 'Alta Conformação', detalhe: 'Boa adaptação em curvas e fixação segura.' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '4 Anos', detalhe: 'Selo de Autenticidade NZPPF.' }
];

const benchmarkData = [
  { metric: 'Retenção de Brilho', desc: 'Medição de desgaste em lavagens', nz: [93, 89, 84], mercado: [90, 80, 71] },
  { metric: 'Resistência a Impactos', desc: 'Absorção de resíduos da via', nz: [90, 86, 81], mercado: [85, 75, 66] },
  { metric: 'Regeneração Térmica', desc: 'Capacidade de auto-cura', nz: [92, 85, 79], mercado: [88, 70, 52] },
  { metric: 'Nível de Repelência', desc: 'Efeito hidrofóbico diário', nz: [91, 84, 76], mercado: [86, 68, 50] }
];

const diferenciais = [
  { icon: RegeneracaoIcon, title: 'Regeneração Ativa', desc: 'Corrige micro riscos leves com ação térmica. Prolonga o aspecto de carro recém polido.', accent: 'Auto-cura leve', image: '/assets/images/nzppf_prime_regeneracao.png' },
  { icon: RepelenciaIcon, title: 'Superfície Autolimpante', desc: 'Reduz o acúmulo de água e sujeira. Facilita muito a lavagem e manutenção do carro.', accent: 'Hidrofobia', image: '/assets/images/flow_water.png' },
  { icon: CertoIcon, title: 'Brilho Estável', desc: 'Acabamento limpo, uniforme e profundo, proporcionando bom realce visual à pintura.', accent: 'Reflexo Premium', image: '/assets/images/nzppf_prime_brilho.png' },
  { icon: EscudoVazioIcon, title: 'Durabilidade Sólida', desc: 'Proteção contra arranhões, oxidação e chuva ácida que dura até 4 anos sem amarelamento.', accent: 'Garantia de 4 Anos', image: '/assets/images/flow_hero.png' }
];

const finishesData = [
  { src: '/assets/images/flow_finishes.png', title: 'VERSÕES DISPONÍVEIS', sub: 'Clear Matte, Clear Gloss, Black Gloss e Black Matte' }
];

export default function FlowGloss() {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'specs' | 'benchmark'>('specs');
  const [showOfferBtn, setShowOfferBtn] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const offerTimer = setTimeout(() => setShowOfferBtn(true), 5000);
    return () => { clearTimeout(offerTimer); };
  }, []);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    try {
      await fetch('https://ipehorttsrvjynnhyzhu.supabase.co/rest/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZWhvcnR0c3J2anlubmh5emh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDYwNTMsImV4cCI6MjA4MjE4MjA1M30.m6GW1AckPRGVP8wagfc9t4hzjvMOlHoEIskS36eKwDU', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZWhvcnR0c3J2anlubmh5emh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDYwNTMsImV4cCI6MjA4MjE4MjA1M30.m6GW1AckPRGVP8wagfc9t4hzjvMOlHoEIskS36eKwDU', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, source: 'NZPPF Flow - Cupom Surpresa' })
      });
      await fetch('https://formsubmit.co/ajax/joaovitor@nzdistribuidora.com.br', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ Nome: formData.name, Whatsapp: formData.phone, Email: formData.email, _subject: 'Novo Lead: Cupom Surpresa NZPPF Flow' })
      });
      setSubmitStatus('success');
      setTimeout(() => { setIsOfferModalOpen(false); setSubmitStatus('idle'); }, 3000);
    } catch (error) { console.error(error); setSubmitStatus('error'); }
  };

  return (
    <div className={styles.page}>

      {/* SEÇÃO 1: HERO */}
      <section className={styles.heroSection}>
        <div className={styles.heroBg}></div>
        <div className={`container ${styles.heroContent}`}>
          <Link to="/ppf" className={styles.backLink}>← Voltar para NZPPF</Link>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <h1 className={styles.heroTitle}>
              {'NZPPF FLOW GLOSS'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
                  initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.3, y: Math.random() * 60 - 30, x: Math.random() * 40 - 20 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >{char === ' ' ? '\u00A0' : char}</motion.span>
              ))}
            </h1>
            <p className={styles.heroSub}>
              {'TPU DE BASE TÉCNICA | DESEMPENHO CONFIÁVEL'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
                  initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.5 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.015, ease: [0.22, 1, 0.36, 1] }}
                >{char === ' ' ? '\u00A0' : char}</motion.span>
              ))}
            </p>
            {showOfferBtn && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.heroActions}>
                <button className={styles.offerBtn} onClick={() => setIsOfferModalOpen(true)}>
                  <img src={PresenteIcon} alt="" className={`${styles.offerBtnIcon} ${styles.accentIcon}`} />
                  REIVINDICAR CUPOM SURPRESA
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 2: MANIFESTO */}
      <section className={styles.manifestoSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <div className={styles.manifestoGrid}>
            <motion.div className={styles.manifestoText} variants={blurReveal}>
              <h2 className={styles.sectionTitle}>Entrada inteligente no mundo do PPF</h2>
              <p>O <strong>NZPPF FLOW GLOSS</strong> é a linha ideal para quem quer um material de tecnologia real, acabamento impecável e valor acessível. Desenvolvida para entregar performance consistente, ela combina TPU técnico com adesivo de alta performance.</p>
              <p>Com <strong>175 micras de espessura</strong> e um coating hidrofóbico que repele poeira e água, a linha Flow garante aplicação segura, flexibilidade em curvas complexas e um visual limpo e cristalino, superando as expectativas da categoria.</p>
              <p>Muito superior aos materiais PU comuns, o TPU Técnico NZ não resseca e não trinca, possuindo estabilidade dimensional prolongada e regeneração de micro-riscos leves pela ação do sol ou estufa.</p>
            </motion.div>
            <motion.div className={styles.manifestoHighlight} variants={slideFromRight}>
              <div className={styles.highlightQuote}>
                <p>Uma escolha esperta para quem exige custo-benefício sem sacrificar tecnologia e qualidade óptica. Garantia certificada estrutural de <strong>4 ANOS</strong> pela NZ.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 3: TECNOLOGIA */}
      <section className={styles.techSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Tecnologia Balanceada</motion.h2>
          <motion.div className={styles.techGrid} variants={scaleIn}>
            <div className={styles.techImagePanel}>
              <img src="/assets/images/flow_catalog.png" alt="Rolo Flow PPF TPU" className={styles.techImage} />
              <div className={styles.techImageOverlay}></div>
              <img src={CamadaIcon} className={`${styles.techDiagramIcon} ${styles.accentIcon}`} alt="" />
            </div>
            <div className={styles.techLayers}>
              {[
                { name: 'Revestimento Hidrofóbico (Top Coat)', desc: 'Menor acúmulo de sujeira e gotas d\'água' },
                { name: 'Base em TPU Técnico (Core)', desc: 'Excelente estética, durabilidade superior plástica e regeneração simples.' },
                { name: 'Adesivo Acrílico de Alta Conformação', desc: 'Aplicação amigável até nas geometrias mais complexas.' }
              ].map((layer, i) => (
                <motion.div key={i} className={styles.layerCard} variants={slideFromRight}>
                  <span className={styles.layerNumber}>0{i + 1}</span>
                  <div>
                    <h4 className={styles.layerName}>{layer.name}</h4>
                    <p className={styles.layerDesc}>{layer.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SEÇÃO 4: DIFERENCIAIS */}
      <section className={styles.differentialsSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={staggerCards}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Diferenciais Práticos</motion.h2>
          <div className={styles.differentialsGrid}>
            {diferenciais.map((item, i) => (
              <motion.div key={i} className={styles.diffCard} variants={scaleIn}>
                <div className={styles.diffCardImageWrap}>
                  <img src={item.image} alt={item.title} className={styles.diffCardImage} />
                  <div className={styles.diffCardImageOverlay}></div>
                </div>
                <div className={styles.diffCardBody}>
                  <img src={item.icon} alt="" className={`${styles.diffCardIcon} ${styles.accentIcon}`} />
                  <h3 className={styles.diffCardTitle}>{item.title}</h3>
                  <p className={styles.diffCardDesc}>{item.desc}</p>
                  <span className={styles.diffCardAccent}>{item.accent}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 5: ACABAMENTOS */}
      <section className={styles.finishesSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Acabamentos e Versões Disponíveis</motion.h2>
          <motion.div className={styles.finishesShowcase} variants={scaleIn}>
            <div className={styles.finishesImageArea}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={0}
                  src={finishesData[0].src}
                  alt={finishesData[0].title}
                  className={styles.finishesImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                />
              </AnimatePresence>
            </div>
            <div className={styles.finishesTabs}>
              <button className={`${styles.finishTab} ${styles.finishTabActive}`}>
                <span className={styles.finishTabTitle}>Versatilidade</span>
                <span className={styles.finishTabSub}>A Linha FLOW está disponível nas versões Clear Gloss (Transparente Brilho), Clear Matte (Transparente Fosco), Black Gloss (Opaco Brilho) e Black Matte (Opaco Fosco).</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SEÇÃO 6: CTA FICHA */}
      <section className={styles.specsSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div className={styles.specsCard} variants={scaleIn}>
            <div className={styles.specsCardText}>
              <h2 className={styles.sectionTitle}>Ficha Técnica</h2>
              <p className={styles.specsDesc}>Confira os aspectos de engenharia da linha de entrada NZPPF Flow e visualize como ela supera os índices normais do mercado de películas desta faixa.</p>
            </div>
            <div className={styles.specsCardActions}>
              <button className={styles.specsBtn} onClick={() => { setModalTab('specs'); setIsTableModalOpen(true); }}>
                <img src={CamadaIcon} alt="" className={`${styles.specsBtnIcon} ${styles.accentIcon}`} />
                ANÁLISE TÉCNICA
              </button>
              <button className={styles.specsBtnOutline} onClick={() => { setModalTab('benchmark'); setIsTableModalOpen(true); }}>
                BENCHMARK DE PERFORMANCE
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* MODAL FICHA/BENCHMARK */}
      {isTableModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTableModalOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsTableModalOpen(false)}>FECHAR ✕</button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>SPEC SHEET: FLOW</h2>
              <div className={styles.modalTabs}>
                <button className={`${styles.modalTabBtn} ${modalTab === 'specs' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('specs')}>Análise Técnica</button>
                <button className={`${styles.modalTabBtn} ${modalTab === 'benchmark' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('benchmark')}>Desgaste (4 Anos)</button>
              </div>
            </div>

            {modalTab === 'specs' && (
              <motion.div key="specs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <div className={styles.tHead}><div className={styles.thCol}>INFORMAÇÕES</div><div className={styles.thCol}>ESPECIFICAÇÃO</div><div className={styles.thCol}>DETALHES</div></div>
                <div className={styles.tBody}>
                  {tabelaTecnica.map((row, i) => (
                    <div className={styles.tRow} key={i}>
                      <div className={`${styles.tdCol} ${styles.tdStrong}`}><img src={row.icon} className={`${styles.modalIcon} ${styles.accentIcon}`} alt=""/> {row.info}</div>
                      <div className={styles.tdCol}>{row.spec}</div>
                      <div className={`${styles.tdCol} ${styles.tdMute}`}>{row.detalhe}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {modalTab === 'benchmark' && (
              <motion.div key="benchmark" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}><div className={styles.legendDotNz}></div> NZPPF Flow (TPU)</div>
                  <div className={styles.legendItem}><div className={styles.legendDotCom}></div> PU Comum</div>
                </div>
                {benchmarkData.map((item, index) => {
                  /* Plotting 3 points for Flow (Year 1, Year 2, Year 4) */
                  const getLinePath = (data: number[]) => data.map((val, i) => { const x = 40 + i * (720 / 2); const y = 280 - (val / 100) * 200; return `${i === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(' ');
                  const getAreaPath = (data: number[]) => getLinePath(data) + ` L 760 280 L 40 280 Z`;
                  return (
                    <div key={index} className={styles.svgChartContainer}>
                      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                        <h4 style={{ color: "#fff", fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "0.3rem", fontFamily: "var(--font-heading)" }}>{item.metric}</h4>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>{item.desc}</span>
                      </div>
                      <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto' }}>
                        <defs>
                          <linearGradient id={`gNz-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0daebd" stopOpacity="0.4" /><stop offset="100%" stopColor="#0daebd" stopOpacity="0" /></linearGradient>
                          <linearGradient id={`gCm-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#888" stopOpacity="0.2" /><stop offset="100%" stopColor="#888" stopOpacity="0" /></linearGradient>
                          <filter id="glow"><feGaussianBlur stdDeviation="3" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        {[0,25,50,75,100].map(y => { const yP = 280-(y/100)*200; return <g key={y}><line x1="40" y1={yP} x2="760" y2={yP} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={y===0?"none":"4 4"}/><text x="10" y={yP+4} fill="#666" fontSize="12" fontFamily="monospace">{y}%</text></g> })}
                        {['Ano 1','Ano 2','Ano 4'].map((l,i) => <text key={l} x={40+i*(720/2)} y="310" fill="#888" fontSize="12" fontFamily="var(--font-heading)" textAnchor="middle">{l}</text>)}
                        <motion.path d={getAreaPath(item.mercado)} fill={`url(#gCm-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}/>
                        <motion.path d={getLinePath(item.mercado)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut"}}/>
                        <motion.path d={getAreaPath(item.nz)} fill={`url(#gNz-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}/>
                        <motion.path d={getLinePath(item.nz)} fill="none" stroke="#0daebd" strokeWidth="4" filter="url(#glow)" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut",delay:0.2}}/>
                        {item.nz.map((v,i) => { const x=40+i*(720/2); const y=280-(v/100)*200; return <motion.circle key={`n${i}`} cx={x} cy={y} r="5" fill="#0daebd" stroke="#111" strokeWidth="2" initial={{scale:0}} animate={{scale:1}} transition={{delay:1.2+i*0.1}}/> })}
                        {item.mercado.map((v,i) => { const x=40+i*(720/2); const y=280-(v/100)*200; return <motion.circle key={`c${i}`} cx={x} cy={y} r="4" fill="#888" initial={{scale:0}} animate={{scale:1}} transition={{delay:1+i*0.1}}/> })}
                      </svg>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* MODAL OFERTA */}
      {isOfferModalOpen && (
        <div className={styles.offerOverlay} onClick={() => setIsOfferModalOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={styles.offerModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsOfferModalOpen(false)} style={{ position: 'absolute', top: 15, right: 15 }}>✕</button>
            <div className={styles.offerHeader}><h3>Resgatar Desconto Especial</h3><p>Deixe seu contato para receber nossa condição exclusiva no NZPPF Flow.</p></div>
            {submitStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#25D366' }}>
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" style={{ margin: '0 auto 1rem' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h4>Cupom Resgatado!</h4><p style={{ color: '#aaa', marginTop: '0.5rem', fontSize: '0.9rem' }}>Nossa equipe entrará em contato em breve.</p>
              </div>
            ) : (
              <form className={styles.offerForm} onSubmit={handleOfferSubmit}>
                <input type="text" placeholder="Seu Nome completo" className={styles.offerInput} required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="email" placeholder="Seu E-mail" className={styles.offerInput} required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <input type="tel" placeholder="Seu WhatsApp" className={styles.offerInput} required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                <button type="submit" className={styles.offerSubmitBtn} disabled={submitStatus === 'loading'}>{submitStatus === 'loading' ? 'Enviando...' : 'GARANTIR MEU DESCONTO'}</button>
                {submitStatus === 'error' && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center' }}>Erro ao enviar. Tente pelo WhatsApp.</p>}
              </form>
            )}
            <div className={styles.whatsappDivider}>Ou se preferir</div>
            <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.whatsappLink}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M187.58 144.84l-32-16a8 8 0 0 0-8 .5l-14.69 9.8a40.55 40.55 0 0 1-38.33-38.33l9.8-14.69a8 8 0 0 0 .5-8l-16-32A8 8 0 0 0 80 40a48 48 0 0 0-48 48c0 71.01 56.99 128 128 128a48 48 0 0 0 48-48a8 8 0 0 0-6.42-7.16Z"/></svg>
              CHAMAR NO WHATSAPP
            </a>
          </motion.div>
        </div>
      )}
    </div>
  );
}
