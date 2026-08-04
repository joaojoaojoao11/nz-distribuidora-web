import SEO from '../../components/SEO/SEO';
import { SITE_EMAIL, SITE_NAME } from '../../lib/siteConfig';

export default function Terms() {
  return (
    <div className="container" style={{ padding: '150px 24px 80px', maxWidth: '760px', lineHeight: 1.7 }}>
      <SEO
        title="Termos de Uso"
        description="Condições de uso do site da NZ Distribuidora: conteúdo, garantias, registro de produtos e responsabilidades."
        canonicalUrl="/termos"
      />
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Termos de Uso</h1>

      <p>Ao acessar o site da {SITE_NAME}, você concorda com as condições descritas abaixo.</p>

      <h2 style={{ marginTop: '32px' }}>Conteúdo do site</h2>
      <p>As informações sobre produtos (linhas de PPF, envelopamento, comunicação visual e decoração), especificações técnicas e prazos de garantia são divulgadas de boa-fé e podem ser atualizadas sem aviso prévio. Imagens são ilustrativas.</p>

      <h2 style={{ marginTop: '32px' }}>Garantia de produtos</h2>
      <p>As garantias das películas NZPPF e demais produtos seguem os prazos e condições publicados nas páginas de cada linha e no certificado emitido no registro de garantia. A validade da garantia está condicionada ao registro correto do produto e à aplicação por profissional.</p>

      <h2 style={{ marginTop: '32px' }}>Propriedade intelectual</h2>
      <p>Marcas, logotipos, textos, imagens e demais conteúdos deste site pertencem à {SITE_NAME} ou a seus parceiros licenciados, sendo vedada a reprodução sem autorização.</p>

      <h2 style={{ marginTop: '32px' }}>Responsabilidades</h2>
      <p>A {SITE_NAME} não se responsabiliza por serviços de aplicação contratados diretamente com terceiros fora da rede credenciada, nem por uso inadequado dos produtos em desacordo com as orientações técnicas.</p>

      <h2 style={{ marginTop: '32px' }}>Contato</h2>
      <p>Dúvidas sobre estes termos: <a href={`mailto:${SITE_EMAIL}`} style={{ color: '#FFD400' }}>{SITE_EMAIL}</a>.</p>

      <p style={{ marginTop: '32px', color: '#999' }}>Última atualização: agosto de 2026.</p>
    </div>
  );
}
