import { normalize as legacyNormalize } from "./storage.ts";
import {
  freshUniverse,
  normalizeDesign,
  safeName,
  components,
  starterIds,
  milestones,
  type Save,
} from "./forge.ts";
import { decodeChallenge, encodeChallenge } from "./challenges.ts";
export type { Save } from "./forge.ts";
const num = (v: unknown, max = 1e9) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(0, Math.floor(v)))
    : 0;
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const strings = (v: unknown, allowed: string[]) =>
  Array.isArray(v)
    ? [
        ...new Set(
          v.filter(
            (x): x is string => typeof x === "string" && allowed.includes(x),
          ),
        ),
      ]
    : [];
export function normalize3(value: unknown): Save {
  const raw = object(value),
    base = legacyNormalize(raw.version === 3 ? { ...raw, version: 2 } : raw);
  const s: Save = { ...base, version: 3, universe: freshUniverse() },
    u = s.universe;
  const daily = [s.daily, ...s.dailyHistory]
    .filter((r) => r.completed && r.rules === 2)
    .map((r) => r.date);
  if (raw.version === 3) {
    const old = object(raw.universe),
      stats = object(old.stats);
    u.inventory = [
      ...new Set([
        ...starterIds(),
        ...strings(
          old.inventory,
          components.map((c) => c.id),
        ),
      ]),
    ];
    u.spent = num(old.spent, s.totalLights);
    u.milestones = strings(
      old.milestones,
      milestones.map((m) => m.id),
    );
    u.pending = strings(old.pending, u.inventory).filter(
      (id) => !starterIds().includes(id),
    );
    u.introduced = old.introduced === true;
    u.stats = {
      lights: num(stats.lights),
      seconds: num(stats.seconds),
      infiniteSeconds: num(stats.infiniteSeconds),
      dailyDates: [],
      cleanRuns: num(stats.cleanRuns),
      created: num(stats.created),
    };
    if (Array.isArray(stats.dailyDates))
      daily.push(
        ...stats.dailyDates.filter(
          (x): x is number =>
            typeof x === "number" &&
            Number.isInteger(x) &&
            x >= 20000101 &&
            x <= 99991231,
        ),
      );
    if (Array.isArray(old.planets))
      u.planets = old.planets
        .slice(0, 3)
        .filter((x) => x && typeof x === "object")
        .map((p) => ({
          name: safeName(p.name),
          design: normalizeDesign(p.design, u.inventory),
        }));
    u.selected = num(old.selected, Math.max(0, u.planets.length - 1));
    u.stats.created = Math.max(u.stats.created, u.planets.length);
    u.personalBest = u.personalBest.map((_, i) =>
      num(Array.isArray(old.personalBest) ? old.personalBest[i] : 0),
    );
    u.anomalyTier = num(old.anomalyTier, 1e6);
    u.anomalyBest = num(old.anomalyBest);
    if (Array.isArray(old.challenges))
      for (const entry of old.challenges.slice(0, 30)) {
        try {
          const r = object(entry);
          const code = encodeChallenge(decodeChallenge(String(r.code)));
          if (!u.challenges.some((c) => c.code === code))
            u.challenges.push({ code, best: num(r.best), combo: num(r.combo) });
        } catch {}
      }
  }
  u.stats.dailyDates = [...new Set(daily)].sort((a, b) => b - a).slice(0, 366);
  return s;
}
export const fresh3 = () => normalize3(null);
const keys = [
  "orbita.v3",
  "orbita.v3.backup",
  "orbita.v2",
  "orbita.v2.backup",
  "orbita.v1",
];
export function readSave(): Save {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        [1, 2, 3].includes(value.version ?? 1) &&
        typeof value.totalLights === "number"
      )
        return normalize3(value);
    } catch {}
  }
  return fresh3();
}
export function writeSave(s: Save) {
  try {
    const old = localStorage.getItem(keys[0]);
    if (old) {
      try {
        const p = JSON.parse(old);
        if (p?.version === 3 && p.universe && typeof p.totalLights === "number")
          localStorage.setItem(keys[1], old);
      } catch {}
    }
    localStorage.setItem(keys[0], JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function resetSave() {
  try {
    const s = fresh3();
    localStorage.setItem(keys[0], JSON.stringify(s));
    for (const key of keys.slice(1)) localStorage.removeItem(key);
    return s;
  } catch {
    return null;
  }
}
