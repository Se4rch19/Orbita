export const GENERATION_VERSION = 2;
export function random(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(...parts: (string | number)[]) {
  let h = 2166136261;
  for (const c of parts.join(":")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function dailySeed(date = new Date()) {
  return (
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  );
}
