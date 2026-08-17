
import SignOutButton from "@/components/auth/SignOutButton";

export default function Header({ userName }: { userName: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-xl font-semibold">StayBase CRM</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
