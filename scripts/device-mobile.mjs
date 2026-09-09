// Operates only the connected com.orbita.minigame debug WebView and its controls.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const adb =
    process.env.ORBITA_ADB ?? "../work/android-sdk/platform-tools/adb.exe",
  out = "../outputs/Orbita-0.3.1/validation";
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
const checks = [],
  samples = [],
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const a = (x) => p.locator(`[data-action="${x}"]`).last(),
  d = () => p.evaluate(() => window.__orbitaDiagnostics);
const read = () =>
  p.evaluate(() => JSON.parse(localStorage.getItem("orbita.v3")));
try {
  const native = await p.evaluate(async () =>
    JSON.parse((await Capacitor.Plugins.ProgressStore.read()).current),
  );
  assert.equal(native.universe.planets[0].name, "Redmi · mi universo");
  assert.equal(
    (await read()).universe.planets[0].name,
    native.universe.planets[0].name,
  );
  checks.push(
    "install -r preserved v3 planet; migrated native SharedPreferences matches web",
  );
  await a("mobile-calm").click();
  await p.locator('[data-action="calm-start"][data-duration="0"]').click();
  const box = await p.locator(".game-canvas").boundingBox(),
    scale = await p.evaluate(() => devicePixelRatio);
  // Physical display is 1080x2400; app WebView starts below the 84px status bar.
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const swipe = async (delta) => {
    const from = delta > 0 ? 55 : 115,
      to = delta > 0 ? 115 : 55;
    shell(
      "input",
      "swipe",
      String(Math.round((cx + from) * scale)),
      String(Math.round(cy * scale + 84)),
      String(Math.round((cx + to) * scale)),
      String(Math.round(cy * scale + 84)),
      "90",
    );
    await p.waitForTimeout(110);
  };
  for (const [delta, expected] of [
    [1, 1],
    [1, 1],
    [-1, 0],
    [-1, 0],
    [1, 1],
    [-1, 0],
  ]) {
    await swipe(delta);
    assert.equal((await d()).lane, expected);
  }
  checks.push("physical ADB radial OUT/IN and both non-wrapping endpoints");
  assert.equal((await d()).music.state, "running");
  await p.screenshot({ path: out + "/redmi-calm.png" });
  shell("input", "keyevent", "4");
  await p.waitForTimeout(300);
  const t = (await d()).time;
  await p.waitForTimeout(400);
  assert.equal((await d()).time, t);
  shell("input", "keyevent", "4");
  await p.waitForTimeout(300);
  assert.ok((await d()).time > t);
  checks.push("Android back pauses and resumes with frozen simulation");
  await a("pause").click();
  await a("abandon").click();
  await a("mobile-infinite").click();
  let last = -1,
    maxVoices = 0;
  const start = Date.now();
  while (Date.now() - start < 360000) {
    const g = await d();
    if (!g || g.done) break;
    maxVoices = Math.max(maxVoices, g.music.voices);
    if (g.destination !== last) {
      last = g.destination;
      const s = {
        time: g.time,
        world: g.world,
        destination: g.destination,
        score: g.score,
        lives: g.lives,
        music: g.music,
      };
      samples.push(s);
      console.log(JSON.stringify(s));
      await p.screenshot({ path: out + `/redmi-journey-${last}.png` });
      await writeFile(
        out + "/device-progress.json",
        JSON.stringify({ checks, samples, errors, maxVoices }, null, 2),
      );
    }
    const next = g.items
      .filter(
        (i) =>
          i.kind === "light" &&
          !i.passed &&
          (i.angle - g.angle) * g.direction > 0,
      )
      .sort((x, y) => (x.angle - y.angle) * g.direction)[0];
    if (
      next &&
      ((next.angle - g.angle) * g.direction) / Math.max(0.5, g.speed) < 0.95
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
      const crosses = g.items.some(
        (i) =>
          i.kind === "gap" &&
          !i.passed &&
          i.lane >= Math.min(g.radiusLane, target) - 0.43 &&
          i.lane <= Math.max(g.radiusLane, target) + 0.43 &&
          Math.abs(g.angle - i.angle) < (i.width ?? 0.32) / 2 + 0.05,
      );
      if (target !== g.lane && !crosses && g.transition <= g.time)
        await swipe(Math.sign(target - g.lane));
    }
    await p.waitForTimeout(65);
  }
  const final = await d();
  samples.push({
    final: true,
    time: final?.time,
    world: final?.world,
    destination: final?.destination,
    score: final?.score,
    lives: final?.lives,
    done: final?.done,
  });
  if (final && !final.done) {
    await a("pause").click();
    await a("abandon").click();
  } else if (final) await a("result-home").click();
  checks.push(
    "real-time automated touch journey; see reached destinations, no injected scores/lives/time",
  );
  await writeFile(
    out + "/device-mobile.json",
    JSON.stringify({ checks, samples, errors, maxVoices }, null, 2),
  );
  console.log(JSON.stringify({ checks, samples, errors, maxVoices }));
} finally {
  await b.close();
}
