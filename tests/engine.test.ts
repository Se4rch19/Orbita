import { test } from "node:test";
import assert from "node:assert/strict";
import { Game, random, dailySeed } from "../src/engine.ts";
test("seeded routes repeat across retries", () => {
  const a = new Game("daily", 20260908),
    b = new Game("daily", 20260908);
  assert.deepEqual(a.items, b.items);
  for (let i = 0; i < 300; i++) {
    a.update(0.016);
    b.update(0.016);
  }
  assert.deepEqual(a.items, b.items);
  assert.equal(a.score, b.score);
});
test("daily seed uses local calendar date", () =>
  assert.equal(dailySeed(new Date(2026, 8, 8, 23, 59)), 20260908));
test("a golden light scores once and increases chain", () => {
  const g = new Game("voyage", 1);
  g.items = [
    { id: 999, angle: g.angle + 0.01, lane: 0, kind: "light", passed: false },
  ];
  g.update(0.02);
  assert.equal(g.score, 10);
  assert.equal(g.lights, 1);
  g.update(0.02);
  assert.equal(g.score, 10);
});
test("every five collected lights increases multiplier, capped at four", () => {
  const g = new Game("voyage", 1);
  g.combo = 5;
  assert.equal(g.multiplier, 2);
  g.combo = 100;
  assert.equal(g.multiplier, 4);
});
test("a missed light resets chain but preserves shields", () => {
  const g = new Game("voyage", 1);
  g.combo = 6;
  g.items = [
    { id: 999, angle: g.angle + 0.01, lane: 1, kind: "light", passed: false },
  ];
  g.update(0.02);
  assert.equal(g.combo, 0);
  assert.equal(g.lives, 3);
});
test("hazard causes one hit with grace period", () => {
  const g = new Game("voyage", 1);
  g.items = [
    { id: 999, angle: g.angle + 0.01, lane: 0, kind: "hazard", passed: false },
    {
      id: 1000,
      angle: g.angle + 0.015,
      lane: 0,
      kind: "hazard",
      passed: false,
    },
  ];
  g.update(0.02);
  assert.equal(g.lives, 2);
  assert.equal(g.events.filter((e) => e.type === "hit").length, 1);
});
test("zen hazards cannot kill player", () => {
  const g = new Game("zen", 1);
  g.items = [
    { id: 999, angle: g.angle + 0.01, lane: 0, kind: "hazard", passed: false },
  ];
  g.update(0.02);
  assert.equal(g.lives, 3);
});
test("time limit ends once, freezes scoring and movement", () => {
  const g = new Game("zen", 1);
  for (let i = 0; i < 1201; i++) g.update(0.05);
  assert.equal(g.done, true);
  assert.equal(g.time, 60);
  assert.equal(g.events.filter((e) => e.type === "finish").length, 1);
  const angle = g.angle;
  g.update(0.05);
  assert.equal(g.angle, angle);
});
test("switch is interpolated and debounced", () => {
  const g = new Game("voyage", 1);
  g.switch();
  g.switch();
  assert.equal(g.lane, 1);
  g.update(0.05);
  assert.ok(g.radiusLane > 0 && g.radiusLane < 1);
});
test("route generation always offers a safe collectible lane", () => {
  for (let seed = 0; seed < 100; seed++) {
    const g = new Game("voyage", seed);
    for (let step = 0; step < 200; step++) {
      for (const h of g.items.filter((x) => x.kind === "hazard"))
        assert.ok(
          g.items.some(
            (x) =>
              x.kind === "light" && x.angle === h.angle && x.lane !== h.lane,
          ),
        );
      g.update(0.05);
    }
  }
});
test("random output stays in [0,1)", () => {
  const rng = random(999);
  for (let i = 0; i < 1000; i++) {
    const n = rng();
    assert.ok(n >= 0 && n < 1);
  }
});
