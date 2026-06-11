/*
  Warnings:

  - The values [CONSULTA] on the enum `Rol` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[cedulaRuc]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTOR');
ALTER TABLE "public"."Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "public"."Rol_old";
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'OPERADOR';
COMMIT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "tipoCliente" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cedulaRuc_key" ON "Cliente"("cedulaRuc");
