import type { FxScene, FxFactory } from "./types";

/**
 * Owns one <canvas>: device-pixel-ratio scaling, resize, off-screen pausing,
 * the rAF loop, and prefers-reduced-motion handling. Scenes stay dumb.
 */
export class FxRunner {
  private ctx: CanvasRenderingContext2D;
  private scene: FxScene;
  private raf = 0;
  private startTs = -1;
  private prevTs = -1;
  private lastT = 0; // last elapsed-time value painted (for resize repaints)
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private running = false;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private onVis: () => void;
  // Optional element whose bottom edge marks where overlaid content ends;
  // scenes use it to keep structured drawings clear of the hero text/buttons.
  private safeArea?: HTMLElement | null;
  // A drag fires ResizeObserver every frame; rebuilding per frame churns
  // diffuse scenes (they re-seed) and flashes the canvas. So debounce: the
  // bitmap stretches via CSS during the drag, one real relayout once it
  // settles. lastW/lastH/lastSafeTop skip no-op relayouts.
  private resizeTimer = 0;
  private readonly SETTLE_MS = 160;
  private lastW = -1;
  private lastH = -1;
  private lastSafeTop = -1;

  constructor(
    private canvas: HTMLCanvasElement,
    factory: FxFactory,
    safeArea?: HTMLElement | null,
  ) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.scene = factory();
    this.safeArea = safeArea ?? null;
    this.onVis = () => {
      if (document.hidden) this.stop();
      else this.start();
    };
  }

  init(): void {
    this.measure();

    // Also watch the safe-area element so the content floor stays accurate as
    // the text reflows at different widths.
    this.ro = new ResizeObserver(() => this.scheduleMeasure());
    this.ro.observe(this.canvas);
    if (this.safeArea) this.ro.observe(this.safeArea);

    // Pause when scrolled out of view — no wasted frames.
    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.start();
          else this.stop();
        }
      },
      { threshold: 0 },
    );
    this.io.observe(this.canvas);

    document.addEventListener("visibilitychange", this.onVis);
    this.start();
  }

  private scheduleMeasure(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = 0;
      this.measure();
    }, this.SETTLE_MS);
  }

  private measure(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    // Content floor: bottom of the safe-area element, in canvas-local px. Lets
    // structured scenes anchor their content below the hero text at any height.
    let safeTop = 0;
    if (this.safeArea) {
      const sr = this.safeArea.getBoundingClientRect();
      safeTop = Math.round(Math.max(0, Math.min(h, sr.bottom - rect.top)));
    }

    // Skip if nothing that affects layout changed — avoids clearing the canvas
    // and rebuilding the scene on spurious/duplicate observer callbacks.
    if (w === this.lastW && h === this.lastH && safeTop === this.lastSafeTop) {
      return;
    }
    const pixelChange = w !== this.lastW || h !== this.lastH;
    this.lastW = w;
    this.lastH = h;
    this.lastSafeTop = safeTop;

    this.cssW = w;
    this.cssH = h;

    // Only touch the backing store when the pixel size actually changes;
    // reassigning canvas.width/height clears the canvas (a visible flash), so a
    // safeTop-only update must NOT do it.
    if (pixelChange) {
      // Cap DPR at 2 — retina sharpness without quadrupling fill cost.
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.cssW * this.dpr);
      this.canvas.height = Math.round(this.cssH * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    this.scene.resize(this.cssW, this.cssH, safeTop);

    // Reassigning canvas.width/height (above) clears the canvas synchronously;
    // waiting for the next rAF would composite one blank frame (a flash). Paint
    // now with the last elapsed time so the canvas is never empty.
    this.paint(this.lastT, 0);
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.prevTs = -1;
    this.raf = requestAnimationFrame(this.loop);
  }

  private stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = (ts: number): void => {
    if (!this.running) return;
    if (this.startTs < 0) this.startTs = ts;
    const t = ts - this.startTs;
    // Clamp dt so a backgrounded tab doesn't produce a huge jump on resume.
    const dt = this.prevTs < 0 ? 16 : Math.min(ts - this.prevTs, 64);
    this.prevTs = ts;

    this.paint(t, dt);

    this.raf = requestAnimationFrame(this.loop);
  };

  // Extracted so a resize can repaint synchronously without waiting for rAF.
  private paint(t: number, dt: number): void {
    this.lastT = t;
    this.ctx.clearRect(0, 0, this.cssW, this.cssH);
    this.scene.frame(this.ctx, t, dt, this.cssW, this.cssH);
  }

  setPointer(clientX: number, clientY: number): void {
    if (!this.scene.pointer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.scene.pointer(clientX - rect.left, clientY - rect.top);
  }

  hasPointer(): boolean {
    return typeof this.scene.pointer === "function";
  }

  destroy(): void {
    this.stop();
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = 0;
    this.ro?.disconnect();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.onVis);
  }
}
