import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getProfesoresEnTurno } from '@/lib/horarios';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://benditocross.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// HMAC-signed token (stateless - works across serverless instances)
const TOKEN_SECRET = process.env.TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'benditocross-default-secret-change-me';
const TOKEN_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

function signToken(payload: { socioId: string; profesorId?: string; checkInTime?: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token: string): { socioId: string; profesorId?: string; checkInTime?: string } | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp < Date.now()) return null;

    return {
      socioId: payload.socioId,
      profesorId: payload.profesorId,
      checkInTime: payload.checkInTime,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socioId, dni } = body;

    if (!socioId || !dni) {
      return NextResponse.json({ error: 'Faltan socioId y dni' }, { status: 400, headers: CORS_HEADERS });
    }

    // Find the socio
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404, headers: CORS_HEADERS });
    }

    if (!socio.activo) {
      return NextResponse.json({ error: 'Socio inactivo' }, { status: 403, headers: CORS_HEADERS });
    }

    if (socio.dni !== dni) {
      return NextResponse.json({ error: 'DNI incorrecto' }, { status: 401, headers: CORS_HEADERS });
    }

    // Check attendance for today (required to see routines)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let asistenciaHoy = false;
    let checkInFecha: Date | null = null;
    try {
      const asistencia = await prisma.asistencia.findFirst({
        where: {
          socioId: socio.id,
          fecha: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
      asistenciaHoy = !!asistencia;
      checkInFecha = asistencia?.fecha || null;
    } catch {
      // If attendance check fails, allow access (resilient fallback)
      asistenciaHoy = true;
    }

    // Determine which professor was on shift at check-in time
    let profesorIdEnTurno: string | undefined;
    if (checkInFecha) {
      try {
        const profesores = await prisma.usuario.findMany({
          where: {
            OR: [
              { esProfesorCrossfit: true },
              { esProfesorMusculacion: true },
            ],
          },
          select: {
            id: true,
            horarios: true,
            esProfesorCrossfit: true,
            esProfesorMusculacion: true,
          },
        });

        // Check both disciplines at check-in time
        const cfIds = getProfesoresEnTurno(profesores, 'crossfit', checkInFecha);
        const muscIds = getProfesoresEnTurno(profesores, 'musculacion', checkInFecha);
        const allIds = [...cfIds, ...muscIds];

        if (allIds.length > 0) {
          profesorIdEnTurno = allIds[0]; // first professor on shift
        }
      } catch {
        // If schedule lookup fails, leave profesorId undefined (fallback to all)
      }
    }

    if (!asistenciaHoy) {
      return NextResponse.json(
        { error: 'No tenés registro de asistencia para hoy. Registrate en la recepción del gimnasio.' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Check subscription access and get allowed types
    let tieneAcceso = true;
    let tiposAcceso: string[] = ['crossfit', 'musculacion']; // default: both if no subscriptions

    try {
      const suscripciones = await prisma.suscripcion.findMany({
        where: {
          socioId: socio.id,
          activa: true,
        },
        include: { plan: true },
      });

      if (suscripciones.length > 0) {
        const tiposSet = new Set<string>();
        suscripciones.forEach((s) => {
          if (s.plan) {
            if (s.plan.allowsCrossfit) tiposSet.add('crossfit');
            if (s.plan.allowsMusculacion) tiposSet.add('musculacion');
          }
        });
        tiposAcceso = Array.from(tiposSet);
        tieneAcceso = tiposAcceso.length > 0;
      }
    } catch {
      // If subscription check fails, allow access (resilient fallback)
      tieneAcceso = true;
    }

    if (!tieneAcceso) {
      return NextResponse.json(
        { error: 'No tiene suscripción activa para acceder a rutinas' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Generate HMAC-signed stateless token
    const token = signToken({
      socioId: socio.id,
      profesorId: profesorIdEnTurno,
      checkInTime: checkInFecha?.toISOString(),
      exp: Date.now() + TOKEN_EXPIRY_MS,
    });

    // Fetch professor name for response
    let profesorNombre: string | null = null;
    if (profesorIdEnTurno) {
      try {
        const profesor = await prisma.usuario.findUnique({
          where: { id: profesorIdEnTurno },
          select: { nombre: true },
        });
        profesorNombre = profesor?.nombre || null;
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      token,
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        apellido: socio.apellido,
      },
      tiposAcceso,
      profesor: profesorNombre ? { id: profesorIdEnTurno, nombre: profesorNombre } : null,
      checkInTime: checkInFecha?.toISOString() || null,
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error en auth pública:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Error al autenticar' }, { status: 500, headers: CORS_HEADERS });
  }
}
