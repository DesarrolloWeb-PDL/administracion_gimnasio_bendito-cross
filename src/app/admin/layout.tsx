import { getConfiguracion } from '@/lib/data';
import { auth, signOut } from '@/auth';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import NavLinks from '@/components/admin/nav-links';
import MobileSidebar from '@/components/admin/mobile-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfiguracion();
  const session = await auth();

  let userPermissions = null;
  if (session?.user?.email) {
    userPermissions = await prisma.usuario.findUnique({
        where: { email: session.user.email },
    });
  }

  // Valores por defecto si no hay configuración
  const primaryColor = config?.colorPrimario || '#2563eb'; // blue-600
  const secondaryColor = config?.colorSecundario || '#1e40af'; // blue-800
  const nombreGimnasio = config?.nombreGimnasio || 'GMS White-Label';
  const fondoUrl = config?.fondoUrl;

  // Convertir colores hex a RGB para usar con opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235'; // fallback blue
  };

  return (
    <div 
      className="flex h-screen flex-col md:flex-row md:overflow-hidden"
      style={{ 
        '--primary-color': primaryColor, 
        '--secondary-color': secondaryColor,
        '--primary-color-rgb': hexToRgb(primaryColor),
        '--secondary-color-rgb': hexToRgb(secondaryColor)
      } as React.CSSProperties}
    >
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        permissions={userPermissions}
        role={userPermissions?.rol}
        nombreGimnasio={nombreGimnasio}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        fondoUrl={fondoUrl}
      >
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <button className="nav-link flex w-full items-center justify-start gap-2 rounded-md p-3 text-sm font-medium text-white transition-all duration-200">
            Cerrar Sesión
          </button>
        </form>
      </MobileSidebar>

      {/* Desktop Sidebar */}
      <div 
        className="hidden md:flex w-64 flex-none flex-col px-3 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <Link
          className="mb-2 flex h-40 items-end justify-start rounded-md p-4 relative overflow-hidden group"
          href="/admin"
          style={{ backgroundColor: secondaryColor }}
        >
          {fondoUrl && (
             <div 
               className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
               style={{ backgroundImage: `url(${fondoUrl})` }} 
             />
          )}
          <div className="w-40 text-white relative z-10">
            <h1 className="text-xl font-bold drop-shadow-md">{nombreGimnasio}</h1>
            {config?.logoUrl && (
                <span className="text-xs opacity-70">Logo Configurado</span>
            )}
          </div>
        </Link>
        
        <div className="flex grow flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2">
            <NavLinks permissions={userPermissions} role={userPermissions?.rol} />
          </div>
          
          <div className="mt-2">
            <form
              action={async () => {
                'use server';
                await signOut();
              }}
            >
              <button className="nav-link flex h-12 w-full items-center justify-start gap-2 rounded-md p-2 px-3 text-sm font-medium text-white transition-all duration-200">
                <div>Cerrar Sesión</div>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Contenido Principal */}
      <div 
        className="grow p-6 md:overflow-y-auto md:p-12 transition-colors"
        style={{ 
          background: `linear-gradient(135deg, rgba(var(--secondary-color-rgb), 0.05), rgba(var(--primary-color-rgb), 0.05))`
        }}
      >
        <header className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Panel de Administración</h2>
            <div className="flex items-center gap-4">
              <ThemeToggle />
                <div className="text-sm text-gray-700 dark:text-white/90">
                  Hola, <span className="font-semibold">{userPermissions?.nombre || session?.user?.name || 'Usuario'}</span> ({userPermissions?.rol || session?.user?.rol})
                </div>
            </div>
        </header>
        {children}
      </div>
    </div>
  );
}
