'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { abrirPuertaMagnetica } from '@/lib/puerta-service';

const CheckInSchema = z.object({
  dni: z.string().min(1, 'El DNI es obligatorio'),
});

export type CheckInState = {
  message?: string;
  errors?: {
    dni?: string[];
  };
  status?: 'success' | 'error' | 'warning'; 
  socio?: {
    nombre: string;
    apellido: string;
    telefono?: string | null;
    estadoSuscripcion: 'ACTIVA' | 'VENCIDA' | 'SIN_SUSCRIPCION' | 'PERSUADIDO';
    diasVencimiento?: number; 
  };
};

export async function registrarAsistencia(prevState: CheckInState, formData: FormData): Promise<CheckInState> {
  const validatedFields = CheckInSchema.safeParse({
    dni: formData.get('dni'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor ingrese un DNI válido.',
      status: 'error',
    };
  }

  const { dni } = validatedFields.data;

  try {
    // 1. Buscar al socio
    const socio = await prisma.socio.findUnique({
      where: { dni },
      include: {
        suscripciones: {
          where: {
            activa: true,
          },
          orderBy: {
            fechaFin: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!socio) {
      return {
        message: 'Socio no encontrado.',
        status: 'error',
      };
    }

    // 2. Verificar estado de suscripción (Nueva Lógica Personalizada)
    let estadoSuscripcion: 'ACTIVA' | 'VENCIDA' | 'SIN_SUSCRIPCION' | 'PERSUADIDO' = 'SIN_SUSCRIPCION';
    let diasVencimiento = 0;
    let mensajeEstado = '';
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalizar hoy al inicio del día

    if (socio.esLibre) {
        estadoSuscripcion = 'ACTIVA';
        mensajeEstado = 'Socio Libre - Acceso Permitido';
    } else {
        // Buscar la última suscripción (activa o vencida, pero que haya sido pagada/creada)
        // Asumimos que socio.suscripciones[0] es la última por el orderBy en la query
        const ultimaSuscripcion = socio.suscripciones[0];

        if (ultimaSuscripcion) {
            const fechaFin = new Date(ultimaSuscripcion.fechaFin);
            fechaFin.setHours(0, 0, 0, 0); // Normalizar fecha fin

            // Calcular diferencia en días
            const diffTime = fechaFin.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
                // CASO: Suscripción Vigente
                estadoSuscripcion = 'ACTIVA';
                diasVencimiento = diffDays;
                
                if (diffDays <= 7) {
                    // AVISO PREVIO (Verde con advertencia)
                    mensajeEstado = `Su cuota vence en ${diffDays} días.`;
                } else {
                    // NORMAL
                    mensajeEstado = 'Bienvenido/a';
                }
            } else {
                // CASO: Suscripción Vencida
                const diasVencidos = Math.abs(diffDays);
                diasVencimiento = -diasVencidos; // Negativo para indicar vencido

                if (diasVencidos <= 6) {
                    // TOLERANCIA (Naranja)
                    estadoSuscripcion = 'PERSUADIDO';
                    mensajeEstado = `Su cuota venció hace ${diasVencidos} días. Regularice su situación con la administración.`;
                } else {
                    // BLOQUEO (Rojo)
                    estadoSuscripcion = 'VENCIDA';
                    mensajeEstado = 'Acceso denegado. Su cuota venció hace más de 6 días. Regularice su situación.';
                }
            }
        } else {
            // No tiene ninguna suscripción registrada
            estadoSuscripcion = 'SIN_SUSCRIPCION';
            mensajeEstado = 'No posee suscripción activa.';
        }
    }

    // 3. Registrar asistencia y Retornar Resultado
    // Solo registramos si está ACTIVA o PERSUADIDO (Naranja)
    if (estadoSuscripcion === 'ACTIVA' || estadoSuscripcion === 'PERSUADIDO') {
      await prisma.asistencia.create({
        data: {
          socioId: socio.id,
          fecha: new Date(), // Usamos fecha actual con hora
        },
      });

      // Abrir puerta magnética vía relé USB
      await abrirPuertaMagnetica();

      revalidatePath('/admin'); 
      revalidatePath('/admin/asistencias');

      return {
        message: mensajeEstado,
        status: estadoSuscripcion === 'ACTIVA' ? 'success' : 'warning',
        socio: {
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono,
          estadoSuscripcion,
          diasVencimiento,
        },
      };
    } else {
      // Bloqueo (Rojo) o Sin Suscripción
      return {
        message: mensajeEstado,
        status: 'error',
        socio: {
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono,
          estadoSuscripcion,
          diasVencimiento,
        },
      };
    }

  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return {
      message: 'Error de base de datos.',
      status: 'error',
    };
  }
}
