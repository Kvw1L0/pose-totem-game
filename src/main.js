// Orquestador Principal de Mirror Match - Soporte 1P, 2P y 3P Batalla BTL

import confetti from 'canvas-confetti';
import { CameraManager } from './camera.js';
import { PoseDetector } from './poseDetector.js';
import {
  extractPlayerAngles,
  comparePose,
  assignPlayersToLanes,
  isPlayerFramed
} from './poseComparator.js';
import { PoseRenderer } from './renderer.js';
import { POSES } from './poses.js';
import { soundEngine } from './audio.js';
import { ResultCardGenerator } from './qrShare.js';

const STATES = {
  ATTRACT: 'ATTRACT',
  CALIBRATING: 'CALIBRATING',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  ROUND_SUCCESS: 'ROUND_SUCCESS',
  ROUND_TIMEOUT: 'ROUND_TIMEOUT',
  RESULTS: 'RESULTS'
};

class MirrorMatchGame {
  constructor() {
    this.state = STATES.ATTRACT;
    this.mode = '3P'; // '3P' (Predeterminado BTL), 'VS' (2P) o 'SOLO' (1P)

    // Elementos DOM del escenario
    this.video = document.getElementById('webcam-video');
    this.canvas = document.getElementById('skeleton-canvas');
    this.flashLayer = document.getElementById('flash-layer');

    // Pantallas principales
    this.attractScreen = document.getElementById('attract-screen');
    this.hudLayer = document.getElementById('hud-layer');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');
    this.successBanner = document.getElementById('success-banner');
    this.successPts = document.getElementById('success-pts');
    this.resultsScreen = document.getElementById('results-screen');
    this.resultCardImg = document.getElementById('result-card-img');
    this.resultsTitle = document.getElementById('results-title');
    this.btnDownloadPhoto = document.getElementById('btn-download-photo');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnStartGame = document.getElementById('btn-start-game');

    // Botones de Selector de Modo (1P, 2P, 3P)
    this.modeSoloBtn = document.getElementById('mode-solo-btn');
    this.modeVsBtn = document.getElementById('mode-vs-btn');
    this.modeTrioBtn = document.getElementById('mode-trio-btn');

    // Elementos HUD Jugador 1 (Azul / Cian)
    this.p1HeaderCard = document.getElementById('p1-header-card');
    this.p1FooterLane = document.getElementById('p1-footer-lane');
    this.p1RoundsBadge = document.getElementById('p1-rounds-badge');
    this.p1ScoreNum = document.getElementById('p1-score-num');
    this.p1PercentText = document.getElementById('p1-percent-text');
    this.p1MeterFill = document.getElementById('p1-meter-fill');
    this.p1HoldProgress = document.getElementById('p1-hold-progress');
    this.p1HoldText = document.getElementById('p1-hold-text');

    // Elementos HUD Jugador 2 (Amarillo Neón)
    this.p2HeaderCard = document.getElementById('p2-header-card');
    this.p2FooterLane = document.getElementById('p2-footer-lane');
    this.p2RoundsBadge = document.getElementById('p2-rounds-badge');
    this.p2ScoreNum = document.getElementById('p2-score-num');
    this.p2PercentText = document.getElementById('p2-percent-text');
    this.p2MeterFill = document.getElementById('p2-meter-fill');
    this.p2HoldProgress = document.getElementById('p2-hold-progress');
    this.p2HoldText = document.getElementById('p2-hold-text');

    // Elementos HUD Jugador 3 (Rosa / Magenta)
    this.p3HeaderCard = document.getElementById('p3-header-card');
    this.p3FooterLane = document.getElementById('p3-footer-lane');
    this.p3RoundsBadge = document.getElementById('p3-rounds-badge');
    this.p3ScoreNum = document.getElementById('p3-score-num');
    this.p3PercentText = document.getElementById('p3-percent-text');
    this.p3MeterFill = document.getElementById('p3-meter-fill');
    this.p3HoldProgress = document.getElementById('p3-hold-progress');
    this.p3HoldText = document.getElementById('p3-hold-text');

    // HUD Central (Pose objetivo y temporizador)
    this.targetSilhouette = document.getElementById('target-silhouette');
    this.targetTitle = document.getElementById('target-title');
    this.targetDesc = document.getElementById('target-desc');
    this.targetDifficulty = document.getElementById('target-difficulty');
    this.hudTimer = document.getElementById('hud-timer');

    // Controles de Kiosco
    this.cameraSelect = document.getElementById('camera-select');
    this.btnSound = document.getElementById('btn-sound');
    this.btnFullscreen = document.getElementById('btn-fullscreen');

    // Módulos
    this.cameraManager = new CameraManager(this.video);
    this.poseDetector = new PoseDetector(3); // Soporte hasta 3 personas
    this.renderer = new PoseRenderer(this.canvas);

    // Estado de la partida
    this.currentPoseIndex = 0;
    this.currentPose = null;
    this.timeRemaining = 0;

    // Métricas P1
    this.p1Score = 0;
    this.p1RoundsWon = 0;
    this.p1HoldTimer = 0;

    // Métricas P2
    this.p2Score = 0;
    this.p2RoundsWon = 0;
    this.p2HoldTimer = 0;

    // Métricas P3
    this.p3Score = 0;
    this.p3RoundsWon = 0;
    this.p3HoldTimer = 0;

    this.latestCompP1 = null;
    this.latestCompP2 = null;
    this.latestCompP3 = null;

    this.presenceTimer = 0;
    this.roundInterval = null;
    this.countdownTimer = null;
    this.resultsInterval = null;

    this.init();
  }

  async init() {
    this.bindEvents();
    this.setupResizeHandler();
    this.updateModeUI();

    try {
      await this.cameraManager.startCamera();
      await this.populateCameras();
      await this.poseDetector.initialize((results) => this.onPoseResults(results), 3);
      this.poseDetector.start(this.video);

      console.log('Mirror Match BTL (3 Jugadores) inicializado.');
    } catch (err) {
      console.error('Error al inicializar cámara o detector:', err);
      alert('Por favor permite el acceso a la cámara para jugar a Mirror Match.');
    }
  }

  bindEvents() {
    // Selector de Modo
    this.modeSoloBtn?.addEventListener('click', () => {
      this.mode = 'SOLO';
      this.updateModeUI();
      soundEngine.init();
    });

    this.modeVsBtn?.addEventListener('click', () => {
      this.mode = 'VS';
      this.updateModeUI();
      soundEngine.init();
    });

    this.modeTrioBtn?.addEventListener('click', () => {
      this.mode = '3P';
      this.updateModeUI();
      soundEngine.init();
    });

    this.btnStartGame?.addEventListener('click', () => {
      soundEngine.init();
      this.startCalibration();
    });

    this.btnPlayAgain?.addEventListener('click', () => {
      soundEngine.init();
      this.startCalibration();
    });

    this.btnSound?.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      this.btnSound.textContent = isMuted ? '🔇 Mudo' : '🔊 Sonido';
    });

    this.btnFullscreen?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.warn);
      } else {
        document.exitFullscreen().catch(console.warn);
      }
    });

    this.cameraSelect?.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      if (deviceId) {
        await this.cameraManager.startCamera(deviceId);
      }
    });
  }

  updateModeUI() {
    this.modeSoloBtn?.classList.toggle('active', this.mode === 'SOLO');
    this.modeVsBtn?.classList.toggle('active', this.mode === 'VS');
    this.modeTrioBtn?.classList.toggle('active', this.mode === '3P');

    const callout = document.getElementById('attract-callout');
    const guide = document.getElementById('attract-guide-text');
    const startBtn = document.getElementById('btn-start-game');

    if (this.mode === '3P') {
      if (callout) callout.textContent = '¡PÁRENSE 3 RIVALES!';
      if (guide) guide.textContent = 'Ubíquense a la izquierda, centro y derecha a 2.5 metros de la pantalla';
      if (startBtn) startBtn.textContent = '¡INICIAR BATALLA 3P! 🚀';

      this.p1HeaderCard.style.display = 'flex';
      this.p2HeaderCard.style.display = 'flex';
      this.p3HeaderCard.style.display = 'flex';

      this.p1FooterLane.style.display = 'flex';
      this.p2FooterLane.style.display = 'flex';
      this.p3FooterLane.style.display = 'flex';

      this.p1FooterLane.style.maxWidth = '32%';
      this.p2FooterLane.style.maxWidth = '32%';
      this.p3FooterLane.style.maxWidth = '32%';
    } else if (this.mode === 'VS') {
      if (callout) callout.textContent = '¡PÁRENSE 2 RIVALES!';
      if (guide) guide.textContent = 'Ubíquense a la izquierda y derecha a 2 metros de la pantalla';
      if (startBtn) startBtn.textContent = '¡INICIAR BATALLA VS! ⚔️';

      this.p1HeaderCard.style.display = 'flex';
      this.p2HeaderCard.style.display = 'none';
      this.p3HeaderCard.style.display = 'flex';

      this.p1FooterLane.style.display = 'flex';
      this.p2FooterLane.style.display = 'none';
      this.p3FooterLane.style.display = 'flex';

      this.p1FooterLane.style.maxWidth = '46%';
      this.p3FooterLane.style.maxWidth = '46%';
    } else {
      // SOLO
      if (callout) callout.textContent = '¡PÁRATE AQUÍ!';
      if (guide) guide.textContent = 'Ubícate al centro a 2 metros de la cámara';
      if (startBtn) startBtn.textContent = '¡JUGAR EN SOLITARIO! 🚀';

      this.p1HeaderCard.style.display = 'flex';
      this.p2HeaderCard.style.display = 'none';
      this.p3HeaderCard.style.display = 'none';

      this.p1FooterLane.style.display = 'flex';
      this.p2FooterLane.style.display = 'none';
      this.p3FooterLane.style.display = 'none';

      this.p1FooterLane.style.maxWidth = '400px';
    }
  }

  setupResizeHandler() {
    const updateSize = () => {
      const rect = this.video.getBoundingClientRect();
      const w = Math.round(rect.width) || window.innerWidth;
      const h = Math.round(rect.height) || window.innerHeight;
      this.renderer.resize(w, h);
    };

    window.addEventListener('resize', updateSize);
    this.video.addEventListener('loadedmetadata', updateSize);
    updateSize();
  }

  async populateCameras() {
    const cameras = await this.cameraManager.getAvailableCameras();
    this.cameraSelect.innerHTML = '';
    cameras.forEach((cam, idx) => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label || `Cámara ${idx + 1}`;
      this.cameraSelect.appendChild(opt);
    });
  }

  /**
   * Bucle de análisis ejecutado en cada fotograma
   */
  onPoseResults(results) {
    this.renderer.clear();
    const allLandmarks = results.landmarks || [];

    const { p1, p2, p3 } = assignPlayersToLanes(allLandmarks, this.mode, true);

    const p1Framed = isPlayerFramed(p1, this.mode === 'SOLO' ? 'all' : 'left', true);
    const p2Framed = this.mode === '3P' ? isPlayerFramed(p2, 'center', true) : false;
    const p3Framed = (this.mode === '3P' || this.mode === 'VS') ? isPlayerFramed(this.mode === '3P' ? p3 : p2, 'right', true) : false;

    // Dibuja las líneas divisorias en pantalla en batalla
    if (this.mode !== 'SOLO' && this.state !== STATES.ATTRACT && this.state !== STATES.RESULTS) {
      this.renderer.drawVsDivider(this.mode);
    }

    switch (this.state) {
      case STATES.ATTRACT:
        if (p1) this.renderer.drawPlayerSkeleton(p1, null, true, 1);
        if (this.mode === '3P') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, null, true, 2);
          if (p3) this.renderer.drawPlayerSkeleton(p3, null, true, 3);
        } else if (this.mode === 'VS') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, null, true, 3);
        }

        // Auto-inicio por presencia
        let readyToStart = false;
        if (this.mode === '3P') readyToStart = p1Framed && p2Framed && p3Framed;
        else if (this.mode === 'VS') readyToStart = p1Framed && p3Framed;
        else readyToStart = p1Framed;

        if (readyToStart) {
          this.presenceTimer += 1 / 30;
          if (this.presenceTimer >= 1.5) {
            this.presenceTimer = 0;
            this.startCalibration();
          }
        } else {
          this.presenceTimer = Math.max(0, this.presenceTimer - 1 / 30);
        }
        break;

      case STATES.CALIBRATING:
        if (p1) this.renderer.drawPlayerSkeleton(p1, null, true, 1);
        if (this.mode === '3P') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, null, true, 2);
          if (p3) this.renderer.drawPlayerSkeleton(p3, null, true, 3);
        } else if (this.mode === 'VS') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, null, true, 3);
        }

        this.renderer.drawCalibrationGuide(p1Framed, p2Framed, p3Framed, this.mode);

        let calibrated = false;
        if (this.mode === '3P') calibrated = p1Framed && p2Framed && p3Framed;
        else if (this.mode === 'VS') calibrated = p1Framed && p3Framed;
        else calibrated = p1Framed;

        if (calibrated) {
          this.presenceTimer += 1 / 30;
          if (this.presenceTimer >= 1.0) {
            this.presenceTimer = 0;
            this.startCountdown();
          }
        } else {
          this.presenceTimer = 0;
        }
        break;

      case STATES.PLAYING:
        this.evaluatePlayingFrame(p1, p2, p3);
        break;

      case STATES.ROUND_SUCCESS:
      case STATES.ROUND_TIMEOUT:
        if (p1) this.renderer.drawPlayerSkeleton(p1, this.latestCompP1, true, 1);
        if (this.mode === '3P') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, this.latestCompP2, true, 2);
          if (p3) this.renderer.drawPlayerSkeleton(p3, this.latestCompP3, true, 3);
        } else if (this.mode === 'VS') {
          if (p2) this.renderer.drawPlayerSkeleton(p2, this.latestCompP2, true, 3);
        }
        break;

      case STATES.RESULTS:
        break;
    }
  }

  startCalibration() {
    this.state = STATES.CALIBRATING;
    this.attractScreen.style.display = 'none';
    this.resultsScreen.style.display = 'none';
    this.hudLayer.style.display = 'none';

    this.currentPoseIndex = 0;
    this.p1Score = 0;
    this.p1RoundsWon = 0;
    this.p2Score = 0;
    this.p2RoundsWon = 0;
    this.p3Score = 0;
    this.p3RoundsWon = 0;
    this.presenceTimer = 0;
  }

  startCountdown() {
    this.state = STATES.COUNTDOWN;
    this.countdownOverlay.style.display = 'flex';

    let count = 3;
    this.countdownText.textContent = count;
    soundEngine.playCountdown(440);

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdownText.textContent = count;
        soundEngine.playCountdown(440 + (3 - count) * 80);
      } else if (count === 0) {
        this.countdownText.textContent = this.mode === 'SOLO' ? '¡YA! 🚀' : '¡A PELEAR! ⚔️';
        if (this.mode !== 'SOLO') {
          soundEngine.playBoxingBell();
        } else {
          soundEngine.playStartChime();
        }
      } else {
        clearInterval(this.countdownTimer);
        this.countdownOverlay.style.display = 'none';
        this.startRound();
      }
    }, 900);
  }

  startRound() {
    this.state = STATES.PLAYING;
    this.hudLayer.style.display = 'flex';

    this.currentPose = POSES[this.currentPoseIndex];
    this.timeRemaining = this.currentPose.timeLimit;
    this.p1HoldTimer = 0;
    this.p2HoldTimer = 0;
    this.p3HoldTimer = 0;

    // Actualizar marcadores
    this.p1RoundsBadge.textContent = `🏆 ${this.p1RoundsWon} Rondas`;
    this.p1ScoreNum.textContent = `${this.p1Score} PTS`;
    this.p2RoundsBadge.textContent = `🏆 ${this.p2RoundsWon} Rondas`;
    this.p2ScoreNum.textContent = `${this.p2Score} PTS`;
    this.p3RoundsBadge.textContent = `🏆 ${this.p3RoundsWon} Rondas`;
    this.p3ScoreNum.textContent = `${this.p3Score} PTS`;

    this.targetTitle.textContent = this.currentPose.name;
    this.targetDesc.textContent = this.currentPose.subtitle;
    this.targetDifficulty.textContent = this.currentPose.difficulty;
    this.hudTimer.textContent = `${this.timeRemaining}s`;
    this.targetSilhouette.innerHTML = `
      <svg viewBox="0 0 200 200">
        ${this.currentPose.svgPath}
      </svg>
    `;

    this.updateHoldUI(1, 0);
    this.updateHoldUI(2, 0);
    this.updateHoldUI(3, 0);

    clearInterval(this.roundInterval);
    this.roundInterval = setInterval(() => {
      this.timeRemaining--;
      this.hudTimer.textContent = `${this.timeRemaining}s`;

      if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
        soundEngine.playCountdown(330);
      }

      if (this.timeRemaining <= 0) {
        clearInterval(this.roundInterval);
        this.onRoundTimeout();
      }
    }, 1000);
  }

  evaluatePlayingFrame(p1Landmarks, p2Landmarks, p3Landmarks) {
    const is3P = this.mode === '3P';
    const isVs = this.mode === 'VS';

    // --- 1. Evaluar Jugador 1 (Azul / Izquierda) ---
    if (p1Landmarks) {
      const angles = extractPlayerAngles(p1Landmarks);
      const comp = comparePose(angles, p1Landmarks, this.currentPose);
      this.latestCompP1 = comp;

      this.renderer.drawPlayerSkeleton(p1Landmarks, comp, true, 1);

      this.p1MeterFill.style.width = `${comp.matchPercentage}%`;
      this.p1PercentText.textContent = `${comp.matchPercentage}%`;

      if (comp.isMatching) {
        this.p1HoldTimer += 1 / 30;
        const ratio = Math.min(1, this.p1HoldTimer / 1.2);
        this.updateHoldUI(1, ratio);
        soundEngine.playHoldProgressP1(ratio);

        if (this.p1HoldTimer >= 1.2) {
          this.onRoundWinner(1);
          return;
        }
      } else {
        this.p1HoldTimer = Math.max(0, this.p1HoldTimer - 1.5 / 30);
        this.updateHoldUI(1, this.p1HoldTimer / 1.2);
      }
    } else {
      this.p1MeterFill.style.width = '0%';
      this.p1PercentText.textContent = '0%';
      this.updateHoldUI(1, 0);
    }

    // --- 2. Evaluar Jugador 2 (Amarillo / Centro en 3P, o Rosa / Derecha en 2P) ---
    const targetP2Landmarks = is3P ? p2Landmarks : (isVs ? p2Landmarks : null);
    const p2PlayerNum = is3P ? 2 : 3;

    if (targetP2Landmarks) {
      const angles = extractPlayerAngles(targetP2Landmarks);
      const comp = comparePose(angles, targetP2Landmarks, this.currentPose);
      this.latestCompP2 = comp;

      this.renderer.drawPlayerSkeleton(targetP2Landmarks, comp, true, p2PlayerNum);

      const meterFill = is3P ? this.p2MeterFill : this.p3MeterFill;
      const percentText = is3P ? this.p2PercentText : this.p3PercentText;

      meterFill.style.width = `${comp.matchPercentage}%`;
      percentText.textContent = `${comp.matchPercentage}%`;

      if (comp.isMatching) {
        this.p2HoldTimer += 1 / 30;
        const ratio = Math.min(1, this.p2HoldTimer / 1.2);
        this.updateHoldUI(is3P ? 2 : 3, ratio);
        if (is3P) soundEngine.playHoldProgressP2(ratio);
        else soundEngine.playHoldProgressP3(ratio);

        if (this.p2HoldTimer >= 1.2) {
          this.onRoundWinner(is3P ? 2 : 2);
          return;
        }
      } else {
        this.p2HoldTimer = Math.max(0, this.p2HoldTimer - 1.5 / 30);
        this.updateHoldUI(is3P ? 2 : 3, this.p2HoldTimer / 1.2);
      }
    } else {
      const meterFill = is3P ? this.p2MeterFill : this.p3MeterFill;
      const percentText = is3P ? this.p2PercentText : this.p3PercentText;
      meterFill.style.width = '0%';
      percentText.textContent = '0%';
      this.updateHoldUI(is3P ? 2 : 3, 0);
    }

    // --- 3. Evaluar Jugador 3 (Rosa / Derecha en 3P) ---
    if (is3P) {
      if (p3Landmarks) {
        const angles = extractPlayerAngles(p3Landmarks);
        const comp = comparePose(angles, p3Landmarks, this.currentPose);
        this.latestCompP3 = comp;

        this.renderer.drawPlayerSkeleton(p3Landmarks, comp, true, 3);

        this.p3MeterFill.style.width = `${comp.matchPercentage}%`;
        this.p3PercentText.textContent = `${comp.matchPercentage}%`;

        if (comp.isMatching) {
          this.p3HoldTimer += 1 / 30;
          const ratio = Math.min(1, this.p3HoldTimer / 1.2);
          this.updateHoldUI(3, ratio);
          soundEngine.playHoldProgressP3(ratio);

          if (this.p3HoldTimer >= 1.2) {
            this.onRoundWinner(3);
            return;
          }
        } else {
          this.p3HoldTimer = Math.max(0, this.p3HoldTimer - 1.5 / 30);
          this.updateHoldUI(3, this.p3HoldTimer / 1.2);
        }
      } else {
        this.p3MeterFill.style.width = '0%';
        this.p3PercentText.textContent = '0%';
        this.updateHoldUI(3, 0);
      }
    }
  }

  updateHoldUI(playerNum, ratio) {
    const circumference = 220; // 2 * pi * 35
    const offset = circumference - ratio * circumference;

    if (playerNum === 1) {
      this.p1HoldProgress.style.strokeDashoffset = offset;
      this.p1HoldText.textContent = ratio > 0.05 ? `${Math.round(ratio * 100)}%` : '0%';
    } else if (playerNum === 2) {
      this.p2HoldProgress.style.strokeDashoffset = offset;
      this.p2HoldText.textContent = ratio > 0.05 ? `${Math.round(ratio * 100)}%` : '0%';
    } else if (playerNum === 3) {
      this.p3HoldProgress.style.strokeDashoffset = offset;
      this.p3HoldText.textContent = ratio > 0.05 ? `${Math.round(ratio * 100)}%` : '0%';
    }
  }

  /**
   * Cuando un jugador gana la ronda por velocidad
   */
  onRoundWinner(winner) {
    this.state = STATES.ROUND_SUCCESS;
    clearInterval(this.roundInterval);

    const bonus = Math.round(this.timeRemaining * 25);
    const gained = 1000 + bonus;

    let confettiOriginX = 0.5;
    if (winner === 1) {
      this.p1RoundsWon++;
      this.p1Score += gained;
      confettiOriginX = 0.18;
      this.successBanner.innerHTML = `
        ¡PUNTO PARA JUGADOR 1! 🔵<br/>
        <span style="font-size: 26px; color: #ffea00;">+${gained} PTS (¡Más Rápido!)</span>
      `;
    } else if (winner === 2) {
      this.p2RoundsWon++;
      this.p2Score += gained;
      confettiOriginX = 0.50;
      this.successBanner.innerHTML = `
        ¡PUNTO PARA JUGADOR 2! 🟡<br/>
        <span style="font-size: 26px; color: #ffea00;">+${gained} PTS (¡Más Rápido!)</span>
      `;
    } else if (winner === 3) {
      this.p3RoundsWon++;
      this.p3Score += gained;
      confettiOriginX = 0.82;
      this.successBanner.innerHTML = `
        ¡PUNTO PARA JUGADOR 3! 🔴<br/>
        <span style="font-size: 26px; color: #ffea00;">+${gained} PTS (¡Más Rápida!)</span>
      `;
    }

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { x: confettiOriginX, y: 0.6 }
    });

    this.p1RoundsBadge.textContent = `🏆 ${this.p1RoundsWon} Rondas`;
    this.p1ScoreNum.textContent = `${this.p1Score} PTS`;
    this.p2RoundsBadge.textContent = `🏆 ${this.p2RoundsWon} Rondas`;
    this.p2ScoreNum.textContent = `${this.p2Score} PTS`;
    this.p3RoundsBadge.textContent = `🏆 ${this.p3RoundsWon} Rondas`;
    this.p3ScoreNum.textContent = `${this.p3Score} PTS`;

    this.triggerFlash();
    soundEngine.playCameraShutter();
    soundEngine.playPointScore(winner);

    this.successBanner.classList.add('show');

    setTimeout(() => {
      this.successBanner.classList.remove('show');
      this.nextRound();
    }, 1800);
  }

  onRoundTimeout() {
    this.state = STATES.ROUND_TIMEOUT;

    if (this.mode === '3P') {
      const timers = [
        { player: 1, val: this.p1HoldTimer },
        { player: 2, val: this.p2HoldTimer },
        { player: 3, val: this.p3HoldTimer }
      ];
      timers.sort((a, b) => b.val - a.val);
      if (timers[0].val > 0.4 && timers[0].val > timers[1].val) {
        this.onRoundWinner(timers[0].player);
        return;
      }
    } else if (this.mode === 'VS') {
      if (this.p1HoldTimer > this.p2HoldTimer && this.p1HoldTimer > 0.4) {
        this.onRoundWinner(1);
        return;
      } else if (this.p2HoldTimer > this.p1HoldTimer && this.p2HoldTimer > 0.4) {
        this.onRoundWinner(2);
        return;
      }
    }

    soundEngine.playCountdown(220);
    setTimeout(() => {
      this.nextRound();
    }, 1200);
  }

  nextRound() {
    this.currentPoseIndex++;
    if (this.currentPoseIndex < POSES.length) {
      this.startCountdown();
    } else {
      this.showGameOver();
    }
  }

  triggerFlash() {
    this.flashLayer.classList.add('active');
    setTimeout(() => {
      this.flashLayer.classList.remove('active');
    }, 200);
  }

  async showGameOver() {
    this.state = STATES.RESULTS;
    this.hudLayer.style.display = 'none';
    this.resultsScreen.style.display = 'flex';

    soundEngine.playVictoryFanfare();

    let winner = 0;
    if (this.mode === '3P') {
      const scores = [
        { p: 1, score: this.p1Score, rounds: this.p1RoundsWon },
        { p: 2, score: this.p2Score, rounds: this.p2RoundsWon },
        { p: 3, score: this.p3Score, rounds: this.p3RoundsWon }
      ];
      scores.sort((a, b) => b.rounds !== a.rounds ? b.rounds - a.rounds : b.score - a.score);

      if (scores[0].rounds > scores[1].rounds || scores[0].score > scores[1].score) {
        winner = scores[0].p;
        if (winner === 1) {
          this.resultsTitle.textContent = '👑 ¡JUGADOR 1 (AZUL) ES EL CAMPEÓN!';
          this.resultsTitle.style.color = '#00f0ff';
        } else if (winner === 2) {
          this.resultsTitle.textContent = '👑 ¡JUGADOR 2 (AMARILLO) ES EL CAMPEÓN!';
          this.resultsTitle.style.color = '#ffea00';
        } else {
          this.resultsTitle.textContent = '👑 ¡JUGADOR 3 (ROSA) ES LA CAMPEONA!';
          this.resultsTitle.style.color = '#ff007f';
        }
      } else {
        winner = 0;
        this.resultsTitle.textContent = '🤝 ¡EMPATE ÉPICO!';
        this.resultsTitle.style.color = '#ffea00';
      }
    } else if (this.mode === 'VS') {
      if (this.p1RoundsWon > this.p2RoundsWon) {
        winner = 1;
        this.resultsTitle.textContent = '👑 ¡JUGADOR 1 (AZUL) ES EL CAMPEÓN!';
        this.resultsTitle.style.color = '#00f0ff';
      } else if (this.p2RoundsWon > this.p1RoundsWon) {
        winner = 2;
        this.resultsTitle.textContent = '👑 ¡JUGADOR 2 (ROSA) ES LA CAMPEONA!';
        this.resultsTitle.style.color = '#ff007f';
      } else {
        winner = 0;
        this.resultsTitle.textContent = '🤝 ¡EMPATE ÉPICO!';
        this.resultsTitle.style.color = '#ffea00';
      }
    } else {
      this.resultsTitle.textContent = '🎉 ¡DESAFÍO COMPLETADO!';
      this.resultsTitle.style.color = '#00ff88';
    }

    try {
      const cardDataUrl = await ResultCardGenerator.generateCard({
        videoElement: this.video,
        skeletonCanvas: this.canvas,
        mode: this.mode,
        p1Score: this.p1Score,
        p2Score: this.p2Score,
        p3Score: this.p3Score,
        p1RoundsWon: this.p1RoundsWon,
        p2RoundsWon: this.p2RoundsWon,
        p3RoundsWon: this.p3RoundsWon,
        winner
      });

      this.resultCardImg.src = cardDataUrl;
      this.btnDownloadPhoto.href = cardDataUrl;
      this.btnDownloadPhoto.download = `mirror-match-3p-${Date.now()}.png`;
    } catch (err) {
      console.error('Error generando tarjeta final:', err);
    }

    let autoResetSeconds = 15;
    const timerFill = document.getElementById('results-timer-fill');
    const timerText = document.getElementById('results-countdown-text');

    timerFill.style.width = '100%';
    clearInterval(this.resultsInterval);

    this.resultsInterval = setInterval(() => {
      autoResetSeconds--;
      const pct = (autoResetSeconds / 15) * 100;
      timerFill.style.width = `${pct}%`;
      timerText.textContent = `Volviendo al inicio en ${autoResetSeconds} segundos...`;

      if (autoResetSeconds <= 0) {
        clearInterval(this.resultsInterval);
        this.returnToAttractMode();
      }
    }, 1000);
  }

  returnToAttractMode() {
    clearInterval(this.resultsInterval);
    this.state = STATES.ATTRACT;
    this.resultsScreen.style.display = 'none';
    this.hudLayer.style.display = 'none';
    this.attractScreen.style.display = 'flex';
    this.renderer.clear();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MirrorMatchGame();
});
