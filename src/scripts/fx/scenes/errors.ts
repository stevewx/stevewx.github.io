import type { FxScene } from "../types";
import { PALETTE, rgba } from "../palette";

/**
 * Training-log terminal. Mostly mundane progress lines scroll upward, punctuated
 * by the errors every MLE has stared at in the dark: CUDA OOM, NCCL timeouts,
 * device-side asserts. Not always fun — but very real. The error lines flash
 * red and linger a beat longer. Purely cosmetic; the strings are canned.
 */
interface Line {
  text: string;
  kind: "info" | "warn" | "error";
  born: number; // y position in line-units from bottom (animated up)
}

const INFO: string[] = [
  "[rank0] step 1482 | loss 0.612 | lr 3.0e-6 | tok/s 41.2k",
  "[rank0] step 1483 | loss 0.609 | grad_norm 0.84",
  "[rollout] generated 256 trajectories | mean_len 1973",
  "[reward] batch reward mean 0.47 | kl 0.013",
  "[ckpt] saved async to s3://…/global_step_1480/",
  "[rank3] all-reduce 1.2 GB in 38ms",
  "[sglang] prefix cache hit rate 0.71",
  "[rank0] step 1484 | loss 0.604 | lr 3.0e-6 | tok/s 40.8k",
  "[megatron] pp_rank 2 microbatch 7/8",
  "[rank0] advantage whitening done | std 1.00",
];

const WARN: string[] = [
  "[warn] grad_norm spike 7.41 — clipping",
  "[warn] rollout straggler: rank5 12.3s behind",
  "[warn] kv-cache 96% — approaching capacity",
  "[warn] reward model queue depth 1840",
];

const ERRORS: string[] = [
  "[rank2] torch.cuda.OutOfMemoryError: tried to allocate 2.41 GiB",
  "[rank0] NCCL timeout: watchdog caught collective after 1800000ms",
  "[rank6] RuntimeError: CUDA error: device-side assert triggered",
  "[rank4] NCCL error: unhandled system error (run with NCCL_DEBUG=INFO)",
  "[rank1] RuntimeError: NCCL communicator was aborted on rank 1",
  "[rank7] CUDA error: an illegal memory access was encountered",
  "[rank0] ECC error: uncorrectable, GPU 3 fell off the bus",
  "[rank3] AssertionError: loss is NaN at step 1487",
];

export function errors(): FxScene {
  let W = 0;
  let H = 0;
  let lineH = 18;
  let maxLines = 0;
  let lines: Line[] = [];
  let acc = 0;
  let sinceError = 0;

  let seed = 8086;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  function build() {
    lineH = W < 640 ? 16 : 18;
    maxLines = Math.floor((H * 0.7) / lineH);
    lines = [];
  }

  function emit() {
    // ~14% warn, ~8% error, rest info — but force an error if it's been a while
    const r = rand();
    let kind: Line["kind"];
    let text: string;
    if (sinceError > 9 || r < 0.08) {
      kind = "error";
      text = pick(ERRORS);
      sinceError = 0;
    } else if (r < 0.22) {
      kind = "warn";
      text = pick(WARN);
      sinceError++;
    } else {
      kind = "info";
      text = pick(INFO);
      sinceError++;
    }
    for (const l of lines) l.born += 1;
    lines.unshift({ text, kind, born: 0 });
    if (lines.length > maxLines) lines.pop();
  }

  return {
    resize(w, h) {
      W = w;
      H = h;
      build();
    },
    frame(ctx, _t, dt, _w, _h) {
      const step = dt / 1000;
      acc += step;
      const emitEvery = 0.42;
      while (acc > emitEvery) {
        acc -= emitEvery;
        emit();
      }

      ctx.font = `13px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      const x = W * 0.08;
      // bottom of the scrolling log block
      const baseY = H * 0.5 + (maxLines * lineH) / 2 + H * 0.02;

      for (const l of lines) {
        const y = baseY - l.born * lineH;
        if (y < H * 0.1 || y > H) continue;
        // newest line is brightest; older fades
        const age = l.born / maxLines;
        const fade = Math.max(0.12, 1 - age);
        let triplet: string = PALETTE.dim;
        let a = 0.32 * fade;
        if (l.kind === "warn") {
          triplet = PALETTE.signal;
          a = 0.4 * fade;
        } else if (l.kind === "error") {
          triplet = PALETTE.error;
          // errors stay legible longer + a soft highlight bar
          a = Math.max(0.3, 0.62 * fade);
          ctx.fillStyle = rgba(PALETTE.error, 0.06 * fade);
          ctx.fillRect(x - 8, y - lineH + 4, W * 0.84 + 16, lineH);
        }
        ctx.fillStyle = rgba(triplet, a);
        ctx.fillText(l.text, x, y);
      }
    },
  };
}
