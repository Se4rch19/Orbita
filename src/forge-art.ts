import { component, type Design } from "./forge.ts";
import { radiusAt } from "./geometry.ts";
const TAU = Math.PI * 2;
export function drawPlanet(
  c: CanvasRenderingContext2D,
  d: Design,
  small: boolean,
) {
  const r = small ? 77 : 97,
    colors = component(d.palette)!.visual.colors!,
    geometry = component(d.shape)!.visual.shape!,
    surface = component(d.surface)!.visual.style,
    atmosphere = component(d.atmosphere)!.visual.style,
    ring = component(d.ring)!.visual.style;
  c.save();
  c.translate(300, 300);
  if (atmosphere !== "none") {
    const glow = c.createRadialGradient(0, 0, r * 0.7, 0, 0, r + 28);
    glow.addColorStop(0, colors[0] + "35");
    glow.addColorStop(1, colors[0] + "00");
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, r + 28, 0, TAU);
    c.fill();
    if (atmosphere === "stars")
      for (let i = 0; i < 12; i++) {
        const a = i * 2.4;
        c.fillStyle = colors[0] + "90";
        c.fillRect(Math.cos(a) * (r + 18), Math.sin(a) * (r + 18), 1.5, 1.5);
      }
    if (atmosphere === "aurora") {
      c.strokeStyle = colors[0] + "40";
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(0, 0, r + 12 + i * 4, r * 0.7, -0.4 + i * 0.1, 0.1, 2.8);
        c.stroke();
      }
    }
  }
  c.save();
  c.beginPath();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * TAU,
      rr = radiusAt(geometry, r, a);
    if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.clip();
  const fill = c.createLinearGradient(-r, -r, r, r);
  fill.addColorStop(0, colors[0]);
  fill.addColorStop(1, colors[1]);
  c.fillStyle = fill;
  c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  c.strokeStyle = colors[0] + "99";
  c.fillStyle = colors[1] + "80";
  c.lineWidth = 2;
  if (surface === "ocean" || surface === "volcanic")
    for (let i = 0; i < 7; i++) {
      c.strokeStyle = surface === "volcanic" ? "#ffe1ba90" : colors[0] + "88";
      c.beginPath();
      c.moveTo(-r, -r + i * 30);
      c.bezierCurveTo(
        -20,
        -r - 30 + i * 30,
        20,
        -r + 30 + i * 30,
        r,
        -r + i * 30,
      );
      c.stroke();
    }
  else if (surface === "ice")
    for (let i = 0; i < 8; i++) {
      c.beginPath();
      c.moveTo(-r + i * 30, -r);
      c.lineTo(i * 9 - 40, 0);
      c.lineTo(r - i * 18, r);
      c.stroke();
    }
  else
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4,
        x = Math.cos(a) * r * (0.2 + (i % 4) * 0.15),
        y = Math.sin(a) * r * 0.7;
      c.beginPath();
      c.arc(
        x,
        y,
        surface === "cosmic"
          ? 1.5
          : surface === "rock"
            ? 5 + (i % 4)
            : 13 + (i % 9),
        0,
        TAU,
      );
      c.fillStyle = surface === "cosmic" ? "#ffffffaa" : colors[1] + "77";
      c.fill();
    }
  c.restore();
  if (ring !== "none") {
    c.save();
    c.rotate(-0.4);
    c.strokeStyle = colors[0] + "88";
    c.lineWidth = 2;
    if (ring === "broken") c.setLineDash([12, 8]);
    for (let i = 0; i < (ring === "double" ? 2 : 1); i++) {
      c.beginPath();
      c.ellipse(0, 0, r + 19 + i * 6, r * 0.35 + i * 5, 0, 0, TAU);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
export function drawSatellites(
  c: CanvasRenderingContext2D,
  d: Design,
  t: number,
  motion: boolean,
  small: boolean,
) {
  const v = component(d.satellite)!.visual,
    count = v.count ?? 0,
    r = small ? 122 : 137;
  c.save();
  c.fillStyle = "#bed3d5";
  c.strokeStyle = "#071720";
  c.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const a = (motion ? t * 0.18 : 0) + i * Math.PI + 0.7,
      x = 300 + Math.cos(a) * r,
      y = 300 + Math.sin(a) * r;
    c.beginPath();
    if (v.style === "crystal") {
      c.moveTo(x, y - 6);
      c.lineTo(x + 4, y);
      c.lineTo(x, y + 6);
      c.lineTo(x - 4, y);
      c.closePath();
    } else c.arc(x, y, 5, 0, TAU);
    c.fill();
    c.stroke();
  }
  c.restore();
}
