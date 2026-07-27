import { FxRunner } from "./runner";
import { pickScene, SCENES } from "./registry";
import { refreshPalette } from "./palette";

// Scenes read PALETTE per frame, so a theme flip only needs a palette refresh.
let paletteListenerBound = false;
function bindPaletteSync(): void {
  refreshPalette();
  if (paletteListenerBound) return;
  paletteListenerBound = true;
  window.addEventListener("themechange", () => refreshPalette());
}

/**
 * Boot a background FX scene onto a canvas. Respects prefers-reduced-motion
 * (renders nothing — the static CSS grid/glow remains). Exposes the chosen
 * scene name on the canvas's data attribute for debugging.
 */
export function initFx(
  canvas: HTMLCanvasElement,
  safeArea?: HTMLElement | null,
): FxRunner | null {
  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  // ?fx=<name> forces motion even when reduced-motion is set.
  const forced = (() => {
    try {
      return new URLSearchParams(window.location.search).has("fx");
    } catch {
      return false;
    }
  })();
  if (prefersReduced && !forced) return null;

  bindPaletteSync();

  const { name, factory } = pickScene();
  canvas.dataset.fx = name;

  let runner: FxRunner;
  try {
    runner = new FxRunner(canvas, factory, safeArea);
    runner.init();
  } catch {
    return null;
  }

  // Wire pointer only if the scene uses it (saves listeners otherwise).
  if (runner.hasPointer()) {
    const onMove = (e: PointerEvent) => runner.setPointer(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
  }

  return runner;
}

/**
 * Boot a SPECIFIC named scene onto a canvas — used for inline post figures
 * where the scene is chosen deliberately (not random). Honors reduced-motion
 * by rendering nothing. Returns null if the name is unknown or motion is off.
 */
export function initFxScene(
  canvas: HTMLCanvasElement,
  name: string,
): FxRunner | null {
  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (prefersReduced) return null;

  const factory = SCENES[name];
  if (!factory) return null;

  bindPaletteSync();
  canvas.dataset.fx = name;

  let runner: FxRunner;
  try {
    runner = new FxRunner(canvas, factory);
    runner.init();
  } catch {
    return null;
  }

  if (runner.hasPointer()) {
    const onMove = (e: PointerEvent) => runner.setPointer(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  return runner;
}
