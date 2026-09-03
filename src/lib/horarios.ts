/**
 * Horarios helper — matches current day/time against professor schedules.
 *
 * horarios JSON shape on Usuario:
 * {
 *   crossfit?: { lunes?: { inicio: "08:00", fin: "10:00" }, ... },
 *   musculacion?: { lunes?: { inicio: "14:00", fin: "16:00" }, ... }
 * }
 *
 * All schedule matching uses Argentina local time (UTC-3).
 */

interface TimeSlot {
  inicio: string; // "HH:MM"
  fin: string;    // "HH:MM"
}

type DayName = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

interface DisciplineSchedule {
  [day: string]: TimeSlot | null | undefined;
}

export interface Horarios {
  crossfit?: DisciplineSchedule | null;
  musculacion?: DisciplineSchedule | null;
}

/**
 * Parse "HH:MM" to minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get local date components from a Date (Argentina: UTC-3)
 */
function getLocalDate(date: Date): { hours: number; minutes: number; dayName: string } {
  // Argentina is UTC-3 (no DST)
  const UTC_OFFSET = -3;
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const localMinutes = utcHours * 60 + utcMinutes + (UTC_OFFSET * 60);
  
  // Handle day rollover
  let dayOffset = 0;
  let adjustedMinutes = localMinutes;
  if (adjustedMinutes < 0) {
    adjustedMinutes += 24 * 60;
    dayOffset = -1;
  } else if (adjustedMinutes >= 24 * 60) {
    adjustedMinutes -= 24 * 60;
    dayOffset = 1;
  }
  
  const hours = Math.floor(adjustedMinutes / 60);
  const minutes = adjustedMinutes % 60;
  
  // Get day name in Argentina timezone
  const dayIndex = (date.getUTCDay() + dayOffset + 7) % 7;
  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  
  return { hours, minutes, dayName: dayNames[dayIndex] };
}

/**
 * Check if a professor is on shift right now for a given discipline.
 * Uses Argentina local time (UTC-3) for schedule matching.
 */
export function isProfesorEnTurno(
  horarios: Horarios | null | undefined,
  disciplina: 'crossfit' | 'musculacion',
  now: Date = new Date()
): boolean {
  if (!horarios) return false;

  const schedule = horarios[disciplina];
  if (!schedule) return false;

  const local = getLocalDate(now);
  if (local.dayName === 'domingo') return false;

  const slot = schedule[local.dayName];
  if (!slot) return false;

  const currentMinutes = local.hours * 60 + local.minutes;
  const inicio = timeToMinutes(slot.inicio);
  const fin = timeToMinutes(slot.fin);

  return currentMinutes >= inicio && currentMinutes < fin;
}

/**
 * Get all professor IDs who are on shift right now for a given discipline.
 * Returns empty array if nobody is on shift.
 */
export function getProfesoresEnTurno(
  profesores: Array<{ id: string; horarios: unknown; esProfesorCrossfit: boolean; esProfesorMusculacion: boolean }>,
  disciplina: 'crossfit' | 'musculacion',
  now: Date = new Date()
): string[] {
  return profesores
    .filter((p) => {
      if (disciplina === 'crossfit' && !p.esProfesorCrossfit) return false;
      if (disciplina === 'musculacion' && !p.esProfesorMusculacion) return false;
      return isProfesorEnTurno(p.horarios as Horarios | null, disciplina, now);
    })
    .map((p) => p.id);
}
