import Hero from '../../components/Hero/Hero';
import Showcase from '../../components/Showcase/Showcase';
import Metrics from '../../components/Metrics/Metrics';
import Differentials from '../../components/Differentials/Differentials';
import TrustBar from '../../components/TrustBar/TrustBar';
import CtaFinal from '../../components/CtaFinal/CtaFinal';

export default function Home() {
  return (
    <>
      <Hero />
      <Showcase />
      <Metrics />
      <Differentials />
      <TrustBar />
      <CtaFinal />
    </>
  );
}
