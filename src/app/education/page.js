import { buildMetadata } from '@/lib/seo';
import PageClient from './PageClient';

// Server component: exists purely so this page's title, description and
// Open Graph tags appear in the HTML the server sends. The interactive page
// itself is unchanged, in PageClient.
export const metadata = buildMetadata({
  title: 'Education',
  description: 'Degrees, institutions and relevant coursework.',
  path: '/education',
});

export default function Page() {
  return <PageClient />;
}
