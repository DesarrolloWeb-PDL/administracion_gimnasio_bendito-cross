import { Suspense } from 'react';
import { auth } from '@/auth'; // Asumiendo que tienes auth.ts
import { redirect } from 'next/navigation';
import AsistenciaTable from '@/components/profesor/asistencia-table';
import { AsistenciaTableSkeleton } from '@/components/ui/skeletons';

export default async function ProfesorAsistenciaPage({
  searchParams,
}: {
  searchParams?: {
    modalidad?: string;
  };
}) {
  const session = await auth();
  // Redirigir si no está logueado o no es profesor
  if (!session?.user || session.user.role !== 'PROFESOR') {
    redirect('/'); // O a una página de "acceso denegado"
  }

  const modalidad = searchParams?.modalidad || '';

  return (
    <div className="w-full">
      <Suspense key={modalidad} fallback={<AsistenciaTableSkeleton />}>
        <AsistenciaTable modalidad={modalidad} />
      </Suspense>
    </div>
  );
}