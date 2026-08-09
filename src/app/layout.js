import AdminToolbar from '@/components/shared/AdminToolbar';
import Footer from '@/components/shared/Footer';
import Navbar from '@/components/shared/Navbar';
import AdminSlideOver from '@/components/ui/AdminSlideOver';
import CommandMenu from '@/components/ui/CommandMenu';
import { AdminProvider } from '@/context/AdminContext';
import { AuthProvider } from '@/context/AuthContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

// ── Improved SEO metadata with Open Graph and Twitter Card support ──
export const metadata = {
  title: {
    default: "Abdullah Al Mazid | Full Stack Developer",
    template: "%s | Abdullah Al Mazid",
  },
  description: 'Portfolio of Abdullah Al Mazid — Full Stack Developer & Researcher specializing in modern web applications, machine learning, and academic publications.',
  keywords: ['Full Stack Developer', 'Next.js', 'React', 'Firebase', 'Portfolio', 'Research', 'Bangladesh'],
  authors: [{ name: 'Abdullah Al Mazid' }],
  creator: 'Abdullah Al Mazid',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Abdullah Al Mazid Portfolio',
    title: 'Abdullah Al Mazid | Full Stack Developer & Researcher',
    description: 'Full Stack Developer & Researcher — building modern web applications with passion and precision.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abdullah Al Mazid | Full Stack Developer & Researcher',
    description: 'Full Stack Developer & Researcher — building modern web applications with passion and precision.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Cloudinary widget is loaded lazily only when admin mode is active.
          Moved from a global script tag to avoid loading ~200KB for every visitor.
          The AdminToolbar component handles dynamic loading when needed.
        */}
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AdminProvider>
            <SiteConfigProvider>
              <ThemeProvider>
                <Navbar />
                <main id="main" className="flex-1">{children}</main>
                <Footer />
                <AdminToolbar />
                <CommandMenu />
                <AdminSlideOver />
                <Toaster position="bottom-center" />
              </ThemeProvider>
            </SiteConfigProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}