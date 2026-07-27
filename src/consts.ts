/**
 * Site-wide configuration. Single source of truth for identity, nav, and socials.
 * Edit here — every page and component reads from this file.
 */

export const SITE = {
  name: "Xuan Wang",
  /** Short handle used in the logo / monospace mark. */
  mark: "xuanwang",
  title: "Xuan Wang — ML Engineer, LLM & RL Post-Training",
  description:
    "Machine Learning Engineer focused on LLM & RL post-training. I bring the latest post-training research into production frameworks and make frontier-scale RL training fast and reliable. Recently: async RL & agentic model training.",
  /** One-line tagline shown under the name in the hero. */
  tagline: "ML Engineer · LLM & RL Post-Training",
  url: "https://stevewx.github.io",
  locale: "en-US",
  author: "Xuan Wang",
} as const;

// Nav labels/links and category labels are now locale-aware — see src/i18n/ui.ts
// (UI.<locale>.nav and .categories). This file keeps only cross-locale data.

/** Social / contact links. Set `show: false` to hide without deleting. */
export const SOCIALS: {
  label: string;
  href: string;
  handle: string;
  show: boolean;
}[] = [
  {
    label: "GitHub",
    href: "https://github.com/stevewx",
    handle: "stevewx",
    show: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/iamxuanwang/",
    handle: "iamxuanwang",
    show: true,
  },
];

/**
 * Blog post categories — the stable slugs that drive the All / Work / Digest
 * toggle on /blog and the content schema. `digest` is the agent-published
 * tech digest. Display labels are localized in src/i18n/ui.ts
 * (UI.<locale>.categories).
 */
export const CATEGORIES = ["work", "digest"] as const;
export type Category = (typeof CATEGORIES)[number];
