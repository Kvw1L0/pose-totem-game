// Catálogo de poses del juego para Tótem

export const POSES = [
  {
    id: 'pose_t',
    name: 'El Avión (La T)',
    subtitle: '¡Extiende ambos brazos rectos a los lados!',
    icon: '✈️',
    difficulty: 'Fácil',
    points: 500,
    timeLimit: 12,
    holdDuration: 1.5, // Segundos que debe mantener la pose
    // Ángulos articulares esperados (en grados) y su tolerancia
    targetAngles: {
      left_shoulder: { angle: 90, tolerance: 22, weight: 1.2 },
      right_shoulder: { angle: 90, tolerance: 22, weight: 1.2 },
      left_elbow: { angle: 175, tolerance: 25, weight: 1.0 },
      right_elbow: { angle: 175, tolerance: 25, weight: 1.0 }
    },
    // Reglas cualitativas adicionales (para mayor precisión)
    rules: [
      { name: 'Codos extendidos', check: (angles) => angles.left_elbow > 145 && angles.right_elbow > 145 },
      { name: 'Brazos a la altura del hombro', check: (angles) => angles.left_shoulder > 70 && angles.right_shoulder > 70 }
    ],
    // SVG estilizado para mostrar en el HUD
    svgPath: `
      <!-- Cabeza -->
      <circle cx="100" cy="40" r="16" fill="currentColor"/>
      <!-- Torso -->
      <line x1="100" y1="56" x2="100" y2="120" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Brazos extendidos en T -->
      <line x1="25" y1="75" x2="175" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Piernas -->
      <line x1="100" y1="120" x2="80" y2="185" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="120" x2="120" y2="185" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `
  },
  {
    id: 'pose_v',
    name: '¡Victoria en V!',
    subtitle: '¡Levanta ambos brazos hacia el cielo!',
    icon: '✌️',
    difficulty: 'Fácil',
    points: 600,
    timeLimit: 12,
    holdDuration: 1.5,
    targetAngles: {
      left_shoulder: { angle: 145, tolerance: 25, weight: 1.2 },
      right_shoulder: { angle: 145, tolerance: 25, weight: 1.2 },
      left_elbow: { angle: 170, tolerance: 25, weight: 1.0 },
      right_elbow: { angle: 170, tolerance: 25, weight: 1.0 }
    },
    rules: [
      { name: 'Manos arriba de la cabeza', check: (angles, lm) => lm[15].y < lm[0].y && lm[16].y < lm[0].y }
    ],
    svgPath: `
      <circle cx="100" cy="45" r="16" fill="currentColor"/>
      <line x1="100" y1="61" x2="100" y2="125" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Brazos en V -->
      <line x1="100" y1="75" x2="40" y2="25" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="75" x2="160" y2="25" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="80" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="120" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `
  },
  {
    id: 'pose_biceps',
    name: 'Doble Bíceps',
    subtitle: '¡Muestra tus músculos con fuerza!',
    icon: '💪',
    difficulty: 'Media',
    points: 700,
    timeLimit: 12,
    holdDuration: 1.5,
    targetAngles: {
      left_shoulder: { angle: 90, tolerance: 25, weight: 1.0 },
      right_shoulder: { angle: 90, tolerance: 25, weight: 1.0 },
      left_elbow: { angle: 85, tolerance: 25, weight: 1.3 },
      right_elbow: { angle: 85, tolerance: 25, weight: 1.3 }
    },
    rules: [
      { name: 'Codos doblados a 90°', check: (angles) => angles.left_elbow < 120 && angles.right_elbow < 120 }
    ],
    svgPath: `
      <circle cx="100" cy="45" r="16" fill="currentColor"/>
      <line x1="100" y1="61" x2="100" y2="125" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Bíceps flexionados -->
      <path d="M 40 45 L 40 75 L 100 75 L 160 75 L 160 45" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="100" y1="125" x2="80" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="120" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `
  },
  {
    id: 'pose_disco',
    name: 'Fiebre Disco',
    subtitle: '¡Brazo derecho arriba y brazo izquierdo abajo!',
    icon: '🕺',
    difficulty: 'Media',
    points: 800,
    timeLimit: 12,
    holdDuration: 1.5,
    targetAngles: {
      right_shoulder: { angle: 145, tolerance: 25, weight: 1.2 },
      left_shoulder: { angle: 30, tolerance: 25, weight: 1.2 },
      right_elbow: { angle: 170, tolerance: 25, weight: 1.0 },
      left_elbow: { angle: 170, tolerance: 25, weight: 1.0 }
    },
    rules: [
      { name: 'Mano derecha arriba, mano izquierda abajo', check: (angles, lm) => lm[16].y < lm[12].y && lm[15].y > lm[11].y }
    ],
    svgPath: `
      <circle cx="100" cy="45" r="16" fill="currentColor"/>
      <line x1="100" y1="61" x2="100" y2="125" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Brazo derecho diagonal arriba, izquierdo diagonal abajo -->
      <line x1="100" y1="75" x2="160" y2="25" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="75" x2="50" y2="120" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="75" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="125" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `
  },
  {
    id: 'pose_superhero',
    name: 'El Superhéroe',
    subtitle: '¡Manos a la cintura y postura triunfante!',
    icon: '🦸',
    difficulty: 'Fácil',
    points: 750,
    timeLimit: 12,
    holdDuration: 1.5,
    targetAngles: {
      left_shoulder: { angle: 45, tolerance: 25, weight: 1.0 },
      right_shoulder: { angle: 45, tolerance: 25, weight: 1.0 },
      left_elbow: { angle: 75, tolerance: 28, weight: 1.3 },
      right_elbow: { angle: 75, tolerance: 28, weight: 1.3 }
    },
    rules: [
      { name: 'Manos en la cadera', check: (angles, lm) => Math.abs(lm[15].y - lm[23].y) < 0.15 && Math.abs(lm[16].y - lm[24].y) < 0.15 }
    ],
    svgPath: `
      <circle cx="100" cy="45" r="16" fill="currentColor"/>
      <line x1="100" y1="61" x2="100" y2="125" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Brazos en jarra -->
      <path d="M 100 75 L 55 90 L 85 120" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 100 75 L 145 90 L 115 120" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="100" y1="125" x2="75" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="125" x2="125" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `
  },
  {
    id: 'pose_karate',
    name: 'La Grulla',
    subtitle: '¡Brazos abiertos y una rodilla levantada!',
    icon: '🥋',
    difficulty: 'Experto',
    points: 1000,
    timeLimit: 15,
    holdDuration: 1.5,
    targetAngles: {
      left_shoulder: { angle: 105, tolerance: 25, weight: 1.0 },
      right_shoulder: { angle: 105, tolerance: 25, weight: 1.0 },
      left_elbow: { angle: 140, tolerance: 30, weight: 1.0 },
      right_elbow: { angle: 140, tolerance: 30, weight: 1.0 },
      right_knee: { angle: 95, tolerance: 30, weight: 1.5 }
    },
    rules: [
      { name: 'Pierna flexionada arriba', check: (angles) => angles.right_knee < 125 }
    ],
    svgPath: `
      <circle cx="100" cy="45" r="16" fill="currentColor"/>
      <line x1="100" y1="61" x2="100" y2="125" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Brazos curvados en alas -->
      <path d="M 35 45 Q 60 70 100 75 Q 140 70 165 45" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <!-- Pierna de apoyo y pierna doblada -->
      <line x1="100" y1="125" x2="100" y2="190" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <path d="M 100 125 L 135 145 L 120 175" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    `
  }
];
