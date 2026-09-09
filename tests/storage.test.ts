import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../src/storage.ts";
Object.defineProperty(globalThis, "matchMedia", {
  value: () => ({ matches: false }),
});
test("invalid saves recover to a fresh world", () => {
  for (const v of [null, 4, [], { world: 400, totalLights: -2 }]) {
    const s = normalize(v);
    assert.equal(s.world, 0);
    assert.equal(s.totalLights, 0);
  }
});
test("an unearned cosmetic cannot be selected through a corrupt save", () => {
  assert.equal(normalize({ totalLights: 79, world: 1 }).world, 0);
  assert.equal(normalize({ totalLights: 80, world: 1 }).world, 1);
});
test("nonfinite scores and malformed history are discarded", () => {
  const s = normalize({
    best: Infinity,
    totalLights: NaN,
    history: [
      null,
      { mode: "invalid" },
      { mode: "zen", score: -40, lights: 3 },
    ],
  });
  assert.equal(s.best, 0);
  assert.equal(s.totalLights, 0);
  assert.deepEqual(s.history, [{ mode: "zen", score: 0, lights: 3 }]);
});
test("valid preferences and history survive normalization", () => {
  const s = normalize({
    sound: false,
    motion: false,
    world: 2,
    totalLights: 220,
    runs: 4,
    history: [{ mode: "voyage", score: 250, lights: 20 }],
  });
  assert.equal(s.sound, false);
  assert.equal(s.motion, false);
  assert.equal(s.world, 2);
  assert.equal(s.history[0].score, 250);
});
