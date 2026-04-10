import styles from './Wrap.module.css';

export default function Wrap() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={`container ${styles.heroContainer}`}>
          <div className="animate-fade-up">
            <span className={styles.eyebrow}>Materiais para Envelopamento</span>
            <img src="/assets/logos/logo-nz-wrap.svg" alt="NZ WRAP" className={styles.pageTitleImage} />
            <p className={styles.heroSubtitle}>
              Somos a única empresa da América Latina que garante acesso a qualquer cor de envelopamento disponível no mundo. 
              Liberdade criativa total e materiais com performance sólida.
            </p>
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.infoGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Envelopamento Premium Global</h3>
                <span className={styles.highlightBadge}>Exclusividade</span>
              </div>
              <p className={styles.cardText}>
                Seja para destacar, proteger ou transformar, não basta o material ser importado: tem que comprovar durabilidade real, acabamento superior e estabilidade dimensional. Dominamos teconologias recentes trazendo as cores exatas que nossos clientes buscam, entregando a experiência mais confiável do mercado.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>O Maior Portfólio da América Latina</h3>
                <span className={styles.highlightBadge}>Estoque e Curadoria</span>
              </div>
              <p className={styles.cardText}>
                Temos <strong>mais de 250 cores disponíveis em pronta entrega no Brasil</strong> e acesso direto a mais de <strong>500 cores exclusivas</strong> sob demanda. Operamos não apenas com a nossa própria linha impecável, mas com marcas referências globais.
              </p>
            </div>

            <div className={styles.cardDark}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitleRed}>Consultoria Especializada Gratuita</h3>
                <span className={styles.highlightBadgeDark}>Para Profissionais</span>
              </div>
              <p className={styles.cardTextDark}>
                Você é lojista ou aplicador de envelopes automotivos? Além do fornecimento cirúrgico, atuamos como consultoria. Ofertamos suporte presencial/focado em estratégias de preço, gestão financeira, construção de pacotes de serviços e marketing estratégico. Acreditamos que seu crescimento traciona a nossa marca.
              </p>
              <ul className={styles.bulletList}>
                <li>Estratégias de precificação e posicionamento</li>
                <li>Organização financeira e gestão de estoque</li>
                <li>Atendimento e formatação de portfólio de serviços</li>
              </ul>
              <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.ctaButton}>
                Fale com nossos Consultores
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
