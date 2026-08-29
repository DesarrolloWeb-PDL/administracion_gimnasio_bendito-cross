'use client';

import RoutineSection, { type ExerciseEntry } from './routine-section';

export interface RoutineDay {
  // CrossFit sections
  activacion: ExerciseEntry[];
  entrada_calor: ExerciseEntry[];
  trabajos_dia: ExerciseEntry[];
  wod_dia: ExerciseEntry[];
  // Musculación sections
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
  superiores: 'Superiores (Pecho, Hombros, Bíceps, Tríceps)',
  zona_media: 'Zona Media (Abdomen, Oblicuos, Espalda baja)',
  inferiores: 'Inferiores (Cuádriceps, Isquios, Glúteos, Gemelos)',
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

  const sections = isCrossfit ? CROSSFIT_SECTIONS : MUSCULACION_SECTIONS;
  const titles = isCrossfit ? CROSSFIT_TITLES : MUSCULACION_TITLES;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden min-w-[260px]">
      {/* Day header */}
      <div className={`px-4 py-2.5 ${isCrossfit ? 'bg-[var(--primary-color)]' : 'bg-blue-600'}`}>
        <h3 className="text-sm font-bold text-white">{diaLabel}</h3>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2 p-3">
        {sections.map((key) => {
          // For musculación, map section keys to the RoutineDay fields
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
    </div>
  );
}
