# Órbita — Gameplay Redesign 0.3

Juego móvil offline de reflejos, mundos orbitales y creación de un pequeño universo personal. Extendemos la base 0.2 con Forja Planetaria, 34 componentes, tres espacios progresivos, diez hitos, Mi órbita, Códigos y Anomalías. No contiene anuncios, pagos, cuentas, servidores ni analítica remota. No presupone precio de venta.

## Jugar

En la carpeta de entrega, abre `Jugar-Orbita.cmd` o instala `Orbita-0.3-debug.apk` en Android. El APK incluye todos los recursos y funciona con la computadora apagada. La vista previa local está en [localhost:4173](http://localhost:4173/?v=0.3).

Espacio/↑ avanza de camino, ↓ retrocede, P/Escape pausa. En móvil, toca los controles inferiores. Forja permite guardar y jugar alrededor de tu planeta; Colección muestra requisitos y fabricación. El entrenamiento y los cuatro modos de 0.2 se conservan.

## Documentación

- [Informe completo 0.3](docs/REDISENO-0.3.md): los 13 puntos de implementación.
- [Validación 0.3](docs/VALIDACION-0.3.md): resultados exactos y límites.
- [Catálogo de piezas e hitos](docs/CATALOGO-0.3.md): generado desde los datos del juego.
- [Preparación de publicación](docs/PUBLICACION.md): estado de la distribución.

Los documentos 1.0/0.2 se conservan como historial; sus decisiones comerciales y su alcance no describen esta versión.

## Desarrollo

Verificado con Node 24.17.0. TypeScript estricto, Canvas 2D, Vite y Capacitor 8. No se añadieron dependencias de ejecución.

```powershell
npm ci
npm run typecheck
npm run format:check
npm test
npm run build
npm audit --omit=dev
```

Para las pruebas de navegador, iniciar `node scripts/serve.mjs` en una terminal; si ya está activo en 4173, reutilizarlo. En otra:

```powershell
npx playwright install chromium
npm run qa:regression
npm run qa:forge
```

Los scripts crean perfiles aislados de Chromium. No modifican los datos del navegador del jugador. Guardan capturas en la carpeta de entrega detectada o permiten indicar otra mediante `ORBITA_QA_OUT`. Los scripts `qa.mjs` y `qa-extra.mjs` originales permanecen como historial 0.2; utilizar las variantes 03 de los comandos anteriores para esta versión.

## Android e iOS

Configurar JDK 21, Android SDK 36, `JAVA_HOME` y la ruta de SDK mediante `ANDROID_HOME` o `android/local.properties`. El ZIP excluye la configuración específica del equipo.

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug bundleRelease --console=plain
```

La entrega se compiló con versionName 0.3.0 y versionCode 3. El APK es de depuración; el AAB necesita firma de publicación. INTERNET se elimina del manifiesto combinado. Los recursos se sirven desde assets a través del WebView de Capacitor.

En Mac, `npm run ios:sync` y `npx cap open ios`. El proyecto iOS fue sincronizado en Windows, pero no compilado. No se ha ejecutado el APK en un teléfono o emulador; arranque, retirada del permiso, actualización y rendimiento físico siguen pendientes.

## Arquitectura

`engine.ts`, `config.ts`, `generator.ts`, `geometry.ts`, `random.ts`, `progression.ts` y `audio.ts` conservan las reglas 0.2. `forge.ts` define componentes y economía; `forge-art.ts` añade visuales; `challenges.ts` codifica retos y Anomalías; `progression3.ts` liquida cada contexto; `storage3.ts` migra a v3; `universe-ui.ts` y `forge.css` incorporan las pantallas. `main.ts` y `art.ts` los conectan al juego existente.

Las claves antiguas se conservan al migrar. El guardado es local, con respaldo anterior; no hay nube ni restauración de una partida interrumpida. Mantener la misma identidad y firma al actualizar evita perder el acceso al almacenamiento anterior. No desinstalar antes de comprobar una actualización si se desea conservar progreso.
