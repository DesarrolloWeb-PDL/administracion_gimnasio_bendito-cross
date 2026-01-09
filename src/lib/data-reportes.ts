import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchIngresosPorMes() {
  noStore();
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gte: oneYearAgo,
        },
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

export async function fetchNuevosSociosPorMes() {
  noStore();
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const socios = await prisma.socio.findMany({
      where: {
        createdAt: {
          gte: oneYearAgo,
        },
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

export async function fetchAsistenciasPorDia() {
  noStore();
  try {
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: treintaDiasAtras,
        },
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

export async function fetchIngresosPorTipo() {
  noStore();
  try {
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gte: treintaDiasAtras,
        },
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

export async function fetchIngresosPorDia(año: number, mes: number) {
  noStore();
  try {
    // Crear fecha de inicio y fin del mes
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
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
