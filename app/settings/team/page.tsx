import { cancelInvite, inviteAdmin, removeAdmin, updateMemberPermissions } from "@/app/actions/team";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { effectivePermissions, permissionGroups } from "@/lib/permissions";

function PermissionChecks({ selected = [] }: { selected?: string[] }) {
  return <div className="permission-grid">{permissionGroups.map((group) => <fieldset key={group.label}><legend>{group.label}</legend>{group.items.map(([value, label]) => <label key={value}><input type="checkbox" name="permissions" value={value} defaultChecked={selected.includes(value)} />{label}</label>)}</fieldset>)}</div>;
}

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
      <p className="mt-2 text-slate-500">Для кожного учасника можна окремо вибрати доступи до розділів «{workspace.name}».</p>

      {isOwner ? (
        <form action={inviteAdmin} className="team-access-form mt-8 max-w-5xl rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-3"><input name="email" type="email" required placeholder="Email працівника" className="min-w-64 flex-1 rounded-lg border p-3" /><select name="role" defaultValue="STAFF" aria-label="Роль"><option value="ADMIN">Адміністратор</option><option value="STAFF">Працівник</option></select></div>
          <h2 className="mt-5 font-bold">Дозволи</h2><PermissionChecks />
          <button className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-white">Надіслати запрошення</button>
        </form>
      ) : (
        <p className="mt-6 max-w-2xl rounded-xl border bg-white p-4 text-slate-600">
          Ви маєте роль адміністратора. Керувати складом команди може лише власник.
        </p>
      )}

      <section className="mt-8 max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-sm">
        <h2 className="border-b p-5 text-xl font-bold">Учасники</h2>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="team-member p-5">
              <div className="flex items-center justify-between gap-4"><div><p className="font-medium">{member.user.name}</p><p className="text-sm text-slate-500">{member.user.email}</p></div><span className={`role-badge role-${member.role.toLowerCase()}`}>{member.role === "OWNER" ? "Власник" : member.role === "ADMIN" ? "Адміністратор" : "Працівник"}</span></div>
              {isOwner && member.role !== "OWNER" && <details className="mt-4"><summary className="cursor-pointer font-semibold text-amber-600">Налаштувати доступи</summary><form action={updateMemberPermissions} className="mt-4"><input type="hidden" name="memberId" value={member.id} /><select name="role" defaultValue={member.role}><option value="ADMIN">Адміністратор</option><option value="STAFF">Працівник</option></select><PermissionChecks selected={effectivePermissions(member)} /><div className="mt-4 flex gap-3"><button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Зберегти доступи</button></div></form><form action={removeAdmin} className="mt-3"><input type="hidden" name="memberId" value={member.id} /><button className="text-sm text-red-600 hover:underline">Видалити з команди</button></form></details>}
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
