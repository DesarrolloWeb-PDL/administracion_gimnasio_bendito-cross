'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

// === SCHEMAS ===

const AbrirCuentaCorrienteSchema = z.object({
  socioId: z.string().min(1, 'El socio es requerido'),
  descripcion: z.string().optional().nullable(),
});

const RegistrarMovimientoSchema = z.object({
  cuentaCorrienteId: z.string().min(1, 'La cuenta corriente es requerida'),
  tipo: z.enum(['DEUDA', 'CREDITO', 'PAGO', 'AJUSTE']),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  transaccionId: z.string().optional(),
});

const CerrarCuentaCorrienteSchema = z.object({
  cuentaCorrienteId: z.string().min(1, 'La cuenta corriente es requerida'),
});

// === TYPES ===

type AbrirCuentaCorrienteState = {
  errors?: {
    socioId?: string[];
    descripcion?: string[];
  };
  message?: string;
  success?: boolean;
};

type RegistrarMovimientoState = {
  errors?: {
    cuentaCorrienteId?: string[];
    tipo?: string[];
    monto?: string[];
    descripcion?: string[];
  };
  message?: string;
  success?: boolean;
};

type CerrarCuentaCorrienteState = {
  errors?: {
    cuentaCorrienteId?: string[];
  };
  message?: string;
  success?: boolean;
};

// === ABRIR CUENTA CORRIENTE ===

export async function abrirCuentaCorriente(
  prevState: AbrirCuentaCorrienteState,
  formData: FormData
): Promise<AbrirCuentaCorrienteState> {
  const rawSocioId = formData.get('socioId');
  const rawDescripcion = formData.get('descripcion');
  
  const validatedFields = AbrirCuentaCorrienteSchema.safeParse({
    socioId: rawSocioId,
    descripcion: rawDescripcion,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Por favor revise los campos.',
      success: false,
    };
  }

  const { socioId, descripcion } = validatedFields.data;

  try {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      return {
        message: 'El socio no existe.',
        success: false,
      };
    }

    const cuentaExistente = await prisma.cuentaCorriente.findUnique({
      where: { socioId },
    });

    if (cuentaExistente) {
      return {
        message: 'El socio ya tiene una cuenta corriente activa.',
        success: false,
      };
    }

    await prisma.cuentaCorriente.create({
      data: {
        socioId,
        descripcion: descripcion || 'Cuenta corriente abierta',
        saldoDeuda: new Decimal(0),
        saldoCredito: new Decimal(0),
        estado: 'ACTIVO',
      },
    });

    revalidatePath(`/admin/cuenta-corriente/${socioId}`);
    revalidatePath('/admin/cuenta-corriente');

    return {
      message: 'Cuenta corriente abierta exitosamente.',
      success: true,
    };
  } catch (error) {
    console.error('Error al abrir cuenta corriente:', error);
    return {
      message: 'Error al abrir cuenta corriente.',
      success: false,
    };
  }
}

// === VERSIÓN DIRECTA (para uso desde cliente) ===

export async function abrirCuentaCorrienteDirecto(socioId: string, descripcion?: string) {
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new Error('El socio no existe.');
    }

    const cuentaExistente = await prisma.cuentaCorriente.findUnique({
      where: { socioId },
    });

    if (cuentaExistente) {
      throw new Error('El socio ya tiene una cuenta corriente activa.');
    }

    await prisma.cuentaCorriente.create({
      data: {
        socioId,
        descripcion: descripcion || 'Cuenta corriente abierta',
        saldoDeuda: new Decimal(0),
        saldoCredito: new Decimal(0),
        estado: 'ACTIVO',
      },
    });

    revalidatePath(`/admin/cuenta-corriente/${socioId}`);
    revalidatePath('/admin/cuenta-corriente');

    return { success: true };
  } catch (error) {
    console.error('Error al abrir cuenta corriente:', error);
    throw error;
  }
}

// === REGISTRAR MOVIMIENTO ===

export async function registrarMovimiento(
  prevState: RegistrarMovimientoState,
  formData: FormData
): Promise<RegistrarMovimientoState> {
  const validatedFields = RegistrarMovimientoSchema.safeParse({
    cuentaCorrienteId: formData.get('cuentaCorrienteId'),
    tipo: formData.get('tipo'),
    monto: formData.get('monto'),
    descripcion: formData.get('descripcion'),
    transaccionId: formData.get('transaccionId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
      success: false,
    };
  }

  const { cuentaCorrienteId, tipo, monto, descripcion, transaccionId } = validatedFields.data;

  try {
    const cuentaCorriente = await prisma.cuentaCorriente.findUnique({
      where: { id: cuentaCorrienteId },
    });

    if (!cuentaCorriente) {
      return {
        message: 'La cuenta corriente no existe.',
        success: false,
      };
    }

    let nuevoSaldoDeuda = cuentaCorriente.saldoDeuda;
    let nuevoSaldoCredito = cuentaCorriente.saldoCredito;

    // Calcular nuevos saldos según el tipo de movimiento
    switch (tipo) {
      case 'DEUDA':
        nuevoSaldoDeuda = nuevoSaldoDeuda.plus(monto);
        break;
      case 'CREDITO':
        nuevoSaldoCredito = nuevoSaldoCredito.plus(monto);
        break;
      case 'PAGO':
        // El pago reduce la deuda primero, luego el crédito
        let montoPendiente = new Decimal(monto);
        
        if (nuevoSaldoDeuda.greaterThan(0)) {
          if (montoPendiente.greaterThanOrEqualTo(nuevoSaldoDeuda)) {
            montoPendiente = montoPendiente.minus(nuevoSaldoDeuda);
            nuevoSaldoDeuda = new Decimal(0);
          } else {
            nuevoSaldoDeuda = nuevoSaldoDeuda.minus(montoPendiente);
            montoPendiente = new Decimal(0);
          }
        }
        
        if (montoPendiente.greaterThan(0) && nuevoSaldoCredito.greaterThan(0)) {
          if (montoPendiente.greaterThanOrEqualTo(nuevoSaldoCredito)) {
            montoPendiente = montoPendiente.minus(nuevoSaldoCredito);
            nuevoSaldoCredito = new Decimal(0);
          } else {
            nuevoSaldoCredito = nuevoSaldoCredito.minus(montoPendiente);
            montoPendiente = new Decimal(0);
          }
        }
        break;
      case 'AJUSTE':
        // Puedes definir tu lógica de ajuste
        break;
    }

    const nuevoEstado = nuevoSaldoDeuda.equals(0) && nuevoSaldoCredito.equals(0)
      ? 'SALDADO'
      : 'ACTIVO';

    await prisma.$transaction([
      prisma.movimientoCuentaCorriente.create({
        data: {
          cuentaCorrienteId,
          tipo,
          monto: new Decimal(monto),
          descripcion,
          transaccionId: transaccionId || null,
        },
      }),
      prisma.cuentaCorriente.update({
        where: { id: cuentaCorrienteId },
        data: {
          saldoDeuda: nuevoSaldoDeuda,
          saldoCredito: nuevoSaldoCredito,
          estado: nuevoEstado,
        },
      }),
    ]);

    revalidatePath(`/admin/cuenta-corriente/${cuentaCorriente.socioId}`);
    revalidatePath('/admin/cuenta-corriente');

    return {
      message: 'Movimiento registrado exitosamente.',
      success: true,
    };
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    return {
      message: 'Error al registrar movimiento.',
      success: false,
    };
  }
}

// === CERRAR CUENTA CORRIENTE ===

export async function cerrarCuentaCorriente(
  prevState: CerrarCuentaCorrienteState,
  formData: FormData
): Promise<CerrarCuentaCorrienteState> {
  const validatedFields = CerrarCuentaCorrienteSchema.safeParse({
    cuentaCorrienteId: formData.get('cuentaCorrienteId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
      success: false,
    };
  }

  const { cuentaCorrienteId } = validatedFields.data;

  try {
    const cuentaCorriente = await prisma.cuentaCorriente.findUnique({
      where: { id: cuentaCorrienteId },
    });

    if (!cuentaCorriente) {
      return {
        message: 'La cuenta corriente no existe.',
        success: false,
      };
    }

    const saldoNeto = cuentaCorriente.saldoDeuda.minus(cuentaCorriente.saldoCredito);

    if (!saldoNeto.equals(0)) {
      return {
        message: 'No se puede cerrar una cuenta con saldo pendiente.',
        success: false,
      };
    }

    await prisma.cuentaCorriente.update({
      where: { id: cuentaCorrienteId },
      data: { estado: 'CERRADO' },
    });

    revalidatePath(`/admin/cuenta-corriente/${cuentaCorriente.socioId}`);
    revalidatePath('/admin/cuenta-corriente');

    return {
      message: 'Cuenta corriente cerrada exitosamente.',
      success: true,
    };
  } catch (error) {
    console.error('Error al cerrar cuenta corriente:', error);
    return {
      message: 'Error al cerrar cuenta corriente.',
      success: false,
    };
  }
}

// === OBTENER SALDO NETO ===

export async function obtenerSaldoNeto(cuentaCorrienteId: string): Promise<number> {
  try {
    const cuentaCorriente = await prisma.cuentaCorriente.findUnique({
      where: { id: cuentaCorrienteId },
    });

    if (!cuentaCorriente) return 0;

    const saldoNeto = cuentaCorriente.saldoDeuda.minus(cuentaCorriente.saldoCredito);
    return saldoNeto.toNumber();
  } catch (error) {
    console.error('Error al obtener saldo neto:', error);
    return 0;
  }
}
