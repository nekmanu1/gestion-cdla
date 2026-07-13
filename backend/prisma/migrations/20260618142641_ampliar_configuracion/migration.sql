-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "colorPrincipal" TEXT DEFAULT '#111827',
ADD COLUMN     "mensajeReportes" TEXT,
ADD COLUMN     "nombreComercial" TEXT,
ADD COLUMN     "notaFactura" TEXT,
ADD COLUMN     "prefijoFactura" TEXT DEFAULT 'FAC',
ADD COLUMN     "prefijoReserva" TEXT DEFAULT 'RES',
ADD COLUMN     "prefijoSolicitud" TEXT DEFAULT 'SOL',
ADD COLUMN     "representanteLegal" TEXT,
ADD COLUMN     "ruc" TEXT,
ADD COLUMN     "sitioWeb" TEXT,
ADD COLUMN     "terminosFactura" TEXT;
