-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_driverId_fkey";

-- CreateTable
CREATE TABLE "_VehicleDrivers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_VehicleDrivers_AB_unique" ON "_VehicleDrivers"("A", "B");

-- CreateIndex
CREATE INDEX "_VehicleDrivers_B_index" ON "_VehicleDrivers"("B");

-- AddForeignKey
ALTER TABLE "_VehicleDrivers" ADD CONSTRAINT "_VehicleDrivers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleDrivers" ADD CONSTRAINT "_VehicleDrivers_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
