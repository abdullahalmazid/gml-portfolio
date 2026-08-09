import { buildMetadata } from '@/lib/seo';
import { getDocREST } from '@/lib/server/firestore-rest';
import PageClient from './PageClient';

// Metadata is fetched on the server so link previews and search results carry
// the real title and summary. Without this the HTML contains only an empty
// shell, and crawlers that do not run JavaScript see nothing.
export async function generateMetadata({ params }) {
  const doc = await getDocREST('projects', params.id);
  if (!doc) return buildMetadata({ title: 'Not found', path: '/projects/' + params.id });

  return buildMetadata({
    title: doc.title || 'Untitled',
    description: doc.description || doc.description,
    path: `/projects/${params.id}`,
    image: doc.imageUrl || doc.coverImage || doc.logoUrl,
    type: 'article',
    authors: doc.authors ? [doc.authors] : undefined,
  });
}

export default async function Page({ params }) {
  const doc = await getDocREST('projects', params.id);
  return (
    <>
      <PageClient />
    </>
  );
}
