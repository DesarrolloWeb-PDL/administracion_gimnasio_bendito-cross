'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const ModalidadSchema = z.object({
  asistenciaId: z.string(),
  modalidad: z.enum(['MUSCULACION', 'CROSSFIT']),
});

export type ModalidadState = {
  message?: string;
  errors?: {
    asistenciaId?: string[];
    modalidad?: string[];
  };
  status?: 'success' | 'error';
};

export async function registrarModalidad(
  prevState: ModalidadState,
  formData: FormData
): Promise<ModalidadState> {
  const validatedFields = ModalidadSchema.safeParse({
    asistenciaId: formData.get('asistenciaId'),
    modalidad: formData.get('modalidad'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Datos inválidos.',
      status: 'error',
    };
  }

  const { asistenciaId, modalidad } = validatedFields.data;

  try {
    await prisma.asistencia.update({
      where: { id: asistenciaId },
      data: { modalidad },
    });

    revalidatePath('/admin/asistencias');
    
    return {
      message: 'Modalidad registrada correctamente.',
      status: 'success',
    };
  } catch (error) {
    console.error('Error al registrar modalidad:', error);
    return {
      message: 'Error al registrar la modalidad.',
      status: 'error',
    };
  }
}
