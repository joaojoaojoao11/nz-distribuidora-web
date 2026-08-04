import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  technical_name?: string;
  hex_code: string;
  finish_type: string;
  technical_description: string;
  is_active: boolean;
}

export default function Oracal651Colors() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [colorData, setColorData] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [upCode, setUpCode] = useState<string>('');

  useEffect(() => {
    const fetchColor = async () => {
      setLoading(true);
      if (!id) return;
      
      const { data, error } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('slug', id)
        .eq('is_active', true)
        .single();
        
      if (data) {
        setColorData(data);
        if (data.sku) {
          setUpCode(data.sku.toUpperCase());
        } else {
          setUpCode(data.name.split(' ')[0].toUpperCase());
        }
      } else {
         console.error(error);
      }
      setLoading(false);
    };
    
    fetchColor();
  }, [id]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>Carregando produto 651...</div>;
  }

  if (!colorData) {
    return <Navigate to="/wrap" replace />;
  }

  // Identificar se a cor é clara para ajuste de texto, se necessário.
  // const isLightColor = ['#ffffff', '#e6e9ee', '#dad9e1', '#fbaa00', '#e6a700', '#fec500', '#f2ca00', '#f2e210', '#ebd494', '#cec09f'].includes(colorData.hex_code.toLowerCase());
  
  const activeImage = '/assets/images/bg_nzwrap_premium.jpg';

  const handleBuy = () => {
    const text = `Olá time NZ! Quero solicitar ${colorData.name} (${upCode}) da linha Oracal 651. Tenho interesse em bobinas/rolos fechados.`;
    window.open(`https://wa.me/5511953258757?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#0a0a0c', minHeight: '100vh', paddingBottom: '8rem', position: 'relative', overflow: 'hidden' }}>
      <SEO
        title={`${colorData.name} — ORACAL 651`}
        description={`Cor ${colorData.name} da linha ORACAL 651. Veja o acabamento, peça amostra e compre com a NZ Distribuidora.`}
        canonicalUrl={`/wrap/oracal-651/${colorData.slug}`}
      />

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
              filter: 'blur(60px) grayscale(100%)', 
              transformOrigin: 'center top'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
          background: `radial-gradient(ellipse at center, ${colorData.hex_code}33 0%, transparent 60%)`,
          opacity: 0.2
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Navbar space / Breadcrumb Ultra Visível */}
        <nav style={{ paddingTop: '8rem', paddingLeft: '5%', paddingRight: '5%', maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/wrap')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
              fontSize: '0.9rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              fontWeight: 600
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              (e.currentTarget.firstChild as HTMLElement).style.transform = 'translateX(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              (e.currentTarget.firstChild as HTMLElement).style.transform = 'translateX(0)';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 0.2s' }}
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span style={{ letterSpacing: '0.05em' }}>Voltar ao Catálogo Completo</span>
          </button>
        </nav>

        {/* Hero Imersivo */}
        <section style={{ padding: '3rem 5% 4rem 5%', position: 'relative' }}>
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
                  fontSize: '1rem',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  fontWeight: 600
                }}>
                  {upCode}
                </span>
                <span style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Acabamento {colorData.finish_type}
                </span>
              </div>

              <h1 style={{
                fontFamily: '"Playfair Display", "Lyon Text", serif',
                fontSize: 'clamp(3rem, 8vw, 5.5rem)',
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

              <div style={{
                padding: '1rem',
                borderLeft: '3px solid #38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.03)',
                marginBottom: '2.5rem',
                maxWidth: '90%'
              }}>
                <p style={{
                  fontFamily: '"Geist Sans", "Helvetica Neue", sans-serif',
                  fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
                  color: '#e4e4e7',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 400
                }}>
                  A liderança mundial em plotagem calandrada. A formulação excepcional da ORAFOL® une adesivos de altíssima tack inicial com uma película de estabilidade dimensional inabalável. 
                  <strong style={{color: '#fff', fontWeight: 600}}> O 651 rivaliza até mesmo com películas cast de alta performance.</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleBuy}
                  style={{
                    backgroundColor: '#38bdf8',
                    color: '#0a0a0c',
                    border: 'none',
                    padding: '1.1rem 2.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 10px 30px rgba(56, 189, 248, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(56, 189, 248, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(56, 189, 248, 0.25)';
                  }}
                >
                  SOLICITAR ORÇAMENTO (BOBINA)
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>

                <a 
                  href="/assets/docs/oracal-651-tds.pdf"
                  download="ORACAL-651-Datasheet.pdf"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '1.1rem 2rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  BAIXAR DATASHEET OFICIAL
                </a>
              </div>
            </motion.div>

            {/* Swatch de Cor Solido para o 651 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            >
              <div style={{ 
                 position: 'relative', 
                 borderRadius: '24px', 
                 width: '100%',
                 maxWidth: '500px',
                 aspectRatio: '1',
                 backgroundColor: colorData.hex_code,
                 border: '1px solid rgba(255,255,255,0.06)',
                 boxShadow: `0 40px 100px -20px ${colorData.hex_code}66, inset 0 2px 20px rgba(255,255,255,0.2), inset 0 -5px 20px rgba(0,0,0,0.2)`
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
                  pointerEvents: 'none'
                }}></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Specifications Exclusivo para 651 */}
        <section style={{ maxWidth: '1400px', margin: 'clamp(2rem, 5vw, 4rem) auto 0 auto', padding: '0 5%' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
          }}>
            
            {/* Card Principal - Prova Social & Qualidade Absoluta */}
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
                  background: 'rgba(56, 189, 248, 0.1)', 
                  color: '#38bdf8', 
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  padding: '4px 12px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '1.5rem'
                }}>O Padrão Ouro Mundial</span>
                <h3 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Uma Categoria<br/>Própria.
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: 'clamp(1rem, 2vw, 1.1rem)', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
                  A estabilidade dimensional superior do <strong>Oracal 651</strong> não apenas estabeleceu o patamar mais alto da indústria, mas rivaliza perfeitamente com películas PVC Cast concorrentes. Você não está apenas aplicando um vinil calandrado: está instalando a herança centenária de precisão e rastreabilidade (ISO 9001) da ORAFOL alemã. Produtividade absoluta garantida.
                </p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
                <img src="/assets/simbolos/simbolo-escudo-vazio.svg" alt="Garantia Orafol" style={{ width: 'clamp(80px, 10vw, 120px)', opacity: 0.9, position: 'relative', filter: 'invert(58%) sepia(87%) saturate(1661%) hue-rotate(184deg) brightness(101%) contrast(97%)' }} loading="lazy" decoding="async" />
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
              <h4 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>Vida Útil Outdoor Extrema</h4>
              <div style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Até 6 Anos</div>
              <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 0.95rem)', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>Homologado em clima vertical extremo. Resistência ao sol inclemente e 100h de blindagem marítima/salina a 23°C sem sofrer variações.</p>
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
              <h4 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>Weeding Suave (Depilação)</h4>
              <div style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Liner 84# de Silicone</div>
              <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 0.95rem)', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>Fora a espessura ideal, possui papel revestido por formulação exclusiva da Orafol para desprendimento rápido de excessos. Sem bordas travadas.</p>
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
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>Adesivo Robusto</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Acrílico Base-Solvente Clear</span>
                </li>
                <li style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>Classificação de Fogo</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>CBM ASTM E 84-07 Classe "A"</span>
                </li>
                <li style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                   <span style={{ color: '#888', fontSize: '0.9rem' }}>Alongamento Máx (DIN ISO 527)</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Mais de 130% na Quebra</span>
                </li>
              </ul>
            </motion.div>

          </div>
        </section>

        {/* Ficha Técnica Tabular (Baseada no Datasheet Oficial PDF) */}
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
                <div style={{ width: '40px', height: '1px', background: '#38bdf8' }}></div>
                <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Especificações Técnicas Oficiais</h4>
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
                Dados extraídos sob a certificação e controle rigoroso internacional. O ORACAL® 651 apresenta estabilidade térmica a extremos de temperatura (-40° a 80°C), livre de emendas indesejáveis (Splice Free) e garantia absoluta em lote de fabricação ISO 9001. A escolha mais inteligente e econômica do seu balcão.
              </p>
            </div>

            {/* Tabela de Especificações */}
            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
              {[
                { label: 'Coleção Oficial', value: 'ORACAL® 651™ Intermediate Calendered' },
                { label: 'Construção da Película', value: 'PVC Calandrado de Alta Estabilidade' },
                { label: 'Espessura (sem liner e adesivo)', value: '2.5 mil (aprox. 63 mícrons)' },
                { label: 'Tubete / Dimensão do Rolo', value: '1,26m x 50m / Tubete de 3 Polegadas' },
                { label: 'Tecnologia do Adesivo', value: 'Clear Acrílico Base-Solvente, Permanente' },
                { label: 'Força de Adesão (FINAT TM-1, média 24h)', value: '4.1 lb/in em superfície de aço inoxidável' },
                { label: 'Estabilidade Dimensional (FINAT TM-14)', value: 'Zero encolhimento na direção transversal (<.016")' },
                { label: 'Resistência Termal (no alumínio)', value: '-40°C a +80°C (Nenhuma variação)' },
                { label: 'Resistência ao Fogo (DIN 75200)', value: 'Autoextinguível / ASTM E 84-07 Classe "A"' },
                { label: 'Resistência à Água do Mar (DIN 50 021)', value: '100 horas a 23°C sem variação' },
                { label: 'Expectativa Fixada (Exposição Vertical)', value: 'Cores Solidas: 6 Anos / Metálicos: 4 Anos' }
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
