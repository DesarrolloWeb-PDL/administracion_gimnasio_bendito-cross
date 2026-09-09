import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { Prisma } from '@prisma/client';
import {
  FiltrosReportes,
  clasificarEstadoPago,
  disciplinaPredicate,
  estadoPagoPredicate,
  getEstadoSuscripcion,
  toDateBounds,
} from '@/lib/filtros-reportes';

type HistorialPago = {
  id: string;
  fecha: Date;
  monto: number;
  metodoPago: string;
  notas: string;
  tipoPago: string;
  planNombre: string;
  suscripcionEstado: string;
  suscripcionFechaFin: Date;
};

type ResumenEstadoHistorial = {
  estado: string;
  cantidad: number;
  total: number;
};

function buildDateFilter(
  defaultGte: Date,
  filtros?: FiltrosReportes
): { gte: Date; lte?: Date } {
  const bounds = toDateBounds(filtros ?? {});
  return {
    gte: bounds.gte ?? defaultGte,
    lte: bounds.lte,
  };
}

function intersectDateBounds(
  defaultBounds: { gte: Date; lte: Date },
  filtros?: FiltrosReportes
): { gte: Date; lte: Date } | null {
  const bounds = toDateBounds(filtros ?? {});
  const gte = bounds.gte
    ? new Date(Math.max(bounds.gte.getTime(), defaultBounds.gte.getTime()))
    : defaultBounds.gte;
  const lte = bounds.lte
    ? new Date(Math.min(bounds.lte.getTime(), defaultBounds.lte.getTime()))
    : defaultBounds.lte;

  if (gte > lte) return null;
  return { gte, lte };
}

function suscripcionFilter(
  filtros?: FiltrosReportes
): Prisma.SuscripcionWhereInput | undefined {
  if (!filtros?.estadoPago && !filtros?.disciplina) return undefined;

  const now = new Date();
  const where: Prisma.SuscripcionWhereInput = {};

  if (filtros.estadoPago) {
    Object.assign(where, estadoPagoPredicate(filtros.estadoPago, now));
  }

  if (filtros.disciplina) {
    where.plan = disciplinaPredicate(filtros.disciplina);
  }

  return where;
}

export async function fetchIngresosPorMes(filtros?: FiltrosReportes) {
  noStore();
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: buildDateFilter(oneYearAgo, filtros),
        suscripcion: suscripcionFilter(filtros),
      },
      select: {
        fecha: true,
        monto: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    // Agrupar por mes y año
    const ingresosPorMes: Record<string, number> = {};

    transacciones.forEach((t) => {
      const date = new Date(t.fecha);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!ingresosPorMes[key]) {
        ingresosPorMes[key] = 0;
      }
      ingresosPorMes[key] += Number(t.monto);
    });

    // Convertir a array para el frontend
    return Object.entries(ingresosPorMes).map(([fecha, monto]) => ({
      fecha, // YYYY-MM
      monto,
    }));

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener reporte de ingresos.');
  }
}

export async function fetchNuevosSociosPorMes(filtros?: FiltrosReportes) {
  noStore();
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const socios = await prisma.socio.findMany({
      where: {
        createdAt: buildDateFilter(oneYearAgo, filtros),
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const sociosPorMes: Record<string, number> = {};

    socios.forEach((s) => {
      const date = new Date(s.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!sociosPorMes[key]) {
        sociosPorMes[key] = 0;
      }
      sociosPorMes[key] += 1;
    });

    return Object.entries(sociosPorMes).map(([fecha, cantidad]) => ({
      fecha,
      cantidad,
    }));

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener reporte de socios.');
  }
}

export async function fetchAsistenciasPorDia(filtros?: FiltrosReportes) {
  noStore();
  try {
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        fecha: buildDateFilter(treintaDiasAtras, filtros),
      },
      select: {
        fecha: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    // Agrupar por día de la semana
    const asistenciasPorDia: Record<string, number> = {
      'Lunes': 0,
      'Martes': 0,
      'Miércoles': 0,
      'Jueves': 0,
      'Viernes': 0,
      'Sábado': 0,
      'Domingo': 0,
    };

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    asistencias.forEach((a) => {
      const date = new Date(a.fecha);
      const diaSemana = diasSemana[date.getDay()];
      asistenciasPorDia[diaSemana]++;
    });

    return Object.entries(asistenciasPorDia).map(([dia, cantidad]) => ({
      dia,
      cantidad,
    }));

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener asistencias por día.');
  }
}

export async function fetchIngresosPorTipo(filtros?: FiltrosReportes) {
  noStore();
  try {
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: buildDateFilter(treintaDiasAtras, filtros),
        suscripcion: suscripcionFilter(filtros),
      },
      select: {
        monto: true,
        notas: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    let mensualidad = 0;
    let ventas = 0;

    transacciones.forEach((t) => {
      const monto = Number(t.monto);
      const notas = (t.notas || '').toLowerCase();

      // Clasificar basado en las notas
      if (notas.includes('mensualidad') || notas.includes('plan') || notas.includes('suscripción')) {
        mensualidad += monto;
      } else if (notas.includes('bebida') || notas.includes('venta') || notas.includes('producto')) {
        ventas += monto;
      } else {
        // Si no tiene clasificación clara, asumir que es mensualidad
        mensualidad += monto;
      }
    });

    return [
      { tipo: 'Mensualidades', monto: mensualidad },
      { tipo: 'Ventas', monto: ventas },
    ];

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener ingresos por tipo.');
  }
}

export async function fetchIngresosPorDia(año: number, mes: number, filtros?: FiltrosReportes) {
  noStore();
  try {
    // Crear fecha de inicio y fin del mes
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999);

    const fechaBounds = intersectDateBounds({ gte: fechaInicio, lte: fechaFin }, filtros);
    if (!fechaBounds) {
      return [];
    }

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: fechaBounds,
        suscripcion: suscripcionFilter(filtros),
      },
      select: {
        fecha: true,
        monto: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    // Agrupar por día
    const ingresosPorDia: Record<number, number> = {};

    transacciones.forEach((t) => {
      const date = new Date(t.fecha);
      const dia = date.getDate();
      
      if (!ingresosPorDia[dia]) {
        ingresosPorDia[dia] = 0;
      }
      ingresosPorDia[dia] += Number(t.monto);
    });

    // Convertir a array ordenado por día
    return Object.entries(ingresosPorDia)
      .map(([dia, monto]) => ({
        dia: parseInt(dia),
        monto,
      }))
      .sort((a, b) => a.dia - b.dia);

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener ingresos por día.');
  }
}

export async function fetchTransaccionesPorDia(año: number, mes: number, dia: number, filtros?: FiltrosReportes) {
  noStore();
  try {
    // Crear fecha de inicio y fin del día
    const fechaInicio = new Date(año, mes - 1, dia, 0, 0, 0, 0);
    const fechaFin = new Date(año, mes - 1, dia, 23, 59, 59, 999);

    const fechaBounds = intersectDateBounds({ gte: fechaInicio, lte: fechaFin }, filtros);
    if (!fechaBounds) {
      return [];
    }

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: fechaBounds,
        suscripcion: suscripcionFilter(filtros),
      },
      select: {
        id: true,
        monto: true,
        fecha: true,
        metodoPago: true,
        notas: true,
        suscripcion: {
          select: {
            socio: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    return transacciones.map((t) => ({
      id: t.id,
      monto: Number(t.monto),
      fecha: t.fecha,
      metodoPago: t.metodoPago,
      notas: t.notas || '',
      socioNombre: `${t.suscripcion.socio.nombre} ${t.suscripcion.socio.apellido}`,
    }));

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener transacciones del día.');
  }
}

export async function fetchSociosParaHistorialPagos() {
  noStore();
  try {
    const socios = await prisma.socio.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return socios;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener socios para historial de pagos.');
  }
}

export async function fetchHistorialPagosPorSocio(socioId: string, filtros?: FiltrosReportes) {
  noStore();
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        suscripciones: {
          include: {
            plan: true,
            transacciones: {
              orderBy: {
                fecha: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!socio) {
      return null;
    }

    const now = new Date();
    const bounds = toDateBounds(filtros ?? {});

    let items = socio.suscripciones.flatMap((suscripcion) =>
      suscripcion.transacciones.map((transaccion) => ({
        transaccion,
        suscripcion,
        plan: suscripcion.plan,
      }))
    );

    if (bounds.gte || bounds.lte) {
      items = items.filter(({ transaccion }) => {
        if (bounds.gte && transaccion.fecha < bounds.gte) return false;
        if (bounds.lte && transaccion.fecha > bounds.lte) return false;
        return true;
      });
    }

    if (filtros?.estadoPago) {
      items = items.filter(
        ({ suscripcion }) =>
          clasificarEstadoPago(suscripcion.activa, suscripcion.fechaFin, now) ===
          filtros.estadoPago
      );
    }

    if (filtros?.disciplina) {
      const predicate = disciplinaPredicate(filtros.disciplina);
      items = items.filter(({ plan }) =>
        predicate.allowsCrossfit ? plan.allowsCrossfit : plan.allowsMusculacion
      );
    }

    const historial: HistorialPago[] = items
      .map(({ transaccion, suscripcion, plan }) => ({
        id: transaccion.id,
        fecha: transaccion.fecha,
        monto: Number(transaccion.monto),
        metodoPago: transaccion.metodoPago,
        notas: transaccion.notas || '',
        tipoPago: transaccion.tipoPago,
        planNombre: plan.nombre,
        suscripcionEstado: getEstadoSuscripcion(
          suscripcion.activa,
          suscripcion.fechaFin,
          now
        ),
        suscripcionFechaFin: suscripcion.fechaFin,
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const resumenPorEstado: ResumenEstadoHistorial[] = (
      ['pagas', 'inpagas'] as const
    ).map((estado) => {
      const resumenItems = items.filter(
        ({ suscripcion }) =>
          clasificarEstadoPago(suscripcion.activa, suscripcion.fechaFin, now) ===
          estado
      );
      return {
        estado,
        cantidad: resumenItems.length,
        total: resumenItems.reduce(
          (acc, { transaccion }) => acc + Number(transaccion.monto),
          0
        ),
      };
    });

    const totalPagado = historial.reduce((acc, item) => acc + item.monto, 0);
    const cantidadPagos = historial.length;

    return {
      socio,
      historial,
      resumenPorEstado,
      totalPagado,
      cantidadPagos,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener historial de pagos por socio.');
  }
}
