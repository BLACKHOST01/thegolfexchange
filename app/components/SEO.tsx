// components/SEO.tsx
import Head from 'next/head';
import { SITE_CONFIG } from '@/lib/seoConfig';

type SEOProps = {
  title?: string;
  description?: string;
  pathname?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
};

export default function SEO({ title, description, pathname, image, noIndex, canonical }: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_CONFIG.siteName}` : SITE_CONFIG.defaultTitle;
  const desc = description ?? SITE_CONFIG.description;
  const url = canonical ?? (typeof window !== 'undefined' ? window.location.href : SITE_CONFIG.siteUrl + (pathname || ''));

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_CONFIG.siteName} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {SITE_CONFIG.twitter && <meta name="twitter:site" content={SITE_CONFIG.twitter} />}

      {/* canonical */}
      <link rel="canonical" href={url} />
    </Head>
  );
}
