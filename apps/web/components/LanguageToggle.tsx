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

/**
 * Segmented language switch — shows BOTH languages with the ACTIVE one
 * highlighted, so it always matches the page language (no "shows the target"
 * confusion). Clicking the inactive segment sets the cookie and reloads so
 * every server + client page re-renders in the chosen language.
 */
export function LanguageToggle({ initialLocale }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale ?? readLocale());

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLocale(next);
    window.location.reload();
  }

  const langs: Locale[] = ["tr", "en"];

  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex", height: 36, padding: 3, gap: 2,
        borderRadius: 10, border: "1px solid rgba(232,200,118,0.22)",
        background: "rgba(232,200,118,0.06)",
      }}
    >
      {langs.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            aria-pressed={active}
            style={{
              minWidth: 32, padding: "0 10px", borderRadius: 8, border: "none",
              cursor: active ? "default" : "pointer",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.06em",
              background: active ? "#e8c876" : "transparent",
              color: active ? "#1a0f06" : "#c8b890",
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
