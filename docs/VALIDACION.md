# Validación de la entrega

Documento histórico de la versión inicial 1.0. Para la entrega actual consultar [VALIDACION-0.2.md](VALIDACION-0.2.md).

Realizada en Windows, 8 de septiembre de 2026.

## Comprobaciones realizadas

- TypeScript estricto y compilación Vite de producción.
- 15 pruebas automatizadas de motor y guardado: rutas repetibles, fecha local, puntuación única por luz, multiplicador, pérdida de cadena, colisiones, invulnerabilidad, Calma, finalización única, cambio de órbita y recuperación de datos inválidos.
- Recorrido de interfaz con Chromium/Playwright: tutorial, entrada táctil, pausa y reanudación, una partida completa de Calma de 60 segundos, resultado, recarga con progreso, mundo bloqueado, preferencias y recuperación tras JSON dañado.
- Recorrido adicional superado: recarga y partida sin conexión, control por teclado, selección de un mundo ganado, cancelación y confirmación del borrado. Se corrigió una incompatibilidad entre la caché de recursos y la cabecera `Vary` del servidor de vista previa.
- Revisión de dimensiones de 390 × 844, 320 × 568 y 1440 × 1000. Sin desbordamiento horizontal en las dimensiones móviles verificadas.
- Compilación Gradle de APK debug y AAB release. Análisis vital de Android superado.
- Verificación de firma de depuración con `apksigner` e inspección del APK con `aapt`: nombre Órbita, identificador `com.orbita.minigame`, versión 1.0, mínimo SDK 24 y objetivo SDK 36.
- `npm audit`: cero vulnerabilidades conocidas en la revisión de esta entrega. Esto no equivale a una auditoría de seguridad completa.

Las capturas y los informes JSON de interfaz están en `outputs/capturas/`. El motor se prueba sin DOM, de modo que la puntuación y las reglas pueden verificarse independientemente de los gráficos.

## Límites importantes

- No había teléfono conectado según `adb devices`. No se instalaron ni ejecutaron los binarios en un teléfono físico o emulador Android.
- No se ha verificado el rendimiento real, la vibración, el consumo de batería, los gestos del sistema ni la recuperación después de una terminación del proceso en hardware móvil. Es la siguiente prueba antes de una beta pública.
- iOS está generado y sincronizado; no está compilado ni probado. Requiere Mac/Xcode y una cuenta del titular para distribución.
- El APK está firmado para depuración. El AAB está sin firma de producción y requiere una clave de subida del titular.
- Las pruebas de navegador no sustituyen las pruebas nativas ni certifican aprobación en tiendas.
- No hay mediciones con jugadores reales, validación de retención, ventas ni previsión de rentabilidad.
- El juego utiliza Canvas visual; los menús permiten teclado, pero no existe una modalidad de juego no visual.

## Repetir las pruebas

Desde la carpeta de proyecto:

```powershell
npm ci
npm test
npm run build
npm audit
npx playwright install chromium
npm run preview -- --port 4173
```

En otra terminal: `node scripts/qa.mjs` y `node scripts/qa-extra.mjs`. El segundo recorrido comprueba caché offline, teclado, selección de mundo ganado y confirmación/cancelación del borrado. Las pruebas usan contextos de navegador aislados; los fixtures de mundos desbloqueados son datos de prueba, no progreso real de un jugador.
