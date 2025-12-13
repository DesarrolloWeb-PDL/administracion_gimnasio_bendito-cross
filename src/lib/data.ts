import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchModalidades() {
  noStore();
  try {
    const modalidades = await prisma.modalidad.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
    return modalidades;
  } catch (error) {
    console.error('Error de base de datos:', error);
    throw new Error('No se pudieron cargar las modalidades.');
  }
}

export async function fetchAsistenciasHoy(modalidadId: string) {
  noStore();
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: hoy,
        },
        modalidadId: modalidadId || undefined,
      },
      include: {
        socio: true,
        modalidad: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    return asistencias;
  } catch (error) {
    console.error('Error de base de datos:', error);
    throw new Error('No se pudieron cargar las asistencias de hoy.');
  }
}