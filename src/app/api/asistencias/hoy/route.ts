import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStartOfTodayBuenosAires, getStartOfTomorrowBuenosAires } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const discipline = searchParams.get('discipline');

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

    return NextResponse.json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return NextResponse.json({ error: 'Error al obtener asistencias' }, { status: 500 });
  }
}
