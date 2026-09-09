import { Game } from "./engine.ts";
import { GENERATION_VERSION, hashSeed } from "./random.ts";
export type Challenge = { seed: number; world: number; level: number };
export function checksum(bytes: number[]) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++)
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc;
}
export function encodeChallenge(q: Challenge, rules = GENERATION_VERSION) {
  if (
    !Number.isInteger(q.seed) ||
    q.seed < 0 ||
    q.seed > 0xffffffff ||
    !Number.isInteger(q.world) ||
    q.world < 0 ||
    q.world > 4 ||
    !Number.isInteger(q.level) ||
    q.level < 0 ||
    q.level > 2
  )
    throw new Error("Parámetros de reto inválidos");
  const b = [
    rules === 3 ? 4 : 3,
    rules,
    q.world,
    q.level,
    (q.seed >>> 24) & 255,
    (q.seed >>> 16) & 255,
    (q.seed >>> 8) & 255,
    q.seed & 255,
  ];
  const crc = checksum(b);
  b.push(crc >>> 8, crc & 255);
  return (
    "ORB-" +
    b
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
      .match(/.{4}/g)!
      .join("-")
  );
}
export function decodeChallenge(value: string): Challenge {
  if (typeof value !== "string" || value.length > 80)
    throw new Error("El código es demasiado largo.");
  const text = value.trim().toUpperCase();
  if (!/^ORB-(?:[0-9A-F]{4}-){4}[0-9A-F]{4}$/.test(text))
    throw new Error("Usa el código completo ORB con sus cinco grupos.");
  const b = text
    .slice(4)
    .replaceAll("-", "")
    .match(/../g)!
    .map((x) => parseInt(x, 16));
  if (checksum(b.slice(0, 8)) !== ((b[8] << 8) | b[9]))
    throw new Error(
      "El código tiene un error de copia. Comprueba sus caracteres.",
    );
  if (!(
    (b[0] === 3 && b[1] === GENERATION_VERSION) ||
    (b[0] === 4 && b[1] === 3)
  ))
    throw new Error("Este código requiere otra versión compatible de Órbita.");
  const q = {
    world: b[2],
    level: b[3],
    seed: ((b[4] << 24) | (b[5] << 16) | (b[6] << 8) | b[7]) >>> 0,
  };
  encodeChallenge(q);
  return q;
}
export const challengeGame = (code: string) => {
  const q = decodeChallenge(code);
  return new Game("voyage", q.seed, {
    world: q.world,
    level: q.level,
    mobile: code.trim().toUpperCase().startsWith("ORB-0403"),
  });
};
export const encodeMobileChallenge = (q: Challenge) => encodeChallenge(q, 3);
export function canonicalChallenge(code: string) {
  decodeChallenge(code);
  return code.trim().toUpperCase();
}
export function anomaly(tier: number, attemptSeed: number) {
  if (!Number.isInteger(tier) || tier < 0 || tier > 1e6)
    throw new Error("Anomalía inválida");
  return {
    world: hashSeed("anomaly-world", tier) % 5,
    level: Math.min(2, Math.floor(tier / 3)),
    seed: hashSeed("anomaly", 3, tier, attemptSeed),
  };
}
export function resultText(code: string, g: Game) {
  return `ÓRBITA · RETO SIN CONEXIÓN\n${code}\nPuntos: ${g.score}\nMejor cadena: ${g.bestCombo} luces · ×${1 + Math.min(3, Math.floor(g.bestCombo / 5))}\n${g.outcome === "cleared" ? "Completado" : "Intento terminado"} · ${Math.floor(g.time)} s\nAbre Códigos en Órbita 0.3 e introduce el reto.`;
}
