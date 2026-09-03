import { NextRequest, NextResponse } from 'next/server';
import { translateExerciseName, translateBodyPart, translateMuscle, translateEquipment, BODY_PART_ES } from '@/lib/exercise-translations';

// CrossFit exercises (local)
const CROSSFIT_EXERCISES = [
  { id: 'cf-001', name: 'Air Squat', esName: 'Sentadilla al aire', videoUrl: 'https://www.youtube.com/embed/C_VtOYc6j5c' },
  { id: 'cf-002', name: 'Back Squat', esName: 'Sentadilla trasera', videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8' },
  { id: 'cf-003', name: 'Thruster', esName: 'Thrusters', videoUrl: 'https://www.youtube.com/embed/tZkUDLNNY40' },
  { id: 'cf-004', name: 'Wall Ball', esName: 'Wall balls', videoUrl: 'https://www.youtube.com/embed/EqjGKsiIMCE' },
  { id: 'cf-005', name: 'Box Jump', esName: 'Salto al cajón', videoUrl: 'https://www.youtube.com/embed/hxldG9FX4j4' },
  { id: 'cf-006', name: 'Front Squat', esName: 'Sentadilla frontal', videoUrl: 'https://www.youtube.com/embed/m4ytaCJZpl0' },
  { id: 'cf-007', name: 'Clean', esName: 'Cargada', videoUrl: 'https://www.youtube.com/embed/8miqQQJEsO0' },
  { id: 'cf-008', name: 'Snatch', esName: 'Arrancada', videoUrl: 'https://www.youtube.com/embed/z7DU830K2SM' },
  { id: 'cf-009', name: 'Deadlift', esName: 'Peso muerto', videoUrl: 'https://www.youtube.com/embed/Vj4NP-oqAZ8' },
  { id: 'cf-010', name: 'Clean and Jerk', esName: 'Cargada y jerk', videoUrl: 'https://www.youtube.com/embed/9HyWjAk7fhY' },
  { id: 'cf-011', name: 'Overhead Squat', esName: 'Sentadilla por encima', videoUrl: 'https://www.youtube.com/embed/uabFHXlyQpI' },
  { id: 'cf-012', name: 'Push Press', esName: 'Press con impulso', videoUrl: 'https://www.youtube.com/embed/Wqq4JBOJeKQ' },
  { id: 'cf-013', name: 'Shoulder Press', esName: 'Press de hombros', videoUrl: 'https://www.youtube.com/embed/Q0M-VXJtVUI' },
  { id: 'cf-014', name: 'Push Jerk', esName: 'Push jerk', videoUrl: 'https://www.youtube.com/embed/v_0E1udYSnQ' },
  { id: 'cf-015', name: 'Split Jerk', esName: 'Split jerk', videoUrl: 'https://www.youtube.com/embed/WhqUzVtVQI4' },
  { id: 'cf-016', name: 'Sumo Deadlift', esName: 'Peso muerto sumo', videoUrl: 'https://www.youtube.com/embed/GZIfh5DPaJM' },
  { id: 'cf-017', name: 'Burpee', esName: 'Burpees', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/burpee.gif', videoUrl: 'https://www.youtube.com/embed/7mj1pP0Xds8' },
  { id: 'cf-018', name: 'Pull-up', esName: 'Dominadas', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif', videoUrl: 'https://www.youtube.com/embed/lzRo-4pq_AY' },
  { id: 'cf-019', name: 'Push-up', esName: 'Flexiones', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/push-up.gif', videoUrl: 'https://www.youtube.com/embed/_l3ySVKYVJ8' },
  { id: 'cf-020', name: 'Toes-to-Bar', esName: 'Dedos a la barra', videoUrl: 'https://www.youtube.com/embed/_03pCKOv4l4' },
  { id: 'cf-021', name: 'Muscle-up', esName: 'Muscle up', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/muscle-up.gif', videoUrl: 'https://www.youtube.com/embed/7r-RNDu3dIc' },
  { id: 'cf-022', name: 'Handstand Push-up', esName: 'Flexiones en parada de manos', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif', videoUrl: 'https://www.youtube.com/embed/YdBSefJNbB8' },
  { id: 'cf-023', name: 'Kettlebell Swing', esName: 'Balanceo con kettlebell', gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/kettlebell-swing.gif', videoUrl: 'https://www.youtube.com/embed/YSxHifyx6-s' },
];

const CSV_URL = 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.csv';
const GIF_BASE = 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/';

interface CsvExercise {
  id: string;
  name: string;
  esName: string;
  bodyPart: string;
  bodyPartEs: string;
  equipment: string;
  equipmentEs: string;
  target: string;
  targetEs: string;
  gifUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedExercises: CsvExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { fields.push(current); current = ''; continue; }
    current += char;
  }
  fields.push(current);
  return fields;
}

async function loadExercises(): Promise<CsvExercise[]> {
  if (cachedExercises && Date.now() - cacheTime < CACHE_TTL) {
    return cachedExercises;
  }

  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    
    const text = await res.text();
    const lines = text.split('\n');
    
    const exercises: CsvExercise[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = parseCsvLine(line);
      if (fields.length < 5) continue;
      
      const [bodyPart, equipment, id, name, target] = fields;
      
      exercises.push({
        id,
        name,
        esName: translateExerciseName(name),
        bodyPart: bodyPart || '',
        bodyPartEs: translateBodyPart(bodyPart || ''),
        equipment: equipment || '',
        equipmentEs: translateEquipment(equipment || ''),
        target: target || '',
        targetEs: translateMuscle(target || ''),
        gifUrl: `${GIF_BASE}${id}.gif`,
      });
    }

    cachedExercises = exercises;
    cacheTime = Date.now();
    return exercises;
  } catch (error) {
    console.error('Failed to load exercises CSV:', error);
    return cachedExercises || [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const groupBy = searchParams.get('groupBy') || '';

  // If query is empty, return all exercises (for sidebar initial load)
  const showAll = !query || query.length < 1;
  const limit = parseInt(searchParams.get('limit') || (showAll ? '2000' : '20'));

  const lowerQuery = query.toLowerCase();
  const exercises = await loadExercises();

  const results: Array<{
    id: string;
    name: string;
    esName: string;
    muscleGroup: string;
    muscleGroupEs: string;
    equipment: string;
    equipmentEs: string;
    bodyPart: string;
    bodyPartEs: string;
    gifUrl: string;
    videoUrl?: string;
    source: 'exercisedb' | 'crossfit';
  }> = [];

  // Search musculación exercises (from CSV)
  if (type === 'all' || type === 'exerciseDB') {
    const matches = exercises
      .filter(ex => {
        if (showAll) return true;
        const searchText = `${ex.name} ${ex.esName} ${ex.target} ${ex.targetEs} ${ex.bodyPart} ${ex.bodyPartEs} ${ex.equipment} ${ex.equipmentEs}`.toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, limit)
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        esName: ex.esName,
        muscleGroup: ex.target || ex.bodyPart || '',
        muscleGroupEs: ex.targetEs || ex.bodyPartEs || '',
        equipment: ex.equipment || '',
        equipmentEs: ex.equipmentEs || '',
        bodyPart: ex.bodyPart || '',
        bodyPartEs: ex.bodyPartEs || '',
        gifUrl: ex.gifUrl,
        source: 'exercisedb' as const,
      }));
    results.push(...matches);
  }

  // Search CrossFit exercises
  if (type === 'all' || type === 'crossfit') {
    const matches = CROSSFIT_EXERCISES
      .filter(ex => {
        if (showAll) return true;
        const searchText = `${ex.name} ${ex.esName}`.toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, limit)
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        esName: ex.esName,
        muscleGroup: '',
        muscleGroupEs: '',
        equipment: '',
        equipmentEs: '',
        bodyPart: '',
        bodyPartEs: '',
        gifUrl: '',
        videoUrl: ex.videoUrl,
        source: 'crossfit' as const,
      }));
    results.push(...matches);
  }

  // Group by body part if requested
  if (groupBy === 'bodyPart') {
    const grouped: Record<string, typeof results> = {};
    for (const ex of results) {
      const key = ex.bodyPartEs || ex.muscleGroupEs || 'Otros';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ex);
    }
    return NextResponse.json({
      grouped,
      results: results.slice(0, limit),
      partial: results.length > limit,
      counts: {
        exercisedb: results.filter(r => r.source === 'exercisedb').length,
        crossfit: results.filter(r => r.source === 'crossfit').length,
        total: results.length,
      },
    });
  }

  return NextResponse.json({
    results: results.slice(0, limit),
    partial: results.length > limit,
    counts: {
      exercisedb: results.filter(r => r.source === 'exercisedb').length,
      crossfit: results.filter(r => r.source === 'crossfit').length,
      total: results.length,
    },
  });
}
