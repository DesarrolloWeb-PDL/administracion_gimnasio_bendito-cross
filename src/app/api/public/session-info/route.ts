import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../auth/route';
import { getCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401, headers: getCorsHeaders(request) });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401, headers: getCorsHeaders(request) });
    }

    let profesor = null;
    if (tokenData.profesorId) {
      try {
        const prof = await prisma.usuario.findUnique({
          where: { id: tokenData.profesorId },
          select: { id: true, nombre: true, horarios: true, esProfesorCrossfit: true, esProfesorMusculacion: true },
        });
        if (prof) {
          const horarios = prof.horarios as { crossfit?: Record<string, { inicio: string; fin: string } | null>; musculacion?: Record<string, { inicio: string; fin: string } | null> } | null;

          // Use Argentina local time (UTC-3)
          const now = new Date();
          const utcHours = now.getUTCHours();
          const utcMinutes = now.getUTCMinutes();
          const localMinutes = utcHours * 60 + utcMinutes + (-3 * 60);
          const adjustedMinutes = localMinutes < 0 ? localMinutes + 1440 : localMinutes >= 1440 ? localMinutes - 1440 : localMinutes;
          const localHour = Math.floor(adjustedMinutes / 60);
          const dayIndex = (now.getUTCDay() + (localMinutes < 0 ? -1 : localMinutes >= 1440 ? 1 : 0) + 7) % 7;
          const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          const dayName = dayNames[dayIndex];

          let horarioHoy: string | null = null;
          if (horarios && dayName !== 'domingo') {
            if (prof.esProfesorCrossfit && horarios.crossfit?.[dayName]) {
              const slot = horarios.crossfit[dayName]!;
              horarioHoy = `${slot.inicio} - ${slot.fin}`;
            } else if (prof.esProfesorMusculacion && horarios.musculacion?.[dayName]) {
              const slot = horarios.musculacion[dayName]!;
              horarioHoy = `${slot.inicio} - ${slot.fin}`;
            }
          }

          profesor = { id: prof.id, nombre: prof.nombre, horario: horarioHoy };
        }
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      profesor,
    }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error al obtener info de sesión:', error);
    return NextResponse.json({ error: 'Error al obtener info de sesión' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
