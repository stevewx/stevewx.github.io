import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Falling columns of numeric "tensor" values — GPU-memory vibe. Kept very dim
 * and using decimals/hex rather than katakana to avoid the literal Matrix look.
 * The leading glyph in each column glows brighter (the "write head").
 */
interface Column {
  x: number;
  head: number; // fractional
  speed: number;
  glyphs: string[];
  gap: number; // rows between active runs
}

export function tensorRain(): FxScene {
  let W = 0;
  let H = 0;
  let cols: Column[] = [];
  let rowH = 18;
  let colW = 16;

  let seed = 99;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const glyph = () => {
    const r = rand();
    if (r < 0.5) return (rand() * 2 - 1).toFixed(1);
    if (r < 0.8) return rand().toFixed(2);
    return Math.floor(rand() * 16).toString(16);
  };

  function build() {
    rowH = W < 640 ? 16 : 18;
    colW = W < 640 ? 26 : 34;
    const n = Math.floor(W / colW);
    const rows = Math.ceil(H / rowH) + 2;
    cols = [];
    for (let i = 0; i < n; i++) {
      const glyphs: string[] = [];
      for (let r = 0; r < rows; r++) glyphs.push(glyph());
      cols.push({
        x: i * colW + colW / 2,
        head: -rand() * rows,
        speed: 2 + rand() * 4, // rows/sec
        glyphs,
        gap: rows,
      });
    }
  }

  return {
    resize(w, h) {
      W = w;
      H = h;
      build();
    },
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;
      ctx.font = `${rowH - 4}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      const rows = Math.ceil(H / rowH) + 2;

      for (const col of cols) {
        col.head += col.speed * step;
        if (col.head - col.gap > rows) {
          col.head = -rand() * 6;
          col.speed = 2 + rand() * 4;
          col.gap = Math.floor(rows * (0.5 + rand() * 0.6));
        }

        const headRow = Math.floor(col.head);
        const tail = col.gap;
        for (let k = 0; k < tail; k++) {
          const row = headRow - k;
          if (row < 0 || row >= rows) continue;
          const y = row * rowH + rowH / 2;
          if (rand() < 0.02) col.glyphs[row] = glyph();
          const ch = col.glyphs[row];
          let a: number;
          if (k === 0)
            a = 0.55;
          else a = Math.max(0, 0.22 * (1 - k / tail));
          ctx.fillStyle =
            k === 0 ? rgba(PALETTE.accent, a) : rgba(PALETTE.dim, a * 0.8);
          ctx.fillText(ch, col.x, y);
        }
      }
    },
  };
}
