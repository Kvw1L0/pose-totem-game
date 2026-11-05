// Gestión de la cámara web, modo espejo y selección de dispositivos

export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.currentDeviceId = null;
  }

  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch (err) {
      console.error('Error enumerando dispositivos de video:', err);
      return [];
    }
  }

  async startCamera(deviceId = null) {
    if (this.stream) {
      this.stopCamera();
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    };

    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.currentDeviceId = deviceId;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve(this.video);
        };
      });
    } catch (err) {
      console.error('Error al inicializar cámara:', err);
      throw err;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }
}
