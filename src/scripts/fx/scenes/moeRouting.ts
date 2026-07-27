import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * MoE routing. Tokens stream in from the left to a router node, which fires
 * each token to top-k of N experts (the chosen experts light up; the rest stay
 * dark). Makes sparse activation literal: most of the model is idle per token.
 */
interface Token {
  x: number; // travels left → router
  routed: boolean;
  experts: number[];
  arrive: number; // age after routing, drives beam fade
}

export function moeRouting(): FxScene {
  let W = 0;
  let H = 0;
  const N = 8; // experts
  const K = 2; // top-k
  let routerX = 0;
  let routerY = 0;
  let expertX = 0;
  let expertYs: number[] = [];
  let tokens: Token[] = [];
  let spawnAcc = 0;
  let expertLit: number[] = [];

  let seed = 20240722;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  function geom() {
    routerX = W * 0.4;
    expertX = W * 0.72;
    expertYs = [];
    // Reserve the bottom strip for the label so it never overlaps the experts.
    const top = H * 0.12;
    const bot = H * 0.74;
    for (let i = 0; i < N; i++) {
      expertYs.push(top + ((bot - top) * i) / (N - 1));
    }
    routerY = (top + bot) / 2;
    expertLit = new Array(N).fill(0);
  }

  function pickExperts(): number[] {
    const chosen = new Set<number>();
    while (chosen.size < K) chosen.add(Math.floor(rand() * N));
    return [...chosen];
  }

  return {
    resize(w, h) {
      W = w;
      H = h;
      geom();
      tokens = [];
    },
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;
      spawnAcc += step;
      if (spawnAcc > 0.5) {
        spawnAcc -= 0.5;
        tokens.push({ x: 0, routed: false, experts: [], arrive: 0 });
      }

      const inSpeed = (routerX - W * 0.04) / 0.9; // px/sec to reach router
      for (let i = tokens.length - 1; i >= 0; i--) {
        const tok = tokens[i];
        if (!tok.routed) {
          tok.x += inSpeed * step;
          if (tok.x >= routerX - W * 0.04) {
            tok.routed = true;
            tok.experts = pickExperts();
            for (const e of tok.experts) expertLit[e] = 1;
          }
        } else {
          tok.arrive += step;
          if (tok.arrive > 1.0) tokens.splice(i, 1);
        }
      }
      for (let e = 0; e < N; e++) expertLit[e] *= 0.95;

      for (const tok of tokens) {
        if (tok.routed) continue;
        const x = W * 0.04 + tok.x;
        ctx.fillStyle = rgba(PALETTE.accent, 0.55);
        ctx.fillRect(x - 6, routerY - 2, 10, 4);
      }
      ctx.strokeStyle = rgba(PALETTE.dim, 0.12);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.04, routerY);
      ctx.lineTo(routerX, routerY);
      ctx.stroke();

      const rr = Math.max(6, W * 0.014);
      const g = ctx.createRadialGradient(routerX, routerY, 0, routerX, routerY, rr * 2.5);
      g.addColorStop(0, rgba(PALETTE.accent, 0.6));
      g.addColorStop(1, rgba(PALETTE.accent, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(routerX, routerY, rr * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(PALETTE.accent, 0.85);
      ctx.beginPath();
      ctx.arc(routerX, routerY, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${Math.max(8, W * 0.0095)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillStyle = rgba(PALETTE.dim, 0.4);
      ctx.textAlign = "center";
      ctx.fillText("router", routerX, routerY - rr * 2.2);
      ctx.textAlign = "left";

      for (const tok of tokens) {
        if (!tok.routed) continue;
        const fade = Math.max(0, 1 - tok.arrive);
        for (const e of tok.experts) {
          ctx.strokeStyle = rgba(PALETTE.accent, 0.5 * fade);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(routerX + rr, routerY);
          ctx.lineTo(expertX, expertYs[e]);
          ctx.stroke();
        }
      }

      const ew = Math.max(18, W * 0.05);
      const eh = Math.max(10, H * 0.055);
      for (let e = 0; e < N; e++) {
        const y = expertYs[e];
        const lit = expertLit[e];
        ctx.strokeStyle = rgba(PALETTE.dim, 0.18);
        ctx.lineWidth = 1;
        ctx.strokeRect(expertX, y - eh / 2, ew, eh);
        if (lit > 0.02) {
          ctx.fillStyle = rgba(PALETTE.accent, 0.4 * lit);
          ctx.fillRect(expertX, y - eh / 2, ew, eh);
        }
      }
      // Label sits in the reserved bottom strip, clear of the expert boxes.
      const bottomBox = expertYs[N - 1] + eh / 2;
      ctx.fillStyle = rgba(PALETTE.dim, 0.4);
      ctx.font = `${Math.max(8, W * 0.0095)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.fillText(
        `${N} experts · top-${K} active`,
        expertX,
        bottomBox + Math.max(16, (H - bottomBox) * 0.45),
      );
    },
  };
}
