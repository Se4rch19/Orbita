import type { Save } from "./forge.ts";
import { worlds, dailyMobile } from "./config.ts";
import { nextLevel } from "./progression.ts";
export function continuation(s: Save) {
  const world = s.campaign.findIndex(
    (p, i) => s.unlockedWorlds[i] && !p.cleared.every(Boolean),
  );
  return world < 0
    ? {
        world: s.world,
        level: 2,
        complete: s.campaign.every((p) => p.cleared.every(Boolean)),
      }
    : { world, level: nextLevel(s, world), complete: false };
}
export function playHome(s: Save) {
  const next = continuation(s),
    d = dailyMobile(),
    record = s.mobile.daily.find((r) => r.date === d.date);
  return `<section class="continue-card"><span class="eyebrow">${next.complete ? "TU PRÓXIMO VIAJE" : "CONTINUAR EXPEDICIÓN"}</span><div><h1>${next.complete ? "Anomalías" : worlds[next.world].name}</h1><p>${next.complete ? "Más allá de los cinco mundos." : `Expedición ${next.level + 1}/3 · ${s.campaign.flatMap((p) => p.cleared).filter(Boolean).length}/15 superadas`}</p></div><button class="primary" data-action="continue">Continuar <span aria-hidden="true">→</span></button></section><h2 class="section-label">Elige tu ritmo</h2><div class="play-cards"><button data-action="campaign"><span>01</span><strong>Expedición</strong><small>Cinco mundos, un camino por dominar.</small></button><button data-action="mobile-daily"><span>02</span><strong>Del día</strong><small>${worlds[d.world].name} · ${d.duration} s<br>★ ${d.tiers[0]} · ★★ ${d.tiers[1]} · ★★★ ${d.tiers[2]} luces</small>${record ? `<em>${record.tier}/3 niveles · ${record.attempts} intentos</em>` : ""}</button><button data-action="mobile-infinite"><span>03</span><strong>Infinito</strong><small>Viaja de Menta a Eclipse y más allá.</small></button><button data-action="mobile-calm"><span>04</span><strong>Calma</strong><small>1 min, 3 min o sin límite.</small></button></div><div class="play-secondary"><button class="text-button" data-action="training">Cómo jugar · Entrenamiento</button><button class="text-button" data-action="open-codes">Códigos de desafío →</button></div>`;
}
export function settingsContent(s: Save) {
  const toggle = (id: string, label: string, on: boolean, desc = "") =>
    `<div class="setting-row"><div><strong>${label}</strong>${desc ? `<small>${desc}</small>` : ""}</div><button role="switch" aria-checked="${on}" aria-label="${label}" data-action="toggle" data-setting="${id}" class="toggle ${on ? "on" : ""}"></button></div>`;
  return `<div class="modal-head"><h2>Ajustes</h2><button class="icon-button" data-action="close" aria-label="Cerrar ajustes">×</button></div><h3 class="section-label">Audio</h3>${toggle("music", "Música", s.mobile.music)}${toggle("effects", "Efectos de sonido", s.mobile.effects)}<h3 class="section-label">Respuesta</h3>${toggle("haptic", "Vibración", s.haptic)}${toggle("motion", "Animación ambiental", s.motion)}<h3 class="section-label">Controles</h3><label class="field-label" for="control-setting">Cómo cambias de órbita</label><select id="control-setting"><option value="radial" ${s.mobile.controls === "radial" ? "selected" : ""}>Deslizamiento radial · recomendado</option><option value="classic" ${s.mobile.controls === "classic" ? "selected" : ""}>Toque clásico · zonas y botones</option></select><p class="tiny">Hacia fuera aleja un camino; hacia dentro acerca uno. En toque clásico, toca cerca del centro para entrar o lejos para salir.</p><h3 class="section-label">Accesibilidad</h3>${toggle("assistance", "Asistencia de anticipación", s.mobile.assistance, "Resalta peligros cercanos. Otorga el 50% de fragmentos, incluidos bonos. Se fija al iniciar cada viaje.")}<button class="secondary" data-action="data-settings">Datos y respaldo →</button><p class="tiny">Órbita 0.3.1 · Sin conexión</p>`;
}
export function mobileJournal(s: Save) {
  const j = s.mobile.journey;
  return `<h3 class="section-label">Viajes por el universo</h3><div class="journal-grid"><div class="journal-card"><strong>${j.worlds}</strong><span>Destinos superados</span></div><div class="journal-card"><strong>${j.seconds} s</strong><span>Mayor supervivencia</span></div><div class="journal-card"><strong>${j.combo}</strong><span>Mejor cadena en viaje</span></div></div><p class="page-intro">${s.totalLights} fragmentos acumulados · ${s.unlockedWorlds.filter(Boolean).length} mundos · ${s.universe.anomalyTier} anomalías.</p><h3 class="section-label">Señales recientes</h3>${s.mobile.daily
    .slice(0, 7)
    .map(
      (r) =>
        `<div class="history-row"><span>${r.date} · ${"★".repeat(r.tier)}${"☆".repeat(3 - r.tier)}</span><span>${r.attempts} intentos · ${r.best} puntos${r.assisted ? " · asistencia" : ""}</span></div>`,
    )
    .join(
      "",
    )}<p class="tiny">Las marcas asistidas se identifican localmente. Récord asistido: ${s.mobile.assistedBest}.</p>`;
}
