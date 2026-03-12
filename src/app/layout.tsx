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
