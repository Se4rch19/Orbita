import { recordRun, earnedFragments, todayRecord } from "./progression.ts";
import { refreshUnlocks } from "./storage.ts";
import { discover, type Save } from "./forge.ts";
import type { Game } from "./engine.ts";
export type Context =
  | { kind: "normal" }
  | { kind: "personal" }
  | { kind: "code"; code: string }
  | { kind: "anomaly"; tier: number };
const recorded = new WeakSet<Game>();
export function settle(s: Save, g: Game, context: Context, banked = 0) {
  if (!g.done || recorded.has(g)) return null;
  recorded.add(g);
  let r = { earned: 0, bonus: 0, previous: 0, unlocked: [] as number[] };
  const u = s.universe;
  if (context.kind === "code") {
    const old = u.challenges.find((c) => c.code === context.code);
    r.previous = old?.best ?? 0;
    u.challenges = [
      {
        code: context.code,
        best: Math.max(r.previous, g.score),
        combo: Math.max(old?.combo ?? 0, g.bestCombo),
      },
      ...u.challenges.filter((c) => c.code !== context.code),
    ].slice(0, 30);
    return { ...r, discoveries: [] as string[] };
  }
  if (context.kind === "normal") {
    const firstDaily =
      g.mode === "daily" &&
      g.outcome === "cleared" &&
      !u.stats.dailyDates.includes(g.config.dailyDate) &&
      !todayRecord(s, g.config.dailyDate).completed;
    r = recordRun(s, g, banked);
    if (firstDaily) {
      s.totalLights += 15;
      r.bonus += 15;
    }
    if (g.mode === "daily" && g.outcome === "cleared")
      u.stats.dailyDates = [
        ...new Set([g.config.dailyDate, ...u.stats.dailyDates]),
      ].slice(0, 366);
  } else {
    r.earned = earnedFragments(g);
    s.runs++;
    s.bestCombo = Math.max(s.bestCombo, g.bestCombo);
    if (context.kind === "personal") {
      r.previous = u.personalBest[g.config.world];
      u.personalBest[g.config.world] = Math.max(r.previous, g.score);
    } else {
      r.previous = u.anomalyBest;
      u.anomalyBest = Math.max(u.anomalyBest, g.score);
      if (g.outcome === "cleared" && context.tier === u.anomalyTier) {
        u.anomalyTier++;
        r.bonus = 20;
      }
    }
    s.totalLights += r.earned + r.bonus;
  }
  if (g.mode !== "tutorial") {
    u.stats.lights += g.lights;
    u.stats.seconds += Math.floor(g.time);
    if (g.mode === "infinite")
      u.stats.infiniteSeconds = Math.max(
        u.stats.infiniteSeconds,
        Math.floor(g.time),
      );
    if (g.mode === "voyage" && g.outcome === "cleared" && g.lives === 3)
      u.stats.cleanRuns++;
  }
  const discoveries = discover(s);
  refreshUnlocks(s);
  return { ...r, discoveries };
}
