"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
export async function markNotificationRead(formData:FormData){const {workspace,session}=await requireWorkspace();const id=Number(formData.get("id"));await prisma.notification.updateMany({where:{id,workspaceId:workspace.id,userId:session.user.id},data:{readAt:new Date()}});revalidatePath("/notifications");}
