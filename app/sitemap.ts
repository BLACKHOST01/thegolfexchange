// app/sitemap.ts
import { SITE_CONFIG } from '@/lib/seoConfig';

export async function GET() {
  const baseUrl = SITE_CONFIG.siteUrl.replace(/\/$/, '');

  // TODO: optionally fetch dynamic pages from DB (products, posts)
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/listings', // consider whether you want to expose this
  ];

  const pages = staticRoutes.map((p) => {
    const url = `${baseUrl}${p}`;
    return `<url><loc>${url}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages}
  </urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
