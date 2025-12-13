import prisma from '@/lib/prisma';

export async function getConfiguracion() {
	// Devuelve la primera configuración encontrada (White-Label)
	return await prisma.configuracion.findFirst();
}
