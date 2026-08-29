'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ExerciseCard, { type Exercise } from './exercise-card';

interface ExerciseSearchDialogProps {
  open: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  type?: 'crossfit' | 'musculacion' | 'all';
}

export default function ExerciseSearchDialog({
  open,
  onSelect,
  onClose,
  type = 'all',
}: ExerciseSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [partial, setPartial] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchType = type === 'crossfit' ? 'crossfit' : type === 'musculacion' ? 'exerciseDB' : 'all';

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setPartial(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/exercises/search?q=${encodeURIComponent(q)}&type=${searchType}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
        setPartial(data.partial ?? false);
      } else {
        setResults([]);
        setPartial(true);
      }
    } catch {
      setResults([]);
      setPartial(true);
    }
    setLoading(false);
  }, [searchType]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setPartial(false);
      // Small delay to allow DOM render
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Buscar Ejercicio
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: bench press, snatch, deadlift..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-pulse text-xs">
                Buscando...
              </span>
            )}
          </div>
          {partial && results.length > 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Solo se encontraron resultados de una fuente (ExerciseDB puede estar limitado)
            </p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              Escribe para buscar ejercicios...
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No se encontraron ejercicios para &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={handleSelect}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {type === 'crossfit'
              ? 'Mostrando solo ejercicios CrossFit'
              : type === 'musculacion'
              ? 'Mostrando ejercicios de ExerciseDB (musculación)'
              : 'Mostrando ejercicios de ExerciseDB y CrossFit'}
          </p>
        </div>
      </div>
    </div>
  );
}
