import test from "node:test";
import assert from "node:assert/strict";
import {
  radialGesture,
  boundedLane,
  INPUT_COOLDOWN,
  TRANSITION_SECONDS,
  TOUCH_LATENCY_ALLOWANCE,
} from "../src/input.ts";
import { Game } from "../src/engine.ts";
import {
  mobileConfig,
  dailyMobile,
  journeyDestination,
  difficulty,
} from "../src/config.ts";
import { fresh3, normalize3 } from "../src/storage3.ts";
import { earnedFragments } from "../src/progression.ts";
import { settle } from "../src/progression3.ts";
import { ASSIST_FRAGMENT_MULTIPLIER } from "../src/mobile-state.ts";
import { themes, musicalNote, musicLayers } from "../src/music.ts";
import {
  encodeChallenge,
  encodeMobileChallenge,
  canonicalChallenge,
  decodeChallenge,
  challengeGame,
} from "../src/challenges.ts";
import { PatternGenerator, validateGate } from "../src/generator.ts";
import { pathPoint } from "../src/geometry.ts";
test("radial IN and OUT work at every angle around the planet", () => {
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI) / 18,
      c = { x: 160, y: 160 },
      p = (r: number) => ({
        x: c.x + Math.cos(a) * r,
        y: c.y + Math.sin(a) * r,
      });
    assert.equal(radialGesture(p(90), p(130), c), 1);
    assert.equal(radialGesture(p(130), p(90), c), -1);
  }
});
test("micro gestures and tangential swipes do not activate", () => {
  assert.equal(
    radialGesture({ x: 100, y: 0 }, { x: 110, y: 0 }, { x: 0, y: 0 }),
    0,
  );
  assert.equal(
    radialGesture({ x: 100, y: 0 }, { x: 0, y: 100 }, { x: 0, y: 0 }),
    0,
  );
  assert.equal(
    radialGesture({ x: NaN, y: 0 }, { x: 110, y: 0 }, { x: 0, y: 0 }),
    0,
  );
});
test("bounded lanes never wrap in two or three orbit games", () => {
  for (const n of [2, 3]) {
    const a = Array(n).fill(true);
    assert.equal(boundedLane(0, -1, a), 0);
    assert.equal(boundedLane(n - 1, 1, a), n - 1);
    assert.equal(boundedLane(0, 1, a), 1);
  }
  assert.equal(boundedLane(0, 1, [true, false, true]), 0);
});
test("rapid OUT OUT IN OUT IN is accepted one lane at a time", () => {
  const g = new Game("voyage", 8, { world: 1, mobile: true });
  const expected = [1, 2, 1, 2, 1];
  for (const [i, delta] of [1, 1, -1, 1, -1].entries()) {
    assert.ok(g.move(delta));
    assert.equal(g.lane, expected[i]);
    assert.equal(g.move(delta), false);
    g.update(INPUT_COOLDOWN + 1 / 60);
  }
  assert.ok(g.config.mobile);
});
test("mobile switch API also obeys limits and all standard profiles have at most three lanes", () => {
  for (let world = 0; world < 5; world++)
    for (let level = 0; level < 3; level++) {
      const g = new Game("voyage", 1, { world, level, mobile: true });
      assert.ok(g.config.orbits.length <= 3);
      assert.equal(g.switch(-1), false);
      g.lane = g.config.orbits.length - 1;
      assert.equal(g.switch(1), false);
    }
});
test("reaction budget covers input, transition, touch allowance and observation", () => {
  for (let world = 0; world < 5; world++)
    for (let level = 0; level < 3; level++) {
      const c = mobileConfig("voyage", { world, level }),
        d = difficulty(c, 50);
      assert.ok(
        d.minReaction >=
          INPUT_COOLDOWN + TRANSITION_SECONDS + TOUCH_LATENCY_ALLOWANCE + 0.2,
      );
      assert.ok(d.maxSpeed <= 2.8);
    }
});
test("assistance defaults off, migrates safely and locks in the session config", () => {
  const s = fresh3();
  assert.equal(s.mobile.assistance, false);
  const g = new Game("voyage", 8, {
    mobile: true,
    assistance: s.mobile.assistance,
  });
  s.mobile.assistance = true;
  assert.equal(g.config.assistance, false);
  const r = normalize3(JSON.parse(JSON.stringify(s)));
  assert.equal(r.mobile.assistance, true);
  assert.equal(
    normalize3({ version: 3, totalLights: 25 }).mobile.assistance,
    false,
  );
});
test("assistance pays half collected fragments and first completion bonuses", () => {
  for (const assisted of [false, true]) {
    const s = fresh3(),
      g = new Game("voyage", 4, { mobile: true, assistance: assisted });
    g.invincible = 100;
    g.lights = 20;
    g.update(46);
    const r = settle(s, g, { kind: "normal" })!;
    assert.equal(r.bonus, assisted ? 10 : 20);
    assert.equal(
      r.earned,
      Math.floor(g.lights * (assisted ? ASSIST_FRAGMENT_MULTIPLIER : 1)),
    );
    assert.equal(s.mobile.lastRunAssisted, assisted);
    assert.ok(s.totalLights >= r.earned + r.bonus);
  }
});
test("Calma checkpoint rewards use the same assistance multiplier", () => {
  const g = new Game("zen", 5, { mobile: true, assistance: true });
  g.lights = 40;
  g.update(60);
  assert.equal(earnedFragments(g), 3);
  const s = fresh3();
  s.totalLights = 3;
  settle(s, g, { kind: "normal" }, 3);
  assert.equal(s.totalLights, 3);
});
test("Daily identities and ordered tiers derive from opportunities across 120 dates", () => {
  for (let day = 0; day < 120; day++) {
    const q = dailyMobile(20261001 + day);
    assert.deepEqual(q, dailyMobile(20261001 + day));
    assert.ok(q.tiers[0] < q.tiers[1] && q.tiers[1] < q.tiers[2]);
    assert.ok(q.tiers[2] <= q.expected);
    assert.ok(q.expected >= 12);
    const c = mobileConfig("daily", { date: q.date });
    assert.equal(c.targetLights, q.tiers[0]);
    assert.deepEqual(c.dailyTiers, q.tiers);
  }
});
test("Daily attempts vary and highest tier persists", () => {
  const a = new Game("daily", 1, { date: 20260916, mobile: true }),
    b = new Game("daily", 2, { date: 20260916, mobile: true });
  assert.notDeepEqual(a.items, b.items);
  const s = fresh3();
  a.invincible = 100;
  a.lights = a.config.dailyTiers![2];
  a.update(80);
  settle(s, a, { kind: "normal" });
  assert.equal(s.mobile.daily[0].tier, 3);
  assert.equal(
    normalize3(JSON.parse(JSON.stringify(s))).mobile.daily[0].tier,
    3,
  );
});
test("Infinite transitions preserve score and shields and reset combo", () => {
  const g = new Game("infinite", 7, { mobile: true, journey: true, world: 0 });
  g.invincible = 1000;
  g.score = 400;
  g.lives = 2;
  g.update(50.1);
  assert.ok(g.transitionUntil > g.time);
  assert.equal(g.items.length, 0);
  const score = g.score;
  g.combo = 8;
  g.update(3.1);
  assert.equal(g.destination, 1);
  assert.equal(g.config.world, 1);
  assert.equal(g.lives, 2);
  assert.equal(g.score, score);
  assert.ok(g.time > 53);
  assert.ok(g.config.orbits.length === 3);
});
test("Infinite visits all worlds then validated Anomalies with bounded growing intensity", () => {
  const g = new Game("infinite", 17, { mobile: true, journey: true });
  g.invincible = 10000;
  for (let i = 0; i < 8; i++) {
    g.update(53.02);
    assert.equal(g.config.world, journeyDestination(i + 1).world);
    assert.equal(g.destination, i + 1);
    assert.ok(g.config.orbits.length <= 3);
    assert.ok(g.speed <= 2.8);
  }
  assert.ok(g.config.baseIntensity > 0.15);
});
test("Mi orbita keeps its chosen profile instead of becoming the journey", () => {
  const g = new Game("infinite", 4, { world: 3, mobile: true, journey: false });
  g.invincible = 1000;
  g.update(120);
  assert.equal(g.config.world, 3);
  assert.equal(g.destination, 0);
});
test("each world has a distinct valid musical identity and compatible notes", () => {
  assert.equal(themes.length, 5);
  assert.equal(new Set(themes.map((t) => t.name)).size, 5);
  for (let w = 0; w < 5; w++)
    for (let n = 0; n < 50; n++) {
      const f = musicalNote(w, n);
      assert.ok(Number.isFinite(f) && f > 100 && f < 2000);
    }
  assert.notDeepEqual(themes[0].motif, themes[1].motif);
});
test("adaptive music gains layers while Calma remains sparse", () => {
  assert.equal(musicLayers(0.1, 0, false).pulse, false);
  assert.equal(musicLayers(0.9, 15, false).peak, true);
  assert.equal(musicLayers(0.9, 15, false).combo, true);
  assert.equal(musicLayers(0.9, 0, true).arp, false);
  assert.equal(musicLayers(0.9, 0, true).pulse, false);
});
test("separate music and effects preferences survive v3 serialization", () => {
  const s = fresh3();
  s.mobile.music = false;
  s.mobile.effects = true;
  const r = normalize3(JSON.parse(JSON.stringify(s)));
  assert.equal(r.mobile.music, false);
  assert.equal(r.mobile.effects, true);
  const old = normalize3({ version: 3, totalLights: 50, sound: false });
  assert.equal(old.mobile.music, false);
  assert.equal(old.mobile.effects, false);
});
test("new codes version mobile rules while legacy codes retain exact identity", () => {
  const q = { seed: 12, world: 1, level: 2 },
    old = encodeChallenge(q),
    code = encodeMobileChallenge(q);
  assert.ok(old.startsWith("ORB-0302"));
  assert.ok(code.startsWith("ORB-0403"));
  assert.deepEqual(decodeChallenge(code), q);
  assert.equal(canonicalChallenge(old.toLowerCase()), old);
  assert.equal(challengeGame(old).config.mobile, undefined);
  assert.equal(challengeGame(code).config.mobile, true);
});
test("stress mobile: 2000 sessions and 200000 constrained encounters across five modes", () => {
  let gates = 0;
  for (let i = 0; i < 2000; i++) {
    const mode = (["voyage", "daily", "infinite", "zen", "voyage"] as const)[
        i % 5
      ],
      g = new Game(mode, i, {
        world: i % 5,
        level: i % 3,
        mobile: true,
        journey: mode === "infinite",
        date: 20260910 + (i % 30),
      });
    const gen = new PatternGenerator(g.config, i);
    let prior = 0;
    for (let n = 0; n < 100; n++) {
      const gate = gen.next(n),
        d = difficulty(g.config, n);
      assert.ok(validateGate(gate, g.config.orbits.length, d.maxSpeed));
      assert.ok(Math.abs(gate.safeLane - prior) <= 1);
      prior = gate.safeLane;
      gates++;
    }
    for (let n = 0; n < 180; n++) {
      g.move(n % 4 < 2 ? 1 : -1);
      g.update(0.1);
      g.events.length = 0;
      assert.ok(Number.isFinite(g.angle) && Number.isFinite(g.velocity));
      assert.ok(g.items.length < 40);
      for (const item of g.items) {
        assert.ok(item.lane >= 0 && item.lane < g.config.orbits.length);
        const point = pathPoint(g.config.orbits[item.lane], item.angle);
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      }
    }
  }
  assert.equal(gates, 200000);
});
