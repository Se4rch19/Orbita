# Órbita: diseño y evidencia

Documento histórico del diseño inicial. Las referencias de investigación se conservan; las reglas actuales están en [REDISENO-0.2.md](REDISENO-0.2.md).

Versión 1.0 · 8 de septiembre de 2026

## Idea

Un juego de precisión de un dedo. Un viajero gira automáticamente alrededor de un pequeño planeta. Un toque cambia entre dos órbitas. Recoger diamantes dorados suma puntos y luz; los fragmentos coral dañan los escudos. Cada expedición dura hasta un minuto. La luz acumulada descubre cinco mundos cosméticos.

La promesa es «un minuto para encontrar tu ritmo». Público inicial propuesto: personas que disfrutan juegos casuales de habilidad y estética tranquila. No se ha validado un segmento comercial todavía. El nombre es provisional y su disponibilidad comercial no se ha investigado.

## Cómo se tradujo la investigación

| Evidencia o marco                                                                                              | Decisión de diseño                                                                                    | Qué falta validar                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| La teoría de autodeterminación relaciona disfrute de videojuegos con competencia, autonomía y relación social. | Un control sencillo, feedback inmediato, récord personal y elección entre dificultad gradual y Calma. | Si las personas entienden el control y sienten mejora. La relación social no se implementa en esta versión. |
| La investigación sobre señales dopaminérgicas describe su relación con errores de predicción y aprendizaje.    | Hacer legible la relación acción–resultado: diamante recogido, nota breve, puntos visibles y cadena.  | Es una interpretación de diseño; no es una intervención biológica ni demuestra mayor retención.             |
| Revisiones de HCI advierten contra usar la autodeterminación como explicación universal del atractivo.         | Tratar todo lo anterior como hipótesis y observar partidas reales.                                    | Comparar conducta observada, satisfacción y motivos para abandonar.                                         |

No se mide dopamina ni se pretende producir adicción clínica. La evidencia biológica proviene de paradigmas de investigación y no permite concluir que este juego active una cantidad particular de dopamina, mejore la salud o genere ingresos. No se ofrecen promesas médicas.

Fuentes consultadas:

- Przybylski, Rigby y Ryan (2010), [A Motivational Model of Video Game Engagement](https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf).
- Schultz, Dayan y Montague (1997), [A neural substrate of prediction and reward](https://pubmed.ncbi.nlm.nih.gov/9054347/).
- Schultz (2016), [Dopamine reward prediction error coding](https://pubmed.ncbi.nlm.nih.gov/27069377/).
- [Self-Determination Theory and HCI Games Research: Unfulfilled Promises and Unquestioned Paradigms](https://arxiv.org/abs/2405.12639) (2024).

## Reglas implementadas

- Expedición: 60 segundos, tres escudos, velocidad de 1.15 a 1.95 radianes por segundo.
- Calma: 60 segundos, velocidad de 1.05 radianes por segundo; impactos rompen la cadena pero no quitan escudos. Su puntuación no compite con el récord de Expedición.
- Señal del día: misma semilla según la fecha local del inicio. Intentos ilimitados, sin clasificación online. Cambiar el reloj cambia la ruta; no se presenta como competición segura.
- Una luz suma 10 × multiplicador. Se empieza en ×1 y se sube cada cinco luces recogidas, hasta ×4. La sexta luz es la primera que puntúa ×2.
- Una luz perdida rompe la cadena sin quitar vidas. Un impacto rompe la cadena y da un segundo de protección.
- Cambio de órbita interpolado, con una separación mínima de 130 ms entre cambios.
- Menta disponible al inicio; Durazno a 80 luces, Lavanda a 200, Glaciar a 400 y Eclipse a 700. No se gastan las luces.
- Los cinco mundos tienen idénticas reglas. Los desbloqueos son deterministas.
- Se guarda el resultado al completar o perder una partida. Abandonar desde pausa descarta ese viaje y lo explica antes de salir.
- Pausa manual, al pasar a segundo plano y al ocultar la pestaña. Sin penalización por ausentarse.

## Identidad y producción

Paleta nocturna, menta, dorado y coral. Diamantes, fragmentos marcados con una cruz y un viajero circular permiten distinguir objetos por su forma además del color. Planetas y partículas dibujados con Canvas; interfaz con tipografías del sistema; sonido sintetizado con Web Audio. No hay imágenes, música, fuentes ni servicios externos cargados durante una partida.

La opción de reducir animaciones elimina partículas y variaciones ambientales. El movimiento orbital permanece porque constituye el juego. Los menús son accesibles mediante teclado; el juego depende de percepción visual y reflejos y no ofrece una alternativa no visual completa.

## Prueba con personas: siguiente decisión de producto

Primera ronda propuesta: 8–12 personas, 10 minutos cada una. Registrar manualmente, con su consentimiento: si comprenden el control sin ayuda, tiempo hasta la primera luz, causa de la primera derrota, puntuación de disfrute de 1 a 5 y si deciden repetir. Preguntar qué les hizo parar; no inducir respuestas positivas.

Criterios internos propuestos (no benchmarks de industria): al menos 8 de 10 comprenden el control en un minuto; mediana de disfrute de al menos 4/5; no más de 2 de 10 atribuyen la derrota a un control confuso. Si falla el aprendizaje, mejorar tutorial y anticipación antes de añadir contenido.

En una beta posterior observar retorno voluntario al día siguiente, estabilidad en teléfonos modestos y satisfacción tras varias sesiones. No se ha instalado analítica ni se han recogido datos de jugadores reales.

## Monetización futura, sin implementar

La base técnica separa el catálogo de mundos (`src/storage.ts`) del motor (`src/engine.ts`). Se pueden añadir paquetes de apariencia, nuevos ambientes y bandas sonoras sin modificar la dificultad. Ningún sistema de pagos, anuncios, compra simulada, servidor o validación de recibos está presente.

Si las pruebas muestran demanda, evaluar un paquete cosmético de compra única. Antes de cobrar será necesario integrar las compras de las tiendas, restauración, validación de derechos y reembolsos, y probar todo en sandbox. El guardado local actual no es una fuente segura para derechos de pago.

Evitar vender escudos, probabilidades, cajas aleatorias o acceso a puntuaciones superiores. La estrategia comercial debe apoyarse en valor adicional que la gente quiera, no en obstaculizar el juego gratuito. Ingresos, coste de adquisición y conversión siguen sin validar.
