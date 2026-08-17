-- Reconciles schema changes that already exist in production but were not
-- captured in the original migration history. This migration is baselined on
-- production with `prisma migrate resolve --applied`; it runs normally on new databases.

ALTER TABLE "Room" DROP COLUMN "bedsCount";

ALTER TABLE "Bed" ADD COLUMN "notes" TEXT;

ALTER TABLE "Resident"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ALTER COLUMN "bedId" DROP NOT NULL;
