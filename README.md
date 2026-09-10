# Órbita 0.4.0

Juego Android offline de reflejos. Desliza alejándote del centro para salir una órbita, o acercándote para entrar. Cada gesto mueve un camino; nunca conecta los extremos. Campaña, cinco mundos, Calma, Forja con 49 componentes, planetas personales, códigos y Anomalías.

Esta versión incorpora inmersión Android, aparición variable delante del viajero, tutorial interactivo con Luma, mundos procedurales vivos, 15 componentes ambientales nuevos e idiomas español/inglés. Conserva JUGAR / FORJA / BITÁCORA, los modos existentes, música procedural y respaldo nativo. La asistencia está desactivada inicialmente y entrega el 50% de fragmentos. Sin anuncios, pagos, cuentas ni permiso INTERNET.

## Desarrollo

Node 24, TypeScript, Vite, Canvas 2D y Capacitor 8. Una sola raíz de código: esta carpeta. Los artefactos se entregan fuera del repositorio en `outputs/Orbita-0.4.0/`.

```powershell
npm ci
npm run typecheck
npm run format:check
npm test
npm run build
node scripts/serve.mjs
```

Abrir [la vista previa](http://localhost:4173/?v=0.4.0). Dentro/Fuera también funcionan mediante botones y flechas del teclado. P/Escape pausa. Toque clásico usa zonas interior/exterior sin saltos cíclicos.

## Validación

```powershell
npx playwright install chromium
npm run qa:regression
npm run qa:forge
node scripts/qa-identity.mjs
node scripts/qa-environment.mjs
node --experimental-strip-types scripts/stress-stream.ts
node --experimental-strip-types scripts/balance-mobile.ts
node --experimental-strip-types scripts/daily-balance.ts
```

Las pruebas de navegador usan perfiles aislados, requieren el servidor 4173 y generan evidencia en `../outputs/Orbita-0.4.0/validation/`; `ORBITA_QA_OUT` permite otra ruta. Los 89 tests anteriores se conservan intactos; hay 19 nuevos (108 en total), además de validación de 2 000 sesiones completas y 200 000 puertas procedurales.

Los scripts `device-identity.mjs` y `device-worlds.mjs` son pruebas físicas supervisadas: operan únicamente el WebView debug de `com.orbita.minigame`. Requieren ADB, app en primer plano y reenvío CDP en 9223 a `webview_devtools_remote_<PID>`. `ORBITA_ADB` indica el ejecutable. Se calibraron para el Redmi 1080×2400, DPR 2,75 y WebView inmersivo sin desplazamiento superior. Revisar antes de otro dispositivo. La prueba de identidad reinicia únicamente el estado nuevo de introducción/tutorial; nunca borra progreso. Las pruebas usan gestos reales, crean registros locales de juego y pueden guardar el diseño del planeta. Los scripts físicos 0.3.1 permanecen como referencia histórica y no deben ejecutarse con sus coordenadas antiguas.

## Android

JDK 21, Android SDK 36. Configurar `JAVA_HOME` y `ANDROID_HOME`, o `android/local.properties` (excluido de Git).

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug bundleRelease --console=plain
```

Paquete `com.orbita.minigame`, versionName `0.4.0`, versionCode `5`. Actualizar con `adb install -r`, sin desinstalar. APK debug para pruebas; AAB sin firma para preparar publicación. Nunca incluir claves ni credenciales en Git. iOS conserva el proyecto y su versión, pero requiere macOS/Xcode y no está validado físicamente.

## Arquitectura y datos

- `stream.ts`: cola oculta, aparición variable hacia delante, formación y disolución; pool de 64.
- `tutorial.ts`, `presentation-state.ts`, `identity-ui.ts`: Luma, pasos guiados y ayuda persistente.
- `i18n.ts`, `locales/`: es-MX/en-US, claves e interpolaciones verificadas.
- `environment.ts`, `world-life.ts`: 15 piezas adicionales, compatibilidad y movimiento ambiental.
- `input.ts`: gesto radial y movimiento adyacente.
- `config.ts`, `generator.ts`, `engine.ts`: perfiles, generación y simulación fija a 120 Hz.
- `music.ts`, `audio.ts`: cinco temas originales, capas y síntesis WebAudio.
- `mobile-ui.ts`, `main.ts`, `mobile.css`: experiencia móvil.
- `forge.ts`, `forge-art.ts`, `challenges.ts`: creación, colección, códigos y Anomalías.
- `storage3.ts`, `mobile-state.ts`, `native-storage.ts`: migración y persistencia.
- `ProgressStorePlugin.java`: dos copias en SharedPreferences; las reglas Android incluyen solo `orbita_progress.xml`.

Guardado raíz v3 con estado móvil versionado; no se guarda la simulación activa. Los códigos de 0.3 conservan el generador anterior; los nuevos usan formato 5/reglas 4. Todos los controles de la interfaz son adyacentes. El método cíclico antiguo del motor se conserva únicamente por compatibilidad con reglas y tests anteriores.

La copia del sistema depende de Android y de la configuración del usuario. Se validó migración y persistencia local; no se certificó restauración desde nube ni entre dispositivos. Véanse [informe](docs/RELEASE-0.4.0.md), [publicación](docs/PUBLICACION.md) y [catálogo](docs/CATALOGO.md).

## Historial

Repositorio oficial: [Se4rch19/Orbita](https://github.com/Se4rch19/Orbita). `v0.3.0` y `v0.3.1` conservan las bases anteriores; el trabajo está en `release/orbita-0.4.0`. Los documentos y scripts antiguos se recuperan desde la etiqueta base.
