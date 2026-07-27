import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * RL post-training schedule. Two lanes — Rollout/Generation (orange) and
 * Training (cyan) — with a playhead that sweeps left→right lighting each stage
 * as it "runs". The animation loops through FOUR regimes along the policy-
 * freshness axis, telling the core story: GPU idle "bubbles" collapse as
 * scheduling improves, but data staleness rises.
 *
 *   1. synchronous : gen → train → gen → train. Staleness 0. Big bubbles.
 *   2. interleaved : overlap gen of later mini-batches with training of earlier
 *                    ones; the weight update fires only at the global-batch
 *                    barrier → still ON-POLICY (staleness 0). Bubbles shrink.
 *   3. pipelined   : train step k overlaps gen for step k+1 → 1 step off-policy.
 *   4. fully async : generators run continuously, trainer consumes when ready →
 *                    bounded staleness (≤ s_max). Lanes packed, ~zero idle.
 *
 * Idle gaps get a faint orange wash; the interleaved barrier (weight update) is
 * drawn as a vertical accent tick so "on-policy" reads at a glance.
 */
type Kind = "gen" | "train";
interface Block {
  lane: number; // 0 = rollout, 1 = train
  start: number; // normalized timeline [0,1]
  end: number;
  kind: Kind;
}
interface Gap {
  lane: number;
  start: number;
  end: number;
}
interface Phase {
  label: string;
  staleness: string;
  util: number; // 0..1
  blocks: Block[];
  gaps: Gap[];
  barriers: number[]; // x positions [0,1] of weight-update barriers
}

const PHASE_SWEEP = 4200; // ms for the playhead to cross
const PHASE_HOLD = 900; // ms to hold the finished schedule
const PHASE_TOTAL = PHASE_SWEEP + PHASE_HOLD;
const FADE = 450; // ms cross-phase fade

export function pipeline(): FxScene {
  let W = 0;
  let H = 0;
  let phases: Phase[] = [];

  // ---- geometry (computed on resize) ----
  let originX = 0;
  let trackW = 0;
  let laneY: [number, number] = [0, 0];
  let laneH = 0;
  let safeTop = 0; // y below which content must stay (bottom of hero text)

  // Weight update fires at the end of each training block (where the optimizer
  // step happens). Interleaved overrides this with batch-boundary barriers.
  function trainEnds(blocks: Block[]): number[] {
    return blocks
      .filter((b) => b.lane === 1)
      .map((b) => b.end)
      .sort((a, b) => a - b);
  }

  function computeGaps(blocks: Block[]): Gap[] {
    const gaps: Gap[] = [];
    for (let lane = 0; lane < 2; lane++) {
      const segs = blocks
        .filter((b) => b.lane === lane)
        .sort((a, b) => a.start - b.start);
      let cursor = 0;
      for (const s of segs) {
        if (s.start - cursor > 0.015) {
          gaps.push({ lane, start: cursor, end: s.start });
        }
        cursor = Math.max(cursor, s.end);
      }
      if (1 - cursor > 0.015) gaps.push({ lane, start: cursor, end: 1 });
    }
    return gaps;
  }

  function buildPhases() {
    // Phase 1 — synchronous: rollout the whole batch, THEN train. Strict
    // alternation, both lanes idle half the time. Staleness 0.
    const u = 0.14;
    const syncBlocks: Block[] = [];
    let x = 0.02;
    for (let i = 0; i < 3; i++) {
      syncBlocks.push({ lane: 0, start: x, end: x + u, kind: "gen" });
      x += u;
      syncBlocks.push({ lane: 1, start: x, end: x + u, kind: "train" });
      x += u + 0.02;
    }

    // Phase 2 — interleaved (ON-POLICY): overlap GEN of later mini-batches with
    // TRAINING of earlier ones, but fire the weight update only at the global-
    // batch boundary — so all rollouts share one policy version → staleness 0.
    // Mini-batch width `il` is derived so nBatches batches + gaps span [0.02,0.98].
    const ilBlocks: Block[] = [];
    const ilBarriers: number[] = [];
    const nBatches = 4;
    const nMini = 3;
    const ilGap = 0.02;
    const ilSpan = 0.96; // 0.02 .. 0.98
    // total = nBatches * (nMini+1) * il + (nBatches-1) * ilGap  →  solve for il
    const il = (ilSpan - (nBatches - 1) * ilGap) / (nBatches * (nMini + 1));
    let ix = 0.02;
    for (let gb = 0; gb < nBatches; gb++) {
      const base = ix;
      for (let m = 0; m < nMini; m++) {
        ilBlocks.push({ lane: 0, start: base + m * il, end: base + (m + 1) * il, kind: "gen" });
        ilBlocks.push({ lane: 1, start: base + (m + 1) * il, end: base + (m + 2) * il, kind: "train" });
      }
      const end = base + (nMini + 1) * il;
      ilBarriers.push(end); // weight update happens here, after ALL mini-batches train
      ix = end + ilGap;
    }

    // Phase 3 — pipelined async: train step k overlaps gen for step k+1. Steady
    // overlap, offset by one → data is 1 step off-policy.
    const w = 0.15;
    const pipeBlocks: Block[] = [];
    pipeBlocks.push({ lane: 0, start: 0.02, end: 0.02 + w, kind: "gen" }); // warmup gen (step 1)
    let p = 0.02 + w;
    for (let i = 0; i < 4; i++) {
      pipeBlocks.push({ lane: 0, start: p, end: p + w, kind: "gen" });
      pipeBlocks.push({ lane: 1, start: p, end: p + w, kind: "train" });
      p += w;
    }
    pipeBlocks.push({ lane: 1, start: p, end: Math.min(0.98, p + w), kind: "train" }); // final drain

    // Phase 4 — fully async: both lanes packed continuously, tiny stagger.
    // Generators never stop; trainer consumes whenever ready → bounded staleness.
    const a = 0.16;
    const asyncBlocks: Block[] = [];
    for (let g = 0.02; g < 0.98; g += a) {
      asyncBlocks.push({ lane: 0, start: g, end: Math.min(0.98, g + a - 0.01), kind: "gen" });
    }
    for (let tr = 0.06; tr < 0.98; tr += a) {
      asyncBlocks.push({ lane: 1, start: tr, end: Math.min(0.98, tr + a - 0.01), kind: "train" });
    }

    // Every regime updates weights — the difference is the cadence. Sync,
    // pipelined, and async update after each training block; interleaved batches
    // many mini-batches into a single update at the batch boundary.
    phases = [
      { label: "synchronous", staleness: "on-policy", util: 0.5, blocks: syncBlocks, gaps: computeGaps(syncBlocks), barriers: trainEnds(syncBlocks) },
      { label: "interleaved", staleness: "on-policy", util: 0.78, blocks: ilBlocks, gaps: computeGaps(ilBlocks), barriers: ilBarriers },
      { label: "pipelined", staleness: "1 step off", util: 0.9, blocks: pipeBlocks, gaps: computeGaps(pipeBlocks), barriers: trainEnds(pipeBlocks) },
      { label: "fully async", staleness: "≤ s_max off", util: 0.98, blocks: asyncBlocks, gaps: computeGaps(asyncBlocks), barriers: trainEnds(asyncBlocks) },
    ];
  }

  function computeGeometry() {
    originX = W * 0.08;
    trackW = W * 0.84;
    laneH = Math.max(10, Math.min(22, H * 0.04));
    const gapBetween = laneH * 0.8;
    const groupH = laneH * 2 + gapBetween;
    // The lanes carry a label row above (~1.3×laneH) and a Δθ label row below
    // (~1.8×laneH). Anchor the whole thing to the lower band, but never let the
    // top label row rise above safeTop (the bottom of the hero text) — so it
    // stays clear of the buttons at any viewport height.
    const labelAbove = laneH * 1.3;
    const bottomClearance = Math.max(laneH * 1.8 + 8, H * 0.1);
    const bottomAnchoredTop = H - groupH - bottomClearance;
    const minTop = safeTop + 12 + labelAbove;
    const top = Math.max(minTop, bottomAnchoredTop);
    laneY = [top, top + laneH + gapBetween];
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const rr = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  const tx = (n: number) => originX + trackW * n;

  return {
    resize(w, h, st = 0) {
      W = w;
      H = h;
      safeTop = st;
      computeGeometry();
      buildPhases();
    },
    frame(ctx, t, _dt, _w, _h) {
      const idx = Math.floor((t % (PHASE_TOTAL * phases.length)) / PHASE_TOTAL);
      const local = t % PHASE_TOTAL;
      const phase = phases[idx];
      const head = Math.min(1, local / PHASE_SWEEP); // playhead position 0..1

      // cross-phase fade (in at start, out at end)
      let alpha = 1;
      if (local < FADE) alpha = local / FADE;
      else if (local > PHASE_TOTAL - FADE) alpha = (PHASE_TOTAL - local) / FADE;
      alpha = Math.max(0, Math.min(1, alpha));

      for (let lane = 0; lane < 2; lane++) {
        ctx.fillStyle = rgba(PALETTE.dim, 0.045 * alpha);
        roundRect(ctx, tx(0), laneY[lane], trackW, laneH, 4);
        ctx.fill();
      }

      // idle bubbles: gaps render as a faint orange wash
      for (const g of phase.gaps) {
        if (head <= g.start) continue;
        const vis = Math.min(head, g.end);
        const gx = tx(g.start);
        const gw = tx(vis) - gx;
        if (gw < 1) continue;
        ctx.fillStyle = rgba(PALETTE.signal, 0.07 * alpha);
        roundRect(ctx, gx, laneY[g.lane], gw, laneH, 4);
        ctx.fill();
        // hatch lines to emphasize "wasted"
        ctx.save();
        roundRect(ctx, gx, laneY[g.lane], gw, laneH, 4);
        ctx.clip();
        ctx.strokeStyle = rgba(PALETTE.signal, 0.09 * alpha);
        ctx.lineWidth = 1;
        for (let hx = gx - laneH; hx < gx + gw; hx += 7) {
          ctx.beginPath();
          ctx.moveTo(hx, laneY[g.lane] + laneH);
          ctx.lineTo(hx + laneH, laneY[g.lane]);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const b of phase.blocks) {
        if (head <= b.start) continue;
        const triplet = b.kind === "gen" ? PALETTE.signal : PALETTE.accent;
        const visEnd = Math.min(head, b.end);
        const bx = tx(b.start);
        const bw = Math.max(2, tx(visEnd) - bx);
        const active = head >= b.start && head <= b.end;
        const fill = active ? 0.42 : 0.26;

        ctx.fillStyle = rgba(triplet, fill * alpha);
        roundRect(ctx, bx, laneY[b.lane] + 1, bw, laneH - 2, 3);
        ctx.fill();

        // glowing leading edge while running
        if (active) {
          const ex = tx(visEnd);
          const g = ctx.createLinearGradient(ex - 24, 0, ex, 0);
          g.addColorStop(0, rgba(triplet, 0));
          g.addColorStop(1, rgba(triplet, 0.5 * alpha));
          ctx.fillStyle = g;
          roundRect(ctx, ex - 24, laneY[b.lane] + 1, 24, laneH - 2, 3);
          ctx.fill();
        }
      }

      // The Δθ label sits BELOW the barrier ticks so it never collides with the
      // util label on the top row.
      const labelY = laneY[1] + laneH + Math.max(11, laneH * 0.7);
      for (const bx of phase.barriers) {
        if (head < bx) continue;
        const x = tx(bx);
        ctx.strokeStyle = rgba(PALETTE.accent, 0.5 * alpha);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, laneY[0] - laneH * 0.4);
        ctx.lineTo(x, laneY[1] + laneH * 1.3);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `500 ${Math.max(8, laneH * 0.4)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = rgba(PALETTE.accent, 0.6 * alpha);
        ctx.textAlign = "center";
        ctx.fillText("Δθ", x, labelY);
        ctx.textAlign = "left";
      }

      const phx = tx(head);
      ctx.strokeStyle = rgba(PALETTE.accent, 0.5 * alpha);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(phx, laneY[0] - laneH * 0.5);
      ctx.lineTo(phx, laneY[1] + laneH * 1.5);
      ctx.stroke();

      ctx.font = `500 ${Math.max(11, laneH * 0.5)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      const lx = tx(0);
      const ly = laneY[0] - laneH * 0.9;
      ctx.fillStyle = rgba(PALETTE.accent, 0.45 * alpha);
      ctx.fillText(`▸ ${phase.label}`, lx, ly);
      const labelW = ctx.measureText(`▸ ${phase.label}`).width;
      ctx.fillStyle = rgba(PALETTE.dim, 0.4 * alpha);
      ctx.fillText(`· ${phase.staleness}`, lx + labelW + 10, ly);

      const barW = trackW * 0.18;
      const barX = tx(1) - barW;
      const fillW = barW * phase.util;
      ctx.fillStyle = rgba(PALETTE.dim, 0.12 * alpha);
      roundRect(ctx, barX, ly - laneH * 0.4, barW, 4, 2);
      ctx.fill();
      ctx.fillStyle = rgba(PALETTE.accent, 0.4 * alpha);
      roundRect(ctx, barX, ly - laneH * 0.4, fillW, 4, 2);
      ctx.fill();
      ctx.fillStyle = rgba(PALETTE.dim, 0.4 * alpha);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(phase.util * 100)}% util`, barX - 8, ly);
      ctx.textAlign = "left";
    },
  };
}
