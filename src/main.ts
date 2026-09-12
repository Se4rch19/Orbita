import {
  t as message,
  language,
  resolveLanguage,
  selectLanguage,
} from "./i18n.ts";
import { Lesson } from "./tutorial";
import {
  guideCard,
  lessonCard,
  worldCoaching,
  featureCoaching,
} from "./identity-ui";
import { GUIDE_NAME, markSeen } from "./presentation-state";
import { showIntro } from "./intro";
import {
  worldHome,
  modePanel,
  worldPlayable,
  type HomeMode,
} from "./world-home";
import { normalizeQuality, qualityLevels, VisualQuality } from "./quality";
import { acquireExtra, environmentParts, compatible } from "./environment";
import "./style.css";
import "./redesign.css";
import "./forge.css";
import "./mobile.css";
import "./identity.css";
import "./polish.css";
import { bindScreenSwipe } from "./input";
import {
  playHome,
  settingsContent,
  continuation,
  mobileJournal,
} from "./mobile-ui";
import {
  hydrateNative,
  persistNative,
  nativeDebug,
  flushNative,
} from "./native-storage";
import { dailyMobile } from "./config";
import { readSave, writeSave, resetSave } from "./storage3";
import {
  defaultDesign,
  discover,
  acquire,
  savePlanet,
  component,
  slotLimit,
  type Category,
  type Planet,
} from "./forge";
import { settle, type Context } from "./progression3";
import {
  encodeStreamChallenge as encodeChallenge,
  canonicalChallenge,
  decodeChallenge,
  challengeGame,
  anomaly,
  resultText,
} from "./challenges";
import {
  forgePage,
  collectionPage,
  profilePage,
  codesPage,
  anomalyPage,
  discoveries,
  escape,
} from "./universe-ui";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Game, dailySeed, type Mode } from "./engine";
import { worlds, refreshUnlocks } from "./storage";
import { dailyChallenge, sessionConfig, levelNames } from "./config";
import {
  levelUnlocked,
  nextLevel,
  todayRecord,
  markDailyPlayed,
  bestFor,
  earnedFragments,
} from "./progression";
import { Art } from "./art";
import { Sound } from "./audio";
import { musicSignals } from "./music-signals";
import { installInteractionLock } from "./interaction-lock";
installInteractionLock();
let lesson: Lesson | null = null;
let pendingCoach: (() => void) | null = null;
let lessonHazard = -1;
let lessonHits = 0;
const root = document.querySelector<HTMLDivElement>("#app")!;
let save = readSave(),
  mode: Mode = "voyage",
  page = "play",
  game: Game | null = null,
  art: Art | null = null,
  paused = false,
  last = performance.now(),
  resultSaved = false,
  modalKind = "",
  toastTimer = 0;
let browsedWorld = save.world;
let homeMode: HomeMode = "voyage";
let browseToken = 0;
let selectedLevel = nextLevel(save, save.world),
  zenDuration: 60 | 180 | 0 = 60,
  sessionBest = 0,
  banked = 0,
  nextBank = 60,
  hudElapsed = 0;
let activeContext: Context = { kind: "normal" };
let forgeSlot = save.universe.selected,
  forgeCategory: Category = "shape",
  collectionCategory: Category = "shape",
  personalProfile = save.world,
  challengeCode = "";
let draft: Planet = structuredClone(
  save.universe.planets[forgeSlot] ?? {
    name: message("m_52d03be84a"),
    design: defaultDesign(),
  },
);
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const contextName = () =>
  activeContext.kind === "personal"
    ? message("m_8b06db129f")
    : activeContext.kind === "code"
      ? message("m_f70c636dec")
      : activeContext.kind === "anomaly"
        ? message("m_4ae9f242aa")
        : game
          ? names[game.mode]
          : "";
const sound = new Sound();
const visualQuality = new VisualQuality(
  navigator.hardwareConcurrency,
  (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4,
);
const names: Record<Mode, string> = {
  voyage: message("m_bce3d2abe3"),
  zen: message("m_b0b8fc593c"),
  daily: message("m_128f39eee8"),
  infinite: message("m_47ab7fb410"),
  tutorial: message("m_70eb8e355e"),
};
const icons: Record<string, string> = {
  orbit: message("m_91dbc8d5f5"),
  settings:
    '<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm0-6.1 1.1 2.8a7.5 7.5 0 0 1 2.3 1l2.8-1.1 1.8 1.8-1.1 2.8a7.5 7.5 0 0 1 1 2.3l2.8 1.1v2.6l-2.8 1.1a7.5 7.5 0 0 1-1 2.3l1.1 2.8-1.8 1.8-2.8-1.1a7.5 7.5 0 0 1-2.3 1L12 22l-1.1-2.8a7.5 7.5 0 0 1-2.3-1l-2.8 1.1L4 17.5l1.1-2.8a7.5 7.5 0 0 1-1-2.3l-2.8-1.1V8.7l2.8-1.1a7.5 7.5 0 0 1 1-2.3L4 2.5l1.8-1.8 2.8 1.1a7.5 7.5 0 0 1 2.3-1L12 2.1Z"/>',
  star: message("m_7e59b8faef"),
  arrow: message("m_a8baa4243c"),
  award: message("m_6dcae87620"),
  leaf: message("m_f998cefab5"),
  close: message("m_e5877af1ba"),
  pause: message("m_5e91b240fb"),
  check: message("m_319c8941c0"),
  sound: message("m_1bc54bb656"),
  switch: message("m_f5426cacf1"),
  lock: message("m_7af861e434"),
  heart: message("m_53d710ec3d"),
};
const icon = (name: string, size = 22) =>
  message("m_ff102339a0", {
    p0: size,
    p1: size,
    p2: icons[name] || icons.star,
  });
const fmt = (n: number) => n.toLocaleString(language);
function persist() {
  const ok = writeSave(save);
  if (!ok) toast(message("m_c923528a59"));
  if (ok) persistNative(save);
  return ok;
}
function preferences() {
  sound.enabled = save.mobile.effects;
  sound.musicEnabled = save.mobile.music;
  document.body.classList.toggle("reduced", !save.motion);
  if (art) {
    art.motion =
      save.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (art.quality.choice !== (save.presentation.quality ?? "auto"))
      art.quality.set(save.presentation.quality ?? "auto");
  }
}
function toast(message: string) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.role = "status";
  el.textContent = message;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.remove(), 4000);
}
function header() {
  const selected = ["forge", "collection"].includes(page)
    ? page
    : page === "journal"
      ? "journal"
      : "play";
  return (
    message("m_c02626adb4") +
    icon("orbit", 27) +
    message("m_afaf8bcd31") +
    icon("settings", 19) +
    message("m_7d8c7ac484") +
    [
      ["play", message("home.worlds")],
      ["forge", message("m_09cfdee8ca")],
      ["collection", message("home.collection")],
      ["journal", message("m_32f15c9f72")],
    ]
      .map(
        ([id, label]) =>
          '<button data-action="page" data-page="' +
          id +
          message("m_1eb75800cc") +
          (id === selected ? "active" : "") +
          '" ' +
          (id === selected ? 'aria-current="page"' : "") +
          ">" +
          label +
          (id === "forge" && save.universe.pending.length
            ? message("m_fa4e9f2992")
            : "") +
          "</button>",
      )
      .join("") +
    "</nav>"
  );
}
function home() {
  return worldHome(save, browsedWorld, homeMode);
}
function campaign() {
  const w = save.world,
    p = save.campaign[w];
  return message("m_62e48b3aa5", {
    p0: worlds[w].name,
    p1: worlds[w].mechanic,
    p2: worlds
      .map((world, i) =>
        message("m_c14cc5995d", {
          p0: i,
          p1: i === w ? "selected" : "",
          p2: save.unlockedWorlds[i] ? "" : "◦ ",
          p3: world.name,
        }),
      )
      .join(""),
    p3: levelNames[w]
      .map((name, l) => {
        const c = sessionConfig("voyage", { world: w, level: l }),
          open = levelUnlocked(save, w, l);
        return message("m_25603c64b1", {
          p0: open ? "" : "locked",
          p1: p.cleared[l] ? icon("check") : String(l + 1).padStart(2, "0"),
          p2:
            l === 0
              ? message("m_ea51bd8526")
              : l === 1
                ? message("m_5c3b44af47")
                : message("m_0718ec4d1b"),
          p3: name,
          p4: c.duration,
          p5: c.targetLights,
          p6: p.cleared[l]
            ? message("state.complete")
            : open
              ? message("m_02d7db393e")
              : message("m_0da4113fa2"),
          p7: fmt(p.best[l]),
          p8: open ? "primary" : "secondary",
          p9: l,
          p10: open ? "" : "disabled",
          p11: open ? message("state.play") : message("state.locked"),
          p12: name,
          p13: open
            ? p.cleared[l]
              ? message("state.repeat")
              : message("state.play")
            : icon("lock", 17),
        });
      })
      .join(""),
    p4: save.campaign.every((p) => p.cleared.every(Boolean))
      ? message("m_b827ae056c")
      : "",
    p5: icon("arrow", 16),
  });
}
function worldsPage() {
  return message("m_f264c6aa2a", {
    p0: worlds
      .map((w, i) => {
        const unlocked = save.unlockedWorlds[i];
        return message("m_04c332c615", {
          p0: i === save.world ? "selected" : "",
          p1: unlocked ? "" : "locked",
          p2: i,
          p3: w.name,
          p4: unlocked
            ? i === save.world
              ? message("state.selected")
              : message("state.choose")
            : message("state.locked"),
          p5: w.shape.kind,
          p6: w.color,
          p7: w.dark,
          p8: w.name,
          p9: w.mechanic,
          p10: unlocked
            ? message("m_028549f27d", {
                p0: save.campaign[i].cleared.filter(Boolean).length,
              })
            : message("m_df4180107f", { p0: w.cost, p1: worlds[i - 1]?.name }),
          p11: icon(unlocked ? "arrow" : "lock", 15),
        });
      })
      .join(""),
  });
}
function journal() {
  const daily = todayRecord(save, dailySeed());
  return message("m_2f8824dadb", {
    p0: fmt(save.infiniteBest),
    p1: save.bestCombo,
    p2: daily.best,
    p3: worlds
      .map((w, i) =>
        message("m_9321c8d75d", {
          p0: icon(
            save.campaign[i].cleared.every(Boolean) ? "check" : "orbit",
            19,
          ),
          p1: w.name,
          p2: fmt(Math.max(...save.campaign[i].best)),
          p3: save.campaign[i].cleared.filter(Boolean).length,
        }),
      )
      .join(""),
    p4: save.runs,
    p5: save.history.length
      ? save.history
          .slice(0, 8)
          .map((h) =>
            message("m_cb0ebd0074", {
              p0: names[h.mode],
              p1: fmt(h.score),
              p2: h.lights,
            }),
          )
          .join("")
      : message("m_03c988ff65"),
    p6: save.legacyBest
      ? message("m_df74fad2d1", { p0: fmt(save.legacyBest) })
      : "",
  });
}
function privacy() {
  return message("m_9872fd16a8", { p0: icon("arrow", 16) });
}
function render() {
  browseToken++;
  game = null;
  musicSignals.observe(null, false);
  paused = false;
  art = null;
  root.innerHTML = message("m_6823a5ebd0", {
    p0: header(),
    p1: !["play", "forge", "collection", "journal"].includes(page)
      ? message("m_867193c0b1")
      : "",
    p2: page !== "play" ? discoveries(save) : "",
    p3:
      page === "play"
        ? home()
        : page === "worlds"
          ? worldsPage()
          : page === "journal"
            ? journal() + mobileJournal(save) + profilePage(save)
            : page === "forge"
              ? forgePage(
                  save,
                  draft,
                  forgeSlot,
                  forgeCategory,
                  personalProfile,
                )
              : page === "collection"
                ? collectionPage(save, collectionCategory)
                : page === "codes"
                  ? codesPage(save, challengeCode)
                  : page === "anomalies"
                    ? anomalyPage(save)
                    : page === "campaign"
                      ? campaign()
                      : privacy(),
  });
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  if (canvas) {
    art = new Art(canvas);
    art.quality = visualQuality;
    art.world =
      page === "forge"
        ? personalProfile
        : page === "play"
          ? browsedWorld
          : save.world;
    art.cinematic = page === "play" || page === "forge";
    if (page === "forge") {
      art.custom = draft.design;
      let dragX: number | null = null;
      canvas.addEventListener("pointerdown", (e) => {
        dragX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (dragX !== null) {
          art!.rotation += (e.clientX - dragX) * 0.01;
          dragX = e.clientX;
        }
      });
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
        canvas.addEventListener(name, () => {
          dragX = null;
        });
    }
  }
  const feature =
    page === "forge"
      ? "forge"
      : page === "codes"
        ? "codes"
        : page === "anomalies"
          ? "anomalies"
          : "";
  if (feature && markSeen(save.presentation, feature)) {
    const copy = featureCoaching[feature];
    root
      .querySelector("main")!
      .insertAdjacentHTML("afterbegin", guideCard(copy[0], copy[1]));
    persist();
  }
  document.body.classList.toggle("ambient-off", !save.motion);
  preferences();
}
let previousFocus: HTMLElement | null = null;
function modal(kind: string, body: string) {
  const existing = document.querySelector(".modal-backdrop");
  if (!existing) previousFocus = document.activeElement as HTMLElement;
  existing?.remove();
  modalKind = kind;
  const wrapper = document.createElement("div");
  wrapper.className = "modal-backdrop";
  wrapper.innerHTML = message("m_0f19b6a291", {
    p0:
      kind === "result"
        ? message("m_bbf648dcf0")
        : kind === "pause"
          ? message("m_41a5dd65dd")
          : kind === "tutorial"
            ? message("m_688a91d9f8")
            : message("settings.title"),
    p1: body,
  });
  document.body.append(wrapper);
  root.inert = true;
  setTimeout(
    () => wrapper.querySelector<HTMLButtonElement>("button")?.focus(),
    20,
  );
}
function closeModal() {
  pendingCoach = null;
  document.querySelector(".modal-backdrop")?.remove();
  modalKind = "";
  root.inert = false;
  previousFocus?.focus();
}
function settings() {
  modal(
    "settings",
    settingsContent(save) +
      `<h3 class="section-label">${message("quality.label")}</h3><select id="quality-setting" aria-label="${message("quality.label")}">${qualityLevels.map((value) => `<option value="${value}" ${(save.presentation.quality ?? "auto") === value ? "selected" : ""}>${message("quality." + value)}</option>`).join("")}</select><p class="tiny quality-resolved">${message("quality.resolved", { level: message("quality." + visualQuality.level) })}</p><p class="tiny">${message("quality.help")}</p>` +
      `<h3 class="section-label">${message("language.label")}</h3><select id="language-setting" aria-label="${message("language.label")}">${["system", "es-MX", "en-US"].map((value, i) => `<option value="${value}" ${save.presentation.language === value ? "selected" : ""}>${message(["language.system", "language.es", "language.en"][i])}</option>`).join("")}</select><p class="tiny">${message("language.help")}</p>`,
  );
}
function openCalm() {
  mode = "zen";
  modal(
    "calm",
    message("m_7d80396763") +
      [
        [60, message("m_540cd5220e")],
        [180, message("m_1b045aef58")],
        [0, message("m_a3920279e2")],
      ]
        .map(
          ([value, label]) =>
            '<button class="secondary" data-action="calm-start" data-duration="' +
            value +
            '">' +
            label +
            "</button>",
        )
        .join("") +
      message("m_f188788460"),
  );
}
function tutorial() {
  start("tutorial", 0);
  lesson = new Lesson();
  game!.teachingScene();
  showLesson();
}
function showLesson() {
  document.querySelector(".lesson-card")?.remove();
  if (!lesson || lesson.finished) return;
  paused = !lesson.running;
  if ([1, 2].includes(lesson.step)) game!.cooldown = 0;
  root
    .querySelector(".game-bottom")!
    .insertAdjacentHTML("beforebegin", lessonCard(lesson));
  root.querySelector(".game-bottom")!.classList.add("lesson-controls");
  updateHud();
}
function lessonProgress(event: import("./tutorial").LessonEvent) {
  if (!lesson?.accept(event)) return;
  if (lesson.finished) {
    save.presentation.tutorial = "complete";
    save.presentation.seen.push("world-0");
    persist();
    lesson = null;
    document.querySelector(".lesson-card")?.remove();
    paused = false;
    game!.stop();
    finish();
    return;
  }
  if (lesson.step === 3 || lesson.step === 6) {
    if (lesson.step === 6) game!.combo = 0;
    game!.teachingScene();
  }
  if (lesson.step === 4) {
    game!.teachingScene(true);
    lessonHazard = game!.items.find(
      (i) => i.kind === "hazard" && !i.passed,
    )!.id;
    lessonHits = game!.lives;
  }
  showLesson();
}
function start(
  runMode: Mode = mode,
  level = selectedLevel,
  context: Context = { kind: "normal" },
) {
  if (
    context.kind === "normal" &&
    runMode === "voyage" &&
    !levelUnlocked(save, save.world, level)
  ) {
    toast(message("m_c3ac942dfe"));
    return;
  }
  if (runMode !== "tutorial") {
    const wi =
      context.kind === "personal"
        ? personalProfile
        : runMode === "daily"
          ? dailyMobile().world
          : context.kind === "anomaly"
            ? anomaly(context.tier, 0).world
            : runMode === "infinite"
              ? 0
              : save.world;
    const feature =
      context.kind === "personal"
        ? "personal"
        : runMode === "daily"
          ? "daily"
          : runMode === "infinite"
            ? "infinite"
            : "";
    const firstFeature = feature ? markSeen(save.presentation, feature) : false;
    const firstWorld =
      context.kind === "code"
        ? false
        : markSeen(save.presentation, "world-" + wi);
    if (firstFeature || firstWorld) {
      persist();
      const copy = firstFeature
        ? [...featureCoaching[feature]]
        : [...worldCoaching[wi]];
      if (firstFeature && firstWorld) copy[1] += " " + worldCoaching[wi][1];
      pendingCoach = () => start(runMode, level, context);
      modal("coach", guideCard(copy[0], copy[1]));
      return;
    }
  }
  lesson = null;
  closeModal();
  resultSaved = false;
  banked = 0;
  nextBank = 60;
  hudElapsed = 0;
  selectedLevel = level;
  activeContext = context;
  game =
    context.kind === "code"
      ? challengeGame(context.code)
      : context.kind === "anomaly"
        ? (() => {
            const q = anomaly(context.tier, randomSeed());
            return new Game("voyage", q.seed, {
              ...q,
              mobile: true,
              stream: true,
              assistance: save.mobile.assistance,
            });
          })()
        : new Game(runMode, randomSeed(), {
            mobile: true,
            stream: true,
            assistance: save.mobile.assistance,
            journey: context.kind === "normal" && runMode === "infinite",
            world:
              runMode === "infinite" && context.kind === "normal"
                ? 0
                : context.kind === "personal"
                  ? personalProfile
                  : save.world,
            level: context.kind === "personal" ? 0 : level,
            zenDuration,
            date: dailySeed(),
          });
  game.config.assistance = save.mobile.assistance;
  sessionBest =
    context.kind === "personal"
      ? save.universe.personalBest[game.config.world]
      : context.kind === "code"
        ? (save.universe.challenges.find((r) => r.code === context.code)
            ?.best ?? 0)
        : context.kind === "anomaly"
          ? save.universe.anomalyBest
          : bestFor(save, game);
  if (runMode === "daily") {
    markDailyPlayed(save, game.config.dailyDate);
    const previous = save.mobile.daily.find(
      (r) => r.date === game!.config.dailyDate,
    );
    save.mobile.daily = [
      {
        date: game.config.dailyDate,
        attempts: (previous?.attempts ?? 0) + 1,
        tier: previous?.tier ?? 0,
        best: previous?.best ?? 0,
        assisted: previous?.assisted ?? save.mobile.assistance,
      },
      ...save.mobile.daily.filter((r) => r.date !== game!.config.dailyDate),
    ].slice(0, 31);
    persist();
  }
  paused = false;
  const g = game;
  root.innerHTML = message("m_28929fa1b0", {
    p0: icon("orbit", 25),
    p1: contextName(),
    p2:
      activeContext.kind === "personal"
        ? escape(draft.name)
        : worlds[g.config.world].name,
    p3: icon("pause", 18),
    p4: g.gentle ? "∞" : "●●●",
    p5: g.gentle ? message("m_cc64b3b94c") : message("m_c04b33f6cb"),
    p6: Number.isFinite(g.duration) ? g.duration : "0:00",
    p7: Number.isFinite(g.duration)
      ? message("m_245bd50e7a")
      : message("m_b4ca4d5579"),
    p8: sessionBest
      ? message("m_b9279e37a2", { p0: fmt(sessionBest) })
      : message("m_425afcacfa"),
  });
  art = new Art(root.querySelector("canvas")!);
  art.quality = visualQuality;
  art.world = g.config.world;
  art.visualSeed = context.kind === "anomaly" ? g.seed : 41;
  if (context.kind === "personal") art.custom = structuredClone(draft.design);
  preferences();
  sound.flavor =
    context.kind === "personal"
      ? draft.design.biome === "biome-crystal"
        ? "crystal"
        : ["biome-lava", "biome-dead"].includes(draft.design.biome ?? "")
          ? "deep"
          : draft.design.biome === "biome-dunes"
            ? "warm"
            : "neutral"
      : "neutral";
  sound.init();
  last = performance.now();
  bindScreenSwipe(
    root.querySelector("canvas")!,
    (delta) => switchOrbit(delta, true),
    () => save.mobile.controls === "classic",
  );
  updateHud();
}
function switchOrbit(delta = 1, gesture = false) {
  if (lesson && [1, 2].includes(lesson.step)) {
    if (!gesture || (lesson.step === 1 ? delta !== 1 : delta !== -1)) return;
    if (game!.move(delta)) {
      sound.switch();
      lessonProgress(delta > 0 ? "out" : "in");
    }
    return;
  }
  if (!game || paused || game.done) return;
  if (!game.move(delta)) return;
  sound.switch();
  if (save.haptic && Capacitor.isNativePlatform())
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
function pause() {
  if (!game || game.done) return;
  paused = true;
  sound.pause();
  const calm = game.mode === "zen";
  modal(
    "pause",
    message("m_a92020c4dc", {
      p0: icon("arrow"),
      p1: calm ? message("m_2a2e26bb70") : "",
      p2:
        game.mode === "tutorial"
          ? message("m_6fdedd8ebc")
          : message("m_5b234c4e8c"),
      p3: calm ? message("m_ba3c8f92ff") : message("m_bfee69e84b"),
    }),
  );
}
function finish() {
  if (!game || resultSaved) return;
  resultSaved = true;
  const g = game,
    r = settle(save, g, activeContext, banked)!;
  if (!r) return;
  persist();
  sound.finish();
  if (g.mode === "tutorial" && !lesson) {
    modal(
      "result",
      message("m_a92ac5cb91", {
        p0:
          g.outcome === "cleared"
            ? message("m_9afb8a6a47")
            : message("m_f9399fa365"),
        p1:
          g.outcome === "cleared"
            ? message("m_ece7e403b9")
            : message("m_9f6fdcbff3"),
        p2: r.discoveries
          .map((t) => message("m_d3a4cbb8af", { p0: t }))
          .join(""),
        p3: discoveries(save),
        p4: icon("arrow"),
      }),
    );
    return;
  }
  const comparable = g.mode !== "zen",
    delta = g.score - r.previous,
    cleared = g.outcome === "cleared";
  const next =
    activeContext.kind === "normal" &&
    g.mode === "voyage" &&
    cleared &&
    g.config.level < 2;
  modal(
    "result",
    message("m_1b330bc766", {
      p0:
        g.mode === "zen"
          ? message("m_66b07837a8")
          : comparable && delta > 0
            ? message("m_18e7ae9ef3")
            : cleared
              ? message("m_fc676cd99f")
              : message("m_868ed7cff9"),
      p1:
        g.mode === "zen"
          ? message("m_7865dd92d1")
          : cleared
            ? message("m_ffc04387c9")
            : g.mode === "infinite"
              ? message("m_101c39cdb3")
              : g.lives <= 0
                ? message("m_1556d8963b")
                : message("m_7d9c2ff8fe"),
      p2: fmt(g.score),
      p3: contextName(),
      p4: worlds[g.config.world].name,
      p5:
        g.mode === "voyage"
          ? message("m_9d2f59725e", { p0: g.config.level + 1 })
          : "",
      p6: comparable
        ? message("m_a9e0dd56ff", {
            p0: fmt(r.previous),
            p1: delta >= 0 ? "+" : "",
            p2: fmt(delta),
          })
        : "",
      p7: r.earned + r.bonus,
      p8: g.bestCombo,
      p9: Math.floor(g.time),
      p10: r.bonus ? message("m_65c484f6b5", { p0: r.bonus }) : "",
      p11: r.unlocked
        .map((i) =>
          message("m_6d3ca5ad3c", { p0: icon("leaf", 18), p1: worlds[i].name }),
        )
        .join(""),
      p12:
        g.mode === "zen"
          ? message("m_312f59aa70")
          : g.mode === "infinite"
            ? message("m_7adda116a6")
            : message("m_c256787ae1", {
                p0: g.lights,
                p1: g.config.targetLights,
                p2: Math.floor(g.time),
                p3: g.duration,
                p4: cleared ? message("m_780f0a4e60") : message("m_c623dccf17"),
              }),
      p13: g.config.dailyTiers
        ? message("m_27463af20a", {
            p0:
              g.outcome === "cleared"
                ? [
                    message("m_c61180093d"),
                    message("tier.stellar"),
                    message("m_ad2ad28d14"),
                  ][g.config.dailyTiers.filter((t) => g.lights >= t).length - 1]
                : message("m_fa8c21d842"),
            p1:
              g.outcome === "cleared"
                ? g.config.dailyTiers.filter((t) => g.lights >= t).length
                : 0,
            p2: g.config.dailyTiers
              .map(
                (t, i) =>
                  [
                    message("m_c61180093d"),
                    message("tier.stellar"),
                    message("m_ad2ad28d14"),
                  ][i] +
                  ": " +
                  t +
                  message("m_dfdf1ee5d0"),
              )
              .join(" · "),
          })
        : "",
      p14: g.config.assistance ? message("m_cd3a959e51") : "",
      p15: r.discoveries
        .map((t) => message("m_d3a4cbb8af", { p0: t }))
        .join(""),
      p16: discoveries(save),
      p17:
        activeContext.kind === "code"
          ? message("m_749b1f7fe0", {
              p0: escape(resultText(activeContext.code, g)),
            })
          : "",
      p18: next ? message("m_c0a6c0a916", { p0: icon("arrow") }) : "",
      p19: next ? "secondary" : "primary",
      p20:
        g.mode === "daily" ? message("m_ef8befb3d2") : message("m_bd210e8ab7"),
      p21: icon("arrow"),
      p22: g.mode === "voyage" ? "campaign" : "result-home",
      p23:
        g.mode === "voyage" ? message("m_c22d89f29e") : message("m_93e549b700"),
    }),
  );
}
function updateHud() {
  if (!game) return;
  const g = game;
  document.getElementById("score")!.textContent = fmt(g.score);
  const seconds = Math.floor(g.time);
  document.getElementById("timer")!.textContent = Number.isFinite(g.duration)
    ? String(Math.ceil(g.duration - g.time))
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  document.getElementById("hearts")!.textContent =
    g.mode === "zen"
      ? "∞"
      : "●".repeat(Math.max(0, g.lives)) + "○".repeat(3 - Math.max(0, g.lives));
  document.getElementById("time-fill")!.style.width = Number.isFinite(
    g.duration,
  )
    ? `${(1 - g.time / g.duration) * 100}%`
    : "100%";
  const delta = g.score - sessionBest;
  document.getElementById("record-delta")!.textContent =
    g.mode === "zen" || g.mode === "tutorial"
      ? message("m_9f30e6be4e", { p0: g.combo, p1: g.multiplier })
      : `${delta >= 0 ? "+" : ""}${fmt(delta)}`;
  let objective = g.config.targetLights
    ? message("m_22c61c7569", { p0: g.lights, p1: g.config.targetLights })
    : g.mode === "infinite"
      ? message("m_d76dfa996d", {
          p0: Math.round(g.intensity.phase * 100),
          p1: g.config.orbits.length,
        })
      : g.mode === "zen"
        ? message("m_bce3d05509", { p0: g.lights, p1: earnedFragments(g) })
        : "";
  if (g.reversalWarning && g.config.assistance)
    objective = message("m_a25f6e9f67");
  if (g.mode === "tutorial" && !lesson) {
    const steps =
      g.time < 6
        ? [message("m_a6fce7d49c"), message("m_fefc0e4c61")]
        : g.time < 13
          ? [message("m_ea827ee814"), message("m_313995ff82")]
          : g.time < 22
            ? [message("m_425df180b1"), message("m_0ad225cf3b")]
            : [message("m_f36297954e"), message("m_e5ba4188a3")];
    objective = steps[0];
    document.getElementById("travel-guide")!.textContent = steps[1];
  }
  if (g.config.dailyTiers)
    objective =
      g.config.dailyTiers
        .map(
          (t, i) =>
            [
              message("m_c61180093d"),
              message("tier.stellar"),
              message("m_ad2ad28d14"),
            ][i] +
            " " +
            t,
        )
        .join(" · ") +
      message("m_1e98bed17f") +
      g.lights;
  if (g.transitionUntil > g.time)
    objective = message("m_d110ec7f97") + Math.ceil(g.transitionUntil - g.time);
  if (lesson) {
    document.getElementById("timer")!.textContent = lesson.step + 1 + "/8";
    objective = message("m_78ead7f92c");
    document.getElementById("travel-guide")!.textContent = "";
  }
  document.getElementById("destination-name")!.textContent =
    contextName() +
    " · " +
    (activeContext.kind === "personal"
      ? draft.name
      : worlds[g.config.world].name);
  document.getElementById("objective")!.textContent =
    objective + (g.config.assistance ? message("m_6cced3714e") : "");
  root.querySelector<HTMLButtonElement>(
    '[data-action="switch-back"]',
  )!.disabled = g.lane === 0;
  root.querySelector<HTMLButtonElement>('[data-action="switch"]')!.disabled =
    g.lane === g.config.orbits.length - 1;
}
function commitPlanet() {
  if (!savePlanet(save, forgeSlot, draft.name, draft.design)) {
    toast(message("m_0d9c6c3cd8"));
    return false;
  }
  draft = structuredClone(save.universe.planets[forgeSlot]);
  discover(save);
  return persist();
}
function launchAnomaly() {
  if (!save.campaign.every((p) => p.cleared.every(Boolean))) {
    toast(message("m_004109ddb7"));
    return;
  }
  start("voyage", 0, { kind: "anomaly", tier: save.universe.anomalyTier });
}
async function copyText(text: string) {
  try {
    if (!navigator.clipboard) throw new Error();
    await navigator.clipboard.writeText(text);
    toast(message("m_23b4c1a898"));
  } catch {
    if (modalKind === "result") {
      const field =
        document.querySelector<HTMLTextAreaElement>(".share-result");
      field?.focus();
      field?.select();
      toast(message("m_54df1315e9"));
      return;
    }
    modal(
      "copy",
      message("m_d3c0c374f2") + escape(text) + message("m_67073c75f4"),
    );
    document.querySelector<HTMLTextAreaElement>(".share-result")?.select();
  }
}
document.addEventListener("input", (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id === "planet-name") {
    draft.name = input.value;
    const label = document.getElementById("planet-preview-name");
    if (label) label.textContent = input.value;
  }
  if (input.id === "challenge-code") challengeCode = input.value;
});
document.addEventListener("change", async (e) => {
  const input = e.target as HTMLSelectElement;
  if (input.id === "quality-setting") {
    save.presentation.quality = normalizeQuality(input.value);
    persist();
    preferences();
  }
  if (input.id === "language-setting") {
    save.presentation.language = ["es-MX", "en-US"].includes(input.value)
      ? (input.value as "es-MX" | "en-US")
      : "system";
    persist();
    await flushNative();
    location.reload();
    return;
  }
  if (input.id === "control-setting") {
    save.mobile.controls = input.value === "classic" ? "classic" : "radial";
    persist();
  }
  if (input.id === "personal-profile") {
    const value = Number(input.value);
    if (save.unlockedWorlds[value]) {
      personalProfile = value;
      render();
    }
  }
});
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!b) return;
  const action = b.dataset.action;
  switch (action) {
    case "browse-world": {
      const destination = Number(b.dataset.world);
      if (
        !Number.isInteger(destination) ||
        destination < 0 ||
        destination > 4 ||
        destination === browsedWorld
      )
        break;
      const token = ++browseToken;
      const panel = root.querySelector<HTMLElement>(".world-home");
      panel?.classList.add("departing");
      const reduced =
        !save.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(
        () => {
          if (token !== browseToken || page !== "play") return;
          browsedWorld = destination;
          musicSignals.emit({ type: "world-changed", value: destination });
          if (worldPlayable(save, destination)) {
            save.world = destination;
            persist();
          }
          render();
          root.querySelector(".world-home")?.classList.add("arriving");
        },
        reduced ? 0 : 320,
      );
      break;
    }
    case "home-mode":
      homeMode = b.dataset.mode as HomeMode;
      root
        .querySelectorAll<HTMLElement>('[data-action="home-mode"]')
        .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
      (
        root.querySelector('[data-action="world-play"]') as HTMLButtonElement
      ).disabled =
        !worldPlayable(save, browsedWorld) &&
        ["voyage", "zen"].includes(homeMode);
      {
        const labels = [
          "m_bce3d2abe3",
          "m_b0b8fc593c",
          "m_128f39eee8",
          "m_47ab7fb410",
        ];
        const modes: HomeMode[] = ["voyage", "zen", "daily", "infinite"];
        const panel = modePanel(save, browsedWorld, homeMode);
        const target = root.querySelector<HTMLElement>(".mode-panel");
        if (target)
          target.innerHTML = `<strong>${message(labels[modes.indexOf(homeMode)])}</strong><p>${panel[0]}</p><small>${panel[1]}</small>`;
      }
      break;
    case "world-play":
      if (
        ["voyage", "zen"].includes(homeMode) &&
        !worldPlayable(save, browsedWorld)
      )
        break;
      if (worldPlayable(save, browsedWorld)) {
        save.world = browsedWorld;
        persist();
      }
      mode = homeMode;
      if (homeMode === "zen") openCalm();
      else start(homeMode, nextLevel(save, save.world));
      break;
    case "coach-close": {
      const resume = pendingCoach;
      pendingCoach = null;
      if (resume) {
        closeModal();
        resume();
      } else document.querySelector(".luma-card")?.remove();
      break;
    }
    case "lesson-next":
      lessonProgress("next");
      break;
    case "lesson-skip":
      if (save.presentation.tutorial === "new")
        save.presentation.tutorial = "skipped";
      persist();
      lesson = null;
      closeModal();
      page = "play";
      render();
      break;
    case "onboarding-skip":
      save.presentation.tutorial = "skipped";
      persist();
      closeModal();
      break;
    case "environment-part": {
      const id = b.dataset.id!;
      const part = environmentParts.find((p) => p.id === id);
      if (!part || !compatible(draft.design, id)) break;
      if (b.dataset.preview) {
        if (art) art.custom = { ...draft.design, [part.category]: id };
        document.getElementById("planet-preview-name")!.textContent = message(
          "forge.preview",
          { name: part.name },
        );
        toast(message("forge.previewHelp"));
        break;
      }
      if (!save.presentation.owned.includes(id) && !acquireExtra(save, id)) {
        toast(message("m_0ef5516b28"));
        break;
      }
      draft.design[part.category] = id;
      persist();
      render();
      break;
    }
    case "guide-worlds":
      modal(
        "guide",
        worldCoaching.map((c) => guideCard(c[0], c[1], "close")).join(""),
      );
      break;
    case "continue": {
      const next = continuation(save);
      if (next.complete) {
        page = "anomalies";
        render();
      } else {
        save.world = next.world;
        selectedLevel = next.level;
        persist();
        start("voyage", selectedLevel);
      }
      break;
    }
    case "mobile-daily":
      mode = "daily";
      start("daily");
      break;
    case "mobile-infinite":
      mode = "infinite";
      start("infinite", 0);
      break;
    case "mobile-calm":
      openCalm();
      break;
    case "calm-start":
      zenDuration = Number(b.dataset.duration) as 60 | 180 | 0;
      start("zen");
      break;
    case "back":
      closeModal();
      page = page === "collection" ? "forge" : "play";
      render();
      break;
    case "data-settings":
      modal("data", message("m_a60f4b9046"));
      break;
    case "open-forge":
      closeModal();
      page = "forge";
      render();
      save.universe.introduced = true;
      persist();
      break;
    case "open-collection":
      save.universe.pending = [];
      persist();
      closeModal();
      page = "collection";
      render();
      break;
    case "open-codes":
      closeModal();
      page = "codes";
      render();
      break;
    case "open-anomalies":
      page = "anomalies";
      render();
      break;
    case "ack-discoveries":
      save.universe.pending = [];
      persist();
      document
        .querySelectorAll(".discovery-panel")
        .forEach((el) => el.remove());
      break;
    case "forge-slot": {
      const slot = Number(b.dataset.slot);
      if (
        slot < 0 ||
        slot >= slotLimit(save) ||
        slot > save.universe.planets.length
      )
        break;
      forgeSlot = slot;
      draft = structuredClone(
        save.universe.planets[slot] ?? {
          name: message("m_52d03be84a"),
          design: defaultDesign(),
        },
      );
      render();
      break;
    }
    case "forge-category":
      forgeCategory = b.dataset.category as Category;
      render();
      break;
    case "collection-category":
      collectionCategory = b.dataset.category as Category;
      render();
      break;
    case "forge-equip": {
      const c = component(b.dataset.component!);
      if (c && !save.universe.inventory.includes(c.id)) {
        if (!compatible({ ...draft.design, [c.category]: c.id }, c.id)) {
          toast(message("m_55c86f3bed"));
          break;
        }
        if (art) art.custom = { ...draft.design, [c.category]: c.id };
        document.getElementById("planet-preview-name")!.textContent = message(
          "forge.preview",
          { name: c.name },
        );
        toast(message("forge.previewHelp"));
        break;
      }
      if (c && save.universe.inventory.includes(c.id)) {
        if (!compatible({ ...draft.design, [c.category]: c.id }, c.id)) {
          toast(message("m_55c86f3bed"));
          break;
        }
        draft.design[c.category] = c.id;
        render();
      }
      break;
    }
    case "forge-acquire":
      if (acquire(save, b.dataset.component!)) {
        discover(save);
        persist();
        render();
        toast(message("m_dc1f8d2d03"));
      }
      break;
    case "forge-save":
      if (commitPlanet()) {
        render();
        toast(message("m_ec5e8d193d"));
      }
      break;
    case "personal-play":
      if (commitPlanet()) start("infinite", 0, { kind: "personal" });
      break;
    case "code-create": {
      const world = Number(
          (document.getElementById("code-world") as HTMLSelectElement).value,
        ),
        level = Number(
          (document.getElementById("code-level") as HTMLSelectElement).value,
        );
      if (!save.unlockedWorlds[world]) break;
      challengeCode = encodeChallenge({ seed: randomSeed(), world, level });
      render();
      break;
    }
    case "code-play":
      try {
        challengeCode = canonicalChallenge(
          (document.getElementById("challenge-code") as HTMLInputElement).value,
        );
        start("voyage", 0, { kind: "code", code: challengeCode });
      } catch (e) {
        toast((e as Error).message);
      }
      break;
    case "code-copy":
      try {
        const code = canonicalChallenge(
          (document.getElementById("challenge-code") as HTMLInputElement).value,
        );
        void copyText(code);
      } catch (e) {
        toast((e as Error).message);
      }
      break;
    case "code-history":
      challengeCode = b.dataset.code!;
      render();
      break;
    case "share-result":
      if (game && activeContext.kind === "code")
        void copyText(resultText(activeContext.code, game));
      break;
    case "anomaly-play":
      launchAnomaly();
      break;
    case "home":
    case "result-home":
    case "abandon":
      closeModal();
      page = "play";
      render();
      break;
    case "page":
      page = b.dataset.page!;
      render();
      if (page === "forge") {
        save.universe.introduced = true;
        persist();
      }
      break;
    case "privacy":
      page = "privacy";
      render();
      break;
    case "mode":
      mode = b.dataset.mode as Mode;
      render();
      break;
    case "world": {
      const i = Number(b.dataset.world);
      if (!save.unlockedWorlds[i]) {
        toast(
          message("m_a12ecdf41e", {
            p0: worlds[i].name,
            p1: worlds[i - 1]?.name,
            p2: worlds[i].cost,
            p3: save.totalLights,
          }),
        );
        break;
      }
      save.world = i;
      selectedLevel = nextLevel(save, i);
      if (mode === "voyage") page = "campaign";
      persist();
      render();
      toast(message("m_4fe42832cc", { p0: worlds[i].name }));
      break;
    }
    case "settings":
      settings();
      break;
    case "close":
      closeModal();
      break;
    case "toggle": {
      const key = b.dataset.setting!;
      if (["music", "effects", "assistance"].includes(key)) {
        const k = key as "music" | "effects" | "assistance";
        save.mobile[k] = !save.mobile[k];
      } else {
        const k = key as "haptic" | "motion";
        save[k] = !save[k];
      }
      persist();
      preferences();
      settings();
      if (save.mobile.music || save.mobile.effects) sound.init();
      break;
    }
    case "play":
      if (mode === "voyage") {
        page = "campaign";
        render();
      } else start();
      break;
    case "campaign":
      closeModal();
      mode = "voyage";
      page = "campaign";
      render();
      break;
    case "level":
      start("voyage", Number(b.dataset.level));
      break;
    case "duration":
      zenDuration = Number(b.dataset.duration) as 60 | 180 | 0;
      render();
      break;
    case "training":
      tutorial();
      break;
    case "next-level":
      start("voyage", selectedLevel + 1);
      break;
    case "switch-back":
      switchOrbit(-1);
      break;
    case "end-calm":
      closeModal();
      paused = false;
      game?.stop();
      finish();
      break;
    case "guide":
      modal("guide", message("m_8d5bd410e6"));
      break;
    case "help":
      tutorial();
      break;
    case "switch":
      switchOrbit();
      break;
    case "pause":
      pause();
      break;
    case "resume":
      closeModal();
      paused = lesson ? !lesson.running : false;
      last = performance.now();
      break;
    case "replay":
      if (activeContext.kind === "anomaly") launchAnomaly();
      else start(game?.mode ?? mode, selectedLevel, activeContext);
      break;
    case "reset-confirm":
      modal(
        "reset",
        message("m_422a399f3e", {
          p0: fmt(save.totalLights),
          p1: icon("check"),
        }),
      );
      break;
    case "reset":
      {
        const reset = resetSave();
        if (!reset) {
          toast(message("m_3e2934908d"));
          break;
        }
        save = reset;
        persistNative(save, true);
        selectedLevel = 0;
        forgeSlot = 0;
        personalProfile = 0;
        draft = { name: message("m_52d03be84a"), design: defaultDesign() };
        challengeCode = "";
      }
      closeModal();
      page = "play";
      render();
      toast(message("m_561cbd2860"));
      break;
  }
});
document.addEventListener("keydown", (e) => {
  if (modalKind) {
    if (e.key === "Tab") {
      const buttons = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".modal button, .modal textarea, .modal input, .modal select",
        ),
      );
      const first = buttons[0],
        lastButton = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastButton?.focus();
      } else if (!e.shiftKey && document.activeElement === lastButton) {
        e.preventDefault();
        first?.focus();
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (modalKind === "pause") {
        closeModal();
        paused = lesson ? !lesson.running : false;
        last = performance.now();
      } else if (modalKind === "settings" || modalKind === "reset")
        closeModal();
    }
    return;
  }
  if (game && !game.done) {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code,
      ) &&
      !e.repeat
    ) {
      e.preventDefault();
      switchOrbit(["ArrowDown", "ArrowLeft"].includes(e.code) ? -1 : 1);
    }
    if (e.code === "Escape" || e.code === "KeyP") {
      e.preventDefault();
      pause();
    }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game && !game.done && !paused) pause();
    void sound.ctx?.suspend();
  } else if (save.mobile.music || save.mobile.effects) void sound.ctx?.resume();
});
if (Capacitor.isNativePlatform()) {
  void App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive && game && !game.done && !paused) pause();
  });
  void App.addListener("backButton", () => {
    if (game && !game.done) {
      if (!paused) pause();
      else if (modalKind === "pause") {
        closeModal();
        paused = lesson ? !lesson.running : false;
        last = performance.now();
        sound.init();
      } else pause();
      return;
    }
    if (game?.done) {
      closeModal();
      page = "play";
      render();
      return;
    }
    if (modalKind) {
      closeModal();
      return;
    }
    if (page !== "play") {
      page = page === "collection" ? "forge" : "play";
      render();
      return;
    }
    void App.minimizeApp();
  });
}
function frame(now: number) {
  if (lesson && paused && game)
    game.radiusLane += (game.lane - game.radiusLane) * 0.2;
  const dt = Math.max(0, (now - last) / 1000);
  last = now;
  if (game && !paused && !game.done) {
    game.update(dt);
    if (art && art.world !== game.config.world) {
      art.world = game.config.world;
      art.visualSeed =
        game.destination >= 5 ? game.seed + game.destination : 41;
      art.layerKey = "";
      if (
        game.mode === "infinite" &&
        markSeen(save.presentation, "world-" + game.config.world)
      ) {
        persist();
        paused = true;
        sound.pause();
        const copy = worldCoaching[game.config.world];
        pendingCoach = () => {
          paused = false;
          last = performance.now();
          sound.init();
        };
        modal("coach", guideCard(copy[0], copy[1]));
      }
    }
    hudElapsed += dt;
    for (const event of game.events) {
      if (event.type === "collect") {
        musicSignals.emit({ type: "light-collected" });
        if (lesson?.step === 3) lessonProgress("collect");
        else if (lesson?.step === 6) {
          if (game.combo >= 5) lessonProgress("chain");
          else game.teachingScene();
        }
        sound.collect(game.combo);
        art?.burst(event.angle, event.lane, "#ffda9a", game);
        document.getElementById("feedback")!.textContent =
          game.combo >= 5
            ? message("m_b91ae6642c", { p0: game.combo, p1: game.multiplier })
            : message("m_364095a10b", { p0: event.amount });
      }
      if (event.type === "hit") {
        musicSignals.emit({ type: "shield-hit" });
        if (!game.gentle) musicSignals.emit({ type: "damage" });
        if (game.gentle) sound.note(174, 0.4, 0.025);
        else sound.hit();
        art?.burst(event.angle, event.lane, "#ff9f98", game);
        document.getElementById("feedback")!.textContent = game.gentle
          ? message("m_bf98bbc90e")
          : message("m_9e0173489b");
        if (save.haptic && Capacitor.isNativePlatform())
          void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }
      if (event.type === "reverse")
        document.getElementById("feedback")!.textContent =
          message("m_ad4da91d47");
    }
    game.events.length = 0;
    if (lesson?.step === 4) {
      const hazard = game.items.find((i) => i.id === lessonHazard);
      if (hazard?.passed || !hazard) {
        if (game.lives === lessonHits && game.lane === 1)
          lessonProgress("avoid");
        else {
          game.lane = 0;
          game.teachingScene(true);
          lessonHazard = game.items.find(
            (i) => i.kind === "hazard" && !i.passed,
          )!.id;
          lessonHits = game.lives;
        }
      }
    }
    if (game.mode === "zen" && game.time >= nextBank) {
      const earned = earnedFragments(game),
        delta = earned - banked;
      if (delta > 0) {
        save.totalLights += delta;
        banked = earned;
        refreshUnlocks(save);
        persist();
      }
      nextBank += 60;
    }
    if (hudElapsed >= 1 / 15 || game.done) {
      updateHud();
      hudElapsed = 0;
    }
    if (game.done) finish();
  }
  musicSignals.observe(game, paused);
  if (game)
    sound.tick(
      game.config.world,
      game.intensity.phase,
      game.combo,
      game.gentle,
      !paused && !game.done && !document.hidden,
    );
  else sound.pause();
  if (!document.hidden)
    art?.draw(now / 1000, game, paused ? 0 : Math.min(dt, 0.1));
  requestAnimationFrame(frame);
}
window.addEventListener("orbita-storage-error", () =>
  toast(message("m_29c972028b")),
);
void (async () => {
  save = await hydrateNative();
  if (
    resolveLanguage(save.presentation.language, navigator.language) !== language
  ) {
    location.reload();
    return;
  }
  selectLanguage(save.presentation.language);
  selectedLevel = nextLevel(save, save.world);
  browsedWorld = save.world;
  forgeSlot = save.universe.selected;
  personalProfile = save.world;
  draft = structuredClone(
    save.universe.planets[forgeSlot] ?? {
      name: message("m_52d03be84a"),
      design: defaultDesign(),
    },
  );
  discover(save);
  persist();
  render();
  const introState = structuredClone(save.presentation);
  save.presentation.launches++;
  persist();
  const welcome = () => {
    document.querySelector(".brand-intro")?.remove();
    if (save.presentation.tutorial === "new")
      modal(
        "onboarding",
        guideCard(
          message("m_885900606c"),
          message("welcome.copy", { name: GUIDE_NAME }),
          "training",
        ) + message("m_532a378fe8"),
      );
  };
  const ready = Promise.all([
    document.fonts.ready,
    new Promise((resolve) =>
      requestAnimationFrame(() => {
        art?.draw(0, null, 0);
        resolve(true);
      }),
    ),
  ]);
  void showIntro(
    introState,
    save.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches,
    ready,
    browsedWorld,
    welcome,
  );
  if (
    nativeDebug ||
    import.meta.env.DEV ||
    /qa=(031|040|041)/.test(location.search)
  ) {
    Object.defineProperty(window, "__orbitaDiagnostics", {
      get: () =>
        game
          ? {
              time: game.time,
              lesson: lesson?.step ?? null,
              pool: {
                allocated: game.pool.allocated,
                free: game.pool.free.length,
                reused: game.pool.reused,
              },
              score: game.score,
              lane: game.lane,
              radiusLane: game.radiusLane,
              world: game.config.world,
              destination: game.destination,
              transition: game.transitionUntil,
              mode: game.mode,
              done: game.done,
              lives: game.lives,
              angle: game.angle,
              direction: game.direction,
              speed: game.speed,
              items: game.items,
              orbits: game.config.orbits,
              assistance: game.config.assistance,
              music: sound.diagnostics,
            }
          : null,
    });
    Object.defineProperty(window, "__orbitaVisualDiagnostics", {
      get: () => ({
        world: art?.world,
        quality: visualQuality.level,
        choice: visualQuality.choice,
        budget: visualQuality.budget,
        sceneTime: art?.sceneTime,
        motion: art?.motion,
        cachedScenes: art?.planetLayer ? 1 : 0,
      }),
    });
  }
  requestAnimationFrame(frame);
})();
if (
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
