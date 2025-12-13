'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function FiltroModalidadProfesor() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (modalidad: string) => {
    const params = new URLSearchParams(searchParams);
    if (modalidad && modalidad !== 'todos') {
      params.set('modalidad', modalidad);
    } else {
      params.delete('modalidad');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <select onChange={(e) => handleFilter(e.target.value)} defaultValue={searchParams.get('modalidad') || 'todos'} className="peer block rounded-md border border-gray-200 bg-white text-gray-900 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500">
      <option value="todos">Todas</option>
      <option value="MUSCULACION">Musculación</option>
      <option value="CROSSFIT">Crossfit</option>
    </select>
  );
}