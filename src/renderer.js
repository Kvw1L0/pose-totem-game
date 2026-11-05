// Renderizador en Canvas con soporte para 1P, 2P y 3P (Batalla BTL en Pantalla Gigante)

export class PoseRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize(width, height) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Dibuja las líneas divisorias de carriles (1 línea para 2P, 2 líneas para 3P)
   */
  drawVsDivider(mode = '3P') {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    if (mode === '3P') {
      // 2 líneas divisorias láser para separar 3 carriles
      const lineX1 = w * 0.333;
      const lineX2 = w * 0.666;

      [lineX1, lineX2].forEach((lx) => {
        ctx.beginPath();
        ctx.setLineDash([10, 10]);
        ctx.moveTo(lx, 70);
        ctx.lineTo(lx, h - 30);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.stroke();

        // Pequeño marcador VS entre carriles
        const midY = h * 0.42;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(lx, midY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0d18';
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffea00';
        ctx.font = '900 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText('VS', lx, midY + 1);
      });
    } else if (mode === 'VS') {
      // 1 línea divisoria central para 2P
      const midX = w / 2;

      ctx.beginPath();
      ctx.setLineDash([12, 12]);
      ctx.moveTo(midX, 80);
      ctx.lineTo(midX, h - 40);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      const midY = h * 0.45;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(midX, midY, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d18';
      ctx.strokeStyle = '#ffea00';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffea00';
      ctx.font = '900 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('VS', midX, midY + 1);
    }

    ctx.restore();
  }

  /**
   * Dibuja el esqueleto de un jugador con su paleta de color propia y etiqueta
   */
  drawPlayerSkeleton(landmarks, comparisonResult, mirrored = true, playerNum = 1) {
    if (!landmarks || landmarks.length < 33) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Paleta de colores según jugador:
    // P1: Cian (#00f0ff), P2: Amarillo (#ffea00), P3: Rosa (#ff007f)
    let baseColor = '#00f0ff';
    let successColor = '#00ff88';

    if (playerNum === 2) {
      baseColor = '#ffea00';
      successColor = '#00ff88';
    } else if (playerNum === 3) {
      baseColor = '#ff007f';
      successColor = '#00ff88';
    }

    const getPoint = (idx) => {
      const pt = landmarks[idx];
      if (!pt) return null;
      const x = mirrored ? (1 - pt.x) * w : pt.x * w;
      const y = pt.y * h;
      return { x, y, visibility: pt.visibility ?? 1 };
    };

    const statusMap = comparisonResult?.jointStatus || {};

    const getJointColor = (jointName) => {
      const status = statusMap[jointName]?.status;
      if (status === 'correct') return successColor;
      if (status === 'close') return '#ffffff';
      if (status === 'incorrect') return '#ff3366';
      return baseColor;
    };

    const connections = [
      { from: 11, to: 12, joint: null, color: baseColor },
      { from: 11, to: 23, joint: 'left_shoulder', color: getJointColor('left_shoulder') },
      { from: 12, to: 24, joint: 'right_shoulder', color: getJointColor('right_shoulder') },
      { from: 23, to: 24, joint: null, color: baseColor },

      // Brazos
      { from: 11, to: 13, joint: 'left_shoulder', color: getJointColor('left_shoulder') },
      { from: 13, to: 15, joint: 'left_elbow', color: getJointColor('left_elbow') },
      { from: 12, to: 14, joint: 'right_shoulder', color: getJointColor('right_shoulder') },
      { from: 14, to: 16, joint: 'right_elbow', color: getJointColor('right_elbow') },

      // Piernas
      { from: 23, to: 25, joint: 'left_knee', color: getJointColor('left_knee') },
      { from: 25, to: 27, joint: 'left_knee', color: getJointColor('left_knee') },
      { from: 24, to: 26, joint: 'right_knee', color: getJointColor('right_knee') },
      { from: 26, to: 28, joint: 'right_knee', color: getJointColor('right_knee') },
    ];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Dibujar huesos láser
    for (const conn of connections) {
      const p1 = getPoint(conn.from);
      const p2 = getPoint(conn.to);

      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.lineWidth = 8;
        ctx.strokeStyle = conn.color;
        ctx.shadowColor = conn.color;
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
    }

    // 2. Dibujar articulaciones
    const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    for (const idx of keyJoints) {
      const pt = getPoint(idx);
      if (pt && pt.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);

        let pointColor = baseColor;
        if (idx === 13 || idx === 15) pointColor = getJointColor('left_elbow');
        else if (idx === 14 || idx === 16) pointColor = getJointColor('right_elbow');
        else if (idx === 11 || idx === 23) pointColor = getJointColor('left_shoulder');
        else if (idx === 12 || idx === 24) pointColor = getJointColor('right_shoulder');
        else if (idx === 25 || idx === 27) pointColor = getJointColor('left_knee');
        else if (idx === 26 || idx === 28) pointColor = getJointColor('right_knee');

        ctx.fillStyle = pointColor;
        ctx.shadowColor = pointColor;
        ctx.shadowBlur = 12;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    }

    // 3. Cabeza y Etiqueta de Jugador (P1, P2, P3)
    const nose = getPoint(0);
    if (nose && nose.visibility > 0.4) {
      ctx.beginPath();
      ctx.arc(nose.x, nose.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.fillStyle = `${baseColor}33`; // 20% alpha
      ctx.fill();

      // Etiqueta flotante ("P1", "P2", "P3")
      const tagY = Math.max(30, nose.y - 36);
      ctx.beginPath();
      ctx.roundRect(nose.x - 24, tagY - 14, 48, 22, 6);
      ctx.fillStyle = baseColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = baseColor;
      ctx.fill();

      ctx.fillStyle = '#05070e';
      ctx.font = '900 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(`P${playerNum}`, nose.x, tagY - 3);
    }

    ctx.restore();
  }

  /**
   * Dibuja los visores de calibración (1P, 2P o 3P)
   */
  drawCalibrationGuide(p1Framed, p2Framed, p3Framed, mode = '3P') {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    if (mode === 'SOLO') {
      // Guía central para 1 Jugador
      const color = p1Framed ? '#00ff88' : '#ffea00';
      const boxW = Math.min(w * 0.65, 450);
      const boxH = Math.min(h * 0.85, 750);
      this.drawCornerBox((w - boxW) / 2, (h - boxH) / 2, boxW, boxH, color);

      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      const msg = p1Framed ? '¡PERFECTO! MANTÉNTE AHÍ...' : 'UBÍCATE DENTRO DEL RECUADRO';
      ctx.fillText(msg, w / 2, (h + boxH) / 2 + 40);

    } else if (mode === 'VS') {
      // 2 Jugadores (Lado Izquierdo P1 y Lado Derecho P2)
      const boxW = Math.min(w * 0.42, 380);
      const boxH = Math.min(h * 0.82, 700);
      const boxY = (h - boxH) / 2;

      // P1 (Izquierda - Cian)
      const p1Color = p1Framed ? '#00ff88' : '#00f0ff';
      const p1X = w * 0.05;
      this.drawCornerBox(p1X, boxY, boxW, boxH, p1Color);

      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = p1Color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = p1Color;
      const p1Msg = p1Framed ? '✓ JUGADOR 1 LISTO' : 'JUGADOR 1 (AZUL)';
      ctx.fillText(p1Msg, p1X + boxW / 2, boxY + boxH + 34);

      // P2 (Derecha - Rosa)
      const p2Color = p2Framed ? '#00ff88' : '#ff007f';
      const p2X = w * 0.95 - boxW;
      this.drawCornerBox(p2X, boxY, boxW, boxH, p2Color);

      ctx.fillStyle = p2Color;
      ctx.shadowColor = p2Color;
      const p2Msg = p2Framed ? '✓ JUGADOR 2 LISTO' : 'JUGADOR 2 (ROSA)';
      ctx.fillText(p2Msg, p2X + boxW / 2, boxY + boxH + 34);

      // Texto general
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      const statusText = (p1Framed && p2Framed) ? '¡AMBOS EN POSICIÓN! INICIANDO...' : '¡PÁRENSE EN SUS CARRILES!';
      ctx.fillText(statusText, w / 2, 60);

    } else {
      // 3 Jugadores (3P / Batalla Trío BTL)
      const boxW = Math.min(w * 0.29, 320);
      const boxH = Math.min(h * 0.80, 680);
      const boxY = (h - boxH) / 2;

      // P1 (Izquierda - Cian)
      const p1Color = p1Framed ? '#00ff88' : '#00f0ff';
      const p1X = w * 0.03;
      this.drawCornerBox(p1X, boxY, boxW, boxH, p1Color);

      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillStyle = p1Color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = p1Color;
      const p1Msg = p1Framed ? '✓ JUGADOR 1' : 'P1 (AZUL)';
      ctx.fillText(p1Msg, p1X + boxW / 2, boxY + boxH + 30);

      // P2 (Centro - Amarillo)
      const p2Color = p2Framed ? '#00ff88' : '#ffea00';
      const p2X = (w - boxW) / 2;
      this.drawCornerBox(p2X, boxY, boxW, boxH, p2Color);

      ctx.fillStyle = p2Color;
      ctx.shadowColor = p2Color;
      const p2Msg = p2Framed ? '✓ JUGADOR 2' : 'P2 (AMARILLO)';
      ctx.fillText(p2Msg, p2X + boxW / 2, boxY + boxH + 30);

      // P3 (Derecha - Rosa)
      const p3Color = p3Framed ? '#00ff88' : '#ff007f';
      const p3X = w * 0.97 - boxW;
      this.drawCornerBox(p3X, boxY, boxW, boxH, p3Color);

      ctx.fillStyle = p3Color;
      ctx.shadowColor = p3Color;
      const p3Msg = p3Framed ? '✓ JUGADOR 3' : 'P3 (ROSA)';
      ctx.fillText(p3Msg, p3X + boxW / 2, boxY + boxH + 30);

      // Texto general en el centro superior
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      const allReady = p1Framed && p2Framed && p3Framed;
      const statusText = allReady ? '¡LOS 3 EN POSICIÓN! INICIANDO...' : '¡UBÍQUENSE EN SUS 3 HUELLAS!';
      ctx.fillText(statusText, w / 2, 50);
    }

    ctx.restore();
  }

  drawCornerBox(boxX, boxY, boxW, boxH, color) {
    const ctx = this.ctx;
    const cornerLen = 30;

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cornerLen);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerLen, boxY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerLen, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cornerLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - cornerLen);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cornerLen, boxY + boxH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
    ctx.stroke();
  }
}
