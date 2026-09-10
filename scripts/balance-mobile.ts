import { Game } from "../src/engine.ts";
function pilot(g: Game) {
  while (!g.done) {
    const next = g.items
      .filter(
        (i) =>
          i.kind === "light" &&
          i.life !== "queued" &&
          !i.passed &&
          (i.angle - g.angle) * g.direction > 0,
      )
      .sort((a, b) => (a.angle - b.angle) * g.direction)[0];
    if (
      next &&
      ((next.angle - g.angle) * g.direction) /
        Math.max(0.5, Math.abs(g.velocity)) <
        1.1
    ) {
      let target = next.lane;
      if (
        g.config.orbits[target].direction !== g.config.orbits[g.lane].direction
      ) {
        const blocked = g.items
          .filter(
            (i) =>
              i.life !== "queued" &&
              i.angle === next.angle &&
              i.kind !== "light",
          )
          .map((i) => i.lane);
        target =
          g.config.orbits.find(
            (o) =>
              o.direction === g.config.orbits[g.lane].direction &&
              !blocked.includes(o.lane),
          )?.lane ?? target;
      }
      const crossesGap = g.items.some(
        (i) =>
          i.kind === "gap" &&
          !i.passed &&
          i.lane >= Math.min(g.radiusLane, target) - 0.43 &&
          i.lane <= Math.max(g.radiusLane, target) + 0.43 &&
          Math.abs(g.angle - i.angle) < (i.width ?? 0.32) / 2 + 0.05,
      );
      if (g.lane !== target && !crossesGap) {
        const n = g.config.orbits.length;
        g.move(Math.sign(target - g.lane));
      }
    }
    g.update(1 / 60);
    g.events.length = 0;
  }
  return {
    cleared: g.outcome === "cleared",
    lights: g.lights,
    hits: 3 - g.lives,
  };
}
const campaign = [];
for (let world = 0; world < 5; world++)
  for (let level = 0; level < 3; level++) {
    let wins = 0,
      lights = 0,
      hits = 0;
    for (let seed = 0; seed < 30; seed++) {
      const result = pilot(
        new Game("voyage", seed, { world, level, mobile: true, stream: true }),
      );
      wins += Number(result.cleared);
      lights += result.lights;
      hits += result.hits;
    }
    campaign.push({
      world,
      level,
      wins,
      attempts: 30,
      meanLights: Math.round(lights / 30),
      meanHits: Math.round((hits / 30) * 10) / 10,
    });
  }
let dailyWins = 0;
for (let day = 1; day <= 30; day++)
  for (let seed = 0; seed < 10; seed++)
    dailyWins += Number(
      pilot(
        new Game("daily", seed, {
          date: 20260900 + day,
          mobile: true,
          stream: true,
        }),
      ).cleared,
    );
console.log(
  JSON.stringify(
    {
      campaign,
      daily: { wins: dailyWins, attempts: 300 },
      note: "A scripted controller is evidence of reachable routes, not human playtesting or a formal solvability proof.",
    },
    null,
    2,
  ),
);
