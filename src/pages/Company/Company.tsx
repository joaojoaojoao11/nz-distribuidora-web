import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Company.module.css';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
};

const blurUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
  show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const metrics = [
  { value: '+1.200', label: 'Lojas analisadas pessoalmente', accent: false },
  { value: 'R$ 48M', label: 'Em faturamento tracionado', accent: false },
  { value: '10', label: 'Estados brasileiros vistoriados', accent: true }
];

const originTabs = [
  {
    id: 'nzgroup',
    label: 'NZ GROUP',
    image: '/assets/images/nzgroup-base.png',
    name: 'NZ GROUP',
    role: 'Distribuidora Nacional',
    content: [
      'A NZ GROUP nasceu da visão de dois profissionais que decidiram unir forças para construir algo diferente no mercado brasileiro de PPF e envelopamento. Não uma marca comum — mas uma operação de distribuição completa, com inteligência comercial, logística extrema e compromisso real com o crescimento dos parceiros.',
      'Com sede estratégica em Barueri/SP, a NZ opera com agilidade de startup e estrutura de distribuidora nacional, atendendo lojistas de alta performance em mais de 10 estados brasileiros. Cada decisão é tomada com base em dados de campo, experiência prática e conhecimento profundo do dia a dia das lojas.',
      'O resultado é uma marca que não apenas fornece materiais — mas constrói ecossistemas de negócios, treina equipes, posiciona lojistas e entrega ferramentas reais para quem quer dominar o mercado.'
    ]
  },
  {
    id: 'danillo',
    label: 'DANILLO BRITTO',
    image: '/assets/images/danillo-mustang.jpg',
    name: 'Danillo Britto',
    role: 'Sócio & Diretor Comercial',
    content: [
      'Reconhecido pelos principais nomes do ramo em todo o Brasil, Danillo Britto consolidou-se como o maior vendedor de materiais importados para envelopamento e PPF da América Latina. Uma trajetória construída não por acaso, mas por uma combinação rara de disciplina, visão estratégica e execução implacável.',
      'Sua reputação no mercado é definida por dois pilares: eficiência absoluta nos atendimentos e performance comercial consistentemente acima da média. Danillo não apenas vende — ele constrói relacionamentos de longo prazo, entende a operação de cada cliente e entrega soluções sob medida para cada realidade.',
      'Na NZ GROUP, Danillo traz toda essa experiência de campo para a direção comercial, garantindo que cada parceiro receba o mesmo nível de atenção e estratégia que o posicionou como referência nacional no segmento.'
    ]
  },
  {
    id: 'joao',
    label: 'JOÃO SOARES',
    image: '/assets/images/joao-gm3-azul.jpg',
    name: 'João Vitor (Soares)',
    role: 'Fundador & CEO',
    content: [
      'Minha trajetória no setor automotivo começou há anos, trabalhando lado a lado com grandes marcas do país e vivendo na prática o dia a dia das lojas. Já visitei mais de 1.200 estabelecimentos em 10 estados brasileiros, entendendo profundamente os desafios, as dores e as oportunidades que os profissionais do mercado enfrentam todos os dias.',
      'Ao longo dessa caminhada, liderei equipes comerciais que movimentaram mais de R$ 48 milhões em vendas, sempre com foco em estratégia, comportamento do consumidor e crescimento real — não teoria.',
      'Foi essa experiência de campo brutal que deu origem à NZ Distribuidora: uma empresa criada para ser parceira imbatível de quem quer evoluir em técnica, posicionamento e independência de mercado.'
    ]
  }
];

export default function Company() {
  const [activeTab, setActiveTab] = useState('nzgroup');
  const currentTab = originTabs.find(t => t.id === activeTab)!;

  return (
    <div className={styles.page}>
      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.img
              src="/assets/logos/logo-nz-completo-branco.svg"
              alt="NZ Distribuidora"
              className={styles.heroLogo}
              variants={blurUp}
            />
            <motion.p className={styles.heroTagline} variants={blurUp}>
              Muito mais do que material.
            </motion.p>
            <motion.p className={styles.heroSubtitle} variants={blurUp}>
              Uma empresa forjada na realidade das ruas, moldada para tracionar lojistas de alta performance no Brasil.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* METRICS */}
      <section className={styles.metricsSection}>
        <div className={styles.metricsShadowTop}></div>
        <motion.div
          className={`container ${styles.metricsGrid}`}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              className={`${styles.metricCard} ${m.accent ? styles.metricCardAccent : ''}`}
              variants={scaleIn}
              whileHover={{ scale: 1.05, transition: { duration: 0.3, ease: 'easeOut' } }}
            >
              <span className={styles.metricValue}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ORIGIN — TABS */}
      <section className={styles.originSection}>
        <div className={`container ${styles.originContainer}`}>
          <motion.div
            className={styles.originHeader}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.h2 className={styles.sectionTitle} variants={blurUp}>
              Elevando o padrão do mercado.
            </motion.h2>
          </motion.div>

          {/* Tab Buttons */}
          <motion.div
            className={styles.tabBar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {originTabs.map((tab) => (
              <motion.button
                key={tab.id}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
                variants={blurUp}
              >
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className={styles.tabContent}
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.tabImageSide}>
                <div className={styles.tabImageWrapper}>
                  <img src={currentTab.image} alt={currentTab.name} className={styles.tabImage} />
                  <div className={styles.tabImageOverlay}></div>
                </div>
                <div className={styles.tabSignature}>
                  <h4 className={styles.founderName}>{currentTab.name}</h4>
                  <span className={styles.founderRole}>{currentTab.role}</span>
                </div>
              </div>

              <div className={styles.tabTextSide}>
                {currentTab.content.map((p, i) => (
                  <p key={i}>"{p}"</p>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* HQ */}
      <section className={styles.hqSection}>
        <div className={styles.hqShadowTop}></div>
        <div className={`container ${styles.hqContainerOuter}`}>
          <motion.div
            className={styles.hqBox}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.span className={styles.eyebrow} variants={blurUp}>OPERAÇÕES</motion.span>
            <motion.h2 className={styles.hqTitle} variants={blurUp}>Quartel General</motion.h2>
            <motion.p className={styles.hqDesc} variants={blurUp}>
              Nossa estrutura de operações comerciais, logística extrema e distribuição para todo o Brasil.
            </motion.p>

            <motion.div className={styles.contactGrid} variants={stagger}>
              {[
                { label: 'Endereço', value: 'Rua Felix Alvino da Silva, 65 - Vila do Conde - Barueri/SP' },
                { label: 'WhatsApp', value: '+55 11 91890-7565' },
                { label: 'E-mail', value: 'joaovitor@nzdistribuidora.com.br' },
                { label: 'Operação', value: 'Segunda a Sexta, das 08h às 18h' }
              ].map((item, i) => (
                <motion.div key={i} className={styles.contactCard} variants={scaleIn}>
                  <span className={styles.contactLabel}>{item.label}</span>
                  <span className={styles.contactValue}>{item.value}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
