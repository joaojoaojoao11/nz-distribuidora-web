import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from './Oracal670Colors.module.css';

export interface ColorData {
  code: string;
  nameEN: string;
  namePT: string;
  finish: 'Gloss' | 'Matte';
  hex: string;
  description: string;
  images: {
    suv: string;
    sedan: string;
    supercar: string;
  };
}

export const ORACAL_670_ASSETS_CACHE: Record<string, Partial<ColorData>> = {
  '010G': { images: { suv: '/assets/images/670ra/670ra-010g-1.png', sedan: '/assets/images/670ra/670ra-010g-2.png', supercar: '/assets/images/670ra/670ra-010g-3.png' } },
  '070G': { images: { suv: '/assets/images/670ra/670ra-070g-1.png', sedan: '/assets/images/670ra/670ra-070g-2.png', supercar: '/assets/images/670ra/670ra-070g-3.png' } },
  '070M': { images: { suv: '/assets/images/670ra/670ra-070m-1.png', sedan: '/assets/images/670ra/670ra-070m-2.png', supercar: '/assets/images/670ra/670ra-070m-3.png' } },
  '073G': { images: { suv: '/assets/images/670ra/670ra-073g-1.png', sedan: '/assets/images/670ra/670ra-073g-2.png', supercar: '/assets/images/670ra/670ra-073g-3.png' } },
  '073M': { images: { suv: '/assets/images/670ra/670ra-073m-1.png', sedan: '/assets/images/670ra/670ra-073m-2.png', supercar: '/assets/images/670ra/670ra-073m-3.png' } },
  '076G': { images: { suv: '/assets/images/670ra/670ra-076g-1.png', sedan: '/assets/images/670ra/670ra-076g-2.png', supercar: '/assets/images/670ra/670ra-076g-3.png' } },
  '076M': { images: { suv: '/assets/images/670ra/670ra-076m-1.png', sedan: '/assets/images/670ra/670ra-076m-2.png', supercar: '/assets/images/670ra/670ra-076m-3.png' } },
  '072G': { images: { suv: '/assets/images/670ra/670ra-072g-1.png', sedan: '/assets/images/670ra/670ra-072g-2.png', supercar: '/assets/images/670ra/670ra-072g-3.png' } },
  '040M': { images: { suv: '/assets/images/670ra/670ra-040m-1.png', sedan: '/assets/images/670ra/670ra-040m-2.png', supercar: '/assets/images/670ra/670ra-040m-3.png' } },
  '562G': { images: { suv: '/assets/images/670ra/670ra-562g-1.png', sedan: '/assets/images/670ra/670ra-562g-2.png', supercar: '/assets/images/670ra/670ra-562g-3.png' } },
  '084M': { images: { suv: '/assets/images/670ra/670ra-084m-1.png', sedan: '/assets/images/670ra/670ra-084m-2.png', supercar: '/assets/images/670ra/670ra-084m-3.png' } },
  '053G': { images: { suv: '/assets/images/670ra/670ra-053g-1.png', sedan: '/assets/images/670ra/670ra-053g-2.png', supercar: '/assets/images/670ra/670ra-053g-3.png' } },
  '056G': { images: { suv: '/assets/images/670ra/670ra-056g-1.png', sedan: '/assets/images/670ra/670ra-056g-2.png', supercar: '/assets/images/670ra/670ra-056g-3.png' } },
  '060M': { images: { suv: '/assets/images/670ra/670ra-060m-1.png', sedan: '/assets/images/670ra/670ra-060m-2.png', supercar: '/assets/images/670ra/670ra-060m-3.png' } },
  '064G': { images: { suv: '/assets/images/670ra/670ra-064g-1.png', sedan: '/assets/images/670ra/670ra-064g-2.png', supercar: '/assets/images/670ra/670ra-064g-3.png' } },
  '055G': { images: { suv: '/assets/images/670ra/670ra-055g-1.png', sedan: '/assets/images/670ra/670ra-055g-2.png', supercar: '/assets/images/670ra/670ra-055g-3.png' } },
  '066G': { images: { suv: '/assets/images/670ra/670ra-066g-1.png', sedan: '/assets/images/670ra/670ra-066g-2.png', supercar: '/assets/images/670ra/670ra-066g-3.png' } },
  '030G': { images: { suv: '/assets/images/670ra/670ra-030g-1.png', sedan: '/assets/images/670ra/670ra-030g-2.png', supercar: '/assets/images/670ra/670ra-030g-3.png' } },
  '031G': { images: { suv: '/assets/images/670ra/670ra-031g-1.png', sedan: '/assets/images/670ra/670ra-031g-2.png', supercar: '/assets/images/670ra/670ra-031g-3.png' } },
  '032G': { images: { suv: '/assets/images/670ra/670ra-032g-1.png', sedan: '/assets/images/670ra/670ra-032g-2.png', supercar: '/assets/images/670ra/670ra-032g-3.png' } },
  '047G': { images: { suv: '/assets/images/670ra/670ra-047g-1.png', sedan: '/assets/images/670ra/670ra-047g-2.png', supercar: '/assets/images/670ra/670ra-047g-3.png' } },
  '035G': { images: { suv: '/assets/images/670ra/670ra-035g-1.png', sedan: '/assets/images/670ra/670ra-035g-2.png', supercar: '/assets/images/670ra/670ra-035g-3.png' } },
  '021G': { images: { suv: '/assets/images/670ra/670ra-021g-1.png', sedan: '/assets/images/670ra/670ra-021g-2.png', supercar: '/assets/images/670ra/670ra-021g-3.png' } },
  '025G': { images: { suv: '/assets/images/670ra/670ra-025g-1.png', sedan: '/assets/images/670ra/670ra-025g-2.png', supercar: '/assets/images/670ra/670ra-025g-3.png' } }
};

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  hex_code: string;
  finish_type: string;
  technical_description: string;
  is_active: boolean;
}


export default function Oracal670ColorPage() {
  const { colorCode } = useParams<{ colorCode: string }>();
  const navigate = useNavigate();

  const [colorData, setColorData] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate color and normalize to uppercase
  const upCode = colorCode?.toUpperCase() || '';

  useEffect(() => {
    const fetchColor = async () => {
      setLoading(true);
      const slug = `670ra-${upCode.toLowerCase()}`;
      
      const { data, error } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
        
      if (data) {
        setColorData(data);
      }
      setLoading(false);
    };
    
    fetchColor();
  }, [upCode]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>Carregando produto...</div>;
  }

  if (!colorData) {
    return <Navigate to="/wrap/oracal-670ra" replace />;
  }

  const isLightColor = ['#ffffff', '#cfd2d3', '#fedb00', '#ecfa00', '#77b800', '#87c7e8', '#5cccb2'].includes(colorData.hex_code.toLowerCase());
  
  const assets = ORACAL_670_ASSETS_CACHE[upCode];
  const images = assets?.images || { suv: '/assets/images/wrap_sh_card.png', sedan: '/assets/images/wrap_sh_card.png', supercar: '/assets/images/wrap_sh_card.png' };

  return (
    <div className={styles.colorPage}>
      {/* Dynamic Hero Section */}
      <section 
        className={styles.hero} 
        style={{ 
          backgroundColor: colorData.hex_code,
          color: isLightColor ? '#111' : '#FFF'
        }}
      >
        <button 
          onClick={() => navigate('/wrap')}
          className={`${styles.backButton} ${isLightColor ? styles.backDark : styles.backLight}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          <span>NZWRAP Catálogo</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={styles.heroContent}
        >
          <div className={styles.badges}>
            <span className={`${styles.badge} ${isLightColor ? styles.badgeDark : styles.badgeLight}`}>
              ORACAL 670RA
            </span>
            <span className={`${styles.badge} ${isLightColor ? styles.badgeDark : styles.badgeLight}`}>
              {colorData.finish_type} Finish
            </span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.colorCode}>{upCode}</span>
            <span className={styles.colorName}>{colorData.name.split(' ')[0]}</span>
          </h1>
          
          <h2 className={styles.subtitle}>{colorData.name}</h2>
          
          <p className={styles.description}>
            {colorData.technical_description}
          </p>
          
          <div className={`${styles.techSpecs} ${isLightColor ? styles.techDark : ''}`}>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Largura</span>
              <span className={styles.techValue}>1,52m</span>
            </div>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Filme</span>
              <span className={styles.techValue}>Premium PVC (Não é Cast)</span>
            </div>
            <div className={styles.techItem}>
              <span className={styles.techLabel}>Tecnologia</span>
              <span className={styles.techValue}>RapidAir® (Antibolhas)</span>
            </div>
          </div>
        </motion.div>
        
        {/* Subtle gradient overlay to ensure text readability if needed */}
        {!isLightColor && <div className={styles.vignette}></div>}
      </section>

      {/* Gallery Section */}
      <section className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <h2>Aplicações em Tempo Real</h2>
          <p>Visões dinâmicas do {colorData.name} ({upCode})</p>
        </div>

        <div className={styles.grid}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={styles.gridItem}
          >
            <div className={styles.imageWrapper}>
              <img src={images.suv} alt={`${colorData.name} on SUV`} />
              <div className={styles.overlay}>
                <span>SUV Proportions</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.gridItem}
          >
            <div className={styles.imageWrapper}>
              <img src={images.sedan} alt={`${colorData.name} on Sedan`} />
              <div className={styles.overlay}>
                <span>Sport Sedan Curves</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.gridItem}
          >
            <div className={styles.imageWrapper}>
              <img src={images.supercar} alt={`${colorData.name} on Supercar`} />
              <div className={styles.overlay}>
                <span>Supercar Dynamics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
