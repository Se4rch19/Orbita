import type { Game } from "./engine.ts";
import {
  emptyDaily,
  refreshUnlocks,
  type Save,
  type DailyRecord,
} from "./storage.ts";
export function levelUnlocked(save: Save, world: number, level: number) {
  return (
    !!save.unlockedWorlds[world] &&
    level >= 0 &&
    level < 3 &&
    (level === 0 || save.campaign[world].cleared[level - 1])
  );
}
export function nextLevel(save: Save, world: number) {
  const index = save.campaign[world].cleared.findIndex((v) => !v);
  return index < 0 ? 2 : index;
}
export function todayRecord(save: Save, date: number): DailyRecord {
  return (
    save.dailyHistory.find((r) => r.date === date && r.rules === 2) ??
    (save.daily.date === date && save.daily.rules === 2
      ? save.daily
      : emptyDaily(date))
  );
}
export function markDailyPlayed(save: Save, date: number) {
  const r = {
    ...todayRecord(save, date),
    played: true,
    attempts: todayRecord(save, date).attempts + 1,
  };
  save.daily = r;
  save.dailyHistory = [
    r,
    ...save.dailyHistory.filter((d) => d.date !== date),
  ].slice(0, 31);
}
export function bestFor(save: Save, game: Game) {
  return game.mode === "voyage"
    ? save.campaign[game.config.world].best[game.config.level]
    : game.mode === "daily"
      ? todayRecord(save, game.config.dailyDate).best
      : game.mode === "infinite"
        ? save.infiniteBest
        : 0;
}
export function earnedFragments(game: Pick<Game, "mode" | "lights" | "time">) {
  return game.mode === "tutorial"
    ? 0
    : game.mode === "zen"
      ? Math.min(Math.floor(game.lights * 0.25), Math.floor(game.time / 10))
      : game.lights;
}
export function recordRun(save: Save, game: Game, alreadyBanked = 0) {
  if (game.mode === "tutorial") {
    if (game.outcome === "cleared") save.tutorial = true;
    return { earned: 0, bonus: 0, previous: 0, unlocked: [] as number[] };
  }
  const previous = bestFor(save, game),
    before = [...save.unlockedWorlds],
    earned = earnedFragments(game);
  let bonus = 0;
  save.runs++;
  save.bestCombo = Math.max(save.bestCombo, game.bestCombo);
  if (game.mode === "voyage") {
    const p = save.campaign[game.config.world],
      l = game.config.level;
    p.best[l] = Math.max(p.best[l], game.score);
    save.best = Math.max(save.best, game.score);
    if (game.outcome === "cleared") {
      if (!p.cleared[l]) bonus = 20 + l * 5;
      p.cleared[l] = true;
      save.completed++;
    }
  }
  if (game.mode === "infinite")
    save.infiniteBest = Math.max(save.infiniteBest, game.score);
  if (game.mode === "daily") {
    const old = todayRecord(save, game.config.dailyDate),
      r = {
        ...old,
        played: true,
        best: Math.max(old.best, game.score),
        completed: old.completed || game.outcome === "cleared",
      };
    save.daily = r;
    save.dailyHistory = [
      r,
      ...save.dailyHistory.filter((d) => d.date !== r.date),
    ].slice(0, 31);
    if (game.outcome === "cleared") save.completed++;
  }
  save.totalLights += Math.max(0, earned - alreadyBanked) + bonus;
  refreshUnlocks(save);
  save.history.unshift({
    score: game.score,
    lights: earned + bonus,
    mode: game.mode,
  });
  save.history = save.history.slice(0, 20);
  return {
    earned,
    bonus,
    previous,
    unlocked: save.unlockedWorlds.flatMap((v, i) =>
      v && !before[i] ? [i] : [],
    ),
  };
}
