import type { Game } from "./engine.ts";
export type MusicSignal =
  | { type: "run-start"; mode: string; seed: number }
  | {
      type:
        | "run-end"
        | "pause"
        | "resume"
        | "orbit-in"
        | "orbit-out"
        | "light-collected"
        | "shield-hit"
        | "damage";
    }
  | {
      type: "world-changed" | "combo-changed" | "intensity-changed";
      value: number;
    };
export type MusicSink = (event: MusicSignal) => void;
/** One optional consumer, no queues, timers, audio dependencies or event history. */
export class MusicSignals {
  sink: MusicSink | null = null;
  private game: Game | null = null;
  private previous = {
    world: -1,
    combo: -1,
    intensity: -1,
    lane: -1,
    paused: false,
    done: false,
  };
  emit(event: MusicSignal) {
    try {
      this.sink?.(event);
    } catch {
      /* A future audio consumer cannot interrupt input/simulation. */
    }
  }
  observe(game: Game | null, paused: boolean) {
    if (game !== this.game) {
      if (this.game && !this.previous.done) this.emit({ type: "run-end" });
      this.game = game;
      this.previous = {
        world: -1,
        combo: -1,
        intensity: -1,
        lane: game?.lane ?? -1,
        paused: false,
        done: false,
      };
      if (game)
        this.emit({ type: "run-start", mode: game.mode, seed: game.seed });
    }
    if (!game) return;
    const p = this.previous;
    if (p.world !== game.config.world)
      this.emit({ type: "world-changed", value: game.config.world });
    if (p.combo !== game.combo)
      this.emit({ type: "combo-changed", value: game.combo });
    const intensity = Math.round(game.intensity.phase * 10) / 10;
    if (p.intensity !== intensity)
      this.emit({ type: "intensity-changed", value: intensity });
    if (p.lane !== game.lane)
      this.emit({ type: game.lane > p.lane ? "orbit-out" : "orbit-in" });
    if (p.paused !== paused) this.emit({ type: paused ? "pause" : "resume" });
    if (game.done && !p.done) this.emit({ type: "run-end" });
    this.previous = {
      world: game.config.world,
      combo: game.combo,
      intensity,
      lane: game.lane,
      paused,
      done: game.done,
    };
  }
}
export const musicSignals = new MusicSignals();
