/** @type {import('tailwindcss').Config} */

// Color scales resolve to CSS variables ("R G B" triplets) so the palette can
// flip light/dark without touching utility classes. Values in src/styles/global.css.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutral surfaces: 950 = page bg, 700 = hairline. Semantics stable
        // across themes; only the values flip.
        ink: {
          950: v("ink-950"),
          900: v("ink-900"),
          850: v("ink-850"),
          800: v("ink-800"),
          700: v("ink-700"),
          600: v("ink-600"),
        },
        // Text ramp. extend deep-merges into Tailwind's built-in slate, so only
        // these shades become theme-aware.
        slate: {
          50: v("slate-50"),
          100: v("slate-100"),
          200: v("slate-200"),
          300: v("slate-300"),
          400: v("slate-400"),
          500: v("slate-500"),
          600: v("slate-600"),
        },
        accent: {
          DEFAULT: v("accent"),
          muted: v("accent-muted"),
          dim: v("accent-dim"),
        },
        signal: {
          DEFAULT: v("signal"),
          dim: v("signal-dim"),
        },
      },
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
