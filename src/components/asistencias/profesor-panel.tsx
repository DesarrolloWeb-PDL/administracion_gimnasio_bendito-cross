'use client';

import { useEffect, useState } from 'react';
import { registrarModalidad } from '@/lib/actions-modalidad';

type Asistencia = {
  id: string;
  fecha: Date | string;
  modalidad: string | null;
  socio: {
    id: string;
    nombre: string;
    apellido: string;
    suscripciones: Array<{
      plan: {
        nombre: string;
        allowsCrossfit: boolean;
        allowsMusculacion: boolean;
      };
    }>;
  };
};

export default function ProfesorPanel({ discipline }: { discipline: string }) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAsistencias = async () => {
    try {
      const response = await fetch(`/api/asistencias/hoy?discipline=${discipline}`);
      const data = await response.json();
      setAsistencias(data);
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsistencias();
    
    // Auto-actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchAsistencias();
    }, 30000);

    return () => clearInterval(interval);
  }, [discipline]);

  const handleModalidad = async (asistenciaId: string, modalidad: 'MUSCULACION' | 'CROSSFIT') => {
    const formData = new FormData();
    formData.append('asistenciaId', asistenciaId);
    formData.append('modalidad', modalidad);

    const result = await registrarModalidad({}, formData);
    
    if (result.status === 'success') {
      // Actualizar la lista inmediatamente
      fetchAsistencias();
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        <div className="rounded-lg bg-white shadow-sm p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Alumnos presentes hoy</h2>
      <div className="rounded-lg bg-white shadow-sm overflow-hidden border">
        {asistencias.length === 0 ? (
          <div className="p-4 text-gray-500">No hay alumnos presentes aún.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Alumno</th>
                <th className="px-4 py-3 font-semibold">Hora</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold text-center">Modalidad</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((asistencia) => {
                const planNombre = asistencia.socio.suscripciones[0]?.plan.nombre || 'Sin Plan';
                const allowsCrossfit = asistencia.socio.suscripciones[0]?.plan.allowsCrossfit || false;
                const allowsMusculacion = asistencia.socio.suscripciones[0]?.plan.allowsMusculacion || false;
                
                const fecha = new Date(asistencia.fecha);
                const horaIngreso = fecha.toLocaleTimeString('es-AR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  timeZone: 'America/Argentina/Buenos_Aires' 
                });

                return (
                  <tr key={asistencia.id} className="bg-white border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {asistencia.socio.nombre} {asistencia.socio.apellido}
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {horaIngreso}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {planNombre}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {allowsMusculacion && '✓ Musculación '}
                        {allowsCrossfit && '✓ CrossFit'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleModalidad(asistencia.id, 'MUSCULACION')}
                          disabled={asistencia.modalidad === 'MUSCULACION'}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            asistencia.modalidad === 'MUSCULACION'
                              ? 'bg-green-600 text-white cursor-default'
                              : 'bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          {asistencia.modalidad === 'MUSCULACION' ? '✓ ' : ''}Musculación
                        </button>
                        <button
                          onClick={() => handleModalidad(asistencia.id, 'CROSSFIT')}
                          disabled={asistencia.modalidad === 'CROSSFIT'}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            asistencia.modalidad === 'CROSSFIT'
                              ? 'bg-orange-600 text-white cursor-default'
                              : 'bg-gray-200 text-gray-700 hover:bg-orange-500 hover:text-white'
                          }`}
                        >
                          {asistencia.modalidad === 'CROSSFIT' ? '✓ ' : ''}CrossFit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Actualización automática cada 30 segundos
      </p>
    </div>
  );
}
