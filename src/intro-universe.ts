import { TAU } from "./engine.ts";

export type IntroUniverseProfile = {
  starColor: string;
  bodies: Array<{
    x: number;
    y: number;
    radius: number;
    color: string;
    ring?: boolean;
  }>;
};

export const introUniverseProfile: IntroUniverseProfile = {
  starColor: "#dff8ff",
  bodies: [
    { x: 92, y: 136, radius: 23, color: "#4f7cc4" },
    { x: 486, y: 112, radius: 31, color: "#b07ad5", ring: true },
    { x: 438, y: 456, radius: 42, color: "#d47d68" },
    { x: 132, y: 472, radius: 34, color: "#79c9c4", ring: true },
    { x: 312, y: 292, radius: 112, color: "#5a3f80", ring: true },
  ],
};

export function drawIntroUniverse(
  c: CanvasRenderingContext2D,
  time: number,
  reduced = false,
) {
  c.save();
  c.fillStyle = "#020714";
  c.fillRect(0, 0, 600, 600);
  const drift = reduced ? 0 : time * 6;
  for (let i = 0; i < 76; i++) {
    const x = (i * 97.3 + drift * (0.16 + (i % 4) * 0.04)) % 600;
    const y = (i * 53.7 + Math.sin(time * 0.1 + i) * 8) % 600;
    c.globalAlpha = 0.2 + (i % 5) * 0.08;
    c.fillStyle = i % 9 === 0 ? "#a6f3d6" : "#d5e7ff";
    c.fillRect(x, y, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
  }
  c.globalAlpha = 1;
  const bodies = introUniverseProfile.bodies;
  bodies.forEach((body, i) => {
    const approach =
      i === bodies.length - 1
        ? Math.min(1, time / 3.2)
        : 0.6 + 0.4 * Math.sin(time * 0.1 + i);
    const x = body.x + Math.sin(time * 0.03 + i) * (i + 1) * 3;
    const y = body.y + Math.cos(time * 0.04 + i) * (i + 1) * 2;
    const r =
      body.radius * (i === bodies.length - 1 ? 0.5 + approach * 0.5 : 0.86);
    const g = c.createRadialGradient(
      x - r * 0.35,
      y - r * 0.4,
      2,
      x,
      y,
      r * 1.5,
    );
    g.addColorStop(0, "#ffffffb0");
    g.addColorStop(0.16, body.color);
    g.addColorStop(1, "#050719");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.strokeStyle = body.color + "70";
    c.lineWidth = 2;
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      c.arc(x, y, r * (0.3 + j * 0.17), 0, TAU);
      c.stroke();
    }
    if (body.ring) {
      c.save();
      c.translate(x, y);
      c.rotate(-0.35 + i * 0.1);
      c.strokeStyle = body.color + "99";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, r * 1.7, r * 0.35, 0, 0, TAU);
      c.stroke();
      c.restore();
    }
  });
  const travelerAngle = -1.7 + time * 1.2;
  const tx = 312 + Math.cos(travelerAngle) * 155,
    ty = 292 + Math.sin(travelerAngle) * 64;
  c.strokeStyle = "#c9fff1aa";
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = travelerAngle - i * 0.035;
    const x = 312 + Math.cos(a) * 155;
    const y = 292 + Math.sin(a) * 64;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();
  c.fillStyle = "#f2fff7";
  c.shadowColor = "#a9ffe1";
  c.shadowBlur = 18;
  c.beginPath();
  c.arc(tx, ty, 5, 0, TAU);
  c.fill();
  c.shadowBlur = 0;
  c.restore();
}
