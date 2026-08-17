"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createWorkspace(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Вкажіть назву робочого простору");

  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    await prisma.workspace.create({
      data: {
        name,
        members: { create: { userId: session.user.id, role: "OWNER" } },
      },
    });
  }
  redirect("/");
}
