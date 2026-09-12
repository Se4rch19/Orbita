import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.ORBITA_QA_OUT ?? "../outputs/Orbita-0.4.1/validation";
await mkdir(out, { recursive: true });
const browser = await chromium.launch(),
  checks = [],
  errors = [],
  external = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "es-MX",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("orbita.v3"))
      localStorage.setItem(
        "orbita.v3",
        JSON.stringify({
          version: 3,
          totalLights: 0,
          motion: false,
          presentation: {
            version: 1,
            tutorial: "skipped",
            language: "es-MX",
            launches: 1,
            seen: [
              "world-0",
              "world-1",
              "world-2",
              "world-3",
              "world-4",
              "forge",
              "daily",
              "infinite",
              "codes",
              "anomalies",
              "personal",
            ],
          },
        }),
      );
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4173/")) external.push(r.url());
  });
  await p.clock.install();
  await p.goto("http://localhost:4173/?qa=040");
  const a = (x) => p.locator(`[data-action="${x}"]`).first(),
    d = () => p.evaluate(() => window.__orbitaDiagnostics),
    read = () =>
      p.evaluate(() => JSON.parse(localStorage.getItem("orbita.v3")));
  const home = async () => {
    await a("pause").click();
    await a("abandon").click();
  };
  const startMode = async (mode) => {
    await p.locator(`[data-action="home-mode"][data-mode="${mode}"]`).click();
    await a("world-play").click();
  };
  await expect(p.locator(".world-modes button")).toHaveCount(4);
  await expect(p.locator(".bottom-nav button")).toHaveCount(4);
  await p.screenshot({ path: out + "/01-inicio.png", fullPage: true });
  checks.push(
    "four primary destinations, planetary home and four compact modes",
  );
  await a("settings").click();
  await expect(
    p.getByRole("switch", { name: "Asistencia de anticipación" }),
  ).toHaveAttribute("aria-checked", "false");
  for (const name of ["Música", "Efectos de sonido", "Vibración"])
    await expect(p.getByRole("switch", { name, exact: true })).toBeVisible();
  await expect(p.locator('[data-action="training"]')).toHaveCount(1); // only underlying home
  await a("data-settings").click();
  await expect(a("reset-confirm")).toBeVisible();
  await p.getByRole("dialog").locator('[data-action="settings"]').click();
  await a("close").click();
  checks.push(
    "assistance off, separate audio/haptics, dedicated data settings",
  );
  await a("training").click();
  await a("lesson-next").click();
  const r = await p.locator(".game-canvas").boundingBox(),
    cx = r.x + r.width / 2,
    cy = r.y + r.height / 2;
  const swipe = async (from, to) => {
    await p.mouse.move(cx + from, cy);
    await p.mouse.down();
    await p.mouse.move(cx + to, cy, { steps: 4 });
    await p.mouse.up();
    await p.clock.runFor(110);
  };
  await swipe(60, 120);
  assert.equal((await d()).lane, 1);
  await swipe(60, 120);
  assert.equal((await d()).lane, 1);
  await swipe(120, 60);
  assert.equal((await d()).lane, 0);
  await swipe(120, 60);
  assert.equal((await d()).lane, 0);
  await swipe(60, 65);
  assert.equal((await d()).lane, 0);
  // Cancellation must never consume a move.
  await p.mouse.move(cx + 60, cy);
  await p.mouse.down();
  await p
    .locator(".game-canvas")
    .dispatchEvent("pointercancel", { pointerId: 42 });
  await p.mouse.move(cx + 120, cy);
  await p.mouse.up();
  assert.equal((await d()).lane, 0);
  checks.push(
    "real pointer radial gestures, endpoints, microgesture and cancellation",
  );
  await a("lesson-skip").click();
  assert.equal((await read()).runs, 0);
  await a("campaign").click();
  await expect(
    p.getByRole("button", { name: "Bloqueada: Enlaza la luz" }),
  ).toBeDisabled();
  await p.getByRole("button", { name: "Jugar: Primer pulso" }).click();
  await p.clock.runFor(1000);
  await a("pause").click();
  const t = (await d()).time;
  await p.clock.fastForward(5000);
  assert.equal((await d()).time, t);
  await a("resume").click();
  await p.clock.runFor(500);
  assert.ok((await d()).time > t);
  await p.screenshot({ path: out + "/02-juego.png" });
  await p.clock.fastForward(60000);
  await expect(p.getByRole("dialog")).toBeVisible();
  await p.screenshot({ path: out + "/03-resultado.png" });
  await a("campaign").click();
  await a("back").click();
  checks.push(
    "independent training, campaign locks, pause/resume and settlement",
  );
  await startMode("zen");
  await p.locator('[data-action="calm-start"][data-duration="180"]').click();
  await p.clock.fastForward(181000);
  await expect(p.getByRole("dialog")).toBeVisible();
  await a("result-home").click();
  await startMode("zen");
  await p.locator('[data-action="calm-start"][data-duration="0"]').click();
  await p.clock.fastForward(71000);
  assert.equal((await d()).done, false);
  await a("pause").click();
  await a("end-calm").click();
  await a("result-home").click();
  checks.push("3-minute and continuous Calma settlement");
  await startMode("daily");
  let v = await d();
  assert.equal(v.mode, "daily");
  const ds = (await read()).mobile.daily[0];
  assert.equal(ds.attempts, 1);
  await expect(p.locator("#objective")).toContainText("Señal");
  await p.clock.fastForward(80000);
  await a("result-home").click();
  await startMode("daily");
  assert.equal((await read()).mobile.daily[0].attempts, 2);
  assert.equal((await d()).world, v.world);
  await home();
  checks.push("daily tier HUD and same-day varied attempts tracked");
  await startMode("infinite");
  assert.equal((await d()).world, 0);
  await p.clock.fastForward(400000);
  await expect(p.getByRole("dialog")).toBeVisible();
  assert.ok((await read()).mobile.journey.seconds > 0);
  await a("result-home").click();
  checks.push("infinite starts Menta and stores journey record");
  await a("open-codes").click();
  await a("back").click();
  await expect(a("world-play")).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await p.setViewportSize({ width, height: width === 320 ? 568 : 1000 });
    for (const view of ["play", "forge", "journal"]) {
      await p.locator(`[data-action="page"][data-page="${view}"]`).click();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await p.screenshot({ path: out + `/layout-${width}.png`, fullPage: true });
  }
  checks.push("codes back, home/Forge/journal at 320,390,1440px");
  await p.reload();
  await p.getByRole("button", { name: "BITÁCORA", exact: true }).click();
  await expect(p.getByText("Viajes por el universo")).toBeVisible();
  checks.push("journal records survive reload");
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  await writeFile(
    out + "/qa-mobile.json",
    JSON.stringify({ status: "passed", checks, errors, external }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks: checks.length }));
} finally {
  await browser.close();
}
