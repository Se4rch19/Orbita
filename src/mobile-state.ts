export const ASSIST_FRAGMENT_MULTIPLIER = 0.5;
export type MobileDaily = {
  date: number;
  attempts: number;
  tier: number;
  best: number;
  assisted: boolean;
};
export type MobileState = {
  version: 1;
  controls: "radial" | "classic";
  assistance: boolean;
  music: boolean;
  effects: boolean;
  daily: MobileDaily[];
  journey: {
    score: number;
    seconds: number;
    worlds: number;
    destination: number;
    combo: number;
  };
  lastRunAssisted: boolean;
  assistedBest: number;
};
export const freshMobile = (sound = true): MobileState => ({
  version: 1,
  controls: "radial",
  assistance: false,
  music: sound,
  effects: sound,
  daily: [],
  journey: { score: 0, seconds: 0, worlds: 0, destination: 0, combo: 0 },
  lastRunAssisted: false,
  assistedBest: 0,
});
const num = (v: unknown, max = 1e9) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.floor(v)))
    : 0;
export function normalizeMobile(value: unknown, sound = true): MobileState {
  const d = freshMobile(sound);
  if (!value || typeof value !== "object") return d;
  const s = value as Partial<MobileState>;
  d.controls = s.controls === "classic" ? "classic" : "radial";
  for (const k of [
    "assistance",
    "music",
    "effects",
    "lastRunAssisted",
  ] as const)
    if (typeof s[k] === "boolean") d[k] = s[k]!;
  if (Array.isArray(s.daily))
    d.daily = s.daily
      .slice(0, 31)
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        date: num(r.date, 99991231),
        attempts: num(r.attempts),
        tier: num(r.tier, 3),
        best: num(r.best),
        assisted: r.assisted === true,
      }));
  if (s.journey && typeof s.journey === "object")
    for (const k of [
      "score",
      "seconds",
      "worlds",
      "destination",
      "combo",
    ] as const)
      d.journey[k] = num(s.journey[k]);
  d.assistedBest = num(s.assistedBest);
  return d;
}
