import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Attention heatmap. A grid of cells whose "weights" ripple in traveling waves,
 * like an attention matrix updating each decode step. A soft diagonal bias
 * evokes causal-attention structure. Pointer (if wired) adds a local hotspot.
 */
export function attention(): FxScene {
  let W = 0;
  let H = 0;
  let cols = 0;
  let rows = 0;
  let cell = 30;
  let phase: number[] = []; // per-cell phase offset
  let px = -1;
  let py = -1;

  let seed = 451;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  function build() {
    cell = W < 640 ? 26 : 34;
    cols = Math.ceil(W / cell) + 1;
    rows = Math.ceil(H / cell) + 1;
    phase = [];
    for (let i = 0; i < cols * rows; i++) phase.push(rand() * Math.PI * 2);
  }

  return {
    resize(w, h) {
      W = w;
      H = h;
      build();
    },
    pointer(x, y) {
      px = x;
      py = y;
    },
    frame(ctx, t, _dt, _w, _h) {
      const time = t / 1000;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          // traveling diagonal wave + per-cell phase
          const wave = Math.sin((c + r) * 0.5 - time * 1.4 + phase[idx]);
          // causal-ish diagonal emphasis
          const diag = 1 - Math.min(1, Math.abs(c - r) / (cols * 0.5));
          let w = (wave * 0.5 + 0.5) * (0.25 + diag * 0.75);

          const cx = c * cell + cell / 2;
          const cy = r * cell + cell / 2;
          if (px >= 0) {
            const d = Math.hypot(cx - px, cy - py);
            if (d < 140) w += (1 - d / 140) * 0.7;
          }

          const a = Math.min(0.16, w * 0.11);
          if (a > 0.006) {
            ctx.fillStyle = rgba(PALETTE.accent, a);
            ctx.fillRect(c * cell + 1.5, r * cell + 1.5, cell - 3, cell - 3);
          }
        }
      }
    },
  };
}
