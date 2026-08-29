'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Exercise } from './exercise-card';

interface ExerciseSidebarProps {
  onSelect: (exercise: Exercise) => void;
  type?: 'crossfit' | 'musculacion' | 'all';
}

export default function ExerciseSidebar({ onSelect, type = 'all' }: ExerciseSidebarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchType = type === 'crossfit' ? 'crossfit' : type === 'musculacion' ? 'exerciseDB' : 'all';

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/exercises/search?q=${encodeURIComponent(q)}&type=${searchType}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [searchType]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  return (
    <div className={`flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${collapsed ? 'w-12' : 'w-72'}`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-b border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        title={collapsed ? 'Expandir panel' : 'Colapsar panel'}
      >
        {collapsed ? '»' : '«'}
      </button>

      {!collapsed && (
        <>
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Ejercicios
            </h3>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-7 pr-2 py-1.5 text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {query.trim() === '' ? (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">
                Escribí para buscar ejercicios
              </p>
            ) : loading ? (
              <div className="flex items-center justify-center py-4">
                <span className="text-xs text-gray-400 animate-pulse">Buscando...</span>
              </div>
            ) : results.length === 0 ? (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">
                Sin resultados
              </p>
            ) : (
              <div className="space-y-1.5">
                {results.map((exercise) => (
                  <ExerciseSidebarItem
                    key={exercise.id}
                    exercise={exercise}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              {type === 'crossfit' ? 'CrossFit' : type === 'musculacion' ? 'Musculación' : 'Todos'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ExerciseSidebarItem({ exercise, onSelect }: { exercise: Exercise; onSelect: (e: Exercise) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 text-left hover:border-[var(--primary-color)] hover:shadow-sm transition-all group"
    >
      {/* Thumbnail */}
      {exercise.gifUrl && !imgError ? (
        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          className="h-10 w-10 rounded object-cover flex-shrink-0"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : exercise.videoUrl ? (
        <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">▶</span>
        </div>
      ) : (
        <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400">
          <span className="text-sm">🏋️</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-white truncate group-hover:text-[var(--primary-color)]">
          {exercise.name}
        </p>
        {exercise.muscleGroup && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {exercise.muscleGroup}
          </p>
        )}
      </div>

      {/* Source badge */}
      <span className={`text-[9px] px-1 py-0.5 rounded flex-shrink-0 ${
        exercise.source === 'crossfit'
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      }`}>
        {exercise.source === 'crossfit' ? 'CF' : 'GYM'}
      </span>
    </button>
  );
}
