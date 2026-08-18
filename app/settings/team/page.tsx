import { cancelInvite, inviteAdmin, removeAdmin } from "@/app/actions/team";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeamPage() {
  const { workspace, role } = await requireWorkspace();
  const isOwner = role === "OWNER";

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
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold">Команда</h1>
      <p className="mt-2 text-slate-500">Адміністратори мають доступ до даних робочого простору «{workspace.name}».</p>

      {isOwner ? (
        <form action={inviteAdmin} className="mt-8 flex max-w-2xl gap-3 rounded-2xl border bg-white p-5 shadow-sm">
          <input name="email" type="email" required placeholder="Email працівника" className="min-w-0 flex-1 rounded-lg border p-3" />
          <select name="role" defaultValue="ADMIN" aria-label="Роль"><option value="ADMIN">Адміністратор</option><option value="STAFF">Працівник</option></select>
          <button className="rounded-lg bg-slate-900 px-5 py-3 text-white">Додати</button>
        </form>
      ) : (
        <p className="mt-6 max-w-2xl rounded-xl border bg-white p-4 text-slate-600">
          Ви маєте роль адміністратора. Керувати складом команди може лише власник.
        </p>
      )}

      <section className="mt-8 max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm">
        <h2 className="border-b p-5 text-xl font-bold">Учасники</h2>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 p-5">
              <div><p className="font-medium">{member.user.name}</p><p className="text-sm text-slate-500">{member.user.email}</p></div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{member.role === "OWNER" ? "Власник" : member.role === "ADMIN" ? "Адміністратор" : "Працівник"}</span>
                {isOwner && member.role !== "OWNER" && <form action={removeAdmin}><input type="hidden" name="memberId" value={member.id} /><button className="text-sm text-red-600 hover:underline">Видалити</button></form>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isOwner && invites.length > 0 && (
        <section className="mt-6 max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm">
          <h2 className="border-b p-5 text-xl font-bold">Очікують реєстрації</h2>
          <div className="divide-y">{invites.map((invite) => <div key={invite.id} className="flex items-center justify-between p-5"><span>{invite.email} · {invite.role === "ADMIN" ? "адміністратор" : "працівник"}</span><form action={cancelInvite}><input type="hidden" name="inviteId" value={invite.id} /><button className="text-sm text-red-600 hover:underline">Скасувати</button></form></div>)}</div>
        </section>
      )}
      {isOwner && <Link href="/settings/activity" className="mt-6 inline-block text-blue-600">Переглянути журнал дій →</Link>}
    </main>
  );
}
