import { Link } from 'react-router-dom';

// Seção de conteúdo único por cor (anti-thin-content do programmatic SEO):
// specs reais + mini-FAQ interpolada + links internos. Renderizada nas 4
// famílias de página de cor do catálogo Wrap.

interface ColorSeoSectionProps {
  name: string;
  brandLabel: string;
  catalogPath: string;
  sku?: string;
  finish?: string;
  hex?: string;
  durabilidadeAnos?: number;
  garantiaAnos?: number;
  description?: string;
}

const sectionStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '4rem auto 0',
  padding: '2.5rem 1.5rem 0',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  color: '#c9c9cf',
  fontSize: '0.95rem',
  lineHeight: 1.7,
};

const linkStyle: React.CSSProperties = { color: '#8ab4ff', textDecoration: 'underline' };

export default function ColorSeoSection({
  name, brandLabel, catalogPath, sku, finish, hex, durabilidadeAnos, garantiaAnos, description,
}: ColorSeoSectionProps) {
  const dur = durabilidadeAnos && durabilidadeAnos > 0 ? durabilidadeAnos : undefined;
  const gar = garantiaAnos && garantiaAnos > 0 ? garantiaAnos : undefined;

  return (
    <section style={sectionStyle} aria-label={`Informações sobre ${name}`}>
      <h2 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.8rem' }}>
        Sobre o vinil {name} — {brandLabel}
      </h2>
      {description && <p style={{ marginBottom: '1rem' }}>{description}</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
        {sku && <li><strong style={{ color: '#fff' }}>Código (SKU):</strong> {sku}</li>}
        {finish && <li><strong style={{ color: '#fff' }}>Acabamento:</strong> {finish}</li>}
        {hex && (
          <li>
            <strong style={{ color: '#fff' }}>Tom de referência:</strong>{' '}
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: hex, border: '1px solid rgba(255,255,255,0.3)', verticalAlign: 'middle', marginRight: 6 }} />
            {hex}
          </li>
        )}
        {dur && <li><strong style={{ color: '#fff' }}>Durabilidade:</strong> até {dur} anos</li>}
        {gar && <li><strong style={{ color: '#fff' }}>Garantia:</strong> {gar} {gar === 1 ? 'ano' : 'anos'}</li>}
      </ul>

      <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.6rem' }}>Perguntas frequentes</h3>
      <details style={{ marginBottom: '0.6rem' }}>
        <summary style={{ cursor: 'pointer', color: '#fff' }}>Qual o acabamento do vinil {name}?</summary>
        <p style={{ margin: '0.5rem 0 0' }}>
          O {name} da linha {brandLabel} tem acabamento {finish ? finish.toLowerCase() : 'premium'}
          {hex ? `, com tom de referência ${hex}` : ''}. A percepção da cor varia com a luz e o formato da lataria — peça uma amostra física antes de fechar o serviço.
        </p>
      </details>
      <details style={{ marginBottom: '0.6rem' }}>
        <summary style={{ cursor: 'pointer', color: '#fff' }}>Quanto tempo dura o envelopamento com {name}?</summary>
        <p style={{ margin: '0.5rem 0 0' }}>
          {dur
            ? `Aplicado corretamente e com manutenção adequada, o vinil tem durabilidade de até ${dur} anos${gar ? `, com garantia de ${gar} ${gar === 1 ? 'ano' : 'anos'}` : ''}.`
            : 'A durabilidade depende da exposição ao sol, lavagem e qualidade da aplicação — instaladores parceiros NZ orientam o cuidado ideal para cada uso.'}{' '}
          Veja dicas de manutenção no <Link to="/blog" style={linkStyle}>blog da NZ</Link>.
        </p>
      </details>
      <details style={{ marginBottom: '1.5rem' }}>
        <summary style={{ cursor: 'pointer', color: '#fff' }}>Onde comprar o {name}{sku ? ` (${sku})` : ''}?</summary>
        <p style={{ margin: '0.5rem 0 0' }}>
          A NZ Distribuidora vende a linha {brandLabel} no atacado para instaladores e estéticas de todo o Brasil, com centro de distribuição em Barueri-SP (Grande São Paulo).
          Instaladores compram pelo <Link to="/contato" style={linkStyle}>contato comercial</Link>; donos de veículo podem <Link to="/encontre-aplicador" style={linkStyle}>encontrar um aplicador credenciado</Link>.
        </p>
      </details>

      <p style={{ fontSize: '0.9rem' }}>
        <Link to={catalogPath} style={linkStyle}>Ver todas as cores {brandLabel}</Link>
        {' · '}
        <Link to="/wrap" style={linkStyle}>Catálogo completo de envelopamento</Link>
        {' · '}
        <Link to="/encontre-aplicador" style={linkStyle}>Encontrar um aplicador</Link>
      </p>
    </section>
  );
}
