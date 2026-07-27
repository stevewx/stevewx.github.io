import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Paged KV cache (vLLM / SGLang PagedAttention vibe). Tokens are appended slot
 * by slot into fixed-size pages; a write-head glows at the frontier. When the
 * cache fills, the oldest page is evicted (fades) to make room — the rolling
 * window. Occasionally a fresh sequence reuses a cached prefix: those pages
 * pulse cyan ("prefix cache hit").
 */
interface Slot {
  fill: number; // 0..1
  reuse: number; // transient prefix-reuse glow
}

export function kvCache(): FxScene {
  let W = 0;
  let H = 0;

  let cols = 0; // pages per row
  let rows = 0; // rows of pages
  let pageCols = 4; // slots across a page
  let pageRows = 2; // slots down a page
  let slotSize = 12;
  let pageGap = 10;
  let pageW = 0;
  let pageH = 0;
  let originX = 0;
  let originY = 0;

  let slots: Slot[] = []; // flattened, length = totalPages * pageCols * pageRows
  let totalPages = 0;
  let slotsPerPage = 0;

  let head = 0; // current write slot index (global, monotonically advancing)
  let acc = 0; // time accumulator for write rate
  let evictTo = 0; // slots below this are evicted (rolling window tail)
  let safeTop = 0; // y below which content must stay (bottom of hero text)

  let seed = 24601;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  function build() {
    // Remember prior occupancy so a resize doesn't reset the cache to empty
    // (a jarring restart mid-drag).
    const prevTotal = slots.length;
    const prevHead = head;

    slotSize = W < 640 ? 9 : 12;
    pageCols = 4;
    pageRows = 2;
    const slotGap = 2;
    pageGap = W < 640 ? 8 : 12;
    pageW = pageCols * slotSize + (pageCols - 1) * slotGap;
    pageH = pageRows * slotSize + (pageRows - 1) * slotGap;
    slotsPerPage = pageCols * pageRows;

    cols = Math.max(3, Math.floor((W * 0.84 + pageGap) / (pageW + pageGap)));

    // Vertical band available for the grid: from just below the hero text
    // (safeTop, plus room for the label row) down to a bottom margin. The grid
    // is bottom-anchored; rows are capped to whatever fits that band, so it can
    // never overlap the buttons — it just shows fewer rows on short viewports.
    const labelRoom = 22; // "▸ paged kv-cache" label sits ~16px above the grid
    const bottomMargin = Math.max(34, H * 0.11);
    const bandTop = Math.max(safeTop + 12, 0) + labelRoom;
    const bandBottom = H - bottomMargin;
    const band = Math.max(pageH, bandBottom - bandTop);

    const maxRows = Math.max(1, Math.floor((band + pageGap) / (pageH + pageGap)));
    rows = Math.max(1, Math.min(3, maxRows));
    totalPages = cols * rows;

    const gridH = rows * pageH + (rows - 1) * pageGap;
    originX = (W - (cols * pageW + (cols - 1) * pageGap)) / 2;
    // Bottom-anchored, but never above the band top (keeps the label clear of text).
    originY = Math.max(bandTop, bandBottom - gridH);

    const newTotal = totalPages * slotsPerPage;
    slots = [];
    for (let i = 0; i < newTotal; i++) slots.push({ fill: 0, reuse: 0 });

    // Carry the write frontier over as a fraction of capacity, then fill up to
    // it — so the cache keeps roughly the same occupancy across a resize
    // instead of snapping back to empty.
    const frac = prevTotal > 0 ? Math.min(1, prevHead / prevTotal) : 0;
    head = Math.round(frac * newTotal);
    for (let i = 0; i < head && i < newTotal; i++) slots[i].fill = 1;
    evictTo = 0;
  }

  function slotRect(idx: number) {
    const page = Math.floor(idx / slotsPerPage);
    const within = idx % slotsPerPage;
    const pr = Math.floor(within / pageCols);
    const pc = within % pageCols;
    const pRow = Math.floor(page / cols);
    const pCol = page % cols;
    const px = originX + pCol * (pageW + pageGap);
    const py = originY + pRow * (pageH + pageGap);
    const slotGap = 2;
    return {
      x: px + pc * (slotSize + slotGap),
      y: py + pr * (slotSize + slotGap),
    };
  }

  return {
    resize(w, h, st = 0) {
      W = w;
      H = h;
      safeTop = st;
      build();
    },
    frame(ctx, _t, dt, _w, _h) {
      const total = slots.length;
      const step = dt / 1000;

      // advance write head (~24 tokens/sec)
      acc += step;
      const writeEvery = 1 / 24;
      while (acc > writeEvery) {
        acc -= writeEvery;
        if (head < total) {
          slots[head].fill = 1;
          // occasionally flag a prefix-reuse burst at a page boundary
          if (head % slotsPerPage === 0 && rand() < 0.25) {
            const reusePages = 1 + Math.floor(rand() * 2);
            const startPage = Math.floor(head / slotsPerPage);
            for (let p = 0; p < reusePages; p++) {
              const base = (startPage + p) * slotsPerPage;
              for (let k = 0; k < slotsPerPage && base + k < total; k++) {
                slots[base + k].fill = Math.max(slots[base + k].fill, 0.85);
                slots[base + k].reuse = 1;
              }
            }
            head = Math.min(total, (startPage + reusePages) * slotsPerPage);
          }
          head++;
        } else {
          // cache full → evict oldest page, slide window
          for (let k = 0; k < slotsPerPage; k++) {
            if (evictTo + k < total) slots[evictTo + k].fill = 0;
          }
          evictTo += slotsPerPage;
          if (evictTo >= total) {
            // fully recycled → reset to a clean cache and continue
            for (const s of slots) {
              s.fill = 0;
              s.reuse = 0;
            }
            head = 0;
            evictTo = 0;
          } else {
            head = total; // stay full; next frames keep evicting (rolling)
          }
        }
      }

      for (let p = 0; p < totalPages; p++) {
        const pRow = Math.floor(p / cols);
        const pCol = p % cols;
        const px = originX + pCol * (pageW + pageGap);
        const py = originY + pRow * (pageH + pageGap);
        ctx.strokeStyle = rgba(PALETTE.dim, 0.07);
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 1.5, py - 1.5, pageW + 3, pageH + 3);
      }

      for (let i = 0; i < total; i++) {
        const s = slots[i];
        s.reuse *= 0.93;
        if (s.fill <= 0.01 && s.reuse <= 0.01) continue;
        const { x, y } = slotRect(i);
        const isHead = i === head - 1;
        let a = s.fill * 0.5;
        let triplet = PALETTE.accent;
        if (s.reuse > 0.02) {
          a = Math.max(a, 0.3 + s.reuse * 0.4);
          triplet = PALETTE.accent;
        }
        if (isHead) a = 0.7;
        ctx.fillStyle = rgba(triplet, a);
        ctx.fillRect(x, y, slotSize, slotSize);
        if (isHead) {
          const g = ctx.createRadialGradient(
            x + slotSize / 2,
            y + slotSize / 2,
            0,
            x + slotSize / 2,
            y + slotSize / 2,
            slotSize * 1.6,
          );
          g.addColorStop(0, rgba(PALETTE.accent, 0.5));
          g.addColorStop(1, rgba(PALETTE.accent, 0));
          ctx.fillStyle = g;
          ctx.fillRect(
            x - slotSize,
            y - slotSize,
            slotSize * 3,
            slotSize * 3,
          );
        }
      }

      const filled = slots.reduce((n, s) => n + (s.fill > 0.5 ? 1 : 0), 0);
      const occ = filled / total;
      ctx.font = `500 12px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      const lx = originX;
      const ly = originY - 16;
      ctx.fillStyle = rgba(PALETTE.accent, 0.4);
      ctx.fillText("▸ paged kv-cache", lx, ly);

      const barW = Math.min(160, W * 0.18);
      const barX = originX + cols * (pageW + pageGap) - pageGap - barW;
      ctx.fillStyle = rgba(PALETTE.dim, 0.12);
      ctx.fillRect(barX, ly - 9, barW, 4);
      ctx.fillStyle = rgba(PALETTE.accent, 0.4);
      ctx.fillRect(barX, ly - 9, barW * occ, 4);
      ctx.fillStyle = rgba(PALETTE.dim, 0.4);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(occ * 100)}% kv used`, barX - 8, ly);
      ctx.textAlign = "left";
    },
  };
}
