import { Link } from 'react-router-dom';
import SEO from '../components/SEO/SEO';

export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 80px', textAlign: 'center' }}>
      <SEO
        title="Página não encontrada"
        description="A página que você procura não existe ou foi movida."
        noindex
      />
      <div>
        <p style={{ fontSize: '5rem', fontWeight: 800, margin: 0, color: '#FFD400', lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: '1.6rem', margin: '16px 0 8px' }}>Página não encontrada</h1>
        <p style={{ color: '#999', maxWidth: '420px', margin: '0 auto 32px' }}>
          A página que você procura não existe ou foi movida. Confira nossos produtos e conteúdos:
        </p>
        <nav style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#FFD400', fontWeight: 600 }}>Home</Link>
          <Link to="/ppf" style={{ color: '#FFD400', fontWeight: 600 }}>NZPPF</Link>
          <Link to="/wrap" style={{ color: '#FFD400', fontWeight: 600 }}>NZWRAP</Link>
          <Link to="/blog" style={{ color: '#FFD400', fontWeight: 600 }}>Blog</Link>
          <Link to="/encontre-aplicador" style={{ color: '#FFD400', fontWeight: 600 }}>Encontrar Aplicador</Link>
        </nav>
      </div>
    </div>
  );
}
