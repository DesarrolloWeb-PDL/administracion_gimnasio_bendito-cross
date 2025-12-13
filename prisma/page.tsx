import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchAsistenciasHoy } from '@/lib/data';
import TablaAsistenciasProfesor from '@/components/profesor/tabla-asistencias-profesor';
import { AsistenciasTableSkeleton } from '@/components/ui/skeletons';
import Search from '@/components/ui/search';
import FiltroModalidadProfesor from '@/components/profesor/filtro-modalidad-profesor';

export default async function PaginaAsistenciaProfesor({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    modalidad?: string;
  };
}) {
  const session = await auth();
  if (session?.user?.role !== 'PROFESOR') {
    redirect('/');
  }

  const query = searchParams?.query || '';
  const modalidad = searchParams?.modalidad || 'todos';
  const asistencias = await fetchAsistenciasHoy(query, modalidad);

  return (
    <div className="w-full">
      <h1 className="text-2xl mb-4">Historial de Asistencia de Hoy</h1>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar por nombre, apellido o DNI..." />
        <FiltroModalidadProfesor />
      </div>
      <Suspense key={query + modalidad} fallback={<AsistenciasTableSkeleton />}>
        <TablaAsistenciasProfesor asistencias={asistencias} />
      </Suspense>
    </div>
  );
}