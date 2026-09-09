# Validación — Gameplay Redesign 0.2

8 de septiembre de 2026. Entorno Windows, Node 24, JDK 21, Android SDK 36. Resultados de la última compilación, después de calibrar los objetivos diarios.

## Comandos y resultados

| Comprobación | Resultado exacto |
| --- | --- |
| `npm run typecheck` | Correcto, sin diagnósticos de TypeScript. |
| `npm test` | **46 pruebas: 46 aprobadas, 0 fallidas, 0 omitidas, 0 canceladas.** Incluye las 15 pruebas originales. Última ejecución: 545 ms. |
| `npm run format:check` | Todos los archivos de `src` y `tests` cumplen Prettier. No hay un comando ESLint configurado. |
| `npm run build` | Correcto. TypeScript y Vite: 22 módulos; fase Vite 445 ms. JS principal 57.41 kB, 21.71 kB gzip; CSS 17.95 kB. Caché offline `9e43ef2edfd3`. |
| `npx cap sync` | Android e iOS sincronizados correctamente; plugins App y Haptics. |
| `node scripts/qa.mjs` | **10 grupos aprobados**, cero errores JavaScript no capturados. |
| `node scripts/qa-extra.mjs` | **7 grupos aprobados**, cero errores JavaScript no capturados. |
| `node --experimental-strip-types scripts/balance.ts` | **450/450** intentos de campaña y **300/300** intentos diarios completados por un controlador automatizado. |
| `npm audit --omit=dev` | **0 vulnerabilidades** notificadas en las dependencias de producción. |
| Gradle `assembleDebug bundleRelease --console=plain` | **BUILD SUCCESSFUL in 10s**. 339 tareas: 65 ejecutadas, 274 actualizadas. Incluye comprobación vital de lint de release. |
| `apksigner verify --print-certs` | Firma del APK válida; coincide con el certificado de depuración del APK previo. |
| `aapt dump badging` | `com.orbita.minigame`, versionCode 2, versionName 0.2.0, mínimo API 24, objetivo API 36, etiqueta Órbita. |
| Comparación SHA-256 de recursos empaquetados | Los **10 archivos web** dentro del APK y del AAB coinciden con los de la última carpeta `dist`. Informe en `capturas-0.2/package-validation.json`. |
| `adb devices -l` | Ningún dispositivo conectado. **No se ejecutó el APK en dispositivo ni emulador.** |

## Qué cubren las pruebas

Las pruebas del motor cubren determinismo, variación de intentos, fecha local capturada al iniciar, mundos y órbitas, geometría cerrada y suave, cambios de sentido, colisiones en tramos rotos, combos y escudos. Se comprobaron 45,000 encuentros contra las restricciones de generación, carriles inactivos y presencia temprana de mecánicas distintivas.

Una partida con entradas idénticas produce el mismo resultado a 15, 60 y 120 FPS. Se probaron fotogramas largos para verificar que el motor consume el tiempo transcurrido. Una simulación de una hora de Calma continua conserva el búfer de encuentros acotado. Estas pruebas no miden GPU, batería ni temperatura en un móvil.

Progresión y guardado: objetivos obligatorios de campaña, desbloqueo secuencial, requisito de victorias y fragmentos, bonificación única, límite de recompensa de Calma, liquidación de puntos de control sin duplicar recompensas, migración v1, recuperación de JSON corrupto y borrado confirmado sin resucitar datos antiguos.

Los recorridos Chromium cubren entrenamiento de 30 segundos, campaña, pausa/reanudación, resultados y comparación con récord; Calma completa de tres minutos y continua; derrota y récord de Infinito; reto diario; ajustes y persistencia. También cubren modo offline en los cinco mundos, guardado v1 con 700 fragmentos, teclado, controles de tres caminos y cancelación/confirmación del borrado. Vista móvil de 390 × 844 y 320 × 568, y escritorio de 1440 × 1000. Las capturas se inspeccionaron visualmente; no se detectó desbordamiento horizontal.

El controlador de rutas probó 30 semillas por cada uno de los 15 niveles y 10 intentos en cada uno de 30 días de septiembre. Lee las luces y fracturas próximas para decidir el cambio de camino. Demuestra rutas completables en esas muestras; **no es un jugador humano, no mide diversión y no demuestra solvencia formal de todas las semillas**. Los resultados están en `capturas-0.2/balance.json`.

## Binarios

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| `Orbita-0.2-debug.apk` | 4,153,232 | `ADBE979A3215383B898C093ABCA33E8ED5DF51DA9EAA1296546D9F88FCFFCCC5` |
| `Orbita-0.2-sin-firma.aab` | 3,024,400 | `F168679AD06717AC69D90E8C23F4E0B2A73DDB6FB306B68BD74644672D61CF0C` |

Certificado de depuración SHA-256: `fb8606f661f18a863049431c53fc7bf3be2fc842f7cd076a92a6d98b7ea02bdd`. El APK de prueba está firmado; el AAB se entrega sin firma de publicación. No se crearon ni incluyeron claves de producción.

Los recursos web están empaquetados en Android e iOS. El APK no apunta al servidor de vista previa del equipo. La presencia del permiso INTERNET en el contenedor Capacitor no implica que el juego requiera conexión: el contenido se carga del paquete y no hay API de juego externa.

## Pendientes reales

- Ejecutar el APK y su actualización sobre v1 en teléfonos físicos: táctil, vibración, audio, interrupciones, modo avión, navegación Android, escalas de fuente y persistencia tras reiniciar.
- Medir rendimiento y consumo en dispositivos modestos; el objetivo de 60 FPS aún no está certificado en hardware móvil.
- Probar dificultad, progresión, variedad y disposición a pagar con personas. La generación restringida permite errores del jugador y no garantiza recuperar cualquier decisión.
- Compilar y probar iOS en Mac/Xcode. La sincronización de recursos no constituye una compilación iOS.
- Firma de publicación, cuenta, ficha final, pruebas de tienda y precio objetivo de $88 MXN. No hay una publicación activa ni ingresos verificados.

Los informes originales 1.0 permanecen como evidencia histórica. La Forja Planetaria y el resto del alcance 0.3 no forman parte de esta validación.
