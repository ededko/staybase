ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "WorkspaceInvite" ADD COLUMN "role" "WorkspaceRole" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "Resident" ADD COLUMN "paidThrough" TIMESTAMP(3);

CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BLIK', 'BANK_TRANSFER', 'CARD', 'COMPANY', 'OTHER');
ALTER TABLE "Payment" ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'CASH';
ALTER TABLE "Payment" ADD COLUMN "paidThrough" TIMESTAMP(3);

CREATE TYPE "InternalRequestCategory" AS ENUM ('PURCHASE', 'CLEANING', 'LINEN', 'REPAIR', 'TRANSPORT', 'BILL', 'HR', 'OTHER');
CREATE TYPE "InternalRequestStatus" AS ENUM ('NEW', 'REVIEW', 'APPROVED', 'IN_PROGRESS', 'DONE', 'REJECTED');

CREATE TABLE "InternalRequest" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "hostelId" INTEGER,
  "roomId" INTEGER,
  "requestedByUserId" TEXT NOT NULL,
  "assignedToUserId" TEXT,
  "approvedByUserId" TEXT,
  "category" "InternalRequestCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(65,30),
  "attachmentUrl" TEXT,
  "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "InternalRequestStatus" NOT NULL DEFAULT 'NEW',
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "InternalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT NOT NULL,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_residentId_dueDate_idx" ON "Payment"("residentId", "dueDate");
CREATE INDEX "Payment_paid_dueDate_idx" ON "Payment"("paid", "dueDate");
CREATE INDEX "InternalRequest_workspaceId_status_idx" ON "InternalRequest"("workspaceId", "status");
CREATE INDEX "InternalRequest_requestedByUserId_createdAt_idx" ON "InternalRequest"("requestedByUserId", "createdAt");
CREATE INDEX "InternalRequest_assignedToUserId_status_idx" ON "InternalRequest"("assignedToUserId", "status");
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "InternalRequest" ADD CONSTRAINT "InternalRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalRequest" ADD CONSTRAINT "InternalRequest_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalRequest" ADD CONSTRAINT "InternalRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
