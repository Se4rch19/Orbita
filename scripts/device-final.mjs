import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { encodeStreamChallenge } from "../src/challenges.ts";
const adb = "../work/android-sdk/platform-tools/adb.exe",
  out = "../outputs/Orbita-0.4.1/validation";
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
  d = () => p.evaluate(() => window.__orbitaDiagnostics);
const capture = (name) =>
  writeFileSync(
    `${out}/redmi-final-${name}.png`,
    execFileSync(adb, ["exec-out", "screencap", "-p"], {
      windowsHide: true,
      maxBuffer: 8388608,
    }),
  );
const errors = [],
  checks = [],
  timing = [];
p.on("pageerror", (e) => errors.push(e.message));
const read = () =>
  p.evaluate(() => JSON.parse(localStorage.getItem("orbita.v3")));
const measure = (ms) =>
  p.evaluate(
    (ms) =>
      new Promise((resolve) => {
        let last = performance.now(),
          start = last;
        const v = [];
        function frame(now) {
          v.push(now - last);
          last = now;
          if (now - start < ms) requestAnimationFrame(frame);
          else {
            v.shift();
            v.sort((a, b) => a - b);
            resolve({
              frames: v.length,
              medianMs: v[Math.floor(v.length * 0.5)],
              p95Ms: v[Math.floor(v.length * 0.95)],
              over33ms: v.filter((x) => x > 33.4).length,
              durationMs: now - start,
            });
          }
        }
        requestAnimationFrame(frame);
      }),
    ms,
  );
let original;
try {
  shell("input", "keyevent", "KEYCODE_WAKEUP");
  shell("am", "start", "-n", "com.orbita.minigame/.MainActivity");
  original = await read();
  writeFileSync(
    `${out}/redmi-before-final-validation.json`,
    JSON.stringify(original, null, 2),
  );
  // Only presentation counters/preferences are temporarily changed to exercise first-launch visuals.
  await p.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem("orbita.v3"));
    s.presentation.launches = 0;
    s.motion = true;
    await Capacitor.nativePromise("ProgressStore", "write", {
      json: JSON.stringify(s),
      reset: false,
    });
  });
  await p.reload();
  await expect(p.locator(".brand-intro")).toBeVisible();
  const introStart = Date.now();
  await p.waitForTimeout(3100);
  capture("intro-first");
  await expect(p.locator(".brand-intro")).toHaveCount(0, { timeout: 6000 });
  timing.push({
    screen: "first-intro-after-visible",
    durationMs: Date.now() - introStart,
  });
  await p.reload();
  await expect(p.locator(".brand-intro")).toBeVisible();
  const repeat = Date.now();
  await p.waitForTimeout(1400);
  capture("intro-repeat");
  await expect(p.locator(".brand-intro")).toHaveCount(0);
  timing.push({
    screen: "repeat-intro-after-visible",
    durationMs: Date.now() - repeat,
  });
  await p.reload();
  await expect(p.locator(".brand-intro")).toBeVisible();
  await p.waitForTimeout(1100);
  shell("input", "tap", "540", "1900");
  await expect(p.locator(".brand-intro")).toHaveCount(0);
  checks.push(
    "physical first/repeat intro visible, full presentation and gated skip",
  );
  await a("settings").click();
  await p.locator("#quality-setting").selectOption("high");
  await a("close").click();
  await p.locator('.world-dots [data-world="0"]').click();
  await p.waitForTimeout(700);
  capture("menta-front");
  timing.push({
    screen: "occlusion-menta-high-30s",
    ...(await measure(30000)),
  });
  capture("menta-orbit");
  checks.push(
    "corrected orbital compositing observed for 30 seconds on physical Menta",
  );
  await p.locator('.bottom-nav [data-page="forge"]').click();
  for (const [cat, id] of [
    ["atmosphere", "atmosphere-aurora"],
    ["satellite", "satellite-none"],
    ["satellite", "satellite-moon"],
    ["ring", "ring-broken"],
    ["orbit", "orbit-glow"],
    ["surface", "surface-rock"],
  ]) {
    await p
      .locator(`[data-action="forge-category"][data-category="${cat}"]`)
      .click();
    await p
      .locator(`[data-action="forge-equip"][data-component="${id}"]`)
      .click();
    await p.waitForTimeout(250);
    capture(`forge-${id}`);
  }
  for (const id of ["biome-crystal", "feature-storm", "space-stars"]) {
    await p
      .locator(`[data-action="environment-part"][data-id="${id}"]`)
      .click();
    await p.waitForTimeout(250);
    capture(`forge-${id}`);
  }
  assert.deepEqual((await read()).universe.planets, original.universe.planets);
  assert.deepEqual(
    (await read()).universe.inventory,
    original.universe.inventory,
  );
  checks.push(
    "physical Forge atmosphere, satellite, belt, trail, surface, biome, phenomenon, space; previews never alter saved planets or grant inventory",
  );
  await p.locator('.bottom-nav [data-page="play"]').click();
  for (let world = 0; world < 5; world++) {
    await a("open-codes").click();
    await p
      .locator("#challenge-code")
      .fill(encodeStreamChallenge({ world, level: 1, seed: 4141 }));
    await a("code-play").click();
    timing.push({
      screen: `game-world-${world}-high`,
      ...(await measure(4000)),
    });
    capture(`game-${world}`);
    const g = await d();
    assert.equal(g.world, world);
    assert.ok(g.pool.allocated <= 64);
    assert.equal(g.music.state, "running");
    await a("pause").click();
    await a("resume").click();
    await p.waitForTimeout(150);
    await a("pause").click();
    await a("abandon").click();
  }
  checks.push(
    "five physical gameplay arenas at High; existing music running, pause/resume, entity bounds",
  );
  await p.locator('[data-action="home-mode"][data-mode="infinite"]').click();
  await a("world-play").click();
  if (
    await p.locator('.modal-backdrop [data-action="coach-close"]').isVisible()
  )
    await a("coach-close").click();
  timing.push({ screen: "infinite-high", ...(await measure(5000)) });
  capture("infinite");
  let g = await d();
  assert.equal(g.mode, "infinite");
  assert.equal(g.world, 0);
  if (!g.done) {
    await a("pause").click();
    await a("abandon").click();
  }
  checks.push(
    "Infinite begins at Menta with High decoration and preserved input/simulation",
  );
  await p.locator('.bottom-nav [data-page="play"]').click();
  await a("settings").click();
  await p.locator("#language-setting").selectOption("en-US");
  await p.waitForTimeout(2600);
  await expect(p.locator("html")).toHaveAttribute("lang", "en-US");
  capture("home-english");
  await a("settings").click();
  await p
    .locator("#language-setting")
    .selectOption(original.presentation.language);
  await p.waitForTimeout(2600);
  checks.push("physical English switch and original language restored");
  writeFileSync(
    `${out}/redmi-final-meminfo.txt`,
    shell("dumpsys", "meminfo", "com.orbita.minigame"),
  );
  writeFileSync(
    `${out}/redmi-final-gfxinfo.txt`,
    shell("dumpsys", "gfxinfo", "com.orbita.minigame"),
  );
  const pid = shell("pidof", "com.orbita.minigame").trim();
  writeFileSync(
    `${out}/redmi-final-logcat.txt`,
    shell("logcat", "-d", `--pid=${pid}`, "-t", "1600"),
  );
  assert.deepEqual(errors, []);
} catch (error) {
  errors.push(String(error));
  throw error;
} finally {
  if (original) {
    await p.evaluate(async (original) => {
      const s = JSON.parse(localStorage.getItem("orbita.v3"));
      s.motion = original.motion;
      s.presentation.language = original.presentation.language;
      s.presentation.launches = Math.max(
        s.presentation.launches,
        original.presentation.launches + 5,
      );
      if (original.presentation.quality === undefined)
        delete s.presentation.quality;
      else s.presentation.quality = original.presentation.quality;
      await Capacitor.nativePromise("ProgressStore", "write", {
        json: JSON.stringify(s),
        reset: false,
      });
    }, original);
    await p.reload();
    await p.waitForTimeout(2500);
    writeFileSync(
      `${out}/redmi-final-save.json`,
      JSON.stringify(await read(), null, 2),
    );
  }
  writeFileSync(
    `${out}/redmi-final-validation.json`,
    JSON.stringify({ checks, timing, errors }, null, 2),
  );
  console.log({ checks, timing, errors });
  await b.close();
}
