import { buildMetadata } from '@/lib/seo';
import PageClient from './PageClient';

// Server component: exists purely so this page's title, description and
// Open Graph tags appear in the HTML the server sends. The interactive page
// itself is unchanged, in PageClient.
export const metadata = buildMetadata({
  title: 'Gallery',
  description: 'Photographs from projects, labs and fieldwork.',
  path: '/gallery',
});

export default function Page() {
  return <PageClient />;
}
