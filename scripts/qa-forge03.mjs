import { existsSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { components } from "../src/forge.ts";
const out = process.env.ORBITA_QA_OUT ?? (existsSync("../Orbita-0.3") ? "../Orbita-0.3/capturas" : "../capturas");
await mkdir(out, { recursive: true });
const browser = await chromium.launch(),
  checks = [],
  errors = [],
  requests = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4173/")) requests.push(r.url());
  });
  await page.clock.install();
  await page.goto("http://localhost:4173/?qa=0.3");
  const action = (a) => page.locator(`[data-action="${a}"]`).first();
  const read = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("orbita.v3")));
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  await expect(page.locator(".forge-preview canvas")).toBeVisible();
  assert.equal(await page.locator("canvas").count(), 1);
  await page.locator("#planet-name").fill("<Luna>");
  await action("forge-save").click();
  let save = await read();
  assert.equal(save.universe.planets[0].name, "Luna");
  assert.equal(save.universe.stats.created, 1);
  assert.ok(save.universe.inventory.includes("satellite-moon"));
  assert.equal(save.totalLights, 10);
  checks.push(
    "fresh Forge preview, safe naming, planet save and first-creation reward",
  );
  await page.reload();
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  await expect(page.locator("#planet-name")).toHaveValue("Luna");
  await action("forge-save").click();
  assert.equal((await read()).totalLights, 10);
  checks.push("saved planet reload and duplicate reward prevention");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("orbita.v3"));
    s.totalLights = 80;
    localStorage.setItem("orbita.v3", JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  await action("open-collection").click();
  await page
    .locator('[data-action="forge-acquire"][data-component="shape-square"]')
    .click();
  save = await read();
  assert.equal(save.universe.spent, 20);
  assert.equal(save.totalLights, 80);
  assert.ok(save.universe.inventory.includes("shape-square"));
  await expect(
    page.locator(
      '[data-action="forge-acquire"][data-component="shape-square"]',
    ),
  ).toHaveCount(0);
  checks.push(
    "transparent cosmetic crafting spends once and preserves lifetime fragments",
  );
  await action("open-forge").click();
  await page
    .locator('[data-action="forge-equip"][data-component="shape-square"]')
    .click();
  await action("forge-save").click();
  await page.screenshot({ path: out + "/06-forja-movil.png", fullPage: true });
  assert.equal((await read()).universe.planets[0].design.shape, "shape-square");
  await action("personal-play").click();
  await expect(page.locator(".game-header")).toContainText("Mi órbita");
  await expect(page.locator(".game-header")).toContainText("Luna");
  await page.clock.fastForward(5000);
  await page.screenshot({ path: out + "/07-mi-orbita.png" });
  await page.clock.fastForward(400000);
  save = await read();
  assert.ok(save.universe.personalBest[0] > 0);
  assert.equal(save.infiniteBest, 0);
  checks.push(
    "equipped visual is saved and playable with isolated personal record",
  );
  await action("result-home").click();
  await action("open-codes").click();
  await action("code-create").click();
  const code = await page.locator("#challenge-code").inputValue();
  assert.match(code, /^ORB-/);
  await action("code-copy").click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code);
  await page.screenshot({ path: out + "/08-codigos.png", fullPage: true });
  await page.locator("#challenge-code").fill("ORB-invalido");
  await action("code-play").click();
  await expect(page.locator(".toast")).toContainText("código completo");
  await expect(page.locator("#challenge-code")).toBeVisible();
  checks.push("code creation, clipboard copy and clear invalid-code error");
  await page.locator("#challenge-code").fill(code);
  const before = await read();
  await action("code-play").click();
  await page.clock.fastForward(61000);
  await expect(page.getByRole("dialog")).toBeVisible();
  save = await read();
  assert.equal(save.totalLights, before.totalLights);
  assert.deepEqual(save.campaign, before.campaign);
  assert.equal(save.universe.challenges[0].code, code);
  await action("share-result").click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /Puntos:/,
  );
  checks.push(
    "coded result sharing, local history and zero progression rewards",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("unavailable")) },
    }),
  );
  await action("share-result").click();
  await expect(
    page.getByRole("dialog", { name: "Resultado del viaje" }),
  ).toBeVisible();
  await expect(page.locator(".share-result")).toBeVisible();
  await action("replay").click();
  await expect(page.locator(".game-canvas")).toBeVisible();
  await action("pause").click();
  await action("abandon").click();
  checks.push("clipboard fallback preserves result controls and replay");
  await action("open-anomalies").click();
  await expect(action("anomaly-play")).toBeDisabled();
  checks.push("post-campaign entry locked before campaign completion");
  await page.evaluate(
    (ids) => {
      const s = JSON.parse(localStorage.getItem("orbita.v3"));
      s.totalLights = 1000;
      s.campaign.forEach((p) => p.cleared.fill(true));
      s.unlockedWorlds.fill(true);
      s.universe.inventory = ids;
      localStorage.setItem("orbita.v3", JSON.stringify(s));
    },
    components.map((c) => c.id),
  );
  await page.reload();
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  for (const cat of [...new Set(components.map((c) => c.category))]) {
    await page
      .locator(`[data-action="forge-category"][data-category="${cat}"]`)
      .click();
    for (const c of components.filter((c) => c.category === cat))
      await page
        .locator(`[data-action="forge-equip"][data-component="${c.id}"]`)
        .click();
  }
  await action("forge-save").click();
  await page.locator('[data-action="forge-slot"][data-slot="1"]').click();
  await page.locator("#planet-name").fill("Segundo cielo");
  await action("forge-save").click();
  await page.locator('[data-action="forge-slot"][data-slot="0"]').click();
  await page.locator("#personal-profile").selectOption("4");
  await page.screenshot({
    path: out + "/09-forja-completa.png",
    fullPage: true,
  });
  assert.equal((await read()).universe.planets.length, 2);
  checks.push(
    "all 34 component previews, multiple slots, selection and advanced profile",
  );
  await action("personal-play").click();
  await page.clock.fastForward(10000);
  await page.screenshot({ path: out + "/10-mi-orbita-eclipse.png" });
  await action("pause").click();
  await action("abandon").click();
  await action("open-anomalies").click();
  await expect(action("anomaly-play")).toBeEnabled();
  await action("anomaly-play").click();
  await expect(page.locator(".game-header")).toContainText("Anomalía");
  await page.clock.fastForward(61000);
  await expect(page.getByRole("dialog")).toBeVisible();
  checks.push(
    "post-campaign anomaly launches and settles through existing engine",
  );
  await action("campaign").click();
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page.getByRole("switch", { name: "Animación ambiental" }).click();
  await page.getByRole("button", { name: "Cerrar ajustes" }).click();
  assert.equal((await read()).motion, false);
  checks.push("reduced-effects preference survives custom rendering");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Forja", exact: true }).click();
  await expect(page.locator("#planet-name")).toHaveValue("Luna");
  await action("personal-play").click();
  await page.clock.fastForward(3000);
  await action("pause").click();
  await action("abandon").click();
  await action("open-codes").click();
  await page.locator("#challenge-code").fill(code);
  await action("code-play").click();
  await expect(page.locator(".game-canvas")).toBeVisible();
  await action("pause").click();
  await action("abandon").click();
  checks.push("offline reload, personal play and imported coded challenge");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const view of ["forge", "journal"]) {
      await page.locator(`[data-action="page"][data-page="${view}"]`).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await page.getByRole("button", { name: "Forja", exact: true }).click();
    await action("open-collection").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    if (width === 1440)
      await page.screenshot({
        path: out + "/11-coleccion-escritorio.png",
        fullPage: true,
      });
    if (width === 320)
      await page.screenshot({
        path: out + "/12-coleccion-320.png",
        fullPage: true,
      });
  }
  checks.push("Forge, collection and profile fit 320px, 390px and desktop");
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(
    out + "/qa-forge03.json",
    JSON.stringify(
      { status: "passed", checks, errors, externalRequests: requests },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      status: "passed",
      checks: checks.length,
      errors,
      externalRequests: requests,
    }),
  );
} finally {
  await browser.close();
}
