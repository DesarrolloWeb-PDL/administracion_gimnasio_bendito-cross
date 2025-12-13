import Link from 'next/link';
import { fetchAsistencias } from '@/lib/data-asistencias';

export default async function ProfesorPanel({ discipline }: { discipline: string }) {
  // Solo mostrar alumnos presentes hoy, filtrados por disciplina
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const asistencias = await fetchAsistencias('', 1, discipline);
  // Filtrar solo las asistencias de hoy
  const presentesHoy = asistencias.filter(a => {
    const fecha = new Date(a.fecha);
    return fecha >= today && fecha < tomorrow;
  });

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Alumnos presentes hoy</h2>
      <div className="rounded-lg bg-gray-50 p-4">
        {presentesHoy.length === 0 ? (
          <p className="text-gray-500">No hay alumnos presentes aún.</p>
        ) : (
          <ul className="space-y-2">
            {presentesHoy.map((asistencia) => (
              <li key={asistencia.id} className="flex items-center justify-between bg-white rounded-md px-4 py-2 shadow-sm">
                <span className="font-medium text-gray-900">
                  {asistencia.socio.nombre} {asistencia.socio.apellido}
                </span>
                <Link
                  href={`/admin/socios/${asistencia.socio.id}/edit`}
                  className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Ver más
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
