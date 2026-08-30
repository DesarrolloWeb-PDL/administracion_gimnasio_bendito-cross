// Exercise name translations (English → Spanish)
// Grouped by body part for sidebar display

export const BODY_PART_ES: Record<string, string> = {
  'chest': 'Pecho',
  'back': 'Espalda',
  'shoulders': 'Hombros',
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  'upper legs': 'Piernas',
  'lower legs': 'Pantorrillas',
  'waist': 'Abdomen',
  'cardio': 'Cardio',
  'neck': 'Cuello',
};

export const MUSCLE_ES: Record<string, string> = {
  'pectorals': 'Pectorales',
  'lats': 'Dorsales',
  'delts': 'Deltoides',
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'forearms': 'Antebrazos',
  'quadriceps': 'Cuádriceps',
  'quads': 'Cuádriceps',
  'hamstrings': 'Isquiotibiales',
  'glutes': 'Glúteos',
  'calves': 'Gemelos',
  'abs': 'Abdominales',
  'obliques': 'Oblicuos',
  'traps': 'Trapecios',
  'shoulders': 'Hombros',
  'lower back': 'Espalda baja',
  'hip flexors': 'Flexores de cadera',
  'adductors': 'Aductores',
  'abductors': 'Abductores',
  'spine': 'Columna',
  'ankle stabilizers': 'Estabilizadores de tobillo',
  'ankles': 'Tobillos',
  'feet': 'Pies',
  'rhomboids': 'Romboides',
  'levator scapulae': 'Elevador de escápula',
  'serratus anterior': 'Serrato anterior',
  'middle back': 'Espalda media',
  'upper back': 'Espalda alta',
};

export const EQUIPMENT_ES: Record<string, string> = {
  'body weight': 'Peso corporal',
  'body only': 'Peso corporal',
  'barbell': 'Barra',
  'dumbbell': 'Mancuernas',
  'cable': 'Polea',
  'band': 'Banda elástica',
  'bands': 'Bandas elásticas',
  'kettlebell': 'Kettlebell',
  'kettlebells': 'Kettlebells',
  'machine': 'Máquina',
  'medicine ball': 'Balón medicinal',
  'stability ball': 'Fitball',
  'smith machine': 'Máquina Smith',
  'leverage machine': 'Máquina de palanca',
  'assisted': 'Asistido',
  'other': 'Otro',
  'none': 'Sin equipamiento',
  'foam roll': 'Rodillo de espuma',
  'exercise ball': 'Fitball',
  'ez barbell': 'Barra Z',
  'e-z curl bar': 'Barra Z',
  'olympic barbell': 'Barra olímpica',
  'trap bar': 'Barra hexagonal',
  'resistance band': 'Banda de resistencia',
  'bosu ball': 'Bosu ball',
  'rope': 'Cuerda',
  'hammer': 'Martillo',
  'roller': 'Rodillo',
  'wheel roller': 'Rueda abdominal',
  'tire': 'Neumático',
  'sled machine': 'Máquina de trineo',
  'skierg machine': 'Máquina SkiErg',
  'stationary bike': 'Bicicleta estática',
  'elliptical machine': 'Elíptica',
  'stepmill machine': 'Máquina Step',
  'upper body ergometer': 'Ergómetro tren superior',
  'weighted': 'Con peso',
};

// Common exercise name translations (no duplicates)
export const EXERCISE_NAME_ES: Record<string, string> = {
  // Chest
  'bench press': 'Press de banca',
  'incline bench press': 'Press inclinado',
  'decline bench press': 'Press declinado',
  'dumbbell press': 'Press con mancuernas',
  'chest fly': 'Aperturas',
  'cable fly': 'Aperturas en polea',
  'push up': 'Flexiones',
  'dip': 'Fondos',
  'chest dip': 'Fondos de pecho',
  'dumbbell fly': 'Aperturas con mancuernas',
  'pec deck': 'Mariposa',
  'cable crossover': 'Cruce de poleas',
  'dumbbell pullover': 'Pullover con mancuerna',
  'barbell pullover': 'Pullover con barra',
  'close grip bench press': 'Press agarre cerrado',
  
  // Back
  'barbell row': 'Remo con barra',
  'dumbbell row': 'Remo con mancuerna',
  'cable row': 'Remo en polea',
  'lat pulldown': 'Jalón al pecho',
  'pull up': 'Dominadas',
  'chin up': 'Dominadas supinas',
  'bent over row': 'Remo inclinado',
  't bar row': 'Remo en T',
  'seated row': 'Remo sentado',
  'one arm dumbbell row': 'Remo a una mano',
  'straight arm pulldown': 'Jalón brazos rectos',
  'rack pull': 'Rack pull',
  'shrugs': 'Encogimientos',
  'shrug': 'Encogimientos',
  'good morning': 'Buenos días',
  'hyper extension': 'Hiperextensiones',
  
  // Shoulders
  'overhead press': 'Press militar',
  'shoulder press': 'Press de hombros',
  'lateral raise': 'Elevaciones laterales',
  'front raise': 'Elevaciones frontales',
  'rear delt fly': 'Elevaciones posteriores',
  'face pull': 'Jalón a la cara',
  'upright row': 'Remo al mentón',
  
  // Arms
  'bicep curl': 'Curl de bíceps',
  'hammer curl': 'Curl martillo',
  'preacher curl': 'Curl en banco scott',
  'tricep extension': 'Extensión de tríceps',
  'tricep pushdown': 'Press de tríceps',
  'skull crusher': 'Extensión en nuca',
  'skull crushers': 'Extensión en nuca',
  'drag curl': 'Curl arrastrado',
  'concentration curl': 'Curl concentrado',
  'spider curl': 'Curl spider',
  'wrist curl': 'Curl de muñecas',
  'reverse wrist curl': 'Curl inverso de muñecas',
  'barbell curl': 'Curl con barra',
  'incline curl': 'Curl inclinado',
  'cable curl': 'Curl en polea',
  'overhead tricep extension': 'Extensión sobre la cabeza',
  'tricep kickback': 'Extensiones posteriores',
  
  // Legs
  'squat': 'Sentadilla',
  'front squat': 'Sentadilla frontal',
  'back squat': 'Sentadilla trasera',
  'goblet squat': 'Sentadilla goblet',
  'leg press': 'Prensa de piernas',
  'leg extension': 'Extensión de piernas',
  'leg curl': 'Curl femoral',
  'deadlift': 'Peso muerto',
  'romanian deadlift': 'Peso muerto rumano',
  'sumo deadlift': 'Peso muerto sumo',
  'hip thrust': 'Hip thrust',
  'glute bridge': 'Puente de glúteos',
  'lunges': 'Zancadas',
  'step up': 'Step ups',
  'calf raise': 'Elevación de pantorrillas',
  'pistol squat': 'Sentadilla pistola',
  'wall sit': 'Sentadilla en pared',
  'glute ham raise': 'Elevación de glúteo isquiotibial',
  'nordic hamstring': 'Nórdico de isquiotibiales',
  'reverse hyper': 'Hiper inverso',
  'front rack lunge': 'Zancada frontal',
  
  // Abs
  'crunch': 'Abdominales',
  'sit up': 'Sentadillas abdominales',
  'leg raise': 'Elevación de piernas',
  'plank': 'Plancha',
  'russian twist': 'Giros rusos',
  'mountain climbers': 'Escaladores',
  'ab wheel': 'Rueda abdominal',
  'hanging knee raise': 'Elevación de rodillas colgando',
  'hanging leg raise': 'Elevación de piernas colgando',
  'v up': 'Abdominales en V',
  'butterfly sit up': 'Abdominales mariposa',
  'hollow rock': 'Balanceo hueco',
  'superman': 'Superman',
  'bird dog': 'Perro pájaro',
  'dead bug': 'Bicho muerto',
  'side plank': 'Plancha lateral',
  'pallof press': 'Press Pallof',
  
  // CrossFit
  'burpee': 'Burpees',
  'box jump': 'Salto al cajón',
  'thruster': 'Thrusters',
  'wall ball': 'Wall balls',
  'clean': 'Cargada',
  'snatch': 'Arrancada',
  'jerk': 'Jerk',
  'push press': 'Press con impulso',
  'push jerk': 'Push jerk',
  'split jerk': 'Split jerk',
  'kettlebell swing': 'Balanceo con kettlebell',
  'toes to bar': 'Dedos a la barra',
  'muscle up': 'Muscle up',
  'handstand push up': 'Flexiones en parada de manos',
  'air squat': 'Sentadilla al aire',
  'overhead squat': 'Sentadilla por encima',
  'clean and jerk': 'Cargada y jerk',
  'power clean': 'Cargada de potencia',
  'hang clean': 'Cargada colgando',
  'hang snatch': 'Arrancada colgando',
  'power snatch': 'Arrancada de potencia',
  'muscle snatch': 'Arrancada muscular',
  'snatch grip high pull': 'Jalón alto agarre snatch',
  
  // Cardio/Carry
  'farmers walk': 'Caminata del granjero',
  'suitcase carry': 'Caminata maletín',
  'overhead carry': 'Caminata sobre la cabeza',
  'waiters walk': 'Caminata del mesero',
};

/**
 * Translate an exercise name to Spanish
 */
export function translateExerciseName(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Check exact match first
  if (EXERCISE_NAME_ES[lower]) {
    return EXERCISE_NAME_ES[lower];
  }
  
  // Check partial matches
  for (const [en, es] of Object.entries(EXERCISE_NAME_ES)) {
    if (lower.includes(en) || en.includes(lower)) {
      return es;
    }
  }
  
  // Return original if no translation found
  return name;
}

/**
 * Get Spanish body part name
 */
export function translateBodyPart(bodyPart: string): string {
  return BODY_PART_ES[bodyPart.toLowerCase()] || bodyPart;
}

/**
 * Get Spanish muscle name
 */
export function translateMuscle(muscle: string): string {
  return MUSCLE_ES[muscle.toLowerCase()] || muscle;
}

/**
 * Get Spanish equipment name
 */
export function translateEquipment(equipment: string): string {
  return EQUIPMENT_ES[equipment.toLowerCase()] || equipment;
}

/**
 * Map body part to musculación section
 */
export function bodyPartToSection(bodyPart: string): 'superiores' | 'zona_media' | 'inferiores' {
  const bp = bodyPart.toLowerCase();
  
  if (['chest', 'back', 'shoulders', 'upper arms', 'lower arms'].includes(bp)) {
    return 'superiores';
  }
  if (['waist'].includes(bp)) {
    return 'zona_media';
  }
  if (['upper legs', 'lower legs'].includes(bp)) {
    return 'inferiores';
  }
  
  return 'superiores'; // default
}
