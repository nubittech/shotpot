"use client";

import { getCopy, type Locale } from ".";
import { getActiveLocale } from "./LocaleProvider";

/**
 * Returns the locale resolved by the server for this request, propagated
 * through `<LocaleProvider>`. Same value on SSR + first hydration render, so
 * client components do not trigger hydration mismatches.
 *
 * Note: NOT reactive to runtime cookie changes — when the user toggles
 * language via `LanguageToggle`, a full navigation/refresh follows, so the
 * next render picks up the new locale through the provider.
 */
export function getClientLocale(): Locale {
  return getActiveLocale();
}

export function getClientCopy() {
  return getCopy(getClientLocale());
}
