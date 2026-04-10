import styles from './Company.module.css';

export default function Company() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={`container ${styles.heroContainer}`}>
          <div className="animate-fade-up">
            <span className={styles.eyebrow}>Institucional</span>
            <h1 className={styles.pageTitle}>Muito mais do que <span className="highlight-text">material</span>.</h1>
            <p className={styles.heroSubtitle}>
              Somos especialistas em negócios. Uma empresa forjada na realidade das ruas, moldada para tracionar lojistas de alta performance no Brasil.
            </p>
          </div>
        </div>
      </header>

      <section className={styles.directorSection}>
        <div className={`container ${styles.twoCol}`}>
          <div className={styles.textSide}>
            <span className={styles.eyebrow}>Nossa Origem</span>
            <h2 className={styles.sectionTitle}>Elevando o padrão do mercado.</h2>
            <div className={styles.textContent}>
              <p>
                "Minha trajetória no setor automotivo começou há anos, trabalhando lado a lado com grandes marcas do país e vivendo na prática o dia a dia das lojas. Já visitei <strong>mais de 1.200 estabelecimentos em 10 estados brasileiros</strong>, entendendo profundamente os desafios, as dores e as oportunidades que os profissionais do mercado enfrentam todos os dias."
              </p>
              <p>
                "Ao longo dessa caminhada, liderei equipes comerciais que movimentaram <strong>mais de R$ 48 milhões em vendas</strong>, sempre com foco em estratégia, comportamento do consumidor e crescimento real — não teoria."
              </p>
              <p>
                "Foi essa experiência de campo brutal que deu origem à NZ Distribuidora: uma empresa criada para ser parceira imbatível de quem quer evoluir em técnica, posicionamento e independência de mercado."
              </p>
            </div>
            <div className={styles.founderSignature}>
              <h4 className={styles.founderName}>João Vitor (Soares)</h4>
              <span className={styles.founderRole}>Fundador, NZ GROUP</span>
            </div>
          </div>
          
          <div className={styles.metricsSide}>
            <div className={styles.metricCard}>
              <h3 className={styles.metricBig}>+1.200</h3>
              <p className={styles.metricLabel}>Lojas Analisadas Pessoalmente</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricBig}>R$ 48M</h3>
              <p className={styles.metricLabel}>Em faturamento tracionado</p>
            </div>
            <div className={styles.metricCardRed}>
              <h3 className={styles.metricBigDark}>10</h3>
              <p className={styles.metricLabelDark}>Estados Brasileiros Vistoriados</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.hqSection}>
        <div className="container">
          <div className={styles.hqBox}>
            <div className={styles.hqInfo}>
              <h2 className={styles.hqTitle}>Quartel General</h2>
              <p className={styles.hqDesc}>Nossa estrutura de operações comerciais, logística extrema e distribuição para todo o Brasil.</p>
              
              <ul className={styles.contactList}>
                <li>
                  <strong className="highlight-text">Endereço:</strong> Rua Felix Alvino da Silva, 65 - Vila do Conde - Barueri/SP
                </li>
                <li>
                  <strong className="highlight-text">Ligue via WhatsApp:</strong> +55 11 91890-7565
                </li>
                <li>
                  <strong className="highlight-text">Digital (E-mail):</strong> joaovitor@nzdistribuidora.com.br
                </li>
                <li>
                  <strong className="highlight-text">Operação Comercial:</strong> Segunda a Sexta, das 08h às 18h
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
