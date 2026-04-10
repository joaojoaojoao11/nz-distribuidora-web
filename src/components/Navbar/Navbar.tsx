import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link to="/" className={styles.brand}>
          <img src="/assets/logos/logo-nz-group-base.svg" alt="NZ Distribuidora" style={{ height: '75px', display: 'block', margin: '-15px 0' }} />
        </Link>
        <div className={styles.links}>
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/ppf" className={styles.navLink}>
            <img src="/assets/logos/logo-nz-ppf.svg" alt="Linha NZ PPF" className={styles.navLogo} />
          </Link>
          <Link to="/wrap" className={styles.navLink}>
            <img src="/assets/logos/logo-nz-wrap.svg" alt="Linha NZ WRAP" className={styles.navLogo} />
          </Link>
          <Link to="/sobre" className={styles.navLink}>A Empresa</Link>
          <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.cta}>
            Contato
          </a>
        </div>
      </div>
    </nav>
  );
}
