import { NextRequest, NextResponse } from 'next/server';
import exercisesData from '@/data/exercises.json';

// CrossFit exercises (local)
const CROSSFIT_EXERCISES = [
  { id: 'cf-001', name: 'Air Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g' },
  { id: 'cf-002', name: 'Back Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g' },
  { id: 'cf-003', name: 'Thruster', videoUrl: 'https://www.youtube.com/embed/tZkUDLNNY40' },
  { id: 'cf-004', name: 'Wall Ball', videoUrl: 'https://www.youtube.com/embed/52r_Ul5k03g' },
  { id: 'cf-005', name: 'Box Jump', videoUrl: 'https://www.youtube.com/embed/52r_Ul5k03g' },
  { id: 'cf-006', name: 'Front Squat', videoUrl: 'https://www.youtube.com/embed/E6VIIoGma_g' },
  { id: 'cf-007', name: 'Clean', videoUrl: 'https://www.youtube.com/embed/RuvEX5DeytA' },
  { id: 'cf-008', name: 'Snatch', videoUrl: 'https://www.youtube.com/embed/z7DU830K2SM' },
  { id: 'cf-009', name: 'Deadlift', videoUrl: 'https://www.youtube.com/embed/Vj4NP-oqAZ8' },
  { id: 'cf-010', name: 'Clean and Jerk', videoUrl: 'https://www.youtube.com/embed/RuvEX5DeytA' },
  { id: 'cf-011', name: 'Overhead Squat', videoUrl: 'https://www.youtube.com/embed/uabFHXlyQpI' },
  { id: 'cf-012', name: 'Push Press', videoUrl: 'https://www.youtube.com/embed/Wqq4JBOJeKQ' },
  { id: 'cf-013', name: 'Shoulder Press', videoUrl: 'https://www.youtube.com/embed/Q0M-VXJtVUI' },
  { id: 'cf-014', name: 'Push Jerk', videoUrl: 'https://www.youtube.com/embed/v_0E1udYSnQ' },
  { id: 'cf-015', name: 'Split Jerk', videoUrl: 'https://www.youtube.com/embed/WhqUzVtVQI4' },
  { id: 'cf-016', name: 'Sumo Deadlift', videoUrl: 'https://www.youtube.com/embed/GZIfh5DPaJM' },
  { id: 'cf-017', name: 'Burpee', videoUrl: 'https://www.youtube.com/embed/7mj1pP0Xds8' },
  { id: 'cf-018', name: 'Pull-up', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g' },
  { id: 'cf-019', name: 'Push-up', videoUrl: 'https://www.youtube.com/embed/0pkjOk0EiAk' },
  { id: 'cf-020', name: 'Toes-to-Bar', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g' },
  { id: 'cf-021', name: 'Muscle-up', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g' },
  { id: 'cf-022', name: 'Handstand Push-up', videoUrl: 'https://www.youtube.com/embed/0pkjOk0EiAk' },
  { id: 'cf-023', name: 'Kettlebell Swing', videoUrl: 'https://www.youtube.com/embed/YSxHifyx6-s' },
];

// Map local DB fields to our Exercise type
interface LocalExercise {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  images: string[];
}

function mapLocalExercise(ex: LocalExercise) {
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.target || ex.primaryMuscles?.[0] || ex.bodyPart || '',
    equipment: ex.equipment || '',
    gifUrl: ex.images?.[0] || '',
    source: 'exercisedb' as const,
  };
}

function mapCrossfitExercise(ex: typeof CROSSFIT_EXERCISES[0]) {
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: '',
    equipment: '',
    gifUrl: '',
    videoUrl: ex.videoUrl,
    source: 'crossfit' as const,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], partial: false, counts: { exercisedb: 0, crossfit: 0, total: 0 } });
  }

  const lowerQuery = query.toLowerCase();

  const results: Array<{
    id: string;
    name: string;
    muscleGroup?: string;
    equipment?: string;
    gifUrl?: string;
    videoUrl?: string;
    source: 'exercisedb' | 'crossfit';
  }> = [];

  // Search local exercise DB (musculación)
  if (type === 'all' || type === 'exerciseDB') {
    const exercises = (exercisesData as { exercises: LocalExercise[] }).exercises || [];
    const matches = exercises
      .filter(ex => {
        const searchText = `${ex.name} ${ex.primaryMuscles?.join(' ')} ${ex.equipment} ${ex.bodyPart}`.toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, limit)
      .map(mapLocalExercise);
    results.push(...matches);
  }

  // Search CrossFit exercises
  if (type === 'all' || type === 'crossfit') {
    const matches = CROSSFIT_EXERCISES
      .filter(ex => ex.name.toLowerCase().includes(lowerQuery))
      .slice(0, limit)
      .map(mapCrossfitExercise);
    results.push(...matches);
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
