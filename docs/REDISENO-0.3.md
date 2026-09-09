# Órbita — Gameplay Redesign 0.3

Implementación del 9 de septiembre de 2026 sobre el proyecto 0.2. Versión 0.3.0, código Android 3. No se añadieron dependencias de ejecución ni sistemas comerciales. La copia de entrega está en `outputs/Orbita-0.3/`; los artefactos anteriores permanecen fuera de esa carpeta.

## 1. Resumen

Se añadió Forja Planetaria, una colección de 34 componentes, tres espacios progresivos para planetas, Mi órbita, diez hitos, fragmentos gastables en cosméticos, códigos de desafío y Anomalías después de la campaña. Se conservaron los cinco mundos, las 15 expediciones, Entrenamiento, Calma, Del día, Infinito, el motor de colisiones, las semillas y la dificultad 0.2.

El juego sigue siendo local. No requiere una computadora encendida, servidor, cuenta, API externa, anuncios ni microtransacciones. Esta fase no fija precio de venta ni estrategia de monetización.

## 2. Forja Planetaria

Desde la navegación principal, Forja abre una sola vista previa Canvas. Permite elegir piezas desbloqueadas, escribir un nombre de hasta 24 caracteres, guardar y usar el planeta en Mi órbita. Las categorías son forma, superficie, paleta, atmósfera, satélite, anillo y trazo orbital.

Hay un espacio desde el principio; el segundo aparece con 100 fragmentos acumulados y el tercero con 300. No cuestan fragmentos. Se puede cambiar el nombre y sobrescribir cada diseño; no hay un editor de niveles ni un sistema de borrado individual de planetas. El guardado conserva la selección y los componentes de cada espacio. Cambiar piezas es gratuito después de obtenerlas.

Mi órbita usa Infinito con el nivel inicial del mundo desbloqueado elegido. La geometría, velocidad, peligros y cambio de camino pertenecen a ese perfil validado. La forma del planeta es visual: no deforma las órbitas de juego. Los récords personales se separan por perfil del mundo y no sobrescriben el Infinito original. Se puede jugar alrededor del planeta creado, ganar luz y conseguir los hitos de supervivencia.

Se limpian controles, marcas direccionales invisibles y caracteres de marcado en nombres; además se escapa todo texto editable al mostrarlo en HTML. Los nombres vacíos pasan a «Mi pequeño mundo». Un diseño inválido, una categoría equivocada o una pieza no poseída usa la pieza inicial de esa categoría.

## 3. Colección

| Familia | Componentes implementados |
| --- | --- |
| Formas, 6 | Semilla redonda, Trébol suave, Diamante blando, Cinco horizontes, Panal celeste, Pequeña marea. |
| Superficies, 6 | Jardín, Roca suave, Cristal de hielo, Océano, Lava dormida, Noche profunda. |
| Paletas, 6 | Menta, Durazno, Lavanda, Glaciar, Eclipse, Amanecer. |
| Atmósferas, 4 | Cielo limpio, Halo, Polvo estelar, Aurora. |
| Satélites, 4 | A solas, Luna amiga, Lunas gemelas, Compañero cristal. |
| Anillos, 4 | Sin anillos, Cinta celeste, Abrazo doble, Ecos. |
| Trazos orbitales, 4 | Trazo fino, Puntos de luz, Trazo suave, Cristal tallado. |

Siete piezas esenciales están disponibles desde el inicio. Las condiciones de las demás se muestran tanto en Forja como en Colección. Hay desbloqueos por entrenamiento, mundos completados, campaña completa, fragmentos totales, cadena de diez luces, supervivencia de 60/90 segundos, uno/tres días completados, victoria sin impactos, primer planeta y tres anomalías. El catálogo exacto de condiciones y costes está en `CATALOGO-0.3.md`, generado desde los mismos datos del juego.

Las clasificaciones Esencial, Singular y Cósmico describen descubrimientos. No hay tiradas, probabilidades, cajas ni premios pagados. La colección muestra marcadores discretos para piezas bloqueadas. Un aviso persistente presenta hasta tres descubrimientos por nombre y el número restante; se puede abrir la Forja o descartarlo. Los hitos nuevos también aparecen en el resultado de partida.

## 4. Progresión y economía

Se conserva `totalLights` como fragmentos acumulados de toda la vida, incluidos bonos. `universe.spent` registra lo usado en fabricación. Saldo disponible = acumulados − gastados. Gastar no vuelve a cerrar mundos ni espacios y nunca admite saldo negativo. Los usuarios migrados reciben como saldo inicial sus fragmentos anteriores; no se presupone ningún gasto previo.

Ocho componentes tienen un coste de 10–35 fragmentos y suman 170 en total; requieren también cumplir su condición visible. Los demás se descubren automáticamente. Fabricar algo ya poseído no vuelve a cobrar. Guardar, equipar y renombrar son gratuitos.

| Fuente | Recompensa |
| --- | --- |
| Expedición | Luz recogida + bonos originales de 20/25/30 por primera victoria. |
| Del día | Luz recogida + 15 por completar una fecha por primera vez. |
| Infinito y Mi órbita | Luz recogida; hitos de supervivencia no repetibles. |
| Calma | Un fragmento por cuatro luces, hasta seis por minuto; mantiene puntos de guardado por minuto. |
| Entrenamiento | Sin recompensa repetible; el primer hito concede 10 fragmentos. |
| Códigos | Cero fragmentos, cero hitos y cero avance de campaña. Récord propio por código. |
| Anomalías | Luz recogida + 20 por superar el escalón actual, una sola vez. |

Diez hitos conceden en conjunto 205 fragmentos: entrenamiento, Menta, campaña completa, 100 fragmentos, diez luces en cadena, 90 segundos de Infinito/Mi órbita, tres días distintos, expedición sin impactos, primer planeta y tres anomalías. No hay rachas que se pierdan ni requisitos de conexión. Los hitos compatibles con información antigua se reconocen al migrar; no se inventan tiempos de juego que 0.2 no registró.

## 5. Códigos de desafío

Se eligió la estrategia A: desafío reproducible para comparar puntuaciones. Formato `ORB-XXXX-XXXX-XXXX-XXXX-XXXX`, hexadecimal legible en cinco grupos. Sus diez bytes contienen versión de código (3), versión del generador (2), mundo, nivel de reglas, semilla de 32 bits y CRC-16. Duración, objetivos y mecánicas se derivan del perfil validado del mundo y nivel.

Los códigos aceptan minúsculas y espacios exteriores. Se rechazan formato incorrecto, longitud excesiva, checksum incorrecto, versión incompatible y perfiles fuera de rango. El checksum detecta errores de copia; no es una firma criptográfica ni un sistema antitrampas.

El mismo código y las mismas decisiones reproducen el recorrido. Como en el motor original, decisiones distintas pueden cambiar qué encuentros se alcanzan, sobre todo al cambiar de sentido. La campaña, Infinito, Mi órbita, Anomalías y los intentos diarios ordinarios mantienen variación por intento.

Crear permite elegir mundo desbloqueado e intensidad. Introducir permite probar un código de cualquier mundo válido sin abrirlo en campaña. Se copian el código o un resumen con puntuación, cadena y multiplicador. Si no hay acceso al portapapeles, se presenta texto seleccionable; el resultado conserva sus controles. Compartir se hace copiando texto, sin envío automático, conexión ni base de datos. Se guardan hasta 30 marcas por código. Cambiar las reglas compatibles requiere versionar el formato/generador antes de distribuir futuros códigos.

## 6. Después de la campaña: Anomalías

Se abre al completar las 15 expediciones. Cada escalón elige un mundo mediante hash determinista; la semilla del intento genera otra ruta. Los primeros tres escalones usan nivel de reglas 0, los tres siguientes nivel 1 y los posteriores nivel 2. La intensidad llega a un techo legible; no aumenta ilimitadamente.

Se reutilizan perfiles completos existentes, sus objetivos, fracturas, contragiros, velocidades y presupuestos de dificultad. No se combinan mecánicas de forma libre. Una victoria avanza el escalón y entrega el bono; una derrota conserva el escalón. Tres victorias descubren el anillo Ecos y su hito. El contador sustituye a una colección enorme de niveles almacenados.

## 7. Rendimiento y legibilidad

Todos los visuales nuevos son Canvas procedural. Las curvas tienen hasta seis lóbulos, deformación máxima 0.13 y 96 segmentos de dibujo del planeta. Las piezas y geometrías usan un catálogo cerrado. El planeta se cachea; se dibuja una sola vista previa activa. Hay como máximo dos satélites cosméticos y 80 partículas del juego. No hay texturas grandes, modelos 3D ni frameworks de edición añadidos.

Los anillos y satélites permanecen dentro del corredor interno de juego. El trazo orbital decorativo se superpone a una línea continua base: no oculta los caminos. Se mantienen el viajero blanco, las luces doradas y los peligros coral. Los efectos reducidos detienen satélites, titileo y partículas; los halos estáticos siguen siendo baratos. Se conservan paso fijo de 1/120 s, HUD a 15 Hz, Canvas a 2× y pausa en segundo plano.

Los tamaños finales y las pruebas exactas aparecen en `VALIDACION-0.3.md`. No se certifican 60 FPS en teléfonos físicos ni consumo de batería; el hardware móvil todavía requiere medición.

## 8. Guardado v3

La aplicación escribe `orbita.v3`, con `version: 3` y un bloque `universe`: inventario, gasto, planetas, selección, hitos, descubrimientos pendientes, estadísticas, marcas personales, códigos y progreso de Anomalías. La normalización original v2 permanece disponible para compatibilidad y pruebas. La migración v1 pasa por sus reglas originales; v2 conserva campaña, mundos, fragmentos, récords y preferencias al expandirse a v3.

Orden de recuperación: v3 → respaldo v3 → v2 → respaldo v2 → v1. Los originales v1/v2 no se borran durante la migración. Se guarda el estado anterior válido de v3 como respaldo. Las estructuras y colecciones se normalizan y acotan; los códigos corruptos se descartan. Borrar todo el progreso requiere confirmación y elimina también las claves antiguas para evitar que reaparezcan.

Los minutos y luces brutas empiezan a contarse en 0.3; los días completados que aún figuren en el historial 0.2 se recuperan. Se conservan hasta 366 fechas de completado local. No se restauran partidas interrumpidas: se guardan sus resultados al terminar, salvo los puntos de control de fragmentos de Calma. Una desinstalación o limpieza de datos puede borrar el progreso; no hay nube.

## 9. Internet y permisos

No hay dependencia de red del juego. Se retiró `android.permission.INTERNET` mediante una regla de eliminación del manifiesto combinado. La revisión del código instalado de Capacitor confirma que `WebViewLocalServer.shouldInterceptRequest` dirige el origen local a `handleLocalRequest`, que abre `index.html` desde assets y responde con `WebResourceResponse`. No necesita abrir un socket de red para servir esos recursos. No se configuró `server.url` ni un proxy remoto.

La verificación del APK final comprueba la ausencia del permiso. Las pruebas Chromium verifican carga offline y cero peticiones a dominios externos. Esto no equivale a ejecutar el WebView Android: la retirada del permiso aún debe probarse en un teléfono junto con arranque, audio, vibración, pausa y actualización desde 0.2. No se afirma haber realizado esa prueba física.

## 10. Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `src/forge.ts` | Catálogo, condiciones, diseños, fabricación, slots e hitos. |
| `src/forge-art.ts` | Dibujo procedural de materiales, formas, atmósfera, anillos y satélites. |
| `src/storage3.ts` | Guardado v3, migraciones, normalización y recuperación. |
| `src/progression3.ts` | Resultados por contexto, bonos, estadísticas y prevención de duplicados. |
| `src/challenges.ts` | Codificación, CRC, validación, reconstrucción, resumen y Anomalías. |
| `src/universe-ui.ts`, `src/forge.css` | Forja, Colección, Códigos, Anomalías, perfil y adaptación móvil. |
| `src/main.ts` | Integra pantallas, contexto de partida, guardados y portapapeles. |
| `src/art.ts` | Reutiliza el render y admite un diseño visual opcional. |
| `src/storage.ts` | Conserva la normalización y pruebas v2; amplía el tipo de versión para aceptar v3. |
| `tests/forge.test.ts` | 24 pruebas nuevas, incluidas migraciones y estrés. |
| `scripts/qa-regression03.mjs`, `qa-offline03.mjs`, `qa-forge03.mjs` | Regresión de modos, offline y recorridos de las funciones 0.3. |
| `android/app/src/main/AndroidManifest.xml` | Retirada del permiso INTERNET. |
| `package*.json`, Gradle y Xcode | Versión 0.3.0; número de compilación 3. |

`engine.ts`, `config.ts`, `generator.ts`, `geometry.ts`, `random.ts`, `progression.ts` y `audio.ts` conservan las reglas 0.2. Las 46 pruebas anteriores siguen presentes.

## 11. Pruebas

70 pruebas automatizadas aprobadas: 46 anteriores y 24 nuevas. El estrés adicional cubre 1,500 sesiones con 18 segundos de simulación cada una y 150,000 encuentros independientes de patrones; verifica valores finitos, geometría, carriles, búfer acotado, presupuesto, restricciones de generación y serialización. No todas son partidas completas ni constituye una prueba formal de solvencia.

Los recorridos de navegador suman 30 grupos: diez de modos originales, siete de offline/migración y trece de Forja/códigos/postcampaña. Incluyen vistas de 320, 390 y 1440 píxeles, portapapeles y su fallo, guardados, nombres, fabricación, las 34 opciones visuales y juego personal. Algunas pantallas avanzadas utilizan fixtures de progreso explícitos; no representan desbloqueos ganados por un humano durante la prueba.

Comandos, binarios y comprobaciones de paquete se detallan en `VALIDACION-0.3.md`.

## 12. Entregables

La carpeta limpia `outputs/Orbita-0.3/` contiene APK de depuración, AAB sin firma de publicación, ZIP de código, proyecto `orbita/`, guía `EMPIEZA-AQUI.md`, lanzador `Jugar-Orbita.cmd`, documentación `docs/` y capturas con informes `capturas/`. Los archivos 1.0/0.2 no se mezclan en ella.

## 13. Límites y trabajo pendiente

- Falta ejecutar el APK y su actualización sobre 0.2 en teléfonos físicos o emulador. No hay dispositivo conectado en este entorno.
- Faltan pruebas humanas de claridad, dificultad, variedad y ritmo de desbloqueos, y mediciones de rendimiento/batería en móviles modestos.
- iOS está sincronizado, no compilado: requiere un entorno Mac/Xcode.
- Los códigos detectan errores de copia, no acreditan puntuaciones auténticas. El reloj local puede cambiarse; no hay antitrampas de competición online.
- Mi órbita usa el perfil inicial de cada mundo; no ofrece ajustes arbitrarios de dificultad ni exporta la apariencia dentro del código. No es un editor de niveles.
- El resumen compartible es texto; no se genera una tarjeta de imagen. Los cambios no guardados de una edición no sobreviven a cerrar la aplicación.
- No se añadieron nube, cuentas, fantasmas, eventos remotos, herramientas 3D ni sistemas comerciales. La firma y publicación en una tienda siguen pendientes y fuera de esta implementación.
