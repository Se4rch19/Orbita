import { Capacitor, registerPlugin } from "@capacitor/core";
import { readSave, normalize3 } from "./storage3";
import type { Save } from "./forge";
interface ProgressPlugin {
  read(): Promise<{ current: string; backup: string; debug: boolean }>;
  write(data: { json: string; reset: boolean }): Promise<void>;
}
const bridge = registerPlugin<ProgressPlugin>("ProgressStore");
export let nativeDebug = false;
let queue = Promise.resolve();
export function validNative(value: string) {
  try {
    const s = JSON.parse(value);
    return s?.version === 3 && typeof s.totalLights === "number" && s.universe
      ? normalize3(s)
      : null;
  } catch {
    return null;
  }
}
export async function hydrateNative(): Promise<Save> {
  const web = readSave();
  if (Capacitor.getPlatform() !== "android") return web;
  try {
    const data = await bridge.read();
    nativeDebug = data.debug;
    const restored = validNative(data.current) || validNative(data.backup);
    if (restored) {
      localStorage.setItem("orbita.v3", JSON.stringify(restored));
      return restored;
    }
  } catch {
    window.dispatchEvent(new Event("orbita-storage-error"));
  }
  return web;
}
export function persistNative(save: Save, reset = false) {
  if (Capacitor.getPlatform() !== "android") return;
  const json = JSON.stringify(save);
  queue = queue
    .then(() => bridge.write({ json, reset }))
    .catch(() => {
      window.dispatchEvent(new Event("orbita-storage-error"));
    });
}
export const flushNative = () => queue;
