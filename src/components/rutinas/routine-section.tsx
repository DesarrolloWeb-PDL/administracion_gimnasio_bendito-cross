'use client';

import { useRef, useCallback } from 'react';
import type { Exercise } from './exercise-card';

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
  dropDia?: string;
  dropSection?: string;
  onDropExercise: (exercise: Exercise) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (index: number, updates: Partial<ExerciseEntry>) => void;
}

export default function RoutineSection({
  title,
  exercises,
  tipo,
  dropDia,
  dropSection,
  onDropExercise,
  onRemove,
  onReorder,
  onUpdate,
}: RoutineSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // HTML5 Drag & Drop — desktop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = sectionRef.current;
    if (el) el.classList.remove('ring-2', 'ring-[var(--primary-color)]', 'bg-[var(--primary-color)]/10');

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.id) {
        onDropExercise(data as Exercise);
      }
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  }, [onDropExercise]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = sectionRef.current;
    if (el) el.classList.add('ring-2', 'ring-[var(--primary-color)]', 'bg-[var(--primary-color)]/10');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    const el = sectionRef.current;
    if (el) el.classList.remove('ring-2', 'ring-[var(--primary-color)]', 'bg-[var(--primary-color)]/10');
  }, []);

  return (
    <div
      ref={sectionRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-drop-dia={dropDia}
      data-drop-section={dropSection}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h4>
        {exercises.length > 0 ? (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--primary-color)] italic">Arrastrá aquí</span>
        )}
      </div>

      {exercises.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">Sin ejercicios</p>
      ) : (
        <div className="space-y-2">
          {exercises.map((entry, index) => (
            <div
              key={`${entry.exerciseId}-${index}`}
              className="flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => index > 0 && onReorder(index, index - 1)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 text-[10px] leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => index < exercises.length - 1 && onReorder(index, index + 1)}
                  disabled={index === exercises.length - 1}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 text-[10px] leading-none"
                >
                  ▼
                </button>
              </div>

              {entry.gifUrl && (
                <img src={entry.gifUrl} alt={entry.nombre} className="h-10 w-10 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700" loading="lazy" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{entry.nombre}</p>
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

              <button
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-600 text-sm flex-shrink-0 ml-1"
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
