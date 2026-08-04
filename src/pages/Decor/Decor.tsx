import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { staggerContainer, fadeUpItem } from './variants';
import BrandCards from './BrandCards';
import TechFeatures from './TechFeatures';
import ApplicationGrid from './ApplicationGrid';
import EnterpriseProjects from './EnterpriseProjects';
import styles from './Decor.module.css';

const WHATSAPP_URL = 'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20quero%20iniciar%20consultoria%20decorativa%20NZDecor.%20Meu%20projeto%20%C3%A9...';
const CONTACT_EMAIL = 'daniela@nzdistribuidora.com.br';

export default function Decor() {
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "NZDECOR — Envelopamento Decorativo Técnico",
    "description": "Envelopamento decorativo com vinil técnico de alta performance. Consultoria técnica, SH Decor e Etherna Decor.",
    "url": `${SITE_URL}/decor`
  });

  return (
    <div className={styles.page}>
      <SEO
        title="NZDECOR — Envelopamento Decorativo Técnico | NZ Group"
        description="Vinil decorativo profissional: antibacteriano, antifúngico, resistente a chamas. SH Decor + Etherna Decor + consultoria técnica."
        keywords="vinil decorativo, envelopamento arquitetônico, sh decor, etherna decor, tecnologia shield, decor tecnico"
        canonicalUrl="/decor"
        schema={schema}
      />

      {/* HERO */}
      <header className={styles.hero}>
        <img src="/assets/images/decor/decor_hero.jpg" alt="" className={styles.heroImage} />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div
            className={styles.heroTextContent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.img
              src="/assets/logos/nzdecor/logo-nzdecor-branco.png"
              alt="NZDECOR"
              className={styles.pageTitleImage}
              variants={fadeUpItem}
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Envelopamento decorativo com vinil técnico de alta performance. Para arquitetos, designers e projetos que tratam acabamento como sistema, não como enfeite.
            </motion.p>
            <motion.p className={styles.heroSubtitleWarning} variants={fadeUpItem}>
              O futuro do acabamento arquitetônico não é pintura. É especificação.
            </motion.p>
          </motion.div>
        </div>
      </header>

      <div className={styles.blackSpacer}></div>

      {/* MANIFESTO */}
      <section className={styles.manifestoSection}>
        <motion.div className={`container ${styles.manifestoContainer}`} variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <motion.h2 className={styles.manifestoTitle} variants={fadeUpItem}>
            VINIL DECORATIVO É ENGENHARIA DE SUPERFÍCIE
          </motion.h2>
          <motion.p className={styles.manifestoParagraph} variants={fadeUpItem}>
            Papel de parede protege por 2 anos. Pintura descasca com umidade. Laminado exige marcenaria. Vinil decorativo profissional resolve tudo isso ao mesmo tempo — antibacteriano, antifúngico, resistente a chamas, à prova d'água, aplicado sem obra, removível quando o projeto pedir.
          </motion.p>
          <motion.p className={styles.manifestoParagraph} variants={fadeUpItem}>
            A NZDecor distribui as duas linhas mais consistentes do mercado brasileiro — <Link to="/decor/sh"><strong>SH Decor</strong></Link> e <Link to="/decor/etherna"><strong>Etherna Decor</strong></Link> — e faz consultoria técnica com arquitetos, designers e integradores. Não vendemos rolo. Especificamos ambiente.
          </motion.p>
        </motion.div>
      </section>

      {/* DIFERENCIAIS TÉCNICOS */}
      <TechFeatures />

      {/* MARCAS */}
      <BrandCards />

      {/* APLICAÇÕES */}
      <ApplicationGrid />

      {/* PROJETOS EM ESCALA — hotelaria e franquias */}
      <EnterpriseProjects />

      {/* CTA FINAL */}
      <section className={styles.ctaSection}>
        <motion.div className={`container ${styles.ctaContainer}`} variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <motion.h2 className={styles.ctaTitle} variants={fadeUpItem}>
            ESPECIFICAÇÃO COMEÇA POR CONVERSA TÉCNICA.
          </motion.h2>
          <motion.p className={styles.ctaSubtitle} variants={fadeUpItem}>
            Nossa equipe recebe briefing do projeto e devolve: seleção de padrões compatíveis, amostras físicas na sua mesa e especificação técnica em PDF.
          </motion.p>
          <motion.div className={styles.ctaButtons} variants={fadeUpItem}>
            <a href={WHATSAPP_URL} className={styles.ctaPrimary} target="_blank" rel="noopener noreferrer">
              INICIAR CONSULTORIA
            </a>
          </motion.div>
          <motion.p className={styles.ctaEmail} variants={fadeUpItem}>
            ou escreva para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
}
