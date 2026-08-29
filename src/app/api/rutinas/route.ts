import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        rol: true,
        esProfesorCrossfit: true,
        esProfesorMusculacion: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que sea profesor o admin
    if (user.rol !== 'ADMIN' && !user.esProfesorCrossfit && !user.esProfesorMusculacion) {
      return NextResponse.json({ error: 'No tiene permisos para crear rutinas' }, { status: 403 });
    }

    const body = await request.json();
    const { titulo, contenido, contenidoJson, tipo, nivel, semanaInicio } = body;

    if (!titulo || !tipo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Must have either contenido or contenidoJson
    if (!contenido && !contenidoJson) {
      return NextResponse.json({ error: 'Se requiere contenido o contenidoJson' }, { status: 400 });
    }

    // Verificar que el profesor pueda crear el tipo de rutina
    if (tipo === 'crossfit' && user.rol !== 'ADMIN' && !user.esProfesorCrossfit) {
      return NextResponse.json({ error: 'No es profesor de CrossFit' }, { status: 403 });
    }
    if (tipo === 'musculacion' && user.rol !== 'ADMIN' && !user.esProfesorMusculacion) {
      return NextResponse.json({ error: 'No es profesor de Musculación' }, { status: 403 });
    }

    // Determine version based on content type
    const version = contenidoJson ? 'structured' : 'legacy';

    const rutina = await prisma.rutina.create({
      data: {
        titulo,
        contenido: contenido || null,
        contenidoJson: contenidoJson || null,
        version,
        tipo,
        nivel: nivel || null,
        semanaInicio: semanaInicio ? new Date(semanaInicio) : null,
        profesorId: user.id,
      },
    });

    return NextResponse.json(rutina, { status: 201 });
  } catch (error) {
    console.error('Error al crear rutina:', error);
    return NextResponse.json({ error: 'Error al crear rutina' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const semana = searchParams.get('semana');

    let whereClause: Record<string, unknown> = {};

    if (semana) {
      // Filter by week start date
      const semanaDate = new Date(semana);
      whereClause.semanaInicio = semanaDate;
    } else {
      // Default: today's routines
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      whereClause.fecha = { gte: today, lt: tomorrow };
    }

    const rutinas = await prisma.rutina.findMany({
      where: whereClause,
      include: {
        profesor: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rutinas);
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas' }, { status: 500 });
  }
}
