import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RutinaCard from '@/components/rutinas/rutina-card';
import CreateRutinaButton from '@/components/rutinas/create-rutina-button';
import StructuredRoutineCard from '@/components/rutinas/structured-routine-card';

export default async function RutinasPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.esProfesorCrossfit && !user?.esProfesorMusculacion && user?.rol !== 'ADMIN') {
    redirect('/admin');
  }

  const isAdmin = user.rol === 'ADMIN';
  const showCrossfit = isAdmin || user.esProfesorCrossfit;
  const showMusculacion = isAdmin || user.esProfesorMusculacion;

  // Rutinas de hoy (legacy daily)
  // Profesores solo ven sus propias rutinas; admin ve todas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const profesorFilter = !isAdmin ? { profesorId: user.id } : {};

  // Filtrar por tipo según la disciplina del profesor
  const tipoFilter = !isAdmin
    ? { tipo: showCrossfit ? 'crossfit' : 'musculacion' }
    : {};

  const rutinas = await prisma.rutina.findMany({
    where: {
      fecha: { gte: today, lt: tomorrow },
      ...profesorFilter,
      ...tipoFilter,
    },
    include: {
      profesor: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Structured weekly routines (active, any date)
  const weeklyRutinas = await prisma.rutina.findMany({
    where: {
      version: 'structured',
      contenidoJson: { not: Prisma.JsonNull },
      activa: true,
      ...profesorFilter,
      ...tipoFilter,
    },
    include: {
      profesor: { select: { nombre: true } },
    },
    orderBy: { semanaInicio: 'desc' },
  });

  const rutinasCrossfit = showCrossfit ? rutinas.filter((r) => r.tipo === 'crossfit') : [];
  const rutinasMusculacion = showMusculacion ? rutinas.filter((r) => r.tipo === 'musculacion') : [];
  const weeklyCrossfit = showCrossfit ? weeklyRutinas.filter((r) => r.tipo === 'crossfit') : [];
  const weeklyMusculacion = showMusculacion ? weeklyRutinas.filter((r) => r.tipo === 'musculacion') : [];

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rutinas</h1>
        <CreateRutinaButton userRol={user.rol} esProfesorCrossfit={user.esProfesorCrossfit} esProfesorMusculacion={user.esProfesorMusculacion} />
      </div>

      {/* Weekly Structured Routines */}
      {(weeklyCrossfit.length > 0 || weeklyMusculacion.length > 0) && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="text-green-500">📅</span> Rutinas Semanales
          </h2>
          <div className={`grid gap-4 ${showCrossfit && showMusculacion ? 'md:grid-cols-2' : ''}`}>
            {weeklyCrossfit.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <span className="text-red-500">🔥</span> CrossFit
                </h3>
                <div className="space-y-3">
                  {weeklyCrossfit.map((rutina) => (
                    <StructuredRoutineCard key={rutina.id} rutina={rutina} />
                  ))}
                </div>
              </div>
            )}
            {weeklyMusculacion.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <span className="text-blue-500">💪</span> Musculación
                </h3>
                <div className="space-y-3">
                  {weeklyMusculacion.map((rutina) => (
                    <StructuredRoutineCard key={rutina.id} rutina={rutina} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Legacy Routines */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="text-yellow-500">📝</span> Rutinas del Día
        </h2>
        <div className={`grid gap-6 ${showCrossfit && showMusculacion ? 'md:grid-cols-2' : ''}`}>
          {/* CrossFit */}
          {showCrossfit && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <span className="text-red-500">🔥</span> CrossFit
              </h3>
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
          )}

          {/* Musculación */}
          {showMusculacion && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <span className="text-blue-500">💪</span> Musculación
              </h3>
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
          )}
        </div>
      </div>
    </div>
  );
}
