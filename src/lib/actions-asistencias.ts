'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
                diasVencimiento = diffDays;
                
                if (diffDays <= 5 && diffDays > 0) {
                    // ADVERTENCIA (Naranja) - Quedan 5 días o menos
                    estadoSuscripcion = 'PERSUADIDO';
                    mensajeEstado = `Su cuota vence en ${diffDays} día${diffDays === 1 ? '' : 's'}. Regularice su situación pronto.`;
                } else if (diffDays === 0) {
                    // HOY VENCE (Naranja)
                    estadoSuscripcion = 'PERSUADIDO';
                    mensajeEstado = 'Su cuota vence hoy. Regularice su situación con la administración.';
                } else {
                    // NORMAL (Verde) - Más de 5 días
                    estadoSuscripcion = 'ACTIVA';
                    mensajeEstado = 'Bienvenido/a';
                }
            } else {
                // CASO: Suscripción Vencida
                const diasVencidos = Math.abs(diffDays);
                diasVencimiento = -diasVencidos; // Negativo para indicar vencido

                // BLOQUEO (Rojo) - Ya venció
                estadoSuscripcion = 'VENCIDA';
                mensajeEstado = `Su cuota venció hace ${diasVencidos} día${diasVencidos === 1 ? '' : 's'}. Diríjase a la administración para regularizar su situación.`;
            }
        } else {
            // No tiene ninguna suscripción registrada
            estadoSuscripcion = 'SIN_SUSCRIPCION';
            mensajeEstado = 'No posee suscripción activa.';
        }
    }

    // 3. Registrar asistencia y Retornar Resultado
    // Solo registramos si está ACTIVA o PERSUADIDO (Naranja/Amarillo - advertencia)
    if (estadoSuscripcion === 'ACTIVA' || estadoSuscripcion === 'PERSUADIDO') {
      await prisma.asistencia.create({
        data: {
          socioId: socio.id,
          fecha: new Date(), // Usamos fecha actual con hora
        },
      });

      revalidatePath('/admin'); 
      revalidatePath('/admin/asistencias');

      // Determinar el status del mensaje
      let statusResponse: 'success' | 'warning' | 'error' = 'success';
      
      if (estadoSuscripcion === 'PERSUADIDO') {
        // Naranja: cuando quedan 5 días o menos
        statusResponse = 'warning';
      } else {
        // Verde: normal (más de 5 días)
        statusResponse = 'success';
      }

      return {
        message: mensajeEstado,
        status: statusResponse,
        socio: {
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono,
          estadoSuscripcion,
          diasVencimiento,
        },
      };
    } else {
      // Bloqueo (Rojo) - Vencida o Sin Suscripción
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
