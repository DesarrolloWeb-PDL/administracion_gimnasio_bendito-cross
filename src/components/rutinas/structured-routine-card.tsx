'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WodBuilder from './wod-builder';
import type { RoutineDay } from './day-column';

interface StructuredRutina {
  id: string;
  titulo: string;
  contenidoJson?: unknown;
  tipo: string;
  nivel: string | null;
  semanaInicio?: Date | null;
  profesor: { nombre: string };
  createdAt: Date;
}

const DAYS = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
];

const SECTION_TITLES: Record<string, string> = {
  activacion: 'Activación',
  entrada_calor: 'Entrada en calor',
  trabajos_dia: 'Trabajos del día',
  wod_dia: 'WOD del día',
};

export default function StructuredRoutineCard({ rutina }: { rutina: StructuredRutina }) {
  const [eliminando, setEliminando] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const contenidoJson = rutina.contenidoJson as Record<string, RoutineDay> | undefined;

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina semanal?')) return;
    setEliminando(true);
    try {
      const res = await fetch(`/api/rutinas/${rutina.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error(error);
    }
    setEliminando(false);
  };

  const handleEditSave = () => {
    setEditing(false);
    router.refresh();
  };

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              ← Volver
            </button>
          </div>
          <WodBuilder
            rutina={{
              id: rutina.id,
              titulo: rutina.titulo,
              contenidoJson: contenidoJson,
              tipo: rutina.tipo,
            }}
            tipo={rutina.tipo as 'crossfit' | 'musculacion'}
            onSave={handleEditSave}
          />
        </div>
      </div>
    );
  }

  // Count total exercises across all days
  let totalExercises = 0;
  if (contenidoJson) {
    for (const day of Object.values(contenidoJson as Record<string, unknown>)) {
      if (typeof day === 'object' && day !== null) {
        for (const section of Object.values(day as Record<string, unknown[]>)) {
          if (Array.isArray(section)) {
            totalExercises += section.length;
          }
        }
      }
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white">{rutina.titulo}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Por: {rutina.profesor.nombre}</span>
            <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5">
              Semanal
            </span>
            {rutina.nivel && (
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
                {rutina.nivel}
              </span>
            )}
            <span>{totalExercises} ejercicios</span>
          </div>

          {/* Day preview */}
          {contenidoJson && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const dayData = contenidoJson[d.key] as RoutineDay | undefined;
                const hasExercises = dayData && Object.values(dayData as unknown as Record<string, unknown>).some(
                  (section) => Array.isArray(section) && section.length > 0
                );
                return (
                  <span
                    key={d.key}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      hasExercises
                        ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-[var(--primary-color)] text-sm px-2"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={eliminando}
            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
          >
            {eliminando ? '...' : '🗑️'}
          </button>
        </div>
      </div>
    </div>
  );
}
