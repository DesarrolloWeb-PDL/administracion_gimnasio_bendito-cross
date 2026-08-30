'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Exercise } from './exercise-card';

interface ExerciseSidebarProps {
  onSelect: (exercise: Exercise, section?: string) => void;
  tipo?: 'crossfit' | 'musculacion';
}

const BODY_PART_ORDER = [
  'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Abdomen', 'Cardio'
];

// Map body part to musculación section
function bodyPartToSection(bodyPartEs: string): string {
  const lower = (bodyPartEs || '').toLowerCase();
  if (lower.includes('pecho') || lower.includes('espalda') || lower.includes('hombro') || 
      lower.includes('brazo') || lower.includes('bíceps') || lower.includes(' tríceps')) {
    return 'superiores';
  }
  if (lower.includes('abdomen') || lower.includes('abdominales') || lower.includes('oblicuo') || lower.includes('cintura')) {
    return 'zona_media';
  }
  if (lower.includes('pierna') || lower.includes('muslo') || lower.includes('pantorrilla') || 
      lower.includes('cuádriceps') || lower.includes('isquio') || lower.includes('glúteo')) {
    return 'inferiores';
  }
  return 'superiores'; // default
}

export default function ExerciseSidebar({ onSelect, tipo = 'musculacion' }: ExerciseSidebarProps) {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setLoading(true);
      try {
        const typeParam = tipo === 'crossfit' ? 'crossfit' : 'exerciseDB';
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}&type=${typeParam}&limit=50&groupBy=bodyPart`);
        const data = await res.json();
        setExercises(data.results || []);
      } catch (err) {
        console.error('Exercise search error:', err);
        setExercises([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const typeParam = tipo === 'crossfit' ? 'crossfit' : 'exerciseDB';
      const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}&type=${typeParam}&limit=50&groupBy=bodyPart`);
      const data = await res.json();
      setExercises(data.results || []);
    } catch (err) {
      console.error('Exercise search error:', err);
      setExercises([]);
    }
    setLoading(false);
  }, [tipo]);

  // Load initial exercises on mount
  useEffect(() => {
    performSearch('a');
  }, [performSearch]);

  // Group exercises by muscle group
  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    
    for (const ex of exercises) {
      let group = 'Otros';
      
      if (tipo === 'musculacion') {
        // Use bodyPartEs for grouping, with a fallback to muscleGroupEs
        group = ex.bodyPartEs || ex.muscleGroupEs || 'Otros';
        
        // Map to the 5 main groups
        const lower = (ex.bodyPartEs || '').toLowerCase();
        if (lower.includes('pecho')) group = 'Pecho';
        else if (lower.includes('espalda')) group = 'Espalda';
        else if (lower.includes('hombro')) group = 'Hombros';
        else if (lower.includes('brazo') || lower.includes('bíceps') || lower.includes(' tríceps')) group = 'Brazos';
        else if (lower.includes('pierna') || lower.includes('muslo') || lower.includes('pantorrilla')) group = 'Piernas';
        else if (lower.includes('abdomen') || lower.includes('abdominales') || lower.includes('oblicuo')) group = 'Abdomen';
        else if (lower.includes('cardio')) group = 'Cardio';
      } else {
        group = 'CrossFit';
      }
      
      if (!groups[group]) groups[group] = [];
      groups[group].push(ex);
    }
    
    return groups;
  }, [exercises, tipo]);

  const sortedGroups = useMemo(() => {
    const groups = Object.keys(grouped);
    if (tipo === 'musculacion') {
      return groups.sort((a, b) => {
        const aIdx = BODY_PART_ORDER.indexOf(a);
        const bIdx = BODY_PART_ORDER.indexOf(b);
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });
    }
    return groups;
  }, [grouped, tipo]);

  const handleExerciseClick = (exercise: Exercise) => {
    // Auto-detect section based on body part
    const section = tipo === 'musculacion' ? bodyPartToSection(exercise.bodyPartEs || '') : undefined;
    onSelect(exercise, section);
  };

  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Ejercicios
        </h3>
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            performSearch(e.target.value);
          }}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[var(--primary-color)]"
        />
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Cargando...
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {search ? 'Sin resultados' : 'Escribí para buscar'}
          </div>
        ) : tipo === 'musculacion' ? (
          // Grouped view for musculación
          <div className="p-2 space-y-1">
            {sortedGroups.map(group => {
              const isExpanded = expandedGroup === group || sortedGroups.length === 1;
              const items = grouped[group] || [];
              return (
                <div key={group}>
                  <button
                    onClick={() => setExpandedGroup(isExpanded && sortedGroups.length > 1 ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <span>{group}</span>
                    <span className="text-xs text-gray-400">{items.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pl-2 space-y-1">
                      {items.map(ex => (
                        <button
                          key={ex.id}
                          onClick={() => handleExerciseClick(ex)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          {ex.gifUrl ? (
                            <img
                              src={ex.gifUrl}
                              alt={ex.esName || ex.name}
                              className="h-8 w-8 rounded object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400">HD</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                              {ex.esName || ex.name}
                            </p>
                            {ex.muscleGroupEs && (
                              <p className="text-[10px] text-gray-400 truncate">{ex.muscleGroupEs}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat list for CrossFit
          <div className="p-2 space-y-1">
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleExerciseClick(ex)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {ex.gifUrl ? (
                  <img
                    src={ex.gifUrl}
                    alt={ex.esName || ex.name}
                    className="h-8 w-8 rounded object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-gray-400">HD</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                    {ex.esName || ex.name}
                  </p>
                  {ex.videoUrl && (
                    <p className="text-[10px] text-gray-400 truncate">Video</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
