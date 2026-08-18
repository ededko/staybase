import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Actor = {
  id: string;
  name: string;
  email: string;
};

type AuditInput = {
  workspaceId: string;
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAudit(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actor.id,
      actorName: input.actor.name,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId == null ? null : String(input.entityId),
      summary: input.summary,
      metadata: input.metadata,
    },
  });
}
