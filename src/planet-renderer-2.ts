import type { Biome, PlanetVisualProfile } from "./planet-profile.ts";

export type PlanetArchetype =
  | "living"
  | "volcanic"
  | "glacial"
  | "crystalline"
  | "dead"
  | "fragmented"
  | "artificial"
  | "gas"
  | "hybrid";

export type MaterialFamily =
  "rock" | "ocean" | "ice" | "lava" | "crystal" | "dust" | "metallic" | "gas";

export type DirectionalLight = {
  x: number;
  y: number;
  intensity: number;
};

export const materialForBiome = (biome: Biome): MaterialFamily =>
  (
    ({
      ocean: "ocean",
      dunes: "dust",
      crystal: "crystal",
      frozen: "ice",
      lava: "lava",
      dead: "rock",
    }) as Record<Biome, MaterialFamily>
  )[biome];

export const archetypeForProfile = (
  profile: PlanetVisualProfile,
): PlanetArchetype => {
  if (profile.archetype) return profile.archetype;
  if (profile.damage > 0.6 || profile.biome === "dead") return "dead";
  if (profile.biome === "lava") return "volcanic";
  if (profile.biome === "frozen") return "glacial";
  if (profile.biome === "crystal") return "crystalline";
  return "living";
};

export function directionalLight(
  profile: PlanetVisualProfile,
): DirectionalLight {
  const x = profile.lightDirection?.[0] ?? -0.55;
  const y = profile.lightDirection?.[1] ?? -0.72;
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length,
    intensity: Math.max(0.35, Math.min(1, profile.lightIntensity ?? 0.82)),
  };
}

export function materialProfile(profile: PlanetVisualProfile) {
  const material = (profile.material ??
    materialForBiome(profile.biome)) as MaterialFamily;
  return {
    material,
    roughness:
      material === "ocean"
        ? 0.32
        : material === "metallic"
          ? 0.2
          : material === "ice"
            ? 0.45
            : 0.78,
    specular:
      material === "ocean" || material === "ice" || material === "metallic"
        ? 0.7
        : 0.18,
    emissive: material === "lava" ? 0.82 : material === "crystal" ? 0.3 : 0.05,
    textureScale: material === "crystal" ? 0.7 : material === "dust" ? 1.35 : 1,
  } as const;
}

export function validateRendererProfile(profile: PlanetVisualProfile) {
  return (
    Number.isFinite(profile.seed) &&
    Number.isFinite(profile.rotationSpeed) &&
    Number.isFinite(profile.cloudSpeed) &&
    profile.rotationSpeed >= 0 &&
    profile.rotationSpeed <= 0.8 &&
    profile.cloudSpeed >= 0 &&
    profile.cloudSpeed <= 1.2 &&
    profile.damage >= 0 &&
    profile.damage <= 1
  );
}
