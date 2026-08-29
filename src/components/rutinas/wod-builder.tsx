'use client';

import { useState } from 'react';
import DayColumn, { type RoutineDay } from './day-column';
import type { ExerciseEntry } from './routine-section';
import ExerciseSidebar from './exercise-sidebar';
import type { Exercise } from './exercise-card';

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
];

function emptyDay(): RoutineDay {
  return { activacion: [], entrada_calor: [], trabajos_dia: [], wod_dia: [] };
}

function emptyWeek(): Record<string, RoutineDay> {
  const week: Record<string, RoutineDay> = {};
  for (const d of DAYS) week[d.key] = emptyDay();
  return week;
}

interface WodBuilderProps {
  rutina?: {
    id: string;
    titulo: string;
    contenidoJson?: Record<string, RoutineDay>;
    tipo: string;
  };
  tipo: 'crossfit' | 'musculacion';
  onSave?: () => void;
}

export default function WodBuilder({ rutina, tipo, onSave }: WodBuilderProps) {
  const [titulo, setTitulo] = useState(rutina?.titulo || `Rutina Semanal ${tipo === 'crossfit' ? 'CrossFit' : 'Musculación'}`);
  const [week, setWeek] = useState<Record<string, RoutineDay>>(() => {
    if (rutina?.contenidoJson) {
      const loaded = emptyWeek();
      for (const d of DAYS) {
        if (rutina.contenidoJson[d.key]) {
          loaded[d.key] = rutina.contenidoJson[d.key];
        }
      }
      return loaded;
    }
    return emptyWeek();
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('lunes');

  const handleAddExercise = (dia: string, section: string, entry: ExerciseEntry) => {
    setWeek((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [section]: [...prev[dia][section as keyof RoutineDay], entry],
      },
    }));
    setSaved(false);
  };

  const handleRemoveExercise = (dia: string, section: string, index: number) => {
    setWeek((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [section]: prev[dia][section as keyof RoutineDay].filter((_: ExerciseEntry, i: number) => i !== index),
      },
    }));
    setSaved(false);
  };

  const handleReorderExercise = (dia: string, section: string, fromIndex: number, toIndex: number) => {
    setWeek((prev) => {
      const items = [...prev[dia][section as keyof RoutineDay]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return {
        ...prev,
        [dia]: {
          ...prev[dia],
          [section]: items,
        },
      };
    });
    setSaved(false);
  };

  const handleUpdateExercise = (dia: string, section: string, index: number, updates: Partial<ExerciseEntry>) => {
    setWeek((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [section]: prev[dia][section as keyof RoutineDay].map((e: ExerciseEntry, i: number) =>
          i === index ? { ...e, ...updates } : e
        ),
      },
    }));
    setSaved(false);
  };

  const handleSidebarSelect = (exercise: Exercise) => {
    // Add to the selected day's "wod_dia" section by default
    const entry: ExerciseEntry = {
      exerciseId: exercise.id,
      nombre: exercise.name,
      gifUrl: exercise.gifUrl,
      videoUrl: exercise.videoUrl,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      orden: week[selectedDay].wod_dia.length,
    };
    handleAddExercise(selectedDay, 'wod_dia', entry);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        titulo,
        tipo,
        contenidoJson: week,
        version: 'structured',
      };

      const url = rutina?.id ? `/api/rutinas/${rutina.id}` : '/api/rutinas';
      const method = rutina?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        onSave?.();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }
    setSaving(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Sidebar */}
      <ExerciseSidebar onSelect={handleSidebarSelect} type={tipo} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <input
            type="text"
            value={titulo}
            onChange={(e) => { setTitulo(e.target.value); setSaved(false); }}
            className="flex-1 text-lg font-bold bg-transparent border-b-2 border-transparent focus:border-[var(--primary-color)] text-gray-800 dark:text-white outline-none py-1"
            placeholder="Título de la rutina semanal"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="animate-spin">⟳</span> Guardando...
              </>
            ) : saved ? (
              <>
                <span>✓</span> Guardado
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>

        {/* Day tabs (mobile) */}
        <div className="flex md:hidden overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === d.key
                  ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Weekly grid - scrollable */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          {/* Desktop: all days visible */}
          <div className="hidden md:flex gap-3 h-full">
            {DAYS.map((d) => (
              <div key={d.key} className="w-[240px] flex-shrink-0 h-full overflow-y-auto">
                <DayColumn
                  dia={d.key}
                  diaLabel={d.label}
                  routineDay={week[d.key]}
                  tipo={tipo}
                  onAddExercise={handleAddExercise}
                  onRemoveExercise={handleRemoveExercise}
                  onReorderExercise={handleReorderExercise}
                  onUpdateExercise={handleUpdateExercise}
                />
              </div>
            ))}
          </div>

          {/* Mobile: single day */}
          <div className="md:hidden">
            <DayColumn
              dia={selectedDay}
              diaLabel={DAYS.find(d => d.key === selectedDay)?.label || selectedDay}
              routineDay={week[selectedDay]}
              tipo={tipo}
              onAddExercise={handleAddExercise}
              onRemoveExercise={handleRemoveExercise}
              onReorderExercise={handleReorderExercise}
              onUpdateExercise={handleUpdateExercise}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
