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
  };
}
