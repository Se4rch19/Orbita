import { component, type Design } from "./forge.ts";
export type Biome = "ocean" | "dunes" | "crystal" | "frozen" | "lava" | "dead";
export type PlanetVisualProfile = {
  seed: number;
  biome: Biome;
  colors: [string, string];
  atmosphere: string;
  clouds: boolean;
  moons: number;
  satellite: string;
  asteroids: boolean;
  trail: boolean;
  space: string;
  feature: string;
  activity: number;
  archetype?: import("./planet-renderer-2.ts").PlanetArchetype;
  material?: import("./planet-renderer-2.ts").MaterialFamily;
  rotationSpeed: number;
  rotationDirection: 1 | -1;
  cloudSpeed: number;
  lightDirection: [number, number];
  lightIntensity: number;
  damage: number;
  hostStar?: { color: string; x: number; y: number };
};
const biomes: Biome[] = ["ocean", "dunes", "crystal", "frozen", "dead"];
const palettes: [string, string][] = [
  ["#83edce", "#063c68"],
  ["#ffc28b", "#713d39"],
  ["#d5b5ff", "#382461"],
  ["#c5f5ff", "#296d8c"],
  ["#ba8cae", "#1a142d"],
];
/** Campaign profiles are curated; personal/anomaly scenes share bounded coherent rules. */
export function planetProfile(
  world: number,
  design: Design | null = null,
  seed = 41,
): PlanetVisualProfile {
  world = Number.isFinite(world)
    ? Math.max(0, Math.min(4, Math.floor(world)))
    : 0;
  let biome =
    biomes.includes(design?.biome?.slice(6) as Biome) ||
    design?.biome === "biome-lava"
      ? (design!.biome!.slice(6) as Biome)
      : biomes[world];
  if (design?.surface === "surface-ice") biome = "frozen";
  if (design?.surface === "surface-volcanic") biome = "lava";
  const atmosphere = design
    ? (component(design.atmosphere)?.visual.style ?? "none")
    : world === 3
      ? "aurora"
      : "glow";
  return {
    seed: Number.isFinite(seed) ? seed >>> 0 : 41,
    biome,
    colors: design
      ? (component(design.palette)?.visual.colors ?? palettes[world])
      : palettes[world],
    atmosphere,
    clouds:
      atmosphere !== "none" && ["ocean", "dunes", "frozen"].includes(biome),
    moons: design
      ? (component(design.satellite)?.visual.count ?? 0)
      : world === 1
        ? 2
        : 1,
    satellite: design
      ? (component(design.satellite)?.visual.style ?? "moon")
      : world >= 2
        ? "crystal"
        : "moon",
    asteroids: design ? design.ring === "ring-broken" : world > 0,
    trail: design
      ? design.orbit === "orbit-glow" || atmosphere === "stars"
      : true,
    space:
      design?.space?.slice(6) ??
      (world === 4 ? "void" : world === 2 ? "nebula" : "stars"),
    feature: design?.feature?.slice(8) ?? (world === 4 ? "fissure" : "none"),
    activity: [0.6, 1, 0.5, 0.4, 0.7][world],
    archetype:
      biome === "lava"
        ? "volcanic"
        : biome === "frozen"
          ? "glacial"
          : biome === "crystal"
            ? "crystalline"
            : biome === "dead"
              ? "fragmented"
              : "living",
    material:
      biome === "ocean"
        ? "ocean"
        : biome === "dunes"
          ? "dust"
          : biome === "frozen"
            ? "ice"
            : biome === "lava"
              ? "lava"
              : biome === "crystal"
                ? "crystal"
                : "rock",
    rotationSpeed: 0.045 + (world % 3) * 0.018,
    rotationDirection: world === 2 ? -1 : 1,
    cloudSpeed: 0.08 + (world % 2) * 0.035,
    lightDirection: world === 1 ? [-0.857, -0.514] : [-0.607, -0.795],
    lightIntensity: world === 4 ? 0.68 : 0.86,
    damage: world === 4 ? 0.78 : 0,
    hostStar:
      world === 1 || world === 4
        ? { color: world === 1 ? "#ffc878" : "#e87a72", x: -0.8, y: -0.7 }
        : undefined,
  };
}
