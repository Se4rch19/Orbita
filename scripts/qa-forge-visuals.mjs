import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
const b = await chromium.launch(),
  out = "../outputs/Orbita-0.4.1/validation",
  checks = [];
const p = await b.newPage({
  viewport: { width: 392, height: 872 },
  locale: "es-MX",
});
try {
  const s = JSON.parse(readFileSync("tests/fixtures/redmi-0.4.0.json", "utf8"));
  s.motion = false;
  Object.assign(s.universe.planets[0].design, {
    biome: "biome-ocean",
    feature: "feature-none",
    space: "space-stars",
  });
  s.presentation.tutorial = "legacy";
  s.presentation.seen = ["forge"];
  await p.addInitScript(
    (s) => localStorage.setItem("orbita.v3", JSON.stringify(s)),
    s,
  );
  await p.goto("http://localhost:4173/?qa=041");
  await p.locator('.bottom-nav [data-page="forge"]').click();
  const screenshot = () =>
    p.locator(".forge-preview canvas").screenshot({ animations: "disabled" });
  const compare = async (a, b) => {
    const x = await sharp(a).removeAlpha().raw().toBuffer(),
      y = await sharp(b).removeAlpha().raw().toBuffer();
    let n = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 8) n++;
    return n / x.length;
  };
  for (const [category, id] of [
    ["atmosphere", "atmosphere-aurora"],
    ["satellite", "satellite-moon"],
    ["ring", "ring-broken"],
    ["orbit", "orbit-glow"],
    ["surface", "surface-rock"],
  ]) {
    await p
      .locator(`[data-action="forge-category"][data-category="${category}"]`)
      .click();
    const baseId = {
      atmosphere: "atmosphere-none",
      satellite: "satellite-none",
      ring: "ring-none",
      orbit: "orbit-thin",
      surface: "surface-garden",
    }[category];
    await p
      .locator(`[data-action="forge-equip"][data-component="${baseId}"]`)
      .click();
    const before = await screenshot();
    await p
      .locator(`[data-action="forge-equip"][data-component="${id}"]`)
      .click();
    await p.waitForTimeout(100);
    const after = await screenshot(),
      difference = await compare(before, after);
    assert.ok(difference > 0.0008, `${id} invisible: ${difference}`);
    writeFileSync(`${out}/forge-${id}.png`, after);
    checks.push({ id, difference });
  }
  for (const id of ["biome-crystal", "feature-storm", "space-nebula"]) {
    await p
      .locator('[data-action="forge-category"][data-category="shape"]')
      .click();
    const before = await screenshot();
    await p
      .locator(`[data-action="environment-part"][data-id="${id}"]`)
      .click();
    await p.waitForTimeout(100);
    const after = await screenshot(),
      difference = await compare(before, after);
    assert.ok(difference > 0.0008, `${id} invisible`);
    writeFileSync(`${out}/forge-${id}.png`, after);
    checks.push({ id, difference });
  }
  const inventory = await p.evaluate(
    () => JSON.parse(localStorage.getItem("orbita.v3")).universe.inventory,
  );
  assert.deepEqual(inventory, s.universe.inventory);
  await p.locator('[data-action="forge-save"]').click();
  const planets = await p.evaluate(
    () => JSON.parse(localStorage.getItem("orbita.v3")).universe.planets,
  );
  assert.ok(
    !JSON.stringify(planets).includes("ring-broken"),
    "Preview must never grant a locked component",
  );
  writeFileSync(
    `${out}/forge-visuals.json`,
    JSON.stringify(
      { checks, lockedPreviewDoesNotGrantInventory: true },
      null,
      2,
    ),
  );
  console.log(checks);
} finally {
  await b.close();
}
