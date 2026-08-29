import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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
