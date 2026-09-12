export const INPUT_COOLDOWN = 0.085;
export const TRANSITION_SECONDS = 0.12;
export const TOUCH_LATENCY_ALLOWANCE = 0.1;
export const RADIAL_THRESHOLD = 18; // CSS pixels (density-independent in the WebView).
export type Point = { x: number; y: number };
export const SCREEN_THRESHOLD = 18;
export const FLICK_THRESHOLD = 12;
export const FLICK_VELOCITY = 0.16; // CSS px/ms, evaluated on release.
/** No planet geometry or traveler state is involved in gesture recognition. */
export function screenGesture(
  start: Point,
  end: Point,
  durationMs = 150,
): -1 | 0 | 1 {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));
  if (![dx, dy, durationMs].every(Number.isFinite) || durationMs < 0) return 0;
  const flick =
    durationMs <= 220 && distance / Math.max(1, durationMs) >= FLICK_VELOCITY;
  if (distance < (flick ? FLICK_THRESHOLD : SCREEN_THRESHOLD)) return 0;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : -1) : dy < 0 ? 1 : -1;
}
/** Legacy recognizer retained for the 0.3.1 regression contract. Never bound by the UI. */
export function radialGesture(
  start: Point,
  end: Point,
  center: Point,
  threshold = RADIAL_THRESHOLD,
): -1 | 0 | 1 {
  const a = Math.hypot(start.x - center.x, start.y - center.y),
    b = Math.hypot(end.x - center.x, end.y - center.y),
    delta = b - a;
  if (
    !Number.isFinite(delta) ||
    Math.hypot(end.x - start.x, end.y - start.y) < threshold ||
    Math.abs(delta) < threshold
  )
    return 0;
  return delta > 0 ? 1 : -1;
}
export function boundedLane(lane: number, delta: number, active: boolean[]) {
  if (
    !Number.isInteger(lane) ||
    !Number.isFinite(delta) ||
    delta === 0 ||
    active.length > 3
  )
    return lane;
  const next = lane + Math.sign(delta);
  return next >= 0 && next < active.length && active[next] ? next : lane;
}
export function bindScreenSwipe(
  canvas: HTMLCanvasElement,
  move: (direction: number) => void,
  classic: () => boolean,
) {
  let pointer: number | null = null,
    start: Point | null = null,
    started = 0,
    accepted = -Infinity;
  const cancel = () => {
    pointer = null;
    start = null;
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (pointer !== null || !e.isPrimary) return;
    e.preventDefault();
    pointer = e.pointerId;
    start = { x: e.clientX, y: e.clientY };
    started = e.timeStamp;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointer || !start) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect(),
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      end = { x: e.clientX, y: e.clientY };
    const direction = screenGesture(start, end, e.timeStamp - started);
    if (direction && e.timeStamp - accepted >= INPUT_COOLDOWN * 1000) {
      accepted = e.timeStamp;
      move(direction);
    } else if (
      !direction &&
      classic() &&
      Math.hypot(end.x - start.x, end.y - start.y) < RADIAL_THRESHOLD
    )
      move(
        Math.hypot(end.x - center.x, end.y - center.y) < rect.width * 0.34
          ? -1
          : 1,
      );
    cancel();
  });
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("lostpointercapture", cancel);
}
