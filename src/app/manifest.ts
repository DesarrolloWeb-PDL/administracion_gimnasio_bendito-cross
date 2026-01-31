import { MetadataRoute } from 'next';
import { getConfiguracion } from '@/lib/data';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getConfiguracion();
  
  return {
    name: config?.nombreGimnasio || 'Sistema de Gestión de Gimnasio',
    short_name: config?.nombreGimnasio?.substring(0, 12) || 'Gimnasio',
    description: `Sistema de administración para ${config?.nombreGimnasio || 'gimnasio'}`,
    start_url: '/',
    display: 'standalone',
    background_color: config?.colorSecundario || '#ffffff',
    theme_color: config?.colorPrimario || '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: []
  };
}
