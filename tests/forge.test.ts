import test from "node:test";
import assert from "node:assert/strict";
import {
  components,
  categories,
  defaultDesign,
  conditionMet,
  acquire,
  balance,
  savePlanet,
  safeName,
  normalizeDesign,
  discover,
  slotLimit,
} from "../src/forge.ts";
import {
  fresh3,
  normalize3,
  readSave,
  writeSave,
  resetSave,
} from "../src/storage3.ts";
import {
  encodeChallenge,
  decodeChallenge,
  challengeGame,
  checksum,
  anomaly,
  resultText,
} from "../src/challenges.ts";
import { settle } from "../src/progression3.ts";
import { Game } from "../src/engine.ts";
import { sessionConfig, difficulty } from "../src/config.ts";
import { PatternGenerator, validateGate } from "../src/generator.ts";
import { pathPoint, radiusAt } from "../src/geometry.ts";
test("catalog has seven complete categories, unique IDs and bounded visuals", () => {
  assert.equal(Object.keys(categories).length, 7);
  assert.equal(new Set(components.map((c) => c.id)).size, components.length);
  assert.ok(components.length <= 40);
  for (const cat of Object.keys(categories))
    assert.ok(components.filter((c) => c.category === cat).length >= 3);
  for (const c of components) {
    assert.ok(c.cost >= 0);
    if (c.visual.shape) {
      assert.ok(c.visual.shape.deformation <= 0.13);
      assert.ok(c.visual.shape.lobes <= 6);
    }
    assert.ok((c.visual.count ?? 0) <= 2);
  }
});
test("unlock requirements are deterministic and earned across modes", () => {
  const s = fresh3();
  assert.equal(conditionMet(s, { kind: "world", value: 0 }), false);
  s.campaign[0].cleared.fill(true);
  assert.equal(conditionMet(s, { kind: "world", value: 0 }), true);
  s.universe.stats.infiniteSeconds = 90;
  assert.equal(conditionMet(s, { kind: "infinite", value: 90 }), true);
  s.universe.stats.dailyDates = [20260909];
  assert.equal(conditionMet(s, { kind: "daily", value: 1 }), true);
});
test("spending requires progress and balance; never removes lifetime world progress", () => {
  const s = fresh3();
  assert.equal(acquire(s, "shape-square"), false);
  s.totalLights = 80;
  assert.equal(acquire(s, "shape-square"), true);
  assert.equal(balance(s), 60);
  assert.equal(s.totalLights, 80);
  assert.equal(acquire(s, "shape-square"), false);
  assert.equal(s.universe.spent, 20);
  s.universe.spent = 80;
  assert.equal(acquire(s, "surface-rock"), false);
  assert.equal(balance(s), 0);
  assert.equal(acquire(s, "unknown"), false);
});
test("milestone rewards and free components are granted once", () => {
  const s = fresh3();
  s.tutorial = true;
  assert.ok(discover(s).length);
  assert.equal(s.totalLights, 10);
  assert.ok(s.universe.inventory.includes("shape-blob"));
  discover(s);
  assert.equal(s.totalLights, 10);
  assert.equal(s.universe.milestones.filter((x) => x === "training").length, 1);
});
test("category mismatch, unknown and locked equipment fall back safely", () => {
  const d = defaultDesign(),
    s = fresh3();
  assert.deepEqual(
    normalizeDesign(
      { shape: "palette-mint", surface: "surface-ice", palette: "invented" },
      s.universe.inventory,
    ),
    d,
  );
  assert.deepEqual(normalizeDesign(null, []), d);
});
test("names strip markup, control characters and obey 24-character limit", () => {
  assert.equal(safeName("  <Luna>\u0000  "), "Luna");
  assert.equal(safeName(" "), "Mi pequeño mundo");
  assert.equal(safeName("x".repeat(100)).length, 24);
  assert.equal(safeName("\u202eEstrella"), "Estrella");
});
test("planet slots, selection and serialization survive reload", () => {
  const s = fresh3();
  assert.ok(savePlanet(s, 0, "Mi marea", defaultDesign()));
  assert.equal(savePlanet(s, 1, "No", defaultDesign()), false);
  s.totalLights = 300;
  assert.equal(slotLimit(s), 3);
  assert.equal(savePlanet(s, 2, "Salto", defaultDesign()), false);
  assert.ok(savePlanet(s, 1, "Luna", defaultDesign()));
  assert.ok(savePlanet(s, 2, "Sol", defaultDesign()));
  const r = normalize3(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(r.universe.planets, s.universe.planets);
  assert.equal(r.universe.selected, 2);
  assert.equal(r.universe.stats.created, 3);
});
test("v1 migrates through original v2 rules into v3 without erasing old worlds", () => {
  const s = normalize3({
    version: 1,
    totalLights: 700,
    best: 800,
    world: 4,
    sound: false,
  });
  assert.equal(s.version, 3);
  assert.equal(s.legacyBest, 800);
  assert.equal(s.world, 4);
  assert.equal(s.sound, false);
  assert.ok(s.unlockedWorlds.every(Boolean));
  assert.equal(s.universe.spent, 0);
  assert.equal(balance(s), 700);
});
test("v2 campaign and daily history migrate while unknown playtime stays zero", () => {
  const old = fresh3();
  old.version = 2;
  old.campaign[0].cleared.fill(true);
  old.totalLights = 130;
  old.infiniteBest = 600;
  old.daily = {
    date: 20260908,
    best: 20,
    played: true,
    completed: true,
    attempts: 1,
    rules: 2,
  };
  const s = normalize3(old);
  assert.ok(s.campaign[0].cleared.every(Boolean));
  assert.equal(s.infiniteBest, 600);
  assert.deepEqual(s.universe.stats.dailyDates, [20260908]);
  assert.equal(s.universe.stats.seconds, 0);
  discover(s);
  assert.ok(s.universe.inventory.includes("palette-peach"));
});
test("malformed v3 custom data is bounded and cannot create invalid geometry", () => {
  const s = normalize3({
    version: 3,
    totalLights: 20,
    universe: {
      spent: Infinity,
      inventory: ["bad", "palette-mint"],
      selected: 99,
      planets: [{ name: "<x>", design: { shape: { lobes: 999 } } }, null],
      stats: { seconds: Infinity, dailyDates: [null, -1, "date"] },
      challenges: [{ code: "bad" }],
    },
  });
  assert.equal(balance(s), 20);
  assert.equal(s.universe.planets.length, 1);
  assert.equal(s.universe.selected, 0);
  assert.deepEqual(s.universe.planets[0].design, defaultDesign());
  assert.equal(s.universe.stats.seconds, 0);
  assert.equal(s.universe.challenges.length, 0);
});
test("v3 backup recovery retains v2 original; reset cannot resurrect older saves", () => {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, v),
      removeItem: (k: string) => map.delete(k),
    },
  });
  const old = JSON.stringify({ version: 2, totalLights: 200 });
  map.set("orbita.v2", old);
  const s = readSave();
  assert.equal(s.version, 3);
  writeSave(s);
  s.totalLights = 201;
  writeSave(s);
  map.set("orbita.v3", "broken");
  assert.equal(readSave().totalLights, 200);
  assert.equal(map.get("orbita.v2"), old);
  assert.ok(resetSave());
  map.set("orbita.v3", "broken");
  assert.equal(readSave().totalLights, 0);
});
test("future and structurally corrupt root saves use backup", () => {
  const map = new Map([
    ["orbita.v3", "{}"],
    ["orbita.v3.backup", JSON.stringify({ ...fresh3(), totalLights: 45 })],
  ]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (k: string) => map.get(k) ?? null },
  });
  assert.equal(readSave().totalLights, 45);
  map.set("orbita.v3", JSON.stringify({ version: 4, totalLights: 999 }));
  assert.equal(readSave().totalLights, 45);
});
test("codes roundtrip boundary seeds and all rule profiles", () => {
  for (let world = 0; world < 5; world++)
    for (let level = 0; level < 3; level++)
      for (const seed of [0, 1, 0x7fffffff, 0xffffffff]) {
        const q = { world, level, seed };
        assert.deepEqual(decodeChallenge(encodeChallenge(q).toLowerCase()), q);
      }
});
test("codes reject corruption, oversized, malformed, unsupported and invalid profiles", () => {
  const code = encodeChallenge({ seed: 1, world: 0, level: 0 });
  assert.throws(() => decodeChallenge(code.slice(0, -1) + "0"));
  assert.throws(() => decodeChallenge("x".repeat(81)));
  assert.throws(() => decodeChallenge("<script>"));
  assert.throws(() => encodeChallenge({ seed: -1, world: 0, level: 0 }));
  const make = (b: number[]) => {
    const crc = checksum(b);
    return (
      "ORB-" +
      [...b, crc >>> 8, crc & 255]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
        .match(/.{4}/g)!
        .join("-")
    );
  };
  assert.throws(
    () => decodeChallenge(make([4, 2, 0, 0, 0, 0, 0, 1])),
    /versión/,
  );
  assert.throws(() => decodeChallenge(make([3, 2, 9, 0, 0, 0, 0, 1])));
});
test("a code reproduces initial route and full fixed-input simulation", () => {
  const code = encodeChallenge({ seed: 781, world: 4, level: 2 }),
    a = challengeGame(code),
    b = challengeGame(code);
  assert.deepEqual(a.items, b.items);
  for (let i = 0; i < 4000; i++) {
    if (i % 53 === 0) {
      a.switch();
      b.switch();
    }
    a.update(1 / 60);
    b.update(1 / 60);
  }
  assert.deepEqual(
    [a.score, a.angle, a.lives, a.time, a.items],
    [b.score, b.angle, b.lives, b.time, b.items],
  );
});
test("coded results are isolated, bounded, persistent and have no resource rewards", () => {
  const s = fresh3(),
    code = encodeChallenge({ world: 0, level: 0, seed: 3 }),
    g = challengeGame(code);
  g.invincible = 100;
  g.lights = 30;
  g.update(50);
  const r = settle(s, g, { kind: "code", code });
  assert.equal(r?.earned, 0);
  assert.equal(s.totalLights, 0);
  assert.equal(s.runs, 0);
  assert.ok(s.campaign[0].cleared.every((x) => !x));
  assert.equal(s.universe.challenges.length, 1);
  assert.equal(settle(s, g, { kind: "code", code }), null);
  assert.equal(
    normalize3(JSON.parse(JSON.stringify(s))).universe.challenges[0].code,
    code,
  );
  assert.match(resultText(code, g), /×/);
});
test("personal rules and seeded routes do not depend on appearance", () => {
  const s = fresh3();
  savePlanet(s, 0, "Cosmos", defaultDesign());
  s.universe.inventory.push("shape-triangle");
  s.universe.planets[0].design.shape = "shape-triangle";
  const a = new Game("infinite", 82, { world: 2, level: 0 }),
    b = new Game("infinite", 82, { world: 2, level: 0 });
  assert.deepEqual(a.config, b.config);
  assert.deepEqual(a.items, b.items);
});
test("personal records do not overwrite normal Infinito or campaign", () => {
  const s = fresh3(),
    g = new Game("infinite", 55);
  g.update(400);
  assert.ok(g.done);
  settle(s, g, { kind: "personal" });
  assert.equal(s.infiniteBest, 0);
  assert.equal(s.universe.personalBest[0], g.score);
  assert.equal(s.runs, 1);
});
test("daily bonus is awarded only on first completion of a date", () => {
  const s = fresh3();
  for (let i = 0; i < 2; i++) {
    const g = new Game("daily", i, { date: 20260909 });
    g.invincible = 100;
    g.lights = 50;
    g.update(80);
    const r = settle(s, g, { kind: "normal" });
    assert.equal(r?.bonus, i === 0 ? 15 : 0);
  }
  assert.deepEqual(s.universe.stats.dailyDates, [20260909]);
});
test("unfinished and already-settled sessions cannot award milestones twice", () => {
  const s = fresh3(),
    g = new Game("tutorial", 1);
  assert.equal(settle(s, g, { kind: "normal" }), null);
  g.switch();
  g.lights = 2;
  g.update(31);
  settle(s, g, { kind: "normal" });
  const total = s.totalLights;
  settle(s, g, { kind: "normal" });
  assert.equal(s.totalLights, total);
  assert.equal(total, 10);
});
test("anomaly structure is deterministic, varies by attempt and stays within known worlds", () => {
  for (let tier = 0; tier < 200; tier++) {
    const a = anomaly(tier, 1),
      b = anomaly(tier, 2);
    assert.deepEqual(a, anomaly(tier, 1));
    assert.equal(a.world, b.world);
    assert.equal(a.level, b.level);
    assert.notEqual(a.seed, b.seed);
    assert.ok(a.world >= 0 && a.world < 5);
    assert.ok(a.level >= 0 && a.level <= 2);
  }
  assert.throws(() => anomaly(-1, 1));
});
test("anomaly victory advances once and never alters campaign clears", () => {
  const s = fresh3(),
    q = anomaly(0, 1),
    g = new Game("voyage", q.seed, q);
  g.invincible = 100;
  g.lights = 40;
  g.update(61);
  const r = settle(s, g, { kind: "anomaly", tier: 0 });
  assert.equal(r?.bonus, 20);
  assert.equal(s.universe.anomalyTier, 1);
  assert.ok(s.campaign.every((p) => p.cleared.every((x) => !x)));
  assert.equal(settle(s, g, { kind: "anomaly", tier: 0 }), null);
});
test("procedural stress: 1500 sessions, 150000 gates, code/custom/anomaly contexts", () => {
  let gates = 0;
  for (let index = 0; index < 1500; index++) {
    const q =
      index % 3 === 0
        ? anomaly(index, index + 10)
        : { world: index % 5, level: index % 3, seed: index * 31 };
    const code = encodeChallenge(q);
    const g =
      index % 3 === 1
        ? new Game("infinite", q.seed, { world: q.world, level: 0 })
        : challengeGame(code);
    const generator = new PatternGenerator(g.config, q.seed);
    for (let i = 0; i < 100; i++) {
      const d = difficulty(g.config, i),
        gate = generator.next(i);
      assert.ok(validateGate(gate, g.config.orbits.length, d.maxSpeed));
      assert.ok(d.maxSpeed <= 2.4);
      gates++;
    }
    for (let step = 0; step < 180; step++) {
      if (step % 13 === 0) g.switch();
      g.update(0.1);
      g.events.length = 0;
      assert.ok(Number.isFinite(g.angle) && Number.isFinite(g.velocity));
      assert.ok(g.items.length < 40);
      for (const item of g.items) {
        assert.ok(Number.isFinite(item.angle));
        assert.ok(item.lane >= 0 && item.lane < g.config.orbits.length);
      }
    }
    for (const o of g.config.orbits) {
      const p = pathPoint(o, index);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
    const save = fresh3();
    save.totalLights = g.lights;
    assert.equal(
      normalize3(JSON.parse(JSON.stringify(save))).totalLights,
      g.lights,
    );
  }
  assert.equal(gates, 150000);
});
test("all cosmetic shape samples stay inside the gameplay corridor", () => {
  for (const c of components.filter((c) => c.category === "shape"))
    for (let i = 0; i < 1000; i++) {
      const r = radiusAt(c.visual.shape!, 77, (i / 1000) * Math.PI * 2);
      assert.ok(Number.isFinite(r) && r > 60 && r < 90);
    }
});
