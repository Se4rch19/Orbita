import type { Presentation } from "./presentation-state.ts";
export const introPlan = (state: Presentation, motion: boolean) => ({
  minimum: motion ? (state.launches ? 2100 : 4000) : 0,
  skipAfter: 1000,
  maximum: 5000,
});
export function introCanEnd(
  elapsed: number,
  ready: boolean,
  minimum: number,
  skipped = false,
) {
  return (
    elapsed >= 5000 ||
    (ready && (elapsed >= minimum || (skipped && elapsed >= 1000)))
  );
}
