import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([], { headers: getCorsHeaders(request) });
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

    return NextResponse.json(socios, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error al buscar socios:', error);
    return NextResponse.json({ error: 'Error al buscar socios' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
