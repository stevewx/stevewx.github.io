/**
 * A background FX scene. Each animation implements this interface and stays
 * fully self-contained — the runner owns the canvas lifecycle, the scene only
 * knows how to (re)lay-out for a given size and draw one frame.
 */
export interface FxScene {
  /**
   * Called once on init and again on every resize. Rebuild layout here.
   * @param safeTop y-coordinate (canvas px) below which structured content
   *   should be drawn — i.e. the bottom of any overlaid text/buttons. Scenes
   *   that anchor labeled content to the lower band must keep it below this so
   *   it never collides with the hero copy at any viewport height. Diffuse,
   *   full-bleed scenes can ignore it. Defaults to 0 (whole canvas usable).
   */
  resize(width: number, height: number, safeTop?: number): void;
  /**
   * Draw a single frame.
   * @param t  elapsed milliseconds since the scene started
   * @param dt milliseconds since the previous frame (clamped)
   */
  frame(
    ctx: CanvasRenderingContext2D,
    t: number,
    dt: number,
    width: number,
    height: number,
  ): void;
  /** Optional: receive pointer position (canvas-local px) for interactivity. */
  pointer?(x: number, y: number): void;
}

export type FxFactory = () => FxScene;
