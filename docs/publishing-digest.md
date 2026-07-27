# Publishing a tech digest

Procedure for the recurring, autonomous task: publish a technical-digest blog
post. A digest is a `category: digest` post summarizing recent tech/research.

## Scope boundary (read first)

A digest run **may only create or edit files under `src/content/blog/`** — the
new post's `.mdx` and its `.zh.mdx` counterpart.

It must **not** touch anything else: no components, layouts, pages, `i18n/`,
`consts.ts`, styles, `scripts/`, config, workflows, dependencies, or other
existing posts. If publishing seems to require a change outside `src/content/blog/`,
**stop and surface it** rather than making the change — that is a separate task,
not part of a digest run.

## Steps

1. **Create the English post** `src/content/blog/<slug>.mdx`. `<slug>` is short,
   kebab-case, unique. Frontmatter (schema in `src/content.config.ts`):

   ```mdx
   ---
   title: "…"
   description: "One-line summary (cards + SEO)."
   date: 2026-01-31          # today, ISO
   category: digest
   tags: ["…"]               # lowercase kebab-case slugs
   featured: false
   ---
   ```

2. **Create the Chinese post** `src/content/blog/<slug>.zh.mdx` with the same
   frontmatter plus `lang: "zh"`, and a native-Chinese body (see below). Keep the
   filename slug identical — the `.zh` pairs it to the English post.

3. **Verify**: `npm run build` succeeds and `npx astro check` reports 0 errors.
   Confirm both `/blog/<slug>` and `/zh/blog/<slug>` build.

4. **Commit** only the two post files: `content: add digest — <topic>`.

## Chinese body: transcreate, don't translate

Write the `.zh.mdx` as native Chinese technical writing (full rules in
[conventions.md](conventions.md#i18n-write-native-chinese-not-translation)).
Keep established terms in English inline.

**Preserve verbatim between the two files:** all LaTeX math (`$…$`, `$$…$$`),
fenced code blocks and their comments, any component tags and their non-caption
attributes, and the frontmatter `date` / `category` / `tags`. Translate only
prose, headings, `title`, `description`, and any `caption` text. The English post
is the source of truth for structure and facts — no added, dropped, or reordered
content.

## Optional in-post visuals

Posts may embed a themed canvas figure with `SceneFigure` (see existing posts for
usage). Use only scenes already in `scripts/fx/registry.ts`; **do not add or edit
scenes** during a digest run (that is outside the scope boundary).
