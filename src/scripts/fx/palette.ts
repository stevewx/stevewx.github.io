/**
 * Shared FX palette. Colors are read at runtime from the same CSS variables
 * that drive the Tailwind theme, so the canvas scenes flip with light/dark
 * automatically and stay a single source of truth. Values are the "R G B"
 * triplets defined in global.css, normalized here to the "R, G, B" form rgba()
 * expects.
 *
 * PALETTE is a live object: call refreshPalette() after a theme change (the FX
 * runner wires this to the `themechange` event) and every scene picks up the
 * new colors on its next frame with no re-instantiation.
 */
export const PALETTE = {
  accent: "248, 250, 252",
  signal: "242, 153, 74",
  error: "239, 83, 80",
  dim: "148, 163, 184",
} as const satisfies Record<string, string>;

// Mutable backing store PALETTE proxies onto: keeps PALETTE's literal type
// for callers while letting values swap underneath.
const live: Record<keyof typeof PALETTE, string> = { ...PALETTE };

for (const key of Object.keys(live) as (keyof typeof PALETTE)[]) {
  Object.defineProperty(PALETTE, key, {
    get: () => live[key],
    enumerable: true,
  });
}

/** CSS var name (without leading --) backing each palette entry. */
const VAR_OF: Record<keyof typeof PALETTE, string> = {
  accent: "accent",
  signal: "signal",
  error: "signal", // no dedicated error var; error scenes also use literal red
  dim: "slate-400",
};

/** "8 10 15" → "8, 10, 15"; returns null if the var is unset/malformed. */
function tripletFromVar(name: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(Number(p)))) {
    return null;
  }
  return parts.join(", ");
}

/**
 * Re-read theme colors from CSS variables into the live palette. The `error`
 * red stays fixed (it is a semantic literal, not a theme token). Safe to call
 * any number of times; no-ops gracefully if variables are unavailable.
 */
export function refreshPalette(): void {
  for (const key of Object.keys(VAR_OF) as (keyof typeof PALETTE)[]) {
    if (key === "error") continue;
    const t = tripletFromVar(VAR_OF[key]);
    if (t) live[key] = t;
  }
}

export function rgba(triplet: string, alpha: number): string {
  return `rgba(${triplet}, ${alpha})`;
}
