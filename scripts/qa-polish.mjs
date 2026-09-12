import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import sharp from "sharp";
const out = "../outputs/Orbita-0.4.1/validation";
mkdirSync(out, { recursive: true });
const b = await chromium.launch(),
  checks = [],
  errors = [];
const fixture = JSON.parse(
  readFileSync("tests/fixtures/redmi-0.4.0.json", "utf8"),
);
try {
  for (const locale of ["es-MX", "en-US"]) {
    const p = await b.newPage({
      viewport: { width: 392, height: 872 },
      locale,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:4173/?qa=041");
    await expect(p.locator(".brand-intro")).toBeVisible();
    await p.waitForTimeout(3100);
    await p.screenshot({ path: `${out}/browser-intro-${locale}.png` });
    await expect(p.locator(".brand-intro")).toHaveCount(0, { timeout: 6000 });
    await p.locator('[data-action="onboarding-skip"]').click();
    for (let i = 0; i < 5; i++) {
      if (i) await p.locator(`.world-dots [data-world="${i}"]`).click();
      await expect(p.locator(".world-heading .eyebrow")).toHaveText(
        `0${i + 1} / 05`,
      );
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${out}/browser-world-${i}-${locale}.png` });
      if (i)
        await expect(p.locator('[data-action="world-play"]')).toBeDisabled();
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await p.locator('[data-action="home-mode"][data-mode="daily"]').click();
    await expect(p.locator('[data-action="world-play"]')).toBeEnabled();
    for (const page of ["collection", "journal", "forge", "play"]) {
      await p.locator(`.bottom-nav [data-page="${page}"]`).click();
      await expect(
        p.locator(`.bottom-nav [data-page="${page}"]`),
      ).toHaveAttribute("aria-current", "page");
    }
    await p.locator('[data-action="settings"]').click();
    for (const level of ["low", "medium", "high", "auto"])
      await p.locator("#quality-setting").selectOption(level);
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("orbita.v3")).presentation.quality,
      ),
      "auto",
    );
    await p.screenshot({ path: `${out}/browser-settings-${locale}.png` });
    await p.locator('[data-action="close"]').click();
    await p.locator('[data-action="training"]').click();
    await p.locator('[data-action="lesson-next"]').click();
    const swipe = async (dx, dy) => {
      const r = await p.locator(".game-canvas").boundingBox();
      const x = r.x + r.width / 2,
        y = r.y + r.height / 2;
      await p.mouse.move(x, y);
      await p.mouse.down();
      await p.mouse.move(x + dx, y + dy, { steps: 4 });
      await p.mouse.up();
      await p.waitForTimeout(150);
    };
    await swipe(0, -35);
    assert.equal(
      (await p.evaluate(() => window.__orbitaDiagnostics)).lesson,
      2,
    );
    await swipe(-35, 0);
    assert.equal(
      (await p.evaluate(() => window.__orbitaDiagnostics)).lesson,
      3,
    );
    await p.locator('[data-action="lesson-skip"]').click();
    await p.reload();
    await expect(p.locator(".brand-intro")).toBeVisible();
    await p.waitForTimeout(1100);
    await p.locator(".brand-intro").click();
    await expect(p.locator(".brand-intro")).toHaveCount(0);
    checks.push(
      `${locale}: intro first/repeat/skip, 5 worlds/locks, 4 tabs, quality persistence, cross-axis tutorial, viewport`,
    );
    await p.close();
  }
  // Isolated browser fixture. Never writes or unlocks physical player progression.
  const p = await b.newPage({
    viewport: { width: 392, height: 872 },
    locale: "es-MX",
  });
  p.on("pageerror", (e) => errors.push(e.message));
  fixture.presentation.motion = false;
  fixture.presentation.launches = 1;
  fixture.presentation.seen = ["forge"];
  fixture.presentation.tutorial = "legacy";
  await p.addInitScript(
    (s) => localStorage.setItem("orbita.v3", JSON.stringify(s)),
    fixture,
  );
  await p.goto("http://localhost:4173/?qa=041");
  await p.waitForTimeout(2400);
  await p.locator('.bottom-nav [data-page="forge"]').click();
  await p.screenshot({ path: `${out}/browser-forge.png`, fullPage: true });
  await p
    .locator('[data-action="forge-category"][data-category="atmosphere"]')
    .click();
  checks.push("real 0.4.0 fixture renders personal planet and Forge");
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/browser-polish.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log({ checks, errors });
} finally {
  await b.close();
}
