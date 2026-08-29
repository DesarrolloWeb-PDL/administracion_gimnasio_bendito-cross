import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([], { headers: CORS_HEADERS });
    }

    // Only show socios who registered attendance in the last 3 hours
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const socios = await prisma.socio.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
        ],
        // Must have attendance in the last 3 hours
        asistencias: {
          some: {
            fecha: {
              gte: threeHoursAgo,
            },
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
      },
      orderBy: { apellido: 'asc' },
      take: 10,
    });

    return NextResponse.json(socios, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error al buscar socios:', error);
    return NextResponse.json({ error: 'Error al buscar socios' }, { status: 500, headers: CORS_HEADERS });
  }
}
