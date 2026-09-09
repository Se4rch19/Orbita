# Distribución de Órbita 0.3

Esta entrega implementa el producto offline. No configura precio, estrategia de monetización, anuncios, compras internas ni publicación.

## Estado actual

- ID Android conservado: `com.orbita.minigame`.
- Versión 0.3.0, código Android 3; mínimo API 24 y objetivo API 36.
- APK de prueba firmado con el certificado de depuración anterior.
- AAB compilado sin firma de publicación.
- INTERNET retirado; assets incluidos, sin `server.url` ni servicios remotos.
- iOS actualizado y sincronizado; no compilado en este equipo Windows.

Para entregar a una tienda aún hacen falta cuenta del titular, identidad final de la aplicación, firma de distribución, ficha, política de privacidad con responsable/contacto y las comprobaciones exigidas por la tienda al publicar. No se han creado cuentas, claves de producción ni fichas remotas.

## Validación antes de distribuir

Instalar primero en Android físico y comprobar arranque sin INTERNET, modo avión, actualizaciones desde 0.2 sin desinstalar, guardados v3, audio, vibración, botón Atrás, pausa, interrupciones y escalas de pantalla/fuente. Medir rendimiento en móviles modestos y probar la progresión con personas. Las capturas incluidas provienen de Chromium; preparar capturas del binario final cuando se valide en dispositivo.

En el proyecto Android, la compilación comprobada es `gradlew.bat assembleDebug bundleRelease`. Configurar firma de publicación fuera del código compartido y custodiar las claves. La compilación y firma iOS requieren un entorno Mac/Xcode y cuenta del titular.

## Descripción de producto para futuras fichas

Órbita es un pequeño universo de reflejos y creación. Recorre cinco mundos con caminos diferentes, recoge luz y descubre piezas para crear tus propios planetas. Juega una campaña de 15 expediciones, descansa en Calma, acepta un desafío diario o viaja en Infinito. Construye tu planeta en la Forja y juega alrededor de él en Mi órbita. Comparte retos mediante códigos de texto que funcionan sin servidor. Tras dominar la campaña, explora las Anomalías.

Tu progreso permanece en el dispositivo. Sin cuentas, anuncios ni compras dentro del juego. Todo el contenido necesario viaja dentro de la aplicación.
