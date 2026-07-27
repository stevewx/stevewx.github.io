import type { FxFactory } from "./types";
import { tokenFlow } from "./scenes/tokenFlow";
import { pipeline } from "./scenes/pipeline";
import { tensorRain } from "./scenes/tensorRain";
import { attention } from "./scenes/attention";
import { kvCache } from "./scenes/kvCache";
import { errors } from "./scenes/errors";
import { sidecar } from "./scenes/sidecar";
import { gqaHeads } from "./scenes/gqaHeads";
import { moeRouting } from "./scenes/moeRouting";
import { checkpointing } from "./scenes/checkpointing";

/**
 * Every registered scene — usable as an in-post figure via initFxScene() or
 * previewable with ?fx=<name>.
 */
export const SCENES: Record<string, FxFactory> = {
  // ambient scenes
  "token-flow": tokenFlow,
  pipeline: pipeline,
  "tensor-rain": tensorRain,
  attention: attention,
  "kv-cache": kvCache,
  errors: errors,
  // topic-specific diagrams, built for individual posts
  sidecar: sidecar,
  "gqa-heads": gqaHeads,
  "moe-routing": moeRouting,
  checkpointing: checkpointing,
};

export type SceneName = keyof typeof SCENES;

/**
 * Scenes eligible for the homepage random background — ambient texture only, so
 * hero text stays legible on top. Labeled diagrams are excluded here (captions
 * and saturated accents clash behind the hero copy) but still work as in-post
 * figures / ?fx= previews.
 */
export const POOL: string[] = [
  "token-flow",
  "pipeline",
  "tensor-rain",
  "attention",
  "kv-cache",
  "errors",
];

/**
 * Pick a scene for the homepage background. Priority:
 *   1. ?fx=<name> query param — may name ANY registered scene, not just POOL
 *   2. random choice across the POOL
 */
export function pickScene(): { name: string; factory: FxFactory } {
  let chosen = "";

  try {
    const param = new URLSearchParams(window.location.search).get("fx");
    if (param && param in SCENES) chosen = param;
  } catch {
    /* ignore */
  }

  if (!chosen) {
    // crypto, not Math.random, for an unbiased pick
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    chosen = POOL[buf[0] % POOL.length];
  }

  return { name: chosen, factory: SCENES[chosen] };
}
