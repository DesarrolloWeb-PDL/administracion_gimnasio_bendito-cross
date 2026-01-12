import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

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
  const now = new Date();
  
  // Lógica: Mostrar asistencias de hoy, pero que no tengan más de 3 horas de antigüedad.
  // Esto asume que un entrenamiento dura como máximo 3 horas.
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  // La fecha de corte es el máximo entre "hace 3 horas" y "el inicio del día de hoy".
  // Normalmente "hace 3 horas" será mayor que el inicio del día (salvo de madrugada),
  // pero esto asegura que no mostremos asistencias de ayer si son las 01:00 AM.
  const cutoffDate = threeHoursAgo > todayStart ? threeHoursAgo : todayStart;

  // Límite superior: Ahora (o fin del día, da igual, futuras no existen).
  // Pero mantenemos "start of tomorrow" por consistencia si se prefiere, aunque "lte: now" es implícito.
  
  const whereClause: any = {
    fecha: {
      gte: cutoffDate,
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

