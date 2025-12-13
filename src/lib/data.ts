import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchAsistenciasHoy(query: string, modalidad: string) {
  noStore();
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const whereClause: any = {
      fecha: {
        gte: hoy,
      },
    };

    if (modalidad && modalidad !== 'todos') {
      whereClause.modalidad = modalidad.toUpperCase();
    }

    if (query) {
      whereClause.socio = {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { dni: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    const asistencias = await prisma.asistencia.findMany({
      where: whereClause,
      include: { socio: true },
      orderBy: { fecha: 'desc' },
    });
    return asistencias;
  } catch (error) {
    console.error('Error de base de datos:', error);
    throw new Error('No se pudieron cargar las asistencias de hoy.');
  }
}