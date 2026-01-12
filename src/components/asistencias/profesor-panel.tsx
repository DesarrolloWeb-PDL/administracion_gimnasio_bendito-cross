import { fetchAsistenciasHoy } from '@/lib/data-asistencias';

export default async function ProfesorPanel({ discipline }: { discipline: string }) {
  const asistencias = await fetchAsistenciasHoy(discipline);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Alumnos presentes hoy</h2>
      <div className="rounded-lg bg-white shadow-sm overflow-hidden border">
        {asistencias.length === 0 ? (
          <div className="p-4 text-gray-500">No hay alumnos presentes aún.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Alumno</th>
                <th className="px-6 py-3 font-semibold">Hora de Ingreso</th>
                <th className="px-6 py-3 font-semibold">Plan</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((asistencia) => {
                const planNombre = asistencia.socio.suscripciones[0]?.plan.nombre || 'Sin Plan Activo';
                const fecha = new Date(asistencia.fecha);
                const horaIngreso = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={asistencia.id} className="bg-white border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {asistencia.socio.nombre} {asistencia.socio.apellido}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {horaIngreso}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {planNombre}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
