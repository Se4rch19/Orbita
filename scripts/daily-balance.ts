import { Game } from "../src/engine.ts";
function pilot(g: Game) {
  while (!g.done) {
    const next = g.items
      .filter(
        (i) =>
          i.kind === "light" &&
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
          .filter((i) => i.angle === next.angle && i.kind !== "light")
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
    tiers: g.config.dailyTiers?.map((t) => g.lights >= t),
  };
}
const results = [];
for (let day = 1; day <= 30; day++) {
  const row = [];
  for (let seed = 0; seed < 10; seed++) {
    const g = new Game("daily", seed, { date: 20260900 + day, mobile: true });
    row.push({
      world: g.config.world,
      tiers: g.config.dailyTiers,
      ...pilot(g),
    });
  }
  results.push({
    day,
    world: row[0].world,
    tierTargets: new Game("daily", 0, { date: 20260900 + day, mobile: true })
      .config.dailyTiers,
    lights: row.map((r) => r.lights),
    wins: row.filter((r) => r.cleared).length,
    tierWins: [0, 1, 2].map((i) => row.filter((r) => r.tiers?.[i]).length),
  });
}
console.log(JSON.stringify(results, null, 2));
