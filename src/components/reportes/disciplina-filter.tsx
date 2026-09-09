'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

const OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'musculacion', label: 'Musculación' },
  { value: 'crossfit', label: 'Crossfit' },
] as const;

export default function DisciplinaFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (term: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('estadoSuscripcion');
    if (term) {
      params.set('disciplina', term);
    } else {
      params.delete('disciplina');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const currentFilter = searchParams.get('disciplina');

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
        Disciplina:
      </span>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleFilter(option.value)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            currentFilter === option.value || (!currentFilter && !option.value)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
