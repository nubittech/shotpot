import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { copy } from "../lib/i18n";
import { getServerCopy, getServerLocale } from "../lib/i18n/server";
import { LocaleProvider } from "../lib/i18n/LocaleProvider";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: copy.meta.appName,
  },
  // Both the legacy apple-mobile-web-app-capable AND the modern
  // mobile-web-app-capable — Chrome 99+ warns when only the apple variant is
  // present.
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// Next 14: themeColor moved from metadata → viewport.
export const viewport: Viewport = {
  themeColor: "#ffd84e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const serverCopy = getServerCopy();
  const locale = getServerLocale();

  return (
    <html lang={serverCopy.meta.lang} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bowlby+One+SC&family=Caveat:wght@500;700&family=Cinzel:wght@600;700;900&family=Nunito:wght@500;700;800;900&family=Pacifico&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
