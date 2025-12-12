import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CheckInForm from '@/components/asistencias/check-in-form';
import prisma from '@/lib/prisma';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function KioscoPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verificar permiso de asistencias
  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email },
  });

  const canAccess = user?.rol === 'ADMIN' || user?.permisoAsistencias;

  if (!canAccess) {
    redirect('/admin');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm p-8 shadow-2xl glass-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Control de Acceso</h1>
          <p className="text-gray-300 text-sm mt-2">Ingrese su DNI para registrar asistencia</p>
        </div>
        <CheckInForm />
      </div>
    </main>
  );
}
