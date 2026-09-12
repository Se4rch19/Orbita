import { t as message } from "./i18n.ts";
import { drawLivingWorld } from "./living-world";
import { VisualQuality } from "./quality";
import { appearance } from "./stream";
import { Game, TAU, random, type Item } from "./engine";
import { sessionConfig, type Orbit } from "./config";
import { pathPoint, lanePoint, radiusAt } from "./geometry";
import { worlds } from "./storage";
import { component, type Design } from "./forge";
import { drawPlanet } from "./forge-art";
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};
export class Art {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  world = 0;
  private design: Design | null = null;
  set custom(value: Design | null) {
    this.design = value;
    this.layerKey = "";
  }
  layerKey = "";
  previewWorld = -1;
  previewOrbits: Orbit[] = [];
  paths: Path2D[] = [];
  planetLayer: HTMLCanvasElement | null = null;
  motion = true;
  quality = new VisualQuality(
    navigator.hardwareConcurrency,
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4,
  );
  cinematic = false;
  sceneTime = 0;
  visualSeed = 41;
  private pixelRatio = 0;
  rotation = 0;
  particlePool: Particle[] = [];
  particles: Particle[] = [];
  stars = Array.from({ length: 62 }, (_, i) => {
    const rng = random(i * 121 + 80);
    return {
      x: rng() * 600,
      y: rng() * 600,
      r: rng() + 0.3,
      a: rng() * 0.4 + 0.1,
    };
  });
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = 600 * dpr;
    canvas.height = 600 * dpr;
    this.ctx.scale(dpr, dpr);
  }
  circle(x: number, y: number, r: number, fill: string) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = fill;
    c.fill();
  }
  planet(t: number, small = false) {
    if (this.design) {
      drawPlanet(this.ctx, this.design, small);
      return;
    }
    const c = this.ctx,
      w = worlds[this.world],
      r = small ? 77 : 97;
    c.save();
    c.translate(300, 300);
    const glow = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
    glow.addColorStop(0, w.color + "16");
    glow.addColorStop(1, w.color + "00");
    this.circle(0, 0, r * 2.2, glow as unknown as string);
    c.save();
    c.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * TAU,
        rr = radiusAt(w.shape, r, a);
      if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.clip();
    const grad = c.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(
      0,
      this.world === 4 ? "#777287" : this.world === 1 ? "#ffe1ac" : "#c5f8de",
    );
    grad.addColorStop(0.3, this.world === 4 ? "#4b405e" : w.color);
    grad.addColorStop(1, this.world === 4 ? "#17152c" : w.dark);
    c.fillStyle = grad;
    c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    c.fillStyle = w.dark + "80";
    c.beginPath();
    c.moveTo(-r, -12);
    c.bezierCurveTo(-70, -76, -5, -24, -19, 6);
    c.bezierCurveTo(-39, 57, 62, 4, 45, 59);
    c.bezierCurveTo(17, 105, -65, 112, -r, 32);
    c.fill();
    c.fillStyle = w.dark + "70";
    c.beginPath();
    c.moveTo(22, -r);
    c.bezierCurveTo(-5, -51, 65, -59, 62, -20);
    c.bezierCurveTo(52, 10, 99, 30, 111, -30);
    c.lineTo(r, -r);
    c.fill();
    const shade = c.createRadialGradient(-34, -38, 20, 32, 22, r * 1.4);
    shade.addColorStop(0, "#ffffff00");
    shade.addColorStop(0.7, "#00192105");
    shade.addColorStop(1, "#00192180");
    c.fillStyle = shade;
    c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    for (let i = 0; i < 14; i++) {
      const rng = random(i * 34 + 11),
        x = (rng() - 0.5) * r * 1.5,
        y = (rng() - 0.5) * r * 1.5;
      this.circle(x, y, 1.4, "#e7ffe380");
    }
    c.restore();
    // Curated silhouettes: vegetation, sparse warm vegetation, crystal spires, ice, then bare rock.
    for (
      let i = 0;
      i < (this.world === 4 ? 0 : this.world === 1 ? 3 : 7);
      i++
    ) {
      const a = i * 0.91 + 0.3;
      c.save();
      c.rotate(a);
      c.translate(0, -radiusAt(w.shape, r, -Math.PI / 2 + a) + 2);
      const sway = this.motion ? Math.sin(t * 0.8 + i) * 0.05 : 0;
      c.rotate(sway);
      c.strokeStyle = w.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, 3);
      c.lineTo(0, -13 - (i % 3) * 3);
      c.stroke();
      c.fillStyle = w.color;
      c.beginPath();
      if (this.world >= 2) {
        c.moveTo(-5, 0);
        c.lineTo(-2, -20 - (i % 3) * 3);
        c.lineTo(5, -6);
        c.lineTo(4, 2);
        c.closePath();
      } else {
        c.ellipse(-4, -9, 4, 8, -0.65, 0, TAU);
        c.ellipse(4, -14, 4, 7, 0.65, 0, TAU);
      }
      c.fill();
      c.restore();
    }
    c.restore();
  }
  burst(angle: number, lane: number, color: string, game?: Game) {
    if (!this.motion) return;
    const orbits =
        game?.config.orbits ??
        sessionConfig("voyage", { world: this.world }).orbits,
      p = lanePoint(orbits, lane, angle);
    for (
      let i = 0;
      i < 10 && this.particles.length < this.quality.budget.particles;
      i++
    ) {
      const a = (i / 10) * TAU;
      const particle = this.particlePool.pop() ?? ({} as Particle);
      this.particles.push(
        Object.assign(particle, {
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 75,
          vy: Math.sin(a) * 75,
          life: 1,
          color,
        }),
      );
    }
  }
  path(orbit: Orbit, start = 0, end = TAU) {
    const p = new Path2D(),
      steps = Math.max(4, Math.ceil((Math.abs(end - start) / TAU) * 128));
    for (let i = 0; i <= steps; i++) {
      const q = pathPoint(orbit, start + ((end - start) * i) / steps);
      if (i === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    }
    return p;
  }
  draw(t: number, game: Game | null, dt = 0) {
    this.quality.sample(dt);
    const ratio = Math.min(
      devicePixelRatio || 1,
      game ? 2 : this.quality.budget.dpr,
    );
    if (ratio !== this.pixelRatio) {
      this.pixelRatio = ratio;
      this.canvas.width = this.canvas.height = 600 * ratio;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    if (this.motion) this.sceneTime += Math.min(dt, 0.1);
    t = this.sceneTime;
    const c = this.ctx;
    c.clearRect(0, 0, 600, 600);
    const space = this.design?.space;
    const fog = c.createRadialGradient(280, 260, 25, 300, 300, 310);
    fog.addColorStop(
      0,
      space === "space-nebula" ? "#73509b30" : worlds[this.world].color + "12",
    );
    fog.addColorStop(1, "#00000000");
    c.fillStyle = fog;
    c.fillRect(0, 0, 600, 600);
    if (space === "space-void") {
      c.fillStyle = "#030610a0";
      c.fillRect(0, 0, 600, 600);
    }
    for (const [index, s] of this.stars.entries()) {
      if (index >= this.quality.budget.stars) break;
      if (space === "space-void" && index % 3) continue;
      c.globalAlpha = s.a * (this.motion ? 0.8 + 0.2 * Math.sin(t + s.x) : 1);
      this.circle(
        (s.x + t * ((index % 3) + 1) * 0.5) % 600,
        s.y,
        s.r,
        "#bfd9d7",
      );
    }
    c.globalAlpha = 1;
    if (this.cinematic && !game) {
      for (let i = 0; i < this.quality.budget.dust; i++) {
        const x = (i * 131.7 + t * (2 + (i % 3))) % 600;
        this.circle(x, (i * 83.3) % 600, 1.2, worlds[this.world].color + "45");
      }
      c.save();
      c.translate(300, 300);
      c.scale(1.8, 1.8);
      c.rotate(this.rotation);
      c.translate(-300, -300);
      drawLivingWorld(
        c,
        this.world,
        this.design,
        t,
        false,
        this.quality.level,
        this.visualSeed,
      );
      c.restore();
      return;
    }
    if (!game && this.previewWorld !== this.world) {
      this.previewWorld = this.world;
      this.previewOrbits = sessionConfig("voyage", {
        world: this.world,
      }).orbits;
    }
    const orbits = game?.config.orbits ?? this.previewOrbits;
    const key = `${this.world}:${game ? "play" : "home"}`;
    if (this.layerKey !== key) {
      this.layerKey = key;
      this.paths = orbits.map((o) => this.path(o));
      this.planetLayer = document.createElement("canvas");
      this.planetLayer.width = this.planetLayer.height = 600;
      const original = this.ctx;
      this.ctx = this.planetLayer.getContext("2d")!;
      this.planet(0, !!game);
      this.ctx = original;
    }
    orbits.forEach((o, i) => {
      if (!o.active) return;
      c.strokeStyle = o.color + "38";
      c.lineWidth = 1.2;
      c.stroke(this.paths[i]);
      if (this.design) {
        const style = component(this.design.orbit)!.visual.style;
        c.save();
        c.strokeStyle = "#a9d3d955";
        c.lineWidth = style === "glow" ? 2 : 1.5;
        if (style === "dotted") c.setLineDash([2, 9]);
        if (style === "crystal") c.setLineDash([9, 3, 2, 3]);
        c.stroke(this.paths[i]);
        c.restore();
      }
      const angle = -Math.PI / 2 + 0.37,
        position = pathPoint(o, angle),
        next = pathPoint(o, angle + 0.01),
        direction = o.direction * (game?.reversed ? -1 : 1);
      c.save();
      c.translate(position.x, position.y);
      c.rotate(
        Math.atan2(next.y - position.y, next.x - position.x) +
          (direction < 0 ? Math.PI : 0),
      );
      c.strokeStyle = o.color + "bb";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-4, -4);
      c.lineTo(1, 0);
      c.lineTo(-4, 4);
      c.stroke();
      c.restore();
    });
    c.save();
    c.translate(300, 300);
    c.rotate(this.rotation);
    c.translate(-300, -300);
    c.drawImage(this.planetLayer!, 0, 0);
    drawLivingWorld(
      c,
      this.world,
      this.design,
      this.motion ? t : 0,
      !!game,
      this.quality.level,
      this.visualSeed,
    );
    c.restore();
    const angle = game?.angle ?? (this.motion ? t * 0.22 : -0.9),
      lane = game?.radiusLane ?? orbits.length - 1;
    const items = game?.items ?? [
      { angle: 1, lane: 0, kind: "light", passed: false },
      { angle: 3.5, lane: 1, kind: "light", passed: false },
    ];
    for (const item of items) {
      const entity = item as Item;
      const alpha = appearance(entity, game?.time ?? t);
      if (alpha <= 0 || (!entity.life && item.passed)) continue;
      c.globalAlpha = alpha;
      const itemLane = game ? game.itemLane(item as Item) : item.lane;
      const entityOrbits = entity.renderOrbits ?? orbits;
      const p = lanePoint(entityOrbits, itemLane, item.angle);
      if (game?.config.assistance && item.kind !== "light") {
        const ahead = (item.angle - game.angle) * game.direction;
        if (ahead > 0 && ahead / Math.max(0.1, game.speed) < 0.9) {
          c.save();
          c.strokeStyle = "#ffe0bd";
          c.lineWidth = 2.5;
          c.beginPath();
          c.arc(p.x, p.y, 14, 0, TAU);
          c.stroke();
          c.restore();
        }
      }
      if (item.kind === "gap") {
        const width = (item as Item).width ?? 0.32,
          path = this.path(
            entityOrbits[item.lane],
            item.angle - width / 2,
            item.angle + width / 2,
          );
        c.strokeStyle = "#071720";
        c.lineWidth = 7;
        c.stroke(path);
        c.setLineDash([4, 6]);
        c.strokeStyle = "#ffb3a8";
        c.lineWidth = 3;
        c.stroke(path);
        c.setLineDash([]);
        for (const a of [item.angle - width / 2, item.angle + width / 2]) {
          const edge = pathPoint(entityOrbits[item.lane], a);
          this.circle(edge.x, edge.y, 3, "#ffb3a8");
        }
        continue;
      }
      c.save();
      c.translate(p.x, p.y);
      const scale =
        entity.life === "forming"
          ? 0.45 + alpha * 0.55
          : entity.life === "dissolving"
            ? entity.collected
              ? alpha
              : 1 + (1 - alpha) * 0.25
            : 1;
      c.scale(scale, scale);
      if (entity.life === "forming" && this.motion) {
        for (let j = 0; j < 3; j++) {
          const a = (j * TAU) / 3 + t * 2;
          this.circle(
            Math.cos(a) * (8 + (1 - alpha) * 12),
            Math.sin(a) * (8 + (1 - alpha) * 12),
            1.5,
            item.kind === "light" ? "#ffdc9d" : "#dd9fb9",
          );
        }
      }
      if (item.kind === "light") {
        c.rotate(Math.PI / 4);
        c.fillStyle = "#ffdc9d";
        c.fillRect(-5, -5, 10, 10);
        c.strokeStyle = "#ffdc9d55";
        c.strokeRect(-10, -10, 20, 20);
      } else {
        if (entity.family === "comet") {
          c.strokeStyle = "#cba2ff";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-22, -10);
          c.lineTo(0, 0);
          c.stroke();
        }
        c.rotate(item.angle + 0.7);
        c.strokeStyle = "#ff9f98";
        c.fillStyle = "#dd7c7335";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -12);
        c.lineTo(10, 6);
        c.lineTo(-2, 12);
        c.lineTo(-10, -3);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(-4, -3);
        c.lineTo(3, 4);
        c.moveTo(3, -3);
        c.lineTo(-4, 4);
        c.stroke();
        if ((item as Item).fromLane !== undefined) {
          c.strokeStyle = "#ffdfb3";
          c.beginPath();
          c.arc(0, 0, 17, 0, Math.PI);
          c.stroke();
        }
      }
      c.restore();
    }
    c.globalAlpha = 1;
    const direction = game?.direction ?? 1;
    for (let i = 1; i < 10; i++) {
      const p = lanePoint(orbits, lane, angle - direction * i * 0.025);
      c.globalAlpha = (1 - i / 10) * 0.3;
      this.circle(p.x, p.y, 4, worlds[this.world].color);
    }
    c.globalAlpha = 1;
    const player = lanePoint(orbits, lane, angle);
    if (this.motion) {
      this.circle(player.x, player.y, 16, worlds[this.world].color + "17");
      this.circle(player.x, player.y, 12, worlds[this.world].color + "30");
    }
    this.circle(
      player.x,
      player.y,
      9,
      game && game.invincible > 0 ? "#ffb2a7" : "#edfff6",
    );
    this.circle(player.x, player.y, 3.5, worlds[this.world].dark);
    if (game && game.invincible > 0) {
      c.strokeStyle = "#ffb2a7";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(player.x, player.y, 17, 0, TAU);
      c.stroke();
    }
    if (game) {
      this.circle(300, 305, 37, "#092e3bcc");
      c.textAlign = "center";
      c.fillStyle = "#f1fff5";
      c.font = '500 31px "Segoe UI", sans-serif';
      c.fillText("×" + game.multiplier, 300, 304);
      c.fillStyle = "#c5efe1";
      c.font = '600 9px "Segoe UI", sans-serif';
      c.fillText(message("m_242eada33c"), 300, 325);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt * 2;
      if (p.life <= 0) {
        this.particlePool.push(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      c.globalAlpha = p.life;
      this.circle(p.x, p.y, 2.6, p.color);
    }
    c.globalAlpha = 1;
  }
}
