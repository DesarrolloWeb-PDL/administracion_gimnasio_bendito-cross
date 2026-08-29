'use client';

import RoutineSection, { type ExerciseEntry } from './routine-section';

export interface RoutineDay {
  activacion: ExerciseEntry[];
  entrada_calor: ExerciseEntry[];
  trabajos_dia: ExerciseEntry[];
  wod_dia: ExerciseEntry[];
}

const EMPTY_DAY: RoutineDay = {
  activacion: [],
  entrada_calor: [],
  trabajos_dia: [],
  wod_dia: [],
};

const SECTION_KEYS = ['activacion', 'entrada_calor', 'trabajos_dia', 'wod_dia'] as const;
const SECTION_TITLES: Record<string, string> = {
  activacion: 'Activación',
  entrada_calor: 'Entrada en calor',
  trabajos_dia: 'Trabajos del día',
  wod_dia: 'WOD del día',
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

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden min-w-[260px]">
      {/* Day header */}
      <div className="bg-[var(--primary-color)] px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">{diaLabel}</h3>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2 p-3">
        {SECTION_KEYS.map((key) => (
          <RoutineSection
            key={key}
            title={SECTION_TITLES[key]}
            exercises={day[key]}
            tipo={tipo}
            onAdd={(entry) => onAddExercise(dia, key, entry)}
            onRemove={(index) => onRemoveExercise(dia, key, index)}
            onReorder={(from, to) => onReorderExercise(dia, key, from, to)}
            onUpdate={(index, updates) => onUpdateExercise(dia, key, index, updates)}
          />
        ))}
      </div>
    </div>
  );
}
