export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login'],
      },
    ],
    sitemap: 'https://your-portfolio-domain.com/sitemap.xml',
  };
}
