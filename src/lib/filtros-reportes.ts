import { Prisma } from '@prisma/client';
import { z } from 'zod';

export type Disciplina = 'musculacion' | 'crossfit';
export type EstadoPago = 'pagas' | 'inpagas';
export type EstadoSuscripcion = 'Activa' | 'Vencida' | 'Suspendida';

export interface FiltrosReportes {
  disciplina?: Disciplina;
  desde?: string;
  hasta?: string;
  estadoPago?: EstadoPago;
}

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }, 'Fecha inválida');

export const filtrosReportesSchema = z
  .object({
    disciplina: z.enum(['musculacion', 'crossfit']).optional(),
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    estadoPago: z.enum(['pagas', 'inpagas']).optional(),
  })
  .refine(
    (data) => !data.desde || !data.hasta || data.desde <= data.hasta,
    {
      message: 'La fecha desde debe ser menor o igual a hasta',
      path: ['desde'],
    }
  );

const LEGACY_ESTADO_MAP: Record<string, EstadoPago> = {
  activa: 'pagas',
  vencida: 'inpagas',
  suspendida: 'inpagas',
};

function mapLegacyEstadoSuscripcion(
  value: string | undefined
): EstadoPago | undefined {
  if (!value) return undefined;
  return LEGACY_ESTADO_MAP[value.toLowerCase()];
}

function parseDisciplina(value: string | undefined): Disciplina | undefined {
  if (value === 'musculacion' || value === 'crossfit') return value;
  return undefined;
}

function parseEstadoPago(value: string | undefined): EstadoPago | undefined {
  if (value === 'pagas' || value === 'inpagas') return value;
  return undefined;
}

function parseFecha(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const result = fechaSchema.safeParse(value);
  return result.success ? value : undefined;
}

export function parseFiltrosReportesLenient(
  sp: URLSearchParams | Record<string, string | undefined>
): FiltrosReportes {
  const get = (key: string): string | undefined => {
    if (sp instanceof URLSearchParams) {
      return sp.get(key) ?? undefined;
    }
    return sp[key];
  };

  const filtros: FiltrosReportes = {};

  const disciplina = parseDisciplina(get('disciplina'));
  if (disciplina) filtros.disciplina = disciplina;

  const estadoPago =
    parseEstadoPago(get('estadoPago')) ??
    mapLegacyEstadoSuscripcion(get('estadoSuscripcion'));
  if (estadoPago) filtros.estadoPago = estadoPago;

  const desde = parseFecha(get('desde'));
  const hasta = parseFecha(get('hasta'));

  if (desde && hasta && desde > hasta) {
    // Rango invertido: ambas fechas se descartan de forma determinista.
  } else {
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
  }

  return filtros;
}

export function parseFiltrosReportesStrict(
  sp: URLSearchParams | Record<string, string | undefined>
):
  | { ok: true; filtros: FiltrosReportes }
  | { ok: false; error: z.ZodError } {
  const get = (key: string): string | undefined => {
    if (sp instanceof URLSearchParams) {
      return sp.get(key) ?? undefined;
    }
    return sp[key];
  };

  const raw: Record<string, string | undefined> = {};
  const disciplina = get('disciplina');
  if (disciplina) raw.disciplina = disciplina;
  const estadoPago = get('estadoPago');
  if (estadoPago) raw.estadoPago = estadoPago;
  const desde = get('desde');
  if (desde) raw.desde = desde;
  const hasta = get('hasta');
  if (hasta) raw.hasta = hasta;

  const result = filtrosReportesSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, filtros: result.data };
  }
  return { ok: false, error: result.error };
}

export function toDateBounds(f: FiltrosReportes): { gte?: Date; lte?: Date } {
  const bounds: { gte?: Date; lte?: Date } = {};
  if (f.desde) {
    bounds.gte = new Date(`${f.desde}T00:00:00-03:00`);
  }
  if (f.hasta) {
    bounds.lte = new Date(`${f.hasta}T23:59:59.999-03:00`);
  }
  return bounds;
}

export function describeRango(f: FiltrosReportes, defaultLabel: string): string {
  if (f.desde && f.hasta) {
    return `${f.desde} a ${f.hasta}`;
  }
  if (f.desde) {
    return `Desde ${f.desde}`;
  }
  if (f.hasta) {
    return `Hasta ${f.hasta}`;
  }
  return defaultLabel;
}

export function getEstadoSuscripcion(
  activa: boolean,
  fechaFin: Date,
  now: Date
): EstadoSuscripcion {
  if (!activa) return 'Suspendida';
  return fechaFin < now ? 'Vencida' : 'Activa';
}

export function clasificarEstadoPago(
  activa: boolean,
  fechaFin: Date,
  now: Date
): EstadoPago {
  return activa && fechaFin >= now ? 'pagas' : 'inpagas';
}

export function estadoPagoPredicate(
  estado: EstadoPago,
  now: Date
): Prisma.SuscripcionWhereInput {
  if (estado === 'pagas') {
    return { activa: true, fechaFin: { gte: now } };
  }
  return { OR: [{ activa: false }, { fechaFin: { lt: now } }] };
}

export function disciplinaPredicate(d: Disciplina): Prisma.PlanWhereInput {
  if (d === 'crossfit') {
    return { allowsCrossfit: true };
  }
  return { allowsMusculacion: true };
}
