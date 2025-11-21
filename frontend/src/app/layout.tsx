import type { Metadata } from "next";
import { Bodoni_Moda, Montserrat } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

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
  width: 'device-width',
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
        <AuthProvider>
          <main className="max-w-screen-2xl mx-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
