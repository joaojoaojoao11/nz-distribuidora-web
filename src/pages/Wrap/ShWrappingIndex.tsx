import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from './ShWrappingIndex.module.css';

interface ShProduct {
  id: string;
  slug: string;
  name: string;
  hex_code: string;
  finish_type: string;
}

export default function ShWrappingIndex() {
  const navigate = useNavigate();
  const [colors, setColors] = useState<ShProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColors = async () => {
      setLoading(true);
      const { data, error: _error } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('brand', 'SH Wrapping')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setColors(data);
      }
      setLoading(false);
    };

    fetchColors();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className={styles.brandBadge}>SH WRAPPING COLORS</div>
          <h1 className={styles.title}>Alta Performance em PVC</h1>
          <p className={styles.subtitle}>
            A linha SH Wrapping Colors é composta por 30 películas com tecnologia super calandrada multicamadas e cola reposicionável com microcanais de ar, elevando a durabilidade e o padrão do envelopamento de luxo a um novo nível.
          </p>
          
          <button 
            onClick={() => navigate('/wrap')}
            className={styles.backButton}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Voltar para Linhas Wrap
          </button>
        </motion.div>
      </section>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#6d7275' }}>
          Carregando catálogo de cores...
        </div>
      ) : (
        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {colors.map((color) => (
            <motion.div key={color.slug} variants={itemVariants}>
              <Link to={`/wrap/sh-colors/${color.slug}`} className={styles.colorCard}>
                <div 
                  className={styles.colorBlock} 
                  style={{ backgroundColor: color.hex_code }}
                />
                <div className={styles.colorInfo}>
                  <h3 className={styles.colorName}>{color.name}</h3>
                  <span className={styles.colorFinish}>{color.finish_type}</span>
                </div>
                <div className={styles.hoverOverlay} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
