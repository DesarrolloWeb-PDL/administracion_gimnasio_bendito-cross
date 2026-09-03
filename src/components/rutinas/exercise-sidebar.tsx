'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Exercise } from './exercise-card';

interface ExerciseSidebarProps {
  onSelect: (exercise: Exercise, section?: string) => void;
  tipo?: 'crossfit' | 'musculacion';
}

const MUSCULACION_GROUPS = [
  { key: 'Pecho', icon: '💪', accept: ['pecho'] },
  { key: 'Espalda', icon: '🔙', accept: ['espalda'] },
  { key: 'Hombros', icon: '🏋️', accept: ['hombro'] },
  { key: 'Brazos', icon: '💪', accept: ['brazo', 'bíceps', 'tríceps'] },
  { key: 'Piernas', icon: '🦵', accept: ['pierna', 'muslo', 'pantorrilla', 'cuádriceps', 'isquio', 'glúteo'] },
  { key: 'Abdomen', icon: '🎯', accept: ['abdomen', 'abdominales', 'oblicuo', 'cintura'] },
  { key: 'Cardio', icon: '❤️', accept: ['cardio'] },
];

function getMusculacionGroup(bodyPartEs: string): string {
  const lower = (bodyPartEs || '').toLowerCase();
  for (const g of MUSCULACION_GROUPS) {
    if (g.accept.some(a => lower.includes(a))) return g.key;
  }
  return 'Otros';
}

function bodyPartToSection(bodyPartEs: string): string {
  const lower = (bodyPartEs || '').toLowerCase();
  if (lower.includes('pecho') || lower.includes('espalda') || lower.includes('hombro') || 
      lower.includes('brazo') || lower.includes('bíceps') || lower.includes('tríceps')) {
    return 'superiores';
  }
  if (lower.includes('abdomen') || lower.includes('abdominales') || lower.includes('oblicuo') || lower.includes('cintura')) {
    return 'zona_media';
  }
  if (lower.includes('pierna') || lower.includes('muslo') || lower.includes('pantorrilla') || 
      lower.includes('cuádriceps') || lower.includes('isquio') || lower.includes('glúteo')) {
    return 'inferiores';
  }
  return 'superiores';
}

export default function ExerciseSidebar({ onSelect, tipo = 'musculacion' }: ExerciseSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setLoading(true);
      try {
        const typeParam = tipo === 'crossfit' ? 'crossfit' : 'exerciseDB';
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}&type=${typeParam}&limit=2000&groupBy=bodyPart`);
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
      const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}&type=${typeParam}&limit=2000&groupBy=bodyPart`);
      const data = await res.json();
      setExercises(data.results || []);
    } catch (err) {
      console.error('Exercise search error:', err);
      setExercises([]);
    }
    setLoading(false);
  }, [tipo]);

  useEffect(() => {
    performSearch('');
  }, [performSearch]);

  // Group exercises
  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    
    for (const ex of exercises) {
      let group: string;
      if (tipo === 'musculacion') {
        group = getMusculacionGroup(ex.bodyPartEs || '');
      } else {
        group = 'CrossFit';
      }
      if (!groups[group]) groups[group] = [];
      groups[group].push(ex);
    }
    
    return groups;
  }, [exercises, tipo]);

  const sortedGroups = useMemo(() => {
    const keys = Object.keys(grouped);
    if (tipo === 'musculacion') {
      const order = [...MUSCULACION_GROUPS.map(g => g.key), 'Otros'];
      return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    return keys;
  }, [grouped, tipo]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, exercise: Exercise) => {
    setDraggedExercise(exercise);
    e.dataTransfer.setData('application/json', JSON.stringify(exercise));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (exercise: Exercise) => {
    const section = tipo === 'musculacion' ? bodyPartToSection(exercise.bodyPartEs || '') : undefined;
    onSelect(exercise, section);
  };

  return (
    <div className={`flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col transition-all ${isOpen ? 'w-72' : 'w-10'}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={isOpen ? 'Colapsar' : 'Expandir'}
      >
        <span className={`text-gray-500 transition-transform ${isOpen ? '' : 'rotate-180'}`}>◀</span>
      </button>

      {isOpen && (
        <>
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Ejercicios
            </h3>
            <input
              type="text"
              placeholder="Buscar..."
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
              <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
            ) : exercises.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {search ? 'Sin resultados' : 'Escribí para buscar'}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {sortedGroups.map(group => {
                  const items = grouped[group] || [];
                  const isExpanded = expandedGroup === group || sortedGroups.length === 1;
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
                            <div
                              key={ex.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, ex)}
                              onClick={() => handleClick(ex)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-grab active:cursor-grabbing"
                              title="Arrastrar a una sección"
                            >
                              {ex.gifUrl ? (
                                <img
                                  src={ex.gifUrl}
                                  alt={ex.esName || ex.name}
                                  className="h-8 w-8 rounded object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                                  loading="lazy"
                                  draggable={false}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] text-gray-400">📹</span>
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
