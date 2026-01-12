'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function DateFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (date) {
      params.set('date', date);
    } else {
      params.delete('date');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <label htmlFor="date-filter" className="sr-only">
        Filtrar por fecha
      </label>
      <input
        id="date-filter"
        type="date"
        className="block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500"
        onChange={(e) => handleDateChange(e.target.value)}
        defaultValue={searchParams.get('date')?.toString()}
      />
    </div>
  );
}
