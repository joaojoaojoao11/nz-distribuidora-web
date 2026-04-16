import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

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
          <Link to="/sobre" className={`${styles.navLink} ${location.pathname === '/sobre' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            EMPRESA
          </Link>
          <Link to="/blog" className={`${styles.navLink} ${location.pathname.startsWith('/blog') ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            BLOG
          </Link>
          <Link to="/encontre-aplicador" className={`${styles.navLink} ${location.pathname === '/encontre-aplicador' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            APLICADORES
          </Link>
          <Link to="/registro-garantia" className={`${styles.navLink} ${location.pathname === '/registro-garantia' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            GARANTIA
          </Link>

          {user ? (
            <Link to={isAdmin ? '/admin' : '/painel'} className={styles.loginBtn} onClick={closeMenu}>
              {isAdmin ? '⚙ Admin' : '👤 Minha Conta'}
            </Link>
          ) : (
            <Link to="/login" className={styles.loginBtn} onClick={closeMenu}>Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
