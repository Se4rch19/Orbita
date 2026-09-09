import type { SessionConfig } from "./config.ts";
import { difficulty } from "./config.ts";
import { random } from "./random.ts";
export type PatternName =
  | "trail"
  | "alternate"
  | "safe-lane"
  | "funnel"
  | "pulse"
  | "crossing"
  | "fracture";
export type Gate = {
  pattern: PatternName;
  safeLane: number;
  blocked: number[];
  structural: boolean;
  moving: boolean;
  gapWidth: number;
  spacing: number;
  reaction: number;
};
export class PatternGenerator {
  rng: () => number;
  count = 0;
  safe = 0;
  pattern: PatternName = "trail";
  remaining = 0;
  config: SessionConfig;
  constructor(config: SessionConfig, seed: number) {
    this.config = config;
    this.rng = random(seed);
  }
  next(time: number): Gate {
    const d = difficulty(this.config, time),
      n = this.config.orbits.length;
    const active = this.config.orbits
      .filter((o) => o.active)
      .map((o) => o.lane);
    if (active.length === 0) throw new Error("A session needs an active orbit");
    if (this.remaining-- <= 0) {
      const pool: PatternName[] = ["trail", "alternate", "safe-lane"];
      if (d.patternTier > 0) pool.push("funnel", "pulse");
      if (this.config.moving) pool.push("crossing");
      if (this.config.structural) pool.push("fracture", "fracture");
      this.pattern = pool[Math.floor(this.rng() * pool.length)];
      this.remaining = 2 + Math.floor(this.rng() * 3);
      this.safe = Math.floor(this.rng() * n);
    }
    if (this.pattern === "alternate") this.safe = (this.safe + 1) % n;
    else if (this.pattern === "pulse" && this.remaining % 2 === 0)
      this.safe = (this.safe + 1) % n;
    else if (this.pattern === "trail" && this.rng() < 0.15)
      this.safe = Math.floor(this.rng() * n);
    const forceFracture =
      this.config.mode !== "zen" &&
      this.config.structural &&
      this.count >= 4 &&
      this.count % 6 === 4;
    const forceCrossing =
      this.config.moving &&
      this.count >= 4 &&
      this.count % 8 === 6 &&
      !forceFracture;
    const pattern = forceFracture
      ? "fracture"
      : forceCrossing
        ? "crossing"
        : this.pattern;
    if (pattern === "crossing") this.safe = this.safe === 0 ? 0 : n - 1;
    if (!active.includes(this.safe))
      this.safe = active[Math.floor(this.rng() * active.length)];
    const blocked: number[] = [];
    const probability =
      this.pattern === "fracture"
        ? Math.min(0.65, d.hazardDensity * 2)
        : this.pattern === "funnel"
          ? Math.min(0.65, d.hazardDensity * 1.6)
          : d.hazardDensity;
    if (
      this.count++ > 3 &&
      (forceFracture || forceCrossing || this.rng() < probability)
    ) {
      for (let lane = 0; lane < n; lane++)
        if (
          lane !== this.safe &&
          this.config.orbits[lane].active &&
          (blocked.length === 0 || pattern === "funnel")
        )
          blocked.push(lane);
    }
    return {
      pattern,
      safeLane: this.safe,
      blocked,
      structural: pattern === "fracture" && blocked.length > 0,
      moving: pattern === "crossing" && blocked.length > 0,
      gapWidth: 0.32,
      spacing: d.spacing + this.rng() * 0.2,
      reaction: d.minReaction,
    };
  }
}
export function validateGate(gate: Gate, lanes: number, maxSpeed: number) {
  return (
    gate.safeLane >= 0 &&
    gate.safeLane < lanes &&
    !gate.blocked.includes(gate.safeLane) &&
    gate.blocked.every((l) => Number.isInteger(l) && l >= 0 && l < lanes) &&
    new Set(gate.blocked).size === gate.blocked.length &&
    gate.blocked.length < lanes &&
    gate.spacing / maxSpeed >= gate.reaction
  );
}
