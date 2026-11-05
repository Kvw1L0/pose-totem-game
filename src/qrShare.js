// Generador de tarjeta de resultados y fotografía de recuerdo (Soporte 1P, 2P y 3P Batalla BTL)
import QRCode from 'qrcode';

export class ResultCardGenerator {
  /**
   * Genera una tarjeta de batalla en alta resolución (1080x1440) para 1P, 2P o 3P
   */
  static async generateCard({
    videoElement,
    skeletonCanvas,
    mode = '3P',
    p1Score = 0,
    p2Score = 0,
    p3Score = 0,
    p1RoundsWon = 0,
    p2RoundsWon = 0,
    p3RoundsWon = 0,
    winner = 0 // 1, 2, 3 o 0 (empate)
  }) {
    const cardCanvas = document.createElement('canvas');
    const width = 1080;
    const height = 1440;
    cardCanvas.width = width;
    cardCanvas.height = height;
    const ctx = cardCanvas.getContext('2d');

    const is3P = mode === '3P';
    const is2P = mode === 'VS';

    // 1. Fondo Cyberpunk con gradiente
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090c17');
    bgGrad.addColorStop(0.5, '#13192d');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Patrón de rejilla láser
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Encabezado
    ctx.textAlign = 'center';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    
    let headerTitle = '⚡ MIRROR MATCH CHALLENGE ⚡';
    let subTitle = 'RETO INTERACTIVO DE CUERPO ENTERO';
    if (is3P) {
      headerTitle = '⚔️ MIRROR MATCH: BATALLA TRÍO 3P ⚔️';
      subTitle = 'DUELO DE POSES EN PANTALLA GIGANTE BTL';
    } else if (is2P) {
      headerTitle = '⚔️ MIRROR MATCH: BATALLA VS ⚔️';
      subTitle = 'DUELO DE POSES EN TÓTEM KIOSK';
    }

    ctx.fillText(headerTitle, width / 2, 85);

    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillStyle = is3P ? '#00ff88' : is2P ? '#ffea00' : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(subTitle, width / 2, 122);
    ctx.shadowBlur = 0;

    // 4. Marco de la Foto (Video Espejado)
    const photoX = 60;
    const photoY = 160;
    const photoW = 960;
    const photoH = 750;

    ctx.strokeStyle = is3P ? '#00ff88' : is2P ? '#ffea00' : '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(photoX, photoY, photoW, photoH);
    ctx.clip();

    // Dibujar video espejado
    ctx.save();
    ctx.translate(photoX + photoW, photoY);
    ctx.scale(-1, 1);
    try {
      ctx.drawImage(videoElement, 0, 0, photoW, photoH);
    } catch (e) {
      ctx.fillStyle = '#1a1f36';
      ctx.fillRect(0, 0, photoW, photoH);
    }
    ctx.restore();

    // Superponer esqueleto
    if (skeletonCanvas) {
      ctx.drawImage(skeletonCanvas, photoX, photoY, photoW, photoH);
    }

    // Corona virtual sobre el ganador en la foto
    if (winner !== 0) {
      ctx.font = '70px system-ui';
      ctx.textAlign = 'center';
      let crownX = photoX + photoW * 0.5;
      if (is3P) {
        if (winner === 1) crownX = photoX + photoW * 0.17;
        else if (winner === 2) crownX = photoX + photoW * 0.50;
        else if (winner === 3) crownX = photoX + photoW * 0.83;
      } else if (is2P) {
        crownX = winner === 1 ? photoX + photoW * 0.25 : photoX + photoW * 0.75;
      }
      ctx.fillText('👑', crownX, photoY + 90);
    }

    ctx.restore();

    // 5. Estadísticas de la Partida
    const statsY = 960;

    if (is3P) {
      // 3 Columnas de puntuación: P1 (Azul), P2 (Amarillo), P3 (Rosa)
      const colW = 230;

      // --- Columna 1: P1 (Azul) ---
      const x1 = photoX;
      ctx.textAlign = 'left';
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('P1 (AZUL)', x1, statsY);

      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rondas: ${p1RoundsWon} / 5`, x1, statsY + 38);

      ctx.font = '900 38px system-ui, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${p1Score} PTS`, x1, statsY + 86);

      if (winner === 1) {
        ctx.font = '900 20px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🏆 ¡CAMPEÓN!', x1, statsY + 120);
      }

      // --- Columna 2: P2 (Amarillo) ---
      const x2 = photoX + colW + 15;
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.fillStyle = '#ffea00';
      ctx.fillText('P2 (AMARILLO)', x2, statsY);

      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rondas: ${p2RoundsWon} / 5`, x2, statsY + 38);

      ctx.font = '900 38px system-ui, sans-serif';
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${p2Score} PTS`, x2, statsY + 86);

      if (winner === 2) {
        ctx.font = '900 20px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🏆 ¡CAMPEÓN!', x2, statsY + 120);
      }

      // --- Columna 3: P3 (Rosa) ---
      const x3 = photoX + (colW + 15) * 2;
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.fillStyle = '#ff007f';
      ctx.fillText('P3 (ROSA)', x3, statsY);

      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rondas: ${p3RoundsWon} / 5`, x3, statsY + 38);

      ctx.font = '900 38px system-ui, sans-serif';
      ctx.fillStyle = '#ff007f';
      ctx.fillText(`${p3Score} PTS`, x3, statsY + 86);

      if (winner === 3) {
        ctx.font = '900 20px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🏆 ¡CAMPEONA!', x3, statsY + 120);
      }

      if (winner === 0) {
        ctx.font = '900 20px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🤝 ¡EMPATE ÉPICO!', x1, statsY + 130);
      }

    } else if (is2P) {
      // 2 Columnas: P1 vs P2
      ctx.textAlign = 'left';
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('JUGADOR 1 (AZUL)', photoX, statsY);

      ctx.font = '800 24px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rondas Ganadas: ${p1RoundsWon} / 5`, photoX, statsY + 45);

      ctx.font = '900 48px system-ui, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${p1Score} PTS`, photoX, statsY + 105);

      if (winner === 1) {
        ctx.font = '900 26px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🏆 ¡CAMPEÓN!', photoX, statsY + 145);
      }

      const p2X = photoX + 380;
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#ff007f';
      ctx.fillText('JUGADOR 2 (ROSA)', p2X, statsY);

      ctx.font = '800 24px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rondas Ganadas: ${p2RoundsWon} / 5`, p2X, statsY + 45);

      ctx.font = '900 48px system-ui, sans-serif';
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${p2Score} PTS`, p2X, statsY + 105);

      if (winner === 2) {
        ctx.font = '900 26px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🏆 ¡CAMPEONA!', p2X, statsY + 145);
      }

      if (winner === 0) {
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillStyle = '#ffea00';
        ctx.fillText('🤝 ¡EMPATE ÉPICO!', photoX, statsY + 150);
      }
    } else {
      // Modo 1 Jugador
      ctx.textAlign = 'left';
      ctx.font = '800 30px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PUNTUACIÓN FINAL', photoX, statsY);

      ctx.font = '900 68px system-ui, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${p1Score} PTS`, photoX, statsY + 70);

      ctx.font = '600 24px system-ui, sans-serif';
      ctx.fillStyle = '#a0aec0';
      ctx.fillText(`Poses completadas con éxito: ${p1RoundsWon} de 5`, photoX, statsY + 115);
    }

    // Fecha
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText(`Fecha: ${dateStr}`, photoX, 1160);

    // 6. Generación de Código QR
    const qrSize = 210;
    const qrX = width - photoX - qrSize;
    const qrY = 950;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

    try {
      const shareUrl = `https://mirror-match-play.vercel.app/?mode=${mode.toLowerCase()}&p1=${p1Score}&p2=${p2Score}&p3=${p3Score}&winner=${winner}&date=${encodeURIComponent(dateStr)}`;
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: qrSize,
        color: { dark: '#0a0d18', light: '#ffffff' }
      });

      const qrImg = new Image();
      await new Promise((res) => {
        qrImg.onload = res;
        qrImg.src = qrDataUrl;
      });

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.textAlign = 'center';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('¡ESCANEA CON TU MÓVIL!', qrX + qrSize / 2, qrY + qrSize + 28);
    } catch (err) {
      console.warn('Error generando QR de batalla:', err);
    }

    return cardCanvas.toDataURL('image/png');
  }
}
