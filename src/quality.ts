export type Quality = "auto" | "low" | "medium" | "high";
export type QualityLevel = Exclude<Quality, "auto">;
export const qualityLevels: Quality[] = ["auto", "low", "medium", "high"];
export const budgets = {
  low: {
    stars: 28,
    dust: 8,
    asteroids: 8,
    moons: 3,
    atmosphere: 1,
    particles: 24,
    dpr: 1,
    scenes: 1,
    entities: 64,
  },
  medium: {
    stars: 48,
    dust: 16,
    asteroids: 18,
    moons: 3,
    atmosphere: 2,
    particles: 48,
    dpr: 1.5,
    scenes: 1,
    entities: 64,
  },
  high: {
    stars: 62,
    dust: 24,
    asteroids: 30,
    moons: 3,
    atmosphere: 3,
    particles: 80,
    dpr: 2,
    scenes: 1,
    entities: 64,
  },
} as const;
export function normalizeQuality(raw: unknown): Quality {
  return qualityLevels.includes(raw as Quality) ? (raw as Quality) : "auto";
}
export class VisualQuality {
  choice: Quality = "auto";
  level: QualityLevel;
  private poor = 0;
  private elapsed = 0;
  private cooldown = 0;
  private initial: QualityLevel;
  constructor(cores = 4, memory = 4) {
    this.level =
      cores >= 8 && memory >= 4
        ? "high"
        : cores <= 2 || memory <= 2
          ? "low"
          : "medium";
    this.initial = this.level;
  }
  set(choice: Quality) {
    this.choice = choice;
    this.level = choice === "auto" ? this.initial : choice;
    this.poor = this.elapsed = 0;
    this.cooldown = 30;
  }
  sample(seconds: number) {
    if (this.choice !== "auto" || seconds <= 0 || seconds > 0.2) return;
    this.cooldown = Math.max(0, this.cooldown - seconds);
    if (this.cooldown > 0) return;
    this.elapsed += seconds;
    if (seconds > 0.026) this.poor += seconds;
    if (this.elapsed >= 8) {
      if (this.poor / this.elapsed > 0.35) {
        this.level = this.level === "high" ? "medium" : "low";
        this.cooldown = 45;
      }
      this.poor = this.elapsed = 0;
    }
  }
  get budget() {
    return budgets[this.level];
  }
}
