import type { Item } from "./engine.ts";
export const STREAM_LIMIT = 64;
export const FORM_SECONDS = 0.24;
export const DISSOLVE_SECONDS = 0.32;
export type Life = "queued" | "forming" | "active" | "dissolving" | "recycled";
export type Family =
  "light" | "shard" | "drifter" | "comet" | "arc" | "fracture";
export function spawnClearance(peak: number, reaction: number) {
  return (peak + 0.12) * (FORM_SECONDS + reaction + 0.14);
}
export function revealEnvelope(
  speed: number,
  reaction: number,
  extra: number,
  width = 0,
) {
  const safe = spawnClearance(speed, reaction) + width / 2;
  return Math.max(safe, Math.min(Math.PI - 0.04, safe + speed * extra));
}
export function appearance(item: Item, now: number) {
  if (!item.life) return item.passed ? 0 : 1;
  if (item.life === "forming")
    return Math.max(
      0,
      Math.min(1, (now - (item.formedAt ?? 0)) / FORM_SECONDS),
    );
  if (item.life === "dissolving")
    return Math.max(0, 1 - (now - (item.retiredAt ?? now)) / DISSOLVE_SECONDS);
  return item.life === "active" ? 1 : 0;
}
export class EntityPool {
  free: Item[] = [];
  allocated = 0;
  reused = 0;
  acquire(value: Item, now: number): Item {
    let item = this.free.pop();
    if (item) this.reused++;
    else {
      if (this.allocated >= STREAM_LIMIT)
        throw new Error("Entity pool capacity exceeded");
      this.allocated++;
      item = {} as Item;
    }
    for (const key of Object.keys(item))
      delete (item as unknown as Record<string, unknown>)[key];
    Object.assign(item, value, { life: "forming", formedAt: now });
    return item;
  }
  retire(item: Item, now: number) {
    if (item.life === "dissolving" || item.life === "recycled") return;
    const invisible = item.life === "queued";
    item.passed = true;
    item.life = "dissolving";
    item.retiredAt = invisible ? now - DISSOLVE_SECONDS - 0.001 : now;
  }
  update(items: Item[], now: number) {
    let write = 0;
    for (const item of items) {
      if (item.life === "forming" && now - (item.formedAt ?? 0) >= FORM_SECONDS)
        item.life = "active";
      if (
        item.life === "dissolving" &&
        now - (item.retiredAt ?? now) >= DISSOLVE_SECONDS
      ) {
        item.life = "recycled";
        this.free.push(item);
      } else items[write++] = item;
    }
    items.length = write;
  }
}
