import type { Metadata } from "next";
import { Bodoni_Moda, Montserrat } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { VaultProvider } from '@/contexts/VaultContext';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Kalam:wght@300;400;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${bodoniModa.variable} ${montserrat.variable} antialiased`}>
        <AuthProvider>
          <VaultProvider>
            <main className="max-w-screen-2xl mx-auto">
              {children}
            </main>
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
