-- AlterTable
ALTER TABLE "Bed" ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN "notes" TEXT;
