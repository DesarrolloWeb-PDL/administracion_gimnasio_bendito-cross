-- AlterTable: Add horarios field to Usuario
ALTER TABLE "Usuario" ADD COLUMN "horarios" JSONB;

-- AlterTable: Make contenido nullable, add contenidoJson, version, semanaInicio to Rutina
ALTER TABLE "Rutina" ALTER COLUMN "contenido" DROP NOT NULL;
ALTER TABLE "Rutina" ADD COLUMN "contenidoJson" JSONB;
ALTER TABLE "Rutina" ADD COLUMN "version" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Rutina" ADD COLUMN "semanaInicio" TIMESTAMP(3);

-- CreateIndex: Add index on semanaInicio
CREATE INDEX "Rutina_semanaInicio_idx" ON "Rutina"("semanaInicio");
