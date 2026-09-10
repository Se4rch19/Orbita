import { t as message } from "./i18n.ts";
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
    name: message("m_685d0edbbb"),
    subtitle: message("m_760c96924c"),
    mechanic: message("m_646d6e652f"),
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
    name: message("m_ab9dd65ab2"),
    subtitle: message("m_57b55727f4"),
    mechanic: message("m_c962829aba"),
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
    name: message("m_ab5899907d"),
    subtitle: message("m_ddd4327764"),
    mechanic: message("m_a31b404e74"),
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
    name: message("m_c9057be2f0"),
    subtitle: message("m_89fcb09467"),
    mechanic: message("m_ab47f85eb2"),
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
    name: message("m_45fc6c80b5"),
    directionFromLevel: 1,
    reversalByLevel: [0, 0, 20],
    subtitle: message("m_bdd42b7603"),
    mechanic: message("m_6a9d50bb9c"),
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
  [message("m_0d80363240"), message("m_f3eafcb6d8"), message("m_4ceda6d581")],
  [message("m_905063fac2"), message("m_ad9071b371"), message("m_41661cb76e")],
  [message("m_275579c3b9"), message("m_154ee2881c"), message("m_2171afef81")],
  [message("m_e932daff5b"), message("m_939288a137"), message("m_c1889e3727")],
  [message("m_34d3a0da1d"), message("m_d43a9559e6"), message("m_467fb7691b")],
];
export type SessionConfig = {
  stream?: boolean;
  mobile?: boolean;
  assistance?: boolean;
  journey?: boolean;
  dailyTiers?: number[];
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
  stream?: boolean;
  mobile?: boolean;
  assistance?: boolean;
  journey?: boolean;
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
  const modifier = [
    message("m_6e3482b660"),
    message("m_cbecce0fe9"),
    message("m_89cc6c0e73"),
  ][Math.floor(rng() * 3)];
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
        ((modifier === message("m_cbecce0fe9") ? 22 : 16) * duration) /
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
  if (options.mobile) return mobileConfig(mode, options);
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
      (config.mobile ? smooth * 0.22 : 0) +
      smooth * (config.mode === "infinite" ? 0.95 : 0.65) +
      (config.modifier === message("m_6e3482b660") ? 0.12 : 0);
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
    config.mobile ? 2.8 : 2.4,
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
    minReaction:
      config.mobile && !calm
        ? config.level === 0 && config.world === 0
          ? 0.72
          : 0.56
        : 0.78,
    spacing: Math.max(
      0.73,
      maxSpeed *
        (config.mobile && !calm
          ? config.level === 0 && config.world === 0
            ? 0.72
            : 0.56
          : 0.78) +
        (config.orbits.length - 2) * 0.12,
    ),
    patternTier: calm ? 0 : Math.min(2, config.level + (time > 75 ? 1 : 0)),
    budget: 8 + smooth * 4,
  };
}
export const MOBILE_RULES = 3;
export function mobileConfig(
  mode: Mode,
  options: SessionOptions = {},
): SessionConfig {
  const daily = mode === "daily" ? dailyMobile(options.date) : null;
  const c = sessionConfig(daily ? "voyage" : mode, {
    ...options,
    mobile: false,
    ...(daily ? { world: daily.world, level: daily.level } : {}),
  });
  c.mode = mode;
  c.mobile = true;
  c.stream = options.stream === true;
  c.assistance = options.assistance === true;
  c.journey = options.journey === true && mode === "infinite";
  if (c.orbits.length > 3) throw new Error(message("m_023e245a2f"));
  if (mode !== "zen" && mode !== "tutorial")
    c.baseIntensity += c.world * 0.02 + c.level * 0.085;
  if (daily) {
    c.duration = daily.duration;
    c.dailyDate = daily.date;
    c.dailyTiers = daily.tiers;
    c.targetLights = daily.tiers[0];
    c.ruleSeed = daily.ruleSeed;
    c.modifier = daily.modifier;
  }
  return c;
}
export function dailyMobile(date = dailySeed()) {
  const ruleSeed = hashSeed("orbita-daily", MOBILE_RULES, date),
    rng = random(ruleSeed),
    world = Math.floor(rng() * 5),
    level = 1 + Math.floor(rng() * 2),
    duration = [45, 60, 75][Math.floor(rng() * 3)],
    modifier = [
      message("m_6e3482b660"),
      message("m_cbecce0fe9"),
      message("m_89cc6c0e73"),
    ][Math.floor(rng() * 3)];
  const c = mobileConfig("voyage", { world, level });
  c.duration = duration;
  c.modifier = modifier;
  const peak = difficulty(c, duration),
    spacing =
      Math.max(peak.spacing, peak.maxSpeed * peak.minReaction) +
      (c.structural ? 0.35 : 0) +
      0.1;
  const meanBase =
    c.orbits.reduce((a, o) => a + o.baseSpeed, 0) / c.orbits.length;
  const averageSpeed = Math.min(
    2.8,
    meanBase *
      (1 +
        c.baseIntensity +
        0.435 +
        (modifier === message("m_6e3482b660") ? 0.12 : 0)),
  );
  const expected = Math.max(
    12,
    Math.floor(
      ((duration * averageSpeed) / spacing - 2) *
        (c.orbits.some((o) => o.direction < 0) ? 0.45 : 1),
    ),
  );
  const tiers = [0.55, 0.73, 0.9].map((f) =>
    Math.max(6, Math.floor(expected * f)),
  );
  return {
    date,
    ruleSeed,
    world,
    level,
    duration,
    modifier,
    expected,
    tiers,
    targetLights: tiers[0],
  };
}
export function journeyDestination(index: number) {
  return index < 5
    ? { world: index, level: Math.min(2, Math.floor(index / 2)) }
    : { world: hashSeed("anomaly-world", index - 5) % 5, level: 2 };
}
