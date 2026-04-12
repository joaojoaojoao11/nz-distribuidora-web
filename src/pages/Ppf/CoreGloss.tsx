import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Reusing FlowGloss styles conceptually, they are globally loaded module-like patterns from PrimeGloss.
// We'll import PrimeGloss.module.css to maintain structural purity while overriding colors inline or via data-attributes if necessary.
import styles from './PrimeGloss.module.css';

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

// Icons (reusing system generic icons)
const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

const coreColor = '#4A7C59'; // Tactical Green

const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Média', spec: '150-180 Micras', detalhe: 'Garante resistência essencial contra pedriscos.' },
  { icon: EscudoVazioIcon, info: 'Engenharia de Base', spec: '80% TPU + 20% PVC', detalhe: 'O Híbrido Inteligente perfeito para Custo-Benefício.' },
  { icon: CamadaIcon, info: 'Estruturação', spec: 'Multicamadas', detalhe: 'Projetada para não rasgar no tensionamento grave.' },
  { icon: RepelenciaIcon, info: 'Top Coating', spec: 'Proteção Acelerada', detalhe: 'Camada de fechamento superior com repelência hidrofóbica.' },
  { icon: CertoIcon, info: 'Cola (Adesivo)', spec: 'Easy-Tack Reposicionável', detalhe: 'Garante zero marcas de tração e flexibilidade ao aplicador.' },
  { icon: RegeneracaoIcon, info: 'Garantia Comprovada', spec: '3 Anos', detalhe: 'Certificação formal da fábrica para blindar a sua loja.' }
];

const benchmarkData = [
  { metric: 'Facilidade de Aplicação', desc: 'Desempenho sob estiramento e re-posicionamento', nz: [95, 88, 80], mercado: [80, 65, 50] },
  { metric: 'Relação Custo vs Durabilidade', desc: 'A matemática da margem', nz: [96, 90, 85], mercado: [70, 60, 50] },
  { metric: 'Barreira Hidrofóbica', desc: 'Resistência a chuvas', nz: [87, 80, 74], mercado: [80, 60, 40] },
  { metric: 'Manutenção do Brilho (Meses)', desc: 'Previsibilidade do brilho (Top Coat)', nz: [90, 84, 80], mercado: [75, 60, 55] }
];

const diferenciais = [
  { icon: CertoIcon, title: 'Matemática da Oficina', desc: 'Com o custo de um PVC premium e qualidade de um TPU avançado, seu markup dobra na instalação sem retorno pra garantia.', accent: '80% TPU / 20% PVC', image: '/assets/images/core_catalog_car.png' },
  { icon: RepelenciaIcon, title: 'Coating Super Premium', desc: 'O cliente final exige repelência, água rolando do capô e sujeira indo embora rápido. O Top Coat do Core entrega exatamente isso.', accent: 'Hidrofobia', image: '/assets/images/core_water.png' },
  { icon: CamadaIcon, title: 'Adesivo Tolerante (Easy-Tack)', desc: 'A cola não agride a pintura no tracionamento e não trava em excesso no capô. O instalador ganha horas no fim da semana.', accent: 'Instalação Ágil', image: '/assets/images/core_clear_gloss.png' },
  { icon: EscudoVazioIcon, title: 'Garantia Blindada de 3 Anos', desc: 'Você vende o serviço de olhos fechados. Uma garantia de entrada que destrói a vida útil da maoria dos vinis TPH do mercado.', accent: 'Segurança Financeira', image: '/assets/images/core_hero.png' }
];

const finishesData = [
  { src: '/assets/images/core_clear_gloss.png', title: 'Core Gloss', sub: 'O clássico inquestionável. Brilho espelhado, correção de orange-peel e proteção transparente e absoluta contra arranhões do tempo.', tech: 'Blend TPU/PVC Brilho' },
  { src: '/assets/images/core_clear_matte.png', title: 'Core Matte', sub: 'Fosco acetinado bruto. Transforma o aspecto do carro com uma difusão macia e furtiva.', tech: 'Blend TPU/PVC Fosco' },
  { src: '/assets/images/core_black_gloss.png', title: 'Core Black', sub: 'Preto puro absoluto refletivo. Bloqueia a luz original da carroceria entregando visual de fibra envernizada.', tech: 'Blend Black Pigmentado' },
  { src: '/assets/images/core_black_matte.png', title: 'Core Black Matte', sub: 'Dark Stealth. O topo da agressividade visual na linha Core com absorção opaca implacável.', tech: 'Blend Black Matte' }
];

export default function CoreGloss() {
  const [currentFinish, setCurrentFinish] = useState(0);
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
        headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZWhvcnR0c3J2anlubmh5emh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDYwNTMsImV4cCI6MjA4MjE4MjA1M30.m6GW1AckPRGVP8wagfc9t4hzjvMOlHoEIskS36eKwDU', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZWhvcnR0c3J2anlubmh5emh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDYwNTMsImV4cCI6MjA4MjE4MjA1M30.m6GW1AckPRGVP8wagfc9t4hzjvMOlHoEIskS36eKwDU' },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, source: 'NZPPF Core - Lead Direto' })
      }).catch(() => null); // Silent fallback if token is mocked
      await fetch('https://formsubmit.co/ajax/joaovitor@nzdistribuidora.com.br', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ Nome: formData.name, Whatsapp: formData.phone, Email: formData.email, _subject: 'Novo Lead: Contato NZPPF Core Gloss' })
      });
      setSubmitStatus('success');
      setTimeout(() => { setIsOfferModalOpen(false); setSubmitStatus('idle'); }, 3000);
    } catch (error) { console.error(error); setSubmitStatus('error'); }
  };

  return (
    <div className={styles.page}>

      {/* SEÇÃO 1: HERO */}
      <section className={styles.heroSection}>
        {/* Usando inline style pra trocar de vermelho (Luxury) para verde tático (Core) */}
        <div className={styles.heroBg} style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(14, 14, 18, 0.4) 0%, rgba(14, 14, 18, 1) 100%), radial-gradient(circle at 50% 30%, rgba(74, 124, 89, 0.15) 0%, rgba(14, 14, 18, 1) 50%), url(/assets/images/core_hero.png)` 
        }}></div>
        <div className={`container ${styles.heroContent}`}>
          <Link to="/ppf" className={styles.backLink}>← Voltar para NZPPF</Link>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <h1 className={styles.heroTitle}>
              {'NZPPF CORE GLOSS'.split('').map((char, i) => (
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
              {'HÍBRIDO INTELIGENTE | 80% TPU + 20% PVC'.split('').map((char, i) => (
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
                <button className={styles.offerBtn} style={{ background: coreColor, color: '#fff', border: 'none' }} onClick={() => setIsOfferModalOpen(true)}>
                  <img src={PresenteIcon} alt="" className={`${styles.offerBtnIcon}`} style={{ filter: 'brightness(0) invert(1)' }} />
                  COTAÇÃO ESPECIAL PARA OFICINAS
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
              <h2 className={styles.sectionTitle}>O mercado exigia preço. Nós entregamos <span style={{ color: coreColor }}>engenharia</span>.</h2>
              <p>Você conhece a realidade da oficina: quando o cliente espreme o orçamento, a loja inevitavelmente empurra um vinil barato. <strong>O aplicador sofre na instalação</strong>, a cola trava, o material resseca, e o retorno à garantia destrói toda a sua margem.</p>
              <p>Por outro lado, utilizar um rolo de TPU PURO em um projeto de entrada é assassinar o seu caixa. O <strong>NZPPF CORE</strong> foi criado exclusivamente para resolver a matemática da bancada.</p>
              <p>Desenvolvemos um <strong>blend exato de 80% de TPU premium</strong> para garantir elasticidade e proteção real, fundido a 20% de PVC de alta resistência. O resultado? O melhor Ticket Médio que a sua operação de volume já teve.</p>
            </motion.div>
            <motion.div className={styles.manifestoHighlight} variants={slideFromRight}>
              <div className={styles.highlightQuote} style={{ borderLeftColor: coreColor, background: 'linear-gradient(90deg, rgba(74, 124, 89, 0.08) 0%, rgba(14, 14, 18, 0) 100%)' }}>
                <p>O ativo da sua operação não é uma película barata. É previsibilidade de aplicação, nenhuma bolha, cliente feliz e garantia de <strong>3 anos certificada</strong> pela marca que sustenta sua operação: a NZ.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 3: TECNOLOGIA */}
      <section className={styles.techSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>A Tecnologia por trás da <span style={{ color: coreColor }}>Margem</span></motion.h2>
          <motion.div className={styles.techGrid} variants={scaleIn}>
            <div className={styles.techImagePanel}>
              <img src="/assets/images/core_layers.png" alt="Camadas da Película Core TPU" className={styles.techImage} />
              <div className={styles.techImageOverlay} style={{ background: 'linear-gradient(to top, rgba(14,14,18,1) 0%, rgba(14,14,18,0.2) 100%)' }}></div>
              <img src={CamadaIcon} className={styles.techDiagramIcon} style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(31%) saturate(543%) hue-rotate(85deg) brightness(88%) contrast(93%)' }} alt="" />
            </div>
            <div className={styles.techLayers}>
              {[
                { name: 'Garantia de 3 Anos (Certificada)', desc: 'Não é promessa de boca. Você vende com tranquilidade, e o cliente sai protegido. Zera o seu risco natural com retornos.' },
                { name: 'O Fim do Desperdício no Corte', desc: 'Material híbrido pensado para esticar firmemente em quinas de caminhonetes, ancorando sem criar dedos (fingers) mortos.' },
                { name: 'Top Coat Ocultador', desc: 'Um revestimento robusto acima do Core projetado para esconder pequenas imperfeições de "casca de laranja" em pinturas castigadas.' }
              ].map((layer, i) => (
                <motion.div key={i} className={styles.layerCard} variants={slideFromRight} style={{ borderLeftColor: i === 0 ? coreColor : 'rgba(255,255,255,0.05)' }}>
                  <span className={styles.layerNumber} style={{ color: coreColor }}>0{i + 1}</span>
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
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Diferenciais Brutos de Fechamento</motion.h2>
          <div className={styles.differentialsGrid}>
            {diferenciais.map((item, i) => (
              <motion.div key={i} className={styles.diffCard} variants={scaleIn}>
                <div className={styles.diffCardImageWrap}>
                  <img src={item.image} alt={item.title} className={styles.diffCardImage} />
                  <div className={styles.diffCardAccent} style={{ background: coreColor }}>{item.accent}</div>
                </div>
                <div className={styles.diffCardContent}>
                  <img src={item.icon} className={styles.diffCardIcon} style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(31%) saturate(543%) hue-rotate(85deg) brightness(88%) contrast(93%)' }} alt="" />
                  <h3 className={styles.diffCardTitle}>{item.title}</h3>
                  <p className={styles.diffCardDesc}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 5: ACABAMENTOS */}
      <section className={styles.finishesSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Um ecossistema, 4 acabamentos</motion.h2>
          <motion.div className={styles.finishesShowcase} variants={scaleIn}>
            <div className={styles.finishesImageArea}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentFinish}
                  src={finishesData[currentFinish].src}
                  alt={finishesData[currentFinish].title}
                  className={styles.finishesImage}
                  initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>
            </div>
            <div className={styles.finishesTabs}>
              {finishesData.map((item, index) => (
                <button 
                  key={index} 
                  className={`${styles.finishTab} ${currentFinish === index ? styles.finishTabActive : ''}`}
                  onClick={() => setCurrentFinish(index)}
                  style={currentFinish === index ? { borderLeftColor: coreColor, backgroundColor: 'rgba(74, 124, 89, 0.05)' } : {}}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className={styles.finishTabTitle}>{item.title}</span>
                    {currentFinish === index && <span style={{ fontSize: '0.7rem', color: coreColor, fontFamily: 'monospace', letterSpacing: '1px' }}>{item.tech}</span>}
                  </div>
                  <span className={styles.finishTabSub}>{item.sub}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SEÇÃO 6: CTA FICHA */}
      <section className={styles.specsSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div className={styles.specsCard} variants={scaleIn} style={{ borderTop: `1px solid ${coreColor}` }}>
            <div className={styles.specsCardText}>
              <h2 className={styles.sectionTitle}>Ficha Técnica</h2>
              <p className={styles.specsDesc}>A matemática não falha: consulte todos os dados estruturais e compare a performance contra o PU TPH de base do mercado atual.</p>
            </div>
            <div className={styles.specsCardActions}>
              <button className={styles.specsBtn} style={{ background: coreColor }} onClick={() => { setModalTab('specs'); setIsTableModalOpen(true); }}>
                <img src={CamadaIcon} className={styles.specsBtnIcon} style={{ filter: 'brightness(0) invert(1)' }} alt="" />
                ANÁLISE ESTRUTURAL
              </button>
              <button className={styles.specsBtnOutline} onClick={() => { setModalTab('benchmark'); setIsTableModalOpen(true); }}>
                BENCHMARK DE PERFORMANCE
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* MODAL FICHA TÉCNICA */}
      <AnimatePresence>
        {isTableModalOpen && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsTableModalOpen(false)}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={() => setIsTableModalOpen(false)}>FECHAR ✕</button>
              
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>INTELIGÊNCIA ARQUITETURAL — CORE</h3>
                <div className={styles.modalTabs}>
                  <button className={`${styles.modalTabBtn} ${modalTab === 'specs' ? styles.modalTabActive : ''}`} style={modalTab === 'specs' ? { color: coreColor, borderBottomColor: coreColor } : {}} onClick={() => setModalTab('specs')}>Análise Técnica</button>
                  <button className={`${styles.modalTabBtn} ${modalTab === 'benchmark' ? styles.modalTabActive : ''}`} style={modalTab === 'benchmark' ? { color: coreColor, borderBottomColor: coreColor } : {}} onClick={() => setModalTab('benchmark')}>Benchmark</button>
                </div>
              </div>

              <div className={styles.modalBody}>
                {modalTab === 'specs' && (
                  <div className={styles.tTable}>
                    <div className={styles.tHead}>
                      <div className={styles.thCol}>Parâmetro Estrutural</div>
                      <div className={styles.thCol}>Especificação (Híbrida)</div>
                      <div className={styles.thCol}>Impacto na Operação</div>
                    </div>
                    <div className={styles.tBody}>
                      {tabelaTecnica.map((row, i) => (
                        <div key={i} className={styles.tRow}>
                          <div className={`${styles.tdCol} ${styles.tdStrong}`}>
                            <img src={row.icon} className={styles.modalIcon} style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(31%) saturate(543%) hue-rotate(85deg) brightness(88%) contrast(93%)' }} alt="" />
                            {row.info}
                          </div>
                          <div className={styles.tdCol}>{row.spec}</div>
                          <div className={`${styles.tdCol} ${styles.tdMute}`}>{row.detalhe}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {modalTab === 'benchmark' && (
                  <motion.div key="benchmark" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}><div className={styles.legendDotNz} style={{ background: coreColor, width: 10, height: 10, borderRadius: '50%', display: 'inline-block', marginRight: 8 }}></div> NZPPF Core Gloss</div>
                      <div className={styles.legendItem}><div className={styles.legendDotCom} style={{ background: '#888', width: 10, height: 10, borderRadius: '50%', display: 'inline-block', marginRight: 8 }}></div> Média Mercado (PU/TPH)</div>
                    </div>
                    {benchmarkData.map((item, index) => {
                      const getLinePath = (data: number[]) => data.map((val, i) => { const x = 40 + i * (720 / 2); const y = 280 - (val / 100) * 200; return `${i === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(' ');
                      const getAreaPath = (data: number[]) => getLinePath(data) + ` L 760 280 L 40 280 Z`;
                      return (
                        <div key={index} className={styles.svgChartContainer} style={{ marginTop: '2rem' }}>
                          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                            <h4 style={{ color: "#fff", fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "0.3rem", fontFamily: "var(--font-heading)" }}>{item.metric}</h4>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>{item.desc}</span>
                          </div>
                          <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto' }}>
                            <defs>
                              <linearGradient id={`gNz-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={coreColor} stopOpacity="0.4" /><stop offset="100%" stopColor={coreColor} stopOpacity="0" /></linearGradient>
                              <linearGradient id={`gCm-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#888" stopOpacity="0.2" /><stop offset="100%" stopColor="#888" stopOpacity="0" /></linearGradient>
                              <filter id="glow"><feGaussianBlur stdDeviation="3" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            </defs>
                            {[0,25,50,75,100].map(y => { const yP = 280-(y/100)*200; return <g key={y}><line x1="40" y1={yP} x2="760" y2={yP} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={y===0?"none":"4 4"}/><text x="10" y={yP+4} fill="#666" fontSize="12" fontFamily="monospace">{y}%</text></g> })}
                            {['Ano 1','Ano 2','Ano 3'].map((l,i) => <text key={l} x={40+i*(720/2)} y="310" fill="#888" fontSize="12" fontFamily="var(--font-heading)" textAnchor="middle">{l}</text>)}
                            <motion.path d={getAreaPath(item.mercado)} fill={`url(#gCm-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}/>
                            <motion.path d={getLinePath(item.mercado)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut"}}/>
                            <motion.path d={getAreaPath(item.nz)} fill={`url(#gNz-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}/>
                            <motion.path d={getLinePath(item.nz)} fill="none" stroke={coreColor} strokeWidth="4" filter="url(#glow)" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut",delay:0.2}}/>
                            {item.nz.map((v,i) => { const x=40+i*(720/2); const y=280-(v/100)*200; return <motion.circle key={`n${i}`} cx={x} cy={y} r="5" fill={coreColor} stroke="#111" strokeWidth="2" initial={{scale:0}} animate={{scale:1}} transition={{delay:1.2+i*0.1}}/> })}
                            {item.mercado.map((v,i) => { const x=40+i*(720/2); const y=280-(v/100)*200; return <motion.circle key={`c${i}`} cx={x} cy={y} r="4" fill="#888" initial={{scale:0}} animate={{scale:1}} transition={{delay:1+i*0.1}}/> })}
                          </svg>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEAD CAPTURE MODAL OPACIONAL */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOfferModalOpen(false)}>
            <motion.div className={styles.leadModalContent} initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setIsOfferModalOpen(false)}>×</button>
              
              {submitStatus === 'success' ? (
                <div className={styles.leadModalSuccess}>
                  <div className={styles.successIcon} style={{ background: `rgba(74, 124, 89, 0.2)`, color: coreColor }}>✓</div>
                  <h3>Acesso Liberado!</h3>
                  <p>Um consultor especialista em custo-benefício NZPPF fará contato em instantes na sua oficina.</p>
                </div>
              ) : (
                <>
                  <div className={styles.leadModalHeader}>
                    <img src={PresenteIcon} alt="" className={styles.leadModalIcon} style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(31%) saturate(543%) hue-rotate(85deg) brightness(88%) contrast(93%)' }} />
                    <h3>Cotação Exclusiva NZPPF CORE</h3>
                    <p>Feche a matemática da sua oficina agora. Preencha e validaremos o seu benefício de volume.</p>
                  </div>
                  <form className={styles.leadModalForm} onSubmit={handleOfferSubmit}>
                    <div className={styles.formGroup}>
                      <label>Seu Nome Completo *</label>
                      <input type="text" required placeholder="Ex: Lucas Martins" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={submitStatus === 'loading'} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>WhatsApp (Com DDD) *</label>
                      <input type="tel" required placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={submitStatus === 'loading'} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>E-mail Corporativo *</label>
                      <input type="email" required placeholder="loja@exemplo.com.br" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={submitStatus === 'loading'} />
                    </div>
                    <button type="submit" className={styles.formSubmitBtn} disabled={submitStatus === 'loading'} style={{ background: coreColor, color: '#fff' }}>
                      {submitStatus === 'loading' ? 'PROCESSANDO...' : 'ENVIAR E VER VALORES'}
                    </button>
                    {submitStatus === 'error' && <p className={styles.formError}>Ocorreu um erro ao enviar. Preencha corretamente ou tente de novo mais tarde.</p>}
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
