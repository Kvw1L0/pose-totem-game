// Gestor de detección de posturas multi-persona con MediaPipe Tasks-Vision (PoseLandmarker)
// Soporte 1P, 2P y 3P para activaciones BTL en pantalla gigante
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class PoseDetector {
  constructor(maxPoses = 3) {
    this.maxPoses = maxPoses;
    this.poseLandmarker = null;
    this.isReady = false;
    this.onResultsCallback = null;
    this.animationFrameId = null;
    this.isProcessing = false;
    this.lastVideoTime = -1;
  }

  /**
   * Inicializa PoseLandmarker con soporte para hasta 3 personas simultáneas (numPoses: 3)
   * Prioriza archivos locales (/wasm y /models) para operación 100% offline en BTL.
   */
  async initialize(onResults, maxPoses = this.maxPoses) {
    this.maxPoses = maxPoses;
    this.onResultsCallback = onResults;

    const localWasmPath = '/wasm';
    const remoteWasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
    const localModelPath = '/models/pose_landmarker_lite.task';
    const remoteModelPath = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

    // 1. Intentar cargar con WASM local y GPU
    try {
      console.log('Intentando inicializar MediaPipe offline (local)...');
      const vision = await FilesetResolver.forVisionTasks(localWasmPath);
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: localModelPath,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: this.maxPoses,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isReady = true;
      console.log(`MediaPipe PoseLandmarker (Multi-Pose ${this.maxPoses}P - Offline GPU) listo.`);
      return this;
    } catch (localErr) {
      console.warn('Fallo inicialización local, intentando CDN remoto...', localErr);
      
      try {
        const visionRemote = await FilesetResolver.forVisionTasks(remoteWasmPath);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(visionRemote, {
          baseOptions: {
            modelAssetPath: remoteModelPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: this.maxPoses,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.isReady = true;
        console.log(`MediaPipe PoseLandmarker (Multi-Pose ${this.maxPoses}P - Online GPU) listo.`);
        return this;
      } catch (gpuErr) {
        console.warn('Error con GPU, intentando fallback CPU...', gpuErr);
        try {
          const visionCpu = await FilesetResolver.forVisionTasks(localWasmPath).catch(() =>
            FilesetResolver.forVisionTasks(remoteWasmPath)
          );
          this.poseLandmarker = await PoseLandmarker.createFromOptions(visionCpu, {
            baseOptions: {
              modelAssetPath: localModelPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numPoses: this.maxPoses
          });
          this.isReady = true;
          return this;
        } catch (cpuErr) {
          console.error('Fallo crítico al inicializar MediaPipe:', cpuErr);
          throw cpuErr;
        }
      }
    }
  }

  /**
   * Inicia el bucle de envío continuo de fotogramas del video
   */
  start(videoElement) {
    if (!this.poseLandmarker || !videoElement) return;

    const processFrame = () => {
      if (videoElement.readyState >= 2 && !this.isProcessing) {
        if (videoElement.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = videoElement.currentTime;
          const startTimeMs = performance.now();
          
          try {
            const results = this.poseLandmarker.detectForVideo(videoElement, startTimeMs);
            if (this.onResultsCallback) {
              this.onResultsCallback(results);
            }
          } catch (e) {
            // Ignorar frames intermedios
          }
        }
      }
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  /**
   * Detiene el bucle de procesamiento
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isProcessing = false;
  }
}
