/**
 * Horarios helper — matches current day/time against professor schedules.
 *
 * horarios JSON shape on Usuario:
 * {
 *   crossfit?: { lunes?: { inicio: "08:00", fin: "10:00" }, ... },
 *   musculacion?: { lunes?: { inicio: "14:00", fin: "16:00" }, ... }
 * }
 */

const DAY_MAP: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

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
 * Check if a professor is on shift right now for a given discipline.
 */
export function isProfesorEnTurno(
  horarios: Horarios | null | undefined,
  disciplina: 'crossfit' | 'musculacion',
  now: Date = new Date()
): boolean {
  if (!horarios) return false;

  const schedule = horarios[disciplina];
  if (!schedule) return false;

  const dayName = DAY_MAP[now.getDay()] as DayName;
  if (dayName === 'domingo') return false; // no hay clases domingo

  const slot = schedule[dayName];
  if (!slot) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
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
