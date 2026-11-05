# ⚡ Mirror Match - Duelo de Poses BTL (Soporte 1P, 2P y 3P)

Juego arcade interactivo y sin contacto (*touchless*) optimizado para **pantallas gigantes BTL (16:9)** y tótems interactivos con cámara web gran angular.

La experiencia permite competir simultáneamente a **3 Jugadores** (o 1P y 2P) en un duelo en tiempo real. Utiliza Inteligencia Artificial local (**Google MediaPipe Pose Landmarker**) con aceleración GPU para comparar ángulos corporales (codos, hombros, rodillas) a 30 FPS. El primer jugador en sostener la pose correcta gana el punto de la ronda. Al finalizar, genera automáticamente una **fotografía de recuerdo en alta resolución (1080×1440) con los 3 esqueletos, el podio final y un código QR**.

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Iniciar en Modo Desarrollo

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm run dev
```

Esto levantará el servidor en `http://localhost:3000`.

### 2. Compilar para Producción (100% Offline)

```bash
npm run build
npm run preview
```

> **Nota BTL Offline:** Los binarios WebAssembly de MediaPipe y el modelo de IA (`pose_landmarker_lite.task`) están empaquetados en la carpeta `/public` del proyecto, garantizando que el juego funcione **sin conexión a internet** durante eventos.

---

## 👥 Modos de Juego Soportados

1. **👑 3 Jugadores (Trío BTL - Predeterminado):**
   - **Carril Izquierdo (P1):** Azul / Cian (`#00f0ff`).
   - **Carril Central (P2):** Amarillo Neón (`#ffea00`).
   - **Carril Derecho (P3):** Rosa / Magenta (`#ff007f`).
   - Visores y líneas láser divisorias en pantalla.
   - Anillos de progreso y medidores de precisión independientes en el footer.

2. **⚔️ 2 Jugadores (Batalla VS):**
   - Duelo cara a cara entre Jugador 1 (Izquierda) y Jugador 2 (Derecha).

3. **👤 1 Jugador (Solitario):**
   - Reto individual con visor central y calibración para un solo participante.

---

## 🖥️ Lanzamiento en Modo Kiosco (Pantalla Completa en Windows)

Para ejecutar la activación BTL en pantalla gigante sin bordes de navegador ni menús del sistema:

* Ejecuta directamente el script incluido:
  ```cmd
  start_kiosk.bat
  ```
* O mediante la línea de comandos de Google Chrome:
  ```powershell
  start chrome.exe --kiosk --kiosk-printing --disable-pinch --overscroll-history-navigation=0 "http://localhost:3000"
  ```

---

## 🎯 Mejoras Técnicas Implementadas para BTL
* **Soporte `numPoses: 3` en GPU:** MediaPipe procesa hasta 3 personas simultáneas.
* **Filtro Anti-Espectadores:** Descarta siluetas lejanas en segundo plano para evitar que transeúntes interfieran en el juego.
* **Diseño Widescreen 16:9:** El lienzo y los elementos del HUD se adaptan a pantallas LED de gran formato.
* **Audio Polifónico Sintetizado:** Timbres de sonido independientes y ascendentes para cada jugador durante la retención de la pose.
* **Tarjeta de Podio 3P:** Fotografía con los 3 participantes, corona sobre el ganador y desglose de puntajes.
