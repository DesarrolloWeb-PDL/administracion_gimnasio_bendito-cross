import { fetchTransacciones } from '@/lib/data-transacciones';

export default async function TransaccionesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const transacciones = await fetchTransacciones(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {transacciones?.map((transaccion) => (
              <div
                key={transaccion.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p>{transaccion.suscripcion.socio.nombre} {transaccion.suscripcion.socio.apellido}</p>
                    </div>
                    <p className="text-sm text-gray-500">{transaccion.notas || transaccion.suscripcion.plan.nombre}</p>
                  </div>
                  <div className="text-xl font-medium">
                    ${Number(transaccion.monto).toFixed(2)}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500">{transaccion.fecha.toLocaleDateString()}</p>
                  </div>
                  <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {transaccion.metodoPago}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Socio
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Concepto
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Monto
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Fecha
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Método
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {transacciones?.map((transaccion) => (
                <tr
                  key={transaccion.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>{transaccion.suscripcion.socio.nombre} {transaccion.suscripcion.socio.apellido}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {transaccion.notas || transaccion.suscripcion.plan.nombre}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium">
                    ${Number(transaccion.monto).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {transaccion.fecha.toLocaleDateString()} {transaccion.fecha.toLocaleTimeString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {transaccion.metodoPago}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
