import type { Orbit, Geometry } from "./config.ts";
export const TAU = Math.PI * 2;
export const mod = (a: number, n = TAU) => ((a % n) + n) % n;
export function radiusAt(geometry: Geometry, radius: number, angle: number) {
  return (
    radius *
    (1 + geometry.deformation * Math.cos(geometry.lobes * angle + Math.PI / 2))
  );
}
export function pathPoint(orbit: Orbit, angle: number) {
  const r = radiusAt(orbit.geometry, orbit.radius, angle);
  return { x: 300 + Math.cos(angle) * r, y: 300 + Math.sin(angle) * r };
}
export function pathMetric(orbit: Orbit, angle: number) {
  const { deformation: d, lobes: k } = orbit.geometry;
  const q = 1 + d * Math.cos(k * angle + Math.PI / 2),
    derivative = -d * k * Math.sin(k * angle + Math.PI / 2);
  return Math.hypot(q, derivative);
}
export function lanePoint(orbits: Orbit[], lane: number, angle: number) {
  const lo = Math.max(0, Math.min(orbits.length - 1, Math.floor(lane))),
    hi = Math.min(orbits.length - 1, lo + 1),
    t = Math.max(0, Math.min(1, lane - lo)),
    a = pathPoint(orbits[lo], angle),
    b = pathPoint(orbits[hi], angle);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
export function crossed(before: number, after: number, point: number) {
  return after >= before
    ? point >= before && point < after
    : point <= before && point > after;
}
