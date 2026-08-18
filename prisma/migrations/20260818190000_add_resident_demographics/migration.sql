CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

ALTER TABLE "Resident"
ADD COLUMN "birthDate" TIMESTAMP(3),
ADD COLUMN "gender" "Gender";
