import { NextResponse } from 'next/server';
import { abrirPuertaMagnetica } from '@/lib/puerta-service';

/**
 * API Route para control manual de la puerta magnética
 * POST /api/puerta/abrir
 * 
 * Útil para pruebas o control manual desde el panel de admin
 */
export async function POST() {
  try {
    await abrirPuertaMagnetica();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Puerta abierta correctamente' 
    });
  } catch (error) {
    console.error('Error en API de puerta:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al abrir la puerta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
