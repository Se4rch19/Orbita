import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { fresh3 } from "../src/storage3.ts";
import { components } from "../src/forge.ts";
import { environmentParts } from "../src/environment.ts";
const b = await chromium.launch(),
  out = "../outputs/Orbita-0.4.1/validation",
  checks = [],
  errors = [];
try {
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  p.on("pageerror", (e) => errors.push(e.message));
  const s = fresh3();
  s.presentation.language = "en-US";
  s.presentation.tutorial = "skipped";
  s.presentation.seen = ["forge", "personal", "world-0"];
  s.motion = false;
  s.totalLights = 1000;
  s.unlockedWorlds.fill(true);
  s.campaign.forEach((x) => x.cleared.fill(true));
  s.universe.inventory = components.map((c) => c.id);
  s.presentation.owned = environmentParts.map((p) => p.id);
  await p.addInitScript((save) => {
    if (!localStorage.getItem("orbita.v3"))
      localStorage.setItem("orbita.v3", JSON.stringify(save));
  }, s);
  await p.goto("http://localhost:4173/?qa=040");
  const a = (x) => p.locator(`[data-action="${x}"]`).last();
  await p.locator('[data-page="forge"]').click();
  for (const id of ["biome-lava", "space-nebula", "feature-fissure"])
    await p.locator(`[data-id="${id}"]`).click();
  await p
    .locator('[data-action="forge-category"][data-category="surface"]')
    .click();
  await p
    .locator('[data-action="forge-equip"][data-component="surface-ice"]')
    .click();
  await expect(p.locator(".toast")).toContainText("Incompatible");
  await a("forge-save").click();
  await p.reload();
  await p.locator('[data-page="forge"]').click();
  const save = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.universe.planets[0].design.biome, "biome-lava");
  assert.notEqual(save.universe.planets[0].design.surface, "surface-ice");
  checks.push(
    "English environment editor, incompatible legacy surface rejected, lava/nebula/fissure save round trip",
  );
  const canvas = p.locator(".forge-preview canvas");
  await canvas.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  const first = await canvas.screenshot();
  await p.waitForTimeout(400);
  assert.ok(
    first.equals(await canvas.screenshot()),
    "ambient off freezes preview",
  );
  const r = await canvas.boundingBox();
  await p.mouse.move(r.x + r.width * 0.4, r.y + r.height * 0.5);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width * 0.7, r.y + r.height * 0.5, { steps: 10 });
  await p.mouse.up();
  await p.waitForTimeout(100);
  assert.ok(
    !first.equals(await canvas.screenshot()),
    "manual drag rotates frozen preview",
  );
  checks.push(
    "ambient-off canvas is pixel stable; direct drag still changes orientation",
  );
  await a("personal-play").click();
  assert.equal(
    (await p.evaluate(() => window.__orbitaDiagnostics)).music.flavor,
    "deep",
  );
  checks.push("lava personal world selects darker procedural music timbre");
  assert.deepEqual(errors, []);
  writeFileSync(
    out + "/qa-environment.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(checks);
} finally {
  await b.close();
}
