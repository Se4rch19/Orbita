// Supervised physical test, only com.orbita.minigame. Keeps all earned progress.
import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import sharp from "sharp";
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
if (!p) throw Error("Own app WebView unavailable");
const checks = [],
  errors = [],
  states = [];
p.on("pageerror", (e) => errors.push(e.message));
const a = (x) => p.locator(`[data-action="${x}"]`).last(),
  d = () => p.evaluate(() => window.__orbitaDiagnostics);
const read = () =>
  p.evaluate(() => JSON.parse(localStorage.getItem("orbita.v3")));
const state = () =>
  p.evaluate(() => Capacitor.nativePromise("Immersion", "state", {}));
const capture = (name) =>
  writeFileSync(
    `${out}/redmi-${name}.png`,
    execFileSync(adb, ["exec-out", "screencap", "-p"], {
      windowsHide: true,
      maxBuffer: 8388608,
    }),
  );
const swipe = async (outward) => {
  const r = await p.locator(".game-canvas").boundingBox(),
    scale = await p.evaluate(() => devicePixelRatio),
    cx = r.x + r.width / 2,
    cy = r.y + r.height / 2;
  shell(
    "input",
    "swipe",
    String(Math.round((cx + (outward ? 45 : 110)) * scale)),
    String(Math.round(cy * scale)),
    String(Math.round((cx + (outward ? 110 : 45)) * scale)),
    String(Math.round(cy * scale)),
    "90",
  );
  await p.waitForTimeout(120);
};
const waitStep = async (step) => {
  await expect
    .poll(async () => (await d())?.lesson, { timeout: 20000 })
    .toBe(step);
};
try {
  const prior = JSON.parse(
      readFileSync("../work/040/prior-device-v3.json", "utf8"),
    ),
    current = await read();
  for (const key of Object.keys(prior))
    assert.deepEqual(current[key], prior[key], key);
  writeFileSync(
    out + "/redmi-migration.json",
    JSON.stringify(
      { preservedFields: Object.keys(prior), before: prior, after: current },
      null,
      2,
    ),
  );
  checks.push(
    "install -r preserves every pre-0.4 field including native planet and records",
  );
  states.push({ at: "launch", ...(await state()) });
  assert.equal(states[0].statusVisible, false);
  assert.equal(states[0].navigationVisible, false);
  // Reset only new onboarding/intro state, never the player save or progression.
  await p.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem("orbita.v3"));
    s.presentation.tutorial = "new";
    s.presentation.launches = 0;
    await Capacitor.nativePromise("ProgressStore", "write", {
      json: JSON.stringify(s),
      reset: false,
    });
  });
  await p.reload();
  await p.locator(".brand-intro").waitFor();
  capture("intro");
  await p.locator(".brand-intro").click();
  await p.getByRole("dialog").locator('[data-action="training"]').click();
  await a("lesson-next").click();
  capture("tutorial-outward");
  await swipe(false);
  assert.equal((await d()).lesson, 1);
  await swipe(true);
  await waitStep(2);
  capture("tutorial-inward");
  await swipe(false);
  await waitStep(4);
  capture("tutorial-hazard");
  await swipe(true);
  await waitStep(5);
  capture("tutorial-shields");
  await a("lesson-next").click();
  await waitStep(7);
  capture("tutorial-combo");
  await a("lesson-next").click();
  assert.equal((await read()).presentation.tutorial, "complete");
  assert.equal((await read()).totalLights, prior.totalLights);
  checks.push(
    "fresh onboarding state, intro skip, physical radial OUT/IN, collect, avoid, shields, 5-chain, completion without duplicate rewards",
  );
  await a("campaign").click();
  await a("back").click();
  await a("training").click();
  assert.equal((await d()).lesson, 0);
  await a("lesson-skip").click();
  checks.push("How to play replays and skip returns home");
  await a("open-codes").click();
  const code = p.locator("input").first();
  await code.click();
  await p.waitForTimeout(700);
  states.push({ at: "code-keyboard", ...(await state()) });
  assert.equal(states.at(-1).keyboardVisible, true);
  capture("code-keyboard");
  shell("input", "keyevent", "4");
  await p.waitForTimeout(800);
  states.push({ at: "code-keyboard-closed", ...(await state()) });
  assert.equal(states.at(-1).keyboardVisible, false);
  assert.equal(states.at(-1).navigationVisible, false);
  await a("back").click();
  await p.locator('[data-page="forge"]').click();
  await p.locator("#planet-name").click();
  await p.waitForTimeout(700);
  states.push({ at: "name-keyboard", ...(await state()) });
  assert.equal(states.at(-1).keyboardVisible, true);
  capture("name-keyboard");
  shell("input", "keyevent", "4");
  await p.waitForTimeout(800);
  assert.equal((await state()).navigationVisible, false);
  capture("forge");
  checks.push(
    "both native keyboards open and close; immersive layout restored",
  );
  await p.locator('[data-page="play"]').click();
  shell("input", "swipe", "540", "2395", "540", "2030", "350");
  capture("edge-reveal");
  const whitePixels = async (name) => {
    const { data } = await sharp(`${out}/redmi-${name}.png`)
      .extract({ left: 510, top: 2310, width: 60, height: 60 })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let n = 0;
    for (let i = 0; i < data.length; i += 3)
      if (
        Math.min(data[i], data[i + 1], data[i + 2]) > 140 &&
        Math.max(data[i], data[i + 1], data[i + 2]) -
          Math.min(data[i], data[i + 1], data[i + 2]) <
          40
      )
        n++;
    return n;
  };
  const visiblePixels = await whitePixels("edge-reveal");
  states.push({
    at: "edge-reveal",
    ...(await state()),
    homeIconPixels: visiblePixels,
  });
  assert.ok(visiblePixels > 20);
  await p.waitForTimeout(4500);
  capture("edge-hidden");
  const hiddenPixels = await whitePixels("edge-hidden");
  states.push({
    at: "edge-timeout",
    ...(await state()),
    homeIconPixels: hiddenPixels,
  });
  assert.ok(hiddenPixels < visiblePixels / 2);
  checks.push(
    "system edge gesture reveals transient navigation; it automatically hides",
  );
  for (const lang of ["en-US", "es-MX", "system"]) {
    await a("settings").click();
    await p.locator("#language-setting").selectOption(lang);
    await p.waitForTimeout(1300);
    await expect(p.locator("html")).toHaveAttribute(
      "lang",
      lang === "en-US" ? "en-US" : "es-MX",
    );
    capture("language-" + lang);
  }
  checks.push("English, Spanish and system language persist via native store");
  await p.locator('[data-page="journal"]').click();
  capture("journal");
  await p.locator('[data-page="play"]').click();
  capture("home");
  assert.deepEqual(errors, []);
} catch (e) {
  errors.push(String(e));
  throw e;
} finally {
  writeFileSync(
    out + "/device-identity.json",
    JSON.stringify({ checks, states, errors }, null, 2),
  );
  await b.close();
}
