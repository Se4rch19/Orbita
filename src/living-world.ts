import type { Design } from "./forge.ts";
import { component } from "./forge.ts";
import { worlds } from "./config.ts";
import { radiusAt } from "./geometry.ts";
import { planetProfile } from "./planet-profile.ts";
import { budgets, type QualityLevel } from "./quality.ts";
import { drawOrbitalSystem } from "./orbital-system.ts";
import { directionalLight, materialProfile } from "./planet-renderer-2.ts";
const TAU = Math.PI * 2;
export function drawLivingWorld(
  c: CanvasRenderingContext2D,
  world: number,
  design: Design | null,
  time: number,
  small: boolean,
  quality: QualityLevel = "medium",
  seed = 41,
) {
  const p = planetProfile(world, design, seed),
    b = budgets[quality],
    r = small ? 77 : 97;
  const shape = design
    ? component(design.shape)!.visual.shape!
    : worlds[world].shape;
  const variation = ((p.seed ^ 41) % 997) / 997;
  // Longitude advances while the stellar light stays fixed: this is the
  // rotation illusion, rather than spinning a flat coin.
  const phase =
    time * p.rotationSpeed * p.rotationDirection * (p.activity > 0 ? 1 : 0) +
    variation * TAU;
  const light = directionalLight(p),
    material = materialProfile(p);
  c.save();
  c.translate(300, 300);
  drawOrbitalSystem(c, p, design, time, r, quality, "back");
  if (p.atmosphere !== "none") {
    const halo = c.createRadialGradient(-12, -14, r * 0.8, 0, 0, r + 24);
    halo.addColorStop(0, p.colors[0] + "00");
    halo.addColorStop(0.45, p.colors[0] + "32");
    halo.addColorStop(1, p.colors[0] + "00");
    c.fillStyle = halo;
    c.beginPath();
    c.arc(0, 0, r + 24, 0, TAU);
    c.fill();
  }
  c.save();
  c.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * TAU,
      rr = radiusAt(shape, r, a);
    if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.clip();
  const base = c.createRadialGradient(
    light.x * r * 0.95,
    light.y * r * 0.95,
    2,
    8,
    10,
    r * 1.55,
  );
  base.addColorStop(0, p.colors[0]);
  base.addColorStop(0.6, p.colors[1]);
  base.addColorStop(1, "#030917");
  c.fillStyle = base;
  c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  // Fictional landmasses projected onto a sphere; no geographic bitmap.
  for (let i = 0; i < 16; i++) {
    const longitude = i * 2.399 + phase,
      depth = Math.cos(longitude);
    if (depth < -0.1) continue;
    const y = Math.sin(i * 7.19 + variation) * r * 0.8,
      x = Math.sin(longitude) * Math.sqrt(r * r - y * y);
    c.save();
    c.translate(x, y);
    c.scale(Math.max(0.15, depth), 1);
    c.fillStyle =
      p.biome === "ocean"
        ? ["#60d7ac", "#a3e1ad", "#3fae9a"][i % 3]
        : p.colors[0] + "a0";
    if (material.material === "metallic") c.fillStyle = "#a8becb";
    c.strokeStyle = p.colors[0] + "aa";
    c.lineWidth = 1.2;
    if (p.biome === "crystal") {
      c.beginPath();
      c.moveTo(0, -24);
      c.lineTo(17, 3);
      c.lineTo(0, 16);
      c.lineTo(-12, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = "#f2dbff";
      c.beginPath();
      c.moveTo(0, -24);
      c.lineTo(0, 16);
      c.stroke();
    } else if (
      p.biome === "dead" ||
      p.feature === "craters" ||
      design?.surface === "surface-rock"
    ) {
      const cr = 6 + (i % 5) * 2;
      c.fillStyle = "#050717b0";
      c.beginPath();
      c.ellipse(0, 0, cr, cr * 0.82, 0, 0, TAU);
      c.fill();
      c.strokeStyle = p.colors[0] + "bb";
      c.beginPath();
      c.ellipse(-1, -1, cr, cr * 0.82, 0, Math.PI, TAU);
      c.stroke();
    } else {
      const size =
        design?.surface === "surface-ocean"
          ? 0.55
          : design?.surface === "surface-garden"
            ? 1.3
            : 1;
      c.beginPath();
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * TAU,
          rr = size * (22 + Math.sin(a * 3 + i) * 5 + Math.sin(a * 5 - i) * 3);
        const xx = Math.cos(a) * rr,
          yy = Math.sin(a) * rr * (p.biome === "dunes" ? 0.4 : 0.7);
        if (j) c.lineTo(xx, yy);
        else c.moveTo(xx, yy);
      }
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  for (let i = 0; i < 9; i++) {
    const y = -r + i * 23,
      drift = Math.sin(time * 0.45 + i) * 8;
    c.lineWidth =
      p.biome === "lava" ? 4 : material.material === "ice" ? 2.2 : 1.6;
    c.strokeStyle =
      p.biome === "lava"
        ? `rgba(255,157,64,${0.65 + Math.sin(time + i) * 0.22})`
        : p.biome === "frozen"
          ? "#d4ffffbb"
          : p.biome === "ocean"
            ? "#c1ffff70"
            : p.colors[0] + "35";
    c.beginPath();
    c.moveTo(-r, y);
    if (p.biome === "frozen" || p.biome === "lava") {
      c.lineTo(-20 + i * 6, y + 23);
      c.lineTo(10 + drift, y + 5);
      c.lineTo(r, y + 36);
    } else {
      const x = Math.sin(i * 2.4 + time * 0.08) * r * 0.65;
      c.moveTo(x - 6, y);
      c.quadraticCurveTo(x, y - 2, x + 7, y);
    }
    c.stroke();
  }
  if (p.feature === "islands") {
    c.fillStyle = "#bceccd";
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(
        Math.sin(i * 2.4) * r * 0.6,
        Math.cos(i * 2.4) * r * 0.55,
        13,
        6,
        i,
        0,
        TAU,
      );
      c.fill();
    }
  }
  if (p.feature === "fissure" || p.biome === "lava") {
    c.strokeStyle = `rgba(255,170,121,${0.65 + Math.sin(time * 0.8) * 0.2})`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-r * 0.6, -r);
    c.lineTo(-16, -26);
    c.lineTo(22, -4);
    c.lineTo(-5, 28);
    c.lineTo(r * 0.45, r);
    c.stroke();
  }
  if (p.clouds) {
    for (let i = 0; i < b.atmosphere * 3; i++) {
      c.fillStyle = p.biome === "dunes" ? "#ffcb9b66" : "#e3ffff80";
      const y = -r * 0.7 + i * r * 0.18,
        drift = Math.sin(time * 0.1 + i * 2.4) * r * 0.65;
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        c.ellipse(
          drift + j * 8,
          y + Math.sin(j + i) * 3,
          12 + j * 3,
          3 + j,
          -0.24,
          0,
          TAU,
        );
        c.fill();
      }
    }
  }
  if (p.feature === "storm") {
    // A compact eye + curved eyewall reads as a storm, while remaining a
    // bounded procedural layer on low-end devices.
    c.save();
    c.translate(18, -14);
    c.rotate(time * 0.24 * p.rotationDirection);
    c.strokeStyle = "#f2eaffcc";
    c.lineWidth = 3;
    c.fillStyle = "#233a6ecc";
    c.beginPath();
    c.ellipse(0, 0, 5, 3, 0, 0, TAU);
    c.fill();
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(0, 0, 12 + i * 6, 5 + i * 4, i * 0.3, 0, Math.PI * 1.7);
      c.stroke();
    }
    c.restore();
  }
  if (design?.surface === "surface-cosmic") {
    c.fillStyle = "#eff0ff";
    for (let i = 0; i < 22; i++) {
      c.globalAlpha = 0.45 + 0.3 * Math.sin(time + i);
      c.fillRect(
        Math.sin(i * 4.13) * r * 0.8,
        Math.cos(i * 7.3) * r * 0.8,
        2,
        2,
      );
    }
    c.globalAlpha = 1;
  }
  const shade = c.createLinearGradient(
    light.x * r,
    light.y * r,
    -light.x * r,
    -light.y * r,
  );
  shade.addColorStop(
    0,
    `#ffffff${Math.round(18 + material.specular * 26).toString(16)}`,
  );
  shade.addColorStop(0.38, "#00000000");
  shade.addColorStop(
    1,
    `#000414${Math.round(185 + (1 - light.intensity) * 50).toString(16)}`,
  );
  c.fillStyle = shade;
  c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  c.restore();
  if (p.atmosphere === "aurora" || p.space === "aurora") {
    for (let i = 0; i < b.atmosphere; i++) {
      c.strokeStyle = ["#8cf1cac0", "#84c8ff99", "#d9a1ff88"][i];
      c.lineWidth = 4;
      c.beginPath();
      for (let j = 0; j <= 40; j++) {
        const a = Math.PI + (j / 40) * Math.PI,
          rr = r + 14 + i * 7 + Math.sin(j * 0.3 + time * 0.7) * 5;
        const x = Math.cos(a) * rr,
          y = Math.sin(a) * rr * 0.7;
        if (j) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
    }
  }
  drawOrbitalSystem(c, p, design, time, r, quality, "front");
  c.restore();
}
