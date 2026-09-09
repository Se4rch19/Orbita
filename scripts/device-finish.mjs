import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { encodeMobileChallenge } from "../src/challenges.ts";
const out = "../outputs/Orbita-0.3.1/validation",
  adb = process.env.ORBITA_ADB ?? "../work/android-sdk/platform-tools/adb.exe";
const shell = (...args) =>
  execFileSync(adb, ["shell", ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
const b = await chromium.connectOverCDP("http://127.0.0.1:9223");
const p = b
  .contexts()
  .flatMap((c) => c.pages())
  .find((p) => p.url().startsWith("https://localhost"));
if (!p) throw Error("Orbita WebView not found");
const a = (x) => p.locator(`[data-action="${x}"]`).last(),
  d = () => p.evaluate(() => window.__orbitaDiagnostics),
  checks = [],
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const saveResult = () =>
  writeFile(
    out + "/device-final.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
const home = async () => {
  if ((await d())?.done) {
    await p
      .getByRole("dialog")
      .locator('[data-action="campaign"],[data-action="result-home"]')
      .click();
    if (await a("back").isVisible()) await a("back").click();
  } else {
    await a("pause").click();
    await a("abandon").click();
  }
};
const rms = () =>
  p.evaluate(() => {
    const a = window.__orbitaAudioProbe;
    if (!a) return 0;
    const data = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(data);
    return Math.sqrt(data.reduce((v, n) => v + n * n, 0) / data.length);
  });
try {
  await p.addInitScript(() => {
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest, ...rest) {
      const r = connect.call(this, dest, ...rest);
      if (dest instanceof AudioDestinationNode) {
        const a = this.context.createAnalyser();
        a.fftSize = 2048;
        connect.call(this, a);
        window.__orbitaAudioProbe = a;
      }
      return r;
    };
  });
  await p.reload();
  await a("settings").click();
  await p
    .getByRole("switch", { name: "Efectos de sonido", exact: true })
    .click();
  await a("close").click();
  await a("mobile-calm").click();
  await p.locator('[data-action="calm-start"][data-duration="60"]').click();
  await p.waitForTimeout(1500);
  const playing = await rms();
  assert.ok(playing > 0.00001);
  await a("pause").click();
  await p.waitForTimeout(1800);
  const paused = await rms();
  assert.ok(paused < playing * 0.08);
  await a("resume").click();
  await p.waitForTimeout(1200);
  assert.ok((await rms()) > paused * 2);
  checks.push({
    audio: {
      playingRms: playing,
      pausedRms: paused,
      note: "Measured WebAudio output with effects disabled; does not certify speaker volume or subjective listening.",
    },
  });
  await p.waitForTimeout(59000);
  assert.equal((await d()).done, true);
  await a("result-home").click();
  checks.push("physical 60-second Calma completed and saved");
  await saveResult();
  await a("settings").click();
  await p
    .getByRole("switch", { name: "Efectos de sonido", exact: true })
    .click();
  await p.getByRole("switch", { name: "Asistencia de anticipación" }).click();
  await p.locator("#control-setting").selectOption("classic");
  await a("close").click();
  await a("open-codes").click();
  await p
    .locator("#challenge-code")
    .fill(encodeMobileChallenge({ seed: 819, world: 1, level: 1 }));
  await a("code-play").click();
  assert.equal((await d()).assistance, true);
  const box = await p.locator(".game-canvas").boundingBox(),
    scale = await p.evaluate(() => devicePixelRatio),
    cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  for (const [delta, lane] of [
    [1, 1],
    [1, 2],
    [-1, 1],
    [1, 2],
    [-1, 1],
  ]) {
    shell(
      "input",
      "swipe",
      String(Math.round((cx + (delta > 0 ? 55 : 115)) * scale)),
      String(Math.round(cy * scale + 84)),
      String(Math.round((cx + (delta > 0 ? 115 : 55)) * scale)),
      String(Math.round(cy * scale + 84)),
      "70",
    );
    await p.waitForTimeout(100);
    assert.equal((await d()).lane, lane);
  }
  await p.mouse.click(cx + 20, cy);
  await p.waitForTimeout(150);
  assert.equal((await d()).lane, 0);
  await p.mouse.click(cx + box.width * 0.43, cy);
  await p.waitForTimeout(150);
  assert.equal((await d()).lane, 1);
  checks.push(
    "physical three-lane OUT OUT IN OUT IN, classic center/outer zones and locked assistance",
  );
  await p.screenshot({ path: out + "/redmi-three-lanes.png" });
  await home();
  await a("settings").click();
  await p.getByRole("switch", { name: "Asistencia de anticipación" }).click();
  await p.locator("#control-setting").selectOption("radial");
  await p.getByRole("switch", { name: "Música", exact: true }).click();
  await a("close").click();
  await a("mobile-daily").click();
  assert.equal((await d()).assistance, false);
  await p.waitForTimeout(1600);
  assert.equal((await d()).music.music, false);
  checks.push(
    "daily launched with three targets, music independently off, effects on",
  );
  await p.screenshot({ path: out + "/redmi-daily.png" });
  await p.waitForTimeout(76000);
  assert.equal((await d()).done, true);
  await a("result-home").click();
  await saveResult();
  await a("settings").click();
  await p.getByRole("switch", { name: "Música", exact: true }).click();
  await a("close").click();
  await a("open-codes").click();
  await p
    .locator("#challenge-code")
    .fill(encodeMobileChallenge({ seed: 111, world: 4, level: 2 }));
  await a("code-play").click();
  await p.waitForTimeout(4000);
  const frames = await p.evaluate(
    () =>
      new Promise((resolve) => {
        const ts = [];
        let last = performance.now();
        function f(t) {
          ts.push(t - last);
          last = t;
          if (ts.length < 300) requestAnimationFrame(f);
          else {
            ts.sort((a, b) => a - b);
            resolve({
              count: 300,
              median: ts[150],
              p95: ts[285],
              over33: ts.filter((x) => x > 33).length,
              music: window.__orbitaDiagnostics.music,
            });
          }
        }
        requestAnimationFrame(f);
      }),
  );
  checks.push({ eclipseFrames: frames });
  await p.screenshot({ path: out + "/redmi-eclipse.png" });
  await home();
  await p.locator('[data-action="page"][data-page="forge"]').click();
  assert.equal(
    await p.locator("#planet-name").inputValue(),
    "Redmi · mi universo",
  );
  await a("forge-save").click();
  await p.screenshot({ path: out + "/redmi-forge.png" });
  await a("personal-play").click();
  assert.equal((await d()).mode, "infinite");
  await p.waitForTimeout(3000);
  await home();
  await a("continue").click();
  await p.waitForTimeout(47000);
  assert.equal((await d()).done, true);
  await a("campaign").click();
  await a("back").click();
  checks.push(
    "Forja, saved planet, Mi Órbita and campaign playable on physical device",
  );
  const current = await p.evaluate(async () => ({
    web: JSON.parse(localStorage.getItem("orbita.v3")),
    native: JSON.parse((await Capacitor.Plugins.ProgressStore.read()).current),
  }));
  assert.equal(
    current.native.universe.planets[0].name,
    current.web.universe.planets[0].name,
  );
  assert.equal(current.native.mobile.controls, "radial");
  assert.equal(current.native.mobile.assistance, false);
  assert.equal(current.native.mobile.music, true);
  checks.push(
    "final native progress contains planet, records and restored default controls/audio",
  );
  await writeFile(
    "../work/031/device-before-restart.json",
    JSON.stringify(current.web),
  );
  await saveResult();
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await b.close();
}
