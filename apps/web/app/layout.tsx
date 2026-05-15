import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { copy } from "../lib/i18n";
import { getServerCopy } from "../lib/i18n/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  manifest: "/manifest.json",
  themeColor: "#ffd84e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: copy.meta.appName,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const serverCopy = getServerCopy();

  return (
    <html lang={serverCopy.meta.lang} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bowlby+One+SC&family=Caveat:wght@500;700&family=Cinzel:wght@600;700;900&family=Nunito:wght@500;700;800;900&family=Pacifico&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
