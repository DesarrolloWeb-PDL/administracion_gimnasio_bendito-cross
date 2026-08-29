import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const rutina = await prisma.rutina.findUnique({
      where: { id },
    });

    if (!rutina) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    // Only the professor who created it or an admin can update
    if (user.rol !== 'ADMIN' && rutina.profesorId !== user.id) {
      return NextResponse.json({ error: 'No tiene permisos para editar esta rutina' }, { status: 403 });
    }

    const body = await request.json();
    const { titulo, contenido, contenidoJson, tipo, nivel, semanaInicio } = body;

    // Determine version based on content type
    const version = contenidoJson ? 'structured' : 'legacy';

    const updated = await prisma.rutina.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(contenido !== undefined && { contenido: contenido || null }),
        ...(contenidoJson !== undefined && { contenidoJson: contenidoJson || null }),
        ...(tipo !== undefined && { tipo }),
        ...(nivel !== undefined && { nivel: nivel || null }),
        ...(semanaInicio !== undefined && { semanaInicio: semanaInicio ? new Date(semanaInicio) : null }),
        version,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al actualizar rutina:', error);
    return NextResponse.json({ error: 'Error al actualizar rutina' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const rutina = await prisma.rutina.findUnique({
      where: { id },
    });

    if (!rutina) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    // Solo el profesor que la creó o un admin puede eliminarla
    if (user.rol !== 'ADMIN' && rutina.profesorId !== user.id) {
      return NextResponse.json({ error: 'No tiene permisos para eliminar esta rutina' }, { status: 403 });
    }

    await prisma.rutina.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error al eliminar rutina:', error);
    return NextResponse.json({ error: 'Error al eliminar rutina' }, { status: 500 });
  }
}
