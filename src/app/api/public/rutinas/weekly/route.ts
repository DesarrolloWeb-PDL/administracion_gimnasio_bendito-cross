import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../../auth/route';

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
    const tipo = searchParams.get('tipo');
    const semana = searchParams.get('semana');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401, headers: CORS_HEADERS });
    }

    const socioId = verifyToken(token);
    if (!socioId) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401, headers: CORS_HEADERS });
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

    // Fetch structured routines
    const rutinas = await prisma.rutina.findMany({
      where: whereClause,
      include: {
        profesor: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return flat array - the client groups by day
    return NextResponse.json(rutinas, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error al obtener rutinas semanales públicas:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas semanales' }, { status: 500, headers: CORS_HEADERS });
  }
}
