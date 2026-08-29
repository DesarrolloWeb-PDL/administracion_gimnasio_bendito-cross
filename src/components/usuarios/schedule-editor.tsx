'use client';

import { useState } from 'react';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const DIA_LABELS: Record<string, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
};

interface TimeSlot {
  inicio: string;
  fin: string;
}

interface DaySchedule {
  lunes?: TimeSlot | null;
  martes?: TimeSlot | null;
  miercoles?: TimeSlot | null;
  jueves?: TimeSlot | null;
  viernes?: TimeSlot | null;
  sabado?: TimeSlot | null;
}

interface ProfessorSchedule {
  crossfit?: DaySchedule;
  musculacion?: DaySchedule;
}

interface ScheduleEditorProps {
  usuarioId: string;
  horarios?: ProfessorSchedule | null;
  esProfesorCrossfit: boolean;
  esProfesorMusculacion: boolean;
  onSave: (horarios: ProfessorSchedule) => void;
}

function emptySlot(): TimeSlot {
  return { inicio: '', fin: '' };
}

function emptyDaySchedule(): DaySchedule {
  return {
    lunes: null,
    martes: null,
    miercoles: null,
    jueves: null,
    viernes: null,
    sabado: null,
  };
}

export default function ScheduleEditor({
  usuarioId,
  horarios,
  esProfesorCrossfit,
  esProfesorMusculacion,
  onSave,
}: ScheduleEditorProps) {
  const [activeTab, setActiveTab] = useState<'crossfit' | 'musculacion'>(
    esProfesorCrossfit ? 'crossfit' : 'musculacion'
  );
  const [schedule, setSchedule] = useState<ProfessorSchedule>({
    crossfit: horarios?.crossfit || emptyDaySchedule(),
    musculacion: horarios?.musculacion || emptyDaySchedule(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showTabs = esProfesorCrossfit && esProfesorMusculacion;
  const currentSchedule = schedule[activeTab] || emptyDaySchedule();

  const handleTimeChange = (dia: string, field: 'inicio' | 'fin', value: string) => {
    const daySchedule = { ...(schedule[activeTab] || emptyDaySchedule()) };
    const current = daySchedule[dia as keyof DaySchedule] as TimeSlot | null;

    daySchedule[dia as keyof DaySchedule] = {
      ...(current || emptySlot()),
      [field]: value,
    };

    setSchedule((prev) => ({
      ...prev,
      [activeTab]: daySchedule,
    }));
    setError(null);
  };

  const handleClearDay = (dia: string) => {
    const daySchedule = { ...(schedule[activeTab] || emptyDaySchedule()) };
    daySchedule[dia as keyof DaySchedule] = null;
    setSchedule((prev) => ({
      ...prev,
      [activeTab]: daySchedule,
    }));
  };

  const validate = (): boolean => {
    const daySchedule = schedule[activeTab];
    if (!daySchedule) return true;

    for (const dia of DIAS) {
      const slot = daySchedule[dia];
      if (slot && slot.inicio && slot.fin) {
        if (slot.inicio >= slot.fin) {
          setError(`En ${DIA_LABELS[dia]}: la hora de inicio debe ser anterior a la hora de fin`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Only send non-null entries
      const cleanedSchedule: ProfessorSchedule = {};
      if (esProfesorCrossfit && schedule.crossfit) {
        cleanedSchedule.crossfit = schedule.crossfit;
      }
      if (esProfesorMusculacion && schedule.musculacion) {
        cleanedSchedule.musculacion = schedule.musculacion;
      }

      onSave(cleanedSchedule);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Horarios del Profesor</h3>

      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('crossfit')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'crossfit'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            🔥 CrossFit
          </button>
          <button
            onClick={() => setActiveTab('musculacion')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'musculacion'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            💪 Musculación
          </button>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Day grid */}
      <div className="space-y-2">
        {DIAS.map((dia) => {
          const slot = currentSchedule[dia] as TimeSlot | null;
          return (
            <div
              key={dia}
              className="flex items-center gap-3 rounded-md bg-gray-50 dark:bg-gray-900/50 p-2"
            >
              <span className="w-10 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                {DIA_LABELS[dia]}
              </span>

              {slot ? (
                <>
                  <input
                    type="time"
                    value={slot.inicio}
                    onChange={(e) => handleTimeChange(dia, 'inicio', e.target.value)}
                    className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-400">a</span>
                  <input
                    type="time"
                    value={slot.fin}
                    onChange={(e) => handleTimeChange(dia, 'fin', e.target.value)}
                    className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-800 dark:text-white"
                  />
                  <button
                    onClick={() => handleClearDay(dia)}
                    className="text-red-400 hover:text-red-600 text-xs ml-auto"
                    title="Limpiar"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleTimeChange(dia, 'inicio', '')}
                  className="flex-1 text-left text-xs text-gray-400 dark:text-gray-500 hover:text-[var(--primary-color)]"
                >
                  + Agregar horario
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>
    </div>
  );
}
