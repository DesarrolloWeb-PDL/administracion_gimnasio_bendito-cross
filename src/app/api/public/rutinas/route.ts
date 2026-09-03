import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../auth/route';
import { getProfesoresEnTurno } from '@/lib/horarios';
import { getCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const tipo = searchParams.get('tipo'); // crossfit | musculacion | null (todos)

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401, headers: getCorsHeaders(request) });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401, headers: getCorsHeaders(request) });
    }

    // Obtener rutinas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    // Usar el profesor del token (quien estaba en turno al momento del check-in)
    if (tokenData.profesorId) {
      whereClause.profesorId = tokenData.profesorId;
    } else {
      // Fallback: si no hay profesor en el token, usar horario actual
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

      const disciplinas: Array<'crossfit' | 'musculacion'> = tipo === 'crossfit' || tipo === 'musculacion'
        ? [tipo]
        : ['crossfit', 'musculacion'];

      const profesorIdsEnTurno = new Set<string>();
      for (const disc of disciplinas) {
        const ids = getProfesoresEnTurno(profesores, disc, now);
        ids.forEach((id) => profesorIdsEnTurno.add(id));
      }

      if (profesorIdsEnTurno.size > 0) {
        whereClause.profesorId = { in: Array.from(profesorIdsEnTurno) };
      }
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

    return NextResponse.json(rutinas, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
