/*
  Warnings:

  - You are about to drop the column `fechaFin` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `Solicitud` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoriaEspacio" AS ENUM ('SALONES', 'TEATROS', 'ESPACIOS_EXTERIORES', 'RECORRIDOS', 'GALERIA');

-- CreateEnum
CREATE TYPE "ModalidadCosto" AS ENUM ('ESTANDAR', 'CONVENIO', 'ESCUELA_CDLA', 'GRATUITO');

-- AlterTable
ALTER TABLE "Espacio" ADD COLUMN     "categoria" "CategoriaEspacio" NOT NULL DEFAULT 'SALONES',
ADD COLUMN     "precioCerrado" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "precioDesmontaje" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "precioEvento" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "precioMontaje" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "fechaFinCerrado" TIMESTAMP(3),
ADD COLUMN     "fechaFinDesmontaje" TIMESTAMP(3),
ADD COLUMN     "fechaFinEvento" TIMESTAMP(3),
ADD COLUMN     "fechaFinMontaje" TIMESTAMP(3),
ADD COLUMN     "fechaInicioCerrado" TIMESTAMP(3),
ADD COLUMN     "fechaInicioDesmontaje" TIMESTAMP(3),
ADD COLUMN     "fechaInicioEvento" TIMESTAMP(3),
ADD COLUMN     "fechaInicioMontaje" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Solicitud" DROP COLUMN "fechaFin",
DROP COLUMN "fechaInicio",
ADD COLUMN     "agendadoPor" TEXT,
ADD COLUMN     "celular" TEXT,
ADD COLUMN     "contactoResponsable" TEXT,
ADD COLUMN     "correo" TEXT,
ADD COLUMN     "costoEstimado" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "fechaFinCerrado" TIMESTAMP(3),
ADD COLUMN     "fechaFinDesmontaje" TIMESTAMP(3),
ADD COLUMN     "fechaFinEvento" TIMESTAMP(3),
ADD COLUMN     "fechaFinMontaje" TIMESTAMP(3),
ADD COLUMN     "fechaInicioCerrado" TIMESTAMP(3),
ADD COLUMN     "fechaInicioDesmontaje" TIMESTAMP(3),
ADD COLUMN     "fechaInicioEvento" TIMESTAMP(3),
ADD COLUMN     "fechaInicioMontaje" TIMESTAMP(3),
ADD COLUMN     "modalidadCosto" "ModalidadCosto" NOT NULL DEFAULT 'ESTANDAR',
ADD COLUMN     "personas" INTEGER,
ADD COLUMN     "tipoEvento" TEXT,
ALTER COLUMN "actividad" DROP NOT NULL;
