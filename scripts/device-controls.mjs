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
const samples = [],
  coverage = new Set(),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const start = async () => {
  await p.reload();
  await p.waitForTimeout(2350);
  await a("open-codes").click();
  await p
    .locator("#challenge-code")
    .fill(encodeStreamChallenge({ world: 4, level: 1, seed: 194 }));
  await a("code-play").click();
  if (
    await p.locator('.modal-backdrop [data-action="coach-close"]').isVisible()
  )
    await a("coach-close").click();
  await expect(p.locator(".game-canvas")).toBeVisible();
};
async function swipe(dx, dy) {
  const r = await p.locator(".game-canvas").boundingBox(),
    scale = await p.evaluate(() => devicePixelRatio);
  const x = r.x + r.width * 0.5,
    y = r.y + r.height * 0.5;
  shell(
    "input",
    "swipe",
    ...[x, y, x + dx, y + dy].map((v) => String(Math.round(v * scale))),
    "85",
  );
  await p.waitForTimeout(50);
}
try {
  await start();
  const gestures = [
    ["right", 35, 0, 1],
    ["up", 0, -35, 1],
    ["left", -35, 0, -1],
    ["down", 0, 35, -1],
  ];
  for (let i = 0; i < 280 && coverage.size < 32; i++) {
    let before = await d();
    if (!before || before.done) {
      await start();
      before = await d();
    }
    const [name, dx, dy, delta] = gestures[(Math.floor(i / 7) + i * 3) % 4];
    const next = before.lane + delta,
      expected =
        next >= 0 && next < before.orbits.length && before.orbits[next].active
          ? next
          : before.lane;
    await swipe(dx, dy);
    const after = await d();
    if (!after || after.done) continue;
    assert.equal(
      after.lane,
      expected,
      `${name} at angle ${before.angle}, direction ${before.direction}`,
    );
    const quadrant = Math.floor(
      ((((before.angle + Math.PI / 4) % (2 * Math.PI)) + 2 * Math.PI) %
        (2 * Math.PI)) /
        (Math.PI / 2),
    );
    coverage.add(`${name}/${quadrant}/${before.direction}`);
    samples.push({
      name,
      quadrant,
      direction: before.direction,
      before: before.lane,
      after: after.lane,
    });
    if (i % 30 === 0)
      console.log({ gestures: samples.length, coverage: coverage.size });
  }
  assert.equal(
    coverage.size,
    32,
    "4 directions × 4 traveler quadrants × 2 rotations",
  );
  for (const [dx, dy, delta] of [
    [40, 20, 1],
    [-20, -40, 1],
    [-40, -20, -1],
    [20, 40, -1],
  ]) {
    if ((await d()).done) await start();
    const before = await d();
    const next = before.lane + delta,
      expected = next >= 0 && next < before.orbits.length ? next : before.lane;
    await swipe(dx, dy);
    const after = await d();
    if (!after.done) assert.equal(after.lane, expected);
  }
  writeFileSync(
    `${out}/redmi-controls.png`,
    execFileSync(adb, ["exec-out", "screencap", "-p"], {
      windowsHide: true,
      maxBuffer: 8388608,
    }),
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/redmi-controls.json`,
    JSON.stringify(
      { coverage: [...coverage].sort(), samples, errors },
      null,
      2,
    ),
  );
  console.log({ coverage: coverage.size, gestures: samples.length, errors });
  if (!(await d()).done) {
    await a("pause").click();
    await a("abandon").click();
  }
} finally {
  await b.close();
}
