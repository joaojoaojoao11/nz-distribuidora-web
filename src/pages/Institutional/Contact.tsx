import { Phone, EnvelopeSimple, MapPin, WhatsappLogo, Clock } from '@phosphor-icons/react';
import SEO from '../../components/SEO/SEO';
import { SITE_PHONE, SITE_EMAIL, SITE_WHATSAPP } from '../../lib/siteConfig';

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '14px',
  padding: '18px 20px', background: 'rgba(255,255,255,0.04)',
  borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)'
};

export default function Contact() {
  return (
    <div className="container" style={{ padding: '150px 24px 80px', maxWidth: '760px' }}>
      <SEO
        title="Fale Conosco — Atendimento a Lojistas e Aplicadores"
        description="Fale com a NZ Distribuidora: WhatsApp comercial, e-mail e atendimento de segunda a sexta, 08h às 18h. Consultoria técnica para lojistas e aplicadores de PPF e envelopamento."
        canonicalUrl="/contato"
      />
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Fale Conosco</h1>
      <p style={{ color: '#999', marginBottom: '40px' }}>
        Atendimento comercial e consultoria técnica para lojistas, aplicadores e proprietários.
      </p>

      <div style={{ display: 'grid', gap: '16px' }}>
        <a href={SITE_WHATSAPP} target="_blank" rel="noreferrer" style={{ ...rowStyle, color: 'inherit', textDecoration: 'none' }}>
          <WhatsappLogo size={26} color="#FFD400" weight="fill" />
          <div>
            <strong>WhatsApp Comercial</strong>
            <p style={{ margin: 0, color: '#999' }}>{SITE_PHONE} — resposta em horário comercial</p>
          </div>
        </a>
        <div style={rowStyle}>
          <Phone size={26} color="#FFD400" weight="light" />
          <div>
            <strong>Telefone</strong>
            <p style={{ margin: 0, color: '#999' }}>{SITE_PHONE}</p>
          </div>
        </div>
        <div style={rowStyle}>
          <EnvelopeSimple size={26} color="#FFD400" weight="light" />
          <div>
            <strong>E-mail</strong>
            <p style={{ margin: 0, color: '#999' }}>{SITE_EMAIL}</p>
          </div>
        </div>
        <div style={rowStyle}>
          <Clock size={26} color="#FFD400" weight="light" />
          <div>
            <strong>Horário de atendimento</strong>
            <p style={{ margin: 0, color: '#999' }}>Segunda a sexta, das 08h às 18h</p>
          </div>
        </div>
        <div style={rowStyle}>
          <MapPin size={26} color="#FFD400" weight="light" />
          <div>
            <strong>Sede</strong>
            <p style={{ margin: 0, color: '#999' }}>R. Brasilândia, 366 — Chácaras Marco, Barueri-SP, 06419-060</p>
          </div>
        </div>
      </div>
    </div>
  );
}
