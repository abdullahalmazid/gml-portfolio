/**
 * SEO
 * src/lib/seo.js
 *
 * One place for the site URL, metadata construction and structured data.
 *
 * Every page's title, description and Open Graph tags are built here so they
 * land in the HTML the server sends. That is what fixes link previews: Google
 * runs JavaScript eventually, but LinkedIn, WhatsApp, Slack and Twitter never
 * do — they read the raw HTML and nothing else.
 */

export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://abdullahalmazid.vercel.app').replace(/\/$/, ''),
  name: 'Abdullah Al Mazid',
  shortName: 'Abdullah Al Mazid',
  description:
    'Portfolio of Abdullah Al Mazid — Industrial and Production Engineering, with research in machine learning, IoT and intelligent systems.',
  locale: 'en_US',
  twitter: '',
};

export const absolute = (path = '/') =>
  `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;

/** Trim to a clean summary length, cutting at a word boundary. */
export function summarize(text, max = 160) {
  if (!text) return SITE.description;
  const plain = String(text)
    .replace(/<[^>]+>/g, ' ')          // strip stored HTML
    .replace(/[#*_`>[\]()]/g, ' ')     // strip markdown punctuation
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, plain.lastIndexOf(' ', max) || max)}…`;
}

/**
 * Build a Next `metadata` object.
 * `image` should be an absolute URL — Cloudinary URLs already are.
 */
export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  publishedTime,
  authors,
  noIndex = false,
} = {}) {
  const url = absolute(path);
  const desc = summarize(description);
  const images = image ? [{ url: image, alt: title || SITE.name }] : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: title ? `${title} | ${SITE.name}` : SITE.name,
      description: desc,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type,
      ...(images ? { images } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: title ? `${title} | ${SITE.name}` : SITE.name,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

/** Identity for the homepage. */
export function personJsonLd({ jobTitle, affiliation, socials = [], image } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    url: SITE.url,
    ...(jobTitle ? { jobTitle } : {}),
    ...(image ? { image } : {}),
    ...(affiliation ? { affiliation: { '@type': 'Organization', name: affiliation } } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

/**
 * A published paper. This is the one that matters most for an academic
 * portfolio — it is how search engines recognise a page as a paper rather
 * than a blog post.
 */
export function scholarlyArticleJsonLd(pub) {
  if (!pub) return null;
  const authors = String(pub.authors || '')
    .split(/,| and /i)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((name) => ({ '@type': 'Person', name }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: pub.title,
    name: pub.title,
    url: absolute(`/publications/${pub.id}`),
    ...(pub.abstract ? { abstract: summarize(pub.abstract, 500) } : {}),
    ...(authors.length ? { author: authors } : {}),
    ...(pub.year ? { datePublished: String(pub.year) } : {}),
    ...(pub.journal ? { publisher: { '@type': 'Organization', name: pub.journal } } : {}),
    ...(pub.link ? { sameAs: pub.link } : {}),
  };
}

export function creativeWorkJsonLd(item, { path, type = 'CreativeWork' } = {}) {
  if (!item) return null;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: item.title,
    url: absolute(path),
    ...(item.description ? { description: summarize(item.description, 300) } : {}),
    ...(item.imageUrl ? { image: item.imageUrl } : {}),
    author: { '@type': 'Person', name: SITE.name },
  };
}

/** Renders a JSON-LD block. Safe: the payload is serialised, not interpolated. */
export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
