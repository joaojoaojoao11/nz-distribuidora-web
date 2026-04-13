import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from './ShWrappingColors.module.css';

export interface SHColorData {
  slug: string;
  nameEN: string;
  finish: string;
  hex: string;
  image: string;
  description: string;
  gallery?: {
    suv: string;
    sedan: string;
    supercar: string;
  };
}

export const SH_COLORS_ASSETS: Record<string, Partial<SHColorData>> = {
  'pearl-metal-space-grey': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-01.jpg', gallery: { suv: '/assets/images/sh/pm_sg_suv_v2.png', sedan: '/assets/images/sh/pm_sg_sedan_v2.png', supercar: '/assets/images/sh/pm_sg_supercar_v2.png' } },
  'fantastic-purple': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-02.jpg', gallery: { suv: '/assets/images/sh/fp_suv_v2.png', sedan: '/assets/images/sh/fp_sedan_v2.png', supercar: '/assets/images/sh/fp_supercar_v2.png' } },
  'amg-grey': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-03.jpg', gallery: { suv: '/assets/images/sh/ag_suv_v2.png', sedan: '/assets/images/sh/ag_sedan_v2.png', supercar: '/assets/images/sh/ag_supercar_v2.png' } },
  'mercury-silver': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-04.jpg', gallery: { suv: '/assets/images/sh/ms_suv_v2.png', sedan: '/assets/images/sh/ms_sedan_v2.png', supercar: '/assets/images/sh/ms_supercar_v2.png' } },
  'pearl-metal-black': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-05.jpg' },
  'soulmoving-red': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-06.jpg' },
  'candy-purple-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-07.jpg' },
  'matt-dark-purple': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-08.jpg' },
  'sao-paulo-yellow': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-09.jpg' },
  'fantastic-green-grey': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-10.jpg' },
  'crystal-glacial-blue': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-11.jpg' },
  'crystal-yellow': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-12.jpg' },
  'space-blue-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-13.jpg' },
  'deep-blue-gloss-metallic': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-14.jpg' },
  'blue-charm-green': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-15.jpg' },
  'pearl-metal-tiffany': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-20.jpg' },
  'crystal-white': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-17.jpg' },
  'crystal-silver': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-18.jpg' },
  'paprika-orange': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-19.jpg' },
  'bentley-pink': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-21.jpg' },
  'combat-green': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-22.jpg' },
  'khaki-green': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-23.jpg' },
  'crystal-champagne-gold': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-24.jpg' },
  'crystal-mamba-green': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-25.jpg' },
  'pearl-metal-sakura-pink': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-26.jpg' },
  'liquid-metal-somato-blue': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-27.jpg' },
  'glossy-nado-ash': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-28.jpg' },
  'amg-mountain-grey': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-29.jpg' },
  'ruby-red': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-30.jpg' },
  'pearl-white': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-31.jpg' },
  'pearl-metal-white': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-32.jpg' },
  'black-ceramic': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-33.jpg' },
  'glossy-black': { image: 'https://www.signhouse.com.br/storage/produtos/wrapping/sw-34.jpg' }
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

export default function ShWrappingColors() {
  const { colorCode } = useParams<{ colorCode: string }>();
  const navigate = useNavigate();
  
  const [productData, setProductData] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isTechSheetOpen, setIsTechSheetOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('web_catalog_products')
        .select('*')
        .eq('slug', colorCode || '')
        .eq('brand', 'SH Wrapping')
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        navigate('/wrap/sh-colors', { replace: true });
        return;
      }
      
      setProductData(data);
      
      const assets = SH_COLORS_ASSETS[data.slug];
      let imgList: string[] = [];
      if (assets?.gallery) {
        imgList = [assets.gallery.suv, assets.gallery.sedan, assets.gallery.supercar];
      } else if (assets?.image) {
        imgList = [assets.image];
      } else {
        imgList = ['/assets/images/wrap_sh_card.png'];
      }
      
      setImages(imgList);
      setActiveImage(imgList[0]);
      setLoading(false);
    };

    fetchProduct();
  }, [colorCode, navigate]);

  if (loading || !productData) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>Carregando produto...</div>;
  }
  
  const handleBuy = () => {
    const text = `Olá time NZ! Quero falar com um especialista sobre o envelopamento *${productData.name}* (${productData.finish_type}).`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={styles.colorPage}>
        {/* Background Cinematográfico */}
        <div 
          className={styles.pageBackground}
          style={{ backgroundImage: `url(${activeImage})` }}
        />
        <div className={styles.pageVignette} />

        <nav className={styles.topNav}>
          <button 
            onClick={() => navigate('/wrap/sh-colors')}
            className={styles.backButton}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Catálogo SH
          </button>
        </nav>

        <div className={styles.productContainer}>
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrapper}>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage || 'default'}
                  src={activeImage}
                  alt={productData.name}
                  className={styles.mainImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </div>
            
            <div className={styles.ThumbnailTrack}>
              {images.map((imgUrl, idx) => (
                <div 
                  key={idx}
                  className={`${styles.thumbnailCard} ${activeImage === imgUrl ? styles.active : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx}`} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.buyPanel}>
            <div className={styles.badges}>
              <span className={styles.badge} style={{ borderColor: productData.hex_code }}>{productData.finish_type}</span>
              <span className={styles.badge}>EM ESTOQUE</span>
              <span className={styles.badge}>+ VENDIDOS</span>
            </div>

            <h1 className={styles.productTitle}>{productData.name}</h1>
            <p className={styles.productFinish}>SH Wrapping Colors | Cola Antibolhas | 165µ</p>

            <div className={styles.productArticle}>
              <p className={styles.productDescription}>
                Projetado para superar expectativas, o envelopamento Automotivo <strong>{productData.name}</strong> eleva a estética do seu veículo a um padrão de exposição internacional. Trazendo um requinte visual inigualável, a tonalidade <strong>{productData.finish_type ? String(productData.finish_type).toLowerCase() : ''}</strong> reage à luz transformando as curvas e vincos da lataria.
              </p>
              <p className={styles.productDescription}>
                {productData.technical_description}
              </p>

              <ul className={styles.benefitsList}>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Tecnologia Air-Free (Cola Antibolhas) facilitando a aplicação.
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Película Premium Super Calandrada de 165µ.
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Alta resistência UV e durabilidade extrema contra intempéries.
                </li>
              </ul>

              <button className={styles.techSheetBtn} onClick={() => setIsTechSheetOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                BAIXAR FICHA TÉCNICA
              </button>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.checkoutBtn} onClick={handleBuy}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg>
                CONTINUAR COM ESPECIALISTA
              </button>
            </div>

          </div>
        </div>

        <AnimatePresence>
          {isTechSheetOpen && (
            <motion.div 
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTechSheetOpen(false)}
            >
              <motion.div 
                className={styles.modalContent}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div className={styles.modalBrand}>
                    <img src="/assets/images/logo-nz-preto.svg" alt="NZ Distribuidora" className={styles.nzLogo} />
                    <span>Ficha Técnica Oficial: {productData.name}</span>
                  </div>
                  <button className={styles.closeModalBtn} onClick={() => setIsTechSheetOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.techDescriptionBlock}>
                    <h3>Engenharia e Composição</h3>
                    <p>O vinil <strong>{productData.name}</strong> da linha SH Wrapping representa o auge da engenharia de filmes calandrados estruturais. Construído a partir de PVC super flexível multicamadas com espessura rigorosamente estipulada em 0,12mm ~ 0,13mm, este material entrega o perfeito balanço térmico para curvas acentuadas e envelopamento automotivo contínuo, reduzindo falhas de tensão estrutural a longo prazo.</p>
                  </div>

                  <div className={styles.chartSection}>
                    <h3>Desempenho da Película</h3>
                    
                    <div className={styles.chartBarGroup}>
                      <div className={styles.chartBarLabel}>
                        <span>Conformabilidade Térmica</span>
                        <span>95%</span>
                      </div>
                      <div className={styles.chartBarTrack}>
                        <div className={styles.chartBarFill} style={{ width: '95%' }}></div>
                      </div>
                    </div>

                    <div className={styles.chartBarGroup}>
                      <div className={styles.chartBarLabel}>
                        <span>Resistência UV Prolongada</span>
                        <span>100%</span>
                      </div>
                      <div className={styles.chartBarTrack}>
                        <div className={styles.chartBarFill} style={{ width: '100%', background: '#4ade80' }}></div>
                      </div>
                    </div>

                    <div className={styles.chartBarGroup}>
                      <div className={styles.chartBarLabel}>
                        <span>Aderência Reposicionável (Air-Free)</span>
                        <span>90%</span>
                      </div>
                      <div className={styles.chartBarTrack}>
                        <div className={styles.chartBarFill} style={{ width: '90%' }}></div>
                      </div>
                    </div>

                    <div className={styles.chartBarGroup}>
                      <div className={styles.chartBarLabel}>
                        <span>Dificuldade de Instalação</span>
                        <span>Baixa (45%)</span>
                      </div>
                      <div className={styles.chartBarTrack}>
                        <div className={styles.chartBarFill} style={{ width: '45%', background: '#f87171' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.techGrid}>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Dimensões do Rolo</span>
                      <span className={styles.techDataValue}>1,52m x 17,5m</span>
                    </div>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Espessura</span>
                      <span className={styles.techDataValue}>0,12mm - 0,13mm</span>
                    </div>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Durabilidade Esperada</span>
                      <span className={styles.techDataValue}>2 Anos</span>
                    </div>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Instalação</span>
                      <span className={styles.techDataValue}>A Seco (Secagem Rápida)</span>
                    </div>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Liner (Fundo Base)</span>
                      <span className={styles.techDataValue}>Filme PET - Poliéster</span>
                    </div>
                    <div className={styles.techData}>
                      <span className={styles.techDataLabel}>Removibilidade Sem Danos</span>
                      <span className={styles.techDataValue}>Até 12 Meses Pós-Instalação</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button className={styles.printBtn} onClick={() => window.print()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                    Imprimir Ficha Completa
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}
