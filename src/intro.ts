import type { Presentation } from "./presentation-state.ts";
import { Art } from "./art";
import { t } from "./i18n.ts";
import { introPlan, introCanEnd } from "./intro-state";
export async function showIntro(
  state: Presentation,
  motion: boolean,
  ready: Promise<unknown>,
  world: number,
  done: () => void,
) {
  const plan = introPlan(state, motion);
  if (!plan.minimum) {
    await ready.catch(() => {});
    done();
    return;
  }
  const intro = document.createElement("button");
  intro.className =
    "brand-intro cinematic-intro" + (state.launches ? " repeat" : "");
  intro.setAttribute("aria-label", t("intro.skip"));
  intro.innerHTML = `<canvas class="intro-universe-canvas"></canvas><i class="intro-traveler"></i><strong>ÓRBITA</strong><small>${t("home.tagline")}</small><span class="intro-skip">${t("intro.skip")}</span>`;
  document.body.append(intro);
  const scene = new Art(intro.querySelector("canvas")!);
  scene.cinematic = true;
  scene.world = world;
  scene.quality.set(state.quality ?? "auto");
  let loaded = false,
    skipped = false,
    ended = false,
    previous = performance.now();
  const start = previous;
  void ready
    .catch(() => {})
    .then(() => {
      loaded = true;
    });
  intro.onclick = () => {
    if (performance.now() - start >= plan.skipAfter) skipped = true;
  };
  const end = () => {
    if (ended) return;
    ended = true;
    intro.remove();
    done();
  };
  const safety = setTimeout(end, plan.maximum);
  const frame = (now: number) => {
    if (ended) return;
    const elapsed = now - start;
    scene.draw(elapsed / 1000, null, (now - previous) / 1000);
    previous = now;
    if (introCanEnd(elapsed, loaded, plan.minimum, skipped)) {
      clearTimeout(safety);
      end();
    } else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
