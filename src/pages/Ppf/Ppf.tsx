import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Ppf.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

// Iconografia Premium do Cliente (Simbolos)
const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";

const luxuryData = {
  title: 'NZPPF LUXURY GLOSS',
  subtitle: 'TPU de Última Geração | + 32% Mais brilho',
  intro: {
    heading: 'A MELHOR MATÉRIA-PRIMA DO MUNDO',
    p1: 'Pare de sofrer com riscos, manchas de água e detritos na estrada. O nosso TPU Alifático de 190 micras atua como um escudo invisível de alta resistência, blindando a pintura original contra os piores cenários do trânsito brasileiro.',
    p2: 'Você não precisa mais escolher entre proteção e estética. O Nano-Revestimento de tecnologia japonesa impulsiona o nível de brilho em até +32%, proporcionando um acabamento vitrificado, profundo e espelhado que atrai olhares por onde passa.',
    p3: 'Graças ao polímero inteligente de regeneração térmica avançada, os pequenos arranhões e as marcas de lavagem somem sozinhos apenas com o calor do sol. Seu carro mantém a aparência constante de "recém-saído da concessionária".',
    p4: 'Validada pelos instaladores de elite e com 12 ANOS DE GARANTIA, essa não é apenas uma película protetora. É o fim da depreciação estética e a valorização suprema do seu investimento.'
  },
  vantagens: [
    'Rejeição de calor superficial: TPU com baixa condutividade térmica que reduz o aquecimento da lataria sob sol intenso',
    'Clareza óptica: Transparência superior, realçando a cor original do veículo com alto brilho',
    'Compatibilidade total: Ideal para veículos premium com sensores, câmeras e acabamentos delicados — sem interferência ou delaminação',
    'Repelência a água superior: 30% mais repelente que o padrão de mercado',
    'Regeneração contra micro riscos: Regeneração térmica 40% superior ao padrão de mercado'
  ],
  caracteristicas: [
    'Tecnologia: TPU premium com revestimento autolimpante de alta performance',
    'Brilho: Aumento de até 32% no brilho da pintura',
    'Espessura: 190 micras – resistência superior',
    'Regeneração: Micro riscos eliminados com calor',
    'Autolimpeza: Repele água, poeira e sujeira',
    'Proteção: Contra riscos, impactos, oxidação e amarelecimento',
    'Garantia: 12 anos com selo de autenticidade NZ',
    'Acabamentos disponíveis: Gloss, Matte e Black Gloss'
  ],
  tabelaTecnica: [
    { icon: CamadaIcon, info: 'Espessura Total (Premium)', spec: '190 Micras (7.5 mil)', detalhe: 'Camada robusta dimensionada para máxima dissipação de impacto.' },
    { icon: EscudoVazioIcon, info: 'Material Base (Core)', spec: '100% TPU Alifático Premium', detalhe: 'Poliuretano automotivo com estabilização anti-UV (não amarela).' },
    { icon: CamadaIcon, info: 'Arquitetura do Filme', spec: 'Coextrusão em 4 Camadas', detalhe: 'Liner Protetor, Adesivo PSA, Core TPU e Top Coat.' },
    { icon: RepelenciaIcon, info: 'Top Coat (Superfície)', spec: 'Nano-Revestimento Japonês', detalhe: 'Propriedades hidrofóbicas extremas e auto-cura térmica.' },
    { icon: CertoIcon, info: 'Tecnologia de Adesivo', spec: 'Acrílico PSA Reposicionável', detalhe: 'Instalação limpa e remoção segura a longo prazo (Zero Resíduos).' },
    { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '12 Anos Certificados', detalhe: 'Respaldo contra amarelamento, delaminação e perda de adesão.' }
  ],
  benchmark: [
    { metric: 'Retenção de Brilho (Gloss Units)', desc: 'Medição em laboratório simulando lavagens e intempéries', nz: [99.5, 97.2, 98.8, 94.6, 95.5], mercado: [95.0, 86.5, 82.0, 71.5, 62.0] },
    { metric: 'Resistência a Impactos (Impact Absorption)', desc: 'Absorção de energia cinética superficial', nz: [98.8, 97.5, 98.0, 94.2, 93.5], mercado: [92.0, 81.0, 76.5, 65.0, 51.5] },
    { metric: 'Regeneração Térmica (Self-Healing)', desc: 'Capacidade de auto-cura de micro-riscos', nz: [99.0, 99.5, 96.8, 95.5, 93.0], mercado: [96.5, 84.0, 68.5, 52.0, 32.5] },
    { metric: 'Nível de Repelência (Beading Angle)', desc: 'Efeito hidrofóbico e facilidade de limpeza', nz: [98.5, 95.2, 96.0, 91.5, 89.8], mercado: [94.0, 81.5, 66.0, 52.5, 38.0] }
  ],
  mosaic: [
    { 
      src: '/assets/images/nzppf_premium_layers_tpu.png', 
      overlayType: 'layers',
      icon: CamadaIcon
    },
    { 
      src: '/assets/images/nzppf_regeneracao.png',
      overlayType: 'icon-center', 
      icon: RegeneracaoIcon, 
      title: 'Regeneração Térmica:', 
      sub: <><span className={styles.goldAccent}>Auto-cura</span> com calor</> 
    },
    { 
      src: '/assets/images/nzppf_repelencia.png', 
      overlayType: 'icon-left', 
      icon: RepelenciaIcon, 
      title: 'Mega Repelência:', 
      sub: <><span className={styles.goldAccent}>Proteção</span> contra sujeira</> 
    },
    { 
      src: '/assets/images/nzppf_super_brilho.png', 
      overlayType: 'bottom-label', 
      icon: CertoIcon,
      title: 'Super Brilho:', 
      sub: <><span className={styles.goldAccent}>+32%</span> de Brilho</> 
    }
  ]
};

export default function Ppf() {
  const [activeTab, setActiveTab] = useState<'vantagens' | 'caracteristicas' | 'tabela'>('vantagens');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'specs' | 'benchmark'>('specs');

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <video 
          className={styles.heroVideo} 
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/assets/videos/VIDEO-HERO-NZPPF-novo.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div 
            className={styles.heroTextContent}
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <motion.img 
              src="/assets/logos/logo-nz-ppf.svg" 
              alt="NZ PPF" 
              className={styles.pageTitleImage} 
              variants={fadeUpItem} 
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Criada por profissionais que vivem o mercado na prática, a NZ PPF nasceu para oferecer performance real, com materiais testados diariamente em carros, lojas e ambientes de uso intenso. Cada produto é desenvolvido para atender tanto a rotina pesada das lojas quanto o padrão de exigência dos aplicadores mais criteriosos do Brasil.
            </motion.p>
            <motion.p className={styles.heroSubtitleWarning} variants={fadeUpItem}>
              Aqui, não existe promessa vazia — existe tecnologia, consistência e resultado.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* TRANSITIONAL SHADOW SPACER */}
      <div className={styles.blackSpacer}></div>

      {/* TACTICAL BENTO SECTION */}
      <section className={styles.bentoSection}>
        {/* Dynamic Dark Background simulating the car hood from the mockup */}
        <div className={styles.bentoBackground}></div>
        
        <motion.div 
          className={`container ${styles.bentoContainerWrapper}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          
          <motion.div variants={fadeUpItem} className={styles.bentoHeader}>
            <h2 className={styles.bentoTitleMassive}>{luxuryData.title}</h2>
            <div className={styles.bentoSubtitle}>{luxuryData.subtitle}</div>
          </motion.div>

          <div className={styles.bentoTacticalGrid}>
            
            {/* COLUMN 1: IMAGE MOSAIC */}
            <div className={styles.mosaicColumn}>
              {/* Giant Image */}
              <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.mosaicImageGiant}`}>
                <img src={luxuryData.mosaic[0].src} alt="Estrutura" className={styles.panelAsset} />
                <div className={styles.imageOverlayLayers}>
                   {/* Technical Overlay SVG mapping */}
                   <div className={styles.layerDiagram}>
                     <img src={CamadaIcon} className={`${styles.layerDwg} ${styles.goldIcon}`} alt="Camadas" />
                     <div className={styles.layerLabels}>
                       <div className={styles.layerText}><strong>Top Coating Premium</strong>Proteção de superfície</div>
                       <div className={styles.layerText}><strong>TPU Autolimpante</strong>Qualidade de máxima transparência</div>
                       <div className={styles.layerText}><strong>Regeneração Térmica</strong>Tecnologia core</div>
                       <div className={styles.layerText}><strong>Adesivo PSA Reposicionável</strong>Sem resíduos pós-remoção</div>
                     </div>
                   </div>
                </div>
              </motion.div>

              {/* Two small images row */}
              <div className={styles.mosaicSplitRow}>
                <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.mosaicImageSmall}`}>
                  <img src={luxuryData.mosaic[1].src} alt="Regeneração" className={styles.panelAsset} />
                  <div className={styles.imageOverlayIconCenter}>
                    <img src={luxuryData.mosaic[1].icon} alt="Icone" className={`${styles.tacticalOverlayIcon} ${styles.goldIcon}`} />
                    <div className={styles.microTextCenter}>
                      <strong>{luxuryData.mosaic[1].title}</strong><br/>
                      {luxuryData.mosaic[1].sub}
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.mosaicImageSmall}`}>
                  <img src={luxuryData.mosaic[2].src} alt="Repelência" className={styles.panelAsset} />
                  <div className={styles.imageOverlayIconRight}>
                    <img src={luxuryData.mosaic[2].icon} alt="Icone" className={`${styles.tacticalOverlayIconSmall} ${styles.goldIcon}`} />
                    <div className={styles.microTextCenter}>
                      <strong>{luxuryData.mosaic[2].title}</strong><br/>
                      {luxuryData.mosaic[2].sub}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom wide image */}
              <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.mosaicImageWide}`}>
                <img src={luxuryData.mosaic[3].src} alt="Brilho" className={styles.panelAsset} />
                <div className={styles.imageOverlayBottomText}>
                    <div className={styles.microTextLarge}>
                      <img src={luxuryData.mosaic[3].icon} alt="Icone" className={`${styles.smallIconInline} ${styles.goldIcon}`} />
                      <div className={styles.superBrilhoText}>
                        <strong>{luxuryData.mosaic[3].title}</strong><br/>
                        {luxuryData.mosaic[3].sub}
                      </div>
                    </div>
                </div>
              </motion.div>

            </div>

            {/* COLUMN 2: TEXT & TABS MODULES */}
            <div className={styles.dataGrid}>
                
                {/* Intro Text */}
                <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.panelTextIntro}`}>
                  <h3 className={styles.panelTitleCenter}>{luxuryData.intro.heading}</h3>
                  <div className={styles.introParagraphs}>
                    <p><strong>{luxuryData.intro.p1}</strong></p>
                    <p>{luxuryData.intro.p2}</p>
                    <p>{luxuryData.intro.p3}</p>
                    <p className={styles.highlightParagraph}>{luxuryData.intro.p4}</p>
                  </div>
                </motion.div>

                {/* Interactive TACTICAL TABS */}
                <motion.div variants={fadeUpItem} className={`${styles.glassPanel} ${styles.panelInteractive}`}>
                  <div className={styles.tabNavigation}>
                     <button 
                        className={`${styles.tabBtn} ${activeTab === 'vantagens' ? styles.tabBtnActive : ''}`} 
                        onClick={() => setActiveTab('vantagens')}>
                        Vantagens
                     </button>
                     <button 
                        className={`${styles.tabBtn} ${activeTab === 'caracteristicas' ? styles.tabBtnActive : ''}`} 
                        onClick={() => setActiveTab('caracteristicas')}>
                        Características
                     </button>
                     <button 
                        className={`${styles.tabBtn} ${activeTab === 'tabela' ? styles.tabBtnActive : ''}`} 
                        onClick={() => {
                          setActiveTab('tabela');
                          setIsTableModalOpen(true);
                        }}>
                        Tabela Técnica
                     </button>
                  </div>
                  
                  <div className={styles.tabContentArea}>
                    
                    {activeTab === 'vantagens' && (
                      <div className={styles.tabPane}>
                        <ul className={styles.dataList}>
                          {luxuryData.vantagens.map((v, i) => {
                            const split = v.split(':');
                            return (
                              <li key={i}>
                                <span className={styles.dataListBullet} />
                                <span><strong>{split[0]}:</strong>{split[1]}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {activeTab === 'caracteristicas' && (
                      <div className={styles.tabPane}>
                        <ul className={styles.dataListCompact}>
                          {luxuryData.caracteristicas.map((c, i) => {
                            const split = c.split(':');
                            return (
                              <li key={i}>
                                <span className={styles.dataListBulletSquare} />
                                <span><strong>{split[0]}:</strong>{split[1]}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {activeTab === 'tabela' && (
                      <div className={styles.tabPane}>
                        <div className={styles.tableTabPreview}>
                           <p>Consulte todos os dados de espessura, material, estrutura, adesivo e garantia do NZPPF Luxury Gloss.</p>
                           <button className={styles.openModalBtn} onClick={() => setIsTableModalOpen(true)}>
                             ABRIR TABELA TÉCNICA
                           </button>
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>

            </div>

          </div>
        </motion.div>
      </section>

      {/* TABELA MODAL */}
      {isTableModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTableModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={() => setIsTableModalOpen(false)}>FECHAR X</button>
            <div className={styles.modalHeader}>
              <h2 className={styles.bentoTitleMassive}>SPEC SHEET TÉCNICO</h2>
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTabBtn} ${modalTab === 'specs' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('specs')}
                >
                  Análise Técnica
                </button>
                <button 
                  className={`${styles.modalTabBtn} ${modalTab === 'benchmark' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('benchmark')}
                >
                  Benchmark de Performance
                </button>
              </div>
            </div>

            {modalTab === 'specs' && (
              <motion.div 
                key="specs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={styles.tabPaneTable}
              >
                <div className={styles.tHead}>
                   <div className={styles.thCol}>INFORMAÇÕES</div>
                   <div className={styles.thCol}>ESPECIFICAÇÃO</div>
                   <div className={styles.thCol}>DETALHES / COMPOSIÇÃO</div>
                </div>
                <div className={styles.tBody}>
                  {luxuryData.tabelaTecnica.map((row, i) => (
                    <div className={styles.tRow} key={i}>
                      <div className={`${styles.tdCol} ${styles.tdStrong}`}>
                        <img src={row.icon} className={`${styles.modalIcon} ${styles.goldIcon}`} alt="Icon"/> {row.info}
                      </div>
                      <div className={styles.tdCol}>{row.spec}</div>
                      <div className={`${styles.tdCol} ${styles.tdMute}`}>{row.detalhe}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {modalTab === 'benchmark' && (
              <motion.div 
                key="benchmark"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={styles.benchmarkContainer}
              >
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDotNz}></div> NZPPF Luxury Gloss
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDotCom}></div> Padrão de Mercado
                  </div>
                </div>

                <div className={styles.chartsScrollList}>
                  {luxuryData.benchmark.map((item, index) => {
                    
                    const getLinePath = (data: number[]) => {
                      return data.map((val, i) => {
                        const x = 40 + i * (720 / 4);
                        const y = 280 - (val / 100) * 200; // 0% at 280, 100% at 80
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');
                    };
                    
                    const getAreaPath = (data: number[]) => {
                      return getLinePath(data) + ` L 760 280 L 40 280 Z`;
                    };

                    return (
                      <div key={index} className={styles.svgChartContainer}>
                        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
                          <h4 style={{ color: "#fff", fontSize: "0.95rem", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.4rem", fontFamily: "var(--font-heading)" }}>{item.metric}</h4>
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>{item.desc}</span>
                        </div>
                        
                        <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id={`gradNz-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id={`gradCom-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#888888" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#888888" stopOpacity="0" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100].map(y => {
                            const yPos = 280 - (y/100)*200;
                            return (
                              <g key={y}>
                                <line x1="40" y1={yPos} x2="760" y2={yPos} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={y === 0 ? "none" : "4 4"} />
                                <text x="10" y={yPos + 4} fill="#666" fontSize="12" fontFamily="monospace">{y}%</text>
                              </g>
                            )
                          })}
                          
                          {/* X Axis Labels */}
                          {['Ano 1', 'Ano 3', 'Ano 5', 'Ano 8', 'Ano 12'].map((label, i) => (
                            <text key={label} x={40 + i * (720 / 4)} y="310" fill="#888" fontSize="12" fontFamily="var(--font-heading)" textAnchor="middle">{label}</text>
                          ))}
                          
                          {/* Market Area */}
                          <motion.path d={getAreaPath(item.mercado)} fill={`url(#gradCom-${index})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.15 + 0.3 }} />
                          {/* Market Line */}
                          <motion.path d={getLinePath(item.mercado)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.15 }} />

                          {/* NZPPF Area */}
                          <motion.path d={getAreaPath(item.nz)} fill={`url(#gradNz-${index})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.15 + 0.5 }} />
                          {/* NZPPF Line */}
                          <motion.path d={getLinePath(item.nz)} fill="none" stroke="#D4AF37" strokeWidth="4" filter="url(#glow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.15 + 0.2 }} />
                          
                          {/* Point Markers */}
                          {item.nz.map((val, i) => {
                            const x = 40 + i * (720 / 4);
                            const y = 280 - (val / 100) * 200;
                            return (
                              <motion.circle key={`nz-${i}`} cx={x} cy={y} r="5" fill="#D4AF37" stroke="#111" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.15 + 1.2 + i*0.1 }} />
                            )
                          })}
                          {item.mercado.map((val, i) => {
                            const x = 40 + i * (720 / 4);
                            const y = 280 - (val / 100) * 200;
                            return (
                              <motion.circle key={`com-${i}`} cx={x} cy={y} r="4" fill="#888" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.15 + 1.0 + i*0.1 }} />
                            )
                          })}
                        </svg>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      )}

    </div>
  );
}
