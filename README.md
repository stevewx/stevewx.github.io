# stevewx.github.io

Personal website of **Xuan Wang (王烜)** — ML Engineer, LLM & RL post-training.
Bilingual (EN / 中文), built with [Astro](https://astro.build) + Tailwind CSS,
deployed to GitHub Pages.

## Develop

Requires **Node ≥ 22.12** (`.nvmrc` pins 22; `brew install node@22`).

```bash
npm install
npm run dev      # local dev server (http://localhost:4321)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Working on this repo

This site is designed to be maintained by coding agents. Conventions and
architecture live in agent-facing docs:

- **[AGENTS.md](AGENTS.md)** — start here: golden rules and verify commands.
- **[docs/architecture.md](docs/architecture.md)** — how routing, bilingual post
  pairing, theming, and the hero FX connect.
- **[docs/conventions.md](docs/conventions.md)** — comment/doc philosophy, theme
  tokens, i18n & native-Chinese rules, commits.
- **[docs/publishing-digest.md](docs/publishing-digest.md)** — scoped procedure
  for publishing a tech-digest post.

## License

Split license:

- **Site code** — [MIT](LICENSE). Reuse and fork the Astro/i18n/FX machinery
  freely.
- **Content** — [all rights reserved](LICENSE-CONTENT): blog posts (any
  language) under `src/content/`, and the personal/bio text in `src/i18n/` and
  `src/consts.ts`. Please don't republish the writing; brief attributed quotes
  with a link back are welcome.
