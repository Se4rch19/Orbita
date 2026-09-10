import { t as message } from "./i18n.ts";
import { worlds, LEVELS_PER_WORLD, type Mode } from "./config.ts";
export { worlds } from "./config.ts";
export type CampaignProgress = {
  cleared: boolean[];
  best: number[];
};
export type DailyRecord = {
  date: number;
  best: number;
  played: boolean;
  completed: boolean;
  attempts: number;
  rules: number;
};
export type Save = {
  version: 2 | 3;
  totalLights: number;
  best: number;
  legacyBest: number;
  bestCombo: number;
  runs: number;
  completed: number;
  world: number;
  sound: boolean;
  haptic: boolean;
  motion: boolean;
  tutorial: boolean;
  infiniteBest: number;
  unlockedWorlds: boolean[];
  campaign: CampaignProgress[];
  daily: DailyRecord;
  dailyHistory: DailyRecord[];
  history: {
    score: number;
    lights: number;
    mode: Mode;
  }[];
};
export const emptyDaily = (date = 0): DailyRecord => ({
  date,
  best: 0,
  played: false,
  completed: false,
  attempts: 0,
  rules: 2,
});
export const fresh = (): Save => ({
  version: 2,
  totalLights: 0,
  best: 0,
  legacyBest: 0,
  bestCombo: 0,
  runs: 0,
  completed: 0,
  world: 0,
  sound: true,
  haptic: true,
  motion:
    typeof matchMedia === "undefined" ||
    !matchMedia(message("m_af2ea5e68d")).matches,
  tutorial: false,
  infiniteBest: 0,
  unlockedWorlds: [true, false, false, false, false],
  campaign: worlds.map(() => ({
    cleared: Array(LEVELS_PER_WORLD).fill(false),
    best: Array(LEVELS_PER_WORLD).fill(0),
  })),
  daily: emptyDaily(),
  dailyHistory: [],
  history: [],
});
const num = (x: unknown, max = 1e9) =>
  typeof x === "number" && Number.isFinite(x)
    ? Math.max(0, Math.min(max, Math.floor(x)))
    : 0;
function record(value: unknown): DailyRecord {
  const s = (
    value && typeof value === "object" ? value : {}
  ) as Partial<DailyRecord>;
  return {
    date: num(s.date, 99991231),
    best: num(s.best),
    played: s.played === true,
    completed: s.completed === true,
    attempts: num(s.attempts),
    rules: num(s.rules, 2) || 1,
  };
}
export function refreshUnlocks(save: Save) {
  save.unlockedWorlds[0] = true;
  for (let i = 1; i < worlds.length; i++)
    if (
      save.totalLights >= worlds[i].cost &&
      save.campaign[i - 1].cleared.every(Boolean)
    )
      save.unlockedWorlds[i] = true;
}
export function normalize(value: unknown): Save {
  const d = fresh();
  if (!value || typeof value !== "object" || Array.isArray(value)) return d;
  const s = value as Partial<Save>;
  for (const k of [
    "totalLights",
    "best",
    "bestCombo",
    "runs",
    "completed",
    "infiniteBest",
    "legacyBest",
  ] as const)
    d[k] = num(s[k]);
  for (const k of ["sound", "haptic", "motion", "tutorial"] as const)
    if (typeof s[k] === "boolean") d[k] = s[k]!;
  if (s.version === 2) {
    if (Array.isArray(s.campaign))
      d.campaign = d.campaign.map((c, i) => {
        const old = s.campaign?.[i];
        return {
          cleared: c.cleared.map((_, j) => old?.cleared?.[j] === true),
          best: c.best.map((_, j) => num(old?.best?.[j])),
        };
      });
    if (Array.isArray(s.unlockedWorlds))
      d.unlockedWorlds = d.unlockedWorlds.map(
        (v, i) => v || s.unlockedWorlds?.[i] === true,
      );
    if (Array.isArray(s.dailyHistory))
      d.dailyHistory = s.dailyHistory
        .slice(0, 31)
        .map(record)
        .filter((r) => r.date > 0);
  } else {
    d.unlockedWorlds = worlds.map((w) => d.totalLights >= w.legacyCost);
    d.legacyBest = d.best;
  }
  refreshUnlocks(d);
  d.world = num(s.world, worlds.length - 1);
  if (!d.unlockedWorlds[d.world]) d.world = 0;
  d.daily = record(s.daily);
  if (s.version !== 2 && d.daily.date) {
    d.daily.played = true;
    d.daily.rules = 1;
  }
  if (Array.isArray(s.history))
    d.history = s.history
      .slice(0, 20)
      .filter(
        (h) => h && ["voyage", "zen", "daily", "infinite"].includes(h.mode),
      )
      .map((h) => ({
        score: num(h.score),
        lights: num(h.lights),
        mode: h.mode,
      }));
  return d;
}
export function migrateV1(value: unknown) {
  return normalize(value);
}
export function readSave(): Save {
  for (const key of ["orbita.v2", "orbita.v2.backup", "orbita.v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (value && typeof value === "object" && !Array.isArray(value))
        return normalize(value);
    } catch {}
  }
  return fresh();
}
export function writeSave(save: Save) {
  try {
    const current = localStorage.getItem("orbita.v2");
    if (current) {
      try {
        const parsed = JSON.parse(current);
        if (parsed?.version === 2)
          localStorage.setItem("orbita.v2.backup", current);
      } catch {}
    }
    localStorage.setItem("orbita.v2", JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function resetSave() {
  const save = fresh();
  try {
    for (const key of ["orbita.v1", "orbita.v2.backup"])
      localStorage.removeItem(key);
    localStorage.setItem("orbita.v2", JSON.stringify(save));
    return save;
  } catch {
    return null;
  }
}
