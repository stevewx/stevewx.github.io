# AGENTS.md

Entry point for coding agents maintaining this repo. It is designed to be
maintained by agents **without human interaction**, so read the golden rules
before changing anything.

## What this is

Personal website of Xuan Wang (王烜) — bilingual (EN/中文) static site built with
Astro + Tailwind, deployed to GitHub Pages. Content is authored as MDX; an agent
occasionally publishes a technical digest.

## Golden rules

1. **Document only what code can't say.** A comment or doc earns its place only
   if the same knowledge cannot be inferred by reading the code — the *why*, a
   non-obvious constraint, or cross-file knowledge. Never re-narrate what the
   code does; that is what goes stale. When you touch code, delete any nearby
   comment that merely restates it.
2. **Match the surrounding code.** Naming, structure, and idioms already present
   win over any external habit. Prefer the smallest change that fits.
3. **Never hard-code colors.** Use the theme utility classes; see
   [docs/conventions.md](docs/conventions.md).
4. **Bilingual is enforced by types.** `src/i18n/ui.ts` and `about-data.ts` have
   a `zh` object typed against `en`; a missing key fails the build. Write native
   Chinese, not literal translation — see [docs/conventions.md](docs/conventions.md).
5. **Verify before you finish** (below). Do not commit red.

## Verify

Requires Node ≥ 22.12 (`.nvmrc` pins 22). From the repo root:

```bash
npm install       # first time / after dependency changes
npm run build     # must succeed
npx astro check   # must report 0 errors
```

Commit only when both pass. Commit style: `<type>: <subject>`, types
`content|feat|fix|refactor|style|chore|docs`. One logical change per commit.

## Where to look

- **[docs/architecture.md](docs/architecture.md)** — how routing, EN/ZH pairing,
  theming, and the hero FX fit together (the cross-file map).
- **[docs/conventions.md](docs/conventions.md)** — the rules: comments, theme
  tokens, i18n/native-Chinese, how to update code & docs.
- **[docs/publishing-digest.md](docs/publishing-digest.md)** — the scoped
  procedure for publishing a tech-digest post. **Read this before a digest run;
  it forbids touching anything outside the post files.**
- **[README.md](README.md)** — human-facing intro.

> A `CLAUDE.md` at the root points here so Claude Code loads it automatically.
