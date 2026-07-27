import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Async sharded checkpointing. Several rank lanes train left→right. Periodically
 * each rank writes its shard in parallel to a local-disk stage, which then
 * async-uploads to object storage (cyan progress) WHILE training continues. A
 * failure (red) eventually strikes; training rewinds and resumes from the last
 * completed checkpoint — the bubble it would have cost is what this avoids.
 */
interface Upload {
  x: number; // normalized x where the checkpoint was taken
  age: number;
}

export function checkpointing(): FxScene {
  let W = 0;
  let H = 0;
  const RANKS = 4;
  let laneY: number[] = [];
  let laneH = 0;
  let originX = 0;
  let trackW = 0;
  let head = 0; // training progress [0,1]
  let uploads: Upload[] = [];
  let ckptAcc = 0;
  let lastCkpt = 0; // x of last completed checkpoint
  let failed = false;
  let failX = 0;
  let resumeFlash = 0;

  const SPEED = 0.16;
  const CKPT_EVERY = 0.9; // seconds
  let elapsed = 0;
  let nextFailAt = 6.5; // seconds — single scripted failure per loop

  function geom() {
    originX = W * 0.08;
    trackW = W * 0.84;
    laneH = Math.max(6, Math.min(13, H * 0.03));
    const gap = laneH * 0.7;
    const groupH = RANKS * laneH + (RANKS - 1) * gap;
    const top = H / 2 - groupH / 2;
    laneY = [];
    for (let i = 0; i < RANKS; i++) laneY.push(top + i * (laneH + gap));
  }

  const tx = (n: number) => originX + trackW * n;

  function reset() {
    head = 0;
    uploads = [];
    ckptAcc = 0;
    lastCkpt = 0;
    failed = false;
    elapsed = 0;
    resumeFlash = 0;
  }

  return {
    resize(w, h) {
      W = w;
      H = h;
      geom();
      reset();
    },
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;
      elapsed += step;
      resumeFlash *= 0.92;

      if (!failed) {
        head += SPEED * step;
        ckptAcc += step;
        if (ckptAcc > CKPT_EVERY && head < 0.95) {
          ckptAcc -= CKPT_EVERY;
          uploads.push({ x: head, age: 0 });
        }
        if (elapsed > nextFailAt && head > lastCkpt + 0.08) {
          failed = true;
          failX = head;
        }
      } else {
        // brief pause on failure, then rewind to last completed checkpoint
        resumeFlash = 1;
        head = lastCkpt;
        failed = false;
        nextFailAt = elapsed + 100; // don't fail again this loop
      }

      for (const u of uploads) {
        u.age += step;
        // a checkpoint is "complete" once its upload finishes (~0.8s)
        if (u.age > 0.8 && u.x > lastCkpt) lastCkpt = u.x;
      }

      if (head >= 1) reset();

      // ---- rank lanes ----
      ctx.font = `${Math.max(8, laneH * 0.85)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      for (let r = 0; r < RANKS; r++) {
        const y = laneY[r];
        ctx.fillStyle = rgba(PALETTE.dim, 0.05);
        ctx.fillRect(tx(0), y, trackW, laneH);
        // trained-so-far fill
        ctx.fillStyle = rgba(PALETTE.accent, 0.28);
        ctx.fillRect(tx(0), y, trackW * head, laneH);
      }
      ctx.fillStyle = rgba(PALETTE.dim, 0.35);
      ctx.fillText(`${RANKS} ranks`, originX, laneY[0] - laneH * 1.4);

      // ---- training head (glowing edge across all lanes) ----
      const hx = tx(head);
      ctx.strokeStyle = rgba(PALETTE.accent, 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx, laneY[0] - laneH * 0.4);
      ctx.lineTo(hx, laneY[RANKS - 1] + laneH * 1.4);
      ctx.stroke();

      // ---- checkpoints: parallel shard writes + async upload bar ----
      for (const u of uploads) {
        const cx = tx(u.x);
        // each rank writes its shard (a tick on every lane = parallel write)
        for (let r = 0; r < RANKS; r++) {
          ctx.fillStyle = rgba(PALETTE.signal, 0.8);
          ctx.fillRect(cx - 1.5, laneY[r], 3, laneH);
        }
        // async upload progress bar below the lanes (overlaps training)
        const upP = Math.min(1, u.age / 0.8);
        const barY = laneY[RANKS - 1] + laneH + laneH * 0.8;
        const done = u.x <= lastCkpt;
        ctx.fillStyle = rgba(done ? PALETTE.accent : PALETTE.dim, (done ? 0.5 : 0.3));
        ctx.fillRect(cx, barY, Math.max(2, laneH * 2.4 * upP), Math.max(2, laneH * 0.4));
      }

      // ---- last-completed-checkpoint marker ----
      if (lastCkpt > 0) {
        const lx = tx(lastCkpt);
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = rgba(PALETTE.accent, 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, laneY[0] - laneH);
        ctx.lineTo(lx, laneY[RANKS - 1] + laneH * 2.4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rgba(PALETTE.accent, 0.45);
        ctx.textAlign = "center";
        ctx.fillText("✓ ckpt", lx, laneY[RANKS - 1] + laneH * 3.2);
        ctx.textAlign = "left";
      }

      // ---- failure / resume flash ----
      if (resumeFlash > 0.02) {
        const fx = tx(failX);
        ctx.fillStyle = rgba(PALETTE.error, 0.6 * resumeFlash);
        for (let r = 0; r < RANKS; r++) {
          ctx.fillRect(fx - 2, laneY[r], 4, laneH);
        }
        ctx.fillStyle = rgba(PALETTE.error, 0.7 * resumeFlash);
        ctx.textAlign = "center";
        ctx.fillText("✗ crash → resume", fx, laneY[0] - laneH * 2.4);
        ctx.textAlign = "left";
      }
    },
  };
}
