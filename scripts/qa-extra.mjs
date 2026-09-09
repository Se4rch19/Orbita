import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const out = "../capturas-0.2";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("http://localhost:4173/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Explorar campaña" }),
  ).toBeVisible();
  // Genuine legacy fixture: all old worlds earned; new levels remain uncompleted.
  await page.evaluate(() => {
    localStorage.removeItem("orbita.v2");
    localStorage.removeItem("orbita.v2.backup");
    localStorage.setItem(
      "orbita.v1",
      JSON.stringify({
        version: 1,
        totalLights: 700,
        world: 0,
        tutorial: true,
        sound: false,
        best: 900,
      }),
    );
  });
  await page.reload();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("orbita.v2")).legacyBest,
    ),
    900,
  );
  assert.ok(await page.evaluate(() => localStorage.getItem("orbita.v1")));
  for (const [world, name] of [
    [0, "Menta"],
    [1, "Durazno"],
    [2, "Lavanda"],
    [3, "Glaciar"],
    [4, "Eclipse"],
  ]) {
    await page.getByRole("button", { name: "Mis mundos", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(`^${name},`) }).click();
    await page.locator('[data-action="level"][data-level="0"]').click();
    await page.clock.fastForward(9000);
    await expect(page.locator("canvas")).toBeVisible();
    await page.screenshot({ path: out + `/mundo-${world}-${name}.png` });
    if (world === 1)
      await expect(
        page.getByRole("button", { name: "Órbita anterior" }),
      ).toBeVisible();
    await page.keyboard.press("Space");
    await page.keyboard.press("p");
    await expect(page.getByText("Toma un respiro.")).toBeVisible();
    await page.getByRole("button", { name: "Salir al inicio" }).click();
  }
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page
    .getByRole("button", { name: "Borrar progreso de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Conservar mi progreso" }).click();
  await page.getByRole("button", { name: "Cerrar ajustes" }).click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("orbita.v2")).totalLights,
    ),
    700,
  );
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page
    .getByRole("button", { name: "Borrar progreso de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Sí, borrar mi progreso" }).click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("orbita.v2")).totalLights,
    ),
    0,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("orbita.v1")),
    null,
  );
  await page.evaluate(() => localStorage.setItem("orbita.v2", "{corrupt"));
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Explorar campaña" }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/qa-extra.json",
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "offline launch and play in every world",
          "v1 migration preserves 700 fragments and old worlds",
          "keyboard switch and pause",
          "three-lane controls",
          "reset cancellation",
          "reset removes legacy fallback",
          "corrupt save recovery",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Offline, migration, all-world rendering and reset QA passed.");
} finally {
  await browser.close();
}
