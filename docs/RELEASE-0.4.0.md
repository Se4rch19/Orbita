# Órbita 0.4.0 — informe de entrega

## 1. Modo inmersivo

`MainActivity` mantiene una sola Activity, instala AndroidX SplashScreen antes de crear la vista, usa `WindowCompat.setDecorFitsSystemWindows(false)` y `WindowInsetsControllerCompat` con barras transitorias por gesto. Los recortes y el teclado se aplican como insets al WebView; al cerrar el IME se restaura el modo inmersivo. `ImmersionPlugin` expone `state` y `restore` para la prueba física. En el Redmi 21121210G se verificaron barras ocultas al lanzar, teclado visible durante Challenge Code y nombre de planeta, restauración posterior y gesto de borde con navegación visible en captura y oculta después.

## 2. Ciclo de entidades

El stream tiene estados `queued → forming → active → dissolving → recycled`. Las entidades reservadas permanecen invisibles y no colisionan. Se revelan solo delante del viajero, con una mezcla de luces lejanas y apariciones cercanas, alternando carril según la puerta procedural. La decisión es continua en cada paso de simulación y no depende de recoger la luz anterior. El umbral usa velocidad prevista, reacción mínima, ancho del peligro y cierre de cometas. La formación dura 240 ms y la disolución 320 ms. El pool de entidades queda limitado a 64; partículas a 80.

## 3. Tutorial

La primera partida nueva muestra la introducción de Órbita y ofrece el entrenamiento antes del juego normal. La lección tiene ocho pasos accionados: presentación, gesto hacia fuera, gesto hacia dentro, recoger luz, evitar peligro, escudos, cadena y mecánicas de mundos. El tiempo se detiene en las explicaciones y solo el gesto esperado avanza los pasos. Se puede saltar, terminar y repetir desde Cómo jugar; la finalización previa no se pierde.

## 4. Luma

Luma es un nombre centralizado en `presentation-state.ts`. Aparece en el onboarding, en las lecciones y como ayuda breve al abrir Forja, Del Día, Infinito, Challenge Codes, Anomalías y Mi Órbita. Las ayudas de mundos aparecen una vez y se pueden repasar en Guía de mundos. Al entrar por primera vez a un destino de Infinito, el nuevo mundo se presenta antes de reanudar la partida.

## 5. Identidad de mundos

Menta usa ondas suaves, vegetación y atmósfera viva. Durazno usa bandas cálidas y polvo. Lavanda usa geometría cristalina y rutas menos convencionales. Glaciar usa fracturas frías y aurora. Eclipse usa sombras profundas, cráteres, roca desnuda y distorsión. La superficie se genera con Canvas y geometría pequeña, sin texturas ni recursos remotos.

## 6. Forja

Se conservan las 34 piezas anteriores y se añaden 15 piezas en Bioma, Espacio y Característica: océano, dunas, cristal, congelado, lava, muerto; estrellas, nebulosa, aurora, vacío; ninguna, islas, cráteres, fisura y tormenta. Cada pieza exige una condición de juego y, cuando corresponde, fragmentos. Las combinaciones incompatibles se rechazan al equipar piezas nuevas o antiguas y al normalizar un guardado. El océano con hielo se visualiza como mar congelado. La vista previa se puede arrastrar para girarla; la animación ambiental respeta la preferencia.

## 7. Peligros

La taxonomía compacta es fragmento estático, drifter de carril, cometa con deriva angular, arco de Lavanda y fractura estructural de Glaciar/Eclipse. La introducción depende del mundo y nivel; los peligros se presentan con formación y conservan margen de reacción.

## 8. Intro

Android usa SplashScreen del sistema y la app continúa con una introducción de marca procedural de 1,4 s en el primer lanzamiento y 450 ms en retornos. Se puede tocar para saltar. Animación reducida la omite. No se añadió una Activity extra.

## 9. Localización

Los recursos es-MX y en-US tienen las mismas 402 claves y las mismas variables. El idioma del sistema selecciona es-MX cuando empieza por `es`; el resto cae en en-US. Hay selector persistente para sistema, español e inglés. Se verifica paridad, variables y ausencia de claves sin resolver en ambos idiomas. Los nombres propios de mundos permanecen estables.

## 10. Rendimiento

La matriz física capturó 239 intervalos de render por pantalla con mediana 16,5 ms, p95 16,6 ms y cero intervalos por encima de 33,4 ms en home, mundos y Forja. En 2.000 sesiones simuladas (campaña, diario, infinito, anomalías y personal) se observaron 506.304 formaciones, 702.199 reutilizaciones, máximo 18 objetos asignados y 15 activos. El Redmi reportó 176.642 KiB PSS de la app durante la prueba, con máximo de 6 voces transitorias.

## 11. Dispositivo

Redmi K50/21121210G, Android conectado por ADB, paquete propio `com.orbita.minigame`: migración `install -r`, cinco mundos, viaje Infinito a destinos 0–6, tutorial físico, teclado de código/nombre, gesto de borde, Forja, Bitácora e idiomas. Logcat no mostró FATAL/Exception en la ventana inspeccionada. Las capturas están en `outputs/Orbita-0.4.0/validation/`.

## 12. Guardado

La raíz continúa en v3. `presentation` y los campos ambientales son opcionales y se normalizan de forma segura. La fixture `tests/fixtures/redmi-0.3.1.json`, extraída del guardado de desarrollo del Redmi, conserva campo por campo puntuaciones, mundos, historial, inventario, planeta, códigos y preferencias. La escritura nativa mantiene copia actual y respaldo.

## 13. Archivos heredados

Las copias obsoletas fuera del repositorio se movieron a `C:\Users\haki0\Documents\Codex\2026-09-08\Orbita-Legacy-Archive-2026-09-10`. El repositorio canónico, `outputs/Orbita-0.3.1`, SDK, claves y entregables 0.4 no se movieron.

## 14. Pruebas

`npm run typecheck` pasó. `npm run format:check` pasó. `npm test` pasó con 108 pruebas, incluyendo las 89 anteriores. `qa-mobile`, `qa-forge-mobile`, `qa-identity` y `qa-environment` pasaron sin errores ni solicitudes externas. `stress-stream.ts` pasó 2.000 sesiones. `balance-mobile.ts` pasó 750 sesiones de campaña; `daily-balance.ts` cubrió 30 fechas por 10 semillas. `android:sync`, `assembleDebug` y `bundleRelease` pasaron.

## 15. Git

La implementación está en `release/orbita-0.4.0`. Se preservan `main`, `v0.3.0` y `v0.3.1`; no se reescribió historia. El commit de producto es `331908f`; la documentación, fixtures y pruebas finales se agregan en el commit de entrega. Después se hará merge normal a `main`, tag anotado `v0.4.0` y push de rama, main y tag sin force push.

## 16. Entregables

El APK debug es `outputs/Orbita-0.4.0/Orbita-0.4.0-debug.apk`, el AAB release es `outputs/Orbita-0.4.0/Orbita-0.4.0-release.aab`, y el código fuente es `outputs/Orbita-0.4.0/Orbita-0.4.0-source.zip`. La validación, capturas y hashes viven en `outputs/Orbita-0.4.0/validation/`. El AAB no implica publicación: la ficha bilingüe es un borrador en `docs/STORE-LISTING-0.4.0.md`.

## 17. Pendientes reales

La publicación en Play Store/App Store, una clave comercial y un canal interno de Play Console quedan para la fase de lanzamiento. iOS conserva el proyecto actualizado, pero no se compiló físicamente porque el entorno es Windows. No se añadieron anuncios ni compras; la economía actual usa únicamente fragmentos ganados en el juego.
