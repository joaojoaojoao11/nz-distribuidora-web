import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NZWRAP_COLORS } from '../../lib/data/nzwrapColors';
import styles from './WrapProduct.module.css';

const blurReveal = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const staggerCards = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

// Icons
const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

interface WrapProductData {
  title: string;
  subtitle: string;
  heroDescription: string;
  heroWarning: string;
  heroImage: string;
  specs: { icon: string; info: string; spec: string; detalhe: string }[];
  diferenciais: { icon: string; title: string; desc: string; accent: string; image: string }[];
  benchmarks: { metric: string; desc: string; nz: number[]; mercado: number[] }[];
}

function WrapProductPage({ data, children }: { data: WrapProductData, children?: React.ReactNode }) {
  return (
    <div className={styles.page}>
      {/* HERO */}
      <header className={styles.hero}>
        <img src={data.heroImage} alt="" className={styles.heroBackground} />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.div className={styles.heroBreadcrumb} variants={blurReveal}>
              <Link to="/wrap" className={styles.breadcrumbLink}>← VOLTAR AO CATÁLOGO</Link>
            </motion.div>
            <motion.h1 className={styles.heroTitle} variants={blurReveal}>{data.title}</motion.h1>
            <motion.p className={styles.heroSubtitle} variants={blurReveal}>{data.subtitle}</motion.p>
            <motion.p className={styles.heroDescription} variants={blurReveal}>{data.heroDescription}</motion.p>
            <motion.p className={styles.heroWarning} variants={blurReveal}>{data.heroWarning}</motion.p>
          </motion.div>
        </div>
      </header>

      {/* CUSTOM CONTENT (if any) */}
      {children}

      {/* TECH SPECS */}
      <section className={styles.specsSection}>
        <div className={styles.specsShadowTop}></div>
        <motion.div
          className={`container ${styles.specsContainer}`}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className={styles.specsSectionHeader} variants={blurReveal}>
            <h2 className={styles.sectionTitle}>ESPECIFICAÇÕES TÉCNICAS</h2>
            <p className={styles.sectionSub}>Dados de engenharia do material</p>
          </motion.div>

          <motion.div className={styles.specsGrid} variants={staggerCards}>
            {data.specs.map((spec, i) => (
              <motion.div key={i} className={styles.specCard} variants={scaleIn}>
                <div className={styles.specIconWrapper}>
                  <img src={spec.icon} alt="" className={styles.specIcon} />
                </div>
                <div className={styles.specInfo}>
                  <span className={styles.specLabel}>{spec.info}</span>
                  <strong className={styles.specValue}>{spec.spec}</strong>
                  <span className={styles.specDetail}>{spec.detalhe}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* DIFERENCIAIS */}
      <section className={styles.diferenciaisSection}>
        <motion.div
          className={`container ${styles.diferenciaisContainer}`}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.div className={styles.specsSectionHeader} variants={blurReveal}>
            <h2 className={styles.sectionTitle}>DIFERENCIAIS</h2>
            <p className={styles.sectionSub}>O que torna este material único</p>
          </motion.div>

          <motion.div className={styles.diferenciaisGrid} variants={staggerCards}>
            {data.diferenciais.map((dif, i) => (
              <motion.div key={i} className={styles.diferencialCard} variants={scaleIn}>
                <div className={styles.diferencialImageWrapper}>
                  <img src={dif.image} alt={dif.title} className={styles.diferencialImage} />
                  <div className={styles.diferencialImageOverlay}></div>
                </div>
                <div className={styles.diferencialContent}>
                  <div className={styles.diferencialHeader}>
                    <img src={dif.icon} alt="" className={styles.diferencialIcon} />
                    <span className={styles.diferencialAccent}>{dif.accent}</span>
                  </div>
                  <h3 className={styles.diferencialTitle}>{dif.title}</h3>
                  <p className={styles.diferencialDesc}>{dif.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* BENCHMARK */}
      <section className={styles.benchmarkSection}>
        <motion.div
          className={`container ${styles.benchmarkContainer}`}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className={styles.specsSectionHeader} variants={blurReveal}>
            <h2 className={styles.sectionTitle}>BENCHMARK VS MERCADO</h2>
            <p className={styles.sectionSub}>Performance comparada após 1, 2 e 3 anos de uso</p>
          </motion.div>

          <motion.div className={styles.benchmarkGrid} variants={staggerCards}>
            {data.benchmarks.map((b, i) => (
              <motion.div key={i} className={styles.benchmarkCard} variants={scaleIn}>
                <div className={styles.benchHeader}>
                  <h4 className={styles.benchMetric}>{b.metric}</h4>
                  <span className={styles.benchDesc}>{b.desc}</span>
                </div>

                <div className={styles.benchBars}>
                  {['1 Ano', '2 Anos', '3 Anos'].map((label, j) => (
                    <div key={j} className={styles.benchRow}>
                      <span className={styles.benchYearLabel}>{label}</span>
                      <div className={styles.benchBarGroup}>
                        <div className={styles.benchBarBg}>
                          <motion.div
                            className={styles.benchBarNz}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${b.nz[j]}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: j * 0.15 }}
                          >
                            <span className={styles.benchPercent}>{b.nz[j]}%</span>
                          </motion.div>
                        </div>
                        <div className={styles.benchBarBg}>
                          <motion.div
                            className={styles.benchBarMercado}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${b.mercado[j]}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: j * 0.15 + 0.1 }}
                          >
                            <span className={styles.benchPercent}>{b.mercado[j]}%</span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.benchLegend}>
                  <span className={styles.legendNz}>■ NZ DISTRIBUIDORA</span>
                  <span className={styles.legendMercado}>■ MÉDIA DO MERCADO</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className={styles.ctaSection}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.a
            href="https://wa.me/message/3DBGPIZF4EMWO1"
            target="_blank"
            rel="noreferrer"
            className={styles.ctaButton}
            variants={blurReveal}
          >
            SOLICITAR ORÇAMENTO
          </motion.a>
        </motion.div>
      </section>
    </div>
  );
}

/* ======================== NZWRAP PREMIUM STORYTELLING & GRID ======================== */
function NzwrapPremiumContent() {
  return (
    <>
      <div style={{ position: 'relative', backgroundColor: '#0a0a0c', padding: '8rem 0', width: '100%', borderTop: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
        
        {/* Immersive Car Background */}
        <div style={{
           position: 'absolute',
           inset: 0,
           zIndex: 0,
           opacity: 0.4
        }}>
          <motion.img 
             initial={{ opacity: 0, scale: 1.05 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1.5 }}
             src="/assets/images/bg_nzwrap_premium.jpg"
             onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2560&auto=format&fit=crop'; }}
             alt="Dark Wrap Car"
             style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }}
          />
          <div style={{
             position: 'absolute',
             inset: 0,
             background: 'linear-gradient(to bottom, #0a0a0c 0%, rgba(10,10,12,0.5) 50%, #0a0a0c 100%)'
          }} />
          <div style={{
             position: 'absolute',
             inset: 0,
             background: 'radial-gradient(circle at center, transparent 0%, #0a0a0c 100%)'
          }} />
        </div>

        <section className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '5rem', maxWidth: '900px', margin: '0 auto 5rem auto', textAlign: 'center', padding: '0 5%' }}>
            <span style={{ 
              display: 'inline-block',
              color: '#d4af37', 
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>ENGENHARIA PROPRIETÁRIA</span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ 
                fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                fontWeight: 800, 
                letterSpacing: '-0.04em', 
                fontFamily: '"Playfair Display", "Lyon Text", serif',
                color: '#fff',
                lineHeight: 1.1,
                marginBottom: '2rem',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)'
              }}
            >
              40% Mais Resistente.<br/>Construído para o Extremo.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#d4d4d8', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              A tecnologia híbrida garante elasticidade monumental sem perda de cor ou esbranquiçamento nas bordas. Uma malha microscópica com <strong style={{color: '#fff'}}>Laminação Especial</strong> que aniquila o envelhecimento prematuro, gerando o autêntico efeito Mirror-Gloss.
            </motion.p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               style={{
                 padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.7)',
                 backdropFilter: 'blur(10px)',
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'center'
               }}
            >
              <span style={{ 
                display: 'inline-block',
                color: '#fff', 
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '2px',
                alignSelf: 'flex-start'
              }}>Sistema Híbrido</span>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>Laminação Isolante</h3>
              <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', margin: 0 }}>O brilho espelhado que as marcas genéricas não alcançam. A injeção extra de verniz estrutural preserva a base de cor mesmo nas dobras mais agressivas.</p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               style={{
                 padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.7)',
                 backdropFilter: 'blur(10px)',
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'center'
               }}
            >
              <span style={{ 
                display: 'inline-block',
                color: '#fff', 
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '2px',
                alignSelf: 'flex-start'
              }}>Imunidade Total</span>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>3 Anos de Garantia</h3>
              <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', margin: 0 }}>Enquanto o mercado abandona seu projeto no primeiro verão, nós assinamos o termo de confiança contra deformação térmica e radiação UV.</p>
            </motion.div>
          </div>
        </section>
      </div>

      <section className="container" style={{ padding: 'clamp(4rem, 8vw, 8rem) 5%' }}>
        <div style={{ marginBottom: '4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#fff' }}>The Collection</h2>
            <p style={{ color: '#a1a1aa', fontFamily: '"Geist Sans", sans-serif', fontSize: 'clamp(1rem, 2vw, 1.1rem)', margin: 0 }}>
              Navegue pelo portfólio premium. 30 tons selecionados.
            </p>
          </div>
          <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: '0.85rem', color: '#888' }}>[ 01 — 30 ]</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '4rem 2rem',
        }}>
          {NZWRAP_COLORS.map((color, idx) => (
            <motion.div
              key={color.sku}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (idx % 3) * 0.1 }}
            >
              <Link 
                to={`/wrap/nzwrap-premium/${color.sku.toLowerCase()}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#1A1A1A' }}>
                  <div style={{ 
                    aspectRatio: '4/5', 
                    width: '100%', 
                    overflow: 'hidden' 
                  }}>
                    <img 
                      src={color.thumbnail} 
                      alt={color.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'center' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                      onError={(e) => { e.currentTarget.src = '/assets/images/wrap_sh_card.png'; }}
                    />
                  </div>
                  
                  <div style={{
                     position: 'absolute',
                     top: '1rem',
                     right: '1rem',
                     backgroundColor: 'rgba(0,0,0,0.5)',
                     backdropFilter: 'blur(8px)',
                     WebkitBackdropFilter: 'blur(8px)',
                     color: '#fff',
                     padding: '4px 8px',
                     fontSize: '0.65rem',
                     fontWeight: 600,
                     textTransform: 'uppercase',
                     letterSpacing: '0.05em',
                     borderRadius: '4px',
                     fontFamily: '"Geist Sans", sans-serif',
                     border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {color.finish}
                  </div>
                </div>

                <div style={{ paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ 
                    fontFamily: '"Geist Mono", "JetBrains Mono", monospace', 
                    fontSize: '0.75rem', 
                    color: '#888',
                  }}>
                    {color.sku}
                  </span>
                  <h3 style={{ 
                    fontFamily: '"Geist Sans", "Helvetica Neue", sans-serif', 
                    fontSize: '1.1rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    margin: 0,
                    letterSpacing: '-0.01em',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#d4af37'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
                  >
                    {color.name.replace('NZWRAP ', '')}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ======================== NZWRAP PREMIUM ======================== */
export function NzwrapPremium() {
  return <WrapProductPage data={{
    title: 'NZWRAP PREMIUM',
    subtitle: 'PVC Alto Brilho | Linha Proprietária NZ',
    heroDescription: 'Adesivo PVC de alta performance com laminação estrutural exclusiva NZ Distribuidora. 40% mais resistente a esbranquiçamento em dobras extremas. O autêntico efeito espelhado para alta performance automotiva.',
    heroWarning: 'A ÚNICA MARCA NO BRASIL COM 3 ANOS DE GARANTIA DIRETA DE FÁBRICA.',
    heroImage: '/assets/images/wrap_nzwrap_hero.png',
    specs: [
      { icon: CamadaIcon, info: 'Material', spec: 'PVC Premium Laminação Híbrida', detalhe: '40% maior resistência torcional.' },
      { icon: EscudoVazioIcon, info: 'Acabamento', spec: 'Ultra Gloss / Deep Pearl', detalhe: 'Brilho superior indestrutível com reflexo de vitrificação.' },
      { icon: CamadaIcon, info: 'Largura', spec: '1,52m', detalhe: 'Padrão esportivo para capôs e tetos sem emendas.' },
      { icon: RepelenciaIcon, info: 'Adesivo', spec: 'Permanente Air-Free Reposicionável', detalhe: 'Aplicação cirúrgica, 100% de saída de ar.' },
      { icon: CertoIcon, info: 'Curadoria', spec: 'Cores Exclusivas NZ', detalhe: 'Cores que assinam seu trabalho como grife automotiva.' },
      { icon: RegeneracaoIcon, info: 'Garantia', spec: '3 Anos Absolut', detalhe: 'Paz de espírito blindada contra o tempo.' }
    ],
    diferenciais: [
      { icon: CertoIcon, title: 'Laminação Especial Isolante', desc: 'Camada de proteção que evita o enfraquecimento e esbranquiçamento da cor nas pontas complexas dos para-choques, preservando a tensão original da fábrica.', accent: '+40% Força', image: '/assets/images/wrap_nzwrap_card.png' },
      { icon: RepelenciaIcon, title: 'Garantia Singular', desc: 'Enquanto grande parte do mercado se isenta de durabilidade, assumimos a cor do projeto em contrato com 3 Anos de imunidade termal comprovada.', accent: '3 Anos Intocáveis', image: '/assets/images/wrap_nzwrap_hero.png' },
      { icon: EscudoVazioIcon, title: 'Curadoria Automotiva', desc: 'Estudo preciso das texturas das grandes montadoras convertidas em películas. Sua oficina transforma qualquer modelo com fidelidade visual incomparável.', accent: 'Pinta Premium', image: '/assets/images/wrap_sh_card.png' },
      { icon: PresenteIcon, title: 'Suporte Direto', desc: 'Assessoria de alta patente para parceiros aplicadores. Fale direto com a engenharia da NZ em todos os processos complexos.', accent: 'Respaldo Garantido', image: '/assets/images/wrap_970ra_card.png' }
    ],
    benchmarks: [
      { metric: 'Resistência nas Dobras', desc: 'Tensão sem perda de cor (esbranquiçamento)', nz: [99, 97, 95], mercado: [85, 78, 70] },
      { metric: 'Brilho & Profundidade', desc: 'Nível de reflexão / vitrificação (Mirror-Gloss)', nz: [98, 96, 94], mercado: [90, 82, 74] },
      { metric: 'Cobertura de Garantia', desc: 'Índice de segurança documentada a longo prazo', nz: [100, 100, 100], mercado: [60, 20, 0] },
      { metric: 'Vida Útil UV', desc: 'Preservação química exposta ao clima tropical', nz: [94, 91, 88], mercado: [82, 72, 63] }
    ]
  }}>
    <NzwrapPremiumContent />
  </WrapProductPage>;
}

/* ======================== SH WRAPPING COLORS ======================== */
import { useState, useEffect } from 'react';
import { SH_COLORS_ASSETS } from './ShWrappingColors';
import { supabase } from '../../lib/supabase';

function ShColorsGrid() {
  const [colors, setColors] = useState<any[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      const { data } = await supabase
        .from('web_catalog_products')
        .select('slug, name, hex_code, finish_type, sku')
        .eq('brand', 'SH Wrapping')
        .eq('is_active', true)
        .order('name');
      if (data) setColors(data);
    };
    fetchColors();
  }, []);

  return (
    <section className="container" style={{ padding: '6rem 0' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Catálogo de Cores</h2>
        <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
          Selecione uma cor para ver aplicações reais em veículos
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        padding: '1rem'
      }}>
        {colors.map(color => {
          const assets = SH_COLORS_ASSETS[color.slug];
          const imageUrl = assets?.image || '/assets/images/wrap_sh_card.png';
          return (
            <Link 
              key={color.slug}
              to={`/wrap/sh-colors/${color.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#111',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ 
                  height: '140px', 
                  borderBottom: '1px solid #222',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={imageUrl} 
                    alt={color.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/assets/images/wrap_sh_card.png'; }}
                  />
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                      {color.sku || 'S/N'}
                    </span>
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {color.name}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ShColors() {
  return <WrapProductPage data={{
    title: 'SH WRAPPING COLORS',
    subtitle: 'PVC Multidirecional | VINIL DE ALTA PERFORMANCE',
    heroDescription: 'A maior variedade de cores do Brasil. Cola anti-bolhas, base solvente reposicionável e acabamentos que vão do Gloss ao Color Shift. Referência nacional em envelopamento automotivo.',
    heroWarning: '',
    heroImage: '/assets/images/wrap_sh_hero.png',
    specs: [
      { icon: CamadaIcon, info: 'Espessura', spec: '165-180μ', detalhe: 'Espessura ideal para conformabilidade e durabilidade.' },
      { icon: EscudoVazioIcon, info: 'Material', spec: 'PVC Multidirecional', detalhe: 'Aplicação flexível em todas as direções.' },
      { icon: CamadaIcon, info: 'Largura', spec: '1,52m × 15m', detalhe: 'Rolo padrão profissional.' },
      { icon: RepelenciaIcon, info: 'Adesivo', spec: 'Solvente Anti-Bolhas', detalhe: 'Cola transparente permanente reposicionável.' },
      { icon: CertoIcon, info: 'Acabamentos', spec: 'Gloss • Matte • Color Shift', detalhe: 'Variedade completa de efeitos e texturas.' },
      { icon: RegeneracaoIcon, info: 'Garantia', spec: '3 Anos', detalhe: 'Garantia de fábrica contra descoloração.' }
    ],
    diferenciais: [
      { icon: CertoIcon, title: 'Amplo Portfólio', desc: 'O maior portfólio de cores de envelopamento do Brasil, com opções exclusivas e tendências globais.', accent: 'Variedade Única', image: '/assets/images/wrap_sh_card.png' },
      { icon: RepelenciaIcon, title: 'Cola Anti-Bolhas', desc: 'Tecnologia de adesivo que elimina bolhas durante a aplicação para um acabamento perfeito.', accent: 'Sem Bolhas', image: '/assets/images/wrap_sh_hero.png' },
      { icon: EscudoVazioIcon, title: 'Multidirecional', desc: 'O filme pode ser esticado em qualquer direção, facilitando aplicações em curvas e recortes complexos.', accent: 'Flexibilidade Total', image: '/assets/images/wrap_nzwrap_card.png' },
      { icon: PresenteIcon, title: 'Color Shift', desc: 'Acabamentos especiais que mudam de cor dependendo do ângulo de visão, criando efeitos impressionantes.', accent: 'Efeito Premium', image: '/assets/images/wrap_651_card.png' }
    ],
    benchmarks: [
      { metric: 'Variedade de Cores', desc: 'Opções disponíveis em estoque', nz: [97, 95, 93], mercado: [80, 75, 70] },
      { metric: 'Conformabilidade', desc: 'Adaptação em curvas complexas', nz: [90, 86, 82], mercado: [85, 78, 72] },
      { metric: 'Facilidade de Aplicação', desc: 'Performance do adesivo AntiBolha', nz: [94, 91, 88], mercado: [82, 75, 68] },
      { metric: 'Custo-Benefício', desc: 'Relação qualidade/preço', nz: [95, 93, 91], mercado: [78, 74, 70] }
    ]
  }}>
    <ShColorsGrid />
  </WrapProductPage>;
}

/* ======================== ORACAL 970RA ======================== */
export function Oracal970() {
  return <WrapProductPage data={{
    title: 'ORACAL 970RA',
    subtitle: 'Premium Wrapping Cast | Engenharia Alemã ORAFOL',
    heroDescription: 'PVC Cast multicamada com tecnologia RapidAir da ORAFOL. Acabamento paint-like que replica a pintura de fábrica com perfeição. Até 10 anos de durabilidade.',
    heroWarning: 'Referência mundial em wrapping profissional — engenharia alemã com performance comprovada.',
    heroImage: '/assets/images/wrap_970ra_hero.png',
    specs: [
      { icon: CamadaIcon, info: 'Espessura', spec: '4.25 mil (108μ)', detalhe: 'PVC Cast multicamada de alta performance.' },
      { icon: EscudoVazioIcon, info: 'Material', spec: 'Cast PVC Premium', detalhe: 'Engenharia alemã para máxima estabilidade.' },
      { icon: CamadaIcon, info: 'Cores', spec: '80+ Cores', detalhe: 'Gloss, Matte e Metallic disponíveis.' },
      { icon: RepelenciaIcon, info: 'Adesivo', spec: 'Grey RapidAir', detalhe: 'Canais de ar para aplicação sem bolhas.' },
      { icon: CertoIcon, info: 'Acabamento', spec: 'Paint-Like Finish', detalhe: 'Indistinguível de pintura automotiva original.' },
      { icon: RegeneracaoIcon, info: 'Durabilidade', spec: 'Até 10 Anos', detalhe: 'A maior garantia do mercado de wrapping.' }
    ],
    diferenciais: [
      { icon: CertoIcon, title: 'Acabamento Paint-Like', desc: 'A superfície do 970RA é projetada para replicar fielmente o acabamento de pintura automotiva de fábrica.', accent: 'Qualidade OEM', image: '/assets/images/wrap_970ra_card.png' },
      { icon: RepelenciaIcon, title: 'Tecnologia RapidAir', desc: 'Canais microscópicos no adesivo que permitem a saída de ar durante a aplicação, eliminando bolhas.', accent: 'Sem Bolhas', image: '/assets/images/wrap_970ra_hero.png' },
      { icon: EscudoVazioIcon, title: '10 Anos de Garantia', desc: 'A maior durabilidade do mercado. O 970RA mantém cor, brilho e integridade por até uma década.', accent: 'Durabilidade Extrema', image: '/assets/images/wrap_nzwrap_card.png' },
      { icon: PresenteIcon, title: 'Estabilidade Dimensional', desc: 'Não encolhe, não estica e mantém sua forma original mesmo sob condições climáticas extremas.', accent: 'Zero Retração', image: '/assets/images/wrap_sh_card.png' }
    ],
    benchmarks: [
      { metric: 'Retenção de Brilho', desc: 'Nível de brilho mantido ao longo dos anos', nz: [98, 96, 94], mercado: [90, 82, 74] },
      { metric: 'Resistência UV', desc: 'Proteção contra raios ultravioleta', nz: [97, 95, 93], mercado: [88, 78, 68] },
      { metric: 'Estabilidade Dimensional', desc: 'Resistência a deformações', nz: [96, 94, 92], mercado: [85, 76, 68] },
      { metric: 'Conformabilidade', desc: 'Aplicação em curvas complexas', nz: [95, 93, 91], mercado: [88, 82, 76] }
    ]
  }} />;
}

// Helper component for the Oracal 651 colors grid
function Oracal651ColorGrid() {
  const [colors, setColors] = useState<{slug: string, code: string, hex: string, finish: string, namePT: string}[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      const { data } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('brand', 'Oracal 651')
        .eq('is_active', true)
        .order('sku');
      
      if (data) {
        setColors(data.map(d => ({
          slug: d.slug,
          code: d.sku ? d.sku.toUpperCase() : d.name,
          hex: d.hex_code,
          finish: d.finish_type === 'Brilhante' || d.finish_type === 'Gloss' ? 'Gloss' : 'Matte',
          namePT: d.name
        })));
      }
    };
    fetchColors();
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    }}>
      {colors.map(color => (
        <Link 
          key={color.slug}
          to={`/wrap/oracal-651/${color.slug}`}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ 
              height: '100px', 
              backgroundColor: color.hex,
              borderBottom: '1px solid #222'
            }}></div>
            <div style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                  {color.code}
                </span>
                <span style={{ color: '#38bdf8', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {color.finish}
                </span>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {color.namePT}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ======================== ORACAL 651 ======================== */
export function Oracal651() {
  return <WrapProductPage data={{
    title: 'ORACAL 651',
    subtitle: 'Intermediate Cal | O Vinil Mais Popular do Mundo',
    heroDescription: 'Com 62+ cores vibrantes e alto brilho, o Oracal 651 é a referência mundial para sinalização automotiva, recortes de precisão e detalhamentos. Durabilidade de até 6 anos.',
    heroWarning: 'O padrão da indústria para comunicação visual automotiva.',
    heroImage: '/assets/images/wrap_651_hero.png',
    specs: [
      { icon: CamadaIcon, info: 'Espessura', spec: '2.5 mil (63μ)', detalhe: 'Filme fino ideal para corte e aplicação.' },
      { icon: EscudoVazioIcon, info: 'Material', spec: 'PVC Calandrado', detalhe: 'Vinil intermediário de alta qualidade.' },
      { icon: CamadaIcon, info: 'Cores', spec: '62 Cores Gloss', detalhe: 'Paleta vibrante e diversificada.' },
      { icon: RepelenciaIcon, info: 'Adesivo', spec: 'Clear Permanente', detalhe: 'Adesivo transparente base solvente.' },
      { icon: CertoIcon, info: 'Uso', spec: 'Recortes & Sinalização', detalhe: 'Perfeito para letras, logos e detalhes.' },
      { icon: RegeneracaoIcon, info: 'Durabilidade', spec: 'Até 6 Anos', detalhe: 'Excelente longevidade para uso externo.' }
    ],
    diferenciais: [
      { icon: CertoIcon, title: '62+ Cores', desc: 'Uma das maiores paletas de cores do mercado em alto brilho, incluindo a exclusiva linha de sinalização.', accent: 'Paleta Completa', image: '/assets/images/wrap_651_card.png' },
      { icon: RepelenciaIcon, title: 'Corte Preciso', desc: 'Formulação otimizada para plotters de corte. Weeding fácil e bordas perfeitas em letras e formas.', accent: 'Alta Precisão', image: '/assets/images/wrap_651_hero.png' },
      { icon: EscudoVazioIcon, title: '6 Anos Outdoor', desc: 'Cores mantêm brilho e intensidade por até 6 anos em exposição direta ao sol e intempéries.', accent: 'Resistência UV', image: '/assets/images/wrap_nzwrap_card.png' },
      { icon: PresenteIcon, title: 'Versatilidade', desc: 'Do detalhamento automotivo à sinalização comercial. O 651 atende demandas de alta precisão.', accent: 'Multiuso', image: '/assets/images/wrap_970ra_card.png' }
    ],
    benchmarks: [
      { metric: 'Precisão de Corte', desc: 'Performance de recorte e weeding', nz: [96, 94, 92], mercado: [88, 82, 76] },
      { metric: 'Resistência UV', desc: 'Manutenção de cor ao sol', nz: [92, 88, 84], mercado: [85, 76, 68] },
      { metric: 'Custo-Benefício', desc: 'Relação qualidade/preço', nz: [97, 96, 95], mercado: [80, 78, 75] },
      { metric: 'Versatilidade', desc: 'Amplitude de aplicações', nz: [95, 93, 91], mercado: [82, 78, 74] }
    ]
  }}>
    <section className="container" style={{ padding: '6rem 0' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Catálogo Oficial de Cores 651</h2>
          <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
            Selecione a cor para consultar os parâmetros e ficha técnica ou baixe a certificação original
          </p>
        </div>
        
        <a 
            href="/assets/docs/oracal-651-tds.pdf"
            download="ORACAL-651-Datasheet.pdf"
            style={{
              backgroundColor: 'transparent',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              padding: '0.75rem 1.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            BAIXAR DATASHEET COMPLETO 651
          </a>
      </div>
      <Oracal651ColorGrid />
    </section>
  </WrapProductPage>;
}



// Helper component for the colors grid
function Oracal670ColorGrid() {
  const [colors, setColors] = useState<{slug: string, code: string, hex: string, finish: string, namePT: string}[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      const { data } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('brand', 'Oracal 670')
        .eq('is_active', true)
        .order('sku');
      
      if (data) {
        setColors(data.map(d => ({
          slug: d.slug,
          code: d.sku ? d.sku.replace('670RA-', '') : d.name,
          hex: d.hex_code,
          finish: d.finish_type === 'Brilhante' || d.finish_type === 'Gloss' ? 'Gloss' : 'Matte',
          namePT: d.name
        })));
      }
    };
    fetchColors();
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    }}>
      {colors.map(color => (
        <Link 
          key={color.slug}
          to={`/wrap/oracal-670ra/${color.slug}`}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ 
              height: '100px', 
              backgroundColor: color.hex,
              borderBottom: '1px solid #222'
            }}></div>
            <div style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                  {color.code}
                </span>
                <span style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {color.finish}
                </span>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {color.namePT}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function Oracal670() {
  return <WrapProductPage data={{
    title: 'ORACAL 670RA',
    subtitle: 'Wrapping Film | O 651 Evoluído para Envelopamento',
    heroDescription: 'O lendário 651 foi redesenhado para envelopamento automotivo completo. Agora com largura profissional de 1,52m e a exclusiva tecnologia RapidAir® que elimina bolhas durante a aplicação. Mesma qualidade alemã ORAFOL, 18 cores sólidas (15 brilho + 3 foscas) e até 5 anos de durabilidade.',
    heroWarning: 'Todo o DNA do 651 em formato profissional — a escolha inteligente para wrapping com custo-benefício imbatível.',
    heroImage: '/assets/images/wrap_670ra_hero.png',
    specs: [
      { icon: CamadaIcon, info: 'Espessura', spec: '0,07mm (70μ)', detalhe: 'PVC polimérico super calandrado — mesma base do 651.' },
      { icon: EscudoVazioIcon, info: 'Largura', spec: '1,52m', detalhe: 'Largura profissional para cobertura completa de painéis.' },
      { icon: CamadaIcon, info: 'Metragem', spec: '1,52m × 20m', detalhe: 'Rolo estendido — 20 metros de comprimento.' },
      { icon: RepelenciaIcon, info: 'Tecnologia', spec: 'RapidAir® Anti-Bolhas', detalhe: 'Sistema exclusivo ORAFOL para aplicação sem entrada de ar.' },
      { icon: CertoIcon, info: 'Cores', spec: '18 Cores Sólidas', detalhe: '15 cores com brilho + 3 cores com acabamento fosco.' },
      { icon: RegeneracaoIcon, info: 'Durabilidade', spec: 'Até 5 Anos', detalhe: 'Garantia de fábrica ORAFOL para uso outdoor vertical.' }
    ],
    diferenciais: [
      { icon: CertoIcon, title: 'Largura 1,52m — Full Panel', desc: 'Enquanto o 651 tem 1,26m de largura (insuficiente para painéis inteiros), o 670RA vem com 1,52m — a medida padrão profissional que cobre capôs, portas e tetos sem emendas.', accent: 'Full Coverage', image: '/assets/images/wrap_670ra_card.png' },
      { icon: RepelenciaIcon, title: 'RapidAir® Anti-Bolhas', desc: 'Tecnologia exclusiva ORAFOL com microcanais no adesivo que permitem a saída total do ar durante a aplicação. Bolhas retidas são removidas facilmente só com a espátula.', accent: 'Zero Bolhas', image: '/assets/images/wrap_670ra_hero.png' },
      { icon: EscudoVazioIcon, title: 'DNA do 651 Comprovado', desc: 'Herda toda a resistência UV, estabilidade de cor e durabilidade do 651 — o vinil mais vendido da história da ORAFOL. Qualidade comprovada por décadas.', accent: 'Legado ORAFOL', image: '/assets/images/wrap_651_card.png' },
      { icon: PresenteIcon, title: 'Melhor Custo-Benefício', desc: 'Qualidade alemã ORAFOL para envelopamento profissional a um preço que viabiliza frotas e projetos de alto volume. O melhor investimento do segmento intermediário.', accent: 'Economia Real', image: '/assets/images/wrap_970ra_card.png' }
    ],
    benchmarks: [
      { metric: 'Facilidade de Aplicação', desc: 'RapidAir® vs adesivo convencional', nz: [95, 92, 89], mercado: [78, 72, 66] },
      { metric: 'Custo-Benefício', desc: 'Relação qualidade/preço para wrapping', nz: [97, 96, 95], mercado: [80, 76, 72] },
      { metric: 'Resistência UV', desc: 'Manutenção de cor ao sol (DNA do 651)', nz: [90, 86, 82], mercado: [82, 74, 66] },
      { metric: 'Cobertura por Rolo', desc: 'Área útil vs concorrentes', nz: [95, 95, 95], mercado: [78, 78, 78] }
    ]
  }}>
    <section className="container" style={{ padding: '6rem 0' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>CATÁLOGO DE CORES</h2>
        <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
          Selecione uma cor para ver aplicações reais em veículos
        </p>
      </div>
      <Oracal670ColorGrid />
    </section>
  </WrapProductPage>;
}
