import type { Metadata } from "next";
import { Bodoni_Moda, Montserrat } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { VaultProvider } from '@/contexts/VaultContext'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'react-hot-toast';

const bodoniModa = Bodoni_Moda({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bodoni',
  display: 'swap',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Heirloom - Where Every Memory Becomes a Legacy",
  description: "Preserve, discover, and share your family's most precious memories with AI-powered storytelling and emotional design.",
  keywords: ["family memories", "photo storage", "family tree", "legacy", "storytelling", "AI"],
  authors: [{ name: "Heirloom Team" }],
  openGraph: {
    title: "Heirloom - Where Every Memory Becomes a Legacy",
    description: "Preserve, discover, and share your family's most precious memories with AI-powered storytelling and emotional design.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodoniModa.variable} ${montserrat.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <VaultProvider>
              <PrivacyProvider>
                <NotificationProvider>
                  <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1a1a1a',
                      color: '#D4AF37',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      fontFamily: 'var(--font-montserrat)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#D4AF37',
                        secondary: '#0A0A0A',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#0A0A0A',
                      },
                    },
                  }}
                />
                  <main className="max-w-screen-2xl mx-auto">
                    {children}
                  </main>
                </NotificationProvider>
              </PrivacyProvider>
            </VaultProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
