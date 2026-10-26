'use client';

import { useMemo, useState } from 'react';
import { Socio } from '@prisma/client';

type SocioSearchSelectProps = {
  socios: Socio[];
  name?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
};

/** Normaliza tildes, mayúsculas y espacios para que "maria", "María" o "MARIA" filtre igual. */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_RESULTS = 12;

export default function SocioSearchSelect({
  socios,
  name = 'socioId',
  id,
  invalid = false,
  describedBy,
}: SocioSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  const selectedSocio = useMemo(
    () => socios.find((socio) => socio.id === selectedId) || null,
    [selectedId, socios]
  );

  const filteredSocios = useMemo(() => {
    const tokens = normalize(query).split(' ').filter(Boolean);
    const selectedDisplay = normalize(displayTextFor(selectedSocio));

    // Sin búsqueda, o cuando el texto es exactamente el socio ya elegido: listado normal.
    if (tokens.length === 0 || (selectedSocio && normalize(query) === selectedDisplay)) {
      return socios.slice(0, MAX_RESULTS);
    }

    // Búsqueda por tokens: "garcia pablo 3503" encuentra a Pablo Garcia aunque el
    // orden o los campos no coincidan, porque cada token puede caer en cualquier campo.
    return socios
      .filter((socio) => {
        const haystack = normalize(
          `${socio.nombre} ${socio.apellido} ${socio.dni}`
        );
        return tokens.every((token) => haystack.includes(token));
      })
      .slice(0, MAX_RESULTS);
  }, [query, socios, selectedSocio]);

  function displayTextFor(socio: Socio | null): string {
    return socio ? `${socio.nombre} ${socio.apellido} - ${socio.dni}` : '';
  }

  function selectSocio(socio: Socio) {
    setSelectedId(socio.id);
    setQuery(displayTextFor(socio));
    setIsOpen(false);
  }

  function clearSelection() {
    setSelectedId('');
    setQuery('');
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <div className="relative">
        <input
          type="text"
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="socio-search-listbox"
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            // Si edita el texto, la selección anterior deja de ser válida.
            if (selectedId) setSelectedId('');
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Deja tiempo a que el click en una opción se registre antes de cerrar.
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
            if (event.key === 'Enter' && isOpen && filteredSocios.length > 0) {
              event.preventDefault();
              selectSocio(filteredSocios[0]);
            }
          }}
          placeholder="Buscar por nombre, apellido o DNI..."
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`peer block w-full rounded-md border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 pl-3 pr-16 text-sm outline-2 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
            invalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />

        {selectedId && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600"
          >
            Limpiar
          </button>
        )}

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg">
            <div id="socio-search-listbox" role="listbox" className="max-h-64 overflow-y-auto py-1">
              {filteredSocios.length > 0 ? (
                filteredSocios.map((socio) => (
                  <button
                    key={socio.id}
                    type="button"
                    role="option"
                    aria-selected={socio.id === selectedId}
                    // onMouseDown en vez de onClick: no pierde el foco del input y el dropdown no se cierra antes.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectSocio(socio);
                    }}
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                      socio.id === selectedId ? 'bg-blue-50 dark:bg-gray-600' : ''
                    }`}
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {socio.apellido}, {socio.nombre}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">DNI: {socio.dni}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron socios
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
