import {
  sessionConfig,
  journeyDestination,
  difficulty,
  type Mode,
  type SessionOptions,
  type SessionConfig,
} from "./config.ts";
import { PatternGenerator, type PatternName } from "./generator.ts";
import { TAU, mod, crossed, pathMetric } from "./geometry.ts";
import { random, hashSeed, GENERATION_VERSION } from "./random.ts";
export { random, dailySeed } from "./random.ts";
export { TAU } from "./geometry.ts";
export type { Mode } from "./config.ts";
export type Item = {
  id: number;
  angle: number;
  lane: number;
  kind: "light" | "hazard" | "gap";
  passed: boolean;
  width?: number;
  pattern?: PatternName;
  fromLane?: number;
  settleAt?: number;
  born?: number;
};
export type GameEvent = {
  type: "collect" | "hit" | "finish" | "reverse";
  angle: number;
  lane: number;
  amount: number;
};
import { boundedLane, INPUT_COOLDOWN } from "./input.ts";
const STEP = 1 / 120;
export class Game {
  seed: number;
  mode: Mode;
  config: SessionConfig;
  rng: () => number;
  generator: PatternGenerator;
  destination = 0;
  sectionStart = 0;
  transitionUntil = 0;
  time = 0;
  duration: number;
  angle = -Math.PI / 2;
  lane = 0;
  radiusLane = 0;
  score = 0;
  lights = 0;
  combo = 0;
  bestCombo = 0;
  lives = 3;
  invincible = 0;
  done = false;
  items: Item[] = [];
  events: GameEvent[] = [];
  nextAngle = 0;
  serial = 0;
  switches = 0;
  cooldown = 0;
  direction: 1 | -1 = 1;
  velocity = 0;
  reversed = false;
  reversals = 0;
  outcome: "running" | "cleared" | "failed" | "finished" = "running";
  private accumulator = 0;
  private ticks = 0;
  private nextReverse = Infinity;
  constructor(mode: Mode, seed: number, options: SessionOptions = {}) {
    this.seed = seed;
    this.mode = mode;
    this.config = sessionConfig(mode, options);
    this.duration = this.config.duration;
    const generationSeed = hashSeed(
      seed,
      mode,
      this.config.world,
      this.config.level,
      this.config.ruleSeed,
      this.config.mobile ? 3 : GENERATION_VERSION,
    );
    this.rng = random(generationSeed);
    this.generator = new PatternGenerator(this.config, generationSeed);
    this.nextReverse = this.config.reversalEvery || Infinity;
    this.velocity = this.targetVelocity;
    this.nextAngle = this.angle + Math.max(1.1, this.peakSpeed * 0.85);
    this.populate();
  }
  get gentle() {
    return this.mode === "zen" || this.mode === "tutorial";
  }
  get multiplier() {
    return 1 + Math.min(3, Math.floor(this.combo / 5));
  }
  get intensity() {
    return difficulty(this.config, this.time);
  }
  get peakSpeed() {
    return difficulty(
      this.config,
      Number.isFinite(this.duration) ? this.duration : 1e6,
    ).maxSpeed;
  }
  get targetVelocity() {
    const o = this.config.orbits[this.lane],
      d = difficulty(this.config, this.time);
    return (
      Math.min(
        this.config.mobile ? 2.8 : 2.4,
        (o.baseSpeed * o.speedMultiplier * d.speedMultiplier) /
          pathMetric(o, this.angle),
      ) *
      o.direction *
      (this.reversed ? -1 : 1)
    );
  }
  get speed() {
    return Math.abs(this.targetVelocity);
  }
  get reversalWarning() {
    return Math.max(0, this.nextReverse - this.time) <= 2;
  }
  get objectiveMet() {
    return this.lights >= this.config.targetLights;
  }
  move(delta: number) {
    if (this.done || this.cooldown > 0 || this.transitionUntil > this.time)
      return false;
    const next = boundedLane(
      this.lane,
      delta,
      this.config.orbits.map((o) => o.active),
    );
    if (next === this.lane) return false;
    this.lane = next;
    this.switches++;
    this.cooldown = INPUT_COOLDOWN;
    return true;
  }
  // Legacy cyclic input remains only for old rule tests/replays. All UI uses move().
  switch(delta = 1) {
    if (this.config.mobile) return this.move(delta);
    if (
      this.done ||
      this.cooldown > 0 ||
      !Number.isFinite(delta) ||
      delta === 0
    )
      return false;
    const n = this.config.orbits.length;
    let lane = this.lane;
    for (let i = 0; i < n; i++) {
      lane = mod(lane + Math.sign(delta), n);
      if (this.config.orbits[lane].active) break;
    }
    if (lane === this.lane) return false;
    this.lane = lane;
    this.switches++;
    this.cooldown = 0.16;
    return true;
  }
  itemLane(item: Item) {
    if (item.fromLane === undefined || !item.settleAt) return item.lane;
    const t = Math.max(
      0,
      Math.min(
        1,
        (this.time - (item.born ?? 0)) / (item.settleAt - (item.born ?? 0)),
      ),
    );
    return item.fromLane + (item.lane - item.fromLane) * t;
  }
  private rebase(direction: 1 | -1) {
    this.direction = direction;
    const clearance = this.peakSpeed * 0.85;
    for (const item of this.items) {
      const ahead = mod((item.angle - this.angle) * direction);
      item.angle = this.angle + direction * ahead;
      if (ahead < clearance) item.passed = true;
    }
    this.items = this.items.filter((i) => !i.passed);
    this.nextAngle =
      this.angle +
      direction *
        (this.items.length
          ? Math.max(
              ...this.items.map((i) => (i.angle - this.angle) * direction),
            ) +
            this.peakSpeed * 0.85
          : clearance);
    this.populate();
  }
  populate() {
    while ((this.nextAngle - this.angle) * this.direction < TAU - 0.35) {
      const gate = this.generator.next(this.time);
      let safe = gate.safeLane;
      if (this.mode === "tutorial")
        safe =
          this.time < 5 ? 0 : this.time < 17 ? 1 : this.generator.count % 2;
      const angle = this.nextAngle;
      this.items.push({
        id: this.serial++,
        angle,
        lane: safe,
        kind: "light",
        passed: false,
        pattern: gate.pattern,
      });
      const blocked =
        this.mode === "tutorial"
          ? this.time >= 17
            ? [1 - safe]
            : []
          : gate.blocked;
      for (const lane of blocked) {
        const moving = gate.moving && this.config.orbits.length === 3;
        const other = Array.from(
          { length: this.config.orbits.length },
          (_, i) => i,
        ).find((i) => i !== safe && i !== lane);
        this.items.push({
          id: this.serial++,
          angle,
          lane,
          kind: gate.structural ? "gap" : "hazard",
          passed: false,
          width: gate.gapWidth,
          pattern: gate.pattern,
          ...(moving && other !== undefined
            ? { fromLane: other, born: this.time, settleAt: this.time + 0.35 }
            : {}),
        });
      }
      const spacing =
        Math.max(gate.spacing, this.peakSpeed * this.intensity.minReaction) +
        (this.config.structural ? 0.35 : 0);
      this.nextAngle += this.direction * spacing;
    }
  }
  private hit(item: Item) {
    if (this.invincible > 0) return;
    this.combo = 0;
    if (!this.gentle) this.lives--;
    else if (this.mode === "tutorial") this.lives = Math.max(1, this.lives - 1);
    this.invincible = 1;
    this.events.push({
      type: "hit",
      angle: this.angle,
      lane: item.lane,
      amount: 0,
    });
  }
  private end() {
    if (this.done) return;
    this.done = true;
    this.accumulator = 0;
    this.outcome =
      this.mode === "tutorial"
        ? this.switches > 0 && this.lights > 0
          ? "cleared"
          : "finished"
        : this.mode === "zen"
          ? "finished"
          : this.lives > 0 && this.objectiveMet && this.time >= this.duration
            ? "cleared"
            : "failed";
    this.events.push({
      type: "finish",
      angle: this.angle,
      lane: this.lane,
      amount: this.score,
    });
  }
  stop() {
    if (this.mode === "zen" || this.mode === "tutorial") this.end();
  }
  private step() {
    this.ticks++;
    this.time = Math.min(this.duration, this.ticks * STEP);
    if (this.config.journey) {
      if (!this.transitionUntil && this.time - this.sectionStart >= 50) {
        this.transitionUntil = this.time + 3;
        this.items = [];
        this.combo = 0;
      }
      if (this.transitionUntil) {
        if (this.time + 1e-8 < this.transitionUntil) return;
        this.destination++;
        const profile = journeyDestination(this.destination),
          assist = this.config.assistance;
        this.config = sessionConfig("infinite", {
          ...profile,
          mobile: true,
          journey: true,
          assistance: assist,
        });
        this.config.baseIntensity += Math.min(0.4, this.destination * 0.035);
        this.sectionStart = this.time;
        this.transitionUntil = 0;
        this.lane = Math.min(this.lane, this.config.orbits.length - 1);
        this.radiusLane = this.lane;
        this.angle = -Math.PI / 2;
        this.reversed = false;
        this.direction = this.config.orbits[this.lane].direction;
        this.velocity = this.targetVelocity;
        this.generator = new PatternGenerator(
          this.config,
          hashSeed(this.seed, "destination", this.destination),
        );
        this.nextReverse = this.config.reversalEvery
          ? this.time + this.config.reversalEvery
          : Infinity;
        this.nextAngle =
          this.angle + this.direction * Math.max(1.2, this.peakSpeed * 0.9);
        this.populate();
      }
    }
    if (this.time >= this.nextReverse) {
      this.reversed = !this.reversed;
      this.reversals++;
      this.nextReverse += this.config.reversalEvery;
      this.events.push({
        type: "reverse",
        angle: this.angle,
        lane: this.lane,
        amount: 0,
      });
    }
    this.velocity +=
      (this.targetVelocity - this.velocity) * (1 - Math.exp(-7 * STEP));
    const direction = this.velocity >= 0 ? 1 : -1;
    if (direction !== this.direction) this.rebase(direction);
    const before = this.angle;
    this.angle += this.velocity * STEP;
    this.radiusLane +=
      (this.lane - this.radiusLane) *
      (1 - Math.exp(-(this.config.mobile ? 32 : 22) * STEP));
    this.invincible = Math.max(0, this.invincible - STEP);
    this.cooldown = Math.max(0, this.cooldown - STEP);
    for (const item of this.items) {
      if (item.passed) continue;
      if (item.kind === "gap") {
        const half = (item.width ?? 0.32) / 2;
        if (
          Math.abs(this.angle - item.angle) <= half &&
          Math.abs(this.radiusLane - this.itemLane(item)) < 0.43
        )
          this.hit(item);
        if ((this.angle - item.angle) * this.direction > half)
          item.passed = true;
      } else if (crossed(before, this.angle, item.angle)) {
        item.passed = true;
        if (Math.abs(this.radiusLane - this.itemLane(item)) < 0.43) {
          if (item.kind === "light") {
            const amount = 10 * this.multiplier;
            this.score += amount;
            this.lights++;
            this.combo++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            this.events.push({
              type: "collect",
              angle: item.angle,
              lane: item.lane,
              amount,
            });
          } else this.hit(item);
        } else if (item.kind === "light") this.combo = 0;
      }
    }
    this.items = this.items.filter(
      (i) => (i.angle - this.angle) * this.direction > -0.4,
    );
    this.populate();
    if (this.lives <= 0 || this.time >= this.duration) this.end();
  }
  update(dt: number) {
    if (this.done || !Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += dt;
    while (this.accumulator + 1e-10 >= STEP && !this.done) {
      this.accumulator -= STEP;
      this.step();
    }
  }
}
