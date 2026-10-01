// Date utilities for Argentina (UTC-3, no DST since 2009).
// This file must NOT have 'use server' — safe for server and client.

export const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

type DateParts = { year: number; month: number; day: number };

function getArgentinaDateParts(now: Date = new Date()): DateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { year, month, day };
}

/**
 * Absolute Date for 00:00:00.000 Argentina on the same calendar day as `now`
 * in Buenos Aires. Argentina is always UTC-3, so 00:00 local = 03:00 UTC.
 */
export function getStartOfTodayBuenosAires(now: Date = new Date()): Date {
  const { year, month, day } = getArgentinaDateParts(now);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

/** Absolute Date for 00:00:00.000 Argentina on the next calendar day. */
export function getStartOfTomorrowBuenosAires(now: Date = new Date()): Date {
  const start = getStartOfTodayBuenosAires(now);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** Absolute Date for 00:00:00.000 Argentina on the 1st of the current month. */
export function getStartOfMonthBuenosAires(now: Date = new Date()): Date {
  const { year, month } = getArgentinaDateParts(now);
  return new Date(Date.UTC(year, month - 1, 1, 3, 0, 0, 0));
}

/** Absolute Date for 00:00:00.000 Argentina on the 1st of the next month. */
export function getStartOfNextMonthBuenosAires(now: Date = new Date()): Date {
  const { year, month } = getArgentinaDateParts(now);
  return new Date(Date.UTC(year, month, 1, 3, 0, 0, 0));
}

/** Argentina calendar month key `YYYY-MM` for a timestamp. */
export function getArgentinaYearMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${year}-${month}`;
}

/** Argentina day-of-week for a timestamp (0=Sunday … 6=Saturday). */
export function getArgentinaDayOfWeek(date: Date): number {
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TZ,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayName] ?? 0;
}

/** Formatear fecha en formato occidental y horario Buenos Aires. */
export function formatFechaBuenosAires(date: Date | string): string {
  const fecha = typeof date === 'string' ? new Date(date) : date;
  const fechaBA = new Date(fecha.toLocaleString('en-US', { timeZone: ARGENTINA_TZ }));
  const dia = String(fechaBA.getDate()).padStart(2, '0');
  const mes = String(fechaBA.getMonth() + 1).padStart(2, '0');
  const anio = fechaBA.getFullYear();
  const horas = String(fechaBA.getHours()).padStart(2, '0');
  const minutos = String(fechaBA.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}
