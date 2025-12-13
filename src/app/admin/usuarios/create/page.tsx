import Form from '@/components/usuarios/create-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  if (session?.user?.rol !== 'ADMIN') {
    redirect('/admin/usuarios');
  }
  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl font-bold">
        Crear Usuario
      </h1>
      <Form />
    </main>
  );
}
