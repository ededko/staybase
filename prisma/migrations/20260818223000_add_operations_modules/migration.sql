CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING', 'CONFIRMED', 'MOVED_IN', 'REJECTED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT');
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'DONE');
CREATE TYPE "QualityStatus" AS ENUM ('NEW', 'REVIEWED', 'RESOLVED');

CREATE TABLE "LeadApplication" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "hostelId" INTEGER,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "peopleCount" INTEGER NOT NULL DEFAULT 1,
  "desiredMoveIn" TIMESTAMP(3),
  "stayMonths" INTEGER,
  "budget" DECIMAL(65,30),
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "externalId" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceTicket" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "hostelId" INTEGER NOT NULL,
  "roomId" INTEGER,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "photoUrl" TEXT,
  "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
  "reporterName" TEXT,
  "reporterPhone" TEXT,
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityEntry" (
  "id" SERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "hostelId" INTEGER,
  "roomId" INTEGER,
  "source" TEXT NOT NULL DEFAULT 'INTERNAL',
  "authorName" TEXT,
  "rating" INTEGER,
  "category" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" "QualityStatus" NOT NULL DEFAULT 'NEW',
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QualityEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadApplication_workspaceId_status_idx" ON "LeadApplication"("workspaceId", "status");
CREATE INDEX "LeadApplication_hostelId_idx" ON "LeadApplication"("hostelId");
CREATE INDEX "LeadApplication_source_externalId_idx" ON "LeadApplication"("source", "externalId");
CREATE INDEX "MaintenanceTicket_workspaceId_status_idx" ON "MaintenanceTicket"("workspaceId", "status");
CREATE INDEX "MaintenanceTicket_hostelId_roomId_idx" ON "MaintenanceTicket"("hostelId", "roomId");
CREATE INDEX "QualityEntry_workspaceId_status_idx" ON "QualityEntry"("workspaceId", "status");
CREATE INDEX "QualityEntry_hostelId_roomId_idx" ON "QualityEntry"("hostelId", "roomId");

ALTER TABLE "LeadApplication" ADD CONSTRAINT "LeadApplication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadApplication" ADD CONSTRAINT "LeadApplication_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QualityEntry" ADD CONSTRAINT "QualityEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QualityEntry" ADD CONSTRAINT "QualityEntry_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QualityEntry" ADD CONSTRAINT "QualityEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
