import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Sidecar eval. A continuous TRAIN lane (cyan) runs left→right, periodically
 * emitting a checkpoint marker (●). Each checkpoint drops to a separate SIDECAR
 * lane where an eval task runs on its own branch and logs a metric — never
 * blocking the train. The point: eval is off the critical path.
 */
interface Ckpt {
  bornX: number; // normalized x where it was emitted on the train lane
  age: number; // seconds since emitted
}

export function sidecar(): FxScene {
  let W = 0;
  let H = 0;
  let trainY = 0;
  let sideY = 0;
  let laneH = 0;
  let originX = 0;
  let trackW = 0;
  let ckpts: Ckpt[] = [];
  let scanX = 0; // train progress head [0,1], loops
  let emitAcc = 0;
  const EMIT_EVERY = 1.1; // seconds between checkpoints
  const SPEED = 0.17; // train head units/sec

  function geom() {
    originX = W * 0.08;
    trackW = W * 0.84;
    laneH = Math.max(10, Math.min(20, H * 0.05));
    const gap = laneH * 2.4;
    const groupH = laneH * 2 + gap;
    const top = H / 2 - groupH / 2;
    trainY = top;
    sideY = top + laneH + gap;
  }

  const tx = (n: number) => originX + trackW * n;

  return {
    resize(w, h) {
      W = w;
      H = h;
      geom();
      ckpts = [];
      scanX = 0;
      emitAcc = 0;
    },
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;
      scanX += SPEED * step;
      if (scanX > 1) {
        scanX = 0;
        ckpts = [];
        emitAcc = 0;
      }
      emitAcc += step;
      if (emitAcc > EMIT_EVERY && scanX < 0.95) {
        emitAcc -= EMIT_EVERY;
        ckpts.push({ bornX: scanX, age: 0 });
      }
      for (const c of ckpts) c.age += step;

      ctx.font = `500 ${Math.max(9, laneH * 0.55)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = rgba(PALETTE.accent, 0.45);
      ctx.fillText("trainer", originX, trainY - laneH * 0.5);
      ctx.fillStyle = rgba(PALETTE.dim, 0.4);
      ctx.fillText("sidecar · eval", originX, sideY - laneH * 0.5);

      ctx.fillStyle = rgba(PALETTE.dim, 0.05);
      ctx.fillRect(tx(0), trainY, trackW, laneH);
      ctx.fillStyle = rgba(PALETTE.accent, 0.3);
      ctx.fillRect(tx(0), trainY, trackW * scanX, laneH);
      const hx = tx(scanX);
      const g = ctx.createRadialGradient(hx, trainY + laneH / 2, 0, hx, trainY + laneH / 2, laneH);
      g.addColorStop(0, rgba(PALETTE.accent, 0.7));
      g.addColorStop(1, rgba(PALETTE.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(hx - laneH, trainY - laneH * 0.5, laneH * 2, laneH * 2);

      ctx.fillStyle = rgba(PALETTE.dim, 0.04);
      ctx.fillRect(tx(0), sideY, trackW, laneH);

      for (const c of ckpts) {
        const cx = tx(c.bornX);
        ctx.fillStyle = rgba(PALETTE.signal, 0.9);
        ctx.beginPath();
        ctx.arc(cx, trainY + laneH / 2, Math.max(2.5, laneH * 0.22), 0, Math.PI * 2);
        ctx.fill();

        const dropP = Math.min(1, c.age / 0.35);
        ctx.strokeStyle = rgba(PALETTE.signal, 0.35);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, trainY + laneH);
        ctx.lineTo(cx, trainY + laneH + (sideY - trainY - laneH) * dropP);
        ctx.stroke();
        ctx.setLineDash([]);

        if (dropP >= 1) {
          const evalP = Math.min(1, (c.age - 0.35) / 0.9);
          const ew = laneH * 3.2 * evalP;
          ctx.fillStyle = rgba(PALETTE.dim, 0.28);
          ctx.fillRect(cx, sideY + 1, ew, laneH - 2);
          if (evalP >= 1) {
            ctx.fillStyle = rgba(PALETTE.accent, 0.7);
            ctx.beginPath();
            ctx.arc(cx + ew + laneH * 0.4, sideY + laneH / 2, Math.max(2, laneH * 0.18), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  };
}
