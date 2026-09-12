# Órbita 0.4.2 — visual system

La actualización 0.4.2 añade `planet-renderer-2.ts`: arquetipos, familias de material, luz direccional normalizada, terminador y parámetros de rotación/cloud speed. La intro usa `IntroUniverseProfile` para representar varios sistemas originales. `interaction-lock.ts` protege el chrome del juego contra selección y menús contextuales, dejando editables los campos legítimos. El informe completo, la auditoría de las seis referencias planetarias y la matriz física están en `RELEASE-0.4.2.md`.

`planet-profile.ts` resolves five curated identities and compatible personal/anomaly profiles. `living-world.ts` draws the sphere, projected fictional terrain, active surface, independently moving clouds, atmosphere, satellites, belt and trail with bounded Canvas operations. The same renderer is used by Home, Forge, intro and the game. Anomaly seeds vary the terrain projection; campaign composition stays curated.

Menta combines blue water and mint land; Durazno uses copper geology, dust and two moons; Lavanda uses facets and crystalline satellites; Glaciar uses ice fractures and aurora; Eclipse uses dark craters, glowing fissures and debris. No reference image, video, texture pack or remote resource is shipped.

`orbital-system.ts` splits decoration into back and front passes using orbital-plane depth (`sin(angle)`). The opaque planet silhouette is drawn between them. Rings split into semicircles and each moon, asteroid and trail sample is classified independently, allowing partial limb occlusion and a tail to cross the silhouette without appearing through the planet. Eight browser pixel comparisons verify that rear objects leave no visible marks inside the body while front objects remain visible. Gameplay lanes and collectible/hazard visibility do not use decorative occlusion.

Forge retains 34 original components plus 15 environment parts in ten categories: shape, surface, palette, atmosphere, satellite, ring, orbit style, biome, space and phenomenon. Broken ring now presents an asteroid belt; luminous orbit presents a visible star trail. Locked components can be previewed without writing them to a saved design or granting inventory. The sticky mobile preview keeps the result visible while choosing pieces. Vertical scrolling remains available over the canvas; horizontal drag inspects the presentation.

## Budgets

| Resource per active scene | Low | Medium | High |
| --- | ---: | ---: | ---: |
| Stars | 28 | 48 | 62 |
| Ambient dust particles (menu/Forge) | 8 | 16 | 24 |
| Decorative asteroids | 8 | 18 | 30 |
| Moons | 3 | 3 | 3 |
| Atmosphere layers | 1 | 2 | 3 |
| Gameplay burst particles | 24 | 48 | 80 |
| Decorative preview pixel ratio cap | 1 | 1.5 | 2 |
| Cached body scenes | 1 | 1 | 1 |
| Gameplay entity pool | 64 | 64 | 64 |

Star trails contain exactly 24 bounded samples when enabled, zero otherwise. Terrain has at most 16 patches; active surface has nine strokes. Cloud clusters are at most three per atmosphere layer with three ellipses each. There are no dynamically growing ambient arrays. Intro temporarily has its own scene while the main screen is ready underneath; maximum concurrent scenes during startup is two, with at most one cached legacy body. No adjacent-world texture preloading is needed.

Gameplay always retains its essential canvas pixel ratio cap of 2 regardless of quality. Quality only changes cosmetic work; input, fixed simulation, collisions, generator and scoring are untouched. Auto initially chooses High for 8+ cores and 4+ GB reported memory, Low for <=2 cores or <=2 GB, Medium otherwise. Missing memory uses a conservative 4 GB assumption. Eight seconds with >35% of sampled time in frames slower than 26 ms triggers one level down, followed by 45 seconds of cooldown. Manual settings never adapt. Explicit user selection resets the controller with a 30-second cooldown. One controller survives screen navigation so browsing cannot repeatedly reset an automatic reduction.

Ambient Animation off freezes decorative scene time. Reduced-motion preference also suppresses nonessential world/menu/intro animation. Neither changes simulation time, essential traveler movement or collision timing.

World browsing uses a 320 ms departure followed by a 400 ms arrival. New selection replaces pending travel; navigation away cancels it. Locked planets are visible, with the previous-world and fragment requirements. Play validates unlocks independently from rendering. Daily and Infinite retain their own route rules.

The intro uses 4,000 ms on first launch, 2,100 ms on repeat, and no animation for reduced motion. A first painted main scene and font readiness form the loading gate. Skip is enabled after 1,000 ms and still respects readiness. A 5,000 ms safety timeout prevents a missing resource from trapping the player. Old `introDuration` and `radialGesture` exports remain only for preserved regression contracts; production uses `intro-state.ts` and `bindScreenSwipe`.
