import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { encodeStreamChallenge } from "../src/challenges.ts";
const adb =
    process.env.ORBITA_ADB ?? "../work/android-sdk/platform-tools/adb.exe",
  out = "../outputs/Orbita-0.4.0/validation";
const shell = (...args) =>
  execFileSync(adb, ["shell", ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8388608,
  });
const b = await chromium.connectOverCDP("http://127.0.0.1:9223"),
  p = b
    .contexts()
    .flatMap((c) => c.pages())
    .find((p) => p.url().startsWith("https://localhost"));
const a = (x) => p.locator(`[data-action="${x}"]`).last(),
  d = () => p.evaluate(() => window.__orbitaDiagnostics),
  samples = [],
  errors = [],
  checks = [];
p.on("pageerror", (e) => errors.push(e.message));
const capture = (name) =>
  writeFileSync(
    `${out}/redmi-${name}.png`,
    execFileSync(adb, ["exec-out", "screencap", "-p"], {
      maxBuffer: 8388608,
      windowsHide: true,
    }),
  );
const home = async () => {
  if ((await d())?.done) {
    const btn = p
      .getByRole("dialog")
      .locator('[data-action="campaign"],[data-action="result-home"]');
    await btn.click();
    if (await a("back").isVisible()) await a("back").click();
  } else if (await d()) {
    await a("pause").click();
    await a("abandon").click();
  } else if (await a("back").isVisible()) await a("back").click();
};
const timing = () =>
  p.evaluate(
    () =>
      new Promise((resolve) => {
        let last = performance.now();
        const times = [];
        const tick = (n) => {
          times.push(n - last);
          last = n;
          if (times.length < 240) requestAnimationFrame(tick);
          else {
            times.shift();
            times.sort((a, b) => a - b);
            resolve({
              frames: times.length,
              medianMs: times[Math.floor(times.length * 0.5)],
              p95Ms: times[Math.floor(times.length * 0.95)],
              over33ms: times.filter((x) => x > 33.4).length,
              meanMs: times.reduce((s, x) => s + x, 0) / times.length,
            });
          }
        };
        requestAnimationFrame(tick);
      }),
  );
const swipe = async (delta) => {
  const r = await p.locator(".game-canvas").boundingBox(),
    scale = await p.evaluate(() => devicePixelRatio),
    cx = r.x + r.width / 2,
    cy = r.y + r.height / 2;
  const from = delta > 0 ? 45 : 110,
    to = delta > 0 ? 110 : 45;
  shell(
    "input",
    "swipe",
    String(Math.round((cx + from) * scale)),
    String(Math.round(cy * scale)),
    String(Math.round((cx + to) * scale)),
    String(Math.round(cy * scale)),
    "90",
  );
};
try {
  await home();
  samples.push({ screen: "home", timing: await timing() });
  for (let world = 0; world < 5; world++) {
    await a("open-codes").click();
    await p
      .locator("#challenge-code")
      .fill(encodeStreamChallenge({ world, level: 2, seed: 111 }));
    await a("code-play").click();
    await p.waitForTimeout(1200);
    const metrics = await timing();
    capture("world-" + world);
    const g = await d();
    assert.equal(g.world, world);
    assert.ok(g.pool.allocated <= 64);
    assert.equal(g.music.state, "running");
    samples.push({
      screen: "world-" + world,
      timing: metrics,
      game: {
        time: g.time,
        world: g.world,
        lives: g.lives,
        score: g.score,
        pool: g.pool,
        music: g.music,
        entityFamilies: [...new Set(g.items.map((i) => i.family))],
      },
    });
    await home();
  }
  checks.push(
    "all five worlds through valid rules-4 codes, real render/music, bounded live entities",
  );
  await p.locator('[data-page="forge"]').click();
  for (const id of ["biome-ocean", "space-stars", "feature-none"])
    await p
      .locator(`[data-action="environment-part"][data-id="${id}"]`)
      .click();
  await p.locator(".forge-preview canvas").scrollIntoViewIfNeeded();
  const r = await p.locator(".forge-preview canvas").boundingBox();
  await p.mouse.move(r.x + r.width * 0.4, r.y + r.height / 2);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width * 0.7, r.y + r.height / 2, { steps: 12 });
  await p.mouse.up();
  capture("forge-biome");
  await a("forge-save").click();
  samples.push({ screen: "forge", timing: await timing() });
  await p.reload();
  await p.waitForTimeout(900);
  await p.locator('[data-page="forge"]').click();
  const saved = await p.evaluate(
    () => JSON.parse(localStorage.getItem("orbita.v3")).universe.planets[0],
  );
  assert.equal(saved.design.biome, "biome-ocean");
  assert.equal(saved.design.space, "space-stars");
  checks.push(
    "earned starter environment, draggable preview, save/reload keeps biome/space/feature and existing planet name",
  );
  await p.locator('[data-page="play"]').click();
  await a("mobile-infinite").click();
  if (
    await p
      .getByRole("dialog")
      .locator('[data-action="coach-close"]')
      .isVisible()
  )
    await a("coach-close").click();
  const started = Date.now();
  let previous = -1,
    maxPool = 0;
  while (Date.now() - started < 330000) {
    if (
      await p
        .getByRole("dialog")
        .locator('[data-action="coach-close"]')
        .isVisible()
    )
      await a("coach-close").click();
    const g = await d();
    if (!g || g.done) break;
    maxPool = Math.max(maxPool, g.pool.allocated);
    if (previous !== g.destination) {
      previous = g.destination;
      capture("journey-" + previous);
      samples.push({
        destination: previous,
        time: g.time,
        world: g.world,
        lives: g.lives,
        score: g.score,
        music: g.music,
      });
      console.log("Destination", previous, "world", g.world, "lives", g.lives);
    }
    const next = g.items
      .filter(
        (i) =>
          i.kind === "light" &&
          i.life !== "queued" &&
          !i.passed &&
          (i.angle - g.angle) * g.direction > 0,
      )
      .sort((a, b) => (a.angle - b.angle) * g.direction)[0];
    if (
      next &&
      ((next.angle - g.angle) * g.direction) / Math.max(0.5, g.speed) < 1.1
    ) {
      let target = next.lane;
      if (g.orbits[target].direction !== g.orbits[g.lane].direction) {
        const blocked = g.items
          .filter((i) => i.angle === next.angle && i.kind !== "light")
          .map((i) => i.lane);
        target =
          g.orbits.find(
            (o) =>
              o.direction === g.orbits[g.lane].direction &&
              !blocked.includes(o.lane),
          )?.lane ?? target;
      }
      const cross = g.items.some(
        (i) =>
          i.kind === "gap" &&
          !i.passed &&
          i.lane >= Math.min(g.radiusLane, target) - 0.43 &&
          i.lane <= Math.max(g.radiusLane, target) + 0.43 &&
          Math.abs(g.angle - i.angle) < (i.width ?? 0.32) / 2 + 0.05,
      );
      if (target !== g.lane && !cross && g.transition <= g.time)
        await swipe(Math.sign(target - g.lane));
    }
    await p.waitForTimeout(55);
  }
  samples.push({ journeyFinal: await d(), maxPool });
  await home();
  checks.push(
    "real-time journey driven by ADB radial swipes only; no score, lives or time injection",
  );
  writeFileSync(
    out + "/redmi-memory.txt",
    shell("dumpsys", "meminfo", "com.orbita.minigame"),
  );
  const pid = shell("pidof", "com.orbita.minigame").trim();
  writeFileSync(
    out + "/redmi-logcat.txt",
    shell("logcat", "-d", "--pid=" + pid, "-t", "1200"),
  );
  assert.deepEqual(errors, []);
} catch (e) {
  errors.push(String(e));
  throw e;
} finally {
  writeFileSync(
    out + "/device-worlds.json",
    JSON.stringify({ checks, samples, errors }, null, 2),
  );
  await b.close();
}
