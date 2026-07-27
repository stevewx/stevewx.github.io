import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * GQA head grouping. A row of query heads (top) maps to K/V heads (bottom).
 * Cycles through three regimes — MHA (1 K/V per query head), GQA (groups share
 * a K/V head), MQA (all query heads share one) — drawing the connection lines
 * and a shrinking "KV cache" bar so the memory win is literal.
 */
interface Regime {
  label: string;
  kvHeads: number;
}

export function gqaHeads(): FxScene {
  let W = 0;
  let H = 0;
  const NQ = 8; // query heads
  let qY = 0;
  let kvY = 0;
  let originX = 0;
  let spanW = 0;
  let r = Math.max(5, 0);

  const regimes: Regime[] = [
    { label: "MHA", kvHeads: 8 },
    { label: "GQA (G=4)", kvHeads: 4 },
    { label: "GQA (G=2)", kvHeads: 2 },
    { label: "MQA", kvHeads: 1 },
  ];
  const PHASE = 2600; // ms per regime
  const FADE = 500;

  function geom() {
    originX = W * 0.12;
    spanW = W * 0.76;
    qY = H * 0.32;
    kvY = H * 0.68;
    r = Math.max(4, Math.min(9, W * 0.008));
  }

  const qx = (i: number) => originX + (spanW * (i + 0.5)) / NQ;
  const groupOf = (i: number, kv: number) => Math.floor(i / (NQ / kv));
  const kvx = (gIdx: number, kv: number) =>
    originX + (spanW * (gIdx + 0.5)) / kv;

  return {
    resize(w, h) {
      W = w;
      H = h;
      geom();
    },
    frame(ctx, t, _dt, _w, _h) {
      const idx = Math.floor((t % (PHASE * regimes.length)) / PHASE);
      const local = t % PHASE;
      const regime = regimes[idx];
      let alpha = 1;
      if (local < FADE) alpha = local / FADE;
      else if (local > PHASE - FADE) alpha = (PHASE - local) / FADE;
      alpha = Math.max(0, Math.min(1, alpha));
      const kv = regime.kvHeads;
      const pulse = 0.5 + 0.5 * Math.sin(t / 350);

      for (let i = 0; i < NQ; i++) {
        const g = groupOf(i, kv);
        const x1 = qx(i);
        const x2 = kvx(g, kv);
        ctx.strokeStyle = rgba(PALETTE.accent, 0.18 * alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, qY + r);
        ctx.lineTo(x2, kvY - r);
        ctx.stroke();
      }

      for (let i = 0; i < NQ; i++) {
        ctx.fillStyle = rgba(PALETTE.accent, 0.5 * alpha);
        ctx.beginPath();
        ctx.arc(qx(i), qY, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let gi = 0; gi < kv; gi++) {
        const x = kvx(gi, kv);
        const rr = r * 1.4;
        const gg = ctx.createRadialGradient(x, kvY, 0, x, kvY, rr * 2);
        gg.addColorStop(0, rgba(PALETTE.signal, (0.5 + 0.4 * pulse) * alpha));
        gg.addColorStop(1, rgba(PALETTE.signal, 0));
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(x, kvY, rr * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(PALETTE.signal, 0.85 * alpha);
        ctx.beginPath();
        ctx.arc(x, kvY, rr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = `500 ${Math.max(10, W * 0.011)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(PALETTE.dim, 0.4 * alpha);
      ctx.fillText(`${NQ} query heads`, originX, qY - r * 2.2);
      ctx.fillStyle = rgba(PALETTE.signal, 0.5 * alpha);
      ctx.fillText(
        `${kv} K/V head${kv > 1 ? "s" : ""}`,
        originX,
        kvY + r * 3,
      );

      ctx.textAlign = "center";
      ctx.fillStyle = rgba(PALETTE.accent, 0.55 * alpha);
      ctx.font = `500 ${Math.max(11, W * 0.013)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(`▸ ${regime.label}`, W / 2, qY - r * 2.2);

      const barX = originX;
      const barY = H * 0.9;
      const barMax = spanW;
      const frac = kv / NQ;
      ctx.fillStyle = rgba(PALETTE.dim, 0.1 * alpha);
      ctx.fillRect(barX, barY, barMax, 5);
      ctx.fillStyle = rgba(PALETTE.signal, 0.45 * alpha);
      ctx.fillRect(barX, barY, barMax * frac, 5);
      ctx.textAlign = "right";
      ctx.fillStyle = rgba(PALETTE.dim, 0.4 * alpha);
      ctx.font = `${Math.max(9, W * 0.01)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(`KV cache ×${(frac).toFixed(frac < 1 ? 2 : 0)}`, barX + barMax, barY - 6);
      ctx.textAlign = "left";
    },
  };
}
