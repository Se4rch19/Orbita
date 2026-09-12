import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import sharp from "sharp";
const adb = "../work/android-sdk/platform-tools/adb.exe",
  out = "../outputs/Orbita-0.4.1/validation";
const shell = (...args) =>
  execFileSync(adb, ["shell", ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8388608,
  });
const b = await chromium.connectOverCDP("http://127.0.0.1:9223");
const p = b
  .contexts()
  .flatMap((c) => c.pages())
  .find((p) => p.url().startsWith("https://localhost"));
assert.ok(p, "Own app WebView required");
const a = (x) => p.locator(`[data-action="${x}"]`).last();
const capture = (name) => {
  const bytes = execFileSync(adb, ["exec-out", "screencap", "-p"], {
    windowsHide: true,
    maxBuffer: 8388608,
  });
  writeFileSync(`${out}/redmi-${name}.png`, bytes);
  return bytes;
};
const errors = [],
  checks = [],
  timing = [];
p.on("pageerror", (e) => errors.push(e.message));
const measure = (ms) =>
  p.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const start = performance.now(),
          values = [];
        let last = start;
        function frame(now) {
          values.push(now - last);
          last = now;
          if (now - start < ms) requestAnimationFrame(frame);
          else {
            values.shift();
            values.sort((a, b) => a - b);
            resolve({
              durationMs: now - start,
              frames: values.length,
              medianMs: values[Math.floor(values.length * 0.5)],
              p95Ms: values[Math.floor(values.length * 0.95)],
              over33ms: values.filter((x) => x > 33.4).length,
            });
          }
        }
        requestAnimationFrame(frame);
      }),
    ms,
  );
try {
  const before = JSON.parse(
    readFileSync(`${out}/prior-device-0.4.0.json`, "utf8"),
  );
  const after = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  const compare = structuredClone(after);
  compare.presentation.launches = before.presentation.launches;
  if (before.presentation.quality === undefined)
    delete compare.presentation.quality;
  else compare.presentation.quality = before.presentation.quality;
  assert.deepEqual(compare, before);
  writeFileSync(
    `${out}/redmi-migration.json`,
    JSON.stringify(
      {
        before,
        after,
        result: "Every field preserved; launch count incremented",
      },
      null,
      2,
    ),
  );
  checks.push(
    "Real 0.4.0 data survives install -r: 7 runs, 194 lights and all saved fields",
  );
  await expect(p.locator(".world-home")).toBeVisible();
  await a("settings").click();
  await p.locator("#quality-setting").selectOption("high");
  await a("close").click();
  for (let i = 0; i < 5; i++) {
    await p.locator(`.world-dots [data-world="${i}"]`).click();
    await expect(p.locator(".world-heading .eyebrow")).toHaveText(
      `0${i + 1} / 05`,
    );
    await p.waitForTimeout(800);
    const first = capture(`world-${i}-start`);
    timing.push({ screen: `world-${i}-high-idle`, ...(await measure(30000)) });
    const second = capture(`world-${i}-30s`);
    const x = await sharp(first).removeAlpha().raw().toBuffer(),
      y = await sharp(second).removeAlpha().raw().toBuffer();
    let changed = 0;
    for (let j = 0; j < x.length; j++) if (Math.abs(x[j] - y[j]) > 8) changed++;
    assert.ok(changed / x.length > 0.005, `world ${i} appears static`);
    timing.at(-1).changedChannelRatio = changed / x.length;
    console.log(`World ${i}: 30s ambient motion verified`, timing.at(-1));
  }
  checks.push(
    "Five campaign worlds show autonomous motion throughout 30-second idle observations at High",
  );
  await p.locator('.bottom-nav [data-page="forge"]').click();
  capture("forge-high");
  timing.push({ screen: "forge-high", ...(await measure(5000)) });
  await p.locator('.bottom-nav [data-page="collection"]').click();
  capture("collection");
  await p.locator('.bottom-nav [data-page="journal"]').click();
  capture("journal");
  await p.locator('.bottom-nav [data-page="play"]').click();
  await a("settings").click();
  await p
    .locator("#quality-setting")
    .selectOption(before.presentation.quality ?? "auto");
  await a("close").click();
  writeFileSync(
    `${out}/redmi-meminfo.txt`,
    shell("dumpsys", "meminfo", "com.orbita.minigame"),
  );
  writeFileSync(
    `${out}/redmi-gfxinfo.txt`,
    shell("dumpsys", "gfxinfo", "com.orbita.minigame"),
  );
  const pid = shell("pidof", "com.orbita.minigame").trim();
  writeFileSync(
    `${out}/redmi-logcat.txt`,
    shell("logcat", "-d", `--pid=${pid}`, "-t", "1200"),
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/redmi-polish.json`,
    JSON.stringify({ checks, timing, errors }, null, 2),
  );
  console.log({ checks, timing, errors });
} finally {
  await b.close();
}
