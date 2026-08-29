import Link from 'next/link';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RutinaCard from '@/components/rutinas/rutina-card';
import CreateRutinaButton from '@/components/rutinas/create-rutina-button';

export default async function RutinasPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.esProfesorCrossfit && !user?.esProfesorMusculacion && user?.rol !== 'ADMIN') {
    redirect('/admin');
  }

  // Rutinas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rutinas = await prisma.rutina.findMany({
    where: {
      fecha: { gte: today, lt: tomorrow },
    },
    include: {
      profesor: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rutinasCrossfit = rutinas.filter((r) => r.tipo === 'crossfit');
  const rutinasMusculacion = rutinas.filter((r) => r.tipo === 'musculacion');

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rutinas del Día</h1>
        <CreateRutinaButton userRol={user.rol} esProfesorCrossfit={user.esProfesorCrossfit} esProfesorMusculacion={user.esProfesorMusculacion} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* CrossFit */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="text-red-500">🔥</span> CrossFit
          </h2>
          {rutinasCrossfit.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No hay rutinas de CrossFit hoy</p>
          ) : (
            <div className="space-y-3">
              {rutinasCrossfit.map((rutina) => (
                <RutinaCard key={rutina.id} rutina={rutina} />
              ))}
            </div>
          )}
        </div>

        {/* Musculación */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="text-blue-500">💪</span> Musculación
          </h2>
          {rutinasMusculacion.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No hay rutinas de Musculación hoy</p>
          ) : (
            <div className="space-y-3">
              {rutinasMusculacion.map((rutina) => (
                <RutinaCard key={rutina.id} rutina={rutina} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
