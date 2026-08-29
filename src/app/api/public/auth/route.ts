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

// Token store in-memory (en producción usar Redis o DB)
const activeTokens = new Map<string, { socioId: string; expiresAt: number }>();

// Limpiar tokens expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeTokens.entries()) {
    if (data.expiresAt < now) {
      activeTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socioId, dni } = body;

    if (!socioId || !dni) {
      return NextResponse.json({ error: 'Faltan socioId y dni' }, { status: 400, headers: CORS_HEADERS });
    }

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        suscripciones: {
          where: { activa: true },
          include: { plan: true },
        },
      },
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

    // Verificar que tenga suscripción activa con acceso a crossfit o musculacion
    const tieneAcceso = socio.suscripciones.some(
      (s) => s.plan && (s.plan.allowsCrossfit || s.plan.allowsMusculacion)
    );

    if (!tieneAcceso) {
      return NextResponse.json({ error: 'No tiene suscripción activa para acceder a rutinas' }, { status: 403, headers: CORS_HEADERS });
    }

    // Generar token (válido por 12 horas)
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, {
      socioId: socio.id,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
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

export function verifyToken(token: string): string | null {
  const data = activeTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    activeTokens.delete(token);
    return null;
  }
  return data.socioId;
}
