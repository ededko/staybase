import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

export default async function ActivityPage() {
  const { workspace, role } = await requireWorkspace();
  if (role !== "OWNER") redirect("/");
  const logs = await prisma.auditLog.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return <main className="operations-page p-4 sm:p-6 lg:p-8"><p className="eyebrow">КОНТРОЛЬ</p><h1 className="text-4xl font-bold">Журнал дій</h1><p className="mt-2 text-slate-500">Хто, що і коли змінив у StayBase</p>
    <div className="activity-list mt-6">{logs.map((log) => <article key={log.id}><div className="activity-icon">{log.action.includes("PAYMENT") ? "₴" : log.action.includes("REQUEST") ? "✓" : "•"}</div><div><b>{log.actorName}</b><p>{log.summary}</p><small>{log.createdAt.toLocaleString("uk-UA")}</small></div></article>)}{logs.length === 0 && <div className="empty-state">Нові дії з’являтимуться тут.</div>}</div>
  </main>;
}
