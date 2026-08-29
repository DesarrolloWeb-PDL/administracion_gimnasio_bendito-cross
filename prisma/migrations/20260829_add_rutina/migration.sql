-- CreateTable
CREATE TABLE "Rutina" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'crossfit',
    "nivel" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "profesorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rutina_fecha_idx" ON "Rutina"("fecha");

-- CreateIndex
CREATE INDEX "Rutina_tipo_idx" ON "Rutina"("tipo");

-- CreateIndex
CREATE INDEX "Rutina_activa_idx" ON "Rutina"("activa");

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
