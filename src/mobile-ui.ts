import { t as message } from "./i18n.ts";
import type { Save } from "./forge.ts";
import { worlds, dailyMobile } from "./config.ts";
import { nextLevel } from "./progression.ts";
export function continuation(s: Save) {
  const world = s.campaign.findIndex(
    (p, i) => s.unlockedWorlds[i] && !p.cleared.every(Boolean),
  );
  return world < 0
    ? {
        world: s.world,
        level: 2,
        complete: s.campaign.every((p) => p.cleared.every(Boolean)),
      }
    : { world, level: nextLevel(s, world), complete: false };
}
export function playHome(s: Save) {
  const next = continuation(s),
    d = dailyMobile(),
    record = s.mobile.daily.find((r) => r.date === d.date);
  return message("m_d60d7a3897", {
    p0: next.complete ? message("m_250915605a") : message("m_70e62ebea8"),
    p1: next.complete ? message("m_6136b56acd") : worlds[next.world].name,
    p2: next.complete
      ? message("m_ac808be4ac")
      : message("m_318db38316", {
          p0: next.level + 1,
          p1: s.campaign.flatMap((p) => p.cleared).filter(Boolean).length,
        }),
    p3: worlds[d.world].name,
    p4: d.duration,
    p5: d.tiers[0],
    p6: d.tiers[1],
    p7: d.tiers[2],
    p8: record
      ? message("m_d40a119775", { p0: record.tier, p1: record.attempts })
      : "",
  });
}
export function settingsContent(s: Save) {
  const toggle = (id: string, label: string, on: boolean, desc = "") =>
    message("m_a9784f3075", {
      p0: label,
      p1: desc ? `<small>${desc}</small>` : "",
      p2: on,
      p3: label,
      p4: id,
      p5: on ? "on" : "",
    });
  return message("m_6bbbde3335", {
    p0: toggle("music", message("m_578afe0c7f"), s.mobile.music),
    p1: toggle("effects", message("m_24e936fc8a"), s.mobile.effects),
    p2: toggle("haptic", message("m_631840fba2"), s.haptic),
    p3: toggle("motion", message("m_6542118bd9"), s.motion),
    p4: s.mobile.controls === "radial" ? "selected" : "",
    p5: s.mobile.controls === "classic" ? "selected" : "",
    p6: toggle(
      "assistance",
      message("m_7962e9c9f0"),
      s.mobile.assistance,
      message("m_957c641e9e"),
    ),
  });
}
export function mobileJournal(s: Save) {
  const j = s.mobile.journey;
  return message("m_664de603e1", {
    p0: j.worlds,
    p1: j.seconds,
    p2: j.combo,
    p3: s.totalLights,
    p4: s.unlockedWorlds.filter(Boolean).length,
    p5: s.universe.anomalyTier,
    p6: s.mobile.daily
      .slice(0, 7)
      .map((r) =>
        message("m_d7135c23b1", {
          p0: r.date,
          p1: "★".repeat(r.tier),
          p2: "☆".repeat(3 - r.tier),
          p3: r.attempts,
          p4: r.best,
          p5: r.assisted ? message("m_b6862a60fd") : "",
        }),
      )
      .join(""),
    p7: s.mobile.assistedBest,
  });
}
