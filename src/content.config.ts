import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./consts";

/**
 * Blog collection. Posts live in src/content/blog/*.mdx (or .md).
 * Frontmatter is validated against this schema at build time — a bad post
 * fails the build loudly instead of rendering broken.
 */
const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
    // Default generateId slugifies the path and strips the dot in `.zh`, so
    // `foo.zh.mdx` → `foozh` and the locale marker is lost. Preserve the raw
    // filename (minus extension) so `foo.zh.mdx` → id `foo.zh`, which
    // canonicalSlug() can reliably split back to `foo`.
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /**
     * Locale of this post. English posts omit it (default "en"); Chinese posts
     * live as `<slug>.zh.mdx` and set `lang: "zh"`. The EN and ZH versions of a
     * post share a canonical slug (the filename minus the `.zh` suffix), which
     * is what links them across the language switch.
     */
    lang: z.enum(["en", "zh"]).default("en"),
    /** Publication date. Drives timeline ordering. */
    date: z.coerce.date(),
    /** Last meaningful edit, optional. */
    updated: z.coerce.date().optional(),
    /** Primary category → All / Work / Digest toggle. */
    category: z.enum(CATEGORIES),
    /** Byline shown under the title. Defaults to the site author. */
    author: z.string().default("Xuan Wang"),
    /** Free-form tags → chip filter. */
    tags: z.array(z.string()).default([]),
    /** Pin to homepage "featured writeups". */
    featured: z.boolean().default(false),
    /** Hide from listings while keeping the file (e.g. work-in-progress). */
    draft: z.boolean().default(false),
    /** Optional related repo link surfaced on the post. */
    repo: z.url().optional(),
    /** Optional hero/social image (path under /public or remote). */
    cover: z.string().optional(),
    /**
     * Cited references — papers, specs, or canonical implementations related to
     * the post. Rendered as a "References" section at the end.
     */
    references: z
      .array(
        z.object({
          /** Author/source + year, e.g. "Ainslie et al., 2023". Optional. */
          authors: z.string().optional(),
          /** Title of the paper/resource. */
          title: z.string(),
          /** Link (arXiv, docs, repo). */
          url: z.url(),
          /** Short note on why it's relevant. Optional. */
          note: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog };
