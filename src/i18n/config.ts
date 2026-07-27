/**
 * i18n core. English is the default locale and lives at the site root;
 * Chinese lives under /zh/.
 */

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Human label for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
};

/** <html lang="…"> value per locale. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

/** BCP-47 tag used for Intl date formatting per locale. */
export const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}

/** Read the active locale from a URL pathname. `/zh/...` → "zh", else "en". */
export function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Strip the locale prefix from a pathname, returning the locale-agnostic path
 * that is shared across languages (always leading-slashed, no trailing slash
 * except root). `/zh/blog/x` → `/blog/x`; `/` → `/`; `/zh` → `/`.
 */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length && isLocale(parts[0])) parts.shift();
  return "/" + parts.join("/");
}

/**
 * Build the path for `target` from a locale-agnostic path. English gets the
 * bare path; other locales are `/zh`-prefixed.
 */
export function localizePath(agnosticPath: string, target: Locale): string {
  const clean = "/" + agnosticPath.split("/").filter(Boolean).join("/");
  if (target === DEFAULT_LOCALE) return clean === "/" ? "/" : clean;
  return clean === "/" ? "/zh" : `/zh${clean}`;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  return localizePath(stripLocale(pathname), target);
}
