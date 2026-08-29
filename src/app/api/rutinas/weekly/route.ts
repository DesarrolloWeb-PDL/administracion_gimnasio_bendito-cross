import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const semana = searchParams.get('semana');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      version: 'structured',
      contenidoJson: { not: null },
    };

    if (tipo && (tipo === 'crossfit' || tipo === 'musculacion')) {
      whereClause.tipo = tipo;
    }

    if (semana) {
      whereClause.semanaInicio = new Date(semana);
    }

    // Fetch structured routines
    const rutinas = await prisma.rutina.findMany({
      where: whereClause,
      include: {
        profesor: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by day of week
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const grouped: Record<string, typeof rutinas> = {};

    for (const day of daysOfWeek) {
      grouped[day] = [];
    }

    for (const rutina of rutinas) {
      if (rutina.contenidoJson && typeof rutina.contenidoJson === 'object') {
        const contenidoJson = rutina.contenidoJson as Record<string, unknown>;
        
        // Add routine to each day it contains
        for (const day of daysOfWeek) {
          if (contenidoJson[day]) {
            grouped[day].push(rutina);
          }
        }
      }
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error al obtener rutinas semanales:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas semanales' }, { status: 500 });
  }
}
