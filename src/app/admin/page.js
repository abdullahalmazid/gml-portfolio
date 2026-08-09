import { buildMetadata } from '@/lib/seo';
import PageClient from './PageClient';

// noIndex: robots.txt asks crawlers not to visit, but a meta tag is the part
// that actually keeps the page out of results if it is ever linked to.
export const metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Dashboard',
  path: '/admin',
  noIndex: true,
});

export default function Page() {
  return <PageClient />;
}
