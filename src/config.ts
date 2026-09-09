import { dailySeed, GENERATION_VERSION, hashSeed, random } from "./random.ts";
export type Mode = "voyage" | "zen" | "daily" | "infinite" | "tutorial";
export type Geometry = {
  kind: "circle" | "rounded-triangle" | "petal";
  deformation: number;
  lobes: number;
};
export type Orbit = {
  lane: number;
  radius: number;
  geometry: Geometry;
  direction: 1 | -1;
  baseSpeed: number;
  speedMultiplier: number;
  active: boolean;
  color: string;
  hazardState: "clear" | "fractured";
};
export type World = {
  name: string;
  subtitle: string;
  mechanic: string;
  cost: number;
  legacyCost: number;
  color: string;
  dark: string;
  shape: Geometry;
  atmosphere: number;
  satellites: number;
  surface: string;
  speeds: number[];
  directions: (1 | -1)[];
  structural: boolean;
  moving: boolean;
  directionFromLevel?: number;
  reversalByLevel?: number[];
};
const circle: Geometry = { kind: "circle", deformation: 0, lobes: 0 };
export const worlds: World[] = [
  {
    name: "Menta",
    subtitle: "Donde todo empieza",
    mechanic: "Dos órbitas. Aprende a encontrar el paso libre.",
    cost: 0,
    legacyCost: 0,
    color: "#83edce",
    dark: "#259d91",
    shape: circle,
    atmosphere: 0.12,
    satellites: 0,
    surface: "garden",
    speeds: [1.04, 1.04],
    directions: [1, 1],
    structural: false,
    moving: false,
  },
  {
    name: "Durazno",
    subtitle: "Un camino más",
    mechanic: "Tres órbitas: la interior avanza más rápido.",
    cost: 70,
    legacyCost: 80,
    color: "#ffc28d",
    dark: "#d87876",
    shape: circle,
    atmosphere: 0.1,
    satellites: 1,
    surface: "dunes",
    speeds: [1.14, 1, 0.88],
    directions: [1, 1, 1],
    structural: false,
    moving: true,
  },
  {
    name: "Lavanda",
    subtitle: "La curva inesperada",
    mechanic: "Órbitas triangulares suaves que cambian tu trayectoria.",
    cost: 170,
    legacyCost: 200,
    color: "#c1afff",
    dark: "#7365c8",
    shape: { kind: "rounded-triangle", deformation: 0.105, lobes: 3 },
    atmosphere: 0.14,
    satellites: 0,
    surface: "velvet",
    speeds: [1.02, 1.08],
    directions: [1, 1],
    structural: false,
    moving: false,
  },
  {
    name: "Glaciar",
    subtitle: "Lee el camino",
    mechanic: "Los tramos rotos te obligan a buscar otra órbita.",
    cost: 300,
    legacyCost: 400,
    color: "#a1e5ff",
    dark: "#4998bb",
    shape: circle,
    atmosphere: 0.1,
    satellites: 2,
    surface: "ice",
    speeds: [1.06, 1],
    directions: [1, 1],
    structural: true,
    moving: false,
  },
  {
    name: "Eclipse",
    directionFromLevel: 1,
    reversalByLevel: [0, 0, 20],
    subtitle: "Todo entra en juego",
    mechanic: "Tres caminos curvos, contragiros y fracturas anunciadas.",
    cost: 460,
    legacyCost: 700,
    color: "#ffe09a",
    dark: "#bf874c",
    shape: { kind: "petal", deformation: 0.075, lobes: 4 },
    atmosphere: 0.14,
    satellites: 1,
    surface: "eclipse",
    speeds: [1.08, 0.96, 1.02],
    directions: [1, -1, 1],
    structural: true,
    moving: true,
  },
];
export const LEVELS_PER_WORLD = 3;
export const levelNames = [
  ["Primer pulso", "Enlaza la luz", "El ritmo de Menta"],
  ["Tercer camino", "Cruces de luz", "El paso interior"],
  ["Curvas suaves", "Entre vértices", "El triángulo vivo"],
  ["Primera fractura", "Puentes de hielo", "La ruta intacta"],
  ["Encuentro de mundos", "A contracorriente", "El último giro"],
];
export type SessionConfig = {
  mode: Mode;
  world: number;
  level: number;
  duration: number;
  targetLights: number;
  orbits: Orbit[];
  reversalEvery: number;
  structural: boolean;
  moving: boolean;
  baseIntensity: number;
  modifier: string;
  dailyDate: number;
  ruleSeed: number;
  rewardRate: number;
};
export type SessionOptions = {
  world?: number;
  level?: number;
  zenDuration?: 60 | 180 | 0;
  date?: number;
};
export function dailyChallenge(date = dailySeed()) {
  const ruleSeed = hashSeed("orbita", GENERATION_VERSION, date),
    rng = random(ruleSeed);
  const world = Math.floor(rng() * worlds.length),
    level = Math.floor(rng() * 3),
    duration = [45, 60, 75][Math.floor(rng() * 3)];
  const modifier = ["Pulso veloz", "Luz en cadena", "Paso preciso"][
    Math.floor(rng() * 3)
  ];
  return {
    date,
    ruleSeed,
    world,
    level,
    duration,
    modifier,
    targetLights: Math.max(
      8,
      Math.round(
        ((modifier === "Luz en cadena" ? 22 : 16) * duration) /
          60 /
          (1 +
            (worlds[world].speeds.length - 2) * 0.16 +
            (worlds[world].structural ? 0.16 : 0) +
            (worlds[world].shape.deformation ? 0.08 : 0)),
      ),
    ),
  };
}
export function sessionConfig(
  mode: Mode,
  options: SessionOptions = {},
): SessionConfig {
  const daily = dailyChallenge(options.date);
  const world =
    mode === "tutorial"
      ? 0
      : mode === "daily"
        ? daily.world
        : Math.max(
            0,
            Math.min(worlds.length - 1, Math.floor(options.world ?? 0)),
          );
  const level =
    mode === "tutorial"
      ? 0
      : mode === "daily"
        ? daily.level
        : Math.max(0, Math.min(2, Math.floor(options.level ?? 0)));
  const w = worlds[world];
  const directions = w.directions.map((d) =>
    level < (w.directionFromLevel ?? 0) ? 1 : d,
  );
  const orbits = w.speeds.map((speed, lane): Orbit => ({
    lane,
    radius: w.speeds.length === 3 ? 145 + lane * 51 : 174 + lane * 63,
    geometry: { ...w.shape },
    direction: mode === "zen" ? 1 : directions[lane],
    baseSpeed: mode === "zen" ? 0.68 : mode === "tutorial" ? 0.85 : speed,
    speedMultiplier: 1,
    active: true,
    color: w.color,
    hazardState: w.structural ? "fractured" : "clear",
  }));
  return {
    mode,
    world,
    level,
    orbits,
    duration:
      mode === "tutorial"
        ? 30
        : mode === "infinite"
          ? Infinity
          : mode === "zen"
            ? options.zenDuration === 0
              ? Infinity
              : (options.zenDuration ?? 60)
            : mode === "daily"
              ? daily.duration
              : [45, 55, 60][level],
    targetLights:
      mode === "voyage"
        ? [12, 16, 20][level]
        : mode === "daily"
          ? daily.targetLights
          : 0,
    reversalEvery: mode !== "zen" ? (w.reversalByLevel?.[level] ?? 0) : 0,
    structural: w.structural,
    moving: w.moving && level > 0 && mode !== "zen",
    baseIntensity:
      mode === "zen" || mode === "tutorial" ? 0 : world * 0.025 + level * 0.07,
    modifier: mode === "daily" ? daily.modifier : "",
    dailyDate: mode === "daily" ? daily.date : 0,
    ruleSeed: mode === "daily" ? daily.ruleSeed : 0,
    rewardRate: mode === "tutorial" ? 0 : mode === "zen" ? 0.25 : 1,
  };
}
export function difficulty(config: SessionConfig, time: number) {
  const calm = config.mode === "zen" || config.mode === "tutorial";
  const phase = calm
    ? 0
    : config.mode === "infinite"
      ? 1 - Math.exp(-time / 105)
      : Math.min(1, time / config.duration);
  const smooth = phase * phase * (3 - 2 * phase);
  const speedMultiplier = calm
    ? 1
    : 1 +
      config.baseIntensity +
      smooth * (config.mode === "infinite" ? 0.95 : 0.65) +
      (config.modifier === "Pulso veloz" ? 0.12 : 0);
  const complexity =
    (config.orbits.length - 2) * 1.5 +
    (config.orbits[0].geometry.deformation ? 1.8 : 0) +
    (config.structural ? 1.7 : 0) +
    (config.moving ? 1.2 : 0) +
    (config.orbits.some((o) => o.direction < 0) ? 1.4 : 0);
  const hazardDensity =
    config.mode === "tutorial"
      ? 0
      : config.mode === "zen"
        ? 0.09
        : Math.max(
            0.12,
            (0.26 + smooth * 0.18) /
              (1 + complexity * 0.19 + (speedMultiplier - 1) * 0.7),
          );
  const maxSpeed = Math.min(
    2.4,
    (Math.max(...config.orbits.map((o) => o.baseSpeed * o.speedMultiplier)) *
      speedMultiplier) /
      (1 - config.orbits[0].geometry.deformation),
  );
  return {
    phase,
    speedMultiplier,
    complexity,
    hazardDensity,
    maxSpeed,
    minReaction: 0.78,
    spacing: Math.max(
      0.73,
      maxSpeed * 0.78 + (config.orbits.length - 2) * 0.12,
    ),
    patternTier: calm ? 0 : Math.min(2, config.level + (time > 75 ? 1 : 0)),
    budget: 8 + smooth * 4,
  };
}
