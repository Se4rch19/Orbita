# ÓRBITA 0.4.2 — Planet Renderer 2.0 y acabado móvil

Informe de cierre para la rama `release/orbita-0.4.2`, validada en el Redmi K50 físico. Esta entrega conserva la jugabilidad, el guardado, la oclusión orbital y los límites de 0.4.1; añade una capa de renderer 2.0 y mejoras de UX orientadas a una experiencia comercial.

## Auditoría de referencias

Se inspeccionaron visualmente las seis referencias planetarias recibidas (tres WebP y tres JPG): `codex-clipboard-5678e0fb-80f6-48d0-9d9f-939e8d72780e.webp`, `codex-clipboard-c56a2d36-7d34-400d-991f-1edda9ef594a.webp`, `codex-clipboard-13c52184-4018-4ab5-812a-e99db7d7dcd3.webp`, `codex-clipboard-7062b223-95ee-49da-b249-d89ff4392af9.webp`, `codex-clipboard-2c116fa5-4274-4064-a381-6bfcc596dc12.jpg` y `codex-clipboard-17478a4b-273d-4af4-b88d-110621b38820.jpg`. Muestran, respectivamente, volumen oceánico con continentes curvados y nubes; un mundo dañado rodeado de anillos, rocas y escombros; una esfera cristalina con geometría orbital energética; un planeta volcánico con fisuras emisivas y estrella anfitriona; un mundo artificial con placas y estructuras; y una lámina de arquetipos estilizados con lava, anillos, hielo, cráteres, océano y organismos.

Los principios extraídos fueron: iluminación desde una dirección reconocible, terminador que comunica volumen, materiales identificables por respuesta de luz además de color, siluetas imperfectas, daño/fractura con límites, orbitales con escala y profundidad, atmósferas selectivas, contraste suficiente para leer la superficie y una densidad visual controlada. Son referencias de dirección artística; no se copiaron texturas, logos, planetas reconocibles ni composición de una obra concreta. No se entregó una imagen obligatoria de menú o intro; ambas se resolvieron desde la especificación escrita.

## Cambios implementados

1. **Bloqueo de interacción WebView.** `interaction-lock.ts` cancela selección, menú contextual, arrastre, copia y corte sobre el chrome del juego, canvas, HUD, botones, navegación, Forja y etiquetas. Los `input`, `textarea` y elementos `contenteditable` conservan selección, cursor y pegado. CSS añade `user-select`, `touch-callout` y `user-drag` coherentes con la interacción de juego.

2. **Controles preservados.** La lectura sigue siendo pantalla-relativa: derecha/arriba salen y izquierda/abajo entran, con un solo carril adyacente por gesto, sin retorno circular. No se cambió el algoritmo exitoso de 0.4.1.

3. **Planet Renderer 2.0.** `planet-renderer-2.ts` aporta familias de material (rock, ocean, ice, lava, crystal, dust, metallic y gas), arquetipos (living, volcanic, glacial, crystalline, dead, fragmented, artificial, gas e hybrid), luz direccional normalizada y validación de perfiles. `living-world.ts` mantiene la proyección por longitud: las manchas se comprimen al acercarse al limbo y se desplazan mientras la iluminación permanece fija. Esto crea ilusión de rotación superficial en vez de girar un disco completo.

4. **Luz y materiales.** La esfera usa un gradiente orientado por `lightDirection`, terminador y sombra independiente del giro. Océano recibe respuesta especular y reflejos móviles; hielo tiene trazos de fractura y brillo de borde; lava usa fisuras y pulso emisivo localizado; cristal usa facetas y brillo; polvo/roca usan cráteres y rugosidad; Forja puede representar opciones metálicas mediante perfiles compatibles.

5. **Nubes y tormenta.** Las nubes se desplazan con `cloudSpeed` separado de la superficie. El ojo de huracán ahora es un centro, pared y brazos curvos que rotan dentro de la capa de nubes, con cuatro anillos acotados. La decoración respeta los presupuestos de calidad.

6. **Arquetipos y mundos héroe.** Las cinco identidades curadas siguen siendo Menta (oceánica viva), Durazno (polvo/geología cálida), Lavanda (cristal alienígena), Glaciar (hielo/aurora) y Eclipse (daño, fisuras y restos). Eclipse usa el arquetipo fragmentado/dead sin convertirse en una esfera negra vacía. Anomalías y diseños personales usan la misma gramática con semillas distintas.

7. **Profundidad orbital.** Se conserva la corrección 0.4.1 de pasadas trasera/delantera: anillos, lunas, asteroides y muestras de estela se clasifican por profundidad, y la silueta opaca queda entre ambas pasadas. No hay objetos decorativos atravesando la superficie.

8. **Espacio e intro.** La intro usa `IntroUniverseProfile` y `drawIntroUniverse`: estrellas a varias profundidades, cinco cuerpos originales de escala variada, anillos, fondo profundo y el viajero trazando un arco. Ya no presenta a Menta como la identidad del universo. El tiempo configurado continúa siendo 4 s la primera vez, 2.1 s en repetición, salto desde 1 s y límite de seguridad de 5 s.

9. **Pantalla de mundos.** El planeta sigue siendo el foco principal. Se añadió un panel contextual encima de JUGAR que cambia inmediatamente al elegir Expedición, Calma, Del Día o Infinito. Expedición muestra mundo, etapa y progreso; Calma muestra sus tres duraciones; Del Día muestra mundo, duración y modificador reales; Infinito muestra récord y mundos recorridos. Los bloqueados permanecen visibles con requisito.

10. **Iconografía.** El icono de Ajustes se sustituyó por un engranaje vectorial original con dientes y centro reconocibles, manteniendo área táctil y posición segura.

11. **Forja compartida.** Inicio, Forja, intro y juego siguen alimentados por el mismo `drawLivingWorld` cuando el perfil es compatible. La previsualización de Forja mantiene fondo opaco, rotación manual y opciones de solo lectura sin modificar inventario o guardado.

12. **Calidad resuelta.** Ajustes muestra el nivel efectivo cuando Auto está seleccionado. Se preservan Auto/Baja/Media/Alta y los presupuestos de 0.4.1; la calidad solo cambia decoración, nunca controles, colisiones, dificultad, puntuación o tiempo de simulación.

13. **Feedback de juego.** Se conservan partículas acotadas, respuesta háptica y señales de música existentes para recogida, cambio de órbita, combo, escudo, daño, pausa y final. No se añadió vibración excesiva, pantalla inestable ni una nueva banda sonora.

14. **Localización.** Las claves nuevas de paneles de modo, calidad resuelta e intro están en `es-MX` y `en-US`. La suite comprueba paridad de claves y variables y no deja claves crudas visibles.

15. **Guardado.** La migración de 0.4.1 no cambia el esquema de progreso. La APK se instaló con `adb install -r`; no se borró almacenamiento. El estado físico mantuvo récords, inventario, planetas personalizados, preferencias, historial y códigos.

16. **Rendimiento físico.** En el Redmi K50 se verificaron intro, inicio, Forja, cinco mundos, Eclipse, Infinito y la oclusión corregida. La medición final de 0.4.1/0.4.2 conserva medianas de 16.4–16.5 ms y P95 de 16.5–16.6 ms; hubo un cuadro aislado superior a 33.4 ms en Menta jugable. La muestra de 30 s de Menta con oclusión no tuvo cuadros superiores a 33.4 ms. Memoria final archivada: PSS 165,463 KB, RSS 336,316 KB y swap 133 KB. Esto es una muestra de laboratorio, no certificación térmica.

17. **Pruebas.** La suite heredada permanece en 131/131 y con las tres pruebas 0.4.2 de renderer, panel contextual y bloqueo queda en **134/134**. Las regresiones de navegador, Forja, identidad y pulido pasan en español e inglés. El estrés previo conserva 2,000 sesiones y 219,705 segundos simulados. En hardware se completaron 203 gestos, 32 combinaciones de control, arranque en frío, bordes de Android y la matriz visual de Forja.

18. **Compilación Android.** `versionName` 0.4.2, `versionCode` 7, paquete `com.orbita.minigame`, minSdk 24 y targetSdk 36. `assembleDebug bundleRelease` terminó correctamente. El APK debug tiene firma verificable. El AAB de entrega no tiene firma comercial ni entradas de firma `META-INF`.

19. **Git y entrega.** El trabajo parte de tag `v0.4.1` en `main` y usa `release/orbita-0.4.2`. Después de la validación se integrará con merge normal en `main`, se creará `v0.4.2` y se publicarán rama principal y tag en el remoto canónico sin force push. El manifiesto externo de entrega registrará los SHA y hashes finales.

20. **Límites reales.** No se integró Music Lab, no se añadieron anuncios ni microtransacciones, no se publicó en una tienda y no se compiló iOS en Windows. No se copian las seis referencias en los recursos de producción. La validación prolongada de temperatura/batería en otros teléfonos queda para QA de dispositivos posterior.
