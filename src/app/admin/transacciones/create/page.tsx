import Form from '@/components/transacciones/create-form';
import { fetchActiveSuscripcionesForSelect } from '@/lib/data-transacciones';
import prisma from '@/lib/prisma';

export default async function Page() {
  const suscripciones = await fetchActiveSuscripcionesForSelect();
  const configuracion = await prisma.configuracion.findFirst();

  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl font-bold">
        Registrar Pago
      </h1>
      <Form suscripciones={suscripciones} logoUrl={configuracion?.logoUrl} />
    </main>
  );
}
