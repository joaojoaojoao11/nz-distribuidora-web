import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NZWRAP_COLORS } from '../../lib/data/nzwrapColors';

export default function NzwrapColorPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  
  const foundData = NZWRAP_COLORS.find(c => c.sku.toLowerCase() === sku?.toLowerCase());
  const [activeImage, setActiveImage] = useState<string>(foundData?.images[0] || '');

  useEffect(() => {
    if (!foundData) {
      navigate('/wrap/nzwrap-premium', { replace: true });
    } else {
      setActiveImage(foundData.images[0]);
    }
  }, [sku, foundData, navigate]);

  if (!foundData) return null;

  const colorData = foundData;

  const handleBuy = () => {
    const text = `Olá time NZ! Quero solicitar a cor ${colorData.name} (${colorData.sku}) da linha premium.`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#0a0a0c', minHeight: '100vh', paddingBottom: '8rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Imersivo com Efeito Especial */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImage}
            src={activeImage}
            alt="Ambient"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              width: '100%', 
              height: '100vh', 
              objectFit: 'cover', 
              filter: 'blur(60px)', 
              transformOrigin: 'center top'
            }}
          />
        </AnimatePresence>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,10,12,0.6) 0%, rgba(10,10,12,0.95) 40%, #0a0a0c 100%)'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colorData.hex}33 0%, transparent 60%)`,
          opacity: 0.2
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Navbar space / Breadcrumb */}
        <nav style={{ padding: '8rem 5% 1rem 5%', maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/wrap')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
              fontSize: '0.85rem',
              padding: 0,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              (e.currentTarget.firstChild as HTMLElement).style.transform = 'translateX(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#888';
              (e.currentTarget.firstChild as HTMLElement).style.transform = 'translateX(0)';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 0.2s' }}
            >
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voltar ao Catálogo NZWRAP</span>
          </button>
        </nav>

        {/* Hero Imersivo */}
        <section style={{ padding: '1rem 5% 4rem 5%', position: 'relative' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 'clamp(3rem, 5vw, 5rem)', 
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {/* Informação e Tipografia */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.03)'
                }}>
                  {colorData.sku}
                </span>
                <span style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Acabamento {colorData.finish}
                </span>
              </div>

              <h1 style={{
                fontFamily: '"Playfair Display", "Lyon Text", serif',
                fontSize: 'clamp(3rem, 8vw, 5rem)',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                marginBottom: '1.5rem',
                textTransform: 'uppercase',
                textShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                {colorData.name}
              </h1>

              <p style={{
                fontFamily: '"Geist Sans", "Helvetica Neue", sans-serif',
                fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                color: '#a1a1aa',
                lineHeight: 1.6,
                marginBottom: '3rem',
                maxWidth: '90%'
              }}>
                Feito para as ruas. A cor <span style={{color: '#fff'}}>{colorData.name.toLowerCase()}</span> exibe uma pigmentação profunda projetada sob nossa laminação ultra-resistente. Refine a presença do seu portfólio.
              </p>

              <button 
                onClick={handleBuy}
                style={{
                  backgroundColor: '#D4AF37',
                  color: '#0a0a0c',
                  border: 'none',
                  padding: '1.1rem 2.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(212, 175, 55, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.2)';
                }}
              >
                SOLICITAR ORÇAMENTO
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </motion.div>

            {/* Imagem Principal Flutuante */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ position: 'relative' }}
            >
              <div style={{ 
                 position: 'relative', 
                 borderRadius: '8px', 
                 overflow: 'hidden',
                 border: '1px solid rgba(255,255,255,0.06)',
                 boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)'
              }}>
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    src={activeImage} 
                    alt={colorData.name}
                    initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      width: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </AnimatePresence>
                {/* Reflexo sobre a imagem */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }}></div>
              </div>

              {/* Thumbnail Toggles */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {colorData.images.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    style={{
                      width: '60px',
                      height: '40px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImage === img ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                      opacity: activeImage === img ? 1 : 0.4,
                      transition: 'all 0.3s ease',
                      boxShadow: activeImage === img ? '0 0 20px rgba(212,175,55,0.2)' : 'none'
                    }}
                    onMouseOver={(e) => { if(activeImage !== img) e.currentTarget.style.opacity = '0.8'; }}
                    onMouseOut={(e) => { if(activeImage !== img) e.currentTarget.style.opacity = '0.4'; }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Specifications Exclusivo */}
        <section style={{ maxWidth: '1400px', margin: 'clamp(2rem, 5vw, 4rem) auto 0 auto', padding: '0 5%' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
          }}>
            
            {/* Card Principal Garantia */}
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               style={{
                 border: '1px solid rgba(255,255,255,0.06)',
                 borderRadius: '12px',
                 padding: 'clamp(2rem, 5vw, 3rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.5)',
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
                 flexBasis: '100%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 flexWrap: 'wrap',
                 gap: '2rem',
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
               }}
            >
              <div>
                <span style={{ 
                  display: 'inline-block',
                  background: 'rgba(212, 175, 55, 0.1)', 
                  color: '#D4AF37', 
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  padding: '4px 12px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '1.5rem'
                }}>Paz de Espírito</span>
                <h3 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  3 Anos de Garantia<br/>Comprovados.
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: 'clamp(1rem, 2vw, 1.1rem)', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
                  A única linha do Brasil com cobertura absoluta na fábrica e na distribuidora contra deformações por stress térmico. Seu trabalho está blindado.
                </p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
                <img src="/assets/simbolos/simbolo-escudo-vazio.svg" alt="Garantia" style={{ width: 'clamp(60px, 8vw, 90px)', opacity: 0.9, position: 'relative', filter: 'invert(76%) sepia(35%) saturate(762%) hue-rotate(352deg) brightness(97%) contrast(88%)' }} />
              </div>
            </motion.div>

            {/* Menores */}
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ delay: 0.1 }}
               style={{
                 border: '1px solid rgba(255,255,255,0.05)',
                 borderRadius: '12px',
                 padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.4)',
                 backdropFilter: 'blur(10px)',
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                 display: 'flex',
                 flexDirection: 'column',
                 flex: '1 1 300px'
               }}
            >
              <h4 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>Tensão de Torque / Dobra</h4>
              <div style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>+40% Resistência</div>
              <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 0.95rem)', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>Com injeção híbrida e película anti-stretching, a cor não esbranquiça durante aplicações e curvaturas violentas.</p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ delay: 0.2 }}
               style={{
                 border: '1px solid rgba(255,255,255,0.05)',
                 borderRadius: '12px',
                 padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.4)',
                 backdropFilter: 'blur(10px)',
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                 display: 'flex',
                 flexDirection: 'column',
                 flex: '1 1 300px'
               }}
            >
              <h4 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>Sustentação do Efeito Viso</h4>
              <div style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Laminação Especial</div>
              <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 0.95rem)', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>Tratamento final em verniz flexível bloqueia 98% dos raios U.V, vitrificando a base para um resplendor de longo prazo.</p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ delay: 0.3 }}
               style={{
                 border: '1px solid rgba(255,255,255,0.05)',
                 borderRadius: '12px',
                 padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                 backgroundColor: 'rgba(15, 15, 18, 0.4)',
                 backdropFilter: 'blur(10px)',
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                 display: 'flex',
                 flexDirection: 'column',
                 flex: '1 1 300px'
               }}
            >
              <h4 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', fontWeight: 600 }}>Parâmetros da Engenharia</h4>
              <ul style={{ listStyle: 'none', margin: 'auto 0 0 0', padding: 0 }}>
                <li style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>Cola / Adesivo</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Air-Free Premium</span>
                </li>
                <li style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>Apresentação</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>1,52m x 15m</span>
                </li>
                <li style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                   <span style={{ color: '#888', fontSize: '0.9rem' }}>Complexidade</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Fácil (Reposicionável)</span>
                </li>
              </ul>
            </motion.div>

          </div>
        </section>

        {/* Ficha Técnica Detalhada */}
        <section style={{ maxWidth: '1400px', margin: '5rem auto 4rem auto', padding: '0 5%' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ 
              borderTop: '1px solid rgba(255,255,255,0.1)', 
              paddingTop: '4rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4rem'
            }}
          >
            {/* Título & Descrição Tech */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '1px', background: '#D4AF37' }}></div>
                <h4 style={{ color: '#D4AF37', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Inteligência Estrutural</h4>
              </div>
              <h2 style={{ 
                fontFamily: '"Playfair Display", serif', 
                fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', 
                color: '#fff', 
                marginBottom: '1.5rem',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
              }}>Ficha<br/>Técnica.</h2>
              <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                A Coleção Premium NZWRAP foi desenvolvida sob rigorosos testes de laboratório para atender estúdios de estética automotiva high-end. 
                Com durabilidade estendida e canais de ar estrategicamente desenhados, oferecemos uma experiência de aplicação fluida e um acabamento com aspecto duradouro de pintura original.
              </p>
            </div>

            {/* Tabela de Especificações */}
            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
              {[
                { label: 'Coleção', value: 'Premium Series' },
                { label: 'Material da Película', value: 'PVC Híbrido Polimérico Calandrado' },
                { label: 'Espessura do Filme', value: '140 mícrons (± 10)' },
                { label: 'Tubete Interno', value: '3 polegadas' },
                { label: 'Tipo de Adesivo', value: 'Acrílico Suspenso Solvente (Repositionable)' },
                { label: 'Tecnologia do Liner', value: 'Air-Free Density (PET Laminated)' },
                { label: 'Aplicação', value: 'Seca (Air Release Diamond)' },
                { label: 'Poder de Conformação', value: 'Curvas com graus complexos e moderados' },
                { label: 'Temperatura Ideal', value: '+18°C a +25°C (Recomendado na estufa / ambiente climatizado)' },
                { label: 'Garantia Padrão', value: '3 a 5 Anos (Vertical)' }
              ].map((spec, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'space-between', 
                  backgroundColor: '#0a0a0c', 
                  padding: '1.25rem',
                  gap: '1rem',
                  transition: 'background-color 0.2s',
                  cursor: 'default'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0a0a0c'}
                >
                  <span style={{ color: '#888', fontSize: '0.95rem', fontWeight: 500 }}>{spec.label}</span>
                  <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, textAlign: 'right' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
