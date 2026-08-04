import SEO from '../../components/SEO/SEO';
import { SITE_EMAIL, SITE_NAME } from '../../lib/siteConfig';

export default function Privacy() {
  return (
    <div className="container" style={{ padding: '150px 24px 80px', maxWidth: '760px', lineHeight: 1.7 }}>
      <SEO
        title="Política de Privacidade"
        description="Como a NZ Distribuidora coleta, utiliza e protege os dados pessoais informados no site, em conformidade com a LGPD."
        canonicalUrl="/privacidade"
      />
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Política de Privacidade</h1>

      <p>A {SITE_NAME} respeita a sua privacidade e trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>

      <h2 style={{ marginTop: '32px' }}>Dados que coletamos</h2>
      <ul>
        <li><strong>Registro de garantia:</strong> nome, CPF, e-mail, telefone, cidade/UF, dados do veículo (placa ou chassi, modelo) e loja instaladora — usados exclusivamente para emissão e validação do certificado de garantia.</li>
        <li><strong>Formulários de contato e de indicação de aplicador:</strong> nome, telefone e cidade — usados para retorno comercial.</li>
        <li><strong>Navegação:</strong> métricas de uso do site (páginas visitadas) de forma agregada, para melhoria do serviço.</li>
      </ul>

      <h2 style={{ marginTop: '32px' }}>Como usamos os dados</h2>
      <p>Os dados são utilizados apenas para: emissão e validação de garantias, atendimento comercial, encaminhamento a aplicadores credenciados e melhoria do site. Não vendemos nem compartilhamos dados pessoais com terceiros para fins de marketing.</p>

      <h2 style={{ marginTop: '32px' }}>Armazenamento e segurança</h2>
      <p>Os dados são armazenados em infraestrutura segura na nuvem, com acesso restrito à equipe autorizada da {SITE_NAME}.</p>

      <h2 style={{ marginTop: '32px' }}>Seus direitos</h2>
      <p>Você pode solicitar a qualquer momento a confirmação, correção, portabilidade ou exclusão dos seus dados pessoais. Para exercer seus direitos, entre em contato pelo e-mail <a href={`mailto:${SITE_EMAIL}`} style={{ color: '#FFD400' }}>{SITE_EMAIL}</a>.</p>

      <p style={{ marginTop: '32px', color: '#999' }}>Última atualização: agosto de 2026.</p>
    </div>
  );
}
