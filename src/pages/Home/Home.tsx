import SEO from '../../components/SEO/SEO';
import Hero from '../../components/Hero/Hero';
import Showcase from '../../components/Showcase/Showcase';
import Metrics from '../../components/Metrics/Metrics';
import Differentials from '../../components/Differentials/Differentials';
import TrustBar from '../../components/TrustBar/TrustBar';
import CtaFinal from '../../components/CtaFinal/CtaFinal';

export default function Home() {
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "NZ Distribuidora",
    "image": "https://agencianz.com/assets/images/nz-logo-og.jpg",
    "description": "Distribuidora oficial das melhores marcas de Envelopamento PPF, Adesivos Automotivos de Alto Padrão (Premium Wrap). Alta qualidade para instaladores.",
    "url": "https://agencianz.com"
  });

  return (
    <>
      <SEO 
        title="O Melhor Envelopamento PPF e Adesivo Premium do Brasil"
        description="A NZ Distribuidora oferece o portfólio definitivo em envelopamento PPF e vinil premium. Proteção máxima com alto brilho, regeneração térmica e exclusividade para o seu carro."
        keywords="envelopamento ppf, ppf brilhante, adesivo automotivo premium, oracal 970, nzwrap"
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
