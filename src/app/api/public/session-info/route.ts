import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../auth/route';
import { getCorsHeaders } from '@/lib/cors';
import { isProfesorEnTurno, type Horarios } from '@/lib/horarios';

const DAY_MAP: Record<number, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

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
          // Get today's schedule for the professor
          const now = new Date();
          const dayName = DAY_MAP[now.getDay()];
          const horarios = prof.horarios as Horarios | null;

          let horarioHoy: string | null = null;
          if (horarios && dayName !== 'domingo') {
            // Check which discipline is active and get the time slot
            if (prof.esProfesorCrossfit && horarios.crossfit?.[dayName]) {
              const slot = horarios.crossfit[dayName];
              horarioHoy = `${slot.inicio} - ${slot.fin}`;
            } else if (prof.esProfesorMusculacion && horarios.musculacion?.[dayName]) {
              const slot = horarios.musculacion[dayName];
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
