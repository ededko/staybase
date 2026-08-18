ALTER TABLE "WorkspaceMember" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "WorkspaceInvite" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "WorkspaceMember" ADD COLUMN "permissionsConfigured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkspaceInvite" ADD COLUMN "permissionsConfigured" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Resident" ADD COLUMN "monthlyRent" DECIMAL(65,30);
ALTER TABLE "Resident" ADD COLUMN "paymentDueDay" INTEGER;
UPDATE "Resident" r SET "monthlyRent" = (SELECT p.amount FROM "Payment" p WHERE p."residentId" = r.id AND p.type = 'RENT' ORDER BY p."dueDate" DESC LIMIT 1);
UPDATE "Resident" SET "paymentDueDay" = EXTRACT(DAY FROM COALESCE("paidThrough", "checkIn"))::INTEGER;

ALTER TABLE "MaintenanceTicket" ADD COLUMN "assignedToUserId" TEXT;

CREATE TABLE "Notification" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_workspaceId_createdAt_idx" ON "Notification"("workspaceId", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
