import "./style.css";
import "./redesign.css";
import "./forge.css";
import "./mobile.css";
import { bindRadial } from "./input";
import {
  playHome,
  settingsContent,
  continuation,
  mobileJournal,
} from "./mobile-ui";
import { hydrateNative, persistNative, nativeDebug } from "./native-storage";
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
  encodeMobileChallenge as encodeChallenge,
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
    name: "Mi pequeño mundo",
    design: defaultDesign(),
  },
);
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const contextName = () =>
  activeContext.kind === "personal"
    ? "Mi órbita"
    : activeContext.kind === "code"
      ? "Reto por código"
      : activeContext.kind === "anomaly"
        ? "Anomalía"
        : game
          ? names[game.mode]
          : "";
const sound = new Sound();
const names: Record<Mode, string> = {
  voyage: "Expedición",
  zen: "Calma",
  daily: "Del día",
  infinite: "Infinito",
  tutorial: "Entrenamiento",
};
const icons: Record<string, string> = {
  orbit:
    '<ellipse cx="12" cy="12" rx="11" ry="6" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="4"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m9 3 1-1h4l1 3 3 1 3 2-1 3 1 3-3 2-3 1-1 3h-4l-1-3-3-1-3-2 1-3-1-3 3-2 3-1Z"/>',
  star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-2 10 6-3 6 3-2-10"/>',
  leaf: '<path d="M4 20C1 9 8 3 21 3c0 14-7 21-17 17Zm0 0L16 8"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  sound: '<path d="m4 9 4 0 5-5v16l-5-5H4Zm13-2q6 5 0 10"/>',
  switch: '<path d="M3 8h17l-4-4M21 16H4l4 4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  heart:
    '<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 2 11 8 15 6-4 13-10 8-15Z"/>',
};
const icon = (name: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
const fmt = (n: number) => n.toLocaleString("es-MX");
function persist() {
  const ok = writeSave(save);
  if (!ok)
    toast("No se pudo guardar. Revisa el espacio disponible del dispositivo.");
  if (ok) persistNative(save);
  return ok;
}
function preferences() {
  sound.enabled = save.mobile.effects;
  sound.musicEnabled = save.mobile.music;
  document.body.classList.toggle("reduced", !save.motion);
  if (art) art.motion = save.motion;
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
    ? "forge"
    : page === "journal"
      ? "journal"
      : "play";
  return (
    '<header><button class="brand" data-action="home" aria-label="Órbita, inicio">' +
    icon("orbit", 27) +
    ' ÓRBITA</button><button class="icon-button" data-action="settings" aria-label="Ajustes">' +
    icon("settings", 19) +
    '</button></header><nav class="bottom-nav" aria-label="Navegación principal">' +
    [
      ["play", "JUGAR"],
      ["forge", "FORJA"],
      ["journal", "BITÁCORA"],
    ]
      .map(
        ([id, label]) =>
          '<button data-action="page" data-page="' +
          id +
          '" class="' +
          (id === selected ? "active" : "") +
          '" ' +
          (id === selected ? 'aria-current="page"' : "") +
          ">" +
          label +
          (id === "forge" && save.universe.pending.length
            ? '<i class="forge-dot" aria-label="Nuevos descubrimientos"></i>'
            : "") +
          "</button>",
      )
      .join("") +
    "</nav>"
  );
}
function home() {
  return playHome(save);
}
function campaign() {
  const w = save.world,
    p = save.campaign[w];
  return `<h2 class="page-title">${worlds[w].name}: tu siguiente paso.</h2><p class="page-intro">${worlds[w].mechanic}</p><div class="world-tabs" aria-label="Mundos de campaña">${worlds.map((world, i) => `<button data-action="world" data-world="${i}" class="${i === w ? "selected" : ""}">${save.unlockedWorlds[i] ? "" : "◦ "}${world.name}</button>`).join("")}</div><div class="level-list">${levelNames[
    w
  ]
    .map((name, l) => {
      const c = sessionConfig("voyage", { world: w, level: l }),
        open = levelUnlocked(save, w, l);
      return `<article class="level-card ${open ? "" : "locked"}"><div class="level-number">${p.cleared[l] ? icon("check") : String(l + 1).padStart(2, "0")}</div><div class="level-copy"><span class="eyebrow">${l === 0 ? "DESCUBRE" : l === 1 ? "ADÁPTATE" : "DOMINA"}</span><h3>${name}</h3><p>Resiste ${c.duration} s y recoge ${c.targetLights} luces.</p><small>${p.cleared[l] ? "Superada" : open ? "Por explorar" : "Completa la expedición anterior"} · Mejor: ${fmt(p.best[l])}</small></div><button class="${open ? "primary" : "secondary"}" data-action="level" data-level="${l}" ${open ? "" : "disabled"} aria-label="${open ? "Jugar" : "Bloqueada"}: ${name}">${open ? (p.cleared[l] ? "Repetir" : "Jugar") : icon("lock", 17)}</button></article>`;
    })
    .join(
      "",
    )}</div><p class="page-intro">Cada intento cambia la ruta. Tu primer éxito en cada expedición suma una bonificación de 20, 25 o 30 fragmentos.</p>${save.campaign.every((p) => p.cleared.every(Boolean)) ? `<button class="primary" data-action="open-anomalies">Continuar hacia Anomalías</button>` : ""}<button class="text-button" data-action="home">Volver a los modos ${icon("arrow", 16)}</button>`;
}
function worldsPage() {
  return `<h2 class="page-title">Cinco mundos. Cinco formas de viajar.</h2><p class="page-intro">Elige un planeta para tu campaña, Calma o Infinito. Cada uno cambia las reglas del camino.</p><div class="world-grid">${worlds
    .map((w, i) => {
      const unlocked = save.unlockedWorlds[i];
      return `<button class="world-card ${i === save.world ? "selected" : ""} ${unlocked ? "" : "locked"}" data-action="world" data-world="${i}" aria-label="${w.name}, ${unlocked ? (i === save.world ? "seleccionado" : "elegir") : "bloqueado"}"><div class="mini"><div class="mini-planet shape-${w.shape.kind}" style="--p:${w.color};--d:${w.dark}"></div></div><h3>${w.name}</h3><p>${w.mechanic}</p><div class="world-status"><span>${unlocked ? `${save.campaign[i].cleared.filter(Boolean).length}/3 expediciones · Elegir` : `${w.cost} fragmentos + ${worlds[i - 1]?.name} completo`}</span>${icon(unlocked ? "arrow" : "lock", 15)}</div></button>`;
    })
    .join("")}</div>`;
}
function journal() {
  const daily = todayRecord(save, dailySeed());
  return `<h2 class="page-title">Cada viaje cuenta.</h2><p class="page-intro">Tus marcas viven aquí. Solo compites contigo.</p><div class="journal-grid"><div class="journal-card"><strong>${fmt(save.infiniteBest)}</strong><span>Récord de Infinito</span></div><div class="journal-card"><strong>${save.bestCombo}</strong><span>Mejor cadena</span></div><div class="journal-card"><strong>${daily.best}</strong><span>Mejor reto de hoy</span></div></div><h3 class="section-label">Tu campaña</h3>${worlds.map((w, i) => `<div class="mission"><div class="mission-icon">${icon(save.campaign[i].cleared.every(Boolean) ? "check" : "orbit", 19)}</div><div><strong>${w.name}</strong><p>Mejor expedición local: ${fmt(Math.max(...save.campaign[i].best))}</p></div><span>${save.campaign[i].cleared.filter(Boolean).length} / 3</span></div>`).join("")}<h3 class="section-label">Últimos viajes · ${save.runs} en total</h3>${
    save.history.length
      ? save.history
          .slice(0, 8)
          .map(
            (h) =>
              `<div class="history-row">${names[h.mode]}<span>${fmt(h.score)} puntos · +${h.lights} fragmentos</span></div>`,
          )
          .join("")
      : '<p class="empty">Tu primera historia empieza con un toque.</p>'
  }${save.legacyBest ? `<p class="page-intro">Conservamos tu récord de la versión anterior: ${fmt(save.legacyBest)} puntos. Las nuevas expediciones tienen sus propias marcas.</p>` : ""}`;
}

function privacy() {
  return `<h2 class="page-title">Tu universo es tuyo.</h2><div class="privacy-copy"><p>Órbita 0.3.1 funciona sin cuenta, anuncios, compras, rastreadores ni servicios de analítica.</p><h3>Qué se guarda</h3><p>En este dispositivo se guardan tus puntuaciones, luces, mundos, planetas personales, componentes, hitos, códigos jugados, últimos viajes y preferencias. No se envían a un servidor. Al desinstalar o borrar los datos de la aplicación puedes perderlos.</p><h3>Controles</h3><p>En Ajustes puedes desactivar sonido, vibración y animaciones ambientales, o borrar tu progreso. La vibración depende de la compatibilidad del dispositivo.</p><h3>Versión de prueba</h3><p>Esta es una versión local de prueba. Antes de publicar en una tienda se debe añadir la identidad y el contacto del responsable de la aplicación a la política de privacidad y completar las declaraciones de la tienda.</p><button class="text-button" data-action="home">Volver al universo ${icon("arrow", 16)}</button></div>`;
}
function render() {
  game = null;
  paused = false;
  art = null;
  root.innerHTML = `<div id="shell">${header()}<main>${!["play", "forge", "journal"].includes(page) ? `<button class="text-button back-control" data-action="back">← Volver</button>` : ""}${page !== "play" ? discoveries(save) : ""}${page === "play" ? home() : page === "worlds" ? worldsPage() : page === "journal" ? journal() + mobileJournal(save) + profilePage(save) : page === "forge" ? forgePage(save, draft, forgeSlot, forgeCategory, personalProfile) : page === "collection" ? collectionPage(save, collectionCategory) : page === "codes" ? codesPage(save, challengeCode) : page === "anomalies" ? anomalyPage(save) : page === "campaign" ? campaign() : privacy()}</main><footer><span>Hecho para encontrar tu ritmo.</span><button class="text-button" style="font-size:9px;padding:0;color:inherit" data-action="privacy">Sin conexión · Privacidad</button></footer></div>`;
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  if (canvas) {
    art = new Art(canvas);
    art.world = page === "forge" ? personalProfile : save.world;
    if (page === "forge") art.custom = draft.design;
  }
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
  wrapper.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${kind === "result" ? "Resultado del viaje" : kind === "pause" ? "Juego en pausa" : kind === "tutorial" ? "Cómo jugar" : "Ajustes"}">${body}</section>`;
  document.body.append(wrapper);
  root.inert = true;
  setTimeout(
    () => wrapper.querySelector<HTMLButtonElement>("button")?.focus(),
    20,
  );
}
function closeModal() {
  document.querySelector(".modal-backdrop")?.remove();
  modalKind = "";
  root.inert = false;
  previousFocus?.focus();
}
function settings() {
  modal("settings", settingsContent(save));
}
function tutorial() {
  start("tutorial", 0);
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
    toast("Completa la expedición anterior para abrir este camino.");
    return;
  }
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
              assistance: save.mobile.assistance,
            });
          })()
        : new Game(runMode, randomSeed(), {
            mobile: true,
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
        assisted: save.mobile.assistance,
      },
      ...save.mobile.daily.filter((r) => r.date !== game!.config.dailyDate),
    ].slice(0, 31);
    persist();
  }
  paused = false;
  const g = game;
  root.innerHTML = `<div class="game-shell"><div class="game-header"><span class="brand">${icon("orbit", 25)} ÓRBITA</span><span id="destination-name" class="eyebrow" style="font-size:8px;letter-spacing:1px">${contextName()} · ${activeContext.kind === "personal" ? escape(draft.name) : worlds[g.config.world].name}</span><button class="icon-button" data-action="pause" aria-label="Pausar juego">${icon("pause", 18)}</button></div><div class="time-track"><i id="time-fill"></i></div><div class="game-hud"><div><div id="score" class="score-num">0</div><span class="hud-label">PUNTOS DE LUZ</span></div><div><div id="hearts" class="hearts">${g.gentle ? "∞" : "●●●"}</div><span class="hud-label" style="text-align:center">${g.gentle ? "A TU RITMO" : "ESCUDOS"}</span></div><div><div id="timer" class="timer">${Number.isFinite(g.duration) ? g.duration : "0:00"}</div><span class="hud-label">${Number.isFinite(g.duration) ? "RESTANTES" : "EXPLORANDO"}</span></div></div><div class="record-bar"><span id="record-best">${sessionBest ? `MEJOR ${fmt(sessionBest)}` : "TU PRIMERA MARCA"}</span><span id="record-delta"></span></div><div class="objective-bar" id="objective"></div><div class="arena-wrap"><canvas class="game-canvas" aria-label="Arena orbital. Desliza hacia fuera o hacia el planeta." role="img"></canvas><div class="arena-label" id="feedback">SIGUE LOS DIAMANTES DORADOS</div></div><div class="game-bottom"><p class="radial-hint">Desliza hacia fuera o hacia el planeta.</p><div class="orbit-controls"><button class="secondary" data-action="switch-back" aria-label="Órbita interior">↓ Dentro</button><button class="primary" data-action="switch" aria-label="Órbita exterior">↑ Fuera</button></div><p id="travel-guide">Cada gesto cambia un camino. Los extremos no se conectan.</p></div></div>`;
  art = new Art(root.querySelector("canvas")!);
  art.world = g.config.world;
  if (context.kind === "personal") art.custom = structuredClone(draft.design);
  preferences();
  sound.init();
  last = performance.now();
  bindRadial(
    root.querySelector("canvas")!,
    switchOrbit,
    () => save.mobile.controls === "classic",
  );
  updateHud();
}
function switchOrbit(delta = 1) {
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
    `<span class="eyebrow">El universo puede esperar</span><h2>Toma un respiro.</h2><p>Tu viaje está en pausa. Continúa cuando quieras.</p><div class="modal-actions"><button class="primary" data-action="resume">Seguir el viaje ${icon("arrow")}</button><button class="secondary" data-action="guide">Recordar controles</button>${calm ? '<button class="secondary" data-action="end-calm">Terminar y guardar</button>' : ""}<button class="text-button" data-action="abandon">${game.mode === "tutorial" ? "Salir del entrenamiento" : "Salir al inicio"}</button></div><p class="tiny">${calm ? "Terminar guarda tu luz; al salir solo se conserva lo guardado al cumplir cada minuto." : "Si sales ahora, este viaje no se guarda."}</p>`,
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
  if (g.mode === "tutorial") {
    modal(
      "result",
      `<span class="eyebrow">Entrenamiento independiente</span><h2>${g.outcome === "cleared" ? "Ya conoces el camino." : "Prueba un pequeño cambio."}</h2><p>${g.outcome === "cleared" ? "Cambiaste de órbita y recogiste luz. Los diamantes suman puntos; los fragmentos coral consumen escudos. Cada 5 luces seguidas aumenta tu multiplicador." : "Desliza hacia fuera o dentro y recoge al menos una luz antes de terminar. Puedes repetir sin perder nada."}</p><p>El entrenamiento no da recursos por repetición. Su primer hito puede descubrir piezas y conceder una recompensa única.</p>${r.discoveries.map((t) => `<div class="new-milestone">${t}</div>`).join("")}${discoveries(save)}<div class="modal-actions"><button class="primary" data-action="campaign">Elegir una expedición ${icon("arrow")}</button><button class="secondary" data-action="training">Repetir entrenamiento</button></div>`,
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
    `<span class="eyebrow">${g.mode === "zen" ? "Tu pausa, a tu manera" : comparable && delta > 0 ? "Una nueva mejor marca" : cleared ? "Objetivo cumplido" : "El viaje continúa"}</span><h2>${g.mode === "zen" ? "Un momento para ti." : cleared ? "Expedición superada." : g.mode === "infinite" ? "Así de lejos llegaste." : g.lives <= 0 ? "Un camino por dominar." : "Faltó un poco de luz."}</h2><div class="result-score">${fmt(g.score)}</div><p>${contextName()} · ${worlds[g.config.world].name}${g.mode === "voyage" ? ` · ${g.config.level + 1}/3` : ""}</p>${comparable ? `<div class="score-comparison"><span>Anterior: ${fmt(r.previous)}</span><strong>${delta >= 0 ? "+" : ""}${fmt(delta)} puntos</strong></div>` : ""}<div class="result-details"><div><b>+${r.earned + r.bonus}</b><span>fragmentos ganados</span></div><div><b>${g.bestCombo}</b><span>mejor cadena</span></div><div><b>${Math.floor(g.time)} s</b><span>explorando</span></div></div>${r.bonus ? `<div class="new-world">Bonificación del viaje: +${r.bonus} fragmentos extra.</div>` : ""}${r.unlocked.map((i) => `<div class="new-world">${icon("leaf", 18)} Nuevo mundo: ${worlds[i].name}</div>`).join("")}<p>${g.mode === "zen" ? "Cada 4 luces aportan un fragmento, hasta 6 por minuto. Lo guardado durante la sesión ya está incluido." : g.mode === "infinite" ? "Cada intento dibuja un camino nuevo. Tu mejor marca queda contigo." : `Objetivo: ${g.lights}/${g.config.targetLights} luces · ${Math.floor(g.time)}/${g.duration} s. ${cleared ? "La próxima expedición te espera." : "Sobrevive y reúne la luz indicada para superarlo."}`}</p>${g.config.dailyTiers ? `<div class="daily-result"><strong>${["Señal", "Estelar", "Cósmica"][Math.max(0, g.config.dailyTiers.filter((t) => g.lights >= t).length - 1)]} · ${g.outcome === "cleared" ? g.config.dailyTiers.filter((t) => g.lights >= t).length : 0}/3</strong><p>${g.config.dailyTiers.map((t, i) => ["Señal", "Estelar", "Cósmica"][i] + ": " + t + " luces").join(" · ")}</p></div>` : ""}${g.config.assistance ? `<p class="tiny">Partida asistida · 50% de fragmentos.</p>` : ""}${r.discoveries.map((t) => `<div class="new-milestone">${t}</div>`).join("")}${discoveries(save)}${activeContext.kind === "code" ? `<p class="tiny">Este reto no entrega fragmentos ni modifica la campaña.</p><textarea class="share-result" aria-label="Resumen para compartir" readonly>${escape(resultText(activeContext.code, g))}</textarea><button class="secondary" data-action="share-result">Copiar resultado</button>` : ""}<div class="modal-actions">${next ? `<button class="primary" data-action="next-level">Siguiente expedición ${icon("arrow")}</button>` : ""}<button class="${next ? "secondary" : "primary"}" data-action="replay">${g.mode === "daily" ? "Otro intento del reto" : "Volver a viajar"} ${icon("arrow")}</button><button class="secondary" data-action="${g.mode === "voyage" ? "campaign" : "result-home"}">${g.mode === "voyage" ? "Ver campaña" : "Volver a mi universo"}</button></div>`,
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
      ? `CADENA ${g.combo} · ×${g.multiplier}`
      : `${delta >= 0 ? "+" : ""}${fmt(delta)}`;
  let objective = g.config.targetLights
    ? `${g.lights} / ${g.config.targetLights} luces · Resiste hasta el final`
    : g.mode === "infinite"
      ? `Intensidad ${Math.round(g.intensity.phase * 100)}% · ${g.config.orbits.length} caminos`
      : g.mode === "zen"
        ? `${g.lights} luces · ${earnedFragments(g)} fragmentos · Sin derrota`
        : "";
  if (g.reversalWarning && g.config.assistance)
    objective = "EL GIRO ESTÁ POR CAMBIAR · PREPÁRATE";
  if (g.mode === "tutorial") {
    const steps =
      g.time < 6
        ? [
            "1/4 · Tu viajero avanza solo.",
            "El punto blanco es tu viajero. Tú eliges el camino.",
          ]
        : g.time < 13
          ? [
              "2/4 · Desliza hacia fuera o hacia dentro.",
              "Aleja el dedo del planeta para salir. Acércalo para entrar.",
            ]
          : g.time < 22
            ? [
                "3/4 · Esquiva los fragmentos coral.",
                "Un impacto consume un escudo. En campaña tienes tres.",
              ]
            : [
                "4/4 · Encadena luces para multiplicar.",
                "Cada 5 luces seguidas aumenta ×1, ×2, ×3 y hasta ×4.",
              ];
    objective = steps[0];
    document.getElementById("travel-guide")!.textContent = steps[1];
  }
  if (g.config.dailyTiers)
    objective =
      g.config.dailyTiers
        .map((t, i) => ["Señal", "Estelar", "Cósmica"][i] + " " + t)
        .join(" · ") +
      " luces | " +
      g.lights;
  if (g.transitionUntil > g.time)
    objective = "PRÓXIMO DESTINO · " + Math.ceil(g.transitionUntil - g.time);
  document.getElementById("destination-name")!.textContent =
    contextName() +
    " · " +
    (activeContext.kind === "personal"
      ? draft.name
      : worlds[g.config.world].name);
  document.getElementById("objective")!.textContent =
    objective + (g.config.assistance ? " · Asistencia · 50% fragmentos" : "");
  root.querySelector<HTMLButtonElement>(
    '[data-action="switch-back"]',
  )!.disabled = g.lane === 0;
  root.querySelector<HTMLButtonElement>('[data-action="switch"]')!.disabled =
    g.lane === g.config.orbits.length - 1;
}

function commitPlanet() {
  if (!savePlanet(save, forgeSlot, draft.name, draft.design)) {
    toast("Ese espacio aún no está disponible.");
    return false;
  }
  draft = structuredClone(save.universe.planets[forgeSlot]);
  discover(save);
  return persist();
}
function launchAnomaly() {
  if (!save.campaign.every((p) => p.cleared.every(Boolean))) {
    toast("Completa la campaña para abrir Anomalías.");
    return;
  }
  start("voyage", 0, { kind: "anomaly", tier: save.universe.anomalyTier });
}
async function copyText(text: string) {
  try {
    if (!navigator.clipboard) throw new Error();
    await navigator.clipboard.writeText(text);
    toast("Texto copiado. Puedes compartirlo cuando quieras.");
  } catch {
    if (modalKind === "result") {
      const field =
        document.querySelector<HTMLTextAreaElement>(".share-result");
      field?.focus();
      field?.select();
      toast("Mantén pulsado el resumen para copiarlo.");
      return;
    }
    modal(
      "copy",
      '<h2>Tu reto, listo para llevar.</h2><p>Mantén pulsado el texto para copiarlo en este dispositivo.</p><textarea class="share-result" aria-label="Texto para copiar" readonly>' +
        escape(text) +
        '</textarea><button class="primary" data-action="close">Cerrar</button>',
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
document.addEventListener("change", (e) => {
  const input = e.target as HTMLSelectElement;
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
      mode = "zen";
      modal(
        "calm",
        '<h2>Un momento para ti.</h2><p>Sin derrota. Elige cuánto quieres viajar.</p><div class="modal-actions">' +
          [
            [60, "1 minuto"],
            [180, "3 minutos"],
            [0, "Sin límite"],
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
          '<button class="text-button" data-action="close">← Volver</button></div>',
      );
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
      modal(
        "data",
        '<h2>Tu progreso.</h2><p>Android puede respaldar únicamente el progreso y los ajustes mediante su servicio de copia del dispositivo. Su disponibilidad depende del sistema y de tu configuración; no es una cuenta de Órbita.</p><p>En este teléfono mantenemos además una copia local anterior. Desinstalar puede borrar datos si Android no los restaura.</p><div class="modal-actions"><button class="secondary" data-action="settings">← Ajustes</button><button class="text-button" data-action="reset-confirm">Restablecer progreso</button></div>',
      );
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
          name: "Mi pequeño mundo",
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
      if (c && save.universe.inventory.includes(c.id)) {
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
        toast("Componente fabricado. Ya puedes usarlo en la Forja.");
      }
      break;
    case "forge-save":
      if (commitPlanet()) {
        render();
        toast("Tu planeta está guardado en este dispositivo.");
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
          `Para abrir ${worlds[i].name}: completa ${worlds[i - 1]?.name} y reúne ${worlds[i].cost} fragmentos (llevas ${save.totalLights}).`,
        );
        break;
      }
      save.world = i;
      selectedLevel = nextLevel(save, i);
      if (mode === "voyage") page = "campaign";
      persist();
      render();
      toast(`${worlds[i].name} es ahora tu mundo.`);
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
      modal(
        "guide",
        `<span class="eyebrow">Recuerda el camino</span><h2>Lee. Decide. Cambia.</h2><p>Recoge diamantes dorados. Evita fragmentos coral y tramos rotos. Desliza alejándote del planeta para salir una órbita, o acercándote para entrar. También puedes usar Dentro y Fuera; los extremos no se conectan. Cada cinco luces seguidas sube el multiplicador. Perder una luz rompe la cadena; un impacto consume un escudo fuera de Calma.</p><button class="primary" data-action="resume">Seguir el viaje</button>`,
      );
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
      paused = false;
      last = performance.now();
      break;
    case "replay":
      if (activeContext.kind === "anomaly") launchAnomaly();
      else start(game?.mode ?? mode, selectedLevel, activeContext);
      break;
    case "reset-confirm":
      modal(
        "reset",
        `<span class="eyebrow">Empezar de nuevo</span><h2>¿Borrar tu universo?</h2><p>Se eliminarán tus ${fmt(save.totalLights)} luces, récords, mundos desbloqueados y preferencias de este dispositivo. Esta acción no se puede deshacer.</p><div class="modal-actions"><button class="primary" data-action="settings">Conservar mi progreso ${icon("check")}</button><button class="secondary" data-action="reset">Sí, borrar mi progreso</button></div>`,
      );
      break;
    case "reset":
      {
        const reset = resetSave();
        if (!reset) {
          toast("No se pudo borrar el progreso.");
          break;
        }
        save = reset;
        persistNative(save, true);
        selectedLevel = 0;
        forgeSlot = 0;
        personalProfile = 0;
        draft = { name: "Mi pequeño mundo", design: defaultDesign() };
        challengeCode = "";
      }
      closeModal();
      page = "play";
      render();
      toast("Tu universo vuelve a empezar.");
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
        paused = false;
        last = performance.now();
      } else if (modalKind === "settings" || modalKind === "reset")
        closeModal();
    }
    return;
  }
  if (game && !game.done) {
    if (
      (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") &&
      !e.repeat
    ) {
      e.preventDefault();
      switchOrbit(e.code === "ArrowDown" ? -1 : 1);
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
        paused = false;
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
  const dt = Math.max(0, (now - last) / 1000);
  last = now;
  if (game && !paused && !game.done) {
    game.update(dt);
    if (art && art.world !== game.config.world) {
      art.world = game.config.world;
      art.layerKey = "";
    }
    hudElapsed += dt;
    for (const event of game.events) {
      if (event.type === "collect") {
        sound.collect(game.combo);
        art?.burst(event.angle, event.lane, "#ffda9a", game);
        document.getElementById("feedback")!.textContent =
          game.combo >= 5
            ? `${game.combo} LUCES EN CADENA · ×${game.multiplier}`
            : `+${event.amount} · BIEN AHÍ`;
      }
      if (event.type === "hit") {
        if (game.gentle) sound.note(174, 0.4, 0.025);
        else sound.hit();
        art?.burst(event.angle, event.lane, "#ff9f98", game);
        document.getElementById("feedback")!.textContent = game.gentle
          ? "RESPIRA. ENCUENTRA TU RITMO."
          : "LEE EL CAMINO Y CAMBIA A TIEMPO";
        if (save.haptic && Capacitor.isNativePlatform())
          void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }
      if (event.type === "reverse")
        document.getElementById("feedback")!.textContent =
          "NUEVO SENTIDO · ADÁPTATE AL GIRO";
    }
    game.events.length = 0;
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
  toast(
    "No se pudo actualizar el respaldo nativo. Conservamos el guardado web local.",
  ),
);
void (async () => {
  save = await hydrateNative();
  selectedLevel = nextLevel(save, save.world);
  forgeSlot = save.universe.selected;
  personalProfile = save.world;
  draft = structuredClone(
    save.universe.planets[forgeSlot] ?? {
      name: "Mi pequeño mundo",
      design: defaultDesign(),
    },
  );
  discover(save);
  persist();
  render();
  if (nativeDebug || import.meta.env.DEV || location.search.includes("qa=031"))
    Object.defineProperty(window, "__orbitaDiagnostics", {
      get: () =>
        game
          ? {
              time: game.time,
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
