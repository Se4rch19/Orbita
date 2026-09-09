import { ASSIST_FRAGMENT_MULTIPLIER } from "./mobile-state.ts";
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
  const multiplier = g.config.assistance ? ASSIST_FRAGMENT_MULTIPLIER : 1;
  s.mobile.lastRunAssisted = g.config.assistance === true;
  if (g.config.assistance)
    s.mobile.assistedBest = Math.max(s.mobile.assistedBest, g.score);
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
      s.totalLights += Math.floor(15 * multiplier);
      r.bonus += Math.floor(15 * multiplier);
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
        r.bonus = Math.floor(20 * multiplier);
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
  if (g.config.mobile && g.mode === "daily") {
    const old = s.mobile.daily.find((r) => r.date === g.config.dailyDate),
      tier =
        g.outcome === "cleared"
          ? (g.config.dailyTiers ?? []).filter((t) => g.lights >= t).length
          : 0;
    s.mobile.daily = [
      {
        date: g.config.dailyDate,
        attempts: old?.attempts ?? 1,
        tier: Math.max(old?.tier ?? 0, tier),
        best: Math.max(old?.best ?? 0, g.score),
        assisted: g.config.assistance === true,
      },
      ...s.mobile.daily.filter((r) => r.date !== g.config.dailyDate),
    ].slice(0, 31);
  }
  if (g.config.journey) {
    const j = s.mobile.journey;
    j.score = Math.max(j.score, g.score);
    j.seconds = Math.max(j.seconds, Math.floor(g.time));
    j.worlds = Math.max(j.worlds, g.destination);
    j.destination = Math.max(j.destination, g.destination);
    j.combo = Math.max(j.combo, g.bestCombo);
  }
  const discoveries = discover(s, multiplier);
  refreshUnlocks(s);
  return { ...r, discoveries };
}
