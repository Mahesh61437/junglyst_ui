import React from 'react';
import { Helmet } from 'react-helmet-async';

const DOMAIN =
  typeof window !== 'undefined'
    ? window.location.origin
    : import.meta.env.VITE_SITE_URL || '';

const SEO = ({ title, description, path, image, type = 'website', schemaType, schemaData }) => {
  const url = `${DOMAIN}${path || ''}`;
  // Accept a full URL (e.g. S3) or a root-relative path
  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${DOMAIN}${image}`
    : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* Structured Data (JSON-LD) */}
      {schemaType && schemaData && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': schemaType,
            ...schemaData,
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
