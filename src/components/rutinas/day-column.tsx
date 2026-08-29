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

  const sections = isCrossfit ? CROSSFIT_SECTIONS : MUSCULACION_SECTIONS;
  const titles = isCrossfit ? CROSSFIT_TITLES : MUSCULACION_TITLES;

  // Count total exercises in this day
  const totalExercises = sections.reduce((sum, key) => {
    const exerciseKey = key as keyof RoutineDay;
    return sum + (day[exerciseKey]?.length || 0);
  }, 0);

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      expanded
        ? 'border-[var(--primary-color)] shadow-lg'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    } bg-white dark:bg-gray-800`}>
      {/* Day header - clickable button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          expanded
            ? isCrossfit ? 'bg-[var(--primary-color)]' : 'bg-blue-600'
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

      {/* Expanded content */}
      {expanded && (
        <div className="p-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
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
