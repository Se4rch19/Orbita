import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { screenGesture, boundedLane } from "../src/input.ts";
import { Game } from "../src/engine.ts";
import { planetProfile } from "../src/planet-profile.ts";
import { budgets, VisualQuality, normalizeQuality } from "../src/quality.ts";
import { defaultDesign, components } from "../src/forge.ts";
import { fresh3, normalize3 } from "../src/storage3.ts";
import { freshPresentation } from "../src/presentation-state.ts";
import { introCanEnd, introPlan } from "../src/intro-state.ts";
import { MusicSignals, type MusicSignal } from "../src/music-signals.ts";
import { worldPlayable } from "../src/world-home.ts";
import { environmentParts, compatible } from "../src/environment.ts";
import { orbitalSide } from "../src/orbital-system.ts";
test("orbital depth divides each revolution into rear and front passes", () => {
  for (let turn = -4; turn <= 4; turn++) {
    assert.equal(orbitalSide(turn * Math.PI * 2 + Math.PI / 2), "front");
    assert.equal(orbitalSide(turn * Math.PI * 2 + Math.PI * 1.5), "back");
  }
});
for (const [name, x, y, expected] of [
  ["right", 25, 0, 1],
  ["up", 0, -25, 1],
  ["left", -25, 0, -1],
  ["down", 0, 25, -1],
] as const)
  test(`screen ${name} consistently moves ${expected}`, () =>
    assert.equal(
      screenGesture({ x: 300, y: 300 }, { x: 300 + x, y: 300 + y }),
      expected,
    ));
test("diagonal uses dominant axis and ties prefer X", () => {
  assert.equal(screenGesture({ x: 0, y: 0 }, { x: 25, y: 20 }), 1);
  assert.equal(screenGesture({ x: 0, y: 0 }, { x: 20, y: 25 }), -1);
  assert.equal(screenGesture({ x: 0, y: 0 }, { x: -25, y: -25 }), -1);
});
test("short fast flick accepted, jitter and stationary holds rejected", () => {
  assert.equal(screenGesture({ x: 0, y: 0 }, { x: 12, y: 2 }, 60), 1);
  assert.equal(screenGesture({ x: 0, y: 0 }, { x: 12, y: 2 }, 400), 0);
  for (const ms of [20, 100, 2000])
    assert.equal(screenGesture({ x: 0, y: 0 }, { x: 5, y: 4 }, ms), 0);
  assert.equal(screenGesture({ x: NaN, y: 0 }, { x: 25, y: 0 }), 0);
});
test("one gesture moves only one lane and cannot wrap either bound", () => {
  assert.equal(boundedLane(0, 1, [true, true, true]), 1);
  assert.equal(boundedLane(2, 1, [true, true, true]), 2);
  assert.equal(boundedLane(0, -1, [true, true, true]), 0);
  assert.equal(boundedLane(2, -1, [true, true, true]), 1);
});
test("rapid right right left right left remains adjacent and debounced", () => {
  const g = new Game("zen", 41, { mobile: true, stream: true, world: 1 });
  const lanes = [];
  for (const delta of [1, 1, -1, 1, -1]) {
    const before = g.lane;
    g.move(delta);
    lanes.push(g.lane);
    assert.ok(Math.abs(g.lane - before) <= 1);
    assert.equal(g.move(delta), false);
    g.update(0.12);
  }
  assert.deepEqual(lanes, [1, 2, 1, 2, 1]);
});
test("screen gesture independent of four traveler quadrants and rotation", () => {
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5])
    for (const reversed of [false, true]) {
      const g = new Game("zen", 41, { mobile: true, world: 1 });
      g.angle = angle;
      g.reversed = reversed;
      const direction = screenGesture({ x: 100, y: 500 }, { x: 120, y: 500 });
      assert.ok(g.move(direction));
      assert.equal(g.lane, 1);
    }
});
test("five curated planets have distinct coherent bodies and autonomous activity", () => {
  const profiles = Array.from({ length: 5 }, (_, i) => planetProfile(i));
  assert.equal(new Set(profiles.map((p) => p.biome)).size, 5);
  profiles.forEach((p) => assert.ok(p.activity > 0 && p.moons <= 3));
  assert.equal(profiles[0].clouds, true);
  assert.equal(profiles[4].asteroids, true);
});
test("Forge switches expose explicit visible feature presence", () => {
  const d = defaultDesign();
  assert.equal(planetProfile(0, d).moons, 0);
  assert.equal(
    planetProfile(0, { ...d, satellite: "satellite-moon" }).moons,
    1,
  );
  assert.equal(planetProfile(0, d).asteroids, false);
  assert.equal(planetProfile(0, { ...d, ring: "ring-broken" }).asteroids, true);
  assert.equal(planetProfile(0, d).trail, false);
  assert.equal(planetProfile(0, { ...d, orbit: "orbit-glow" }).trail, true);
  assert.equal(
    planetProfile(0, { ...d, atmosphere: "atmosphere-none" }).clouds,
    false,
  );
});
test("profile resolves ice and volcanic surface contradictions deterministically", () => {
  const d = defaultDesign();
  assert.equal(
    planetProfile(0, { ...d, biome: "biome-ocean", surface: "surface-ice" })
      .biome,
    "frozen",
  );
  assert.equal(
    planetProfile(0, {
      ...d,
      biome: "biome-frozen",
      surface: "surface-volcanic",
    }).biome,
    "lava",
  );
  assert.deepEqual(planetProfile(NaN, d, NaN), planetProfile(0, d, 41));
});
test("visual budgets bounded with unchanged gameplay entities", () => {
  for (const b of Object.values(budgets)) {
    assert.equal(b.entities, 64);
    assert.equal(b.scenes, 1);
    assert.ok(b.moons <= 3 && b.asteroids <= 30 && b.particles <= 80);
  }
  assert.equal(normalizeQuality("ultra"), "auto");
  assert.equal(new VisualQuality(8, 8).level, "high");
  assert.equal(new VisualQuality(2, 2).level, "low");
});
test("Auto degrades sustained slow frames and respects cooldown without oscillation", () => {
  const q = new VisualQuality(8, 8);
  for (let i = 0; i < 250; i++) q.sample(0.034);
  assert.equal(q.level, "medium");
  for (let i = 0; i < 500; i++) q.sample(0.034);
  assert.equal(q.level, "medium");
  q.set("high");
  for (let i = 0; i < 2000; i++) q.sample(0.05);
  assert.equal(q.level, "high");
});
test("quality selection cannot affect seeded gameplay simulation", () => {
  const snapshots = Object.keys(budgets).map(() => {
    const g = new Game("zen", 321, { mobile: true, stream: true, world: 4 });
    for (let i = 0; i < 600; i++) {
      if (i % 30 === 0) g.move(i % 60 ? -1 : 1);
      g.update(1 / 60);
    }
    return [g.score, g.angle, g.lane, g.items];
  });
  assert.deepEqual(snapshots[0], snapshots[1]);
  assert.deepEqual(snapshots[1], snapshots[2]);
});
test("intro uses first 4s repeat 2.1s and reduced-motion bypass", () => {
  const s = freshPresentation();
  assert.equal(introPlan(s, true).minimum, 4000);
  s.launches = 1;
  assert.equal(introPlan(s, true).minimum, 2100);
  assert.equal(introPlan(s, false).minimum, 0);
});
test("intro waits for readiness, gates skip and has 5s escape", () => {
  assert.equal(introCanEnd(4100, false, 4000), false);
  assert.equal(introCanEnd(4100, true, 4000), true);
  assert.equal(introCanEnd(999, true, 4000, true), false);
  assert.equal(introCanEnd(1000, true, 4000, true), true);
  assert.equal(introCanEnd(5000, false, 4000), true);
});
test("real 0.4.0 Redmi fixture preserves all fields with optional quality migration", () => {
  const old = JSON.parse(
    readFileSync(
      new URL("./fixtures/redmi-0.4.0.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(normalize3(old), old);
  old.presentation.quality = "high";
  assert.deepEqual(normalize3(old), old);
});
test("corrupt visual preference falls back without losing player progress", () => {
  const old = fresh3();
  old.totalLights = 194;
  const next = normalize3({
    ...old,
    presentation: { ...old.presentation, quality: "invalid" },
  });
  assert.equal(next.totalLights, 194);
  assert.equal(next.presentation.quality, "auto");
});
test("browsable locked worlds are never playable through main CTA", () => {
  const s = fresh3();
  assert.equal(worldPlayable(s, 0), true);
  for (const world of [-1, 1, 2, 3, 4, 5, NaN])
    assert.equal(worldPlayable(s, world), false);
});
test("music boundary emits lifecycle, directions and pauses once and isolates failures", () => {
  const bridge = new MusicSignals(),
    events: MusicSignal[] = [];
  bridge.sink = (e) => events.push(e);
  const g = new Game("zen", 41, { mobile: true, world: 1 });
  bridge.observe(g, false);
  bridge.observe(g, false);
  assert.equal(events.filter((e) => e.type === "run-start").length, 1);
  g.move(1);
  bridge.observe(g, false);
  assert.ok(events.some((e) => e.type === "orbit-out"));
  bridge.observe(g, true);
  bridge.observe(g, false);
  bridge.observe(null, false);
  for (const type of ["pause", "resume", "run-end"])
    assert.equal(events.filter((e) => e.type === type).length, 1);
  bridge.sink = () => {
    throw new Error("external music failure");
  };
  assert.doesNotThrow(() => bridge.observe(g, false));
});
test("20,000 procedural visual profiles remain finite and within budgets", () => {
  for (let seed = 0; seed < 20000; seed++) {
    const d = defaultDesign();
    for (const c of components)
      if ((seed + c.id.length) % 7 === 0) d[c.category] = c.id;
    for (const part of environmentParts)
      if ((seed + part.id.length) % 11 === 0 && compatible(d, part.id))
        d[part.category] = part.id;
    const p = planetProfile(seed % 5, d, seed);
    assert.ok(Number.isFinite(p.seed) && p.activity > 0 && p.moons <= 3);
    assert.ok(p.colors.every((color) => /^#[0-9a-f]{6}$/i.test(color)));
    assert.notEqual(JSON.stringify(p).includes("NaN"), true);
  }
});
