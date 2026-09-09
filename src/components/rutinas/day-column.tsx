'use client';

import { useState } from 'react';
import RoutineSection, { type ExerciseEntry } from './routine-section';

export interface RoutineDay {
  activacion: ExerciseEntry[];
  entrada_calor: ExerciseEntry[];
  trabajos_dia: ExerciseEntry[];
  wod_dia: ExerciseEntry[];
  superiores?: ExerciseEntry[];
  zona_media?: ExerciseEntry[];
  inferiores?: ExerciseEntry[];
}

const EMPTY_DAY: RoutineDay = {
  activacion: [],
  entrada_calor: [],
  trabajos_dia: [],
  wod_dia: [],
  superiores: [],
  zona_media: [],
  inferiores: [],
};

const CROSSFIT_SECTIONS = ['activacion', 'entrada_calor', 'trabajos_dia', 'wod_dia'] as const;
const CROSSFIT_TITLES: Record<string, string> = {
  activacion: 'Activación',
  entrada_calor: 'Entrada en calor',
  trabajos_dia: 'Trabajos del día',
  wod_dia: 'WOD del día',
};

const MUSCULACION_SECTIONS = ['activacion', 'entrada_calor', 'superiores', 'zona_media', 'inferiores'] as const;
const MUSCULACION_TITLES: Record<string, string> = {
  activacion: 'Activación',
  entrada_calor: 'Entrada en calor',
  superiores: 'Superiores',
  zona_media: 'Zona Media',
  inferiores: 'Inferiores',
};

interface DayColumnProps {
  dia: string;
  diaLabel: string;
  routineDay?: RoutineDay;
  tipo: 'crossfit' | 'musculacion';
  onAddExercise: (dia: string, section: string, entry: ExerciseEntry) => void;
  onRemoveExercise: (dia: string, section: string, index: number) => void;
  onReorderExercise: (dia: string, section: string, fromIndex: number, toIndex: number) => void;
  onUpdateExercise: (dia: string, section: string, index: number, updates: Partial<ExerciseEntry>) => void;
}

export default function DayColumn({
  dia,
  diaLabel,
  routineDay,
  tipo,
  onAddExercise,
  onRemoveExercise,
  onReorderExercise,
  onUpdateExercise,
}: DayColumnProps) {
  const day = routineDay || EMPTY_DAY;
  const isCrossfit = tipo === 'crossfit';
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const sections = isCrossfit ? CROSSFIT_SECTIONS : MUSCULACION_SECTIONS;
  const titles = isCrossfit ? CROSSFIT_TITLES : MUSCULACION_TITLES;

  // Count total exercises in this day
  const totalExercises = sections.reduce((sum, key) => {
    const exerciseKey = key as keyof RoutineDay;
    return sum + (day[exerciseKey]?.length || 0);
  }, 0);

  // Handle drop on the entire day — routes to first section with exercises, or first section
  const handleDayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.id) {
        // Find first section with fewer exercises, or first section
        let targetSection: string = sections[0];
        let minCount = Infinity;
        for (const s of sections) {
          const count = (day[s as keyof RoutineDay] || []).length;
          if (count < minCount) {
            minCount = count;
            targetSection = s;
          }
        }

        const entry: ExerciseEntry = {
          exerciseId: data.id,
          nombre: data.esName || data.name,
          gifUrl: data.gifUrl,
          videoUrl: data.videoUrl,
          muscleGroup: data.muscleGroupEs || data.muscleGroup,
          equipment: data.equipmentEs || data.equipment,
          orden: (day[targetSection as keyof RoutineDay] || []).length,
        };
        onAddExercise(dia, targetSection, entry);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDayDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOver(false);
  };

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      expanded
        ? dragOver
          ? 'border-[var(--primary-color)] shadow-lg ring-2 ring-[var(--primary-color)] ring-opacity-50'
          : 'border-[var(--primary-color)] shadow-lg'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    } bg-white dark:bg-gray-800`}>
      {/* Day header - clickable button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          expanded
            ? 'bg-[var(--primary-color)]'
            : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-lg transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <h3 className={`text-sm font-bold ${expanded ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
            {diaLabel}
          </h3>
        </div>
        {totalExercises > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            expanded
              ? 'bg-white/20 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {totalExercises}
          </span>
        )}
      </button>

      {/* Expanded content — entire area is drop target */}
      {expanded && (
        <div
          onDrop={handleDayDrop}
          onDragOver={handleDayDragOver}
          onDragLeave={handleDayDragLeave}
          className={`p-3 space-y-2 border-t transition-colors ${
            dragOver
              ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          {dragOver && (
            <div className="text-center text-xs text-[var(--primary-color)] font-medium py-1 border border-dashed border-[var(--primary-color)] rounded-lg bg-[var(--primary-color)]/5">
              Soltá aquí para agregar a {diaLabel}
            </div>
          )}
          {sections.map((key) => {
            const exerciseKey = key as keyof RoutineDay;
            return (
              <RoutineSection
                key={key}
                title={titles[key]}
                exercises={day[exerciseKey] || []}
                tipo={tipo}
                onAdd={(entry) => onAddExercise(dia, key, entry)}
                onRemove={(index) => onRemoveExercise(dia, key, index)}
                onReorder={(from, to) => onReorderExercise(dia, key, from, to)}
                onUpdate={(index, updates) => onUpdateExercise(dia, key, index, updates)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
