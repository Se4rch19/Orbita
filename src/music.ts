export const themes = [
  {
    name: "Menta",
    root: 60,
    scale: [0, 2, 4, 7, 9],
    bpm: 76,
    pad: "sine",
    motif: [0, 2, 4, 1, 3, 2, 1, 0],
  },
  {
    name: "Durazno",
    root: 57,
    scale: [0, 2, 4, 5, 7, 9],
    bpm: 100,
    pad: "triangle",
    motif: [0, 3, 1, 4, 2, 5, 1, 3],
  },
  {
    name: "Lavanda",
    root: 62,
    scale: [0, 2, 3, 7, 9],
    bpm: 82,
    pad: "sine",
    motif: [0, 4, 1, 3, 2, 4, 0, 2],
  },
  {
    name: "Glaciar",
    root: 65,
    scale: [0, 2, 5, 7, 9],
    bpm: 68,
    pad: "sine",
    motif: [0, 3, 1, 4, 0, 2, 4, 1],
  },
  {
    name: "Eclipse",
    root: 48,
    scale: [0, 2, 3, 7, 10],
    bpm: 108,
    pad: "triangle",
    motif: [0, 2, 1, 4, 3, 1, 2, 0],
  },
] as const;
export const midiFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export function musicalNote(world: number, index: number, octave = 0) {
  const t = themes[Math.max(0, Math.min(4, world))],
    i =
      ((Math.floor(index) % t.scale.length) + t.scale.length) % t.scale.length;
  return midiFrequency(t.root + t.scale[i] + octave * 12);
}
export function musicLayers(intensity: number, combo: number, calm: boolean) {
  const x = Math.max(0, Math.min(1, intensity));
  return {
    pad: true,
    pulse: !calm && x > 0.2,
    arp: !calm && x > 0.5,
    combo: combo >= 10,
    peak: !calm && x > 0.82,
  };
}
