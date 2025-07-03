/*
  Warnings:

  - You are about to drop the column `condition` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `record` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "condition",
ADD COLUMN     "record" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone",
ADD COLUMN     "phone_number" TEXT NOT NULL DEFAULT '12345';

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
