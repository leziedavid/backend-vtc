-- CreateEnum
CREATE TYPE "TrajetStatus" AS ENUM ('PENDING', 'CONFIRMED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Trajet" ADD COLUMN     "status" "TrajetStatus" NOT NULL DEFAULT 'PENDING';
