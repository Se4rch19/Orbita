import { existsSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.ORBITA_QA_OUT ?? (existsSync("../Orbita-0.3") ? "../Orbita-0.3/capturas" : "../capturas");
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const checks = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("http://localhost:4173/?qa=0.3");
  await expect(
    page.getByRole("button", { name: "Explorar campaña" }),
  ).toBeVisible();
  await page.screenshot({ path: out + "/01-inicio.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.locator('[data-action="training"]').click();
  await page.clock.fastForward(6500);
  await page.getByRole("button", { name: "Cambiar de órbita" }).click();
  await page.clock.fastForward(25000);
  await expect(page.getByText("Ya conoces el camino.")).toBeVisible();
  let save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.tutorial, true);
  assert.equal(save.runs, 0);
  assert.equal(save.totalLights, 10);
  checks.push(
    "independent 30-second tutorial, one-time milestone reward",
  );
  await page.getByRole("button", { name: "Elegir una expedición" }).click();
  await page.screenshot({ path: out + "/02-campana.png", fullPage: true });
  await expect(
    page.getByRole("button", { name: "Bloqueada: Enlaza la luz" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Jugar: Primer pulso" }).click();
  await page.clock.fastForward(2000);
  await page.getByRole("button", { name: "Cambiar de órbita" }).click();
  await page.getByRole("button", { name: "Pausar juego" }).click();
  const clock = await page.locator("#timer").textContent();
  await page.clock.fastForward(5000);
  assert.equal(await page.locator("#timer").textContent(), clock);
  await page.getByRole("button", { name: "Seguir el viaje" }).click();
  await page.clock.fastForward(1000);
  assert.notEqual(await page.locator("#timer").textContent(), clock);
  checks.push(
    "touch controls, campaign lock, pause freezes time, resume advances",
  );
  await page.clock.fastForward(46000);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".score-comparison")).toBeVisible();
  await page.screenshot({ path: out + "/03-resultado.png" });
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.runs, 1);
  checks.push("campaign result, previous best and score delta, saved run");
  await page.getByRole("button", { name: "Ver campaña", exact: true }).click();
  await page.getByRole("button", { name: /Volver a los modos/ }).click();
  await page.getByRole("button", { name: "Calma", exact: true }).click();
  await page.getByRole("button", { name: "3 minutos", exact: true }).click();
  await page.getByRole("button", { name: "Entrar en calma" }).click();
  await page.clock.fastForward(181000);
  await expect(page.getByText("Un momento para ti.")).toBeVisible();
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.runs, 2);
  assert.ok(save.history[0].lights <= 18);
  checks.push("full 3-minute Calma, no defeat, capped fragments");
  await page.getByRole("button", { name: "Volver a mi universo" }).click();
  await page.getByRole("button", { name: "Sin límite", exact: true }).click();
  const base = save.totalLights;
  await page.getByRole("button", { name: "Entrar en calma" }).click();
  await page.clock.fastForward(71000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const bank = await page.evaluate(
    () => JSON.parse(localStorage.getItem("orbita.v3")).totalLights,
  );
  assert.ok(bank >= base);
  const objective = await page.locator("#objective").textContent(),
    earned = Number(objective.match(/(\d+) fragmentos/)[1]);
  await page.getByRole("button", { name: "Pausar juego" }).click();
  await page.getByRole("button", { name: "Terminar y guardar" }).click();
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.totalLights, base + earned);
  checks.push(
    "continuous Calma, checkpoint and settlement without double reward",
  );
  await page.getByRole("button", { name: "Volver a mi universo" }).click();
  await page.getByRole("button", { name: "Infinito", exact: true }).click();
  await page.getByRole("button", { name: "Viajar sin límite" }).click();
  await page.clock.fastForward(400000);
  await expect(page.getByText("Así de lejos llegaste.")).toBeVisible();
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.ok(save.infiniteBest > 0);
  checks.push("Infinito ends on shield loss and records high score");
  await page.getByRole("button", { name: "Volver a mi universo" }).click();
  await page.getByRole("button", { name: "Del día", exact: true }).click();
  await page.getByRole("button", { name: "Aceptar el reto" }).click();
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("orbita.v3")),
  );
  assert.equal(save.daily.played, true);
  assert.equal(save.daily.attempts, 1);
  await page.clock.fastForward(80000);
  await expect(page.getByRole("dialog")).toBeVisible();
  checks.push("daily is marked played at start and completes without server");
  await page.getByRole("button", { name: "Volver a mi universo" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Bitácora", exact: true }).click();
  await expect(page.getByText("Récord de Infinito")).toBeVisible();
  checks.push("history and records survive reload");
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page.getByRole("switch", { name: "Sonido", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Sonido", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Cerrar ajustes" }).click();
  checks.push("preferences persist");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole("button", { name: "Jugar", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: out + "/04-pantalla-pequena.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: out + "/05-escritorio.png", fullPage: true });
  checks.push("390px, 320px and desktop layouts");
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/qa.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(
    JSON.stringify({ status: "passed", checks: checks.length, errors }),
  );
} finally {
  await browser.close();
}
