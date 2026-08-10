import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import PpfFaqSection from '../../components/Ppf/PpfFaqSection';
import { SITE_URL } from '../../lib/siteConfig';
import styles from './LuxuryGloss.module.css';
import { supabase } from '../../lib/supabase';

const seoDescription = 'PPF TPU alifático com nano-revestimento japonês: +32% de brilho, regeneração térmica e autolimpeza. 190μ e 12 anos de garantia. Para instaladores exigentes.';
const productSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "NZPPF Luxury Gloss",
  "description": seoDescription,
  "brand": { "@type": "Brand", "name": "NZPPF" },
  "category": "Película de Proteção de Pintura (PPF)",
  "url": `${SITE_URL}/ppf/luxury-gloss`
});


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
  { icon: CamadaIcon, info: 'Espessura Total (Premium)', spec: '190 Micras (7.5 mil)', detalhe: 'Camada robusta dimensionada para máxima dissipação de impacto.' },
  { icon: EscudoVazioIcon, info: 'Material Base (Core)', spec: '100% TPU Alifático Premium', detalhe: 'Poliuretano automotivo com estabilização anti-UV (não amarela).' },
  { icon: CamadaIcon, info: 'Arquitetura do Filme', spec: 'Coextrusão em 4 Camadas', detalhe: 'Liner Protetor, Adesivo PSA, Core TPU e Top Coat.' },
  { icon: RepelenciaIcon, info: 'Top Coat (Superfície)', spec: 'Nano-Revestimento Japonês', detalhe: 'Propriedades hidrofóbicas extremas e auto-cura térmica.' },
  { icon: CertoIcon, info: 'Tecnologia de Adesivo', spec: 'Acrílico PSA Reposicionável', detalhe: 'Instalação limpa e remoção segura a longo prazo (Zero Resíduos).' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '12 Anos Certificados', detalhe: 'Respaldo contra amarelamento, delaminação e perda de adesão.' }
];

const benchmarkData = [
  { metric: 'Retenção de Brilho (Gloss Units)', desc: 'Medição em laboratório simulando lavagens e intempéries', nz: [99.5, 97.2, 98.8, 94.6, 95.5], mercado: [95.0, 86.5, 82.0, 71.5, 62.0] },
  { metric: 'Resistência a Impactos (Impact Absorption)', desc: 'Absorção de energia cinética superficial', nz: [98.8, 97.5, 98.0, 94.2, 93.5], mercado: [92.0, 81.0, 76.5, 65.0, 51.5] },
  { metric: 'Regeneração Térmica (Self-Healing)', desc: 'Capacidade de auto-cura de micro-riscos', nz: [99.0, 99.5, 96.8, 95.5, 93.0], mercado: [96.5, 84.0, 68.5, 52.0, 32.5] },
  { metric: 'Nível de Repelência (Beading Angle)', desc: 'Efeito hidrofóbico e facilidade de limpeza', nz: [98.5, 95.2, 96.0, 91.5, 89.8], mercado: [94.0, 81.5, 66.0, 52.5, 38.0] }
];

const diferenciais = [
  { icon: RegeneracaoIcon, title: 'Regeneração Térmica', desc: 'Micro-riscos desaparecem sozinhos com o calor do sol. Tecnologia de auto-cura inteligente.', accent: 'Auto-cura com calor', image: '/assets/images/nzppf_regeneracao.png' },
  { icon: RepelenciaIcon, title: 'Mega Repelência', desc: '30% mais repelente que o padrão de mercado. Água, poeira e sujeira deslizam pela superfície.', accent: 'Proteção contra sujeira', image: '/assets/images/nzppf_repelencia.png' },
  { icon: CertoIcon, title: 'Super Brilho +32%', desc: 'Nano-Revestimento japonês que potencializa o brilho original da pintura em até 32%.', accent: '+32% de Brilho', image: '/assets/images/nzppf_super_brilho.png' },
  { icon: EscudoVazioIcon, title: 'Blindagem Total', desc: 'TPU Alifático de 190 micras protege contra riscos, impactos, oxidação e detritos da estrada.', accent: '12 Anos de Garantia', image: '/assets/images/nzppf_premium_layers_tpu.png' }
];

const finishesCarousel = [
  { src: '/assets/images/nzppf_super_brilho.png', title: 'GLOSS', sub: 'Brilho espelhado vitrificado' },
  { src: '/assets/images/nzppf_matte.png', title: 'MATTE', sub: 'Toque suave aveludado' },
  { src: '/assets/images/nzppf_black.png', title: 'BLACK', sub: 'Luxo absoluto profundo' }
];

export default function LuxuryGloss() {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'specs' | 'benchmark'>('specs');
  const [showOfferBtn, setShowOfferBtn] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeFinish, setActiveFinish] = useState(0);

  useEffect(() => {
    const offerTimer = setTimeout(() => setShowOfferBtn(true), 5000);
    const slideTimer = setInterval(() => setActiveFinish((p) => (p + 1) % finishesCarousel.length), 4000);
    return () => { clearTimeout(offerTimer); clearInterval(slideTimer); };
  }, []);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    try {
      await supabase.from('leads').insert({ name: formData.name, email: formData.email, phone: formData.phone, source: 'NZPPF Luxury - Cupom Surpresa' });
      await fetch('https://formsubmit.co/ajax/joaovitor@nzdistribuidora.com.br', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ Nome: formData.name, Whatsapp: formData.phone, Email: formData.email, _subject: 'Novo Lead: Cupom Surpresa NZPPF Luxury' })
      });
      setSubmitStatus('success');
      setTimeout(() => { setIsOfferModalOpen(false); setSubmitStatus('idle'); }, 3000);
    } catch (error) { console.error(error); setSubmitStatus('error'); }
  };

  return (
    <div className={styles.page}>
      <SEO
        title="NZPPF Luxury Gloss — PPF 190μ com 12 Anos de Garantia"
        description={seoDescription}
        canonicalUrl="/ppf/luxury-gloss"
        schema={productSchema}
        type="product"
      />

      {/* ═══════════════════════════════════════════
          SEÇÃO 1: HERO DO PRODUTO 
          ═══════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.heroBg}></div>
        <div className={`container ${styles.heroContent}`}>
          <Link to="/ppf" className={styles.backLink}>← Voltar para NZPPF</Link>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <h1 className={styles.heroTitle}>
              {'NZPPF LUXURY GLOSS'.split('').map((char, i) => (
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
              {'TPU de Última Geração | + 32% Mais Brilho'.split('').map((char, i) => (
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
                  <img src={PresenteIcon} alt="" className={`${styles.offerBtnIcon} ${styles.goldIcon}`} />
                  REIVINDICAR CUPOM SURPRESA
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 2: MANIFESTO (Texto de apresentação)
          ═══════════════════════════════════════════ */}
      <section className={styles.manifestoSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <div className={styles.manifestoGrid}>
            <motion.div className={styles.manifestoText} variants={blurReveal}>
              <h2 className={styles.sectionTitle}>A Melhor Matéria-Prima do Mundo</h2>
              <p><strong>Pare de sofrer com riscos, manchas de água e detritos na estrada.</strong> O nosso TPU Alifático de 190 micras atua como um escudo invisível de alta resistência, blindando a pintura original contra os piores cenários do trânsito brasileiro.</p>
              <p>Você não precisa mais escolher entre proteção e estética. O Nano-Revestimento de tecnologia japonesa impulsiona o nível de brilho em até +32%, proporcionando um acabamento vitrificado, profundo e espelhado que atrai olhares por onde passa.</p>
              <p>Graças ao polímero inteligente de regeneração térmica avançada, os pequenos arranhões e as marcas de lavagem somem sozinhos apenas com o calor do sol.</p>
            </motion.div>
            <motion.div className={styles.manifestoHighlight} variants={slideFromRight}>
              <div className={styles.highlightQuote}>
                <p>Validada pelos instaladores de elite e com <strong>12 ANOS DE GARANTIA</strong>, essa não é apenas uma película protetora. É o fim da depreciação estética e a valorização suprema do seu investimento.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 3: TECNOLOGIA (Diagrama das 4 camadas)
          ═══════════════════════════════════════════ */}
      <section className={styles.techSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Arquitetura de 4 Camadas</motion.h2>
          <motion.div className={styles.techGrid} variants={scaleIn}>
            <div className={styles.techImagePanel}>
              <img src="/assets/images/nzppf_premium_layers_tpu.png" alt="Camadas TPU" className={styles.techImage} loading="lazy" decoding="async" />
              <div className={styles.techImageOverlay}></div>
              <img src={CamadaIcon} className={`${styles.techDiagramIcon} ${styles.goldIcon}`} alt="" loading="lazy" decoding="async" />
            </div>
            <div className={styles.techLayers}>
              {[
                { name: 'Top Coating Premium', desc: 'Proteção de superfície com nano-revestimento japonês' },
                { name: 'TPU Autolimpante', desc: 'Qualidade de máxima transparência e clareza óptica' },
                { name: 'Regeneração Térmica', desc: 'Core inteligente com tecnologia de auto-cura' },
                { name: 'Adesivo PSA Reposicionável', desc: 'Sem resíduos pós-remoção — instalação limpa' }
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

      {/* ═══════════════════════════════════════════
          SEÇÃO 4: DIFERENCIAIS (Cards individuais)
          ═══════════════════════════════════════════ */}
      <section className={styles.differentialsSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={staggerCards}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Diferenciais Exclusivos</motion.h2>
          <div className={styles.differentialsGrid}>
            {diferenciais.map((item, i) => (
              <motion.div key={i} className={styles.diffCard} variants={scaleIn}>
                <div className={styles.diffCardImageWrap}>
                  <img src={item.image} alt={item.title} className={styles.diffCardImage} loading="lazy" decoding="async" />
                  <div className={styles.diffCardImageOverlay}></div>
                </div>
                <div className={styles.diffCardBody}>
                  <img src={item.icon} alt="" className={`${styles.diffCardIcon} ${styles.goldIcon}`} loading="lazy" decoding="async" />
                  <h3 className={styles.diffCardTitle}>{item.title}</h3>
                  <p className={styles.diffCardDesc}>{item.desc}</p>
                  <span className={styles.diffCardAccent}>{item.accent}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 5: ACABAMENTOS (Carousel)
          ═══════════════════════════════════════════ */}
      <section className={styles.finishesSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 className={styles.sectionTitle} variants={blurReveal}>Acabamentos Disponíveis</motion.h2>
          <motion.div className={styles.finishesShowcase} variants={scaleIn}>
            <div className={styles.finishesImageArea}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeFinish}
                  src={finishesCarousel[activeFinish].src}
                  alt={finishesCarousel[activeFinish].title}
                  className={styles.finishesImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                />
              </AnimatePresence>
            </div>
            <div className={styles.finishesTabs}>
              {finishesCarousel.map((finish, i) => (
                <button
                  key={i}
                  className={`${styles.finishTab} ${activeFinish === i ? styles.finishTabActive : ''}`}
                  onClick={() => setActiveFinish(i)}
                >
                  <span className={styles.finishTabTitle}>{finish.title}</span>
                  <span className={styles.finishTabSub}>{finish.sub}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SEÇÃO 6: FICHA TÉCNICA (CTA + Modal)
          ═══════════════════════════════════════════ */}
      <section className={styles.specsSection}>
        <motion.div className="container" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div className={styles.specsCard} variants={scaleIn}>
            <div className={styles.specsCardText}>
              <h2 className={styles.sectionTitle}>Ficha Técnica Completa</h2>
              <p className={styles.specsDesc}>Consulte todos os dados de espessura, material, estrutura, adesivo e garantia. Compare o desempenho do NZPPF Luxury Gloss com o padrão de mercado ao longo de 12 anos.</p>
            </div>
            <div className={styles.specsCardActions}>
              <button className={styles.specsBtn} onClick={() => { setModalTab('specs'); setIsTableModalOpen(true); }}>
                <img src={CamadaIcon} alt="" className={`${styles.specsBtnIcon} ${styles.goldIcon}`} loading="lazy" decoding="async" />
                ANÁLISE TÉCNICA
              </button>
              <button className={styles.specsBtnOutline} onClick={() => { setModalTab('benchmark'); setIsTableModalOpen(true); }}>
                BENCHMARK DE PERFORMANCE
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          TABLE MODAL (specs + benchmark)
          ═══════════════════════════════════════════ */}
      {isTableModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTableModalOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsTableModalOpen(false)}>FECHAR ✕</button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>SPEC SHEET TÉCNICO</h2>
              <div className={styles.modalTabs}>
                <button className={`${styles.modalTabBtn} ${modalTab === 'specs' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('specs')}>Análise Técnica</button>
                <button className={`${styles.modalTabBtn} ${modalTab === 'benchmark' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('benchmark')}>Benchmark</button>
              </div>
            </div>

            {modalTab === 'specs' && (
              <motion.div key="specs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <div className={styles.tHead}><div className={styles.thCol}>INFORMAÇÕES</div><div className={styles.thCol}>ESPECIFICAÇÃO</div><div className={styles.thCol}>DETALHES</div></div>
                <div className={styles.tBody}>
                  {tabelaTecnica.map((row, i) => (
                    <div className={styles.tRow} key={i}>
                      <div className={`${styles.tdCol} ${styles.tdStrong}`}><img src={row.icon} className={`${styles.modalIcon} ${styles.goldIcon}`} alt=""/> {row.info}</div>
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
                  <div className={styles.legendItem}><div className={styles.legendDotNz}></div> NZPPF Luxury Gloss</div>
                  <div className={styles.legendItem}><div className={styles.legendDotCom}></div> Padrão de Mercado</div>
                </div>
                {benchmarkData.map((item, index) => {
                  const getLinePath = (data: number[]) => data.map((val, i) => { const x = 40 + i * (720 / 4); const y = 280 - (val / 100) * 200; return `${i === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(' ');
                  const getAreaPath = (data: number[]) => getLinePath(data) + ` L 760 280 L 40 280 Z`;
                  return (
                    <div key={index} className={styles.svgChartContainer}>
                      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                        <h4 style={{ color: "#fff", fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "0.3rem", fontFamily: "var(--font-heading)" }}>{item.metric}</h4>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>{item.desc}</span>
                      </div>
                      <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto' }}>
                        <defs>
                          <linearGradient id={`gNz-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" /><stop offset="100%" stopColor="#D4AF37" stopOpacity="0" /></linearGradient>
                          <linearGradient id={`gCm-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#888" stopOpacity="0.2" /><stop offset="100%" stopColor="#888" stopOpacity="0" /></linearGradient>
                          <filter id="glow"><feGaussianBlur stdDeviation="3" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        {[0,25,50,75,100].map(y => { const yP = 280-(y/100)*200; return <g key={y}><line x1="40" y1={yP} x2="760" y2={yP} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={y===0?"none":"4 4"}/><text x="10" y={yP+4} fill="#666" fontSize="12" fontFamily="monospace">{y}%</text></g> })}
                        {['Ano 1','Ano 3','Ano 5','Ano 8','Ano 12'].map((l,i) => <text key={l} x={40+i*(720/4)} y="310" fill="#888" fontSize="12" fontFamily="var(--font-heading)" textAnchor="middle">{l}</text>)}
                        <motion.path d={getAreaPath(item.mercado)} fill={`url(#gCm-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}/>
                        <motion.path d={getLinePath(item.mercado)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut"}}/>
                        <motion.path d={getAreaPath(item.nz)} fill={`url(#gNz-${index})`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}/>
                        <motion.path d={getLinePath(item.nz)} fill="none" stroke="#D4AF37" strokeWidth="4" filter="url(#glow)" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.5,ease:"easeOut",delay:0.2}}/>
                        {item.nz.map((v,i) => { const x=40+i*(720/4); const y=280-(v/100)*200; return <motion.circle key={`n${i}`} cx={x} cy={y} r="5" fill="#D4AF37" stroke="#111" strokeWidth="2" initial={{scale:0}} animate={{scale:1}} transition={{delay:1.2+i*0.1}}/> })}
                        {item.mercado.map((v,i) => { const x=40+i*(720/4); const y=280-(v/100)*200; return <motion.circle key={`c${i}`} cx={x} cy={y} r="4" fill="#888" initial={{scale:0}} animate={{scale:1}} transition={{delay:1+i*0.1}}/> })}
                      </svg>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          OFFER MODAL
          ═══════════════════════════════════════════ */}
      {isOfferModalOpen && (
        <div className={styles.offerOverlay} onClick={() => setIsOfferModalOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={styles.offerModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsOfferModalOpen(false)} style={{ position: 'absolute', top: 15, right: 15 }}>✕</button>
            <div className={styles.offerHeader}><h3>Resgatar Desconto Especial</h3><p>Deixe seu contato para receber nossa condição exclusiva no NZPPF Luxury Gloss.</p></div>
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
      <PpfFaqSection path="/ppf/luxury-gloss" name="NZPPF Luxury Gloss" />
    </div>
  );
}
