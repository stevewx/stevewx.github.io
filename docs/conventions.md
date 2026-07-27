# Conventions

Rules that cannot be inferred from the code. Everything here is a constraint an
agent must follow, not a description of what exists.

## Comments & docs must earn their place

Write a comment or doc line **only** when its meaning cannot be recovered by
reading the code. Valid reasons to exist:

- the *why* behind a non-obvious choice,
- a constraint or gotcha the code can't state (e.g. "SVG can't read `var()`"),
- cross-file knowledge (how two things must stay in sync).

Do **not** write comments that re-narrate code (`// loop over posts`), restate a
name, or summarize an obviously-named function. Such comments drift from the code
and become lies. When you edit code, delete any adjacent comment that has become
a restatement. Prefer clearer code over an explanatory comment.

Docs follow the same test: capture rules and non-inferable knowledge, never a
walkthrough of logic that the code already expresses.

## Styling: theme tokens only

Never hard-code a color (hex, named, or raw `rgb()`) in a component, scene, or
SVG. Use the Tailwind scales `ink` / `slate` / `accent` / `signal`, which resolve
to theme CSS variables so light/dark flips work. To add a themeable color, add
the variable to all theme blocks in `global.css` and expose it in
`tailwind.config.mjs` — see [architecture.md](architecture.md#theming-lightdark-token-based).

Match existing Tailwind usage; don't introduce a CSS framework or inline styles
where a utility class fits.

## i18n: write native Chinese, not translation

`src/i18n/ui.ts` and `about-data.ts` hold every non-prose UI string, keyed by
locale, with `zh` typed against `en` — a missing/renamed key fails the build, so
edit both locales together.

The Chinese must read as if **written by a native Chinese ML/systems engineer**,
not translated from the English. This is transcreation:

- Rewrite titles/headings idiomatically; never calque an English metaphor (e.g.
  "GPU bubbles" → not literally "GPU 气泡").
- Use natural Chinese register and rhythm (shorter clauses; 而 / 其实 / 也就是说).
  If it sounds "dubbed," rewrite it.
- Keep established terms in English inline: PPO, GRPO, DAPO, MoE, KV cache,
  rollout, checkpoint, partial rollout, Verl, vLLM, SGLang, SFT, DPO, etc. Do not
  invent Chinese coinages.

For blog posts specifically, the English post is the source of truth for facts
and structure; see [publishing-digest.md](publishing-digest.md) and the "Preserve
verbatim" list there.

## Commits

`<type>: <subject>`, imperative, concise. Types in use:
`content | feat | fix | refactor | style | chore | docs`. One logical change per
commit. Keep subjects short; no attribution trailers.

## How to update code & docs

- Make the smallest change that fits the surrounding code.
- After any change: `npm run build` must succeed and `npx astro check` must
  report 0 errors before committing.
- **When you change behavior, update the doc that states the rule** — but only if
  the rule itself changed. Do not add docs that mirror code; that reintroduces
  drift. If a fact here becomes false, fix it or delete it.
- If a change makes an existing comment/doc a restatement or a lie, remove it in
  the same commit.
