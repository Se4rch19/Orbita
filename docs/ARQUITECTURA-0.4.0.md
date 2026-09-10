# Arquitectura 0.4.0

## Aparición hacia delante

El generador conserva una secuencia de puertas con carril seguro y separación compatible con movimientos adyacentes. Las entidades reservadas entran en `queued`: no se dibujan ni colisionan. La recogida de una luz no ejecuta una aparición. En cada paso de simulación se evalúa la distancia angular dirigida del viajero a las entidades pendientes.

Para luces, aproximadamente el 45% utiliza una anticipación adicional de 0,8–1,7 s: pequeños trayectos visibles. Las demás reciben 0–0,32 s adicionales, al igual que los peligros; Calma permite hasta 0,65 s. La anticipación final está limitada al semicírculo delantero. Así se mezclan luces presentes desde lejos con apariciones cercanas, en distintas órbitas, sin revelar una vuelta completa.

El umbral mínimo es `(velocidad prevista + 0,12) × (0,24 + reacción mínima + 0,14) + semiancho`. La velocidad prevista contempla todas las órbitas y el aumento de dificultad durante la ventana. Los 0,12 rad/s cubren el cierre angular de cometas. Se preserva la reacción mínima de la configuración (al menos 0,56 s en niveles avanzados). Seguridad y ancho de fractura tienen prioridad sobre la variación estética.

Al cruzar el umbral, `forming` dura 240 ms: alfa y tamaño crecen, y tres partículas decorativas convergen. Solo `active` colisiona. Una luz recogida se contrae; objetos pasados o invalidados se disuelven durante 320 ms. Una reserva que nunca fue visible se recicla sin destello. Los drifters empiezan su desplazamiento cuando aparecen, no cuando se reservan. Al cambiar de mundo, los objetos que se disuelven retienen su geometría anterior.

El pool limita a 64 objetos entre reservas, activos y disoluciones. Las partículas tienen un pool independiente con máximo de 80 activas. Las pruebas distinguen creación, aparición y colisión; comprueban que la aparición no cambia al recoger o perder una luz.

## Tutorial y guía

`Lesson` acepta una acción concreta por paso: continuar, salir, entrar, recoger, evitar, continuar, cadena de cinco, continuar. El tiempo se detiene en pasos explicativos y gestos de práctica; pausa/reanudación no omite ese bloqueo. Saltar una repetición conserva una finalización previa. Los premios de entrenamiento siguen siendo únicos.

`GUIDE_NAME` centraliza Luma. La ayuda de características y mundos queda registrada en `presentation.seen`. En un primer acceso se muestran hasta dos frases breves antes de jugar. Infinito detiene el inicio del nuevo mundo mientras se muestra su primera explicación; las siguientes visitas no interrumpen. La guía de mundos permite repasarlas.

## Persistencia e idiomas

La raíz sigue en v3 para conservar el contrato del respaldo Android. `presentation.version=1` añade idioma, tutorial, ayudas vistas, lanzamientos y piezas ambientales adquiridas. Los planetas añaden `biome`, `space` y `feature` opcionales; los diseños anteriores mantienen sus siete campos.

Los usuarios con partidas o entrenamiento previo se migran a `tutorial=legacy`, sin forzar una nueva introducción. `tests/fixtures/redmi-0.3.1.json` es un guardado real de desarrollo del Redmi, contrastado campo por campo. La migración no borra puntuaciones, planetas, inventario, ajustes ni códigos.

`i18n.ts` usa recursos es-MX/en-US. Sistema español selecciona es-MX; cualquier otro idioma selecciona en-US. El ajuste explícito prevalece. El cambio guarda y espera la escritura nativa antes de recargar la interfaz para actualizar también catálogos inicializados al importar. No necesita reinstalación. Los nombres propios de los cinco mundos se conservan. Una clave ausente falla en pruebas; las claves e interpolaciones se comparan en ambos sentidos.

Las cadenas de estructura HTML comparten claves generadas estables; añadir texto implica editar los dos JSON y usar `message`. Mantener el escape de nombres y códigos al interpolar. No regenerar automáticamente los catálogos, porque se perdería la traducción revisada.

## Android

Una sola Activity y `SplashScreen.installSplashScreen` antes de `super.onCreate`. `WindowCompat.setDecorFitsSystemWindows(false)` y `WindowInsetsControllerCompat` ocultan `systemBars`; `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` conserva la navegación del sistema. Se aplican insets de recorte y teclado al WebView. Al cerrar el teclado o recuperar foco se restaura la inmersión. Nunca se oculta el IME mientras se está escribiendo.

`ImmersionPlugin` permite comprobar insets y restaurar presentación. La visibilidad de insets no implica visibilidad de barras transitorias en MIUI: la prueba física verifica también sus píxeles antes y después del gesto. Implementación basada en [inmersión Android](https://developer.android.com/develop/ui/views/layout/immersive), [recortes de pantalla](https://developer.android.com/develop/ui/views/layout/display-cutout) y [SplashScreen](https://developer.android.com/develop/ui/views/launch/splash-screen).

## Presupuestos

62 estrellas; 80 partículas activas; hasta tres trazos de atmósfera; dos capas de superficie (base y característica elegida), con geometría fija de hasta ocho bandas y siete detalles; hasta tres satélites; 64 entidades. La iluminación base y la sombra no añaden objetos persistentes. El cuerpo del planeta se cachea. Desactivar animación congela capas decorativas, manteniendo el movimiento necesario del juego y la rotación manual de la Forja. El audio conserva 24 voces transitorias y tres pads; un filtro suave cambia el timbre por bioma.

Los códigos anteriores conservan sus reglas 2/3. Los nuevos códigos usan formato 5/reglas 4 e incluyen el sistema de aparición nuevo. No cambia la economía por compartir códigos.
