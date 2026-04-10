import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <img src="/assets/logos/logo-nz-group-base.svg" alt="NZ Distribuidora" style={{ height: '75px', display: 'block', margin: '-15px 0' }} />
        </Link>

        {/* Hamburger Button — mobile only */}
        <button
          className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
          aria-expanded={isOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>

        {/* Desktop links + Mobile overlay */}
        <div className={`${styles.links} ${isOpen ? styles.linksOpen : ''}`}>
          <Link to="/" className={`${styles.navLink} ${location.pathname === '/' ? styles.navLinkActive : ''}`} onClick={closeMenu}>Home</Link>
          <Link to="/ppf" className={`${styles.navLink} ${location.pathname === '/ppf' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            <img src="/assets/logos/logo-nz-ppf.svg" alt="Linha NZ PPF" className={styles.navLogo} />
          </Link>
          <Link to="/wrap" className={`${styles.navLink} ${location.pathname === '/wrap' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            <img src="/assets/logos/logo-nz-wrap.svg" alt="Linha NZ WRAP" className={styles.navLogo} />
          </Link>
          <Link to="/sobre" className={`${styles.navLink} ${location.pathname === '/sobre' ? styles.navLinkActive : ''}`} onClick={closeMenu}>A Empresa</Link>
          <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.cta} onClick={closeMenu}>
            Contato
          </a>
        </div>
      </div>
    </nav>
  );
}
