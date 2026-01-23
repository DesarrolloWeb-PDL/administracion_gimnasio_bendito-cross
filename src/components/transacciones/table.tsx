import { fetchTransacciones } from '@/lib/data-transacciones';
import Link from 'next/link';
import DeleteButton from './delete-button';

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
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
          <div className="md:hidden">
            {transacciones?.map((transaccion) => (
              <div
                key={transaccion.id}
                className="mb-2 w-full rounded-md bg-white dark:bg-gray-700 p-4"
              >
                <div className="flex items-center justify-between border-b dark:border-gray-600 pb-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center">
                      <p className="text-gray-900 dark:text-gray-100">{transaccion.suscripcion.socio.nombre} {transaccion.suscripcion.socio.apellido}</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={transaccion.notas || transaccion.suscripcion.plan.nombre}>
                      {transaccion.notas || transaccion.suscripcion.plan.nombre}
                    </p>
                  </div>
                  <div className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    ${Number(transaccion.monto).toFixed(2)}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaccion.fecha.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                      {transaccion.metodoPago}
                    </div>
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/transacciones/${transaccion.id}`}
                        className="rounded-md bg-blue-100 dark:bg-blue-900 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 dark:text-gray-100 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6 text-gray-900 dark:text-gray-100">
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
                <th scope="col" className="px-3 py-5 font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700">
              {transacciones?.map((transaccion) => (
                <tr
                  key={transaccion.id}
                  className="w-full border-b border-gray-200 dark:border-gray-600 py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>{transaccion.suscripcion.socio.nombre} {transaccion.suscripcion.socio.apellido}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <p className="truncate" title={transaccion.notas || transaccion.suscripcion.plan.nombre}>
                      {transaccion.notas || transaccion.suscripcion.plan.nombre}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium">
                    ${Number(transaccion.monto).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {transaccion.fecha.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' })} {transaccion.fecha.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {transaccion.metodoPago}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/transacciones/${transaccion.id}`}
                        className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        Editar
                      </Link>
                      <DeleteButton id={transaccion.id} />
                    </div>
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
