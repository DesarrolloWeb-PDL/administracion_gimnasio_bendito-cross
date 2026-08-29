import { NextRequest, NextResponse } from 'next/server';

interface ExerciseDBExercise {
  id: string;
  name: string;
  gifUrl: string;
  muscleGroup: string;
  equipment: string;
  source: 'exerciseDB';
}

interface CrossFitExercise {
  id: string;
  name: string;
  videoUrl: string;
  source: 'crossfit';
}

interface CacheEntry {
  data: ExerciseDBExercise[];
  timestamp: number;
}

// In-memory cache: query → { data, timestamp }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// 23 local CrossFit exercises
const CROSSFIT_EXERCISES: CrossFitExercise[] = [
  { id: 'cf-001', name: 'Air Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-002', name: 'Back Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-003', name: 'Clean', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-004', name: 'Clean and Jerk', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-005', name: 'Deadlift', videoUrl: 'https://www.youtube.com/embed/op9kVnSo2Wc', source: 'crossfit' },
  { id: 'cf-006', name: 'Front Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-007', name: 'Hang Clean', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-008', name: 'Hang Snatch', videoUrl: 'https://www.youtube.com/embed/RE5Qjd4YB5c', source: 'crossfit' },
  { id: 'cf-009', name: 'Jerk', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-010', name: 'Muscle-Up', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-011', name: 'Overhead Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-012', name: 'Power Clean', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-013', name: 'Power Snatch', videoUrl: 'https://www.youtube.com/embed/RE5Qjd4YB5c', source: 'crossfit' },
  { id: 'cf-014', name: 'Push Jerk', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-015', name: 'Push Press', videoUrl: 'https://www.youtube.com/embed/A_oNig2bnp8', source: 'crossfit' },
  { id: 'cf-016', name: 'Snatch', videoUrl: 'https://www.youtube.com/embed/RE5Qjd4YB5c', source: 'crossfit' },
  { id: 'cf-017', name: 'Snatch Balance', videoUrl: 'https://www.youtube.com/embed/RE5Qjd4YB5c', source: 'crossfit' },
  { id: 'cf-018', name: 'Thruster', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-019', name: 'Toes to Bar', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-020', name: 'Wall Ball', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g', source: 'crossfit' },
  { id: 'cf-021', name: 'Box Jump', videoUrl: 'https://www.youtube.com/embed/op9kVnSo2Wc', source: 'crossfit' },
  { id: 'cf-022', name: 'Burpee', videoUrl: 'https://www.youtube.com/embed/op9kVnSo2Wc', source: 'crossfit' },
  { id: 'cf-023', name: 'Double Under', videoUrl: 'https://www.youtube.com/embed/op9kVnSo2Wc', source: 'crossfit' },
];

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fetchExerciseDB(query: string): Promise<ExerciseDBExercise[]> {
  const cacheKey = `edb:${normalizeQuery(query)}`;
  const cached = cache.get(cacheKey);

  // Return cache if valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`ExerciseDB returned ${response.status}`);
      // Return cached data if available, even if stale
      return cached?.data ?? [];
    }

    const raw = await response.json();

    // ExerciseDB returns an array of exercises
    const exercises: ExerciseDBExercise[] = Array.isArray(raw)
      ? raw.map((ex: Record<string, unknown>) => ({
          id: String(ex.id ?? ''),
          name: String(ex.name ?? ''),
          gifUrl: String(ex.gifUrl ?? ''),
          muscleGroup: String(ex.bodyPart ?? ex.muscleGroup ?? ''),
          equipment: String(ex.equipment ?? ''),
          source: 'exerciseDB' as const,
        }))
      : [];

    // Update cache
    cache.set(cacheKey, { data: exercises, timestamp: Date.now() });

    return exercises;
  } catch (error) {
    console.error('ExerciseDB fetch error:', error);
    // Return stale cache if available
    return cached?.data ?? [];
  }
}

function searchCrossFit(query: string): CrossFitExercise[] {
  if (!query) return CROSSFIT_EXERCISES;

  const normalized = normalizeQuery(query);
  return CROSSFIT_EXERCISES.filter((ex) =>
    ex.name.toLowerCase().includes(normalized)
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // exerciseDB | crossfit | all

    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      return NextResponse.json(
        { error: 'Se requiere un término de búsqueda (?q=)' },
        { status: 400 }
      );
    }

    let exerciseDBResults: ExerciseDBExercise[] = [];
    let crossfitResults: CrossFitExercise[] = [];
    let partial = false;

    if (type === 'exerciseDB' || type === 'all') {
      exerciseDBResults = await fetchExerciseDB(normalizedQuery);
    }

    if (type === 'crossfit' || type === 'all') {
      crossfitResults = searchCrossFit(normalizedQuery);
    }

    // If ExerciseDB failed and we have no crossfit results, flag as partial
    if (exerciseDBResults.length === 0 && type === 'all') {
      partial = true;
    }

    const results = [
      ...exerciseDBResults,
      ...crossfitResults,
    ];

    return NextResponse.json({
      results,
      partial,
      counts: {
        exerciseDB: exerciseDBResults.length,
        crossfit: crossfitResults.length,
        total: results.length,
      },
    });
  } catch (error) {
    console.error('Error in exercise search:', error);
    return NextResponse.json(
      { error: 'Error al buscar ejercicios', results: [], partial: true, counts: { exerciseDB: 0, crossfit: 0, total: 0 } },
      { status: 500 }
    );
  }
}
