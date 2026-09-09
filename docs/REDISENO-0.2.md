# Órbita — Gameplay Redesign 0.2

Implementación sobre el proyecto existente. Versión de distribución 0.2.0, código de versión Android 2. Informe del 8 de septiembre de 2026.

## 1. Resumen

Órbita ahora tiene una campaña de 15 expediciones, un entrenamiento jugable independiente, Calma con duración elegible, desafíos diarios locales y un modo Infinito. Los cinco planetas modifican las reglas y las trayectorias. Se conservan la identidad visual, el Canvas 2D, el sonido sintetizado, los controles táctiles, los ajustes, el guardado local y Capacitor.

No se añadieron dependencias de ejecución, servidores, cuentas, APIs externas, anuncios, pagos, multijugador, clasificaciones online ni fantasmas. El APK contiene los recursos necesarios para jugar: la computadora del desarrollador **no debe permanecer encendida**. El servidor Node incluido solo permite previsualizar la versión de escritorio durante el desarrollo.

## 2. Modos finales

| Modo | Comportamiento |
| --- | --- |
| Entrenamiento | Secuencia jugable de 30 segundos: viajero, cambio de órbita, luz, peligros, escudos y cadena. Se completa al cambiar de órbita y recoger luz. No entrega recursos ni victorias de campaña. Se puede repetir desde inicio o Ajustes. El indicador de finalización se guarda; no se impone al iniciar cada sesión. |
| Expedición | Cinco mundos × tres niveles. Cada nivel exige sobrevivir 45, 55 o 60 segundos y recoger 12, 16 o 20 luces, respectivamente. Superar el nivel anterior abre el siguiente. Cada intento genera otra ruta dentro de sus reglas. |
| Calma | 1 minuto, 3 minutos o sin límite. Velocidad base 0.68, pocos peligros, sin pérdida de vidas ni derrota. Los impactos rompen la cadena. Se puede terminar y guardar desde pausa. Se guarda la luz ganada al cumplir cada minuto. |
| Del día | La fecha local y la versión de reglas fijan planeta, nivel de mecánicas, duración de 45/60/75 segundos y modificador. Pulso veloz aumenta velocidad; Luz en cadena exige más luces; Paso preciso utiliza el objetivo normal. El objetivo escala con la duración, los caminos y la complejidad geométrica y estructural, con mínimo de ocho luces. Los obstáculos varían por intento. Se registran intentos, mejor puntuación y finalización de cada día. |
| Infinito | Sin límite de tiempo. Tres escudos y aceleración suave hasta un máximo controlado. A los 75 segundos amplía los patrones disponibles si el nivel inicial aún no los incluía. Termina al perder los escudos y conserva el récord personal. Usa el mundo y nivel de mecánicas elegidos. |

La puntuación es comparable dentro de cada expedición, dentro del reto del día y en Infinito. Se muestra el récord previo y la diferencia. Los récords de campaña de cada planeta también se consultan en Bitácora. Calma muestra la cadena, sin competir con esos récords.

## 3. Planetas

| Mundo | Mecánica real implementada |
| --- | --- |
| Menta | Dos círculos, misma velocidad base por órbita, patrones claros. Introduce el control y la lectura del camino seguro. |
| Durazno | Tres órbitas con velocidades distintas: interior 1.14, media 1.00 y exterior 0.88. Desde la segunda expedición aparecen obstáculos que se desplazan entre caminos no reservados como seguros. |
| Lavanda | Planeta y órbitas deformados en un triángulo redondeado. La velocidad angular se corrige por la longitud local de la curva para evitar saltos visuales al recorrerla. |
| Glaciar | Tramos rotos de la órbita, dibujados como segmentos discontinuos y marcados en sus extremos. Estar o entrar en ellos consume un escudo. Siempre hay otro camino en ese encuentro. |
| Eclipse | Tres curvas de cuatro lóbulos y fracturas. El primer nivel combina esas bases; el segundo añade una órbita media que gira al revés; el tercero añade cambios globales de sentido cada 20 segundos, anunciados con dos segundos de anticipación. |

Calma conserva la geometría y la cantidad de caminos del planeta, pero elimina los contragiros y los cruces móviles para mantener una experiencia suave. La mecánica distintiva de fracturas o cruces se introduce periódicamente en campaña, para que una semilla no elimine por azar la identidad del mundo.

## 4. Generación procedural

Se conservó el modelo de objetos alrededor de la órbita y se sustituyó la elección aleatoria independiente por un generador de patrones. Su catálogo incluye rastro de luz, alternancia, camino seguro, embudo, pulso, cruce y fractura. Cada patrón dura unos encuentros y recibe parámetros compatibles con el mundo y su dificultad.

La semilla de generación combina intento, modo, mundo, nivel, reglas del día y `GENERATION_VERSION = 2`. Con la misma semilla y las mismas decisiones del jugador, el resultado es reproducible. La aplicación toma una nueva semilla local para cada intento. No hay descargas de niveles ni una lista masiva de niveles almacenados.

Las reglas base del día utilizan un hash de `orbita + versión de generación + YYYYMMDD` en fecha local. Instalaciones con esas mismas reglas y fecha obtienen el mismo desafío base. La colocación exacta cambia para favorecer adaptación en lugar de memorizar un guion. Si en el futuro cambia la compatibilidad de las reglas diarias, debe incrementarse la versión de generación.

Restricciones de seguridad de las rutas:

- Cada encuentro reserva al menos una órbita activa con luz. Sus obstáculos nunca ocupan todos los caminos activos.
- La separación considera la velocidad máxima de la sesión: al menos 0.78 segundos entre centros de encuentros. Los mundos estructurales añaden 0.35 radianes de margen, suficiente para descontar el ancho de sus fracturas.
- Al cambiar de sentido se conserva la posición geométrica de los objetos, se reordena su recorrido y se despeja la entrada inmediata con un margen de 0.85 segundos a la velocidad máxima.
- Los cruces se asientan en 0.35 segundos, antes de poder alcanzar al viajero, y no bloquean la ruta segura reservada.
- El cambio de órbita tiene 160 ms de separación entre entradas y una transición interpolada. Con tres caminos hay controles de siguiente/anterior; no se exige una doble pulsación instantánea.

Son restricciones de generación y pruebas de rutas, **no una demostración matemática de que cualquier decisión de cualquier jugador sea recuperable**. Tomar una mala decisión aún puede causar una derrota.

## 5. Dificultad y rendimiento

Las sesiones finitas utilizan una curva suave `p²(3−2p)` sobre el progreso de la sesión. Infinito utiliza una aproximación exponencial al máximo. Las velocidades individuales, la deformación, el nivel y el modificador diario determinan el movimiento; la velocidad angular real tiene un tope de 2.4 rad/s.

El coste de tres caminos, geometría, fracturas, obstáculos móviles y contragiros reduce la densidad base de peligros. La velocidad adicional también reduce esa densidad. El generador añade espacio cuando la velocidad máxima lo requiere. Así, la complejidad no se incrementa simplemente llenando la pantalla.

La simulación avanza con pasos fijos de 1/120 s y consume el tiempo real acumulado. Se eliminó el recorte anterior de 50 ms que ralentizaba el reloj a pocos FPS. Las pausas y el segundo plano detienen la simulación explícitamente.

Los planetas y las trayectorias se cachean. Hay un límite de 80 partículas, el HUD se actualiza como máximo 15 veces por segundo y el lienzo limita su densidad de píxeles a 2×. El juego no dibuja en una pestaña oculta. El búfer de encuentros permanece acotado incluso en sesiones continuas largas. El objetivo de 60 FPS depende del dispositivo y no está certificado en teléfonos físicos.

## 6. Progresión y fragmentos

La luz recogida en Expedición, Del día e Infinito aporta un fragmento por luz. La primera victoria de cada nivel añade 20, 25 o 30 fragmentos; no se puede repetir esa bonificación. Los fragmentos son progreso acumulado y no se gastan.

Para un jugador nuevo, los mundos requieren completar los tres niveles del mundo anterior y alcanzar 70, 170, 300 y 460 fragmentos para Durazno, Lavanda, Glaciar y Eclipse. El primer mundo está abierto desde el inicio. Los mundos ya abiertos nunca se vuelven a cerrar.

Calma concede un fragmento por cada cuatro luces, con un máximo adicional de seis fragmentos por minuto transcurrido. El entrenamiento no concede fragmentos. Calma no puede saltarse las victorias requeridas de campaña. Sus guardados parciales se descuentan al liquidar el resultado para impedir que se conceda dos veces la misma luz.

## 7. Guardado y migración

El formato pasa de versión 1 a versión 2. La nueva clave es `orbita.v2`; la anterior `orbita.v1` se conserva. Hay una copia anterior en `orbita.v2.backup`, y se intenta recuperar esa copia o la versión 1 si el JSON actual se daña.

La migración conserva fragmentos, mundos ganados con los umbrales antiguos, preferencias, tutorial, partidas, cadena y récord anterior. No inventa victorias de la nueva campaña. El récord previo aparece como histórico; no se mezcla con las marcas por nivel. El reto diario antiguo conserva su versión de reglas y no se compara con los retos 0.2.

Se guardan desbloqueos, victorias y marcas por nivel, récord de Infinito y hasta 31 registros diarios. No se implementó una racha diaria: volver después de una ausencia no elimina progreso. Borrar progreso requiere confirmación y elimina también los datos antiguos para impedir que reaparezcan como respaldo.

## 8. Archivos relevantes

| Archivo | Función |
| --- | --- |
| `src/engine.ts` | Game, movimiento, pasos fijos, colisiones, escudos, resultados y reordenamiento tras contragiro. |
| `src/config.ts` | Modos, mundos, geometrías, órbitas, campaña, reto diario y coste de dificultad. |
| `src/generator.ts` | Catálogo de patrones y restricciones de encuentros. |
| `src/geometry.ts` | Curvas compartidas por dibujo y movimiento, interpolación de carriles y cruces. |
| `src/random.ts` | PRNG, hash de semillas y versión de generación. |
| `src/progression.ts` | Requisitos de niveles, fragmentos, bonificaciones, récords y registros diarios. |
| `src/storage.ts` | Formato v2, migración, normalización, respaldo y borrado. |
| `src/main.ts` | Menús existentes ampliados, campaña, tutorial jugable, HUD y ciclo de vida. |
| `src/art.ts`, `src/redesign.css` | Cachés de Canvas, curvas, fracturas y controles adaptables, conservando el estilo previo. |
| `tests/redesign.test.ts`, `tests/performance.test.ts` | Nuevas pruebas deterministas, migración, progresión y límites de objetos. |
| `tests/engine.test.ts`, `tests/storage.test.ts` | Se conservan las 15 pruebas originales. |
| `scripts/qa.mjs`, `scripts/qa-extra.mjs` | Recorridos de navegador, tutorial, todos los modos, cinco mundos, offline y migración real. |
| `scripts/balance.ts` | Controlador automatizado para comprobar rutas completables en campaña y retos diarios; no simula habilidad humana. |
| `android/app/build.gradle`, proyecto Xcode | Versión de aplicación y número de compilación actualizados para 0.2. |

`audio.ts` y las dependencias nativas se reutilizan. La configuración de superficie, atmósfera y satélites deja puntos de extensión para 0.3; todavía no existe un editor ni un sistema de piezas.

## 9. Validación

Los resultados exactos de los comandos y del empaquetado se registran en `VALIDACION-0.2.md`. Las capturas e informes de navegador se entregan en `capturas-0.2/`. La validación distingue entre simulación, navegador y binario Android; no presenta las pruebas de Chromium como pruebas en un teléfono real.

## 10. Límites y trabajo posterior

- Pendiente probar el APK en teléfonos físicos Android, especialmente de gama baja: latencia táctil, vibración, batería, navegación del sistema y tiempo de fotograma.
- Pendiente validar dificultad, disfrute y valor percibido con personas. Un controlador automático puede completar rutas, pero no mide diversión ni disposición a pagar $88 MXN.
- El reto diario usa la fecha local y permite modificarla. No hay recompensas financieras ni clasificación online que justifiquen un sistema antitrampas.
- Infinito converge a un techo de velocidad por legibilidad; después del techo la variación se mantiene mediante patrones. No es una aceleración ilimitada.
- El guardado de una partida de campaña se liquida al terminar; cerrar el proceso a mitad de ella pierde ese intento. Calma conserva los fragmentos de sus minutos ya guardados.
- iOS se entrega generado y sincronizado. Compilación y pruebas de distribución iOS requieren Mac/Xcode.
- La ficha comercial, precio, cuenta de desarrollador y firma de publicación aún no están configurados. El APK de prueba no es una publicación en Google Play.
- Forja Planetaria, editor, rarezas, códigos compartibles, fantasmas y sistemas online permanecen fuera de 0.2. Tampoco se añadieron anuncios ni microtransacciones.
