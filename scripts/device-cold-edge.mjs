import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import assert from "node:assert/strict";
const adb = "../work/android-sdk/platform-tools/adb.exe",
  out = "../outputs/Orbita-0.4.1/validation";
const cmd = (...args) =>
  execFileSync(adb, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8388608,
  });
const shell = (...args) => cmd("shell", ...args);
shell("input", "keyevent", "KEYCODE_WAKEUP");
shell("am", "force-stop", "com.orbita.minigame");
const start = Date.now();
shell("am", "start", "-n", "com.orbita.minigame/.MainActivity");
let browser;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    const pid = shell("pidof", "com.orbita.minigame").trim();
    if (!pid) throw Error("starting");
    cmd("forward", "tcp:9223", `localabstract:webview_devtools_remote_${pid}`);
    browser = await chromium.connectOverCDP("http://127.0.0.1:9223", {
      timeout: 500,
    });
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 150));
  }
}
assert.ok(browser, "Own app debugging surface unavailable");
const capture = (name) => {
  const bytes = execFileSync(adb, ["exec-out", "screencap", "-p"], {
    windowsHide: true,
    maxBuffer: 8388608,
  });
  writeFileSync(`${out}/redmi-${name}.png`, bytes);
  return bytes;
};
try {
  const p = browser
    .contexts()
    .flatMap((c) => c.pages())
    .find((p) => p.url().startsWith("https://localhost"));
  await expect(p.locator(".world-home")).toBeVisible();
  const introSeen = await p.locator(".brand-intro").isVisible();
  if (introSeen) capture("cold-intro");
  await expect(p.locator(".brand-intro")).toHaveCount(0, { timeout: 6000 });
  const coldMs = Date.now() - start;
  capture("cold-home");
  const state = await p.evaluate(() =>
    Capacitor.nativePromise("Immersion", "state", {}),
  );
  assert.equal(state.statusVisible, false);
  assert.equal(state.navigationVisible, false);
  shell("input", "swipe", "540", "2395", "540", "2070", "300");
  const during = capture("edge-transient");
  await p.waitForTimeout(4500);
  const after = capture("edge-restored");
  const count = async (bytes) => {
    const { data } = await sharp(bytes)
      .extract({ left: 500, top: 2300, width: 80, height: 100 })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let white = 0;
    for (let i = 0; i < data.length; i += 3)
      if (data[i] > 140 && data[i + 1] > 140 && data[i + 2] > 140) white++;
    return white;
  };
  const whiteDuring = await count(during),
    whiteAfter = await count(after);
  assert.ok(
    whiteDuring > whiteAfter,
    "Transient system gesture indicator should withdraw",
  );
  await expect(p.locator(".world-home")).toBeVisible();
  const result = { coldMs, introSeen, state, whiteDuring, whiteAfter };
  writeFileSync(`${out}/redmi-cold-edge.json`, JSON.stringify(result, null, 2));
  console.log(result);
} finally {
  await browser.close();
}
