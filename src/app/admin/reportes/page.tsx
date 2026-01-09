import { fetchIngresosPorMes, fetchNuevosSociosPorMes, fetchAsistenciasPorDia, fetchIngresosPorTipo } from '@/lib/data-reportes';
import { IngresosPorDia } from '@/components/reportes/ingresos-por-dia';

export default async function Page() {
  const ingresos = await fetchIngresosPorMes();
  const nuevosSocios = await fetchNuevosSociosPorMes();
  const asistenciasPorDia = await fetchAsistenciasPorDia();
  const ingresosPorTipo = await fetchIngresosPorTipo();

  return (
    <main className="w-full">
      <h1 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">Reportes y Estadísticas</h1>
      
      {/* Fila 1: Ingresos por Tipo y Asistencias por Día */}
      <div className="grid gap-6 mb-6 md:grid-cols-2">
        {/* Ingresos por Tipo */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Ingresos (Últimos 30 días)</h2>
          <div className="space-y-4">
            {ingresosPorTipo.length === 0 ? (
              <p className="text-center text-gray-500">No hay datos disponibles</p>
            ) : (
              ingresosPorTipo.map((item) => (
                <div key={item.tipo} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.tipo === 'Mensualidades' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-600">{item.tipo}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(item.monto)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Asistencias por Día */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Asistencias por Día (Últimos 30 días)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b font-medium text-gray-900">
                <tr>
                  <th className="px-4 py-2">Día</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {asistenciasPorDia.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  asistenciasPorDia.map((item) => (
                    <tr key={item.dia} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{item.dia}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.cantidad}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fila 2: Ingresos Mensuales y Nuevos Socios */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reporte de Ingresos Mensuales */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Ingresos Mensuales (Último Año)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b font-medium text-gray-900">
                <tr>
                  <th className="px-4 py-2">Mes</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  ingresos.map((item) => (
                    <tr key={item.fecha} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{item.fecha}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(item.monto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reporte de Nuevos Socios */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Nuevos Socios (Último Año)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b font-medium text-gray-900">
                <tr>
                  <th className="px-4 py-2">Mes</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {nuevosSocios.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  nuevosSocios.map((item) => (
                    <tr key={item.fecha} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{item.fecha}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.cantidad}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fila 3: Ingresos por Día */}
      <div className="grid gap-6 mt-6">
        <IngresosPorDia />
      </div>
    </main>
  );
}
