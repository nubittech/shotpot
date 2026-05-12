"use client";

import { defaultLocale, getCopy, isLocale, localeCookieName, type Locale } from ".";

export function getClientLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];
  return isLocale(value) ? value : defaultLocale;
}

export function getClientCopy() {
  return getCopy(getClientLocale());
}
