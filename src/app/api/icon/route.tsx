import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getConfiguracion } from '@/lib/data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '192');
    
    const config = await getConfiguracion();
    const logoUrl = config?.fondoUrl;
    const primaryColor = config?.colorPrimario || '#DC2626';
    const gymName = config?.nombreGimnasio || 'GYM';

    const response = new ImageResponse(
      (
        <div
          style={{
            background: primaryColor,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              width={size * 0.8}
              height={size * 0.8}
              style={{
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: size * 0.35, fontWeight: 'bold' }}>💪</div>
              <div style={{ 
                fontSize: size * 0.12, 
                marginTop: 10, 
                fontWeight: 'bold',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {gymName}
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: size,
        height: size,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    return response;
  } catch (e) {
    console.error('Error generating icon:', e);
    return new Response('Error generating icon', { status: 500 });
  }
}
