import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <img src="/assets/logos/logo-nz-group-base.svg" alt="NZ Grupo" style={{ height: '140px', marginBottom: '1rem', marginLeft: '-15px', maxWidth: '100%' }} />
            <p className={styles.slogan}>Elevando o padrão do envelopamento e proteção automotiva no Brasil.</p>
          </div>
          
          <div className={styles.contactCol}>
            <h4 className={styles.heading}>Contato Rápido</h4>
            <ul className={styles.list}>
              <li>📱 +55 11 91890-7565</li>
              <li>📧 joaovitor@nzdistribuidora.com.br</li>
              <li>📍 Atendimento em todo o Brasil</li>
            </ul>
            <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.whatsappBtn}>
              Mandar Mensagem
            </a>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; 2026 NZ Distribuidora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
