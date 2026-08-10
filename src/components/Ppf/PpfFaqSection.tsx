import { Link } from 'react-router-dom';
import { PPF_FAQS } from '../../lib/data/ppfFaqs';

// Seção de FAQ visível das páginas NZPPF — torna "verdadeiro" o FAQPage schema
// que o edge (api/_lib/ppfLines.ts) já emite para os crawlers.

interface PpfFaqSectionProps {
  path: string; // ex: /ppf/luxury-gloss
  name: string; // ex: NZPPF Luxury Gloss
}

export default function PpfFaqSection({ path, name }: PpfFaqSectionProps) {
  const faqs = PPF_FAQS[path];
  if (!faqs || faqs.length === 0) return null;

  return (
    <section
      aria-label={`Perguntas frequentes sobre ${name}`}
      style={{
        maxWidth: 900,
        margin: '4rem auto 0',
        padding: '2.5rem 1.5rem 3rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: '#c9c9cf',
        fontSize: '0.95rem',
        lineHeight: 1.7,
      }}
    >
      <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>
        Perguntas frequentes sobre o {name}
      </h2>
      {faqs.map((f) => (
        <details key={f.question} style={{ marginBottom: '0.6rem' }}>
          <summary style={{ cursor: 'pointer', color: '#fff' }}>{f.question}</summary>
          <p style={{ margin: '0.5rem 0 0' }}>{f.answer}</p>
        </details>
      ))}
      <p style={{ marginTop: '1.2rem', fontSize: '0.9rem' }}>
        <Link to="/ppf" style={{ color: '#8ab4ff', textDecoration: 'underline' }}>Comparar todas as linhas NZPPF</Link>
        {' · '}
        <Link to="/encontre-aplicador" style={{ color: '#8ab4ff', textDecoration: 'underline' }}>Encontrar um instalador credenciado</Link>
        {' · '}
        <Link to="/blog" style={{ color: '#8ab4ff', textDecoration: 'underline' }}>Guias no blog</Link>
      </p>
    </section>
  );
}
