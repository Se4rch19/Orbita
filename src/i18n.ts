import es from "./locales/es-MX.json" with { type: "json" };
import en from "./locales/en-US.json" with { type: "json" };
import type { Language } from "./presentation-state.ts";
import { polishEs, polishEn } from "./locales/polish.ts";
export const dictionaries: Record<"es-MX" | "en-US", Record<string, string>> = {
  "es-MX": { ...es, ...polishEs },
  "en-US": { ...en, ...polishEn },
};
export function resolveLanguage(choice: Language, system: string) {
  return choice === "system"
    ? system.toLowerCase().startsWith("es")
      ? "es-MX"
      : "en-US"
    : choice;
}
function initialLanguage(): "es-MX" | "en-US" {
  if (typeof window === "undefined") return "es-MX";
  try {
    const p = JSON.parse(localStorage.getItem("orbita.v3") ?? "null")
      ?.presentation?.language;
    return resolveLanguage(
      ["es-MX", "en-US"].includes(p) ? p : "system",
      navigator.language,
    );
  } catch {
    return resolveLanguage("system", navigator.language);
  }
}
export let language = initialLanguage();
export function selectLanguage(
  choice: Language,
  system = typeof navigator === "undefined" ? "es-MX" : navigator.language,
) {
  language = resolveLanguage(choice, system);
  if (typeof document !== "undefined") document.documentElement.lang = language;
}
export const variables = (value: string) =>
  [
    ...new Set([...value.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((m) => m[1])),
  ].sort();
export function t(key: string, values: Record<string, unknown> = {}) {
  const value = dictionaries[language][key] ?? dictionaries["es-MX"][key];
  if (value === undefined) throw new Error("Missing localization key: " + key);
  return value.replace(/\{([a-zA-Z]\w*)\}/g, (_, name) => {
    if (!(name in values))
      throw new Error("Missing localization variable: " + key + "." + name);
    return String(values[name]);
  });
}
