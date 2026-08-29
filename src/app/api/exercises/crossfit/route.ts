import { NextRequest, NextResponse } from 'next/server';

interface CrossFitExercise {
  id: string;
  name: string;
  videoUrl: string;
  source: 'crossfit';
}

// 23 local CrossFit exercises from benditocross.vercel.app
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim() || '';

    let exercises = CROSSFIT_EXERCISES;

    // Filter by search query if provided
    if (query) {
      exercises = exercises.filter((ex) =>
        ex.name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching CrossFit exercises:', error);
    return NextResponse.json(
      { error: 'Error al obtener ejercicios CrossFit' },
      { status: 500 }
    );
  }
}
