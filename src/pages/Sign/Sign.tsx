import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import AveryBlock from './AveryBlock';
import MetamarkBlock from './MetamarkBlock';
import { metamarkSkus } from './metamarkMd80';
import styles from './Sign.module.css';
import { LinkVendas } from '../../components/ContatoVendas/ContatoVendas';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function Sign() {
  /* As famílias Avery não entram no mainEntity: cada uma já emite o próprio
   * @type Product na sua rota /sign/:slug, via SignProduct.tsx. */
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'NZSIGN — Metamark MD-80 e Avery Dennison',
    description:
      'NZSIGN é a divisão de comunicação visual da NZ Group. Distribuímos a linha Metamark MD-80 (lançamento setembro/2026) e a linha Avery Dennison completa.',
    url: `${SITE_URL}/sign`,
    mainEntity: metamarkSkus.map((sku) => ({
      '@type': 'Product',
      name: `Metamark ${sku.code}`,
      brand: { '@type': 'Brand', name: 'Metamark' },
      description: sku.description,
      manufacturer: { '@type': 'Organization', name: 'Metamark (UK) Limited' },
    })),
  });

  return (
    <div className={styles.page}>
      <SEO
        title="NZSIGN — Metamark MD-80 e Avery Dennison"
        description="Distribuição Metamark MD-80 (impressão digital branca brilho e fosco, adesivo cinza blockout) e linha Avery Dennison completa. Vinil de recorte Oracal 651 em 62 cores. Vinis para comunicação visual profissional no Brasil, com garantia de fábrica."
        keywords="metamark md-80, metamark md-80b, metamark md-81m, metamark brasil, vinil impressão digital, branco brilho impressão, branco fosco impressão, adesivo cinza blockout, avery dennison brasil, mpi 1105, mpi 2105, dol sobrelaminado, etchmark, metamark 7 series, vinil de recorte metamark, oracal 651, vinil de recorte orafol, nzsign"
        canonicalUrl="/sign"
        schema={schema}
      />

      {/* HERO */}
      <header className={styles.hero}>
        <img src="/assets/images/sign/sign_hero.png" alt="" className={styles.heroImage} />
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
              src="/assets/logos/nzsign/logo-nzsign-transparente.svg"
              alt="NZSIGN"
              className={styles.pageTitleImage}
              variants={fadeUpItem}
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              A NZSIGN é a divisão da NZ Group dedicada à comunicação visual profissional. Trabalhamos três marcas globais de referência: Metamark (UK) para impressão digital premium, Avery Dennison para vinis calandrados, sobrelaminados, refletivos e filmes especiais, e ORAFOL (Alemanha) com o vinil de recorte Oracal 651.
            </motion.p>
            <motion.p className={styles.heroSubtitleWarning} variants={fadeUpItem}>
              Não vendemos apenas vinil — entregamos durabilidade, acabamento e padrão global.
            </motion.p>
          </motion.div>
        </div>
      </header>

      <div className={styles.blackSpacer}></div>

      {/* QUEM SOMOS */}
      <section className={styles.aboutSection}>
        <motion.div
          className={`container ${styles.aboutContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2 className={styles.aboutTitle} variants={fadeUpItem}>
            A DIVISÃO DE COMUNICAÇÃO VISUAL DA NZ GROUP
          </motion.h2>
          <motion.p className={styles.aboutParagraph} variants={fadeUpItem}>
            A NZSIGN nasceu da mesma exigência técnica que move a NZPPF e a NZWRAP: trabalhar materiais de altíssima performance com o suporte que o aplicador brasileiro precisa.
          </motion.p>
          <motion.p className={styles.aboutParagraph} variants={fadeUpItem}>
            Atendemos gráficas, comunicadores visuais, frotas, oficinas de wrap e produtores de sinalização. Vendemos por bobina, atendemos pedido recortado e damos respaldo técnico em aplicação.
          </motion.p>
          <motion.p className={styles.aboutParagraph} variants={fadeUpItem}>
            Nosso catálogo combina dois pilares. A Metamark, fundada em 1992 no Reino Unido e subsidiária da UPM Raflatac desde 2025, amplia sua presença na NZSIGN em setembro de 2026 com a linha MD-80 — vinil calandrado para impressão digital, com garantia MetaSure® e selo Ecovadis Platinum de sustentabilidade. A Avery Dennison, americana e referência global há mais de 90 anos, completa a linha com MPI, SLP, DOL, ETCHMARK, MASCARA e refletivos.
          </motion.p>
        </motion.div>
      </section>

      {/* BLOCO METAMARK — destaque de lançamento MD-80 Series (setembro/2026) + ponte para a 7 Series */}
      <MetamarkBlock />

      {/* BLOCO ORACAL 651 — vinil de recorte e sinalizacao (veio do NZWRAP em 03/10/2026) */}
      <section className={styles.aboutSection}>
        <motion.div
          className={`container ${styles.aboutContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2 className={styles.aboutTitle} variants={fadeUpItem}>
            ORACAL 651 — VINIL DE RECORTE E SINALIZAÇÃO
          </motion.h2>
          <motion.p className={styles.aboutParagraph} variants={fadeUpItem}>
            O vinil intermediário mais usado do mundo, da ORAFOL (Alemanha): 62 cores em alto brilho, 63 micras e até 6 anos de durabilidade em área externa. Formulado para plotter de recorte — letreiros, fachadas, frotas e sinalização, com weeding fácil e bordas limpas.
          </motion.p>
          <motion.div className={styles.ctaButtons} variants={fadeUpItem}>
            <Link to="/sign/oracal-651" className={styles.ctaPrimary}>
              VER AS 62 CORES
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* BLOCO AVERY */}
      <AveryBlock />

      {/* CTA FINAL */}
      <section className={styles.ctaSection}>
        <motion.div
          className={`container ${styles.ctaContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 className={styles.ctaTitle} variants={fadeUpItem}>
            PRECISA DE UMA COTAÇÃO NZSIGN?
          </motion.h2>
          <motion.p className={styles.ctaSubtitle} variants={fadeUpItem}>
            Atendimento direto com nosso time de comunicação visual. Cotações por bobina, pedidos recortados, suporte técnico de aplicação.
          </motion.p>
          <motion.div className={styles.ctaButtons} variants={fadeUpItem}>
            <LinkVendas
              mensagem="Olá! Vim pelo site e quero um orçamento de comunicação visual."
              className={styles.ctaPrimary}
            >
              FALAR COM NOSSO TIME
            </LinkVendas>
            {/* TODO: habilitar quando catálogo PDF estiver disponível em /assets/docs/nzsign_catalogo_avery.pdf */}
            {/* <a href="/assets/docs/nzsign_catalogo_avery.pdf" className={styles.ctaSecondary} target="_blank" rel="noopener noreferrer">
              BAIXAR CATÁLOGO COMPLETO
            </a> */}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
