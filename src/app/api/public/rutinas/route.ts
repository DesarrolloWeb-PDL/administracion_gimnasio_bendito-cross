import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '../auth/route';

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

    const whereClause: any = {
      activa: true,
      fecha: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (tipo) {
      whereClause.tipo = tipo;
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
