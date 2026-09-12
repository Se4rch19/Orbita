import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.ORBITA_QA_OUT ?? "../outputs/Orbita-0.4.1/validation";
await mkdir(out, { recursive: true });
const browser = await chromium.launch(),
  checks = [],
  errors = [];
try {
  for (const locale of ["es-MX", "en-US"]) {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      locale,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install();
    await p.goto("http://localhost:4173/?qa=040");
    await expect(p.locator(".brand-intro")).toBeVisible();
    await p.clock.runFor(1100);
    await p.locator(".brand-intro").click();
    await p.clock.runFor(100);
    await expect(p.getByRole("dialog")).toContainText("Luma");
    assert.equal(await p.locator("html").getAttribute("lang"), locale);
    await p.getByRole("dialog").locator('[data-action="training"]').click();
    const a = (x) => p.locator(`[data-action="${x}"]`).last();
    const d = () => p.evaluate(() => window.__orbitaDiagnostics);
    const swipe = async (outward) => {
      const r = await p.locator(".game-canvas").boundingBox(),
        cx = r.x + r.width / 2,
        cy = r.y + r.height / 2;
      await p.mouse.move(cx + (outward ? 45 : 110), cy);
      await p.mouse.down();
      await p.mouse.move(cx + (outward ? 110 : 45), cy, { steps: 5 });
      await p.mouse.up();
      await p.clock.runFor(150);
    };
    assert.equal((await d()).lesson, 0);
    await p.clock.runFor(2000);
    assert.equal((await d()).time, 0);
    await a("lesson-next").click();
    await swipe(false);
    assert.equal((await d()).lesson, 1);
    await a("pause").click();
    await a("resume").click();
    await p.clock.runFor(300);
    assert.equal((await d()).time, 0);
    await swipe(true);
    assert.equal((await d()).lesson, 2);
    await swipe(false);
    assert.equal((await d()).lesson, 3);
    for (let i = 0; i < 40 && (await d()).lesson === 3; i++)
      await p.clock.runFor(100);
    assert.equal((await d()).lesson, 4);
    await p.screenshot({ path: `${out}/web-tutorial-${locale}.png` });
    await swipe(true);
    for (let i = 0; i < 40 && (await d()).lesson === 4; i++)
      await p.clock.runFor(100);
    assert.equal((await d()).lesson, 5);
    await a("lesson-next").click();
    for (let i = 0; i < 150 && (await d()).lesson === 6; i++)
      await p.clock.runFor(100);
    assert.equal((await d()).lesson, 7);
    await a("lesson-next").click();
    const save = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("orbita.v3")),
    );
    assert.equal(save.presentation.tutorial, "complete");
    assert.equal(save.runs, 0);
    await p.reload();
    await p.clock.runFor(700);
    await expect(p.getByRole("dialog")).toHaveCount(0);
    await p.screenshot({
      path: `${out}/web-home-${locale}.png`,
      fullPage: true,
    });
    await a("training").click();
    await a("lesson-skip").click();
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("orbita.v3")).presentation.tutorial,
      ),
      "complete",
    );
    await a("settings").click();
    await p
      .locator("#language-setting")
      .selectOption(locale === "es-MX" ? "en-US" : "es-MX");
    await p.waitForLoadState("load");
    await p.clock.runFor(700);
    await expect(p.locator("html")).toHaveAttribute(
      "lang",
      locale === "es-MX" ? "en-US" : "es-MX",
    );
    await a("settings").click();
    await p.locator("#language-setting").selectOption("system");
    await p.waitForLoadState("load");
    await p.clock.runFor(700);
    await expect(p.locator("html")).toHaveAttribute("lang", locale);
    assert.equal(
      await p.evaluate(() =>
        /\{p\d+\}|m_[a-f0-9]{10}/.test(document.body.innerText),
      ),
      false,
    );
    checks.push(
      `${locale}: fresh intro skip, action-gated 8 steps, wrong gesture, paused step, real collection/avoid/chain, completion persistence, language switch/system`,
    );
    await p.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/qa-identity.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks }));
} finally {
  await browser.close();
}
