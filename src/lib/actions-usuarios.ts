'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

const TimeSlotSchema = z.object({
  inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  fin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
}).refine((data) => {
  const [inicioH, inicioM] = data.inicio.split(':').map(Number);
  const [finH, finM] = data.fin.split(':').map(Number);
  const inicioMinutes = inicioH * 60 + inicioM;
  const finMinutes = finH * 60 + finM;
  return inicioMinutes < finMinutes;
}, { message: 'La hora de inicio debe ser anterior a la hora de fin' });

const DayScheduleSchema = z.object({
  lunes: TimeSlotSchema.nullable().optional(),
  martes: TimeSlotSchema.nullable().optional(),
  miercoles: TimeSlotSchema.nullable().optional(),
  jueves: TimeSlotSchema.nullable().optional(),
  viernes: TimeSlotSchema.nullable().optional(),
  sabado: TimeSlotSchema.nullable().optional(),
}).nullable();

const HorariosSchema = z.object({
  crossfit: DayScheduleSchema.optional(),
  musculacion: DayScheduleSchema.optional(),
}).nullable();

const FormSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol: z.string().min(1, 'El rol es obligatorio.'),
  permisoSocios: z.string().optional().nullable(),
  permisoPlanes: z.string().optional().nullable(),
  permisoSuscripciones: z.string().optional().nullable(),
  permisoAsistencias: z.string().optional().nullable(),
  permisoReportes: z.string().optional().nullable(),
  permisoConfiguracion: z.string().optional().nullable(),
  permisoUsuarios: z.string().optional().nullable(),
  permisoTransacciones: z.string().optional().nullable(),
  esProfesorCrossfit: z.string().optional().nullable(),
  esProfesorMusculacion: z.string().optional().nullable(),
  horarios: z.string().optional().nullable(),
});

const CreateUsuario = FormSchema.omit({ id: true });
const UpdateUsuario = FormSchema.omit({ id: true, password: true }).extend({
  password: z.string().optional(),
});

export async function createUsuario(prevState: unknown, formData: FormData) {
  const validatedFields = CreateUsuario.safeParse({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
    rol: formData.get('rol'),
    permisoSocios: formData.get('permisoSocios'),
    permisoPlanes: formData.get('permisoPlanes'),
    permisoSuscripciones: formData.get('permisoSuscripciones'),
    permisoAsistencias: formData.get('permisoAsistencias'),
    permisoReportes: formData.get('permisoReportes'),
    permisoConfiguracion: formData.get('permisoConfiguracion'),
    permisoUsuarios: formData.get('permisoUsuarios'),
    permisoTransacciones: formData.get('permisoTransacciones'),
    horarios: formData.get('horarios'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo crear el usuario.',
    };
  }

  const { nombre, email, password, rol, permisoSocios, permisoPlanes, permisoSuscripciones, permisoAsistencias, permisoReportes, permisoConfiguracion, permisoUsuarios, permisoTransacciones, horarios } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Parse horarios from JSON string if provided
  let horariosData = null;
  if (horarios) {
    try {
      horariosData = JSON.parse(horarios);
      // Validate horarios structure
      const horariosValidation = HorariosSchema.safeParse(horariosData);
      if (!horariosValidation.success) {
        return {
          errors: { horarios: ['Estructura de horarios inválida'] },
          message: 'Los horarios tienen un formato inválido.',
        };
      }
    } catch {
      return {
        errors: { horarios: ['JSON de horarios inválido'] },
        message: 'Los horarios deben ser un JSON válido.',
      };
    }
  }

  // Derive discipline booleans from rol
  const esProfesorCrossfit = rol === 'PROFESOR_CROSSFIT' || rol === 'PROFESOR_FUNCIONAL';
  const esProfesorMusculacion = rol === 'PROFESOR_MUSCULACION';

  try {
    await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
        permisoSocios: permisoSocios === 'on',
        permisoPlanes: permisoPlanes === 'on',
        permisoSuscripciones: permisoSuscripciones === 'on',
        permisoAsistencias: permisoAsistencias === 'on',
        permisoReportes: permisoReportes === 'on',
        permisoConfiguracion: permisoConfiguracion === 'on',
        permisoUsuarios: permisoUsuarios === 'on',
        permisoTransacciones: permisoTransacciones === 'on',
        esProfesorCrossfit,
        esProfesorMusculacion,
        horarios: horariosData,
      },
    });
  } catch {
    return {
      message: 'Error de base de datos: No se pudo crear el usuario. El email podría estar duplicado.',
    };
  }

  revalidatePath('/admin/usuarios');
  redirect('/admin/usuarios');
}

export async function updateUsuario(id: string, prevState: unknown, formData: FormData) {
  const passwordRaw = formData.get('password') as string;
  
  // Si la contraseña está vacía, no la validamos ni la actualizamos
  const dataToValidate = {
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    rol: formData.get('rol'),
    permisoSocios: formData.get('permisoSocios'),
    permisoPlanes: formData.get('permisoPlanes'),
    permisoSuscripciones: formData.get('permisoSuscripciones'),
    permisoAsistencias: formData.get('permisoAsistencias'),
    permisoReportes: formData.get('permisoReportes'),
    permisoConfiguracion: formData.get('permisoConfiguracion'),
    permisoUsuarios: formData.get('permisoUsuarios'),
    permisoTransacciones: formData.get('permisoTransacciones'),
    horarios: formData.get('horarios'),
    ...(passwordRaw ? { password: passwordRaw } : {}),
  };

  // Usamos un esquema dinámico dependiendo de si hay password o no
  const schema = passwordRaw 
    ? UpdateUsuario.extend({ password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.') })
    : UpdateUsuario;

  const validatedFields = schema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo actualizar el usuario.',
    };
  }

  const { nombre, email, rol, password, permisoSocios, permisoPlanes, permisoSuscripciones, permisoAsistencias, permisoReportes, permisoConfiguracion, permisoUsuarios, permisoTransacciones, horarios } = validatedFields.data;

  // Parse horarios from JSON string if provided
  let horariosData = null;
  if (horarios) {
    try {
      horariosData = JSON.parse(horarios);
      // Validate horarios structure
      const horariosValidation = HorariosSchema.safeParse(horariosData);
      if (!horariosValidation.success) {
        return {
          errors: { horarios: ['Estructura de horarios inválida'] },
          message: 'Los horarios tienen un formato inválido.',
        };
      }
    } catch {
      return {
        errors: { horarios: ['JSON de horarios inválido'] },
        message: 'Los horarios deben ser un JSON válido.',
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataToUpdate: any = {
    nombre,
    email,
    rol,
    permisoSocios: permisoSocios === 'on',
    permisoPlanes: permisoPlanes === 'on',
    permisoSuscripciones: permisoSuscripciones === 'on',
    permisoAsistencias: permisoAsistencias === 'on',
    permisoReportes: permisoReportes === 'on',
    permisoConfiguracion: permisoConfiguracion === 'on',
    permisoUsuarios: permisoUsuarios === 'on',
    permisoTransacciones: permisoTransacciones === 'on',
    esProfesorCrossfit: rol === 'PROFESOR_CROSSFIT' || rol === 'PROFESOR_FUNCIONAL',
    esProfesorMusculacion: rol === 'PROFESOR_MUSCULACION',
    horarios: horariosData,
  };

  if (password) {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  try {
    await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });
  } catch {
    return { message: 'Error de base de datos: No se pudo actualizar el usuario.' };
  }

  revalidatePath('/admin/usuarios');
  redirect('/admin/usuarios');
}

export async function deleteUsuario(id: string) {
  try {
    await prisma.usuario.delete({
      where: { id },
    });
    revalidatePath('/admin/usuarios');
  } catch (error) {
    console.error('Error deleting usuario:', error);
  }
}
