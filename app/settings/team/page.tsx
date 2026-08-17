import { notFound } from "next/navigation";
import { cancelInvite, inviteAdmin, removeAdmin } from "@/app/actions/team";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TeamPage() {
  const { workspace, role } = await requireWorkspace();
  if (role !== "OWNER") notFound();

  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">Команда</h1>
      <p className="mt-2 text-slate-500">Адміністратори мають доступ до даних робочого простору «{workspace.name}».</p>

      <form action={inviteAdmin} className="mt-8 flex max-w-2xl gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <input name="email" type="email" required placeholder="Email адміністратора" className="min-w-0 flex-1 rounded-lg border p-3" />
        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white">Додати</button>
      </form>

      <section className="mt-8 max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm">
        <h2 className="border-b p-5 text-xl font-bold">Учасники</h2>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 p-5">
              <div><p className="font-medium">{member.user.name}</p><p className="text-sm text-slate-500">{member.user.email}</p></div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{member.role === "OWNER" ? "Власник" : "Адміністратор"}</span>
                {member.role === "ADMIN" && <form action={removeAdmin}><input type="hidden" name="memberId" value={member.id} /><button className="text-sm text-red-600 hover:underline">Видалити</button></form>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {invites.length > 0 && (
        <section className="mt-6 max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm">
          <h2 className="border-b p-5 text-xl font-bold">Очікують реєстрації</h2>
          <div className="divide-y">{invites.map((invite) => <div key={invite.id} className="flex items-center justify-between p-5"><span>{invite.email}</span><form action={cancelInvite}><input type="hidden" name="inviteId" value={invite.id} /><button className="text-sm text-red-600 hover:underline">Скасувати</button></form></div>)}</div>
        </section>
      )}
    </main>
  );
}
