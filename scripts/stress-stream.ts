import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { Game, type Mode } from "../src/engine.ts";
import { anomaly } from "../src/challenges.ts";
import { STREAM_LIMIT, FORM_SECONDS } from "../src/stream.ts";
const result = {
  sessions: 0,
  simulatedSeconds: 0,
  maxAllocated: 0,
  maxLive: 0,
  reused: 0,
  formations: 0,
  minActivationReaction: Infinity,
  contexts: {} as Record<string, number>,
};
for (const context of ["campaign", "daily", "endless", "anomaly", "personal"]) {
  for (let seed = 0; seed < 400; seed++) {
    const mode: Mode =
      context === "daily"
        ? "daily"
        : context === "endless"
          ? "infinite"
          : "voyage";
    const profile =
      context === "anomaly"
        ? anomaly(seed % 15, seed)
        : { world: seed % 5, level: context === "personal" ? 0 : seed % 3 };
    const g = new Game(mode, seed, {
      mobile: true,
      stream: true,
      journey: context === "endless",
      ...profile,
      date: 20260910,
    });
    // Invulnerability is confined to simulation: it exercises full sessions, never writes player records.
    const known = new Set<number>(),
      target = context === "endless" ? 320 : Math.min(g.duration, 120);
    while (!g.done && g.time < target) {
      for (const i of g.items) {
        assert.ok(Number.isFinite(i.angle) && Number.isFinite(i.lane));
        assert.ok(
          (i.lane >= 0 && i.lane < g.config.orbits.length) ||
            i.life === "dissolving",
        );
        if (i.revealDistance !== undefined && !known.has(i.id)) {
          known.add(i.id);
          result.formations++;
          {
            const reaction =
              (i.revealDistance - (i.width ?? 0) / 2) /
                (i.revealSpeed! + 0.12) -
              FORM_SECONDS;
            assert.ok(
              i.revealDistance < Math.PI,
              "new visible entity must appear ahead",
            );
            result.minActivationReaction = Math.min(
              result.minActivationReaction,
              reaction,
            );
            assert.ok(
              reaction >= g.intensity.minReaction - 0.03,
              `${context}/${seed} reaction ${reaction}`,
            );
          }
        }
      }
      const lights = g.items
        .filter(
          (i) =>
            i.kind === "light" &&
            i.life !== "queued" &&
            !i.passed &&
            (i.angle - g.angle) * g.direction > 0,
        )
        .sort((a, b) => (a.angle - b.angle) * g.direction);
      const targetLane =
        seed % 4 === 0
          ? Math.floor(g.time * 7) % g.config.orbits.length
          : (lights[0]?.lane ?? g.lane);
      if (targetLane !== g.lane) g.move(Math.sign(targetLane - g.lane));
      g.invincible = 1000;
      g.update(0.1);
      g.events.length = 0;
      assert.ok(
        Number.isFinite(g.angle) &&
          Number.isFinite(g.velocity) &&
          Number.isFinite(g.time),
      );
      assert.ok(g.pool.allocated <= STREAM_LIMIT);
      assert.equal(g.pool.free.length + g.items.length, g.pool.allocated);
      result.maxAllocated = Math.max(result.maxAllocated, g.pool.allocated);
      result.maxLive = Math.max(result.maxLive, g.items.length);
    }
    assert.ok(known.size > 15, `${context}/${seed}: stalled population`);
    result.sessions++;
    result.simulatedSeconds += g.time;
    result.reused += g.pool.reused;
  }
  result.contexts[context] = 400;
}
writeFileSync(
  process.env.ORBITA_STRESS_OUT ?? "../outputs/Orbita-0.4.1/validation/stress-stream.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
