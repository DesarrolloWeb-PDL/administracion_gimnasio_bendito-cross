import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { getStartOfTodayBuenosAires } from '@/lib/date-utils';

const ITEMS_PER_PAGE = 10;

function contarCuotasVencidas(fechaFin: Date, duracionMeses: number, now: Date) {
  if (fechaFin >= now) return 0;

  const stepMonths = Math.max(duracionMeses, 1);
  let vencidas = 0;
  let proximoVencimiento = new Date(fechaFin);

  while (proximoVencimiento < now) {
    vencidas += 1;
    proximoVencimiento = new Date(proximoVencimiento);
    proximoVencimiento.setMonth(proximoVencimiento.getMonth() + stepMonths);

    if (vencidas > 120) break;
  }

  return vencidas;
}

function aplicarFiltroSuscripciones(suscripciones: any[], filtro?: string, now = new Date()) {
  return suscripciones.filter((suscripcion) => {
    const isExpired = suscripcion.fechaFin < now;
    const cuotasVencidas = contarCuotasVencidas(suscripcion.fechaFin, suscripcion.plan.duracionMeses, now);

    if (filtro === 'vencidas') {
      return isExpired;
    }

    if (filtro === 'por-vencer') {
      const next7Days = new Date(now);
      next7Days.setDate(next7Days.getDate() + 7);
      return suscripcion.fechaFin >= now && suscripcion.fechaFin <= next7Days;
    }

    if (filtro === 'vencidas-mas') {
      return isExpired && cuotasVencidas > 1;
    }

    return true;
  });
}

export async function fetchSuscripciones(query: string, currentPage: number, filtro?: string) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  // "Hoy" in Argentina (UTC-3), not server UTC.
  const now = getStartOfTodayBuenosAires();

  const whereCondition: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (filtro === 'vencidas' || filtro === 'vencidas-mas') {
    whereCondition.fechaFin = { lt: now };
  } else if (filtro === 'por-vencer') {
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    whereCondition.fechaFin = { gte: now, lte: next7Days };
  }

  try {
    const suscripciones = await prisma.suscripcion.findMany({
      where: whereCondition,
      include: {
        socio: true,
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const filtradas = aplicarFiltroSuscripciones(suscripciones, filtro, now);
    const paginadas = filtro === 'vencidas-mas'
      ? filtradas.slice(offset, offset + ITEMS_PER_PAGE)
      : filtradas.slice(offset, offset + ITEMS_PER_PAGE);
    
    // Convertir Decimal a number para evitar error de serialización
    return paginadas.map(s => ({
      ...s,
      cuotasVencidas: contarCuotasVencidas(s.fechaFin, s.plan.duracionMeses, now),
      plan: {
        ...s.plan,
        precio: Number(s.plan.precio)
      }
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener suscripciones.');
  }
}

export async function fetchSuscripcionesPages(query: string, filtro?: string) {
  noStore();
  // "Hoy" in Argentina (UTC-3), not server UTC.
  const now = getStartOfTodayBuenosAires();

  const whereCondition: any = {
    OR: [
      { socio: { nombre: { contains: query, mode: 'insensitive' } } },
      { socio: { apellido: { contains: query, mode: 'insensitive' } } },
      { socio: { dni: { contains: query, mode: 'insensitive' } } },
    ],
  };

  if (filtro === 'vencidas' || filtro === 'vencidas-mas') {
    whereCondition.fechaFin = { lt: now };
  } else if (filtro === 'por-vencer') {
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    whereCondition.fechaFin = { gte: now, lte: next7Days };
  }

  try {
    const suscripciones = await prisma.suscripcion.findMany({
      where: whereCondition,
      include: {
        plan: true,
      },
    });

    const filtradas = aplicarFiltroSuscripciones(suscripciones, filtro, now);
    return Math.ceil(filtradas.length / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener el total de suscripciones.');
  }
}

export async function fetchSuscripcionById(id: string) {
  noStore();
  try {
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id },
      include: {
        socio: true,
        plan: true,
      },
    });

    if (!suscripcion) return null;

    return {
      ...suscripcion,
      plan: {
        ...suscripcion.plan,
        precio: Number(suscripcion.plan.precio),
      },
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al obtener la suscripción.');
  }
}
