export type Language = "system" | "es-MX" | "en-US";
export type Presentation = {
  version: 1;
  language: Language;
  tutorial: "new" | "complete" | "skipped" | "legacy";
  seen: string[];
  launches: number;
  owned: string[];
};
export const freshPresentation = (): Presentation => ({
  version: 1,
  language: "system",
  tutorial: "new",
  seen: [],
  launches: 0,
  owned: ["biome-ocean", "space-stars", "feature-none"],
});
export function normalizePresentation(
  raw: unknown,
  experienced = false,
): Presentation {
  const d = freshPresentation();
  if (experienced) d.tutorial = "legacy";
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<Presentation>;
  if (r.language === "es-MX" || r.language === "en-US") d.language = r.language;
  if (["new", "complete", "skipped", "legacy"].includes(r.tutorial!))
    d.tutorial = r.tutorial!;
  d.launches =
    typeof r.launches === "number" && Number.isFinite(r.launches)
      ? Math.max(0, Math.min(1e6, Math.floor(r.launches)))
      : 0;
  if (Array.isArray(r.seen))
    d.seen = [
      ...new Set(
        r.seen.filter(
          (x) =>
            typeof x === "string" &&
            /^(world-[0-4]|forge|daily|infinite|codes|anomalies|personal)$/.test(
              x,
            ),
        ),
      ),
    ];
  if (Array.isArray(r.owned))
    d.owned = [
      ...new Set([
        ...d.owned,
        ...r.owned.filter(
          (x) =>
            typeof x === "string" && /^(biome|space|feature)-[a-z]+$/.test(x),
        ),
      ]),
    ].slice(0, 32);
  return d;
}
export function markSeen(state: Presentation, key: string) {
  if (state.seen.includes(key)) return false;
  state.seen.push(key);
  return true;
}
export const GUIDE_NAME = "Luma";
export const introDuration = (state: Presentation, motion: boolean) =>
  !motion ? 0 : state.launches ? 450 : 1400;
