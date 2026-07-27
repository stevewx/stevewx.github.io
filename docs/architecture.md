# Architecture

The cross-file knowledge that no single file reveals. For file-by-file detail,
read the files — this covers only how they connect and *why*.

## Layout

```
src/
  consts.ts          cross-locale data: SITE (url/author), SOCIALS, CATEGORIES
  content.config.ts  blog frontmatter schema + glob loader
  i18n/              locale core, string tables, locale-aware post queries
  components/        Header, Footer, Hero, PostCard, ThemeToggle, LangSwitch, …
    pages/           AboutPage, BlogIndexPage — locale-aware bodies shared by en+zh
  layouts/           BaseLayout, BlogPost
  pages/             en routes (/, /about, /blog, rss.xml, 404)
    zh/              zh routes — mirrors the en tree under /zh
  content/blog/      posts: <slug>.mdx (en) + <slug>.zh.mdx (zh)
  scripts/fx/        canvas hero animation
  styles/global.css  Tailwind layers + theme tokens + prose colors
```

## Bilingual model (EN at root, ZH under /zh)

- Locale is derived from the URL path, not passed as a prop: `/zh/...` → `zh`,
  else `en` (`src/i18n/config.ts`). Components call `getLocaleFromPath` and read
  their strings from `t(locale)`. This is why the same component renders both
  languages with no per-locale duplication.
- `src/pages/zh/` mirrors `src/pages/`. Page bodies live in
  `components/pages/*` so both trees share one implementation.
- **Posts are paired by filename**, not folder: `foo.mdx` (en) ↔ `foo.zh.mdx`
  (zh, `lang: "zh"`). They share the canonical slug `foo` — the loader's custom
  `generateId` keeps the `.zh` in the id so `canonicalSlug()` can pair them.
  Without that custom id, Astro slugifies `foo.zh.mdx` → `foozh` and the pairing
  (and the language switch) silently breaks.
- A missing zh translation falls back to the en version's URL, so the language
  switch never dead-links (`src/i18n/content.ts`).

## Theming (light/dark, token-based)

The single source of truth is a set of CSS variables in `global.css`, defined
three times: `:root` (light), `:root.dark` (dark), and a
`prefers-color-scheme: dark` block for the no-explicit-choice case. Tailwind
color scales (`ink`/`slate`/`accent`/`signal` in `tailwind.config.mjs`) resolve
to those variables via `rgb(var(--token) / <alpha>)`.

Consequence: **everything themeable must go through those utility classes.** A
hard-coded hex won't flip. This reaches beyond components — `scripts/fx/palette.ts`
reads the same variables at runtime so the canvas re-colors on theme change, and
the one inline SVG (`AnyResDiagram.astro`) colors via scoped classes for the same
reason (SVG presentation attributes can't read `var()`).

`ThemeScript.astro` runs inline in `<head>` before paint to apply the stored
choice with no flash; `ThemeToggle.astro` persists the choice and dispatches a
`themechange` event that the FX runner listens for.

## Hero FX

`scripts/fx/` is a small canvas engine: a `runner` owns the loop/resize, `scenes/*`
are self-contained animations, `registry.ts` picks one at random for the homepage.
Two non-obvious constraints:

- **Only ambient scenes go on the homepage** (`POOL` in `registry.ts`). Labeled
  diagram scenes clash behind the hero text and are excluded there, but still
  work as in-post figures via `SceneFigure.astro`.
- **The runner passes a `safeTop`** (bottom of the hero text) to scenes so their
  content stays clear of the copy at any viewport height, and it **debounces
  resize** so scenes don't rebuild mid-drag. If you add a scene that draws
  structured content, honor `safeTop`; purely ambient scenes can ignore it.

## Build & deploy

Static build (`astro build` → `dist/`). Push to `main` runs
`.github/workflows/deploy.yml`. The deploy step needs GitHub Pages enabled in
repo settings; until then the build job passes and the deploy job fails by design.
