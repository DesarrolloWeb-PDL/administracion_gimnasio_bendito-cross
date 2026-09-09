import { describe, it, expect } from 'vitest';
import {
  parseFiltrosReportesLenient,
  parseFiltrosReportesStrict,
  toDateBounds,
  describeRango,
  getEstadoSuscripcion,
  clasificarEstadoPago,
  estadoPagoPredicate,
  disciplinaPredicate,
  type FiltrosReportes,
} from '@/lib/filtros-reportes';

describe('parseFiltrosReportesLenient', () => {
  it('returns empty object when no recognized params are present', () => {
    expect(parseFiltrosReportesLenient(new URLSearchParams())).toEqual({});
  });

  it('parses a complete valid filter set', () => {
    const sp = new URLSearchParams({
      disciplina: 'crossfit',
      desde: '2026-07-01',
      hasta: '2026-09-30',
      estadoPago: 'inpagas',
    });
    expect(parseFiltrosReportesLenient(sp)).toEqual({
      disciplina: 'crossfit',
      desde: '2026-07-01',
      hasta: '2026-09-30',
      estadoPago: 'inpagas',
    });
  });

  it('ignores invalid enum values', () => {
    const sp = new URLSearchParams({
      disciplina: 'powerlifting',
      estadoPago: 'moroso',
    });
    expect(parseFiltrosReportesLenient(sp)).toEqual({});
  });

  it('ignores malformed dates', () => {
    const sp = new URLSearchParams({
      desde: 'not-a-date',
      hasta: '2026-09-30',
    });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ hasta: '2026-09-30' });
  });

  it('maps legacy Activa to pagas', () => {
    const sp = new URLSearchParams({ estadoSuscripcion: 'Activa' });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ estadoPago: 'pagas' });
  });

  it('maps legacy Vencida to inpagas', () => {
    const sp = new URLSearchParams({ estadoSuscripcion: 'Vencida' });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ estadoPago: 'inpagas' });
  });

  it('maps legacy Suspendida to inpagas', () => {
    const sp = new URLSearchParams({ estadoSuscripcion: 'Suspendida' });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ estadoPago: 'inpagas' });
  });

  it('maps legacy values case-insensitively', () => {
    const sp = new URLSearchParams({ estadoSuscripcion: 'activa' });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ estadoPago: 'pagas' });
  });

  it('prefers estadoPago over legacy estadoSuscripcion', () => {
    const sp = new URLSearchParams({
      estadoPago: 'inpagas',
      estadoSuscripcion: 'Activa',
    });
    expect(parseFiltrosReportesLenient(sp)).toEqual({ estadoPago: 'inpagas' });
  });

  it('drops both dates when desde > hasta', () => {
    const sp = new URLSearchParams({
      desde: '2026-09-30',
      hasta: '2026-09-01',
    });
    expect(parseFiltrosReportesLenient(sp)).toEqual({});
  });
});

describe('parseFiltrosReportesStrict', () => {
  it('accepts a valid filter set', () => {
    const sp = new URLSearchParams({
      disciplina: 'musculacion',
      desde: '2026-01-01',
      hasta: '2026-03-31',
      estadoPago: 'pagas',
    });
    const result = parseFiltrosReportesStrict(sp);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.filtros).toEqual({
      disciplina: 'musculacion',
      desde: '2026-01-01',
      hasta: '2026-03-31',
      estadoPago: 'pagas',
    });
  });

  it('rejects invalid enum values', () => {
    const sp = new URLSearchParams({ disciplina: 'yoga' });
    const result = parseFiltrosReportesStrict(sp);
    expect(result.ok).toBe(false);
  });

  it('rejects non-calendar dates', () => {
    const sp = new URLSearchParams({ desde: '2026-02-30' });
    const result = parseFiltrosReportesStrict(sp);
    expect(result.ok).toBe(false);
  });

  it('rejects an inverted date range', () => {
    const sp = new URLSearchParams({
      desde: '2026-09-30',
      hasta: '2026-09-01',
    });
    const result = parseFiltrosReportesStrict(sp);
    expect(result.ok).toBe(false);
  });
});

describe('toDateBounds', () => {
  it('returns empty bounds when no dates are provided', () => {
    expect(toDateBounds({})).toEqual({});
  });

  it('anchors desde at 00:00:00-03:00', () => {
    const bounds = toDateBounds({ desde: '2026-07-01' });
    expect(bounds.gte?.toISOString()).toBe('2026-07-01T03:00:00.000Z');
  });

  it('anchors hasta at 23:59:59.999-03:00', () => {
    const bounds = toDateBounds({ hasta: '2026-09-30' });
    expect(bounds.lte?.toISOString()).toBe('2026-10-01T02:59:59.999Z');
  });

  it('returns both bounds when both dates are provided', () => {
    const bounds = toDateBounds({ desde: '2026-07-01', hasta: '2026-09-30' });
    expect(bounds.gte?.toISOString()).toBe('2026-07-01T03:00:00.000Z');
    expect(bounds.lte?.toISOString()).toBe('2026-10-01T02:59:59.999Z');
  });

  it('includes a transaction at 23:00 Buenos Aires on the hasta day', () => {
    const bounds = toDateBounds({ hasta: '2026-09-09' });
    const transactionUtc = new Date('2026-09-10T02:00:00.000Z');
    expect(bounds.lte).toBeDefined();
    expect(transactionUtc.getTime()).toBeLessThanOrEqual(bounds.lte!.getTime());
  });
});

describe('describeRango', () => {
  it('returns the default label when no dates are provided', () => {
    expect(describeRango({}, 'Últimos 30 días')).toBe('Últimos 30 días');
  });

  it('describes a desde-only range', () => {
    expect(describeRango({ desde: '2026-01-01' }, 'Default')).toBe('Desde 2026-01-01');
  });

  it('describes a hasta-only range', () => {
    expect(describeRango({ hasta: '2026-03-31' }, 'Default')).toBe('Hasta 2026-03-31');
  });

  it('describes a complete range', () => {
    expect(describeRango({ desde: '2026-01-01', hasta: '2026-03-31' }, 'Default')).toBe(
      '2026-01-01 a 2026-03-31'
    );
  });
});

describe('getEstadoSuscripcion', () => {
  it('returns Activa when activa and fechaFin is in the future', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(getEstadoSuscripcion(true, new Date('2026-10-01T00:00:00.000Z'), now)).toBe('Activa');
  });

  it('returns Vencida when activa and fechaFin is in the past', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(getEstadoSuscripcion(true, new Date('2026-08-01T00:00:00.000Z'), now)).toBe('Vencida');
  });

  it('returns Suspendida when not activa', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(getEstadoSuscripcion(false, new Date('2026-10-01T00:00:00.000Z'), now)).toBe('Suspendida');
  });
});

describe('clasificarEstadoPago', () => {
  it('returns pagas when activa and fechaFin >= now', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(clasificarEstadoPago(true, new Date('2026-10-01T00:00:00.000Z'), now)).toBe('pagas');
  });

  it('returns inpagas when activa but fechaFin < now', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(clasificarEstadoPago(true, new Date('2026-08-01T00:00:00.000Z'), now)).toBe('inpagas');
  });

  it('returns inpagas when not activa', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    expect(clasificarEstadoPago(false, new Date('2026-10-01T00:00:00.000Z'), now)).toBe('inpagas');
  });
});

describe('estadoPagoPredicate', () => {
  it('matches the classifier for pagas', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    const predicate = estadoPagoPredicate('pagas', now);
    expect(predicate).toEqual({
      activa: true,
      fechaFin: { gte: now },
    });
  });

  it('matches the classifier for inpagas', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    const predicate = estadoPagoPredicate('inpagas', now);
    expect(predicate).toEqual({
      OR: [{ activa: false }, { fechaFin: { lt: now } }],
    });
  });

  it('is equivalent to clasificarEstadoPago for every truth-table row', () => {
    const now = new Date('2026-09-09T12:00:00.000Z');
    const cases = [
      { activa: true, fechaFin: new Date('2026-10-01T00:00:00.000Z') },
      { activa: true, fechaFin: new Date('2026-08-01T00:00:00.000Z') },
      { activa: false, fechaFin: new Date('2026-10-01T00:00:00.000Z') },
      { activa: false, fechaFin: new Date('2026-08-01T00:00:00.000Z') },
    ] as const;

    for (const c of cases) {
      const expected = clasificarEstadoPago(c.activa, c.fechaFin, now);
      const matchesPagas =
        c.activa && c.fechaFin.getTime() >= now.getTime();
      const matchesInpagas =
        !c.activa || c.fechaFin.getTime() < now.getTime();

      if (expected === 'pagas') {
        expect(matchesPagas).toBe(true);
      } else {
        expect(matchesInpagas).toBe(true);
      }
    }
  });
});

describe('disciplinaPredicate', () => {
  it('returns the crossfit plan predicate', () => {
    expect(disciplinaPredicate('crossfit')).toEqual({ allowsCrossfit: true });
  });

  it('returns the musculacion plan predicate', () => {
    expect(disciplinaPredicate('musculacion')).toEqual({ allowsMusculacion: true });
  });
});
