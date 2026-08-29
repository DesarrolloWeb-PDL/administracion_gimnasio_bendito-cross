'use client';

import { type Exercise } from './exercise-card';

export interface ExerciseEntry {
  exerciseId: string;
  nombre: string;
  repeticiones?: string;
  notas?: string;
  gifUrl?: string;
  videoUrl?: string;
  muscleGroup?: string;
  equipment?: string;
  orden?: number;
}

interface RoutineSectionProps {
  title: string;
  exercises: ExerciseEntry[];
  tipo: 'crossfit' | 'musculacion';
  onAdd: (entry: ExerciseEntry) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (index: number, updates: Partial<ExerciseEntry>) => void;
}

export default function RoutineSection({
  title,
  exercises,
  tipo,
  onAdd,
  onRemove,
  onReorder,
  onUpdate,
}: RoutineSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h4>
        {exercises.length > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {exercises.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">
          Sin ejercicios
        </p>
      ) : (
        <div className="space-y-2">
          {exercises.map((entry, index) => (
            <div
              key={`${entry.exerciseId}-${index}`}
              className="flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => index > 0 && onReorder(index, index - 1)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 text-[10px] leading-none"
                  title="Mover arriba"
                >
                  ▲
                </button>
                <button
                  onClick={() => index < exercises.length - 1 && onReorder(index, index + 1)}
                  disabled={index === exercises.length - 1}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 text-[10px] leading-none"
                  title="Mover abajo"
                >
                  ▼
                </button>
              </div>

              {/* GIF thumbnail */}
              {entry.gifUrl && (
                <img
                  src={entry.gifUrl}
                  alt={entry.nombre}
                  className="h-10 w-10 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700"
                  loading="lazy"
                />
              )}

              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {entry.nombre}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={entry.repeticiones || ''}
                    onChange={(e) => onUpdate(index, { repeticiones: e.target.value })}
                    placeholder="Reps (ej: 3x10)"
                    className="w-24 text-xs rounded border border-gray-200 dark:border-gray-600 bg-transparent px-1.5 py-0.5 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    value={entry.notas || ''}
                    onChange={(e) => onUpdate(index, { notas: e.target.value })}
                    placeholder="Notas"
                    className="flex-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-transparent px-1.5 py-0.5 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-600 text-sm flex-shrink-0 ml-1"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
