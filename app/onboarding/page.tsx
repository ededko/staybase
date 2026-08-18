import { createWorkspace } from "@/app/actions/workspaces";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/app/actions/team";

export default async function OnboardingPage() {
  const session = await requireSession();
  const invites = await prisma.workspaceInvite.findMany({
    where: { email: session.user.email.toLowerCase() },
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Створіть свій StayBase</h1>
        <p className="mt-2 text-slate-500">Дані вашої компанії будуть відокремлені від інших акаунтів.</p>
        {invites.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="font-semibold">Вас запросили:</h2>
            {invites.map((invite) => (
              <form key={invite.id} action={acceptInvite} className="flex items-center justify-between gap-4 rounded-xl border bg-slate-50 p-4">
                <input type="hidden" name="inviteId" value={invite.id} />
                <span>{invite.workspace.name}</span>
                <button className="rounded-lg bg-green-600 px-4 py-2 text-white">Приєднатися</button>
              </form>
            ))}
            <div className="border-t pt-5 text-center text-sm text-slate-500">або створіть власний простір</div>
          </div>
        )}
        <form action={createWorkspace} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">Назва компанії або хостелів</span>
            <input name="name" required minLength={2} placeholder="Наприклад, StayBase Gdańsk" className="w-full rounded-lg border p-3" />
          </label>
          <button className="w-full rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">Почати роботу</button>
        </form>
      </div>
    </main>
  );
}
