import { buildMetadata } from '@/lib/seo';
import PageClient from './PageClient';

// Server component: exists purely so this page's title, description and
// Open Graph tags appear in the HTML the server sends. The interactive page
// itself is unchanged, in PageClient.
export const metadata = buildMetadata({
  title: 'Projects',
  description: 'Engineering and software projects, from IoT systems to CAD and optimisation work.',
  path: '/projects',
});

export default function Page() {
  return <PageClient />;
}
