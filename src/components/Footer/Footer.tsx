import { Link } from 'react-router-dom';
import { Phone, EnvelopeSimple, MapPin, InstagramLogo, WhatsappLogo } from '@phosphor-icons/react';
import { LinkVendas } from '../ContatoVendas/ContatoVendas';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.topSection}>
          {/* Logo & About */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logoWrapper}>
              <img src="/assets/logos/logo-nz-group-base.svg" alt="NZ Grupo" className={styles.logo} />
            </Link>
            <p className={styles.slogan}>
              Elevando o padrão do envelopamento e proteção automotiva no Brasil com materiais premium de alta performance.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.instagram.com/nzgroup.br?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="Instagram">
                <InstagramLogo weight="regular" />
              </a>
              <LinkVendas className={styles.socialIcon} aria-label="WhatsApp">
                <WhatsappLogo weight="regular" />
              </LinkVendas>
            </div>
          </div>

          {/* Vertical Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.heading}>Catálogo</h4>
            <ul className={styles.navLinks}>
              <li><Link to="/loja">Loja — Catálogo Completo</Link></li>
              <li><Link to="/ppf">Linha NZ PPF</Link></li>
              <li><Link to="/wrap">Envelopamento</Link></li>
              <li><Link to="/sign">Comunicação Visual</Link></li>
              <li><Link to="/decor">Decoração</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.heading}>Institucional</h4>
            <ul className={styles.navLinks}>
              <li><Link to="/sobre">Nossa História</Link></li>
              <li><Link to="/contato">Fale Conosco</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/encontre-aplicador">Encontre um Aplicador</Link></li>
              <li>
                <LinkVendas mensagem="Olá! Quero ser um aplicador credenciado NZ.">
                  Seja um Aplicador
                </LinkVendas>
              </li>
            </ul>
          </div>

          {/* Contact & CTA */}
          <div className={styles.contactCol}>
            <h4 className={styles.heading}>Contato</h4>
            <ul className={styles.contactList}>
              <li>
                <Phone className={styles.contactIcon} weight="light" />
                <LinkVendas className={styles.contactLink}>Central de Vendas · WhatsApp</LinkVendas>
              </li>
              <li>
                <EnvelopeSimple className={styles.contactIcon} weight="light" />
                <span>joaovitor@nzdistribuidora.com.br</span>
              </li>
              <li>
                <MapPin className={styles.contactIcon} weight="light" />
                <span>Atendimento em todo o Brasil</span>
              </li>
            </ul>
            <LinkVendas className={styles.ctaButton}>
              <WhatsappLogo weight="fill" className={styles.ctaBtnIcon} />
              Falar com Consultor
            </LinkVendas>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} NZ Distribuidora. Todos os direitos reservados.</p>
          <div className={styles.legalLinks}>
            <Link to="/privacidade">Política de Privacidade</Link>
            <span className={styles.separator}></span>
            <Link to="/termos">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
