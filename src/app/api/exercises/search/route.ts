import { NextRequest, NextResponse } from 'next/server';
import { translateExerciseName, translateBodyPart, translateMuscle, translateEquipment, BODY_PART_ES } from '@/lib/exercise-translations';

// CrossFit exercises (local) — GIFs from ExerciseGymGifsDB
const GIF_CDN = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';
const CROSSFIT_EXERCISES = [
  { id: 'cf-001', name: 'Air Squat', esName: 'Sentadilla al aire', gifUrl: `${GIF_CDN}/quads/barbell-squat-on-knees.gif` },
  { id: 'cf-002', name: 'Back Squat', esName: 'Sentadilla trasera', gifUrl: `${GIF_CDN}/glutes/barbell-front-squat.gif` },
  { id: 'cf-003', name: 'Thruster', esName: 'Thrusters', gifUrl: `${GIF_CDN}/delts/barbell-thruster.gif` },
  { id: 'cf-004', name: 'Wall Ball', esName: 'Wall balls', gifUrl: `${GIF_CDN}/delts/kettlebell-thruster.gif` },
  { id: 'cf-005', name: 'Box Jump', esName: 'Salto al cajón', gifUrl: `${GIF_CDN}/calves/box-jump-down-with-one-leg-stabilization.gif` },
  { id: 'cf-006', name: 'Front Squat', esName: 'Sentadilla frontal', gifUrl: `${GIF_CDN}/glutes/barbell-front-squat.gif` },
  { id: 'cf-007', name: 'Clean', esName: 'Cargada', gifUrl: `${GIF_CDN}/quads/barbell-clean-and-press.gif` },
  { id: 'cf-008', name: 'Snatch', esName: 'Arrancada', gifUrl: `${GIF_CDN}/delts/barbell-thruster.gif` },
  { id: 'cf-009', name: 'Deadlift', esName: 'Peso muerto', gifUrl: `${GIF_CDN}/glutes/barbell-deadlift.gif` },
  { id: 'cf-010', name: 'Clean and Jerk', esName: 'Cargada y jerk', gifUrl: `${GIF_CDN}/quads/barbell-clean-and-press.gif` },
  { id: 'cf-011', name: 'Overhead Squat', esName: 'Sentadilla por encima', gifUrl: `${GIF_CDN}/quads/barbell-overhead-squat.gif` },
  { id: 'cf-012', name: 'Push Press', esName: 'Press con impulso', gifUrl: `${GIF_CDN}/delts/dumbbell-push-press.gif` },
  { id: 'cf-013', name: 'Shoulder Press', esName: 'Press de hombros', gifUrl: `${GIF_CDN}/delts/dumbbell-seated-shoulder-press.gif` },
  { id: 'cf-014', name: 'Push Jerk', esName: 'Push jerk', gifUrl: `${GIF_CDN}/delts/kettlebell-double-push-press.gif` },
  { id: 'cf-015', name: 'Split Jerk', esName: 'Split jerk', gifUrl: `${GIF_CDN}/delts/dumbbell-push-press.gif` },
  { id: 'cf-016', name: 'Sumo Deadlift', esName: 'Peso muerto sumo', gifUrl: `${GIF_CDN}/glutes/barbell-sumo-deadlift.gif` },
  { id: 'cf-017', name: 'Burpee', esName: 'Burpees', gifUrl: `${GIF_CDN}/cardio/burpee.gif` },
  { id: 'cf-018', name: 'Pull-up', esName: 'Dominadas', gifUrl: `${GIF_CDN}/lats/pull-up.gif` },
  { id: 'cf-019', name: 'Push-up', esName: 'Flexiones', gifUrl: `${GIF_CDN}/pectorals/push-up.gif` },
  { id: 'cf-020', name: 'Toes-to-Bar', esName: 'Dedos a la barra', gifUrl: `${GIF_CDN}/lats/l-pull-up.gif` },
  { id: 'cf-021', name: 'Muscle-up', esName: 'Muscle up', gifUrl: `${GIF_CDN}/lats/muscle-up.gif` },
  { id: 'cf-022', name: 'Handstand Push-up', esName: 'Flexiones en parada de manos', gifUrl: `${GIF_CDN}/triceps/handstand-push-up.gif` },
  { id: 'cf-023', name: 'Kettlebell Swing', esName: 'Balanceo con kettlebell', gifUrl: `${GIF_CDN}/glutes/kettlebell-swing.gif` },
];

const CSV_URL = 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.csv';
const GIF_BASE = 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/';
const CSTR_URL = 'https://raw.githubusercontent.com/DaveG7/CostruTrain/main/assets/seed/exercises.json';

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

interface CstrExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
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
    // Load CSV exercises
    const csvRes = await fetch(CSV_URL, { next: { revalidate: 300 } });
    if (!csvRes.ok) throw new Error(`CSV fetch failed: ${csvRes.status}`);
    
    const csvText = await csvRes.text();
    const csvLines = csvText.split('\n');
    
    const csvExercises: CsvExercise[] = [];
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i].trim();
      if (!line) continue;
      
      const fields = parseCsvLine(line);
      if (fields.length < 5) continue;
      
      const [bodyPart, equipment, id, name, target] = fields;
      
      csvExercises.push({
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

    // Load CostruTrain exercises
    let cstrExercises: CsvExercise[] = [];
    try {
      const cstrRes = await fetch(CSTR_URL, { next: { revalidate: 300 } });
      if (cstrRes.ok) {
        const cstrData: CstrExercise[] = await cstrRes.json();
        cstrExercises = cstrData.map(ex => ({
          id: `cstr-${ex.id}`,
          name: ex.name,
          esName: translateExerciseName(ex.name),
          bodyPart: ex.bodyPart || '',
          bodyPartEs: translateBodyPart(ex.bodyPart || ''),
          equipment: ex.equipment || '',
          equipmentEs: translateEquipment(ex.equipment || ''),
          target: ex.target || '',
          targetEs: translateMuscle(ex.target || ''),
          gifUrl: ex.gifUrl,
        }));
      }
    } catch (cstrError) {
      console.error('Failed to load CostruTrain exercises:', cstrError);
    }

    // Merge and deduplicate by name (case-insensitive)
    const allExercises = [...csvExercises, ...cstrExercises];
    const seen = new Set<string>();
    const merged: CsvExercise[] = [];
    
    for (const ex of allExercises) {
      const key = ex.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(ex);
      }
    }

    cachedExercises = merged;
    cacheTime = Date.now();
    return merged;
  } catch (error) {
    console.error('Failed to load exercises:', error);
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
        gifUrl: ex.gifUrl || '',
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
