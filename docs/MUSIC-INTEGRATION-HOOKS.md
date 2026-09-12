# Music Lab integration boundary

Órbita 0.4.1 preserves `src/audio.ts` and `src/music.ts`. No soundtrack, composition engine, samples or new Web Audio graph was introduced.

Import `musicSignals` and assign its single optional `sink` from the future integration bootstrap. Assign `null` to disconnect. `MusicSignal` is the typed contract. There is no buffered history, subscription growth, timer or network dependency; consumer exceptions are isolated from gameplay.

```ts
import { musicSignals } from "./music-signals";
musicSignals.sink = event => musicLab.accept(event);
```

| Signal | Connection point / meaning |
| --- | --- |
| `run-start` | First observed Game instance, mode and deterministic seed. |
| `run-end` | Once when done, abandoned or replaced. |
| `world-changed` | Initial gameplay world, journey changes, and completed menu navigation. Numeric campaign identity 0–4. |
| `orbit-in`, `orbit-out` | Accepted adjacent movement, observed from actual lane changes. No event for ignored bounds. |
| `light-collected` | Actual collect event in `main.ts`, before engine event array is consumed. |
| `combo-changed` | Includes collection and missed-light resets; emits the current value. |
| `intensity-changed` | Current intensity phase rounded to tenths to bound notification rate. |
| `shield-hit` | Actual hit feedback, including nonlethal Calm impacts. |
| `damage` | Hit outside Calm; emitted alongside shield-hit. A consumer should choose which cue to play. |
| `pause`, `resume` | Actual pause state edges, including lifecycle/tutorial/coaching. |

The initial sequence is run-start, world, combo, intensity. Collect/hit signals follow the engine event order. No consumer may mutate gameplay state or grant rewards. Existing Sound calls continue independently until a later task explicitly replaces that consumer; attaching an audible engine now without disabling the existing soundtrack would double the audio.

`MusicSignals.observe` runs after simulation even during paused frames. It keeps one Game reference and a small last-value snapshot, not a frame history. A tutorial is its own run. Browsing a planet emits a world identity without starting a run. Save format and challenge-code generation do not depend on the music boundary.
