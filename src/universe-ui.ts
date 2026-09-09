import {
  categories,
  components,
  component,
  balance,
  slotLimit,
  conditionMet,
  requirement,
  milestones,
  type Save,
  type Planet,
  type Category,
} from "./forge.ts";
import { worlds, sessionConfig } from "./config.ts";
import { decodeChallenge, anomaly } from "./challenges.ts";
export const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const button = (action: string, label: string, extra = "") =>
  `<button class="secondary" data-action="${action}" ${extra}>${label}</button>`;
export function discoveries(s: Save) {
  return s.universe.pending.length
    ? '<aside class="discovery-panel"><span>✦ ' +
        s.universe.pending.length +
        ' nuevos descubrimientos</span><button class="text-button" data-action="open-collection">Ver →</button></aside>'
    : "";
}
export function forgePage(
  s: Save,
  draft: Planet,
  slot: number,
  category: Category,
  profile: number,
) {
  return `<div class="section-heading"><div><span class="eyebrow">FORJA PLANETARIA</span><h2 class="page-title">Dale forma a tu universo.</h2><p class="page-intro">Tu planeta, tus colores. Los caminos y peligros conservan sus reglas.</p></div><span class="forge-balance">${balance(s)} fragmentos disponibles</span></div>${!s.universe.introduced ? '<p class="forge-tip">Empieza con siete piezas esenciales. Juega, descubre componentes y vuelve a combinarlos aquí. No necesitas otro entrenamiento.</p>' : ""}<div class="forge-layout"><div class="forge-preview"><canvas aria-label="Vista previa de mi planeta"></canvas><span class="eyebrow" id="planet-preview-name">${escape(draft.name)}</span><p>Vista previa · anillos decorativos cerca del planeta</p></div><div class="forge-editor"><div class="slot-tabs" aria-label="Planetas guardados">${Array.from({ length: slotLimit(s) }, (_, i) => button("forge-slot", s.universe.planets[i] ? escape(s.universe.planets[i].name) : `Crear planeta ${i + 1}`, `data-slot="${i}" aria-pressed="${slot === i}" ${i > s.universe.planets.length ? "disabled" : ""}`)).join("")}</div><label class="field-label" for="planet-name">Nombre del planeta</label><input id="planet-name" maxlength="24" value="${escape(draft.name)}" autocomplete="off"><div class="category-tabs" aria-label="Categorías de componentes">${Object.entries(
    categories,
  )
    .map(([id, name]) =>
      button(
        "forge-category",
        name,
        `data-category="${id}" aria-pressed="${category === id}"`,
      ),
    )
    .join("")}</div><div class="component-grid">${components
    .filter((c) => c.category === category)
    .map((c) => {
      const owned = s.universe.inventory.includes(c.id);
      return `<button class="component-card ${draft.design[category] === c.id ? "selected" : ""}" data-action="forge-equip" data-component="${c.id}" ${owned ? "" : "disabled"} aria-pressed="${draft.design[category] === c.id}"><span class="component-symbol">${owned ? "✧" : "◇"}</span><strong>${c.name}</strong><small>${owned ? c.rarity : requirement(c.condition) + (c.cost ? ` · ${c.cost} fragmentos` : "")}</small></button>`;
    })
    .join(
      "",
    )}</div><p class="tiny">Las piezas bloqueadas se descubren jugando. Las que tienen coste se fabrican en Colección.</p><div class="forge-actions">${button("open-collection", "Ver colección")}<button class="primary" data-action="forge-save">Guardar planeta</button></div><label class="field-label" for="personal-profile">Caminos de Mi órbita</label><select id="personal-profile">${worlds.map((w, i) => (s.unlockedWorlds[i] ? `<option value="${i}" ${i === profile ? "selected" : ""}>${w.name} · ${w.mechanic}</option>` : "")).join("")}</select><p class="tiny">Reglas de Infinito, nivel inicial del mundo elegido. La apariencia no cambia la velocidad ni las colisiones.</p><button class="primary" data-action="personal-play">Guardar y jugar · Mi órbita</button><p class="tiny">${slotLimit(s) < 3 ? "Más espacios al reunir 100 y 300 fragmentos acumulados." : "Tres espacios para tu pequeño universo."} Gastar en piezas no cierra mundos.</p></div></div>`;
}
export function collectionPage(s: Save, category: Category) {
  return `<span class="eyebrow">COLECCIÓN LOCAL</span><h2 class="page-title">Pequeños hallazgos. Grandes viajes.</h2><p class="page-intro">${s.universe.inventory.length} / ${components.length} componentes · ${balance(s)} fragmentos disponibles · ${s.totalLights} reunidos en total.</p><div class="category-tabs">${Object.entries(
    categories,
  )
    .map(([id, name]) =>
      button(
        "collection-category",
        name,
        `data-category="${id}" aria-pressed="${category === id}"`,
      ),
    )
    .join("")}</div><div class="codex-grid">${components
    .filter((c) => c.category === category)
    .map((c) => {
      const owned = s.universe.inventory.includes(c.id),
        ready = conditionMet(s, c.condition);
      return `<article class="codex-card ${owned ? "discovered" : "locked"}"><span class="component-symbol">${owned ? "✧" : "◇"}</span><span class="eyebrow">${c.rarity}</span><h3>${c.name}</h3><p>${requirement(c.condition)}</p><small>${owned ? "Descubierto" : ready ? "Condición cumplida" : "Por descubrir"}</small>${c.cost && !owned ? button("forge-acquire", `Fabricar · ${c.cost} fragmentos`, `data-component="${c.id}" ${ready && balance(s) >= c.cost ? "" : "disabled"}`) : ""}</article>`;
    })
    .join(
      "",
    )}</div><button class="primary" data-action="open-forge">Volver a mi planeta</button>`;
}
export function profilePage(s: Save) {
  const u = s.universe;
  return `<h3 class="section-label">Mi pequeño universo</h3><div class="journal-grid">${[
    [balance(s), "Fragmentos disponibles"],
    [u.inventory.length + "/" + components.length, "Componentes descubiertos"],
    [u.planets.length, "Planetas guardados"],
    [u.stats.dailyDates.length, "Días completados"],
    [Math.floor(u.stats.seconds / 60), "Minutos desde 0.3"],
    [u.stats.lights, "Luces recogidas desde 0.3"],
  ]
    .map(
      ([v, label]) =>
        `<div class="journal-card"><strong>${v}</strong><span>${label}</span></div>`,
    )
    .join(
      "",
    )}</div><h3 class="section-label">Diez hitos, un universo</h3>${milestones.map((m) => `<div class="mission"><span class="mission-icon">${u.milestones.includes(m.id) ? "✓" : "◇"}</span><div><strong>${m.name}</strong><p>${requirement(m.condition)}</p></div><span>${u.milestones.includes(m.id) ? "Logrado" : `+${m.reward}`}</span></div>`).join("")}<p class="tiny">Los minutos y las luces brutas se cuentan desde 0.3. Conservamos tus partidas, fragmentos y récords anteriores. Los códigos tienen marcas propias y no conceden recursos ni hitos.</p>`;
}
export function codesPage(s: Save, code: string) {
  let info = "";
  try {
    const q = decodeChallenge(code),
      c = sessionConfig("voyage", q);
    info = `<div class="code-summary"><strong>${worlds[q.world].name} · nivel ${q.level + 1}</strong><p>${c.duration} s · ${c.targetLights} luces · ${c.orbits.length} caminos</p><small>Mismo código y decisiones: mismo recorrido. Los cambios de órbita pueden alterar qué encuentros alcanzas.</small></div>`;
  } catch {}
  return `<span class="eyebrow">RETOS QUE VIAJAN CONTIGO</span><h2 class="page-title">Comparte un pequeño desafío.</h2><p class="page-intro">Todo el reto cabe en un código. Cópialo, pásalo como texto e introdúcelo en otro dispositivo con Órbita 0.3. No requiere conexión.</p><div class="code-layout"><section class="codex-card"><h3>Crear</h3><label class="field-label" for="code-world">Mundo</label><select id="code-world">${worlds.map((w, i) => (s.unlockedWorlds[i] ? `<option value="${i}">${w.name}</option>` : "")).join("")}</select><label class="field-label" for="code-level">Intensidad</label><select id="code-level"><option value="0">Descubre · 45 s</option><option value="1">Adáptate · 55 s</option><option value="2">Domina · 60 s</option></select>${button("code-create", "Generar código")}</section><section class="codex-card"><h3>Introducir o compartir</h3><label class="field-label" for="challenge-code">Código completo</label><input id="challenge-code" maxlength="80" value="${escape(code)}" placeholder="ORB-0302-…" spellcheck="false" autocapitalize="characters">${info}<div class="forge-actions">${button("code-copy", "Copiar código")}<button class="primary" data-action="code-play">Jugar código</button></div><p class="tiny">Sin recompensas de fragmentos ni desbloqueos. Tu marca se guarda por código, aparte de la campaña. Introducir un mundo aún bloqueado permite probar ese reto sin desbloquearlo.</p></section></div><h3 class="section-label">Últimos códigos jugados</h3>${s.universe.challenges.length ? s.universe.challenges.map((r) => `<div class="code-history"><code>${r.code}</code><span>${r.best} puntos · cadena ${r.combo}</span>${button("code-history", "Cargar", `data-code="${r.code}"`)}</div>`).join("") : '<p class="page-intro">Aquí quedarán tus marcas, hasta 30 retos.</p>'}`;
}
export function anomalyPage(s: Save) {
  const open = s.campaign.every((p) => p.cleared.every(Boolean)),
    q = anomaly(s.universe.anomalyTier, 0),
    c = sessionConfig("voyage", q);
  return `<span class="eyebrow">DESPUÉS DEL ÚLTIMO MUNDO</span><h2 class="page-title">Anomalías.</h2><p class="page-intro">Nuevas rutas con las mecánicas que ya conoces. Cada victoria abre el siguiente viaje.</p><section class="anomaly-card"><span class="eyebrow">${open ? `ANOMALÍA ${s.universe.anomalyTier + 1}` : "EL UNIVERSO AÚN TIENE SECRETOS"}</span><h3>${open ? worlds[q.world].name : "Completa las 15 expediciones"}</h3><p>${open ? `${worlds[q.world].mechanic} · ${c.duration} s · ${c.targetLights} luces` : "Domina los cinco mundos para entrar. Tus logros y desbloqueos se conservan."}</p><p>${open ? "Las rutas cambian en cada intento. Superar una anomalía concede 20 fragmentos extra, una sola vez." : ""}</p><button class="primary" data-action="anomaly-play" ${open ? "" : "disabled"}>${open ? "Explorar anomalía" : "Campaña pendiente"}</button></section>`;
}
