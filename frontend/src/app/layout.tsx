import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
