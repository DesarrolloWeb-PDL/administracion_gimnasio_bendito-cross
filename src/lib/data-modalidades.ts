import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchAsistenciasHoy(modalidadId?: string) {
  noStore();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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

export async function fetchModalidades() {
  noStore();
  try {
    const modalidades = await prisma.modalidad.findMany({
      orderBy: { nombre: 'asc' },
    });
    return modalidades;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch modalidades.');
  }
}
