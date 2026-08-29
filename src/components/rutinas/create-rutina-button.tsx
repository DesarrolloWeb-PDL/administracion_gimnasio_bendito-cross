'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WodBuilder from './wod-builder';

interface CreateRutinaButtonProps {
  userRol: string;
  esProfesorCrossfit: boolean;
  esProfesorMusculacion: boolean;
}

export default function CreateRutinaButton({ userRol, esProfesorCrossfit, esProfesorMusculacion }: CreateRutinaButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showWodBuilder, setShowWodBuilder] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [tipo, setTipo] = useState('crossfit');
  const [nivel, setNivel] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const canCreateCrossfit = userRol === 'ADMIN' || esProfesorCrossfit;
  const canCreateMusculacion = userRol === 'ADMIN' || esProfesorMusculacion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, contenido, tipo, nivel: nivel || null }),
      });
      if (res.ok) {
        setShowModal(false);
        setTitulo('');
        setContenido('');
        setNivel('');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleWodSave = () => {
    setShowWodBuilder(false);
    router.refresh();
  };

  // If WOD builder is open, render it full-screen
  if (showWodBuilder) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowWodBuilder(false)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              ← Volver
            </button>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Tipo:</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-800 dark:text-white"
              >
                {canCreateCrossfit && <option value="crossfit">CrossFit</option>}
                {canCreateMusculacion && <option value="musculacion">Musculación</option>}
              </select>
            </div>
          </div>
          <WodBuilder tipo={tipo as 'crossfit' | 'musculacion'} onSave={handleWodSave} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setShowModal(true)}
          className="flex h-10 items-center gap-1 rounded-lg bg-[var(--primary-color)] px-4 text-sm font-medium text-white transition-colors hover:brightness-110"
        >
          + Nueva Rutina
          <span className="text-xs opacity-70">▾</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Nueva Rutina</h2>

            {/* Routine type choice */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">¿Qué tipo de rutina querés crear?</p>

              <button
                onClick={() => {
                  setShowModal(false);
                  setShowWodBuilder(true);
                }}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 text-left hover:border-[var(--primary-color)] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">Rutina Semanal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Calendario con 6 días, secciones por día (Activación, WOD, etc.)
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  // Open legacy daily modal
                  setShowModal(true);
                }}
                className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 text-left hover:border-[var(--primary-color)] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">Rutina Diaria</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Texto libre para un solo día
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Legacy daily form (shown when daily is selected) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-800 dark:text-white"
                >
                  {canCreateCrossfit && <option value="crossfit">CrossFit</option>}
                  {canCreateMusculacion && <option value="musculacion">Musculación</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: WOD Lunes, Rutina Pecho..."
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Ej: 5 rounds for time: 10 thrusters, 15 box jumps..."
                  required
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel (opcional)</label>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-800 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
