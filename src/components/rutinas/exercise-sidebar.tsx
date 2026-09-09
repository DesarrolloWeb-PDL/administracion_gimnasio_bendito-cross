'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Exercise } from './exercise-card';

interface ExerciseSidebarProps {
  onSelect: (exercise: Exercise) => void;
  selectedId?: string | null;
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

export default function ExerciseSidebar({ onSelect, selectedId, tipo = 'musculacion' }: ExerciseSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-open on desktop (md+)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsOpen(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsOpen(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const performSearch = useCallback(async (q: string) => {
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

  useEffect(() => { performSearch(''); }, [performSearch]);

  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      const group = tipo === 'musculacion' ? getMusculacionGroup(ex.bodyPartEs || '') : 'CrossFit';
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

  const flatResults = useMemo(() => {
    if (!search) return [];
    return exercises.slice(0, 100);
  }, [exercises, search]);

  // Click — toggle selection
  const handleClick = (exercise: Exercise) => {
    onSelect(exercise);
  };

  // Drag handlers (desktop bonus)
  const handleDragStart = (e: React.DragEvent, exercise: Exercise) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(exercise));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const renderExerciseItem = (ex: Exercise) => (
    <div
      key={ex.id}
      draggable
      onDragStart={(e) => handleDragStart(e, ex)}
      onDragEnd={handleDragEnd}
      onClick={() => handleClick(ex)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
        selectedId === ex.id
          ? 'bg-[var(--primary-color)]/10 ring-2 ring-[var(--primary-color)]'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={selectedId === ex.id ? 'Tocá una sección para colocarlo' : 'Tocá para seleccionar'}
    >
      {ex.gifUrl ? (
        <img src={ex.gifUrl} alt={ex.esName || ex.name} className="h-8 w-8 rounded object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700" loading="lazy" draggable={false} />
      ) : (
        <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] text-gray-400">📹</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{ex.esName || ex.name}</p>
        {ex.muscleGroupEs && <p className="text-[10px] text-gray-400 truncate">{ex.muscleGroupEs}</p>}
      </div>
      {selectedId === ex.id && <span className="text-[var(--primary-color)] text-xs font-bold">✓</span>}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-[var(--primary-color)] text-white shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
      >
        <span className="text-lg">{isOpen ? '✕' : '🏋️'}</span>
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:relative inset-y-0 left-0 z-40 md:z-auto
        w-72 md:w-72
        flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col transition-transform duration-300
        ${isDragging ? 'pointer-events-none opacity-70' : ''}
      `}>
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Ejercicios ({exercises.length})
            </h3>
            <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1">✕</button>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); performSearch(e.target.value); }}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[var(--primary-color)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
          ) : exercises.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{search ? 'Sin resultados' : 'Escribí para buscar'}</div>
          ) : (
            <div className="p-2 space-y-1">
              {!search && sortedGroups.map(group => {
                const items = grouped[group] || [];
                return (
                  <div key={group}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group} ({items.length})
                    </div>
                    <div className="space-y-0.5">
                      {items.map(ex => renderExerciseItem(ex))}
                    </div>
                  </div>
                );
              })}
              {search && flatResults.map(ex => renderExerciseItem(ex))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
