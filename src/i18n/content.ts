/**
 * Locale-aware blog helpers. English posts are `<slug>.mdx` (id `<slug>`);
 * Chinese posts are `<slug>.zh.mdx` (id `<slug>.zh`). Both map to the same
 * canonical slug `<slug>`, which is the locale-agnostic blog route segment.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LOCALE, type Locale } from "./config";

export type Post = CollectionEntry<"blog">;

export function canonicalSlug(post: Post): string {
  return post.id.replace(/\.zh$/, "");
}

export function postHref(post: Post): string {
  const slug = canonicalSlug(post);
  return post.data.lang === DEFAULT_LOCALE ? `/blog/${slug}` : `/zh/blog/${slug}`;
}

export async function getPosts(locale: Locale): Promise<Post[]> {
  const all = await getCollection("blog");
  return all
    .filter((p) => !p.data.draft && p.data.lang === locale)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Posts to render for a locale, falling back to the English version when a
 * translation is missing — so a half-translated blog never shows gaps. Returns
 * one entry per canonical slug, preferring the requested locale.
 */
export async function getPostsWithFallback(locale: Locale): Promise<Post[]> {
  const all = await getCollection("blog");
  const live = all.filter((p) => !p.data.draft);
  const bySlug = new Map<string, Post>();

  for (const p of live) {
    if (p.data.lang === DEFAULT_LOCALE) bySlug.set(canonicalSlug(p), p);
  }
  if (locale !== DEFAULT_LOCALE) {
    for (const p of live) {
      if (p.data.lang === locale) bySlug.set(canonicalSlug(p), p);
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export async function hasTranslation(
  slug: string,
  locale: Locale,
): Promise<boolean> {
  const all = await getCollection("blog");
  return all.some(
    (p) => canonicalSlug(p) === slug && p.data.lang === locale && !p.data.draft,
  );
}
