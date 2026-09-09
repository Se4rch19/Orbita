export const INPUT_COOLDOWN = 0.085;
export const TRANSITION_SECONDS = 0.12;
export const TOUCH_LATENCY_ALLOWANCE = 0.1;
export const RADIAL_THRESHOLD = 18; // CSS pixels (density-independent in the WebView).
export type Point = { x: number; y: number };
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
export function bindRadial(
  canvas: HTMLCanvasElement,
  move: (direction: number) => void,
  classic: () => boolean,
) {
  let pointer: number | null = null,
    start: Point | null = null;
  const cancel = () => {
    pointer = null;
    start = null;
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (pointer !== null || !e.isPrimary) return;
    e.preventDefault();
    pointer = e.pointerId;
    start = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointer || !start) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect(),
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      end = { x: e.clientX, y: e.clientY };
    const direction = radialGesture(start, end, center);
    if (direction) move(direction);
    else if (
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
