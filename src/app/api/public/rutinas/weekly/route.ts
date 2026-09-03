import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../../auth/route';
import { getProfesoresEnTurno } from '@/lib/horarios';
import { getCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const tipo = searchParams.get('tipo');
    const semana = searchParams.get('semana');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401, headers: getCorsHeaders(request) });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401, headers: getCorsHeaders(request) });
    }

    // Build where clause for structured routines
    const whereClause: Record<string, unknown> = {
      activa: true,
      version: 'structured',
      contenidoJson: { not: null },
    };

    if (tipo && (tipo === 'crossfit' || tipo === 'musculacion')) {
      whereClause.tipo = tipo;
    }

    if (semana) {
      whereClause.semanaInicio = new Date(semana);
    }

    // Usar el profesor del token (quien estaba en turno al momento del check-in)
    if (tokenData.profesorId) {
      whereClause.profesorId = tokenData.profesorId;
    } else {
      // Fallback: usar horario actual
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

    // Fetch structured routines
    const rutinas = await prisma.rutina.findMany({
      where: whereClause,
      include: {
        profesor: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return flat array - the client groups by day
    return NextResponse.json(rutinas, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error al obtener rutinas semanales públicas:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas semanales' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
