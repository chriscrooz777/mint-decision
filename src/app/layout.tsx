import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mintdecision.com';

export const metadata: Metadata = {
  title: "Mint Decision — AI Sports Card Grading & Valuation",
  description:
    "Photograph your sports cards and get instant AI-powered identification, valuation, and PSA grading recommendations. Supports MLB, NBA, NFL, NHL, golf, Pokémon, and more.",
  keywords: [
    "sports cards",
    "card grading",
    "PSA",
    "card valuation",
    "baseball cards",
    "basketball cards",
    "football cards",
    "Pokémon cards",
    "junk wax era",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Mint Decision',
    title: 'Mint Decision — AI Sports Card Grading & Valuation',
    description:
      'Photograph your sports cards and get instant AI-powered identification, valuation, and PSA grading recommendations. Supports MLB, NBA, NFL, NHL, golf, Pokémon, and more.',
    images: [
      {
        url: '/open-graph-img.png',
        width: 1200,
        height: 630,
        alt: 'Mint Decision — AI Sports Card Grading & Valuation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mint Decision — AI Sports Card Grading & Valuation',
    description:
      'Photograph your sports cards and get instant AI-powered identification, valuation, and PSA grading recommendations.',
    images: ['/open-graph-img.png'],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
