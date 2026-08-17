CREATE TABLE "Stay" (
    "id" SERIAL NOT NULL,
    "residentId" INTEGER NOT NULL,
    "bedId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Stay_residentId_startedAt_idx" ON "Stay"("residentId", "startedAt");
CREATE INDEX "Stay_bedId_startedAt_idx" ON "Stay"("bedId", "startedAt");
CREATE UNIQUE INDEX "Stay_one_active_per_resident_key"
ON "Stay"("residentId") WHERE "endedAt" IS NULL;

ALTER TABLE "Stay"
ADD CONSTRAINT "Stay_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stay"
ADD CONSTRAINT "Stay_bedId_fkey"
FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Stay" ("residentId", "bedId", "startedAt", "endedAt", "updatedAt")
SELECT
    "id",
    "bedId",
    "checkIn",
    CASE
        WHEN "isActive" = false THEN COALESCE("archivedAt", "checkOut", CURRENT_TIMESTAMP)
        ELSE NULL
    END,
    CURRENT_TIMESTAMP
FROM "Resident"
WHERE "bedId" IS NOT NULL;
