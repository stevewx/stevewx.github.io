// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// GitHub Pages user site → served at the domain root.
const SITE = "https://stevewx.github.io";

export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  // Bilingual: English at the root, Chinese under /zh/. No auto-redirect —
  // the visitor's choice via the header switch is what moves them.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // Dual themes: Shiki emits both --shiki-light and --shiki-dark on every
      // token. `defaultColor: false` means neither is inlined as the color —
      // global.css activates one based on the <html> theme class.
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false,
      wrap: true,
    },
  },
  vite: {
    css: {
      transformer: "postcss",
    },
  },
});
