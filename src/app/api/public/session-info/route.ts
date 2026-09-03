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
          select: { id: true, nombre: true },
        });
        profesor = prof || null;
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      profesor,
      checkInTime: tokenData.checkInTime || null,
    }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error al obtener info de sesión:', error);
    return NextResponse.json({ error: 'Error al obtener info de sesión' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
