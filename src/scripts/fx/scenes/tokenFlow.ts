import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Neural-net token flow. Layered nodes (like a small MLP / transformer block)
 * with light pulses traveling forward along edges — activations propagating.
 * Pointer (if wired) gently brightens nearby nodes.
 */
interface Node {
  x: number;
  y: number;
  layer: number;
  base: number; // baseline glow
  lit: number; // transient brightness 0..1
}
interface Edge {
  a: number;
  b: number;
}
interface Pulse {
  edge: number;
  p: number; // 0..1 progress along edge
  speed: number;
}

export function tokenFlow(): FxScene {
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let pulses: Pulse[] = [];
  let W = 0;
  let H = 0;
  let px = -1;
  let py = -1;
  let spawnAcc = 0;

  // deterministic-ish jitter without Math.random dependence concerns
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  function build() {
    nodes = [];
    edges = [];
    pulses = [];
    const layers = W < 640 ? 4 : 6;
    const marginX = W * 0.08;
    const usableW = W - marginX * 2;
    const perLayer: number[] = [];
    for (let l = 0; l < layers; l++) {
      // bell-ish: more nodes in the middle layers
      const mid = (layers - 1) / 2;
      const n = Math.round(3 + 3 * (1 - Math.abs(l - mid) / (mid + 1)));
      perLayer.push(Math.max(2, n));
    }

    const layerIndexStart: number[] = [];
    perLayer.forEach((count, l) => {
      layerIndexStart[l] = nodes.length;
      const x = marginX + (usableW * l) / (layers - 1);
      for (let i = 0; i < count; i++) {
        const y = (H * (i + 1)) / (count + 1) + (rand() - 0.5) * 24;
        nodes.push({
          x: x + (rand() - 0.5) * 18,
          y,
          layer: l,
          base: 0.12 + rand() * 0.1,
          lit: 0,
        });
      }
    });

    // sparse — not fully connected
    for (let l = 0; l < layers - 1; l++) {
      const aStart = layerIndexStart[l];
      const aEnd = l + 1 < layers ? layerIndexStart[l + 1] : nodes.length;
      const bStart = layerIndexStart[l + 1];
      const bEnd =
        l + 2 < layers ? layerIndexStart[l + 2] : nodes.length;
      for (let a = aStart; a < aEnd; a++) {
        for (let b = bStart; b < bEnd; b++) {
          if (rand() < 0.55) edges.push({ a, b });
        }
      }
    }
  }

  function spawnPulse() {
    if (edges.length === 0) return;
    const edge = Math.floor(rand() * edges.length);
    pulses.push({ edge, p: 0, speed: 0.4 + rand() * 0.5 });
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
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;

      spawnAcc += step;
      const spawnEvery = 0.18;
      while (spawnAcc > spawnEvery) {
        spawnAcc -= spawnEvery;
        if (pulses.length < 60) spawnPulse();
      }

      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        ctx.strokeStyle = rgba(PALETTE.dim, 0.05);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.p += pulse.speed * step;
        const e = edges[pulse.edge];
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (pulse.p >= 1) {
          nodes[e.b].lit = Math.min(1, nodes[e.b].lit + 0.6);
          // chain forward onto an edge leaving b
          const next: number[] = [];
          for (let k = 0; k < edges.length; k++)
            if (edges[k].a === e.b) next.push(k);
          if (next.length && rand() < 0.85) {
            pulse.edge = next[Math.floor(rand() * next.length)];
            pulse.p = 0;
          } else {
            pulses.splice(i, 1);
          }
          continue;
        }
        const x = a.x + (b.x - a.x) * pulse.p;
        const y = a.y + (b.y - a.y) * pulse.p;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
        g.addColorStop(0, rgba(PALETTE.accent, 0.9));
        g.addColorStop(1, rgba(PALETTE.accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const n of nodes) {
        n.lit *= 0.94;
        let glow = n.base + n.lit * 0.8;
        if (px >= 0) {
          const d = Math.hypot(n.x - px, n.y - py);
          if (d < 120) glow += (1 - d / 120) * 0.5;
        }
        glow = Math.min(glow, 1);
        const r = 2 + n.lit * 2.5;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        g.addColorStop(0, rgba(PALETTE.accent, glow));
        g.addColorStop(1, rgba(PALETTE.accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
