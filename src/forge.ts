import { t as message } from "./i18n.ts";
import { normalizeExtras } from "./environment.ts";
import type { Presentation } from "./presentation-state.ts";
import type { Save as BaseSave } from "./storage.ts";
import type { Geometry } from "./config.ts";
export const categories = {
  shape: message("m_e96dcaa496"),
  surface: message("m_6bc76fa462"),
  palette: message("m_3367a7bf86"),
  atmosphere: message("m_706a559be4"),
  satellite: message("m_f6baf4bbd7"),
  ring: message("m_ed8f8107a2"),
  orbit: message("m_e296642704"),
} as const;
export type Category = keyof typeof categories;
export type Condition = {
  kind:
    | "start"
    | "tutorial"
    | "fragments"
    | "world"
    | "campaign"
    | "combo"
    | "infinite"
    | "daily"
    | "clean"
    | "created"
    | "anomaly";
  value: number;
};
export type Component = {
  id: string;
  category: Category;
  name: string;
  rarity: string;
  condition: Condition;
  cost: number;
  visual: {
    shape?: Geometry;
    colors?: [string, string];
    style?: string;
    count?: number;
  };
  performanceTier: 0 | 1;
};
const c = (
  category: Category,
  id: string,
  name: string,
  condition: Condition,
  visual: Component["visual"],
  cost = 0,
): Component => ({
  category,
  id,
  name,
  condition,
  visual,
  cost,
  rarity:
    condition.kind === "start"
      ? message("m_148d8804ae")
      : condition.kind === "campaign" || condition.kind === "anomaly"
        ? message("m_014e4caacc")
        : message("m_bcdc153a9f"),
  performanceTier: category === "atmosphere" ? 1 : 0,
});
const start: Condition = { kind: "start", value: 0 };
const fragments = (value: number): Condition => ({ kind: "fragments", value });
const world = (value: number): Condition => ({ kind: "world", value });
const shape = (lobes: number, deformation: number): Geometry => ({
  kind: deformation ? "petal" : "circle",
  lobes,
  deformation,
});
export const components: Component[] = [
  c("shape", "shape-circle", message("m_cc29e38faa"), start, {
    shape: shape(0, 0),
  }),
  c("shape", "shape-triangle", message("m_cf08e0e9a9"), world(2), {
    shape: shape(3, 0.105),
  }),
  c(
    "shape",
    "shape-square",
    message("m_996cae5542"),
    fragments(80),
    { shape: shape(4, 0.08) },
    20,
  ),
  c(
    "shape",
    "shape-pentagon",
    message("m_179c977874"),
    fragments(180),
    { shape: shape(5, 0.055) },
    30,
  ),
  c(
    "shape",
    "shape-hexagon",
    message("m_37a9925144"),
    { kind: "campaign", value: 15 },
    { shape: shape(6, 0.04) },
  ),
  c(
    "shape",
    "shape-blob",
    message("m_407891cae1"),
    { kind: "tutorial", value: 1 },
    { shape: shape(2, 0.13) },
  ),
  c("surface", "surface-garden", message("m_11cbdd1dda"), start, {
    style: "garden",
  }),
  c(
    "surface",
    "surface-rock",
    message("m_0fc8a24c72"),
    fragments(30),
    { style: "rock" },
    10,
  ),
  c("surface", "surface-ice", message("m_939b849682"), world(3), {
    style: "ice",
  }),
  c(
    "surface",
    "surface-ocean",
    message("m_dbb09449c2"),
    fragments(100),
    { style: "ocean" },
    20,
  ),
  c(
    "surface",
    "surface-volcanic",
    message("m_28d5bc3200"),
    { kind: "clean", value: 1 },
    { style: "volcanic" },
  ),
  c("surface", "surface-cosmic", message("m_f9e8d7332b"), world(4), {
    style: "cosmic",
  }),
  c("palette", "palette-mint", message("m_685d0edbbb"), start, {
    colors: ["#83edce", "#259d91"],
  }),
  c("palette", "palette-peach", message("m_ab9dd65ab2"), world(0), {
    colors: ["#ffc2a7", "#b86c70"],
  }),
  c("palette", "palette-lavender", message("m_ab5899907d"), world(1), {
    colors: ["#c7b5ff", "#7762aa"],
  }),
  c("palette", "palette-ice", message("m_c9057be2f0"), world(2), {
    colors: ["#a7e8ff", "#408fae"],
  }),
  c("palette", "palette-eclipse", message("m_45fc6c80b5"), world(3), {
    colors: ["#e1b6eb", "#79578b"],
  }),
  c(
    "palette",
    "palette-sun",
    "Amanecer",
    { kind: "daily", value: 3 },
    { colors: ["#f7db9c", "#a77b53"] },
  ),
  c("atmosphere", "atmosphere-none", message("m_1ff8726964"), start, {
    style: "none",
  }),
  c(
    "atmosphere",
    "atmosphere-halo",
    "Halo",
    { kind: "tutorial", value: 1 },
    { style: "halo" },
  ),
  c(
    "atmosphere",
    "atmosphere-stars",
    message("m_0dfe8daf33"),
    { kind: "combo", value: 10 },
    { style: "stars" },
  ),
  c(
    "atmosphere",
    "atmosphere-aurora",
    "Aurora",
    { kind: "infinite", value: 90 },
    { style: "aurora" },
  ),
  c("satellite", "satellite-none", message("m_63a8560e7d"), start, {
    count: 0,
    style: "moon",
  }),
  c(
    "satellite",
    "satellite-moon",
    message("m_21f1a1e832"),
    { kind: "created", value: 1 },
    { count: 1, style: "moon" },
  ),
  c(
    "satellite",
    "satellite-twin",
    message("m_9339fff445"),
    fragments(220),
    { count: 2, style: "moon" },
    35,
  ),
  c(
    "satellite",
    "satellite-crystal",
    message("m_02b18f2da7"),
    { kind: "daily", value: 1 },
    { count: 1, style: "crystal" },
  ),
  c("ring", "ring-none", message("m_50c2a871df"), start, { style: "none" }),
  c(
    "ring",
    "ring-simple",
    message("m_cd69deeecd"),
    fragments(50),
    { style: "simple" },
    15,
  ),
  c(
    "ring",
    "ring-double",
    message("m_71435b36f7"),
    fragments(140),
    { style: "double" },
    25,
  ),
  c(
    "ring",
    "ring-broken",
    "Ecos",
    { kind: "anomaly", value: 3 },
    { style: "broken" },
  ),
  c("orbit", "orbit-thin", message("m_9b1d346a7a"), start, { style: "thin" }),
  c(
    "orbit",
    "orbit-dotted",
    message("m_9747a793de"),
    fragments(60),
    { style: "dotted" },
    15,
  ),
  c(
    "orbit",
    "orbit-glow",
    message("m_d5bd1c35b6"),
    { kind: "infinite", value: 60 },
    { style: "glow" },
  ),
  c(
    "orbit",
    "orbit-crystal",
    message("m_45576faa58"),
    { kind: "campaign", value: 15 },
    { style: "crystal" },
  ),
];
export type Design = Record<Category, string> &
  Partial<Record<"biome" | "space" | "feature", string>>;
export type Planet = {
  name: string;
  design: Design;
};
export const defaultDesign = (): Design =>
  Object.fromEntries(
    Object.keys(categories).map((k) => [
      k,
      components.find((c) => c.category === k)!.id,
    ]),
  ) as Design;
export const starterIds = () =>
  components.filter((c) => c.condition.kind === "start").map((c) => c.id);
export const component = (id: string) => components.find((c) => c.id === id);
export type Universe = {
  inventory: string[];
  spent: number;
  planets: Planet[];
  selected: number;
  milestones: string[];
  pending: string[];
  introduced: boolean;
  stats: {
    lights: number;
    seconds: number;
    infiniteSeconds: number;
    dailyDates: number[];
    cleanRuns: number;
    created: number;
  };
  personalBest: number[];
  challenges: {
    code: string;
    best: number;
    combo: number;
  }[];
  anomalyTier: number;
  anomalyBest: number;
};
import type { MobileState } from "./mobile-state.ts";
export type Save = BaseSave & {
  universe: Universe;
  mobile: MobileState;
  presentation: Presentation;
};
export const freshUniverse = (): Universe => ({
  inventory: starterIds(),
  spent: 0,
  planets: [],
  selected: 0,
  milestones: [],
  pending: [],
  introduced: false,
  stats: {
    lights: 0,
    seconds: 0,
    infiniteSeconds: 0,
    dailyDates: [],
    cleanRuns: 0,
    created: 0,
  },
  personalBest: [0, 0, 0, 0, 0],
  challenges: [],
  anomalyTier: 0,
  anomalyBest: 0,
});
export function conditionMet(s: Save, q: Condition) {
  const u = s.universe;
  switch (q.kind) {
    case "start":
      return true;
    case "tutorial":
      return s.tutorial;
    case "fragments":
      return s.totalLights >= q.value;
    case "world":
      return s.campaign[q.value]?.cleared.every(Boolean) ?? false;
    case "campaign":
      return (
        s.campaign.flatMap((p) => p.cleared).filter(Boolean).length >= q.value
      );
    case "combo":
      return s.bestCombo >= q.value;
    case "infinite":
      return u.stats.infiniteSeconds >= q.value;
    case "daily":
      return u.stats.dailyDates.length >= q.value;
    case "clean":
      return u.stats.cleanRuns >= q.value;
    case "created":
      return u.stats.created >= q.value;
    case "anomaly":
      return u.anomalyTier >= q.value;
  }
}
export function requirement(q: Condition) {
  const worlds = [
    message("m_685d0edbbb"),
    message("m_ab9dd65ab2"),
    message("m_ab5899907d"),
    message("m_c9057be2f0"),
    message("m_45fc6c80b5"),
  ];
  switch (q.kind) {
    case "start":
      return message("m_ad3b7e1546");
    case "tutorial":
      return message("m_eb4aa7579e");
    case "fragments":
      return message("m_d737046bd4", { p0: q.value });
    case "world":
      return message("m_80d32a9721", { p0: worlds[q.value] });
    case "campaign":
      return message("m_dab4f63c18");
    case "combo":
      return message("m_f51109e9a5", { p0: q.value });
    case "infinite":
      return message("m_fa31b35a94", { p0: q.value });
    case "daily":
      return message("m_3ea5ac3778", { p0: q.value });
    case "clean":
      return message("m_0e7f0a1d32");
    case "created":
      return message("m_f32919429f");
    case "anomaly":
      return message("m_792fe21489", { p0: q.value });
  }
}
export const balance = (s: Save) =>
  Math.max(0, s.totalLights - s.universe.spent);
export const slotLimit = (s: Save) =>
  s.totalLights >= 300 ? 3 : s.totalLights >= 100 ? 2 : 1;
export function safeName(value: unknown) {
  return (
    (typeof value === "string" ? value : "")
      .normalize(message("m_65f7a7975a"))
      .replace(/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
      .trim()
      .slice(0, 24) || message("m_52d03be84a")
  );
}
export function normalizeDesign(value: unknown, inventory: string[]): Design {
  const result = defaultDesign();
  if (!value || typeof value !== "object") return result;
  for (const category of Object.keys(categories) as Category[]) {
    const id = (value as Partial<Design>)[category];
    if (
      typeof id === "string" &&
      inventory.includes(id) &&
      component(id)?.category === category
    )
      result[category] = id;
  }
  if (value && typeof value === "object") {
    for (const cat of ["biome", "space", "feature"] as const) {
      const id = (value as Partial<Design>)[cat];
      if (typeof id === "string") result[cat] = id;
    }
    normalizeExtras(result, inventory);
  }
  return result;
}
export function acquire(s: Save, id: string) {
  const c = component(id);
  if (
    !c ||
    s.universe.inventory.includes(id) ||
    !conditionMet(s, c.condition) ||
    balance(s) < c.cost
  )
    return false;
  s.universe.spent += c.cost;
  s.universe.inventory.push(id);
  s.universe.pending.push(id);
  return true;
}
export function savePlanet(
  s: Save,
  index: number,
  name: unknown,
  design: unknown,
) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= slotLimit(s) ||
    index > s.universe.planets.length
  )
    return false;
  const created = index === s.universe.planets.length;
  s.universe.planets[index] = {
    name: safeName(name),
    design: normalizeDesign(design, [
      ...s.universe.inventory,
      ...s.presentation.owned,
    ]),
  };
  s.universe.selected = index;
  if (created) s.universe.stats.created++;
  return true;
}
export const milestones: {
  id: string;
  name: string;
  condition: Condition;
  reward: number;
}[] = [
  {
    id: "training",
    name: message("m_d698c9b4ec"),
    condition: { kind: "tutorial", value: 1 },
    reward: 10,
  },
  {
    id: "menta",
    name: message("m_01ef9477ae"),
    condition: world(0),
    reward: 15,
  },
  {
    id: "campaign",
    name: message("m_816ee9287a"),
    condition: { kind: "campaign", value: 15 },
    reward: 50,
  },
  {
    id: "light",
    name: message("m_594c56ab95"),
    condition: fragments(100),
    reward: 10,
  },
  {
    id: "chain",
    name: message("m_12aa54e0e1"),
    condition: { kind: "combo", value: 10 },
    reward: 15,
  },
  {
    id: "infinite",
    name: message("m_88ebcc9543"),
    condition: { kind: "infinite", value: 90 },
    reward: 25,
  },
  {
    id: "daily",
    name: message("m_81169e9756"),
    condition: { kind: "daily", value: 3 },
    reward: 25,
  },
  {
    id: "clean",
    name: message("m_2b09b5ed15"),
    condition: { kind: "clean", value: 1 },
    reward: 15,
  },
  {
    id: "creator",
    name: message("m_1e1f209ad6"),
    condition: { kind: "created", value: 1 },
    reward: 10,
  },
  {
    id: "anomaly",
    name: message("m_309ca35a85"),
    condition: { kind: "anomaly", value: 3 },
    reward: 30,
  },
];
export function discover(s: Save, multiplier = 1) {
  const found: string[] = [];
  for (const m of milestones)
    if (!s.universe.milestones.includes(m.id) && conditionMet(s, m.condition)) {
      s.universe.milestones.push(m.id);
      s.totalLights += Math.floor(m.reward * multiplier);
      found.push(
        message("m_252decb6f6", {
          p0: m.name,
          p1: Math.floor(m.reward * multiplier),
        }),
      );
    }
  for (const c of components)
    if (
      !c.cost &&
      !s.universe.inventory.includes(c.id) &&
      conditionMet(s, c.condition)
    ) {
      acquire(s, c.id);
    }
  s.universe.pending = [...new Set(s.universe.pending)].slice(
    -components.length,
  );
  return found;
}
