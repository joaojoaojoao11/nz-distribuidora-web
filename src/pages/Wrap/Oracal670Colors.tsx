import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';
import ColorSeoSection from '../../components/Wrap/ColorSeoSection';
import { buildColorSchema } from '../../lib/colorSchema';
import styles from './Oracal670Colors.module.css';

// Fotos da cor (NZ RealColor, 05/10/2026) — as mesmas da loja, para a página da linha não
// mostrar outra cor. Geradas: shop/oracal-670ra/aplicacao/oracal-670-<slug>-2..4.jpg (frente,
// traseira, perfil) e -5 (detalhe do acabamento) onde existe. Reais: carros envelopados por
// instaladores (Sign House, placas borradas) em shop/oracal-670ra/reais/oracal-670-<slug>-rN.jpg.
// O <slug> é o mesmo de web_catalog_products. Chave = código da cor (sku sem "670RA-").
const FOTOS_670: Record<string, { macro?: boolean; reais: number }> = {
  '010G': { reais: 0 }, '021G': { reais: 2 }, '025G': { reais: 0 }, '030G': { reais: 2 },
  '031G': { macro: true, reais: 2 }, '032G': { reais: 2 }, '035G': { reais: 2 }, '040M': { reais: 2 },
  '047G': { reais: 0 }, '053G': { reais: 2 }, '055G': { reais: 2 }, '056G': { reais: 2 },
  '060M': { macro: true, reais: 2 }, '064G': { reais: 2 }, '066G': { reais: 2 }, '070G': { reais: 0 },
  '070M': { reais: 2 }, '072G': { reais: 2 }, '073G': { reais: 1 }, '073M': { reais: 2 },
  '076G': { reais: 0 }, '076M': { reais: 2 }, '084M': { reais: 2 }, '562G': { reais: 2 },
};

interface Foto { src: string; rotulo: string; alt: string }

function fotosDaCor(code: string, slug: string, nome: string): Foto[] {
  const cfg = FOTOS_670[code];
  if (!cfg) return [];
  const base = `/assets/images/shop/oracal-670ra`;
  const geradas: [number, string][] = [[2, 'Frente 3/4'], [3, 'Traseira 3/4'], [4, 'Perfil']];
  if (cfg.macro) geradas.push([5, 'Detalhe do acabamento']);
  return [
    ...geradas.map(([n, rotulo]) => ({
      src: `${base}/aplicacao/oracal-670-${slug}-${n}.jpg`, rotulo, alt: `${nome} — ${rotulo.toLowerCase()}`,
    })),
    ...Array.from({ length: cfg.reais }, (_, i) => ({
      src: `${base}/reais/oracal-670-${slug}-r${i + 1}.jpg`, rotulo: 'Foto real · instalador',
      alt: `Foto real de carro envelopado com ORACAL 670RA ${nome}`,
    })),
  ];
}

// Texto escuro sobre cor clara. Antes era uma lista fixa de hex, que deixou de bater quando o
// hex das cores foi corrigido (texto branco sobre o White e os cinzas claros).
function corClara(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.36;
}

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


export default function Oracal670ColorPage() {
  const { colorCode } = useParams<{ colorCode: string }>();
  const navigate = useNavigate();

  const [colorData, setColorData] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [upCode, setUpCode] = useState<string>('');

  useEffect(() => {
    const fetchColor = async () => {
      setLoading(true);
      if (!colorCode) return;
      
      const { data } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('slug', colorCode)
        .eq('is_active', true)
        .single();
        
      if (data) {
        setColorData(data);
        if (data.sku) {
          setUpCode(data.sku.replace('670RA-', '').toUpperCase());
        } else {
          setUpCode(data.name.split(' ')[0].toUpperCase());
        }
      }
      setLoading(false);
    };
    
    fetchColor();
  }, [colorCode]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>Carregando produto...</div>;
  }

  if (!colorData) {
    return <Navigate to="/wrap/oracal-670ra" replace />;
  }

  const isLightColor = corClara(colorData.hex_code);
  const fotos = fotosDaCor(upCode, colorData.slug, colorData.name);

  return (
    <div className={styles.colorPage}>
      <SEO
        title={`${colorData.name} — ORACAL 670RA`}
        description={`Cor ${colorData.name} da linha ORACAL 670RA. Veja o acabamento, peça amostra e compre com a NZ Distribuidora.`}
        canonicalUrl={`/wrap/oracal-670ra/${colorData.slug}`}
        schema={buildColorSchema({
          name: colorData.name,
          path: `/wrap/oracal-670ra/${colorData.slug}`,
          brand: 'Oracal 670',
          catalogPath: '/wrap/oracal-670ra',
          catalogLabel: 'Oracal 670RA',
          sku: colorData.sku,
          hex: colorData.hex_code,
          description: colorData.technical_description,
        })}
      />
      {/* Dynamic Hero Section */}
      <section 
        className={styles.hero} 
        style={{ 
          backgroundColor: colorData.hex_code,
          color: isLightColor ? '#111' : '#FFF',
          paddingTop: '8rem'
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
              {colorData.finish_type}
            </span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.colorCode}>{upCode}</span>
            <span className={styles.colorName}>{colorData.name.replace(upCode, '').trim()}</span>
          </h1>
          
          <h2 className={styles.subtitle}>{colorData.technical_name || colorData.name}</h2>
          
          <p className={styles.description}>
            {colorData.technical_description || 'O lendário 651 agora foi otimizado para instalações de wrapping.'}
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
          <h2>A cor aplicada</h2>
          <p>{colorData.name} ({upCode}) em veículo — fotos de referência e fotos reais de instaladores</p>
        </div>

        <div className={styles.grid}>
          {fotos.map((f, i) => (
            <motion.div
              key={f.src}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: Math.min(i, 3) * 0.1 }}
              className={styles.gridItem}
            >
              <div className={styles.imageWrapper}>
                <img src={f.src} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                <div className={styles.overlay}>
                  <span>{f.rotulo}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <ColorSeoSection
        name={colorData.name}
        brandLabel="Oracal 670RA"
        catalogPath="/wrap/oracal-670ra"
        sku={colorData.sku}
        finish={colorData.finish_type}
        hex={colorData.hex_code}
        description={colorData.technical_description}
      />
    </div>
  );
}
