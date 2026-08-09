# SEO: server-rendered metadata + dynamic sitemap

Unzip over your project root. It overwrites `src/app/**` page files and adds
two library files. Nothing else in `src/` is touched.

## What changed

Each route now has TWO files:

- `page.js`       — NEW. A server component holding the metadata.
- `PageClient.js` — YOUR EXISTING PAGE, renamed. Not modified in any way.

So `src/app/publications/page.js` became `src/app/publications/PageClient.js`,
and a new `page.js` sits next to it.

## New files

- `src/lib/seo.js`                    — site URL, metadata builder, JSON-LD
- `src/lib/server/firestore-rest.js`  — server-side Firestore reads over REST
- `src/app/sitemap.js`                — REPLACED: now lists every document
- `src/app/robots.js`                 — REPLACED: pointed at a placeholder domain

## One thing to set

Add to `.env.local` AND to Vercel's environment variables:

    NEXT_PUBLIC_SITE_URL=https://your-real-domain.com

It defaults to `https://abdullahalmazid.vercel.app`. If that is not your final
domain, canonical URLs and the sitemap will point to the wrong place.

## After deploying

1. Visit `/sitemap.xml` — it should list every publication and project.
2. Paste a publication URL into https://search.google.com/test/rich-results
3. In Google Search Console, submit `https://your-domain.com/sitemap.xml`
4. Share a publication link in WhatsApp or LinkedIn — the preview should now
   show the paper title, not just the site name.
