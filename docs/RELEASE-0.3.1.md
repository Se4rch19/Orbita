# Órbita 0.3.1 — Informe de versión

## 1. Controles

Distancia final al planeta menos distancia inicial: al superar 18 píxeles CSS, OUT si aumenta, IN si disminuye. Umbral independiente de la densidad física. Un puntero capturado, una activación al terminar, cancelación segura y rechazo de microgestos/tangentes. Cada movimiento es adyacente con máximo tres caminos. Cooldown de 85 ms; interpolación hasta aproximadamente el 98% en 120 ms; simulación a 120 Hz. Toque clásico: centro para entrar, periferia para salir. Los extremos no se conectan.

## 2. Dificultad

Mayor intensidad por mundo/nivel, aceleración y frecuencia de cambios entre carriles. Velocidad limitada a 2,8 rad/s. Separación calculada con velocidad máxima de la sesión: 0,72 s al empezar y al menos 0,56 s avanzado, más margen para fracturas. Presupuesto: 85 ms de input, 120 ms de transición, 100 ms de latencia y 200 ms de observación. No exige saltos de dos carriles entre puertas consecutivas. Calma/entrenamiento mantienen menor presión. Son salvaguardas de ingeniería, no una garantía de accesibilidad para toda persona ni validación clínica.

## 3. Asistencia

OFF inicial. Halo discreto para peligros a menos de 0,9 s y anticipación de contragiro; ausentes en modo normal. Preferencia capturada al empezar la sesión, visible en HUD/resultado. Constante configurable `ASSIST_FRAGMENT_MULTIPLIER = 0.5`; cada recompensa/bono se redondea hacia abajo, incluyendo checkpoints de Calma e hitos. Puntuación sin descuento, récord asistido interno y marca de uso; los récords generales siguen compartidos y locales.

## 4. Del día

Señal, Estelar y Cósmica. Mundo, nivel, modificador, duración (45/60/75 s) y metas son deterministas por fecha; cambia la semilla de ejecución entre intentos. El presupuesto de luces considera velocidad media, separación de encuentros, número de caminos, fracturas y pérdidas por contragiros. Metas al 55/73/90% del presupuesto estimado. Un factor calibrado de Eclipse evita metas inalcanzables por cambios de dirección. Piloto: 30 fechas × 10 semillas; en todas las fechas alcanzó Cósmica al menos una vez. Ejemplo 2026-09-09: Glaciar, 75 s, 43/57/71 luces. Guarda intentos, máxima categoría y puntuación, conservando registros previos de completado.

## 5. Infinito

50 s por sección, seguidos por 3 s sin peligros y cuenta atrás. Menta → Durazno → Lavanda → Glaciar → Eclipse → Anomalías procedurales con perfiles validados. Continúan tiempo, puntos y escudos; se reinicia la cadena. Aparecen obstáculos nuevos con distancia segura. La dificultad posterior crece con límite. Mi Órbita mantiene el perfil y récord personales. Abandonar no liquida una partida infinita; la derrota normal sí.

## 6. Música

Síntesis original sin muestras ni recursos externos. Menta: pentatónica luminosa, 76 BPM; Durazno: pulso juguetón, 100; Lavanda: ambiente flotante, 82; Glaciar: notas cristalinas, 68; Eclipse: graves y tensión, 108. Pad, pulso, arpegio, cadena y capa intensa dependen de la partida. Recogidas afinadas en la escala del mundo, registro superior con cadena. Las capas no reinician continuamente la frase; fundido entre mundos, silencio en pausa y compresión de mezcla. Límite de 24 voces transitorias; tres pads estables. La prueba física observó hasta seis voces transitorias. Música, efectos y vibración independientes. Sin archivos musicales añadidos; diferencia total de APK en el manifiesto de entrega.

## 7. UX móvil

JUGAR / FORJA / BITÁCORA. Continuación de campaña arriba y cuatro tarjetas de modos. Entrenamiento bajo los modos, fuera de Ajustes. Códigos con regreso visible. Anomalías desde campaña tras las 15 expediciones. Se eliminan lanzamiento redundante de Infinito, segunda Forja y confirmación obligatoria de descubrimientos. Punto de novedad y aviso compacto hacia Colección. Ajustes agrupa audio, respuesta, controles, asistencia y datos. Bitácora añade destinos, supervivencia y retos recientes. Validado a 320, 390 y 1440 px y en WebView físico.

## 8. Respaldo

Migración del v3 web sin borrar progreso. SharedPreferences `orbita_progress`: copia actual/anterior, escritura mediante commit y cola ordenada. Al arrancar valida la copia nativa, recurre a la anterior o al v3 web. Payload normalizado: datos persistentes, sin simulación, timers, AudioContext o buffers. `allowBackup`, `fullBackupContent` y `dataExtractionRules` incluyen solo `orbita_progress.xml`, excluyendo cachés/WebView por lista de inclusión. Copia de nube requiere capacidad de cifrado. Disponibilidad depende del transporte y ajustes Android. [Documentación oficial](https://developer.android.com/identity/data/autobackup).

Se validaron actualización desde 0.3, planeta conservado y guardado nativo. No se borraron datos, cambiaron cuentas ni ajustes del teléfono. La restauración real de nube/otro dispositivo no se certifica. Una partida activa interrumpida no se restaura; se conserva progreso ya asentado.

## 9. Validación física

Redmi reconocido por ADB como device. Se instaló 0.3, se creó un planeta de prueba y se actualizó usando install -r. Operaciones limitadas a `com.orbita.minigame`. Gestos ADB en dos/tres carriles, límites y secuencia rápida; Atrás pausa/reanuda; modos, Forja, códigos y preferencias.

Infinito real: 360,08 s, seis transiciones, 11 020 puntos y tres escudos; entró en dos secciones de Anomalías. Piloto mediante entradas reales, sin inyectar vida, tiempo ni puntuación. En Durazno, 300 frames: mediana 16,4 ms, p95 16,5 ms, cero sobre 33 ms. Muestras bajo depuración, no garantía para otros teléfonos. WebAudio con efectos desactivados: RMS 0,00795 reproduciendo, 0 al pausar y señal de nuevo al reanudar. No certifica volumen del altavoz ni evaluación auditiva humana. Métricas y evidencia adicionales están en los JSON y capturas de validation.

## 10. Limpieza

Raíz canónica de código: Orbita. El repositorio y ZIP publicados contienen src, tests, scripts, android, ios, public y documentación actual. La base 0.3 quedó en Git antes de modificarla. Los scripts/documentos históricos se retiraron del índice de Git; siguen recuperables en v0.3.0. La revisión automática rechazó el borrado por lote y el individual de la entrega antigua con el único motivo «blocked by policy». Por eso las antiguas entregas/copias locales permanecen en disco y la limpieza física está pendiente. No se simula una liberación de espacio. Se mantienen SDK, Gradle y dependencias necesarios. Detalle: validation/cleanup.json.

## 11. Git / GitHub

Repositorio exacto: https://github.com/Se4rch19/Orbita.git. Base 59a95dd, etiqueta v0.3.0. Rama release/orbita-0.3.1, integración normal a main y etiqueta v0.3.1, sin force push. No se incluyen credenciales, firmas, APK/AAB, node_modules ni configuración local. Los SHA y resultado remoto verificables quedan en validation/git-release.txt de la entrega.

## 12. Verificación

Typecheck y formato correctos; 89/89 tests (70 anteriores intactos + 19). Estrés de 2 000 sesiones / 200 000 puertas sin invariantes fallidas. Navegador: 9 grupos de regresión y 13 de Forja/códigos/offline, cero errores JS y peticiones externas. Piloto adicional de 450 partidas de campaña y 300 diarias: resultados completos en JSON. Build web, sincronización Android, APK debug y bundle release correctos. Pruebas físicas y reinicio documentados por separado en la evidencia de entrega.

## 13. Entrega

outputs/Orbita-0.3.1: APK debug, AAB sin firma, ZIP de código del tag final, EMPIEZA-AQUI.md, docs, validation y hashes SHA-256. ZIP sin dependencias ni configuración local. Vista previa local en puerto 4173. Una sola raíz de código mantenible fuera de la carpeta de artefactos.

## 14. Límites pendientes

Limpieza física de copias antiguas bloqueada por revisión automática. Falta firma comercial y validación de distribución Play Store; el AAB está sin firmar. iOS no compilado/probado en Windows. Restauración de nube/otro dispositivo pendiente. Música verificada por generación de señal, no por escucha humana. Se necesita playtesting humano adicional para dificultad, gusto y retención; no se prometen efectos biológicos ni ingresos.
