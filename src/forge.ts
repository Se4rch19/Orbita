import type { Save as BaseSave } from "./storage.ts";
import type { Geometry } from "./config.ts";
export const categories = {
  shape: "Formas",
  surface: "Superficies",
  palette: "Paletas",
  atmosphere: "Atmósferas",
  satellite: "Satélites",
  ring: "Anillos",
  orbit: "Trazos orbitales",
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
  rarity: "Esencial" | "Singular" | "Cósmico";
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
      ? "Esencial"
      : condition.kind === "campaign" || condition.kind === "anomaly"
        ? "Cósmico"
        : "Singular",
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
  c("shape", "shape-circle", "Semilla redonda", start, { shape: shape(0, 0) }),
  c("shape", "shape-triangle", "Trébol suave", world(2), {
    shape: shape(3, 0.105),
  }),
  c(
    "shape",
    "shape-square",
    "Diamante blando",
    fragments(80),
    { shape: shape(4, 0.08) },
    20,
  ),
  c(
    "shape",
    "shape-pentagon",
    "Cinco horizontes",
    fragments(180),
    { shape: shape(5, 0.055) },
    30,
  ),
  c(
    "shape",
    "shape-hexagon",
    "Panal celeste",
    { kind: "campaign", value: 15 },
    { shape: shape(6, 0.04) },
  ),
  c(
    "shape",
    "shape-blob",
    "Pequeña marea",
    { kind: "tutorial", value: 1 },
    { shape: shape(2, 0.13) },
  ),
  c("surface", "surface-garden", "Jardín", start, { style: "garden" }),
  c(
    "surface",
    "surface-rock",
    "Roca suave",
    fragments(30),
    { style: "rock" },
    10,
  ),
  c("surface", "surface-ice", "Cristal de hielo", world(3), { style: "ice" }),
  c(
    "surface",
    "surface-ocean",
    "Océano",
    fragments(100),
    { style: "ocean" },
    20,
  ),
  c(
    "surface",
    "surface-volcanic",
    "Lava dormida",
    { kind: "clean", value: 1 },
    { style: "volcanic" },
  ),
  c("surface", "surface-cosmic", "Noche profunda", world(4), {
    style: "cosmic",
  }),
  c("palette", "palette-mint", "Menta", start, {
    colors: ["#83edce", "#259d91"],
  }),
  c("palette", "palette-peach", "Durazno", world(0), {
    colors: ["#ffc2a7", "#b86c70"],
  }),
  c("palette", "palette-lavender", "Lavanda", world(1), {
    colors: ["#c7b5ff", "#7762aa"],
  }),
  c("palette", "palette-ice", "Glaciar", world(2), {
    colors: ["#a7e8ff", "#408fae"],
  }),
  c("palette", "palette-eclipse", "Eclipse", world(3), {
    colors: ["#e1b6eb", "#79578b"],
  }),
  c(
    "palette",
    "palette-sun",
    "Amanecer",
    { kind: "daily", value: 3 },
    { colors: ["#f7db9c", "#a77b53"] },
  ),
  c("atmosphere", "atmosphere-none", "Cielo limpio", start, { style: "none" }),
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
    "Polvo estelar",
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
  c("satellite", "satellite-none", "A solas", start, {
    count: 0,
    style: "moon",
  }),
  c(
    "satellite",
    "satellite-moon",
    "Luna amiga",
    { kind: "created", value: 1 },
    { count: 1, style: "moon" },
  ),
  c(
    "satellite",
    "satellite-twin",
    "Lunas gemelas",
    fragments(220),
    { count: 2, style: "moon" },
    35,
  ),
  c(
    "satellite",
    "satellite-crystal",
    "Compañero cristal",
    { kind: "daily", value: 1 },
    { count: 1, style: "crystal" },
  ),
  c("ring", "ring-none", "Sin anillos", start, { style: "none" }),
  c(
    "ring",
    "ring-simple",
    "Cinta celeste",
    fragments(50),
    { style: "simple" },
    15,
  ),
  c(
    "ring",
    "ring-double",
    "Abrazo doble",
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
  c("orbit", "orbit-thin", "Trazo fino", start, { style: "thin" }),
  c(
    "orbit",
    "orbit-dotted",
    "Puntos de luz",
    fragments(60),
    { style: "dotted" },
    15,
  ),
  c(
    "orbit",
    "orbit-glow",
    "Trazo suave",
    { kind: "infinite", value: 60 },
    { style: "glow" },
  ),
  c(
    "orbit",
    "orbit-crystal",
    "Cristal tallado",
    { kind: "campaign", value: 15 },
    { style: "crystal" },
  ),
];
export type Design = Record<Category, string>;
export type Planet = { name: string; design: Design };
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
  challenges: { code: string; best: number; combo: number }[];
  anomalyTier: number;
  anomalyBest: number;
};
import type { MobileState } from "./mobile-state.ts";
export type Save = BaseSave & { universe: Universe; mobile: MobileState };
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
  const worlds = ["Menta", "Durazno", "Lavanda", "Glaciar", "Eclipse"];
  switch (q.kind) {
    case "start":
      return "Disponible desde el inicio";
    case "tutorial":
      return "Completa el entrenamiento";
    case "fragments":
      return `Reúne ${q.value} fragmentos en total`;
    case "world":
      return `Completa ${worlds[q.value]}`;
    case "campaign":
      return "Completa las 15 expediciones";
    case "combo":
      return `Encadena ${q.value} luces`;
    case "infinite":
      return `Resiste ${q.value} s en Infinito o Mi órbita`;
    case "daily":
      return `Completa ${q.value} días distintos`;
    case "clean":
      return "Supera una expedición sin impactos";
    case "created":
      return "Guarda tu primer planeta";
    case "anomaly":
      return `Supera ${q.value} anomalías`;
  }
}
export const balance = (s: Save) =>
  Math.max(0, s.totalLights - s.universe.spent);
export const slotLimit = (s: Save) =>
  s.totalLights >= 300 ? 3 : s.totalLights >= 100 ? 2 : 1;
export function safeName(value: unknown) {
  return (
    (typeof value === "string" ? value : "")
      .normalize("NFC")
      .replace(/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
      .trim()
      .slice(0, 24) || "Mi pequeño mundo"
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
    design: normalizeDesign(design, s.universe.inventory),
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
    name: "Primer contacto",
    condition: { kind: "tutorial", value: 1 },
    reward: 10,
  },
  { id: "menta", name: "Raíces", condition: world(0), reward: 15 },
  {
    id: "campaign",
    name: "Cartógrafo celeste",
    condition: { kind: "campaign", value: 15 },
    reward: 50,
  },
  {
    id: "light",
    name: "Un puñado de estrellas",
    condition: fragments(100),
    reward: 10,
  },
  {
    id: "chain",
    name: "En tu ritmo",
    condition: { kind: "combo", value: 10 },
    reward: 15,
  },
  {
    id: "infinite",
    name: "Más allá del minuto",
    condition: { kind: "infinite", value: 90 },
    reward: 25,
  },
  {
    id: "daily",
    name: "Tres amaneceres",
    condition: { kind: "daily", value: 3 },
    reward: 25,
  },
  {
    id: "clean",
    name: "Paso intacto",
    condition: { kind: "clean", value: 1 },
    reward: 15,
  },
  {
    id: "creator",
    name: "Mi pequeño universo",
    condition: { kind: "created", value: 1 },
    reward: 10,
  },
  {
    id: "anomaly",
    name: "Entre anomalías",
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
        `Hito: ${m.name} · +${Math.floor(m.reward * multiplier)} fragmentos`,
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
