/*
  Warnings:

  - Added the required column `nombreEvento` to the `Solicitud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "nombreEvento" TEXT NOT NULL;
