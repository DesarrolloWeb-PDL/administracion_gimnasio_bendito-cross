import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../auth/route';
import { getProfesoresEnTurno } from '@/lib/horarios';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://benditocross.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const tipo = searchParams.get('tipo'); // crossfit | musculacion | null (todos)

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401, headers: CORS_HEADERS });
    }

    const socioId = verifyToken(token);
    if (!socioId) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401, headers: CORS_HEADERS });
    }

    // Obtener rutinas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Determinar qué profesores están en turno ahora mismo
    const now = new Date();
    const profesores = await prisma.usuario.findMany({
      where: {
        OR: [
          { esProfesorCrossfit: true },
          { esProfesorMusculacion: true },
        ],
      },
      select: {
        id: true,
        horarios: true,
        esProfesorCrossfit: true,
        esProfesorMusculacion: true,
      },
    });

    // Si se pide un tipo específico, filtrar profesores en turno para ese tipo
    // Si no se pide tipo, combinar ambos
    const disciplinas: Array<'crossfit' | 'musculacion'> = tipo === 'crossfit' || tipo === 'musculacion'
      ? [tipo]
      : ['crossfit', 'musculacion'];

    const profesorIdsEnTurno = new Set<string>();
    for (const disc of disciplinas) {
      const ids = getProfesoresEnTurno(profesores, disc, now);
      ids.forEach((id) => profesorIdsEnTurno.add(id));
    }

    const whereClause: Record<string, unknown> = {
      activa: true,
      fecha: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    // Si hay profesores en turno, filtrar solo sus rutinas
    // Si no hay ninguno en turno, devolver todas (fallback graceful)
    if (profesorIdsEnTurno.size > 0) {
      whereClause.profesorId = { in: Array.from(profesorIdsEnTurno) };
    }

    const rutinas = await prisma.rutina.findMany({
      where: whereClause,
      include: {
        profesor: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rutinas, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas' }, { status: 500, headers: CORS_HEADERS });
  }
}
