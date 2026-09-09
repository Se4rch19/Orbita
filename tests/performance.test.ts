import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/engine.ts";
import { PatternGenerator } from "../src/generator.ts";
import { sessionConfig } from "../src/config.ts";
test("generator only reserves and blocks active orbits", () => {
  const c = sessionConfig("voyage", { world: 1, level: 1 });
  c.orbits[1].active = false;
  const gen = new PatternGenerator(c, 5);
  for (let i = 0; i < 100; i++) {
    const g = gen.next(20);
    assert.notEqual(g.safeLane, 1);
    assert.ok(!g.blocked.includes(1));
    assert.ok(!g.blocked.includes(g.safeLane));
  }
});
test("world signature mechanics appear early on every tested route", () => {
  for (let seed = 0; seed < 100; seed++) {
    const glacier = new PatternGenerator(
        sessionConfig("voyage", { world: 3 }),
        seed,
      ),
      peach = new PatternGenerator(
        sessionConfig("voyage", { world: 1, level: 1 }),
        seed,
      );
    const gaps = Array.from({ length: 12 }, () => glacier.next(10)),
      crosses = Array.from({ length: 12 }, () => peach.next(10));
    assert.ok(gaps.some((g) => g.structural));
    assert.ok(crosses.some((g) => g.moving));
    for (const g of crosses.filter((g) => g.moving))
      assert.ok(g.safeLane === 0 || g.safeLane === 2);
  }
});
test("disabled orbit is skipped without trapping the control", () => {
  const g = new Game("voyage", 1, { world: 1 });
  g.config.orbits[1].active = false;
  g.switch();
  assert.equal(g.lane, 2);
});
test("a full hour of continuous play retains a bounded encounter buffer", () => {
  const g = new Game("zen", 4, { world: 3, zenDuration: 0 });
  let max = 0;
  for (let i = 0; i < 3600; i++) {
    g.update(1);
    max = Math.max(max, g.items.length);
    g.events.length = 0;
  }
  assert.equal(g.time, 3600);
  assert.ok(max < 40);
  assert.equal(g.done, false);
});
