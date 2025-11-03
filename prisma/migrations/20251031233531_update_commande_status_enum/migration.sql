/*
  Warnings:

  - The `status` column on the `Commande` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CommandeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'STARTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Commande" DROP COLUMN "status",
ADD COLUMN     "status" "CommandeStatus" NOT NULL DEFAULT 'PENDING';
