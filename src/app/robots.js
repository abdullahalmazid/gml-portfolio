import { SITE } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login'],
      },
    ],
    // Previously hardcoded to a placeholder domain, so no crawler could find
    // the sitemap at all.
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
