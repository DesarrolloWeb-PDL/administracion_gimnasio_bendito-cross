import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

const ITEMS_PER_PAGE = 10;

export async function fetchAsistencias(query: string, currentPage: number, discipline?: string) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const whereClause: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (discipline === 'musculacion') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsMusculacion: true },
        },
      },
    };
  } else if (discipline === 'crossfit') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsCrossfit: true },
        },
      },
    };
  }

  try {
    const asistencias = await prisma.asistencia.findMany({
      skip: offset,
      take: ITEMS_PER_PAGE,
      where: whereClause,
      include: {
        socio: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    // Tipado explícito para TypeScript
    return asistencias as Array<{
      id: string;
      fecha: Date | string;
      socio: { id: string; nombre: string; apellido: string; dni: string };
    }>;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch attendance records.');
  }
}

export async function fetchAsistenciasPages(query: string, discipline?: string) {
  noStore();
  
  const whereClause: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (discipline === 'musculacion') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsMusculacion: true },
        },
      },
    };
  } else if (discipline === 'crossfit') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsCrossfit: true },
        },
      },
    };
  }

  try {
    const count = await prisma.asistencia.count({
      where: whereClause,
    });
    return Math.ceil(count / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of attendance pages.');
  }
}

export async function fetchAsistenciasHoy(discipline?: string) {
  noStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const whereClause: any = {
    fecha: {
      gte: today,
      lt: tomorrow,
    },
  };

  if (discipline === 'musculacion') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsMusculacion: true },
        },
      },
    };
  } else if (discipline === 'crossfit') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsCrossfit: true },
        },
      },
    };
  }

  try {
    const asistencias = await prisma.asistencia.findMany({
      where: whereClause,
      include: {
        socio: {
          include: {
            suscripciones: {
              where: { activa: true },
              include: { plan: true },
            },
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    return asistencias;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch attendance records for today.');
  }
}

