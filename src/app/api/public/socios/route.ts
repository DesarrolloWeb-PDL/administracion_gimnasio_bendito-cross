import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const socios = await prisma.socio.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
        ],
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

    return NextResponse.json(socios);
  } catch (error) {
    console.error('Error al buscar socios:', error);
    return NextResponse.json({ error: 'Error al buscar socios' }, { status: 500 });
  }
}
