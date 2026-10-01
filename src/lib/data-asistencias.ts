import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { getStartOfTodayBuenosAires, getStartOfTomorrowBuenosAires } from '@/lib/date-utils';

const ITEMS_PER_PAGE = 10;

export async function fetchAsistencias(query: string, currentPage: number, discipline?: string, date?: string) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const whereClause: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (date) {
    const startDate = new Date(`${date}T00:00:00-03:00`);
    const endDate = new Date(`${date}T23:59:59.999-03:00`);
    whereClause.fecha = {
      gte: startDate,
      lte: endDate,
    };
  }

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

export async function fetchAsistenciasPages(query: string, discipline?: string, date?: string) {
  noStore();
  
  const whereClause: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (date) {
    const startDate = new Date(`${date}T00:00:00-03:00`);
    const endDate = new Date(`${date}T23:59:59.999-03:00`);
    whereClause.fecha = {
      gte: startDate,
      lte: endDate,
    };
  }

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
  // "Hoy" in Argentina (UTC-3), not server UTC.
  const todayStart = getStartOfTodayBuenosAires();
  const tomorrowStart = getStartOfTomorrowBuenosAires();

  const whereClause: any = {
    fecha: {
      gte: todayStart,
      lt: tomorrowStart,
    },
  };

  // CrossFit and Funcional share plans (allowsCrossfit).
  if (discipline === 'musculacion') {
    whereClause.socio = {
      suscripciones: {
        some: {
          activa: true,
          plan: { allowsMusculacion: true },
        },
      },
    };
  } else if (discipline === 'crossfit' || discipline === 'funcional') {
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

