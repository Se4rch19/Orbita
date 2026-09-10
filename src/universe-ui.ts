import { t as message } from "./i18n.ts";
import { environmentEditor } from "./identity-ui.ts";
import {
  categories,
  components,
  component,
  balance,
  slotLimit,
  conditionMet,
  requirement,
  milestones,
  type Save,
  type Planet,
  type Category,
} from "./forge.ts";
import { worlds, sessionConfig } from "./config.ts";
import { decodeChallenge, anomaly } from "./challenges.ts";
export const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const button = (action: string, label: string, extra = "") =>
  message("m_422d113963", { p0: action, p1: extra, p2: label });
export function discoveries(s: Save) {
  return s.universe.pending.length
    ? message("m_ae02e73e9d") +
        s.universe.pending.length +
        message("m_3ce4aaadd9")
    : "";
}
export function forgePage(
  s: Save,
  draft: Planet,
  slot: number,
  category: Category,
  profile: number,
) {
  return message("m_3b3397c2e2", {
    p0: balance(s),
    p1: !s.universe.introduced ? message("m_b6b1196930") : "",
    p2: escape(draft.name),
    p3: Array.from({ length: slotLimit(s) }, (_, i) =>
      button(
        "forge-slot",
        s.universe.planets[i]
          ? escape(s.universe.planets[i].name)
          : message("m_9334355ee0", { p0: i + 1 }),
        message("m_bf922cc67a", {
          p0: i,
          p1: slot === i,
          p2: i > s.universe.planets.length ? "disabled" : "",
        }),
      ),
    ).join(""),
    p4: escape(draft.name),
    p5: Object.entries(categories)
      .map(([id, name]) =>
        button(
          "forge-category",
          name,
          message("m_eaeb1cf37b", { p0: id, p1: category === id }),
        ),
      )
      .join(""),
    p6: components
      .filter((c) => c.category === category)
      .map((c) => {
        const owned = s.universe.inventory.includes(c.id);
        return message("m_f4736f0456", {
          p0: draft.design[category] === c.id ? "selected" : "",
          p1: c.id,
          p2: owned ? "" : "disabled",
          p3: draft.design[category] === c.id,
          p4: owned ? "✧" : "◇",
          p5: c.name,
          p6: owned
            ? c.rarity
            : requirement(c.condition) +
              (c.cost ? message("m_f9631fc560", { p0: c.cost }) : ""),
        });
      })
      .join(""),
    p7: environmentEditor(s, draft),
    p8: button("open-collection", message("m_3ab798843b")),
    p9: worlds
      .map((w, i) =>
        s.unlockedWorlds[i]
          ? message("m_a2a2606750", {
              p0: i,
              p1: i === profile ? "selected" : "",
              p2: w.name,
              p3: w.mechanic,
            })
          : "",
      )
      .join(""),
    p10: slotLimit(s) < 3 ? message("m_90c4f15dff") : message("m_db34ab5767"),
  });
}
export function collectionPage(s: Save, category: Category) {
  return message("m_96b60b62b9", {
    p0: s.universe.inventory.length,
    p1: components.length,
    p2: balance(s),
    p3: s.totalLights,
    p4: Object.entries(categories)
      .map(([id, name]) =>
        button(
          "collection-category",
          name,
          message("m_eaeb1cf37b", { p0: id, p1: category === id }),
        ),
      )
      .join(""),
    p5: components
      .filter((c) => c.category === category)
      .map((c) => {
        const owned = s.universe.inventory.includes(c.id),
          ready = conditionMet(s, c.condition);
        return message("m_408ad5167c", {
          p0: owned ? "discovered" : "locked",
          p1: owned ? "✧" : "◇",
          p2: c.rarity,
          p3: c.name,
          p4: requirement(c.condition),
          p5: owned
            ? "Descubierto"
            : ready
              ? message("m_e56862a427")
              : message("m_a679aeeabb"),
          p6:
            c.cost && !owned
              ? button(
                  "forge-acquire",
                  message("m_95ccfc8660", { p0: c.cost }),
                  message("m_29aff38ccf", {
                    p0: c.id,
                    p1: ready && balance(s) >= c.cost ? "" : "disabled",
                  }),
                )
              : "",
        });
      })
      .join(""),
  });
}
export function profilePage(s: Save) {
  const u = s.universe;
  return message("m_9c4ffc1486", {
    p0: [
      [balance(s), message("m_aee0236f85")],
      [u.inventory.length + "/" + components.length, message("m_83d527c9a2")],
      [u.planets.length, message("m_f1d0f0cdda")],
      [u.stats.dailyDates.length, message("m_5eb307d5ff")],
      [Math.floor(u.stats.seconds / 60), message("m_2c274bd3dc")],
      [u.stats.lights, message("m_41148d24c0")],
    ]
      .map(([v, label]) => message("m_113034fc9c", { p0: v, p1: label }))
      .join(""),
    p1: milestones
      .map((m) =>
        message("m_cea333c797", {
          p0: u.milestones.includes(m.id) ? "✓" : "◇",
          p1: m.name,
          p2: requirement(m.condition),
          p3: u.milestones.includes(m.id) ? "Logrado" : `+${m.reward}`,
        }),
      )
      .join(""),
  });
}
export function codesPage(s: Save, code: string) {
  let info = "";
  try {
    const q = decodeChallenge(code),
      c = sessionConfig("voyage", q);
    info = message("m_19740d007b", {
      p0: worlds[q.world].name,
      p1: q.level + 1,
      p2: c.duration,
      p3: c.targetLights,
      p4: c.orbits.length,
    });
  } catch {}
  return message("m_0393c50c97", {
    p0: worlds
      .map((w, i) =>
        s.unlockedWorlds[i]
          ? message("m_1d85e143ee", { p0: i, p1: w.name })
          : "",
      )
      .join(""),
    p1: button("code-create", message("m_1a98ffd413")),
    p2: escape(code),
    p3: info,
    p4: button("code-copy", message("m_3b9435be5e")),
    p5: s.universe.challenges.length
      ? s.universe.challenges
          .map((r) =>
            message("m_830075ac5c", {
              p0: r.code,
              p1: r.best,
              p2: r.combo,
              p3: button("code-history", "Cargar", `data-code="${r.code}"`),
            }),
          )
          .join("")
      : message("m_502bdd05af"),
  });
}
export function anomalyPage(s: Save) {
  const open = s.campaign.every((p) => p.cleared.every(Boolean)),
    q = anomaly(s.universe.anomalyTier, 0),
    c = sessionConfig("voyage", q);
  return message("m_f6187d34f5", {
    p0: open
      ? message("m_11b499d82c", { p0: s.universe.anomalyTier + 1 })
      : message("m_4d051a90f3"),
    p1: open ? worlds[q.world].name : message("m_dab4f63c18"),
    p2: open
      ? message("m_7207bb1ddb", {
          p0: worlds[q.world].mechanic,
          p1: c.duration,
          p2: c.targetLights,
        })
      : message("m_f579b5d82c"),
    p3: open ? message("m_df70b2526f") : "",
    p4: open ? "" : "disabled",
    p5: open ? message("m_885a458fc0") : message("m_33a78bc701"),
  });
}
