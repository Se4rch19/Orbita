import type { Design } from "./forge.ts";
import { component } from "./forge.ts";
import { worlds } from "./config.ts";
import { radiusAt } from "./geometry.ts";
export const VISUAL_LIMITS = {
  stars: 62,
  particles: 80,
  atmosphereLayers: 3,
  surfaceEffects: 2,
  satellites: 3,
  entities: 64,
};
export function drawWorldLife(
  c: CanvasRenderingContext2D,
  world: number,
  design: Design | null,
  time: number,
  small: boolean,
) {
  const r = small ? 77 : 97,
    w = worlds[world],
    shape = design ? component(design.shape)!.visual.shape! : w.shape;
  const biome =
    design?.biome === "biome-ocean" && design.surface === "surface-ice"
      ? "frozen"
      : (design?.biome?.slice(6) ??
        ["ocean", "dunes", "crystal", "frozen", "dead"][world]);
  c.save();
  c.translate(300, 300);
  c.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2,
      rr = radiusAt(shape, r, a);
    if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.clip();
  c.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) {
    const y = -r + 25 * i,
      drift = Math.sin(time * 0.2 + i) * 5;
    c.strokeStyle =
      biome === "lava"
        ? "#ffc68790"
        : biome === "frozen"
          ? "#d0ffff80"
          : biome === "dead"
            ? "#17112e99"
            : w.color + "70";
    c.beginPath();
    if (biome === "crystal" || biome === "frozen") {
      c.moveTo(-r + i * 26, -r);
      c.lineTo(Math.sin(i + time * 0.03) * 25, drift);
      c.lineTo(r - i * 17, r);
    } else {
      c.moveTo(-r, y + drift);
      c.bezierCurveTo(-25, y - 13 - drift, 35, y + 13 + drift, r, y - drift);
    }
    c.stroke();
  }
  if (design?.feature === "feature-islands" || biome === "ocean") {
    c.fillStyle = "#b0e5ac35";
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(
        Math.cos(i * 2.4) * r * 0.55,
        Math.sin(i * 2.4) * r * 0.6,
        12,
        5,
        i,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
  }
  if (design?.feature === "feature-craters" || biome === "dead") {
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.arc(
        Math.cos(i * 2.4) * r * 0.62,
        Math.sin(i * 2.4) * r * 0.6,
        5 + (i % 3) * 3,
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#06111d60";
      c.fill();
      c.strokeStyle = "#9e84bd30";
      c.stroke();
    }
  }
  if (design?.feature === "feature-fissure" || biome === "lava") {
    c.globalAlpha = 0.3 + 0.1 * Math.sin(time * 0.7);
    c.strokeStyle = "#ffd4a0";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-r * 0.7, -r);
    c.lineTo(-12, -14);
    c.lineTo(18, 10);
    c.lineTo(7, r);
    c.stroke();
    c.globalAlpha = 1;
  }
  if (design?.feature === "feature-storm") {
    c.strokeStyle = "#d7eefb75";
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.ellipse(
        24,
        -19,
        16 + i * 4,
        6 + i * 3,
        time * 0.09 + i * 0.2,
        0,
        Math.PI * 1.7,
      );
      c.stroke();
    }
  }
  const shade = c.createLinearGradient(-r, -r, r, r);
  shade.addColorStop(0, "#ffffff05");
  shade.addColorStop(0.6, "#06111c00");
  shade.addColorStop(1, world === 4 ? "#00010be0" : "#00132690");
  c.fillStyle = shade;
  c.fillRect(-r, -r, r * 2, r * 2);
  c.restore();
  if (world === 3 || design?.space === "space-aurora") {
    c.save();
    c.strokeStyle = "#acecdf24";
    c.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.ellipse(
        300,
        300,
        r + 22 + i * 8,
        r * 0.5,
        -0.4 + Math.sin(time * 0.15) * 0.1,
        Math.PI,
        Math.PI * 2,
      );
      c.stroke();
    }
    c.restore();
  }
}
