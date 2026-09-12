# Órbita 0.4.2

Juego Android offline de reflejos. Desliza a la derecha o arriba para salir una órbita; a la izquierda o abajo para entrar. Cada gesto mueve un camino y nunca conecta los extremos, sin depender de dónde esté Luma. Campaña, cinco mundos, Calma, Forja con 49 componentes, planetas personales, códigos y Anomalías.

Esta versión centra la experiencia en planetas vivos, con terreno, nubes, lunas, cinturones y estelas que pasan por detrás y delante del cuerpo. Mundos / Forja / Colección / Bitácora; transiciones de 720 ms, intro compartida y calidad Auto/Baja/Media/Alta. Mantiene los modos, el flujo continuo de objetos, el tutorial, español/inglés, la música existente y el respaldo nativo. Sin anuncios, pagos, cuentas ni permiso INTERNET. Music Lab se integrará en otra tarea.

## Desarrollo

Node 24, TypeScript, Vite, Canvas 2D y Capacitor 8. Una sola raíz de código: esta carpeta. Los artefactos se entregan fuera del repositorio en `../outputs/Orbita-0.4.1/`.

```powershell
npm ci
npm run typecheck
npm run format:check
npm test
npm run build
node scripts/serve.mjs
```

Abrir [la vista previa](http://localhost:4173/?v=0.4.1). Dentro/Fuera también funcionan mediante botones y las cuatro flechas del teclado. P/Escape pausa. El toque clásico opcional conserva sus zonas interior/exterior; todos los deslizamientos usan la misma regla de pantalla.

## Validación

```powershell
npx playwright install chromium
npm run qa:regression
npm run qa:forge
node scripts/qa-identity.mjs
node scripts/qa-environment.mjs
node scripts/qa-polish.mjs
node scripts/qa-forge-visuals.mjs
node scripts/qa-occlusion.mjs
node --experimental-strip-types scripts/stress-stream.ts
node --experimental-strip-types scripts/balance-mobile.ts
node --experimental-strip-types scripts/daily-balance.ts
```

Las pruebas de navegador usan perfiles aislados, requieren el servidor 4173 y generan evidencia en `../outputs/Orbita-0.4.2/validation/`. La prueba de oclusión abre y cierra un servidor temporal en 4174. La suite de 0.4.1 conserva 131 pruebas; 0.4.2 añade cobertura del bloqueo de interacción, renderer 2.0, perfiles, onboarding y paneles de modo.

Los scripts `device-polish.mjs`, `device-controls.mjs` y `device-final.mjs` son pruebas físicas supervisadas para `com.orbita.minigame`. Requieren ADB, app en primer plano y reenvío CDP en 9223 a `webview_devtools_remote_<PID>`. Se calibraron para el Redmi 1080×2400, DPR 2,75 y WebView inmersivo. La prueba final cambia temporalmente preferencias de presentación y las restaura; no borra progreso ni concede piezas. Las partidas de prueba pueden generar registros locales legítimos. Los scripts físicos anteriores permanecen como referencia histórica, no como instrucciones para la interfaz actual.

## Android

JDK 21, Android SDK 36. Configurar `JAVA_HOME` y `ANDROID_HOME`, o `android/local.properties` (excluido de Git).

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug bundleRelease --console=plain
```

Paquete `com.orbita.minigame`, versionName `0.4.2`, versionCode `7`. Actualizar con `adb install -r`, sin desinstalar. APK debug para pruebas; AAB sin firma para preparar publicación. Nunca incluir claves ni credenciales en Git. iOS conserva el proyecto y su versión, pero requiere macOS/Xcode y no está validado físicamente.

## Arquitectura y datos

- `stream.ts`: cola oculta, aparición variable hacia delante, formación y disolución; pool de 64.
- `tutorial.ts`, `presentation-state.ts`, `identity-ui.ts`: Luma, pasos guiados y ayuda persistente.
- `i18n.ts`, `locales/`: es-MX/en-US, claves e interpolaciones verificadas.
- `environment.ts`, `planet-profile.ts`, `living-world.ts`, `orbital-system.ts`: compatibilidad, planetas vivos y oclusión de elementos orbitales.
- `quality.ts`: presupuestos decorativos y adaptación conservadora.
- `world-home.ts`, `intro.ts`: presentación compartida.
- `input.ts`: gesto relativo a la pantalla y movimiento adyacente.
- `music-signals.ts`: frontera pequeña para integrar Music Lab posteriormente.
- `config.ts`, `generator.ts`, `engine.ts`: perfiles, generación y simulación fija a 120 Hz.
- `music.ts`, `audio.ts`: cinco temas originales, capas y síntesis WebAudio.
- `mobile-ui.ts`, `main.ts`, `mobile.css`: experiencia móvil.
- `forge.ts`, `forge-art.ts`, `challenges.ts`: creación, colección, códigos y Anomalías.
- `storage3.ts`, `mobile-state.ts`, `native-storage.ts`: migración y persistencia.
- `ProgressStorePlugin.java`: dos copias en SharedPreferences; las reglas Android incluyen solo `orbita_progress.xml`.

Guardado raíz v3 con estado móvil versionado; no se guarda la simulación activa. Los códigos de 0.3 conservan el generador anterior; los nuevos usan formato 5/reglas 4. Todos los controles de la interfaz son adyacentes. El método cíclico antiguo del motor se conserva únicamente por compatibilidad con reglas y tests anteriores.

La copia del sistema depende de Android y de la configuración del usuario. Se validó migración y persistencia local; no se certificó restauración desde nube ni entre dispositivos. Véanse [sistema visual](docs/VISUAL-SYSTEM-0.4.1.md), [Music Lab](docs/MUSIC-INTEGRATION-HOOKS.md), [publicación](docs/PUBLICACION.md) y [catálogo](docs/CATALOGO.md).

## Historial

Repositorio oficial: [Se4rch19/Orbita](https://github.com/Se4rch19/Orbita). `v0.3.0`, `v0.3.1` y `v0.4.0` conservan las bases anteriores. El desarrollo de esta entrega usa `release/orbita-0.4.1` y su publicación validada, `main` y `v0.4.1`.
