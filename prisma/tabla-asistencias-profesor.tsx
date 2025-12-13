import { Asistencia, Socio } from '@prisma/client';

type AsistenciaConSocio = Asistencia & {
  socio: Socio;
};

export default function TablaAsistenciasProfesor({
  asistencias,
}: {
  asistencias: AsistenciaConSocio[];
}) {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {asistencias?.map((asistencia) => (
              <div
                key={asistencia.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-lg font-medium">
                      {asistencia.socio.nombre} {asistencia.socio.apellido}
                    </p>
                    <p className="text-sm text-gray-500">{asistencia.socio.dni}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <p className="text-md font-medium capitalize">
                    {asistencia.modalidad.toLowerCase()}
                  </p>
                  <p className="text-sm">
                    {new Date(asistencia.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  </p>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Socio</th>
                <th scope="col" className="px-3 py-5 font-medium">DNI</th>
                <th scope="col" className="px-3 py-5 font-medium">Modalidad</th>
                <th scope="col" className="px-3 py-5 font-medium">Hora de Ingreso</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {asistencias?.map((asistencia) => (
                <tr
                  key={asistencia.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <p>{asistencia.socio.nombre} {asistencia.socio.apellido}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{asistencia.socio.dni}</td>
                  <td className="whitespace-nowrap px-3 py-3 capitalize">{asistencia.modalidad.toLowerCase()}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {new Date(asistencia.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {asistencias.length === 0 && (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">No hay asistencias para la selección actual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}