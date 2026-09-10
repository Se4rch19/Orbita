import { t as message } from "./i18n.ts";
import { GUIDE_NAME } from "./presentation-state.ts";
import type { Lesson } from "./tutorial.ts";
import type { Save, Planet } from "./forge.ts";
import {
  environmentParts,
  extensions,
  compatible,
  extraAvailable,
} from "./environment.ts";
export const lessonCopy = [
  [message("m_290e4a7773"), message("m_d48b717a95")],
  [message("m_64480e6aeb"), message("m_b701a6bde3")],
  [message("m_256f06a862"), message("m_f1ba6edaad")],
  [message("m_80d052e024"), message("m_52f0912c50")],
  [message("m_a4a1ce86b7"), message("m_e3a12ec626")],
  [message("m_7750479ecb"), message("m_96a6421d3f")],
  [message("m_68f604e162"), message("m_77b7c7227d")],
  [message("m_ef27930fe4"), message("m_a7e807ad5c")],
];
export function guideCard(title: string, copy: string, action = "coach-close") {
  return message("m_eeae709f42", {
    p0: GUIDE_NAME,
    p1: title,
    p2: copy,
    p3: action,
  });
}
export function lessonCard(lesson: Lesson) {
  const [title, copy] = lessonCopy[lesson.step];
  return message("m_b8200837ea", {
    p0: GUIDE_NAME,
    p1: lesson.step + 1,
    p2: title,
    p3: copy,
    p4: [1, 2].includes(lesson.step)
      ? message("m_1a0dbdd010", { p0: lesson.step === 2 ? "in" : "" })
      : "",
    p5: [0, 5, 7].includes(lesson.step)
      ? message("m_2f61d14daf")
      : message("m_e33d224459"),
  });
}
export const worldCoaching = [
  [message("m_685d0edbbb"), message("m_8fa9b091cc")],
  [message("m_ab9dd65ab2"), message("m_48c608cb60")],
  [message("m_ab5899907d"), message("m_bd9a30f80e")],
  [message("m_c9057be2f0"), message("m_ce58002246")],
  [message("m_45fc6c80b5"), message("m_f68327a9fb")],
];
export const featureCoaching: Record<string, [string, string]> = {
  forge: [message("m_7d9565ad1d"), message("m_7129924417")],
  daily: [message("m_268c38757f"), message("m_d71bad3036")],
  infinite: [message("m_ca7220eb5a"), message("m_2ff1c68d4c")],
  codes: [message("m_964db17164"), message("m_58df5070bf")],
  anomalies: [message("m_f4d295c5e4"), message("m_ed0c52e638")],
  personal: [message("m_40ae09fb68"), message("m_d2aa2993cd")],
};
export function environmentEditor(s: Save, p: Planet) {
  return message("m_379bf4a22a", {
    p0: Object.entries(extensions)
      .map(([cat, label]) =>
        message("m_ca9493627d", {
          p0: label,
          p1: environmentParts
            .filter((p) => p.category === cat)
            .map((part) => {
              const owned = s.presentation.owned.includes(part.id),
                valid = compatible(p.design, part.id);
              return message("m_bdfa24b442", {
                p0: p.design[cat as "biome"] === part.id ? "selected" : "",
                p1: part.id,
                p2:
                  !valid || (!owned && !extraAvailable(s, part.id))
                    ? "disabled"
                    : "",
                p3: part.name,
                p4: !valid
                  ? message("m_55c86f3bed")
                  : owned
                    ? message("action.use")
                    : extraAvailable(s, part.id)
                      ? message("m_0f6a612cd9", { p0: part.cost })
                      : part.rule === "daily"
                        ? message("m_6198355e4a", { p0: part.value })
                        : part.rule === "infinite"
                          ? message("m_5e58520cce", { p0: part.value })
                          : part.rule === "anomaly"
                            ? message("m_9052279caa")
                            : part.rule === "world"
                              ? message("m_80143534fe")
                              : message("m_9c42b53268", { p0: part.value }),
              });
            })
            .join(""),
        }),
      )
      .join(""),
  });
}
