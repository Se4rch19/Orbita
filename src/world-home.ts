import { t } from "./i18n.ts";
import type { Save } from "./forge.ts";
import { worlds, dailyMobile } from "./config.ts";

export type HomeMode = "voyage" | "zen" | "daily" | "infinite";
export function worldPlayable(s: Save, world: number) {
  return (
    Number.isInteger(world) &&
    world >= 0 &&
    world < 5 &&
    s.unlockedWorlds[world]
  );
}

export function modePanel(
  s: Save,
  world: number,
  mode: HomeMode,
): [string, string] {
  const daily = dailyMobile();
  const cleared = s.campaign.flatMap((p) => p.cleared).filter(Boolean).length;
  if (mode === "voyage") {
    const progress = s.campaign[world]?.cleared ?? [];
    const next = progress.findIndex((v) => !v);
    return [
      t("mode.expedition"),
      t("mode.expeditionMeta", {
        world: worlds[world].name,
        stage: next < 0 ? 3 : next + 1,
        cleared,
      }),
    ];
  }
  if (mode === "zen") return [t("mode.calm"), t("mode.calmMeta")];
  if (mode === "daily")
    return [
      t("mode.daily"),
      t("mode.dailyMeta", {
        world: worlds[daily.world].name,
        duration: daily.duration,
        modifier: daily.modifier,
      }),
    ];
  return [
    t("mode.infinite"),
    t("mode.infiniteMeta", {
      best: s.infiniteBest.toLocaleString(),
      worlds: s.mobile.journey.worlds,
    }),
  ];
}

export function worldHome(s: Save, world: number, mode: HomeMode) {
  const modes: HomeMode[] = ["voyage", "zen", "daily", "infinite"];
  const labels = [
    "m_bce3d2abe3",
    "m_b0b8fc593c",
    "m_128f39eee8",
    "m_47ab7fb410",
  ];
  const locked = !worldPlayable(s, world),
    panel = modePanel(s, world, mode);
  return `<section class="world-home" style="--world-color:${worlds[world].color}">
    <div class="world-heading"><span class="eyebrow">0${world + 1} / 05</span><h1>${worlds[world].name}</h1><span class="world-resources">✧ ${s.totalLights}</span></div>
    <div class="world-stage"><canvas class="universe-hero" aria-label="${worlds[world].name}" role="img"></canvas>
      <button class="world-arrow previous" data-action="browse-world" data-world="${(world + 4) % 5}" aria-label="${t("home.previous")}">‹</button>
      <button class="world-arrow next" data-action="browse-world" data-world="${(world + 1) % 5}" aria-label="${t("home.next")}">›</button><i class="travel-light"></i></div>
    <div class="world-dots">${worlds.map((w, i) => `<button data-action="browse-world" data-world="${i}" aria-label="${w.name}" aria-pressed="${i === world}"><i></i></button>`).join("")}</div>
    <p class="world-caption">${t("home.world" + world)}</p>
    <p class="world-requirement">${locked ? t("home.lock", { world: worlds[Math.max(0, world - 1)].name, cost: worlds[world].cost }) : "✧"}</p>
    <div class="world-modes" role="group">${modes.map((m, i) => `<button data-action="home-mode" data-mode="${m}" aria-pressed="${mode === m}"><span>${["◈", "☾", "✦", "∞"][i]}</span>${t(labels[i])}</button>`).join("")}</div>
    <div class="mode-panel" aria-live="polite"><strong>${t(labels[modes.indexOf(mode)])}</strong><p>${panel[0]}</p><small>${panel[1]}</small></div>
    <button class="primary world-play" data-action="world-play" ${locked && ["voyage", "zen"].includes(mode) ? "disabled" : ""}>${t("home.play")} <span>↗</span></button>
    <div class="world-links"><button data-action="training">${t("home.training")}</button><button data-action="open-codes">${t("home.codes")}</button><button data-action="campaign">${t("home.levels")}</button></div>
    <p class="world-tagline">${t("home.tagline")}</p></section>`;
}
