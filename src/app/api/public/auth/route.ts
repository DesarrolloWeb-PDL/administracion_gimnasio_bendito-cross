import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

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

function signToken(payload: { socioId: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token: string): string | null {
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

    return payload.socioId;
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

    // Step 1: Find the socio (simple query, no relations)
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

    // Step 2: Check subscription access (separate query to isolate failures)
    let tieneAcceso = false;
    try {
      const suscripciones = await prisma.suscripcion.findMany({
        where: {
          socioId: socio.id,
          activa: true,
        },
        include: { plan: true },
      });

      tieneAcceso = suscripciones.some(
        (s) => s.plan && (s.plan.allowsCrossfit || s.plan.allowsMusculacion)
      );
    } catch (subError) {
      console.error('Error consultando suscripciones:', subError instanceof Error ? subError.message : String(subError));
      // Fallback: allow access if subscription check fails (log for debugging)
      tieneAcceso = true;
    }

    if (!tieneAcceso) {
      return NextResponse.json({ error: 'No tiene suscripción activa para acceder a rutinas' }, { status: 403, headers: CORS_HEADERS });
    }

    // Generate HMAC-signed stateless token
    const token = signToken({
      socioId: socio.id,
      exp: Date.now() + TOKEN_EXPIRY_MS,
    });

    return NextResponse.json({
      token,
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        apellido: socio.apellido,
      },
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error en auth pública:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Error al autenticar' }, { status: 500, headers: CORS_HEADERS });
  }
}
