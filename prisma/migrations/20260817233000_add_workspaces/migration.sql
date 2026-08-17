CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN');

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Hostel" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Resident" ADD COLUMN "workspaceId" TEXT;

INSERT INTO "Workspace" ("id", "name", "updatedAt")
VALUES ('legacy-staybase-workspace', 'Мій StayBase', CURRENT_TIMESTAMP);

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role")
SELECT 'legacy-owner-membership', 'legacy-staybase-workspace', "id", 'OWNER'
FROM "user"
ORDER BY "createdAt" ASC
LIMIT 1;

UPDATE "Hostel" SET "workspaceId" = 'legacy-staybase-workspace';
UPDATE "Resident" SET "workspaceId" = 'legacy-staybase-workspace';

ALTER TABLE "Hostel" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Resident" ALTER COLUMN "workspaceId" SET NOT NULL;

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key"
ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "Hostel_workspaceId_idx" ON "Hostel"("workspaceId");
CREATE INDEX "Resident_workspaceId_idx" ON "Resident"("workspaceId");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
