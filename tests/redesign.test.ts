import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/engine.ts";
import {
  worlds,
  sessionConfig,
  dailyChallenge,
  difficulty,
  levelNames,
} from "../src/config.ts";
import { PatternGenerator, validateGate } from "../src/generator.ts";
import { pathPoint, pathMetric, TAU } from "../src/geometry.ts";
import { hashSeed, dailySeed } from "../src/random.ts";
import {
  fresh,
  normalize,
  writeSave,
  readSave,
  resetSave,
  refreshUnlocks,
} from "../src/storage.ts";
import {
  levelUnlocked,
  recordRun,
  earnedFragments,
  markDailyPlayed,
  todayRecord,
} from "../src/progression.ts";

test("all 15 world/level configurations are valid and mechanics are distinct", () => {
  assert.equal(levelNames.flat().length, 15);
  for (let w = 0; w < 5; w++)
    for (let l = 0; l < 3; l++) {
      const c = sessionConfig("voyage", { world: w, level: l });
      assert.equal(c.world, w);
      assert.equal(c.level, l);
      assert.ok(c.orbits.length >= 2 && c.orbits.length <= 3);
      assert.ok(c.duration >= 30 && c.duration <= 75);
      assert.ok(c.targetLights > 0);
      assert.ok(
        c.orbits.every((o, i) => o.active && o.lane === i && o.baseSpeed > 0),
      );
    }
  assert.equal(sessionConfig("voyage", { world: 1 }).orbits.length, 3);
  assert.ok(
    sessionConfig("voyage", { world: 2 }).orbits[0].geometry.deformation > 0,
  );
  assert.ok(sessionConfig("voyage", { world: 3 }).structural);
  assert.ok(sessionConfig("voyage", { world: 4, level: 2 }).reversalEvery > 0);
});
test("speed relationships are configurable, including a reverse lane", () => {
  const peach = sessionConfig("voyage", { world: 1 });
  assert.ok(peach.orbits[0].baseSpeed > peach.orbits[2].baseSpeed);
  const g = new Game("voyage", 1, { world: 4, level: 1 });
  g.switch();
  g.update(0.8);
  assert.equal(g.direction, -1);
  assert.ok(g.velocity < 0);
});
test("geometry is closed, smooth and nondegenerate", () => {
  for (let w = 0; w < 5; w++)
    for (const o of sessionConfig("voyage", { world: w }).orbits) {
      const a = pathPoint(o, 0),
        b = pathPoint(o, TAU);
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-8);
      for (let i = 0; i < 1000; i++) {
        const angle = (i / 1000) * TAU,
          p = pathPoint(o, angle),
          q = pathPoint(o, angle + 0.001);
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
        assert.ok(Math.hypot(p.x - q.x, p.y - q.y) < 1);
        assert.ok(pathMetric(o, angle) > 0.7);
      }
    }
});
test("fixed input and seed reproduce generated encounters", () => {
  const a = new Game("voyage", 321, { world: 2, level: 1 }),
    b = new Game("voyage", 321, { world: 2, level: 1 });
  for (let i = 0; i < 100; i++) {
    if (i % 10 === 0) {
      a.switch();
      b.switch();
    }
    a.update(0.2);
    b.update(0.2);
  }
  assert.deepEqual(a.items, b.items);
  assert.equal(a.score, b.score);
  assert.equal(a.angle, b.angle);
});
test("attempt seeds vary encounters while preserving world rules", () => {
  const a = new Game("voyage", 1, { world: 3, level: 1 }),
    b = new Game("voyage", 2, { world: 3, level: 1 });
  assert.deepEqual(a.config, b.config);
  assert.notDeepEqual(a.items, b.items);
});
test("daily base rules are deterministic, versioned and independent of attempt", () => {
  assert.deepEqual(dailyChallenge(20260908), dailyChallenge(20260908));
  assert.notEqual(
    dailyChallenge(20260908).ruleSeed,
    dailyChallenge(20260909).ruleSeed,
  );
  assert.notEqual(
    hashSeed("orbita", 1, 20260908),
    hashSeed("orbita", 2, 20260908),
  );
  const a = new Game("daily", 1, { date: 20260908 }),
    b = new Game("daily", 2, { date: 20260908 });
  assert.deepEqual(a.config, b.config);
  assert.notDeepEqual(a.items, b.items);
});
test("daily challenge date remains the captured local start date", () => {
  const g = new Game("daily", 1, { date: 20260908 });
  g.update(1);
  assert.equal(g.config.dailyDate, 20260908);
  assert.equal(dailySeed(new Date(2026, 8, 8, 23, 59)), 20260908);
});
test("intensity increases smoothly; geometry and extra lanes spend density budget", () => {
  const c = sessionConfig("voyage"),
    values = [0, 15, 30, 40].map((t) => difficulty(c, t));
  assert.ok(
    values.every(
      (v, i) => i === 0 || v.speedMultiplier > values[i - 1].speedMultiplier,
    ),
  );
  assert.ok(
    Math.abs(
      difficulty(c, 15).speedMultiplier - difficulty(c, 15.01).speedMultiplier,
    ) < 0.005,
  );
  const eclipse = difficulty(
    sessionConfig("voyage", { world: 4, level: 2 }),
    30,
  );
  assert.ok(eclipse.complexity > values[2].complexity);
  assert.ok(eclipse.hazardDensity < values[2].hazardDensity);
  assert.ok(eclipse.maxSpeed <= 2.4);
});
test("Calma is slow, sparse, selectable and never loses from damage", () => {
  const g = new Game("zen", 1, { zenDuration: 180 });
  assert.equal(g.duration, 180);
  assert.ok(g.speed < 1);
  assert.ok(g.intensity.hazardDensity < 0.1);
  g.lives = 1;
  g.items = [
    { id: 99, angle: g.angle + 0.001, lane: 0, kind: "hazard", passed: false },
  ];
  g.update(0.1);
  assert.equal(g.lives, 1);
  assert.equal(g.done, false);
  g.stop();
  assert.equal(g.outcome, "finished");
});
test("continuous Calma and Infinito have no fixed time limit", () => {
  const z = new Game("zen", 1, { zenDuration: 0 });
  z.update(190);
  assert.equal(z.done, false);
  assert.equal(z.time, 190);
  const g = new Game("infinite", 3);
  assert.equal(g.duration, Infinity);
  assert.ok(
    difficulty(g.config, 300).speedMultiplier >
      difficulty(g.config, 10).speedMultiplier,
  );
});
test("fixed timestep preserves time and collisions at 15, 60 and 120 FPS", () => {
  const games = [15, 60, 120].map((fps) => {
    const g = new Game("zen", 66);
    for (let frame = 0; frame < fps * 60; frame++) g.update(1 / fps);
    return g;
  });
  for (const g of games) {
    assert.equal(g.time, 60);
    assert.equal(g.done, true);
    assert.equal(g.score, games[0].score);
    assert.equal(g.lights, games[0].lights);
    assert.equal(g.angle, games[0].angle);
  }
});
test("long active frames consume elapsed time rather than dropping it", () => {
  const a = new Game("zen", 4),
    b = new Game("zen", 4);
  a.update(2);
  for (let i = 0; i < 240; i++) b.update(1 / 120);
  assert.equal(a.time, 2);
  assert.equal(a.angle, b.angle);
  assert.equal(a.score, b.score);
});
test("negative and nonfinite dt cannot corrupt simulation", () => {
  const g = new Game("voyage", 1);
  g.update(NaN);
  g.update(Infinity);
  g.update(-1);
  assert.equal(g.time, 0);
});
test("pattern constraints hold over 45000 encounters", () => {
  for (let w = 0; w < 5; w++)
    for (let l = 0; l < 3; l++)
      for (let seed = 0; seed < 3; seed++) {
        const c = sessionConfig("voyage", { world: w, level: l }),
          gen = new PatternGenerator(c, seed);
        for (let i = 0; i < 1000; i++) {
          const t = i % 61,
            gate = gen.next(t);
          assert.ok(
            validateGate(gate, c.orbits.length, difficulty(c, t).maxSpeed),
          );
        }
      }
});
test("constraint validator rejects blocked safe lanes and unreachable spacing", () => {
  const c = sessionConfig("voyage"),
    gate = new PatternGenerator(c, 4).next(20);
  assert.equal(
    validateGate({ ...gate, blocked: [gate.safeLane] }, 2, 1),
    false,
  );
  assert.equal(validateGate({ ...gate, spacing: 0.01 }, 2, 2), false);
});
test("a structural gap damages when entered after its leading edge", () => {
  const g = new Game("voyage", 2, { world: 3 });
  g.items = [
    { id: 99, angle: g.angle, lane: 0, kind: "gap", passed: false, width: 0.4 },
  ];
  g.update(0.01);
  assert.equal(g.lives, 2);
});
test("three-lane switch is debounced and wraps in both directions", () => {
  const g = new Game("voyage", 1, { world: 1 });
  g.switch(-1);
  assert.equal(g.lane, 2);
  g.switch();
  assert.equal(g.lane, 2);
  g.update(0.2);
  g.switch();
  assert.equal(g.lane, 0);
});
test("a scheduled reversal is announced in advance and preserves valid items", () => {
  const g = new Game("voyage", 6, { world: 4, level: 2 });
  g.invincible = 100;
  g.update(18.5);
  assert.equal(g.reversalWarning, true);
  g.update(2);
  assert.equal(g.reversals, 1);
  assert.equal(g.direction, -1);
  assert.ok(
    g.items.every(
      (i) =>
        Number.isFinite(i.angle) && (i.angle - g.angle) * g.direction > -0.41,
    ),
  );
});
test("campaign demands both survival and light objective", () => {
  const g = new Game("voyage", 1);
  g.items = [];
  g.nextAngle = 1e9;
  g.update(50);
  assert.equal(g.outcome, "failed");
  const win = new Game("voyage", 1);
  win.lights = win.config.targetLights;
  win.invincible = 100;
  win.update(50);
  assert.equal(win.outcome, "cleared");
});
test("tutorial is independent, bounded, and has no farming reward", () => {
  const g = new Game("tutorial", 1);
  g.update(2);
  g.switch();
  g.update(30);
  assert.equal(g.time, 30);
  assert.equal(g.outcome, "cleared");
  const s = fresh();
  recordRun(s, g);
  assert.equal(s.tutorial, true);
  assert.equal(s.runs, 0);
  assert.equal(s.totalLights, 0);
  assert.equal(s.campaign[0].cleared[0], false);
});
test("Calma reward is lower and has a time-based farming cap", () => {
  assert.equal(earnedFragments({ mode: "zen", time: 60, lights: 100 }), 6);
  assert.equal(earnedFragments({ mode: "voyage", time: 60, lights: 100 }), 100);
  assert.equal(earnedFragments({ mode: "zen", time: 9, lights: 100 }), 0);
});
test("first-clear bonus is one-time and unlocks levels sequentially", () => {
  const s = fresh(),
    g = new Game("voyage", 1);
  g.lights = 20;
  g.invincible = 100;
  g.update(45);
  const first = recordRun(s, g);
  assert.equal(first.bonus, 20);
  assert.equal(levelUnlocked(s, 0, 1), true);
  assert.equal(levelUnlocked(s, 0, 2), false);
  assert.equal(recordRun(s, g).bonus, 0);
});
test("world unlocking requires fragments AND previous campaign mastery", () => {
  const s = fresh();
  s.totalLights = 1000;
  refreshUnlocks(s);
  assert.equal(s.unlockedWorlds[1], false);
  s.campaign[0].cleared = [true, true, true];
  refreshUnlocks(s);
  assert.equal(s.unlockedWorlds[1], true);
  assert.equal(s.unlockedWorlds[2], false);
});
test("v1 migration preserves worlds, fragments, preferences and legacy records", () => {
  const s = normalize({
    version: 1,
    totalLights: 700,
    best: 800,
    bestCombo: 15,
    world: 4,
    tutorial: true,
    sound: false,
    runs: 20,
    daily: { date: 20260908, best: 777 },
  });
  assert.equal(s.version, 2);
  assert.deepEqual(s.unlockedWorlds, [true, true, true, true, true]);
  assert.equal(s.world, 4);
  assert.equal(s.legacyBest, 800);
  assert.equal(s.totalLights, 700);
  assert.equal(s.tutorial, true);
  assert.equal(s.sound, false);
  assert.ok(s.campaign.every((p) => p.cleared.every((v) => !v)));
  assert.equal(todayRecord(s, 20260908).best, 0);
});
test("daily completion and scores persist separately across dates and attempts", () => {
  const s = fresh();
  markDailyPlayed(s, 20260908);
  markDailyPlayed(s, 20260908);
  assert.equal(todayRecord(s, 20260908).attempts, 2);
  const g = new Game("daily", 1, { date: 20260908 });
  g.invincible = 100;
  g.lights = 100;
  g.update(80);
  recordRun(s, g);
  markDailyPlayed(s, 20260909);
  assert.equal(todayRecord(s, 20260908).completed, true);
  assert.equal(todayRecord(s, 20260909).completed, false);
  assert.equal(todayRecord(s, 20260909).best, 0);
});
test("checkpointed Calma fragments are not credited again at settlement", () => {
  const s = fresh(),
    g = new Game("zen", 1);
  g.update(60);
  const earned = earnedFragments(g);
  s.totalLights = earned;
  recordRun(s, g, earned);
  assert.equal(s.totalLights, earned);
});
test("storage migration leaves v1 intact; corrupted v2 recovers; reset cannot resurrect it", () => {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, v),
      removeItem: (k: string) => map.delete(k),
    },
  });
  const old = JSON.stringify({ version: 1, totalLights: 201 });
  map.set("orbita.v1", old);
  const s = readSave();
  assert.equal(s.totalLights, 201);
  writeSave(s);
  s.totalLights++;
  writeSave(s);
  assert.equal(map.get("orbita.v1"), old);
  map.set("orbita.v2", "bad json");
  assert.equal(readSave().totalLights, 201);
  assert.ok(resetSave());
  map.set("orbita.v2", "bad json");
  assert.equal(readSave().totalLights, 0);
});
