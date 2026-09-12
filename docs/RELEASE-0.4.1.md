# ÓRBITA 0.4.1 — informe de entrega

Validación realizada el 11–12 de septiembre de 2026. Esta versión continúa el juego existente y corrige también la superposición de objetos que deberían pasar detrás del planeta. Los resultados JSON, capturas y diagnósticos completos están en la carpeta de entrega, fuera del historial de código.

## 1. Base verificada

Repositorio canónico: https://github.com/Se4rch19/Orbita.git. Se partió de `main`, versión/tag `0.4.0` / `v0.4.0`, commit `c18d9e1daea41bfc2985d1fead9de5140261bb65`, con árbol limpio. La suite inicial aprobó **108/108 pruebas**. Se conservan los tags `v0.3.0`, `v0.3.1` y `v0.4.0`. Implementación en `release/orbita-0.4.1`.

## 2. Deslizamientos

Se calcula el desplazamiento desde el inicio hasta el final del dedo. Si `abs(dx) >= abs(dy)`, domina X; en otro caso, domina Y. Derecha o arriba desplazan una órbita hacia fuera; izquierda o abajo, una hacia dentro. Los empates diagonales se interpretan horizontalmente. El resultado es independiente de la posición del viajero, del planeta y del sentido de rotación.

El umbral normal es **18 píxeles CSS**. Un movimiento corto deliberado se acepta desde **12 píxeles CSS**, con duración máxima de **220 ms** y velocidad mínima de **0.16 px/ms**. Se reconoce al levantar el dedo, usando un único puntero principal. El intervalo mínimo entre entradas es **85 ms** y la transición visual conserva **120 ms**. Cada gesto mueve como máximo una órbita; los límites ignoran movimientos hacia fuera del recorrido, sin vuelta circular ni acumulación de movimientos. Se rechazan vibraciones y pulsaciones sin desplazamiento suficiente. El modo clásico conserva sus zonas opcionales de toque, pero sus deslizamientos usan el mismo algoritmo.

En el Redmi se ejecutaron **203 deslizamientos físicos mediante ADB**, cubriendo las **32 combinaciones** de cuatro gestos, cuatro cuadrantes y dos sentidos de rotación, sin discrepancias. Las pruebas automatizadas cubren también diagonales, secuencias rápidas, límites y movimientos cortos. El gesto de borde de Android mostró temporalmente la navegación del sistema y esta se retiró después; no fue necesario reservar una franja adicional de entrada.

## 3. Pantalla principal

El planeta animado ocupa el centro de la composición, acompañado de número, nombre, frase breve y requisitos de desbloqueo. Flechas e indicadores permiten recorrer los cinco mundos, incluidos los bloqueados. El selector compacto conserva Expedición, Calma, Del Día e Infinito y un botón principal JUGAR. Calma conserva 60 segundos, 180 segundos y continuo. Entrenamiento, etapas y códigos siguen accesibles.

La navegación principal tiene cuatro destinos: Mundos, Forja, Colección y Bitácora. Ajustes permanece separado. Los mundos bloqueados tienen representación completa; la validación de acceso sigue siendo independiente de su presentación. Del Día e Infinito conservan sus propias reglas de recorrido.

## 4. Identidad de los mundos

| Mundo | Presentación propia |
| --- | --- |
| Menta | Agua azul, tierras menta, nubes suaves, reflejos y una luna. |
| Durazno | Geología cobriza, tonos cálidos, polvo, dos lunas y escombros. |
| Lavanda | Superficie facetada, cristales, destellos y satélites geométricos. |
| Glaciar | Hielo, fracturas frías, partículas y aurora. |
| Eclipse | Cuerpo oscuro, cráteres, fisuras luminosas y restos orbitales. |

## 5. Planetas vivos y profundidad corregida

El renderizador Canvas 2.5D comparte perfiles entre inicio, Forja, intro y juego. Combina fondo estelar, ambiente, esfera con terreno ficticio proyectado, superficie activa, nubes con movimiento independiente, atmósfera y acompañantes orbitales. Las animaciones son autónomas y no necesitan arrastrar el planeta.

La corrección solicitada posteriormente separa la decoración orbital en pasadas trasera y delantera, según la profundidad de su plano orbital. Entre ambas se dibuja la silueta opaca del planeta. Cada luna, asteroide y muestra de estela decide su propia profundidad; los anillos se dividen en semicírculos. Esto permite ocultación parcial en el borde y evita ver una cola a través de la esfera. **Ocho comparaciones de píxeles** verificaron que los cuatro tipos de objetos no marcan la superficie cuando están detrás y sí se ven delante. La versión corregida también se observó durante 30 segundos en el teléfono. Las órbitas, luces y obstáculos del juego mantienen su prioridad de lectura.

## 6. Transiciones entre mundos

El viaje dura **720 ms**: salida de 320 ms y entrada de 400 ms. Una selección nueva sustituye al viaje pendiente y salir de la pantalla lo cancela. No se acumula una cola de transiciones ni se cargan indefinidamente escenas de todos los mundos.

## 7. Intro

Primera presentación: **4,000 ms**. Presentaciones posteriores: **2,100 ms**. El salto se habilita después de **1,000 ms**, respetando la preparación de las fuentes y el primer dibujo del inicio. Un límite de seguridad de **5,000 ms** evita quedar atrapado esperando recursos. Movimiento reducido omite la animación decorativa.

En el teléfono se observaron aproximadamente 3,969 ms desde la primera detección visible y 2,277 ms en repetición; el sondeo de la prueba añade variación respecto a los tiempos configurados. El salto se comprobó con un toque físico. El último arranque en frío tardó **3,078 ms** desde lanzar la aplicación hasta observar el inicio, incluyendo la intro de repetición. No se necesitan recursos remotos.

## 8. Forja

Se conservan **49 componentes en diez categorías**: forma, superficie, paleta, atmósfera, satélite, anillo, estilo de órbita, bioma, espacio y fenómeno. Las elecciones modifican capas concretas del renderizador. El anillo roto presenta un cinturón de asteroides; la órbita luminosa tiene una estela visible; luna, aurora, cristales, tormenta y nebulosa tienen efectos propios.

La vista previa permanece visible al desplazarse por las opciones, con fondo opaco para impedir que el texto pase visualmente a través de ella. Las piezas bloqueadas admiten una previsualización de solo lectura, sin conceder inventario ni guardar una pieza no poseída. El arrastre horizontal inspecciona el planeta y el desplazamiento vertical permite recorrer la interfaz móvil.

Ocho comparaciones de imagen con animación congelada confirmaron cambios visibles en atmósfera, satélite, cinturón, estela, superficie, bioma, fenómeno y espacio. También se revisaron físicamente las ocho categorías relevantes. Las pruebas comparan el guardado y el inventario antes y después de las previsualizaciones.

## 9. Mundos procedurales

`PlanetVisualProfile` reúne semilla, bioma, colores, atmósfera, nubes, lunas, satélites, asteroides, estela, entorno y actividad superficial. La campaña utiliza composiciones curadas; las anomalías varían la proyección del terreno mediante su semilla. La Forja y los diseños antiguos se traducen a perfiles compatibles; por ejemplo, hielo produce una superficie congelada y el ambiente volcánico mantiene lava. Se validaron **20,000 perfiles** sin combinaciones inválidas ni números no finitos. No se introdujo un sistema de criaturas, combate o IA adicional.

## 10. Calidad visual y límites

Auto es el valor predeterminado. El inicio selecciona Alta con al menos ocho núcleos y 4 GB de memoria declarada, Baja con dos núcleos o menos o 2 GB o menos, y Media en los demás casos. Si no se informa memoria se usan 4 GB como estimación. Ocho segundos con más del 35% del tiempo muestreado en cuadros superiores a 26 ms reducen un nivel; después hay 45 segundos de espera. Una elección explícita inicia 30 segundos de espera. Las selecciones manuales nunca se ajustan solas. El controlador persiste al navegar.

| Recurso por escena | Baja | Media | Alta |
| --- | ---: | ---: | ---: |
| Estrellas | 28 | 48 | 62 |
| Partículas ambientales de inicio/Forja | 8 | 16 | 24 |
| Asteroides decorativos | 8 | 18 | 30 |
| Lunas/satélites máximos | 3 | 3 | 3 |
| Capas atmosféricas | 1 | 2 | 3 |
| Partículas de ráfagas del juego | 24 | 48 | 80 |
| Tope de densidad de previsualización | 1 | 1.5 | 2 |
| Escenas de cuerpo en caché | 1 | 1 | 1 |
| Límite del pool de entidades del juego | 64 | 64 | 64 |

La estela tiene 24 muestras cuando está habilitada; el terreno, hasta 16 manchas y nueve trazos activos. Hay como máximo tres grupos de nubes por capa, con tres elipses cada uno. La intro puede coexistir temporalmente con el inicio: máximo dos escenas. El renderizado esencial del juego conserva un tope de densidad de 2 independientemente de la calidad. Animación ambiental desactivada congela el tiempo decorativo; no altera simulación, colisiones ni controles. Véase `VISUAL-SYSTEM-0.4.1.md` para detalles de arquitectura.

## 11. Presentación durante el juego

El escenario comparte la identidad de cada mundo: Menta legible y luminoso, Durazno cálido y polvoriento, Lavanda geométrico, Glaciar frío y fracturado, Eclipse oscuro con restos y fisuras. Viajero, luces, obstáculos y carriles se dibujan con prioridad sobre la decoración.

Se conserva el flujo continuo de entidades de 0.4.0: queued → forming → active → dissolving → recycled. Se mantienen la generación anticipada, el tiempo de reacción, las dos o tres órbitas y la dificultad. No se volvió al ciclo de recoger una luz para regenerar inmediatamente todo detrás del jugador.

## 12. Localización

Español de México e inglés de Estados Unidos tienen **435 claves cada uno**, con paridad de claves y parámetros comprobada automáticamente. Se movieron los textos de Jugar, Descubierto, Logrado, Cargar, Ajustes y otros rótulos identificados a recursos localizados. La auditoría de literales y las revisiones visuales cubren inicio, Forja, calidad, bloqueos y tutorial. El tutorial acepta derecha/arriba hacia fuera e izquierda/abajo hacia dentro y pasó sus ocho pasos en ambos idiomas, incluidos gesto incorrecto y repetición.

## 13. Preparación para música

Se añadió un único receptor opcional de eventos tipados: cambio de mundo, inicio/final de partida, intensidad, combo, luz, entrada/salida orbital, escudo, daño, pausa y continuación. Se deduplican transiciones y una excepción del receptor no interrumpe el juego. La conexión futura está documentada en `MUSIC-INTEGRATION-HOOKS.md`. **No se implementó otra banda sonora**; `audio.ts` y `music.ts` conservan su comportamiento y no se agregaron archivos musicales.

## 14. Guardado real

Se respaldó el estado real de 0.4.0 y se incluyó una fixture de regresión. La actualización usó `adb install -r` sobre `com.orbita.minigame`, sin borrar datos ni desinstalar. Sobrevivieron **7 partidas, 194 luces, récord 580, combo máximo 13 y el primer nivel completado**, junto con inventario, planeta personal, ajustes e historial. El planeta «Redmi · mi universo» conserva su diseño.

Las pruebas físicas añadieron únicamente registros legítimos de los códigos probados y contadores de presentación; no concedieron luces, desbloqueos ni inventario. Los ajustes temporales de idioma, calidad y animación se restauraron. Las comparaciones antes/después están en `redmi-migration.json`, `prior-device-0.4.0.json` y `redmi-final-save.json`.

## 15. Rendimiento en Redmi K50

Dispositivo: modelo 21121210G, identificador de modelo interno ingres, pantalla 1080 × 2400. Se observaron los cinco mundos sin interacción **30 segundos cada uno en Alta**: medianas de 16.4 ms, percentil 95 de 16.5 ms y ningún cuadro superior a 33.4 ms. La comprobación posterior de la corrección de profundidad en Menta produjo 1,824 cuadros en 30 segundos, mediana 16.4 ms, p95 16.5 ms y cero cuadros superiores a 33.4 ms.

La revisión de los cinco escenarios jugables en Alta duró unos cuatro segundos por mundo; Menta registró **un cuadro superior a 33.4 ms**, los otros cuatro ninguno. Infinito se comprobó durante cinco segundos en Alta: 304 cuadros, mediana 16.4 ms, p95 16.5 ms. Forja registró mediana/p95 de 16.5 ms. Son muestras del intervalo entre `requestAnimationFrame`, no una garantía de rendimiento sostenido en todos los teléfonos ni un ensayo prolongado de temperatura/batería.

Última memoria observada: **PSS 165,463 KB; RSS 336,316 KB; swap PSS 133 KB**. Se archivaron `dumpsys gfxinfo`, `dumpsys meminfo` y logcat del proceso. No se detectaron excepciones JavaScript ni fallos fatales en esas observaciones. La navegación de Android recuperó el modo inmersivo tras el gesto de borde; barras de estado y navegación quedaron ocultas.

## 16. Pruebas y compilación

Resultado final: **131/131 pruebas**, conservando las 108 originales y añadiendo 23. Pasaron TypeScript, formato de `src`/`tests`, revisión de espacios, build web, sincronización Capacitor y `assembleDebug bundleRelease`. Se conservaron los ensayos existentes de 1,500 sesiones/150,000 puertas y 2,000 sesiones/200,000 encuentros móviles.

El estrés adicional del flujo continuo ejecutó **2,000 sesiones**, 400 por contexto (campaña, diario, infinito, anomalía y personal): **219,705 segundos simulados**, **506,304 formaciones**, **702,199 reutilizaciones**, máximo 18 entidades asignadas y 15 simultáneas, frente a un límite de 64. El menor margen de reacción observado fue **0.640619 segundos**.

Pasaron las suites de navegador de juego móvil (9 grupos), Forja (13 grupos), identidad/tutorial, compatibilidad ambiental, presentación 0.4.1, ocho variaciones de Forja y ocho comparaciones de ocultación. Se revisaron pantallas de 320, 390/392 y 1440 píxeles de ancho. La validación física incluye 203 gestos, cinco observaciones de 30 segundos, intro completa/salto, arranque en frío, bordes de Android, Forja, idioma y juego.

Comandos reproducibles desde el repositorio: `npm test`, `npm run typecheck`, `npm run format:check`, `npm run qa:regression`, `npm run qa:forge`, `node scripts/qa-identity.mjs`, `node scripts/qa-environment.mjs`, `node scripts/qa-polish.mjs`, `node scripts/qa-forge-visuals.mjs`, `node scripts/qa-occlusion.mjs`, `node --experimental-strip-types scripts/stress-stream.ts`. Las suites web requieren la previsualización local en el puerto 4173; las pruebas físicas requieren el teléfono autorizado y su WebView de depuración.

## 17. Git

La implementación se realizó en `release/orbita-0.4.1`, comenzando con el commit `8362fc8` (planetas vivos, controles, profundidad y versión). Las pruebas y este informe forman un commit separado. El proceso de entrega integra normalmente en `main`, crea el tag anotado `v0.4.1` y publica ambos en el origen canónico, sin forzar ni reescribir historia. La copia externa de este informe y `release-manifest.json` registran los SHA finales y el resultado remoto una vez completada la publicación; así se evita incluir en un commit su propio SHA.

## 18. Archivos entregables

Directorio absoluto de entrega:

`C:\Users\haki0\Documents\Codex\2026-09-08\hola-te-pido-por-favor-que\outputs\Orbita-0.4.1`

- `Orbita-0.4.1-debug.apk`: APK de prueba, firma de depuración verificada; instalado en el teléfono.
- `Orbita-0.4.1-release.aab`: bundle de publicación **sin firma comercial**.
- `Orbita-0.4.1-source.zip`: código rastreado del tag final, sin dependencias instaladas ni binarios generados.
- `docs/`: informe, publicación, arquitectura visual y puntos de integración musical.
- `validation/`: resultados, capturas y diagnósticos físicos.
- `release-manifest.json`: hashes SHA-256 y referencias finales.

Paquete `com.orbita.minigame`, versión **0.4.1**, Android `versionCode 6`, minSdk 24, targetSdk 36. Se comprobó la firma del APK. El manifiesto no solicita permiso INTERNET. Los metadatos iOS también se incrementaron; esta entrega compilada corresponde a Android.

## 19. Capturas representativas

Las rutas siguientes son relativas al directorio absoluto de entrega indicado arriba:

- `validation/redmi-cold-home.png`: inicio de la compilación final instalada.
- `validation/redmi-final-intro-first.png`: presentación cinematográfica en el teléfono.
- `validation/redmi-final-game-4.png`: escenario Eclipse en el teléfono.
- `validation/redmi-final-infinite.png`: Infinito en el teléfono.
- `validation/redmi-final-forge-ring-broken.png`: cinturón de asteroides y vista previa física; tomada antes del último ajuste de opacidad del fondo fijo de la Forja.
- `validation/redmi-edge-transient.png` y `validation/redmi-edge-restored.png`: navegación nativa temporal y recuperación del modo inmersivo.
- `validation/occlusion-moon-back.png` y `validation/occlusion-moon-front.png`: prueba controlada de la ocultación orbital.

Las capturas `redmi-world-0` a `redmi-world-4`, sufijos `start` y `30s`, documentan la observación inicial de vida autónoma. La prueba posterior de profundidad tiene sus propias capturas y resultados; no se presentan las capturas iniciales como evidencia de esa corrección posterior.

## 20. Límites y asuntos pendientes

No quedó un fallo funcional conocido de las pruebas ejecutadas. Hubo un cuadro lento aislado en la muestra jugable de Menta, documentado arriba. No se realizó una prueba térmica prolongada ni validación física en otros modelos Android. Infinito tuvo una revisión física corta en esta entrega y un ensayo procedural largo automatizado.

El texto mencionaba dos imágenes de referencia, pero los adjuntos recibidos contenían únicamente texto: se siguió la dirección artística descrita y no se afirma una comparación visual con imágenes ausentes. La aplicación usa gráficos originales procedurales, sin nuevos recursos remotos.

El AAB necesita la clave comercial y la configuración de la ficha para enviarse a una tienda; no se publicó en Play Store/App Store. iOS no se compiló ni probó en este equipo Windows. La integración del motor Music Lab sigue siendo una tarea posterior expresamente separada. No se añadieron anuncios ni microtransacciones.
