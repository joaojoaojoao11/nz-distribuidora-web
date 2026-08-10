import SEO from '../../components/SEO/SEO';
import Hero from '../../components/Hero/Hero';
import Showcase from '../../components/Showcase/Showcase';
import Metrics from '../../components/Metrics/Metrics';
import Differentials from '../../components/Differentials/Differentials';
import TrustBar from '../../components/TrustBar/TrustBar';
import CtaFinal from '../../components/CtaFinal/CtaFinal';
import { SITE_URL, SITE_NAME, SITE_PHONE, SITE_EMAIL, DEFAULT_OG_IMAGE } from '../../lib/siteConfig';

export default function Home() {
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    "name": SITE_NAME,
    "image": DEFAULT_OG_IMAGE,
    "description": "Distribuidora oficial das melhores marcas de Envelopamento PPF, Adesivos Automotivos de Alto Padrão (Premium Wrap). Alta qualidade para instaladores.",
    "url": SITE_URL,
    "telephone": SITE_PHONE,
    "email": SITE_EMAIL,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "R. Brasilândia, 366 — Chácaras Marco",
      "addressLocality": "Barueri",
      "addressRegion": "SP",
      "postalCode": "06419-060",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.4804547,
      "longitude": -46.8865522
    },
    "areaServed": [
      { "@type": "State", "name": "São Paulo" },
      { "@type": "Country", "name": "Brasil" }
    ],
    "sameAs": ["https://www.instagram.com/nzgroup.br"],
    "priceRange": "$$",
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    }]
  });

  return (
    <>
      <SEO
        title="O Melhor Envelopamento PPF e Adesivo Premium do Brasil"
        description="A NZ Distribuidora oferece o portfólio definitivo em envelopamento: PPF, vinil automotivo premium, comunicação visual Avery Dennison e vinil decorativo SH Decor e Etherna Decor."
        keywords="envelopamento ppf, ppf brilhante, adesivo automotivo premium, oracal 970, nzwrap, avery dennison, vinil decorativo"
        schema={schema}
        canonicalUrl="/"
      />
      <Hero />
      <Showcase />
      <Metrics />
      <Differentials />
      <TrustBar />
      <CtaFinal />
    </>
  );
}
