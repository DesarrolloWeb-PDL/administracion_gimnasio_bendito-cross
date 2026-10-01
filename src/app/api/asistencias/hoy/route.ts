import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStartOfTodayBuenosAires } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const discipline = searchParams.get('discipline');

  // Last 3 hours, floored at start of today in Argentina (UTC-3).
  // A class lasts at most ~3 hours; never show yesterday's attendance.
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStart = getStartOfTodayBuenosAires();
  const cutoffDate = threeHoursAgo > todayStart ? threeHoursAgo : todayStart;

  const whereClause: any = {
    fecha: {
      gte: cutoffDate,
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

    return NextResponse.json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return NextResponse.json({ error: 'Error al obtener asistencias' }, { status: 500 });
  }
}
