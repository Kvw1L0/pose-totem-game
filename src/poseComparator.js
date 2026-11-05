// Motor de cálculo geométrico y comparación de poses (Soporte 1P, 2P y 3P Batalla BTL)

/**
 * Calcula el ángulo en grados formado por tres puntos (A -> B -> C),
 * donde B es el vértice (la articulación central).
 */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 0;

  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);

  if (magAB === 0 || magCB === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  const angleRad = Math.acos(cosAngle);
  return (angleRad * 180) / Math.PI;
}

/**
 * Extrae todos los ángulos articulares relevantes del esqueleto detectado por MediaPipe.
 */
export function extractPlayerAngles(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  const LM = {
    NOSE: 0,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28
  };

  return {
    left_elbow: calculateAngle(landmarks[LM.LEFT_SHOULDER], landmarks[LM.LEFT_ELBOW], landmarks[LM.LEFT_WRIST]),
    right_elbow: calculateAngle(landmarks[LM.RIGHT_SHOULDER], landmarks[LM.RIGHT_ELBOW], landmarks[LM.RIGHT_WRIST]),
    left_shoulder: calculateAngle(landmarks[LM.LEFT_HIP], landmarks[LM.LEFT_SHOULDER], landmarks[LM.LEFT_ELBOW]),
    right_shoulder: calculateAngle(landmarks[LM.RIGHT_HIP], landmarks[LM.RIGHT_SHOULDER], landmarks[LM.RIGHT_ELBOW]),
    left_knee: calculateAngle(landmarks[LM.LEFT_HIP], landmarks[LM.LEFT_KNEE], landmarks[LM.LEFT_ANKLE]),
    right_knee: calculateAngle(landmarks[LM.RIGHT_HIP], landmarks[LM.RIGHT_KNEE], landmarks[LM.RIGHT_ANKLE])
  };
}

/**
 * Compara los ángulos del jugador contra la pose objetivo.
 */
export function comparePose(playerAngles, landmarks, targetPose) {
  if (!playerAngles || !targetPose || !targetPose.targetAngles) {
    return {
      matchPercentage: 0,
      isMatching: false,
      jointStatus: {},
      playerAngles: {}
    };
  }

  let totalScore = 0;
  let totalWeight = 0;
  const jointStatus = {};

  for (const [joint, target] of Object.entries(targetPose.targetAngles)) {
    const currentAngle = playerAngles[joint] || 0;
    const diff = Math.abs(currentAngle - target.angle);
    const tolerance = target.tolerance || 25;
    const weight = target.weight || 1.0;

    let jointScore = 0;
    let status = 'incorrect';

    if (diff <= tolerance) {
      const accuracyWithinTol = 1 - (diff / tolerance) * 0.15;
      jointScore = Math.max(0.85, accuracyWithinTol);
      status = 'correct';
    } else if (diff <= tolerance * 1.8) {
      const excess = diff - tolerance;
      const maxExcess = tolerance * 0.8;
      jointScore = Math.max(0.4, 0.85 - (excess / maxExcess) * 0.45);
      status = 'close';
    } else {
      const farExcess = diff - tolerance * 1.8;
      jointScore = Math.max(0, 0.4 - (farExcess / 60) * 0.4);
      status = 'incorrect';
    }

    jointStatus[joint] = {
      current: Math.round(currentAngle),
      target: target.angle,
      tolerance,
      diff: Math.round(diff),
      score: Math.round(jointScore * 100),
      status
    };

    totalScore += jointScore * weight;
    totalWeight += weight;
  }

  if (targetPose.rules && targetPose.rules.length > 0) {
    let passedRules = 0;
    for (const rule of targetPose.rules) {
      try {
        if (rule.check(playerAngles, landmarks)) {
          passedRules++;
        }
      } catch (err) {
        // Regla no superada
      }
    }
    const ruleMultiplier = passedRules / targetPose.rules.length;
    if (ruleMultiplier < 1) {
      totalScore *= (0.7 + 0.3 * ruleMultiplier);
    }
  }

  const rawPercent = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  const matchPercentage = Math.round(Math.min(100, Math.max(0, rawPercent)));
  const isMatching = matchPercentage >= 75;

  return {
    matchPercentage,
    isMatching,
    jointStatus,
    playerAngles
  };
}

/**
 * Asigna los esqueletos detectados a los carriles correspondientes:
 * - Modo 'SOLO': P1 (Centro)
 * - Modo 'VS': P1 (Izquierda) y P2 (Derecha)
 * - Modo '3P': P1 (Izquierda), P2 (Centro) y P3 (Derecha)
 *
 * Incluye filtro de fondo anti-espectadores para eventos BTL.
 */
export function assignPlayersToLanes(allLandmarks, mode = '3P', mirrored = true) {
  if (!allLandmarks || allLandmarks.length === 0) {
    return { p1: null, p2: null, p3: null };
  }

  // 1. Filtrar candidatos válidos (ignora curiosos/espectadores pequeños en el fondo)
  const candidates = [];
  for (const landmarks of allLandmarks) {
    if (!landmarks || landmarks.length < 33) continue;

    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];

    if (!ls || !rs || !lh || !rh) continue;

    // Calcular tamaño aparente (ancho hombros)
    const shoulderDist = Math.hypot(ls.x - rs.x, ls.y - rs.y);
    // Si la persona está muy lejos (fondo >3.5m), shoulderDist suele ser < 0.04
    if (shoulderDist < 0.04) continue;

    // Calcular centro X y aplicar espejo
    const rawX = (ls.x + rs.x + lh.x + rh.x) / 4;
    const screenX = mirrored ? (1 - rawX) : rawX;

    candidates.push({
      landmarks,
      screenX,
      size: shoulderDist
    });
  }

  if (candidates.length === 0) {
    return { p1: null, p2: null, p3: null };
  }

  // --- Modo 1 Jugador (SOLO) ---
  if (mode === 'SOLO') {
    candidates.sort((a, b) => Math.abs(a.screenX - 0.5) - Math.abs(b.screenX - 0.5));
    return { p1: candidates[0]?.landmarks || null, p2: null, p3: null };
  }

  // --- Modo 2 Jugadores (VS) ---
  if (mode === 'VS') {
    if (candidates.length === 1) {
      const single = candidates[0];
      if (single.screenX < 0.5) {
        return { p1: single.landmarks, p2: null, p3: null };
      } else {
        return { p1: null, p2: single.landmarks, p3: null };
      }
    }

    // Ordenar de izquierda a derecha
    candidates.sort((a, b) => a.screenX - b.screenX);
    return {
      p1: candidates[0].landmarks,
      p2: candidates[1].landmarks,
      p3: null
    };
  }

  // --- Modo 3 Jugadores (3P / Batalla Trío BTL) ---
  // Si hay más de 3 personas, quedarnos con las 3 más cercanas (mayor tamaño de hombros)
  let activeCandidates = candidates;
  if (activeCandidates.length > 3) {
    activeCandidates.sort((a, b) => b.size - a.size);
    activeCandidates = activeCandidates.slice(0, 3);
  }

  // Ordenar de izquierda a derecha
  activeCandidates.sort((a, b) => a.screenX - b.screenX);

  if (activeCandidates.length === 3) {
    return {
      p1: activeCandidates[0].landmarks,
      p2: activeCandidates[1].landmarks,
      p3: activeCandidates[2].landmarks
    };
  }

  if (activeCandidates.length === 2) {
    const c1 = activeCandidates[0];
    const c2 = activeCandidates[1];

    // Distribuir según cercanía a los tercios (0.16, 0.50, 0.83)
    if (c1.screenX < 0.38 && c2.screenX > 0.62) {
      return { p1: c1.landmarks, p2: null, p3: c2.landmarks };
    } else if (c1.screenX < 0.38 && c2.screenX <= 0.65) {
      return { p1: c1.landmarks, p2: c2.landmarks, p3: null };
    } else {
      return { p1: null, p2: c1.landmarks, p3: c2.landmarks };
    }
  }

  // Exactamente 1 candidato en modo 3P
  const single = activeCandidates[0];
  if (single.screenX < 0.38) {
    return { p1: single.landmarks, p2: null, p3: null };
  } else if (single.screenX > 0.62) {
    return { p1: null, p2: null, p3: single.landmarks };
  } else {
    return { p1: null, p2: single.landmarks, p3: null };
  }
}

/**
 * Comprueba si un jugador está adecuadamente encuadrado en su carril
 */
export function isPlayerFramed(landmarks, lane = 'all', mirrored = true) {
  if (!landmarks || landmarks.length < 33) return false;

  const keyPoints = [11, 12, 23, 24];
  let visibleCount = 0;

  for (const idx of keyPoints) {
    const pt = landmarks[idx];
    if (pt && (pt.visibility === undefined || pt.visibility > 0.40)) {
      if (pt.y >= 0.05 && pt.y <= 0.95) {
        visibleCount++;
      }
    }
  }

  if (visibleCount < 3) return false;

  // Verificar posición en carril
  const rawX = (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) / 4;
  const screenX = mirrored ? (1 - rawX) : rawX;

  if (lane === 'left' || lane === 'p1') {
    return screenX < 0.42;
  }
  if (lane === 'center' || lane === 'p2') {
    return screenX >= 0.25 && screenX <= 0.75;
  }
  if (lane === 'right' || lane === 'p3') {
    return screenX > 0.58;
  }

  return true;
}
