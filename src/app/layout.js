import AdminToolbar from '@/components/shared/AdminToolbar';
import Footer from '@/components/shared/Footer';
import Navbar from '@/components/shared/Navbar';
import AdminSlideOver from '@/components/ui/AdminSlideOver';
import CommandMenu from '@/components/ui/CommandMenu';
import { AdminProvider } from '@/context/AdminContext';
import { AuthProvider } from '@/context/AuthContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { ThemeProvider } from '@/context/ThemeContext'; // Import the new provider
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = { title: "Abdullah's Portfolio",
                          description: 'Full Stack Developer & Designer Portfolio',
                          icons: {
                            icon: '/favicon.ico', // <- This looks for favicon.ico in your /public or /app folder
                          },

 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script src="https://upload-widget.cloudinary.com/global/all.js" async /></head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AdminProvider>
            <SiteConfigProvider>
              <ThemeProvider> {/* Add ThemeProvider here */}
                <Navbar />
                <main className="flex-1">{children}</main>
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