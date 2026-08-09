import { SITE } from '@/lib/seo';
import { getCollectionREST } from '@/lib/server/firestore-rest';

/**
 * Every public URL, including one per publication, project, post and image.
 *
 * The previous sitemap listed only the homepage, so Google had no way of
 * knowing the detail pages existed unless it happened to crawl a link to them.
 * Hidden documents are excluded, matching the public site.
 */

const ROUTES = [
  { path: '/',             priority: 1.0, changeFrequency: 'monthly' },
  { path: '/about',        priority: 0.8, changeFrequency: 'monthly' },
  { path: '/publications', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/projects',     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/experience',   priority: 0.7, changeFrequency: 'yearly'  },
  { path: '/education',    priority: 0.7, changeFrequency: 'yearly'  },
  { path: '/blog',         priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/gallery',      priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact',      priority: 0.5, changeFrequency: 'yearly'  },
];

const COLLECTIONS = [
  { name: 'publications', base: '/publications', priority: 0.8 },
  { name: 'projects',     base: '/projects',     priority: 0.8 },
  { name: 'blogs',        base: '/blog',         priority: 0.7 },
  { name: 'experience',   base: '/experience',   priority: 0.6 },
  { name: 'education',    base: '/education',    priority: 0.6 },
  { name: 'gallery',      base: '/gallery',      priority: 0.4 },
];

/** createdAt is epoch ms; _updated is the Firestore update time. */
function lastModified(doc) {
  if (doc._updated) return new Date(doc._updated);
  if (typeof doc.createdAt === 'number') return new Date(doc.createdAt);
  return new Date();
}

export default async function sitemap() {
  const entries = ROUTES.map((r) => ({
    url: `${SITE.url}${r.path === '/' ? '' : r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const lists = await Promise.all(
    COLLECTIONS.map(async ({ name, base, priority }) => {
      const docs = await getCollectionREST(name);
      return docs.map((doc) => ({
        url: `${SITE.url}${base}/${doc.id}`,
        lastModified: lastModified(doc),
        changeFrequency: 'monthly',
        priority,
      }));
    })
  );

  return [...entries, ...lists.flat()];
}
