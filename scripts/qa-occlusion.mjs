import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const server = await createServer({
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
await server.listen();
const browser = await chromium.launch(),
  out = "../outputs/Orbita-0.4.1/validation";
try {
  const p = await browser.newPage({ viewport: { width: 1200, height: 600 } });
  await p.route("**/occlusion-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<body style="margin:0;background:#060f20"><canvas id="without" width="600" height="600"></canvas><canvas id="with" width="600" height="600"></canvas></body>',
    }),
  );
  await p.goto("http://127.0.0.1:4174/occlusion-test");
  const results = [];
  for (const [name, feature, time, region, expected] of [
    [
      "moon-back",
      { satellite: "satellite-moon" },
      (Math.PI * 1.5 - 0.7) / 0.17,
      [295, 206, 10, 10],
      false,
    ],
    [
      "moon-front",
      { satellite: "satellite-moon" },
      (Math.PI * 0.5 - 0.7) / 0.17,
      [295, 384, 10, 10],
      true,
    ],
    ["ring-back", { ring: "ring-double" }, 0, [290, 249, 20, 35], false],
    ["ring-front", { ring: "ring-double" }, 0, [290, 316, 20, 35], true],
    [
      "trail-back",
      { orbit: "orbit-glow" },
      (Math.PI * 1.5) / 0.28,
      [240, 211, 70, 18],
      false,
    ],
    [
      "trail-front",
      { orbit: "orbit-glow" },
      (Math.PI * 0.5) / 0.28,
      [290, 371, 60, 18],
      true,
    ],
    ["belt-back", { ring: "ring-broken" }, 5, [285, 236, 30, 45], false],
    ["belt-front", { ring: "ring-broken" }, 5, [285, 319, 30, 45], true],
  ]) {
    const result = await p.evaluate(
      async ({ feature, time, region }) => {
        const { drawLivingWorld } = await import("/src/living-world.ts");
        const { defaultDesign } = await import("/src/forge.ts");
        const design = {
          ...defaultDesign(),
          biome: "biome-ocean",
          feature: "feature-none",
          space: "space-stars",
        };
        const a = document.querySelector("#without").getContext("2d"),
          b = document.querySelector("#with").getContext("2d");
        for (const c of [a, b]) c.clearRect(0, 0, 600, 600);
        drawLivingWorld(a, 0, design, time, false, "high");
        drawLivingWorld(b, 0, { ...design, ...feature }, time, false, "high");
        const x = a.getImageData(...region).data,
          y = b.getImageData(...region).data;
        let changed = 0;
        for (let i = 0; i < x.length; i++)
          if (Math.abs(x[i] - y[i]) > 2) changed++;
        return { changed, total: x.length };
      },
      { feature, time, region },
    );
    assert.equal(
      result.changed > 0,
      expected,
      `${name}: ${JSON.stringify(result)}`,
    );
    await p.screenshot({ path: `${out}/occlusion-${name}.png` });
    results.push({ name, ...result });
  }
  writeFileSync(`${out}/occlusion.json`, JSON.stringify(results, null, 2));
  console.log(results);
} finally {
  await browser.close();
  await server.close();
}
