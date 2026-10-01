import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import {
  getStartOfTodayBuenosAires,
  getStartOfTomorrowBuenosAires,
  getStartOfMonthBuenosAires,
  getStartOfNextMonthBuenosAires,
} from '@/lib/date-utils';

export async function fetchCardData() {
  noStore();

  try {
    // 1. Socios Activos
    const sociosCountPromise = prisma.socio.count({
      where: { activo: true },
    });

    // 2. Ingresos del Mes (Argentina)
    const startOfMonth = getStartOfMonthBuenosAires();
    const startOfNextMonth = getStartOfNextMonthBuenosAires();

    const incomePromise = prisma.transaccion.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        fecha: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    // 3. Vencimientos Próximos (desde hoy en Argentina, 7 días)
    const todayStart = getStartOfTodayBuenosAires();
    const sevenDaysFromNow = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringPromise = prisma.suscripcion.count({
      where: {
        activa: true,
        fechaFin: {
          gte: todayStart,
          lte: sevenDaysFromNow,
        },
      },
    });

    // 4. Asistencias Hoy (Argentina)
    const startOfDay = getStartOfTodayBuenosAires();
    const endOfDay = getStartOfTomorrowBuenosAires();

    const attendancePromise = prisma.asistencia.count({
      where: {
        fecha: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const [sociosCount, incomeResult, expiringCount, attendanceCount] = await Promise.all([
      sociosCountPromise,
      incomePromise,
      expiringPromise,
      attendancePromise,
    ]);

    const totalIncome = Number(incomeResult._sum.monto) || 0;

    return {
      numberOfSocios: sociosCount,
      totalIncome,
      expiringSubscriptions: expiringCount,
      todaysAttendance: attendanceCount,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}
