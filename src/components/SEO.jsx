import React from 'react';
import { Helmet } from 'react-helmet-async';

// Retrieve domain from Vite environment variables (falling back to window.location.origin)
// As requested, leveraging VITE_API_URL to determine the domain if available
const getDomain = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const match = apiUrl.match(/^(https?:\/\/[^\/]+)/);
  if (match) {
    return match[1];
  }
  
  return '';
};

const DOMAIN = getDomain();

const SEO = ({ title, description, path, imagePath, schemaType, schemaData }) => {
  const url = `${DOMAIN}${path}`;
  const image = imagePath ? `${DOMAIN}${imagePath}` : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Social */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Structured Data (JSON-LD) */}
      {schemaType && schemaData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": schemaType,
            ...schemaData
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
