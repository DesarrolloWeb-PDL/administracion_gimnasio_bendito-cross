'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Rutina {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  nivel: string | null;
  profesor: { nombre: string };
  createdAt: Date;
}

export default function RutinaCard({ rutina }: { rutina: Rutina }) {
  const [eliminando, setEliminando] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    setEliminando(true);
    try {
      const res = await fetch(`/api/rutinas/${rutina.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error(error);
    }
    setEliminando(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white">{rutina.titulo}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{rutina.contenido}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Por: {rutina.profesor.nombre}</span>
            {rutina.nivel && (
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">
                {rutina.nivel}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={eliminando}
          className="ml-2 text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
        >
          {eliminando ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
}
