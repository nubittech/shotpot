"use client";

/**
 * Server-resolved locale propagated to client components via a module-level
 * variable AND a React context. Why both:
 *
 *   - The context is the React-idiomatic path; components can `useLocale()`.
 *   - The module-level variable lets `getClientCopy()` (a plain function, not
 *     a hook) return the correct locale during SSR + first hydration render,
 *     so server-rendered HTML matches the first client render and React does
 *     not throw #418 / #423 hydration errors.
 *
 * `LocaleProvider` MUST be rendered above any client component that calls
 * `getClientCopy()`. The root layout already wires it.
 */

import { createContext, useContext, type ReactNode } from "react";
import { defaultLocale, type Locale } from ".";

// Module-level mirror of the active locale. Initialized to the default; the
// provider sets it during render so any later `getClientCopy()` call gets
// the server-resolved value.
let activeLocale: Locale = defaultLocale;

/** Read by `getClientLocale()` outside of React hook context. */
export function getActiveLocale(): Locale {
  return activeLocale;
}

const LocaleContext = createContext<Locale>(defaultLocale);

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  // Set during render so it's available to client components rendered in the
  // same tree, both during SSR and on the client. The assignment is
  // idempotent — same value on server and client per request.
  activeLocale = locale;
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
