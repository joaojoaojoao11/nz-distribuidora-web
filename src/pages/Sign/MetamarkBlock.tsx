/* Bloco Metamark do NZSIGN — cobre as duas linhas da marca em uma seção só.
 *
 * 1. MD-80 Series: vinil de impressão digital, lançamento de setembro/2026. É o
 *    destaque da seção e o motivo dela vir antes do bloco Avery.
 * 2. 7 Series: vinil de recorte, cuja página vive em /wrap/metamark-7-series.
 *    Aqui é resumo e link — sem <h1>, sem <SEO> e sem canonical próprio, para
 *    não criar uma segunda URL disputando a mesma busca.
 *
 * As duas linhas dividem a mesma copy institucional (1992, UPM, ISO, Ecovadis),
 * escrita uma vez só no topo. Reaproveita AveryBlock.module.css: mesma
 * linguagem visual, zero CSS duplicado.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { M7_COLORS } from '../../lib/data/metamark7Colors';
import { metamarkSkus, MD80_SPECS, MD80_NOTES } from './metamarkMd80';
import type { MetamarkSku } from './metamarkMd80';
import styles from './AveryBlock.module.css';
import own from './MetamarkBlock.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
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

const cardStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.94, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const BADGES = [
  'GARANTIA METASURE®',
  'ECOVADIS PLATINUM',
  'UPM RAFLATAC · UK',
  'ISO 9001 · 14001 · 45001 · 50001',
];

const DIFFS = [
  {
    n: '01',
    title: 'Garantia MetaSure® · Cobertura de fábrica.',
    text: 'Se o material perder qualidade dentro do prazo, com uso e aplicação corretos, a Metamark substitui e ainda contribui com o custo de reaplicação. Cobertura garantida por escrito, direto do fabricante.',
  },
  {
    n: '02',
    title: 'Sustentabilidade certificada · Ecovadis Platinum.',
    text: 'Menos de 1% das empresas avaliadas pela Ecovadis chegam ao selo Platinum. A Metamark tem — junto com ISO 9001 (qualidade), 14001 (ambiental), 45001 (segurança) e 50001 (energia). Diferencial concreto para quem atende clientes com pauta ESG.',
  },
  {
    n: '03',
    title: 'Resistência química ampla · Uso severo em campo.',
    text: 'Película não impressa resistente a ácidos fracos, solventes alifáticos, sal, álcalis, diesel, gasolina, parafina, óleo hidráulico e anticongelante, com classificação de fogo Classe B. Serve para ambientes industriais, oficinas, postos e frotas onde outras mídias falham.',
  },
  {
    n: '04',
    title: 'Adesivo cinza opaco (MD-80B) · Bloqueio visual profissional.',
    text: 'A versão MD-80B tem adesivo cinza pigmentado — bloqueia o substrato por trás e evita show-through, o fundo colorido ou impresso aparecendo através do vinil. Sobre vitrines coloridas, gráficos antigos ou superfícies com padrão, as cores seguem fiéis à impressão.',
  },
];

const SPECS_HALF = Math.ceil(MD80_SPECS.length / 2);

function finishLabel(sku: MetamarkSku) {
  const adhesive = sku.adhesive === 'cinza' ? 'Adesivo cinza blockout' : 'Adesivo transparente';
  const finish = sku.finish === 'fosco' ? 'Fosco' : 'Brilho';
  return `${adhesive} · ${finish}`;
}

export default function MetamarkBlock() {
  return (
    <section className={`${styles.averySection} ${own.section}`}>
      <div className={own.sectionGlow}></div>
      <div className={own.headerBackdrop} aria-hidden="true"></div>

      <motion.div
        className={`container ${styles.averyContainer}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={`${styles.averyHeader} ${own.header}`} variants={fadeUpItem}>
          <span className={own.launchBadge}>LANÇAMENTO · SETEMBRO 2026</span>
          <img
            src="/assets/logos/metamark/logo-metamark.svg"
            alt="Metamark"
            className={own.logo}
            loading="lazy"
          />
          {/* O bloco não tinha <h2>: ia do logo direto para os <h3> do painel, o que
              deixava a seção sem âncora visual e furava a hierarquia de headings.
              O título é a linha, não a marca — o logo acima já diz "Metamark". */}
          <h2 className={styles.averyTitle}>MD-80 SERIES</h2>
          <p className={styles.averySubtitle}>
            Impressão digital com padrão britânico e sustentabilidade certificada.
          </p>
        </motion.div>

        <motion.p className={styles.averyDescription} variants={fadeUpItem}>
          A Metamark é fabricante britânico de mídia adesiva desde 1992, hoje parte do grupo
          finlandês UPM Raflatac. Referência técnica em vinil calandrado para impressão digital, com
          certificações ISO 9001, 14001, 45001 e 50001 e selo Ecovadis Platinum de sustentabilidade —
          o mais alto do mercado. A linha MD-80 chega à NZSIGN em setembro de 2026 para atender
          comunicação promocional de curto prazo com até três anos de durabilidade externa,
          adesivo acrílico livre de solvente e o respaldo do programa de garantia MetaSure®.
        </motion.p>

        <motion.div className={styles.averyBadges} variants={fadeUpItem}>
          {BADGES.map((b) => (
            <span key={b} className={styles.averyBadge}>
              {b}
            </span>
          ))}
        </motion.div>

        <motion.div
          className={styles.averyDiffs}
          variants={cardStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {DIFFS.map((d) => (
            <motion.div key={d.n} className={styles.averyDiff} variants={fadeUpItem}>
              <span className={styles.averyDiffNumber}>{d.n}</span>
              <div>
                <h4 className={styles.averyDiffTitle}>{d.title}</h4>
                <p className={styles.averyDiffText}>{d.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Painel do lançamento: fundo mais claro que a seção para separar as quatro
            versões e a ficha técnica do resto do bloco, sem repintar as bordas da
            seção (o fade de emenda de .averySection é hardcoded). */}
        <motion.div className={own.launchPanel} variants={fadeUpItem}>
          <div className={styles.familiesHeader}>
            <h3 className={styles.familiesTitle}>AS QUATRO VERSÕES</h3>
            <p className={styles.familiesSub}>
              Duas opções de adesivo e dois acabamentos. Nosso time ajuda a especificar.
            </p>
          </div>

          <motion.div
            className={own.skuGrid}
            variants={cardStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {metamarkSkus.map((sku) => (
              <motion.div
                key={sku.slug}
                variants={scaleReveal}
                className={`${styles.familyCard} ${own.skuCard} ${
                  sku.adhesive === 'cinza' ? own.blockoutCard : ''
                }`}
              >
                {sku.image && (
                  <img
                    src={sku.image}
                    alt={sku.name}
                    className={own.skuImage}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className={styles.familyCardBadges}>
                  {sku.badges.map((b) => (
                    <span key={b} className={styles.familyBadge}>
                      {b}
                    </span>
                  ))}
                </div>
                <h4 className={styles.familyName}>{sku.name}</h4>
                <p className={styles.familySubtitle}>{finishLabel(sku)}</p>
                <p className={styles.familyDescription}>{sku.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className={own.specsBlock}>
            <h4 className={own.specsTitle}>Ficha técnica · Linha MD-80</h4>
            <div className={own.specsGrid}>
              <dl className={own.specsList}>
                {MD80_SPECS.slice(0, SPECS_HALF).map((spec) => (
                  <div key={spec.label} className={own.specRow}>
                    <dt className={own.specLabel}>{spec.label}</dt>
                    <dd className={own.specValue}>{spec.value}</dd>
                  </div>
                ))}
              </dl>
              <dl className={own.specsList}>
                {MD80_SPECS.slice(SPECS_HALF).map((spec) => (
                  <div key={spec.label} className={own.specRow}>
                    <dt className={own.specLabel}>{spec.label}</dt>
                    <dd className={own.specValue}>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ul className={own.notes}>
              {MD80_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div className={own.bridgeHeader} variants={fadeUpItem}>
          <h3 className={styles.familiesTitle}>TAMBÉM DA METAMARK</h3>
          <p className={styles.familiesSub}>
            A linha de recorte da marca, que atende tanto sinalização quanto gráfico veicular.
          </p>
        </motion.div>

        <motion.div className={own.cardWrap} variants={fadeUpItem}>
          <Link to="/wrap/metamark-7-series" className={styles.familyCard}>
            <div className={styles.familyCardBadges}>
              <span className={styles.familyBadge}>{M7_COLORS.length} CORES</span>
              {/* "micras" por extenso: o badge é uppercase no CSS e μ vira Μ (Mu maiúsculo) */}
              <span className={styles.familyBadge}>70 MICRAS POLIMÉRICO</span>
              <span className={styles.familyBadge}>CLASSE B</span>
              <span className={styles.familyBadge}>380 A 1.600 mm</span>
            </div>
            <h4 className={styles.familyName}>METAMARK 7 SERIES</h4>
            <p className={styles.familySubtitle}>Vinil de recorte para sinalização e gráfico veicular</p>
            <p className={styles.familyDescription}>
              Filme calandrado de 70 micras com adesivo Apex permanente e liner lay-flat. Cada uma
              das {M7_COLORS.length} cores tem valor Pantone® e CMYK publicado pelo fabricante — a
              referência objetiva que fecha identidade de marca e de frota sem aprovação no olho.
            </p>
            <span className={styles.familyCta}>
              VER CATÁLOGO DE CORES <span className={styles.familyCtaArrow}>→</span>
            </span>
          </Link>
        </motion.div>

        <motion.p className={own.trademark} variants={fadeUpItem}>
          Metamark®, MetaSure® e MetaGuard® são marcas registradas da Metamark (UK) Limited.
        </motion.p>
      </motion.div>
    </section>
  );
}
