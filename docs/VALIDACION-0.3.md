# Validación de Órbita 0.3

9 de septiembre de 2026. Windows, Node 24.17.0, JDK 21 y SDK Android 36. Resultados del código final empaquetado, no de una compilación anterior.

## Comandos y resultados

| Paso | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto; sin diagnósticos de TypeScript. |
| `npm run format:check` | Correcto; todos los archivos `src` y `tests` cumplen Prettier. No hay ESLint configurado. |
| `npm test` | **70 pruebas aprobadas; 0 fallidas, 0 omitidas, 0 canceladas.** Última ejecución: 2,277 ms. Se mantienen las 46 de 0.2. |
| Estrés nuevo, incluido en `npm test` | **1,500 sesiones y 150,000 encuentros**. 18 s de simulación por sesión; no son 1,500 partidas completas. |
| Estrés conservado 0.2 | **45,000 encuentros**, una hora simulada de Calma y equivalencia del motor a 15/60/120 FPS, aprobados. |
| `npm run qa:regression` | **10 + 7 grupos aprobados**, cero errores JavaScript no capturados. |
| `npm run qa:forge` | **13 grupos aprobados**, cero errores JavaScript no capturados y cero peticiones externas durante ese recorrido. |
| `npm audit --omit=dev` | **0 vulnerabilidades** notificadas en dependencias de producción. |
| `npm run build` | Correcto. Vite transformó 29 módulos; fase Vite 464 ms. |
| `npx cap sync` | Android e iOS sincronizados correctamente; App y Haptics conservados. |
| Gradle `assembleDebug bundleRelease --console=plain` | **BUILD SUCCESSFUL in 30s**. 339 tareas: 79 ejecutadas, 260 actualizadas. Incluye `lintVitalRelease`. |
| `apksigner verify --print-certs` | Firma válida; mismo certificado de depuración de 0.2. |
| `aapt dump badging` | ID `com.orbita.minigame`; versión **0.3.0**; versionCode **3**; mínimo API 24; objetivo API 36; etiqueta Órbita. |
| `aapt dump permissions` | **INTERNET ausente**. Permanecen VIBRATE y el permiso interno de receptor no exportado. |
| Comparación de recursos | Los **10 archivos web** de APK y AAB coinciden por SHA-256 con la última carpeta `dist`. |
| `adb devices -l` | Lista vacía. **No se ejecutó el APK en un teléfono ni emulador.** |

El primer intento de QA encontró el servidor de vista previa apagado. Se inició el servidor local y se repitieron los recorridos completos con resultado satisfactorio. Esto no afecta a la aplicación empaquetada, que no usa ese servidor.

## Cobertura nueva

- Catálogo: siete categorías completas, identificadores únicos, límites de curvas y satélites.
- Desbloqueos, saldo, requisitos, fabricación única, hitos y prevención de duplicación al liquidar una partida.
- Nombres, selección por categoría, piezas inválidas/bloqueadas, slots, guardado y serialización de planetas.
- Migración v1 y v2 a v3, recuperación del respaldo, claves antiguas intactas y borrado que no resucita progreso antiguo.
- Códigos en los 15 perfiles, extremos de semilla, CRC, versiones, formato, reconstrucción y simulación repetible.
- Marcas de códigos y Mi órbita aisladas de campaña/Infinito; cero recursos en códigos; bono diario único.
- Anomalías deterministas por escalón, rutas variables por intento y avance no duplicado.
- Estrés: valores finitos, geometrías, carriles de aparición, densidad/velocidad acotadas, reacción mínima, camino seguro de cada encuentro, búfer acotado y serialización.

El estrés usa exclusivamente el generador de juego real y los perfiles existentes. Incluye contextos de código, Anomalías y el perfil Infinito utilizado por Mi órbita. La apariencia no interviene en la simulación; sus formas se verifican por separado con 1,000 muestras por forma. No hay demostración matemática de solvencia de todas las rutas ni de recuperación de cualquier decisión del jugador.

## Navegador y revisión visual

Chromium/Playwright: entrenamiento, campaña, Calma completa y continua, diario, Infinito, pausa, teclado, controles de tres caminos, migración v1 real, borrado y recuperación. Pruebas nuevas: crear/nombrar/guardar/recargar planeta, fabricar una pieza, equiparla, jugar Mi órbita, generar/introducir/copiar código, copiar resultado, portapapeles no disponible, repetir reto, entrada bloqueada y abierta a Anomalías, las 34 opciones visuales, espacios adicionales y efectos reducidos.

Se probó carga offline de los cinco mundos originales, Mi órbita y un código introducido. Las pantallas se comprobaron a 320, 390 y 1440 píxeles sin desbordamiento horizontal. Se inspeccionaron las capturas y se compactaron las categorías y avisos. Las capturas avanzadas usan fixtures locales de progreso para alcanzar todos los componentes; no se atribuyen a una campaña completada por una persona.

Informes reproducibles: `capturas/qa.json`, `qa-extra.json`, `qa-forge03.json` y `package-validation.json`. El código incluye los tres scripts correspondientes. La vista previa local debe ejecutarse en el puerto 4173 para correr estos scripts.

## Tamaño y binarios

| Archivo | Tamaño exacto | SHA-256 |
| --- | ---: | --- |
| `Orbita-0.3-debug.apk` | **4,164,798 bytes**, 4.16 MB decimales | `DFA853C293D53C8C9FB8FFCF27CBC5E57A3BF71684638CC7FDBEA985F01F5F4A` |
| `Orbita-0.3-sin-firma.aab` | **3,034,957 bytes**, 3.03 MB decimales | `012222D7235544758B8577C12685667C4ED03DBB687D61ECA43CA9CB3A0C5054` |

El APK aumentó 11,566 bytes respecto al APK 0.2 entregado. JavaScript principal: 85.56 kB (31.25 kB gzip); CSS: 22.01 kB (5.43 kB gzip). Caché web final `081f1683b1d9`.

Certificado de depuración SHA-256: `fb8606f661f18a863049431c53fc7bf3be2fc842f7cd076a92a6d98b7ea02bdd`. El AAB necesita firma de publicación. No se crearon claves de producción ni se incluyeron secretos en la entrega. Los assets corresponden a 0.3 y la configuración no contiene `server.url`.

## Límites de la validación

El inicio nativo, funcionamiento sin INTERNET, actualización sobre 0.2, audio, vibración, botón Atrás, interrupciones y persistencia deben verificarse en Android físico o emulador. La inspección del manifiesto y del código de carga local de Capacitor no sustituye esa ejecución. Tampoco se midieron batería, temperatura, latencia táctil o FPS en móviles modestos.

iOS se sincronizó, pero no se compiló ni ejecutó en Windows. La dificultad, motivación, ritmo de progresión y claridad necesitan pruebas con personas. No hay publicación activa ni validación comercial, y esta versión no presupone precio de venta.
