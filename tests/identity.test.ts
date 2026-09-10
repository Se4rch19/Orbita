import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Game, type Item } from "../src/engine.ts";
import {
  EntityPool,
  appearance,
  FORM_SECONDS,
  DISSOLVE_SECONDS,
  STREAM_LIMIT,
  spawnClearance,
} from "../src/stream.ts";

test("queued entities are invisible and invalidation cannot make them flash", () => {
  const p = new EntityPool(),
    i = p.acquire(item(), 0);
  i.life = "queued";
  assert.equal(appearance(i, 0), 0);
  p.retire(i, 1);
  assert.equal(appearance(i, 1), 0);
  const list = [i];
  p.update(list, 1);
  assert.equal(list.length, 0);
});
test("variable forward reveals are independent of collecting the previous light", () => {
  const a = new Game("voyage", 82, {
    mobile: true,
    stream: true,
    world: 0,
    level: 2,
  });
  const b = new Game("voyage", 82, {
    mobile: true,
    stream: true,
    world: 0,
    level: 2,
  });
  b.lane = 1;
  b.radiusLane = 1;
  const trace = (g: Game, seen: Set<number>, events: unknown[]) => {
    for (const i of g.items) {
      if (i.revealDistance !== undefined && !seen.has(i.id)) {
        seen.add(i.id);
        events.push([i.id, i.formedAt, i.revealDistance]);
        assert.ok(i.revealDistance < Math.PI);
      }
    }
  };
  const sa = new Set<number>(),
    sb = new Set<number>(),
    ea: unknown[] = [],
    eb: unknown[] = [];
  for (let n = 0; n < 400; n++) {
    a.invincible = b.invincible = 100;
    trace(a, sa, ea);
    trace(b, sb, eb);
    a.update(0.1);
    b.update(0.1);
  }
  assert.deepEqual(ea, eb);
  assert.ok(ea.length > 25);
  assert.notEqual(a.lights, b.lights);
});
test("lights mix longer trails with near reveals, while hazards retain a reaction margin", () => {
  const g = new Game("voyage", 38, {
      mobile: true,
      stream: true,
      world: 3,
      level: 2,
    }),
    seen = new Set<number>();
  let far = 0,
    near = 0,
    hazards = 0;
  for (let n = 0; n < 500; n++) {
    g.invincible = 100;
    g.update(0.1);
    for (const i of g.items) {
      if (i.revealDistance === undefined || seen.has(i.id)) continue;
      seen.add(i.id);
      const reaction =
        (i.revealDistance - (i.width ?? 0) / 2) / (i.revealSpeed! + 0.12) -
        FORM_SECONDS;
      assert.ok(reaction >= g.intensity.minReaction + 0.1);
      assert.ok(i.revealDistance < Math.PI);
      if (i.kind === "light") {
        if (i.leadExtra! > 0.8) far++;
        else near++;
      } else hazards++;
    }
  }
  assert.ok(far > 5 && near > 5 && hazards > 5);
});
import { Lesson, lessonActions } from "../src/tutorial.ts";
import {
  freshPresentation,
  normalizePresentation,
  markSeen,
  introDuration,
} from "../src/presentation-state.ts";
import {
  dictionaries,
  variables,
  selectLanguage,
  resolveLanguage,
  t,
} from "../src/i18n.ts";
import {
  compatible,
  environmentParts,
  acquireExtra,
} from "../src/environment.ts";
import { fresh3, normalize3 } from "../src/storage3.ts";
import { defaultDesign, savePlanet } from "../src/forge.ts";
import {
  encodeStreamChallenge,
  encodeMobileChallenge,
  challengeGame,
} from "../src/challenges.ts";

const item = (): Item => ({
  id: 1,
  angle: 2,
  lane: 0,
  kind: "light",
  passed: false,
});
test("formation is noncollidable, monotonic and recycled only after dissolution", () => {
  const pool = new EntityPool(),
    i = pool.acquire(item(), 0),
    list = [i];
  assert.equal(i.life, "forming");
  assert.equal(appearance(i, 0), 0);
  assert.equal(appearance(i, FORM_SECONDS / 2), 0.5);
  pool.update(list, FORM_SECONDS);
  assert.equal(i.life, "active");
  pool.retire(i, 1);
  pool.retire(i, 1.1);
  assert.equal(i.retiredAt, 1);
  assert.ok(appearance(i, 1.1) > 0);
  pool.update(list, 1 + DISSOLVE_SECONDS + 0.001);
  assert.equal(list.length, 0);
  assert.equal(pool.free.length, 1);
  const reused = pool.acquire({ ...item(), id: 2 }, 2);
  assert.equal(reused, i);
  assert.equal(reused.passed, false);
  assert.equal(reused.retiredAt, undefined);
  assert.equal(pool.allocated, 1);
});
test("pool has a hard bound and returns every object to reusable storage", () => {
  const p = new EntityPool(),
    list = Array.from({ length: STREAM_LIMIT }, () => p.acquire(item(), 0));
  assert.throws(() => p.acquire(item(), 0), /capacity/);
  for (const i of list) p.retire(i, 0);
  p.update(list, 1);
  assert.equal(p.free.length, STREAM_LIMIT);
  assert.equal(list.length, 0);
});
test("safe envelope includes formation, full reaction window and closing comet velocity", () => {
  for (const peak of [0.8, 1.5, 2.5, 3.5])
    for (const reaction of [0.5, 0.7, 1]) {
      assert.ok(
        spawnClearance(peak, reaction) / (peak + 0.12) - FORM_SECONDS >=
          reaction + 0.139,
      );
    }
});
test("forming hazards cannot hit or collect and reversal never respawns beside player", () => {
  const g = new Game("voyage", 42, {
    mobile: true,
    stream: true,
    world: 4,
    level: 2,
  });
  for (const i of g.items)
    assert.ok((i.angle - g.angle) * g.direction >= g.clearance - 1e-9);
  const danger = g.pool.acquire(
    { ...item(), id: 999, kind: "hazard", angle: g.angle + 0.01 },
    g.time,
  );
  g.items.push(danger);
  g.update(0.1);
  assert.equal(g.lives, 3);
  g.rebase(-1);
  for (const i of g.items.filter((i) => !i.passed))
    assert.ok((i.angle - g.angle) * g.direction >= g.clearance - 1e-8);
});
test("new challenge format selects stream while old mobile challenge retains rules", () => {
  const q = { seed: 123, world: 4, level: 2 };
  assert.equal(challengeGame(encodeStreamChallenge(q)).config.stream, true);
  assert.equal(challengeGame(encodeMobileChallenge(q)).config.stream, false);
  assert.equal(encodeStreamChallenge(q), encodeStreamChallenge(q));
});
test("hazard families are mechanically distinct and introduced by world", () => {
  const seen = new Map<number, Set<string>>();
  for (let w = 0; w < 5; w++) {
    const set = new Set<string>();
    seen.set(w, set);
    for (let seed = 0; seed < 50; seed++) {
      const g = new Game("voyage", seed, {
        world: w,
        level: 2,
        mobile: true,
        stream: true,
      });
      g.invincible = 100;
      g.update(10);
      for (const i of g.items) {
        set.add(i.family!);
        if (i.family === "comet") assert.ok(Math.abs(i.drift!) > 0);
        if (i.family === "arc") {
          assert.equal(i.kind, "gap");
          assert.equal(i.width, 0.24);
        }
      }
    }
  }
  assert.ok(seen.get(0)!.has("shard"));
  assert.ok(!seen.get(0)!.has("comet"));
  assert.ok(seen.get(1)!.has("drifter"));
  assert.ok(seen.get(2)!.has("arc"));
  assert.ok(seen.get(3)!.has("fracture"));
  assert.ok(seen.get(4)!.has("comet"));
});
test("tutorial advances only on each required action and remains complete", () => {
  const l = new Lesson();
  for (const expected of lessonActions) {
    const step = l.step;
    for (const wrong of lessonActions.filter((x) => x !== expected))
      assert.equal(l.accept(wrong), false);
    assert.equal(l.step, step);
    assert.equal(l.accept(expected), true);
  }
  assert.equal(l.finished, true);
  assert.equal(l.accept("next"), false);
});
test("tutorial replay scene keeps the simulation gated and population bounded", () => {
  const g = new Game("tutorial", 1, { mobile: true, stream: true });
  g.teachingScene();
  assert.equal(g.items.length, 1);
  for (let n = 0; n < 100; n++) {
    g.teachingScene(n % 2 === 0);
    g.update(1);
  }
  assert.ok(g.pool.allocated < STREAM_LIMIT);
  assert.equal(g.done, false);
});
test("tutorial and contextual guide state survives normalization without repeated offers", () => {
  const p = freshPresentation();
  assert.equal(p.tutorial, "new");
  assert.equal(markSeen(p, "world-2"), true);
  assert.equal(markSeen(p, "world-2"), false);
  p.tutorial = "complete";
  p.language = "en-US";
  const q = normalizePresentation(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(q, p);
  assert.equal(normalizePresentation(null, true).tutorial, "legacy");
  assert.deepEqual(
    normalizePresentation({ seen: ["wrong", "world-2", "world-2"] }).seen,
    ["world-2"],
  );
});
test("intro is bounded, shorter on return, optional with reduced motion", () => {
  const p = freshPresentation();
  assert.equal(introDuration(p, true), 1400);
  p.launches = 1;
  assert.equal(introDuration(p, true), 450);
  assert.equal(introDuration(p, false), 0);
});
test("every localized key and interpolation is present in both languages", () => {
  assert.deepEqual(
    Object.keys(dictionaries["es-MX"]).sort(),
    Object.keys(dictionaries["en-US"]).sort(),
  );
  for (const [key, value] of Object.entries(dictionaries["es-MX"])) {
    assert.deepEqual(
      variables(value),
      variables(dictionaries["en-US"][key]),
      key,
    );
    for (const loc of ["es-MX", "en-US"] as const) {
      selectLanguage(loc);
      const rendered = t(
        key,
        Object.fromEntries(variables(value).map((v) => [v, "sample"])),
      );
      assert.ok(!/\{p\d+\}|m_[a-f0-9]{10}/.test(rendered), key);
    }
  }
  selectLanguage("es-MX");
});
test("language switching is reversible and unsupported system locales fall back to English", () => {
  assert.equal(resolveLanguage("system", "es-ES"), "es-MX");
  assert.equal(resolveLanguage("system", "ja-JP"), "en-US");
  assert.equal(resolveLanguage("es-MX", "en-US"), "es-MX");
  selectLanguage("en-US");
  assert.equal(t("action.use"), "Use");
  selectLanguage("es-MX");
  assert.equal(t("action.use"), "Usar");
  assert.throws(() => t("missing.key"), /Missing localization key/);
  assert.throws(() => t("welcome.copy"), /variable/);
});
test("curated combinations reject incompatible surfaces in either selection order", () => {
  const d = defaultDesign();
  assert.equal(
    compatible({ ...d, surface: "surface-ice" }, "biome-lava"),
    false,
  );
  assert.equal(
    compatible(
      { ...d, biome: "biome-lava", surface: "surface-ice" },
      "surface-ice",
    ),
    false,
  );
  assert.equal(
    compatible({ ...d, biome: "biome-dunes" }, "feature-islands"),
    false,
  );
  assert.equal(
    compatible({ ...d, surface: "surface-ice" }, "biome-ocean"),
    true,
  );
});
test("environment components require earned accomplishments and cannot be bought twice", () => {
  const s = fresh3();
  assert.equal(environmentParts.length, 15);
  assert.equal(acquireExtra(s, "biome-lava"), false);
  s.totalLights = 100;
  s.mobile.daily.push({
    date: 20260910,
    attempts: 1,
    tier: 2,
    best: 200,
    assisted: false,
  });
  assert.equal(acquireExtra(s, "biome-lava"), true);
  assert.equal(acquireExtra(s, "biome-lava"), false);
  assert.equal(s.universe.spent, 20);
});
test("new biome/background/feature survive planet save and v3 round trip", () => {
  const s = fresh3();
  s.presentation.owned.push("space-nebula", "feature-storm");
  const d = {
    ...defaultDesign(),
    biome: "biome-ocean",
    space: "space-nebula",
    feature: "feature-storm",
  };
  assert.ok(savePlanet(s, 0, "Mi universo", d));
  const loaded = normalize3(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(loaded.universe.planets[0].design, d);
});
test("real Redmi 0.3.1 fixture retains records, inventory, planets and mobile preferences", () => {
  const old = JSON.parse(
    readFileSync(
      new URL("./fixtures/redmi-0.3.1.json", import.meta.url),
      "utf8",
    ),
  );
  const next = normalize3(old);
  for (const key of Object.keys(old))
    assert.deepEqual(
      (next as unknown as Record<string, unknown>)[key],
      old[key],
      key,
    );
  assert.equal(next.presentation.tutorial, "legacy");
  assert.equal(next.presentation.language, "system");
});
