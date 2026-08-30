'use client';

export interface Exercise {
  id: string;
  name: string;
  esName?: string;
  gifUrl?: string;
  videoUrl?: string;
  muscleGroup?: string;
  muscleGroupEs?: string;
  equipment?: string;
  equipmentEs?: string;
  bodyPart?: string;
  bodyPartEs?: string;
  source: 'exerciseDB' | 'crossfit';
}

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  compact?: boolean;
}

export default function ExerciseCard({ exercise, onSelect, compact = false }: ExerciseCardProps) {
  const hasMedia = exercise.gifUrl || exercise.videoUrl;

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(exercise)}
        className={`
          flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 p-2 shadow-sm
          ${onSelect ? 'cursor-pointer hover:border-[var(--primary-color)] hover:shadow-md transition-all' : ''}
        `}
      >
        {exercise.gifUrl && (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="h-12 w-12 rounded object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        {exercise.videoUrl && (
          <div className="h-12 w-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">▶</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{exercise.name}</p>
          {exercise.muscleGroup && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{exercise.muscleGroup}</p>
          )}
        </div>
        <span className={`
          text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0
          ${exercise.source === 'crossfit'
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }
        `}>
          {exercise.source === 'crossfit' ? 'CF' : 'DB'}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect?.(exercise)}
      className={`
        rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800 overflow-hidden shadow-sm
        ${onSelect ? 'cursor-pointer hover:border-[var(--primary-color)] hover:shadow-md transition-all' : ''}
      `}
    >
      {hasMedia && (
        <div className="aspect-square bg-gray-100 dark:bg-gray-700">
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : exercise.videoUrl ? (
            <iframe
              src={exercise.videoUrl}
              title={exercise.name}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : null}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
            {exercise.name}
          </h3>
          <span className={`
            text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5
            ${exercise.source === 'crossfit'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }
          `}>
            {exercise.source === 'crossfit' ? 'CrossFit' : 'ExerciseDB'}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {exercise.muscleGroup && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {exercise.muscleGroup}
            </span>
          )}
          {exercise.equipment && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {exercise.equipment}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
