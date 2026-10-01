import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { getStartOfTodayBuenosAires, getStartOfTomorrowBuenosAires } from '@/lib/date-utils';

export async function fetchAsistenciasHoy(modalidadId?: string) {
  noStore();
  // "Hoy" in Argentina (UTC-3), not server UTC.
  const startOfDay = getStartOfTodayBuenosAires();
  const endOfDay = getStartOfTomorrowBuenosAires();

  const whereClause: any = {
    fecha: {
      gte: startOfDay,
      lt: endOfDay,
    },
  };
  if (modalidadId) {
    whereClause.modalidadId = modalidadId;
  }

  try {
    const asistencias = await prisma.asistencia.findMany({
      where: whereClause,
      include: {
        socio: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });
    return asistencias;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch today attendance records.');
  }
}

