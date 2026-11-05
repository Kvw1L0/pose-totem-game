// Audio Engine using Web Audio API (procedural synth sound effects - Soporte 1P, 2P y 3P Batalla)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Campana de boxeo / Inicio de Batalla
  playBoxingBell() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    [1046.5, 1318.5].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    });
  }

  // Beep para cuenta regresiva (3, 2, 1)
  playCountdown(pitch = 440) {
    if (this.muted) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Chime cuando termina el conteo ("¡A PELEAR!")
  playStartChime() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.45);
    });
  }

  // Sonido de progreso de Hold para Jugador 1 (Azul / Cian - Tono grave ascendente)
  playHoldProgressP1(progress) {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 300 + progress * 400; // 300Hz - 700Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.08);
  }

  // Sonido de progreso de Hold para Jugador 2 (Amarillo - Tono medio ascendente)
  playHoldProgressP2(progress) {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 520 + progress * 450; // 520Hz - 970Hz
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.08);
  }

  // Sonido de progreso de Hold para Jugador 3 (Rosa / Magenta - Tono agudo ascendente)
  playHoldProgressP3(progress) {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 750 + progress * 550; // 750Hz - 1300Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.08);
  }

  // Sonido cuando un jugador anota punto en la ronda
  playPointScore(playerNum = 1) {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    // Frecuencias base: P1 -> C5 (523Hz), P2 -> E5 (659Hz), P3 -> G5 (784Hz)
    let baseFreq = 523.25;
    let waveType = 'sine';
    if (playerNum === 2) {
      baseFreq = 659.25;
      waveType = 'triangle';
    } else if (playerNum === 3) {
      baseFreq = 783.99;
      waveType = 'triangle';
    }

    const chords = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.55);
    });
  }

  // Fanfarria de Victoria de Batalla
  playVictoryFanfare() {
    if (this.muted) return;
    this.init();

    const notes = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.5, d: 0.45 },
      { f: 880.0, d: 0.2 },
      { f: 1046.5, d: 0.6 }
    ];

    let t = this.ctx.currentTime;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.85;
    });
  }

  // Sonido de disparo fotográfico
  playCameraShutter() {
    if (this.muted) return;
    this.init();

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    noise.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }
}

export const soundEngine = new SoundEngine();
