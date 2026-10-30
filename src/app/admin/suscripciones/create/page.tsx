import Form from '@/components/suscripciones/create-form';
import { fetchAllSocios } from '@/lib/data-socios';
import { fetchActivePlanes } from '@/lib/data-planes';

export default async function Page() {
  const [socios, planes] = await Promise.all([
    fetchAllSocios(),
    fetchActivePlanes(),
  ]);

  const fechaInicio = new Date().toISOString().split('T')[0];

  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl font-bold">
        Nueva Suscripción
      </h1>
      <Form socios={socios} planes={planes} fechaInicio={fechaInicio} />
    </main>
  );
}
