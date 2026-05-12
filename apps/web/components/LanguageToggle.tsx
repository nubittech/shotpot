"use client";

import { useState } from "react";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "../lib/i18n";

function readLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];
  return isLocale(value) ? value : defaultLocale;
}

export function LanguageToggle({ initialLocale }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale ?? readLocale());
  const nextLocale = locale === "tr" ? "en" : "tr";

  function switchLanguage() {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    setLocale(nextLocale);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={locale === "tr" ? "Switch language to English" : "Dili Türkçe yap"}
      style={{
        height: 36,
        minWidth: 48,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid rgba(232,200,118,0.22)",
        background: "rgba(232,200,118,0.06)",
        color: "#e8c876",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        cursor: "pointer",
      }}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
