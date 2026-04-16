import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string;
  schema?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'product';
}

export default function SEO({ 
  title, 
  description, 
  canonicalUrl, 
  keywords, 
  schema, 
  imageUrl = 'https://agencianz.com/assets/images/nz-logo-og.jpg', // Default OG image
  type = 'website'
}: SEOProps) {
  const defaultTitle = 'NZ Distribuidora | PPF e Envelopamento Premium';
  const siteUrl = 'https://agencianz.com';
  
  const fullTitle = title ? `${title} | NZ Distribuidora` : defaultTitle;
  const url = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  return (
    <Helmet>
      {/* Basic Settings */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="NZ Distribuidora" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {schema}
        </script>
      )}
    </Helmet>
  );
}
