import { t as message } from "./i18n.ts";
import type { Save, Design } from "./forge.ts";
export type Extension = "biome" | "space" | "feature";
export const extensions = {
  biome: message("m_3ef09e1b5f"),
  space: message("m_90ff8e1529"),
  feature: message("m_15ebda3c77"),
};
export const environmentParts = [
  {
    id: "biome-ocean",
    category: "biome",
    name: message("m_209bc03365"),
    rule: "start",
    value: 0,
    cost: 0,
  },
  {
    id: "biome-dunes",
    category: "biome",
    name: message("m_7d57715eb8"),
    rule: "fragments",
    value: 35,
    cost: 10,
  },
  {
    id: "biome-crystal",
    category: "biome",
    name: message("m_c919a2b181"),
    rule: "world",
    value: 2,
    cost: 15,
  },
  {
    id: "biome-frozen",
    category: "biome",
    name: message("m_c9bb6381d6"),
    rule: "fragments",
    value: 90,
    cost: 15,
  },
  {
    id: "biome-lava",
    category: "biome",
    name: message("m_39175f3fd2"),
    rule: "daily",
    value: 2,
    cost: 20,
  },
  {
    id: "biome-dead",
    category: "biome",
    name: message("m_afb3dfa0a7"),
    rule: "anomaly",
    value: 1,
    cost: 20,
  },
  {
    id: "space-stars",
    category: "space",
    name: message("m_1ff8726964"),
    rule: "start",
    value: 0,
    cost: 0,
  },
  {
    id: "space-nebula",
    category: "space",
    name: message("m_fcc505ae6e"),
    rule: "fragments",
    value: 60,
    cost: 10,
  },
  {
    id: "space-aurora",
    category: "space",
    name: message("m_d2fe69c654"),
    rule: "infinite",
    value: 106,
    cost: 15,
  },
  {
    id: "space-void",
    category: "space",
    name: message("m_63586db1dc"),
    rule: "world",
    value: 4,
    cost: 20,
  },
  {
    id: "feature-none",
    category: "feature",
    name: message("m_91edddd2aa"),
    rule: "start",
    value: 0,
    cost: 0,
  },
  {
    id: "feature-islands",
    category: "feature",
    name: message("m_e4ea1774fc"),
    rule: "fragments",
    value: 30,
    cost: 8,
  },
  {
    id: "feature-craters",
    category: "feature",
    name: message("m_04ec6bcb67"),
    rule: "fragments",
    value: 50,
    cost: 10,
  },
  {
    id: "feature-fissure",
    category: "feature",
    name: message("m_cbf719e158"),
    rule: "daily",
    value: 1,
    cost: 12,
  },
  {
    id: "feature-storm",
    category: "feature",
    name: message("m_d3d60632b3"),
    rule: "infinite",
    value: 53,
    cost: 12,
  },
] as const;
export function extraAvailable(s: Save, id: string) {
  const p = environmentParts.find((p) => p.id === id);
  if (!p) return false;
  switch (p.rule) {
    case "start":
      return true;
    case "fragments":
      return s.totalLights >= p.value;
    case "world":
      return !!s.unlockedWorlds[p.value];
    case "daily":
      return s.mobile.daily.some((d) => d.tier >= p.value);
    case "infinite":
      return s.mobile.journey.seconds >= p.value;
    case "anomaly":
      return s.universe.anomalyTier >= p.value;
  }
}
export function acquireExtra(s: Save, id: string) {
  const p = environmentParts.find((p) => p.id === id);
  if (
    !p ||
    s.presentation.owned.includes(id) ||
    !extraAvailable(s, id) ||
    s.totalLights - s.universe.spent < p.cost
  )
    return false;
  s.universe.spent += p.cost;
  s.presentation.owned.push(id);
  return true;
}
export function compatible(d: Partial<Design>, id: string) {
  const biome = id.startsWith("biome-") ? id : d.biome;
  const feature = id.startsWith("feature-") ? id : d.feature;
  return (
    !(biome === "biome-lava" && d.surface === "surface-ice") &&
    !(biome === "biome-frozen" && d.surface === "surface-volcanic") &&
    !(
      feature === "feature-islands" &&
      biome &&
      !["biome-ocean", "biome-frozen"].includes(biome)
    )
  );
}
export function normalizeExtras(d: Partial<Design>, inventory: string[]) {
  for (const cat of ["biome", "space", "feature"] as const) {
    const id = d[cat];
    if (
      id &&
      (!environmentParts.some((p) => p.id === id && p.category === cat) ||
        !inventory.includes(id) ||
        !compatible(d, id))
    )
      delete d[cat];
  }
  return d;
}
