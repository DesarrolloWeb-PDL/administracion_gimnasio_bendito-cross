'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function DateRangeFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const desde = searchParams.get('desde') ?? '';
  const hasta = searchParams.get('hasta') ?? '';

  const updateParam = (key: 'desde' | 'hasta', value: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('estadoSuscripcion');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('estadoSuscripcion');
    params.delete('desde');
    params.delete('hasta');
    replace(`${pathname}?${params.toString()}`);
  };

  const hasValue = Boolean(desde || hasta);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="desde"
          className="text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Desde
        </label>
        <input
          id="desde"
          type="date"
          value={desde}
          onChange={(e) => updateParam('desde', e.target.value)}
          className="block rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2 px-3 text-sm outline-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="hasta"
          className="text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Hasta
        </label>
        <input
          id="hasta"
          type="date"
          value={hasta}
          onChange={(e) => updateParam('hasta', e.target.value)}
          className="block rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2 px-3 text-sm outline-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {hasValue && (
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Limpiar fechas
        </button>
      )}
    </div>
  );
}
