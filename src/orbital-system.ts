import type { Design } from "./forge.ts";
import type { PlanetVisualProfile } from "./planet-profile.ts";
import { budgets, type QualityLevel } from "./quality.ts";
export type OrbitalSide = "back" | "front";
/** Depth comes from the orbital plane, independent of its on-screen tilt. */
export const orbitalSide = (angle: number): OrbitalSide =>
  Math.sin(angle) < 0 ? "back" : "front";
export function drawOrbitalSystem(
  c: CanvasRenderingContext2D,
  p: PlanetVisualProfile,
  design: Design | null,
  time: number,
  r: number,
  quality: QualityLevel,
  side: OrbitalSide,
) {
  const b = budgets[quality],
    start = side === "front" ? 0 : Math.PI,
    end = start + Math.PI;
  c.save();
  if (design && design.ring !== "ring-none") {
    c.strokeStyle = p.colors[0] + "aa";
    c.lineWidth = 2;
    for (let i = 0; i < (design.ring === "ring-double" ? 2 : 1); i++) {
      c.beginPath();
      c.ellipse(0, 0, r + 20 + i * 8, r * 0.4 + i * 5, -0.4, start, end);
      c.stroke();
    }
  }
  if (p.asteroids) {
    c.save();
    c.rotate(-0.4);
    for (let i = 0; i < b.asteroids; i++) {
      const a = i * 2.399 + time * 0.075,
        rr = r + 20 + (i % 4) * 4;
      if (orbitalSide(a) !== side) continue;
      c.save();
      c.translate(Math.cos(a) * rr, Math.sin(a) * rr * 0.45);
      c.rotate(a);
      c.fillStyle = i % 2 ? p.colors[0] + "b0" : "#8894aa";
      c.fillRect(-2, -2, 3 + (i % 3), 3 + (i % 2));
      c.restore();
    }
    c.restore();
  }
  for (let i = 0; i < Math.min(p.moons, b.moons); i++) {
    const a = time * 0.17 + i * 2.9 + 0.7;
    if (orbitalSide(a) !== side) continue;
    const x = Math.cos(a) * (r + 43),
      y = Math.sin(a) * (r + 27) * 0.72;
    const moon = c.createRadialGradient(x - 3, y - 3, 1, x, y, 10);
    moon.addColorStop(0, "#e5eff1");
    moon.addColorStop(1, p.colors[1]);
    c.fillStyle = moon;
    c.beginPath();
    if (p.satellite === "crystal") {
      c.moveTo(x, y - 11);
      c.lineTo(x + 7, y);
      c.lineTo(x, y + 11);
      c.lineTo(x - 7, y);
      c.closePath();
    } else c.arc(x, y, 8, 0, Math.PI * 2);
    c.fill();
  }
  if (p.trail) {
    // Classify each sample, not just the head: the tail can straddle the limb.
    for (let i = 0; i < 24; i++) {
      const a = time * 0.28 - i * 0.018;
      if (orbitalSide(a) !== side) continue;
      c.fillStyle = p.colors[0];
      c.globalAlpha = (1 - i / 24) * 0.85;
      c.beginPath();
      c.arc(
        Math.cos(a) * (r + 33),
        Math.sin(a) * (r + 33) * 0.62,
        i ? 1.8 : 3.5,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
  }
  c.restore();
}
