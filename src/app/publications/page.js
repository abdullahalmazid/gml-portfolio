import { buildMetadata } from '@/lib/seo';
import PageClient from './PageClient';

// Server component: exists purely so this page's title, description and
// Open Graph tags appear in the HTML the server sends. The interactive page
// itself is unchanged, in PageClient.
export const metadata = buildMetadata({
  title: 'Publications',
  description: 'Peer-reviewed conference papers and research publications.',
  path: '/publications',
});

export default function Page() {
  return <PageClient />;
}
