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
    suv?: string;
    sedan?: string;
    supercar?: string;
    night?: string;
  };
}

export const SH_COLORS_ASSETS: Record<string, Partial<SHColorData>> = {
  'pearl-metal-space-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-01-380x300-317c406e.jpg', gallery: { suv: '/assets/images/sh/pm_sg_suv_v2.png', sedan: '/assets/images/sh/pm_sg_sedan_v2.png', supercar: '/assets/images/sh/pm_sg_supercar_v2.png' } },
  'fantastic-purple': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-02-380x300-a6d457b5.jpg', gallery: { suv: '/assets/images/sh/fantastic_purple_morning.png', sedan: '/assets/images/sh/fantastic_purple_afternoon.png', supercar: '/assets/images/sh/fantastic_purple_sunset.png', night: '/assets/images/sh/fantastic_purple_night.png' } },
  'amg-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-03-380x300-2bb35afc.jpg', gallery: { suv: '/assets/images/sh/ag_suv_v2.png', sedan: '/assets/images/sh/ag_sedan_v2.png', supercar: '/assets/images/sh/ag_supercar_v2.png' } },
  'mercury-silver': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-04-380x300-3f98b907.jpg', gallery: { suv: '/assets/images/sh/mercury_silver_morning.png', sedan: '/assets/images/sh/mercury_silver_afternoon.png', supercar: '/assets/images/sh/mercury_silver_sunset.png', night: '/assets/images/sh/mercury_silver_night.png' } },
  'pearl-metal-black': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-05-380x300-b2ffb44e.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_black_morning.png', sedan: '/assets/images/sh/pearl_metal_black_afternoon.png', supercar: '/assets/images/sh/pearl_metal_black_sunset.png', night: '/assets/images/sh/pearl_metal_black_night.png' } },
  'soulmoving-red': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-06-380x300-2557a395.jpg' },
  'candy-purple-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-07-380x300-a830aedc.jpg', gallery: { suv: '/assets/images/sh/candy_purple_morning.png', sedan: '/assets/images/sh/candy_purple_afternoon.png', supercar: '/assets/images/sh/candy_purple_sunset.png', night: '/assets/images/sh/candy_purple_night.png' } },
  'matt-dark-purple': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-23-380x300-dba90aca.jpg', gallery: { suv: '/assets/images/sh/matt_dark_purple_morning.png', sedan: '/assets/images/sh/matt_dark_purple_afternoon.png', supercar: '/assets/images/sh/matt_dark_purple_sunset.png', night: '/assets/images/sh/matt_dark_purple_night.png' } },
  'bentley-pink': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-08-380x300-ba1ca466.jpg', gallery: { suv: '/assets/images/sh/bentley_pink_morning.png', sedan: '/assets/images/sh/bentley_pink_afternoon.png', supercar: '/assets/images/sh/bentley_pink_sunset.png', night: '/assets/images/sh/bentley_pink_night.png' } },
  'sao-paulo-yellow': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-09-380x300-377ba92f.jpg', gallery: { suv: '/assets/images/sh/sao_paulo_yellow_suv.jpeg', sedan: '/assets/images/sh/sao_paulo_yellow_sedan.jpeg', supercar: '/assets/images/sh/sao_paulo_yellow_supercar.jpeg', night: '/assets/images/sh/sao_paulo_yellow_night.jpeg' } },
  'fantastic-green-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-10-380x300-c416653c.jpg', gallery: { suv: '/assets/images/sh/fantastic_green_grey_morning.png', sedan: '/assets/images/sh/fantastic_green_grey_afternoon.png', supercar: '/assets/images/sh/fantastic_green_grey_sunset.png', night: '/assets/images/sh/fantastic_green_grey_night.png' } },
  'crystal-glacial-blue': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-11-380x300-49716875.jpg', gallery: { suv: '/assets/images/sh/crystal_glacial_blue_morning.png', sedan: '/assets/images/sh/crystal_glacial_blue_afternoon.png', supercar: '/assets/images/sh/crystal_glacial_blue_sunset.png', night: '/assets/images/sh/crystal_glacial_blue_night.png' } },
  'crystal-yellow': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-21-380x300-c1661058.jpg', gallery: { suv: '/assets/images/sh/crystal_yellow_morning.png', sedan: '/assets/images/sh/crystal_yellow_afternoon.png', supercar: '/assets/images/sh/crystal_yellow_sunset.png', night: '/assets/images/sh/crystal_yellow_night.png' } },
  'crystal-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-12-380x300-ded97fae.jpg', gallery: { suv: '/assets/images/sh/crystal_white_morning.png', sedan: '/assets/images/sh/crystal_white_afternoon.png', supercar: '/assets/images/sh/crystal_white_sunset.png', night: '/assets/images/sh/crystal_white_night.png' } },
  'space-blue-gloss-aluminium': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-30-380x300-340c350a.jpg' },

  'blue-charm-green': { image: 'https://www.signhouse.com.br/storage/images/cache/blue-charm-green-380x300-2b439023.jpg', gallery: { suv: '/assets/images/sh/blue_charm_green_morning.png', sedan: '/assets/images/sh/blue_charm_green_afternoon.png', supercar: '/assets/images/sh/blue_charm_green_sunset.png', night: '/assets/images/sh/blue_charm_green_night.png' } },
  'pearl-metal-tiffany': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-24-380x300-cf82e931.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_tiffany_suv.jpeg', sedan: '/assets/images/sh/pearl_metal_tiffany_sedan.jpeg', supercar: '/assets/images/sh/pearl_metal_tiffany_supercar.jpeg' } },
  'crystal-silver': { image: 'https://www.signhouse.com.br/storage/images/cache/crystal-silver-380x300-2d0a2fde.jpg', gallery: { suv: '/assets/images/sh/crystal_silver_morning.png', sedan: '/assets/images/sh/crystal_silver_afternoon.png', supercar: '/assets/images/sh/crystal_silver_sunset.png', night: '/assets/images/sh/crystal_silver_night.png' } },
  'paprika-orange': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-17-380x300-d03d86c7.jpg', gallery: { suv: '/assets/images/sh/paprika_orange_gloss_metallic_morning.png', sedan: '/assets/images/sh/paprika_orange_gloss_metallic_afternoon.png', supercar: '/assets/images/sh/paprika_orange_gloss_metallic_sunset.png', night: '/assets/images/sh/paprika_orange_gloss_metallic_night.png' } },
  'combat-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-16-380x300-5d5a8b8e.jpg', gallery: { suv: '/assets/images/sh/combat_green_morning.png', sedan: '/assets/images/sh/combat_green_afternoon.png', supercar: '/assets/images/sh/combat_green_sunset.png', night: '/assets/images/sh/combat_green_night.png' } },
  'khaki-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-28-380x300-4a06f450.jpg', gallery: { suv: '/assets/images/sh/khaki_green_morning.png', sedan: '/assets/images/sh/khaki_green_afternoon.png', supercar: '/assets/images/sh/khaki_green_sunset.png', night: '/assets/images/sh/khaki_green_night.png' } },
  'crystal-champagne-gold': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-20-380x300-4c011d11.jpg', gallery: { suv: '/assets/images/sh/crystal_champagne_gold_morning.png', sedan: '/assets/images/sh/crystal_champagne_gold_afternoon.png', supercar: '/assets/images/sh/crystal_champagne_gold_sunset.png', night: '/assets/images/sh/crystal_champagne_gold_night.png' } },
  'crystal-mamba-green': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-27-380x300-582afeea.jpg', gallery: { suv: '/assets/images/sh/crystal_mamba_green_morning.png', sedan: '/assets/images/sh/crystal_mamba_green_afternoon.png', supercar: '/assets/images/sh/crystal_mamba_green_sunset.png', night: '/assets/images/sh/crystal_mamba_green_night.png' } },
  'pearl-metal-sakura-pink': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-29-380x300-c761f919.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_sakura_pink_suv_v2.png', sedan: '/assets/images/sh/pearl_metal_sakura_pink_sedan_v2.png', supercar: '/assets/images/sh/pearl_metal_sakura_pink_supercar_v2.png' } },
  'liquid-metal-somato-blue': { image: 'https://www.signhouse.com.br/storage/images/cache/liquid-metal-somato-blue-380x300-deead0e2.png', gallery: { suv: '/assets/images/sh/liquid_metal_somato_blue_morning.png', sedan: '/assets/images/sh/liquid_metal_somato_blue_afternoon.png', supercar: '/assets/images/sh/liquid_metal_somato_blue_sunset.png', night: '/assets/images/sh/liquid_metal_somato_blue_night.png' } },
  'glossy-nado-ash': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-26-380x300-d54df3a3.jpg', gallery: { suv: '/assets/images/sh/glossy_nando_ash_morning.png', sedan: '/assets/images/sh/glossy_nando_ash_afternoon.png', supercar: '/assets/images/sh/glossy_nando_ash_sunset.png', night: '/assets/images/sh/glossy_nando_ash_night.png' } },
  'amg-mountain-grey': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-03-380x300-2bb35afc.jpg', gallery: { suv: '/assets/images/sh/ag_suv_v2.png', sedan: '/assets/images/sh/ag_sedan_v2.png', supercar: '/assets/images/sh/ag_supercar_v2.png' } },

  'pearl-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-14-380x300-4795911c.jpg', gallery: { suv: '/assets/images/sh/pearl_white_suv.jpeg', sedan: '/assets/images/sh/pearl_white_sedan.jpeg', supercar: '/assets/images/sh/pearl_white_supercar.jpeg' } },
  'pearl-metal-white': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-19-380x300-4f768134.jpg', gallery: { suv: '/assets/images/sh/pearl_metal_white_suv.jpeg', sedan: '/assets/images/sh/pearl_metal_white_sedan.jpeg', supercar: '/assets/images/sh/pearl_metal_white_supercar.jpeg' } },

  'glossy-black': { image: 'https://www.signhouse.com.br/storage/images/cache/sw-13-380x300-53be72e7.jpg', gallery: { suv: '/assets/images/sh/glossy_black_morning.png', sedan: '/assets/images/sh/glossy_black_afternoon.png', supercar: '/assets/images/sh/glossy_black_sunset.png', night: '/assets/images/sh/glossy_black_night.png' } }
};

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  hex_code: string;
  finish_type: string;
  technical_description: string;
  is_active: boolean;
  sku?: string;
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
        imgList = [
          assets.gallery.suv, 
          assets.gallery.sedan, 
          assets.gallery.supercar,
          assets.gallery.night
        ].filter(Boolean) as string[];
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
            <div className={styles.badges} style={{ marginBottom: '1rem' }}>
              <span className={styles.badge} style={{ borderColor: productData.hex_code }}>{productData.finish_type}</span>
              <span className={styles.badge}>EM ESTOQUE</span>
              <span className={styles.badge}>+ VENDIDOS</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span style={{ backgroundColor: '#222', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                SKU: {productData.sku || 'N/D'}
              </span>
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
