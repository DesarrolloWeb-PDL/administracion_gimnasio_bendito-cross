import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const profs = await p.usuario.findMany({
    where: { OR: [{ esProfesorCrossfit: true }, { esProfesorMusculacion: true }] },
    select: { id: true, nombre: true, rol: true, horarios: true, esProfesorCrossfit: true, esProfesorMusculacion: true }
  });
  console.log(JSON.stringify(profs, null, 2));

  const asist = await p.asistencia.findFirst({
    where: { socioId: 'cmkb8xrtp0000gajwl53gv0lv' },
    orderBy: { fecha: 'desc' },
    select: { id: true, fecha: true, modalidad: true }
  });
  console.log('\nDaniel ultima asistencia:', JSON.stringify(asist, null, 2));
}
main().then(() => p.$disconnect());
