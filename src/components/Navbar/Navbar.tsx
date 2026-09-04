import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { closeModal } from '../../hooks/useModalLock';
import { shDecorProducts } from '../../pages/Decor/shDecorProducts';
import { ethernaProducts } from '../../pages/Decor/ethernaProducts';
import styles from './Navbar.module.css';

// O índice da busca carrega ~340 destinos (páginas, linhas e todas as cores e
// padrões dos catálogos). Fora do bundle inicial: só baixa quando abre a busca.
const SearchPalette = lazy(() => import('./SearchPalette'));

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const closeMenu = () => setIsOpen(false);

  const openSearch = () => {
    setIsOpen(false);
    setSearchOpen(true);
  };

  // Ctrl+K / Cmd+K abre a busca em qualquer página. Fechar passa por
  // closeModal: a paleta empilha uma entrada no histórico ao abrir (é o que
  // faz o Voltar do Android fechá-la), e fechar sem desempilhar deixaria um
  // "voltar" morto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchOpen) closeModal(() => setSearchOpen(false));
        else setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <img src="/assets/logos/logo-nz-group-base.svg" alt="NZ Distribuidora" style={{ height: '75px', display: 'block', margin: '-15px 0' }} />
        </Link>

        {/* Lupa — visível na barra em mobile, fora do overlay */}
        <button
          type="button"
          className={`${styles.searchBtn} ${styles.searchBtnMobile}`}
          onClick={openSearch}
          aria-label="Buscar no site"
        >
          <SearchIcon />
        </button>

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
          <Link
            to="/loja"
            className={`${styles.navLink} ${styles.navLinkShop} ${location.pathname.startsWith('/loja') ? styles.navLinkShopActive : ''}`}
            onClick={closeMenu}
          >
            {/* width/height do arquivo: reservam o espaço antes de a imagem
                carregar, senão o menu inteiro salta quando ela chega. */}
            <img
              src="/assets/logos/logo-nzstore-branco.png"
              alt="NZSTORE"
              className={styles.navLogoStore}
              width={713}
              height={136}
            />
          </Link>
          <Link to="/ppf" className={`${styles.navLink} ${location.pathname === '/ppf' ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            <img src="/assets/logos/logo-nz-ppf.svg" alt="Linha NZ PPF" className={styles.navLogo} />
          </Link>
          <div className={styles.dropdownWrap}>
            <Link to="/wrap" className={`${styles.navLink} ${location.pathname.startsWith('/wrap') ? styles.navLinkActive : ''}`} onClick={closeMenu}>
              <img src="/assets/logos/logo-nz-wrap.svg" alt="Linha NZ WRAP" className={styles.navLogo} />
              <span className={styles.dropdownCaret} aria-hidden="true">▾</span>
            </Link>
            <div className={styles.dropdown}>
              <Link to="/wrap/nzwrap-premium" className={styles.dropdownItem} onClick={closeMenu}>
                <img
                  src="/assets/logos/logo-nz-wrap.svg"
                  alt="NZWrap Premium"
                  className={styles.dropdownLogoNzwrap}
                />
                <span className={styles.dropdownLabel}>linha premium</span>
              </Link>
              <Link to="/wrap/sh-colors" className={styles.dropdownItem} onClick={closeMenu}>
                <img
                  src="/assets/logos/logo-sh-colors.svg"
                  alt="SH Wrapping Colors"
                  className={styles.dropdownLogoShColors}
                />
                <span className={styles.dropdownLabel}>sh wrapping</span>
              </Link>
              <Link to="/wrap/metamark-mcx" className={styles.dropdownItem} onClick={closeMenu}>
                <img
                  src="/assets/logos/metamark/logo-metamark.svg"
                  alt="MetaCast MCX"
                  className={styles.dropdownLogoMetamark}
                />
                <span className={styles.dropdownLabel}>metacast mcx</span>
              </Link>
              <span className={styles.dropdownDivider} aria-hidden="true" />
              <Link to="/wrap/metamark-7-series" className={styles.dropdownTextItem} onClick={closeMenu}>
                METAMARK 7 SERIES
              </Link>
              <Link to="/wrap/oracal-970ra" className={styles.dropdownTextItem} onClick={closeMenu}>
                ORACAL 970RA
              </Link>
              <Link to="/wrap/oracal-670ra" className={styles.dropdownTextItem} onClick={closeMenu}>
                ORACAL 670RA
              </Link>
              <Link to="/wrap/oracal-651" className={styles.dropdownTextItem} onClick={closeMenu}>
                ORACAL 651
              </Link>
            </div>
          </div>
          <Link to="/sign" className={`${styles.navLink} ${location.pathname.startsWith('/sign') ? styles.navLinkActive : ''}`} onClick={closeMenu}>
            <img src="/assets/logos/nzsign/logo-nzsign-transparente.svg" alt="Linha NZSIGN" className={`${styles.navLogo} ${styles.navLogoNzsign}`} />
          </Link>
          <div className={styles.dropdownWrap}>
            <Link to="/decor" className={`${styles.navLink} ${location.pathname.startsWith('/decor') ? styles.navLinkActive : ''}`} onClick={closeMenu}>
              <img src="/assets/logos/nzdecor/logo-nzdecor-branco.png" alt="Linha NZDECOR" className={`${styles.navLogo} ${styles.navLogoNzsign}`} />
              <span className={styles.dropdownCaret} aria-hidden="true">▾</span>
            </Link>
            <div className={styles.dropdown}>
              <Link to="/decor/sh" className={styles.dropdownItem} onClick={closeMenu}>
                <img
                  src="/assets/logos/nzdecor/logo-sh-decor-branco.svg"
                  alt="Catálogo SH Decor"
                  className={styles.dropdownLogoSh}
                />
                <span className={styles.dropdownLabel}>{shDecorProducts.length} padrões</span>
              </Link>
              <Link to="/decor/etherna" className={styles.dropdownItem} onClick={closeMenu}>
                <img
                  src="/assets/logos/nzdecor/logo-etherna.webp"
                  alt="Catálogo Etherna Decor"
                  className={styles.dropdownLogoEtherna}
                />
                <span className={styles.dropdownLabel}>{ethernaProducts.length} padrões</span>
              </Link>
            </div>
          </div>
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

          <button
            type="button"
            className={`${styles.searchBtn} ${styles.searchBtnDesktop}`}
            onClick={openSearch}
            aria-label="Buscar no site (Ctrl+K)"
            title="Buscar (Ctrl+K)"
          >
            <SearchIcon />
          </button>

          {user ? (
            <Link to={isAdmin ? '/admin' : '/painel'} className={styles.loginBtn} onClick={closeMenu}>
              {isAdmin ? '⚙ Admin' : '👤 Minha Conta'}
            </Link>
          ) : (
            <Link to="/login" className={styles.loginBtn} onClick={closeMenu}>Entrar</Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </nav>
  );
}
