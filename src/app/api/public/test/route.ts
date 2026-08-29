import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test 1: Basic Prisma Socio query
    const socio = await prisma.socio.findUnique({
      where: { id: body.socioId },
    });
    
    if (!socio) {
      return NextResponse.json({ error: 'Socio not found', test: 'findUnique-socio' });
    }

    // Test 2: Try Suscripcion query
    let subResult = 'skipped';
    try {
      const subs = await prisma.suscripcion.findMany({
        where: { socioId: socio.id },
        include: { plan: true },
      });
      subResult = `found ${subs.length} subscriptions`;
    } catch (e) {
      subResult = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 3: Token sign
    const token = crypto.randomBytes(32).toString('hex');

    return NextResponse.json({
      ok: true,
      socio: socio.nombre,
      subResult,
      tokenLength: token.length,
      prismaWorks: true,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'no stack',
    });
  }
}
