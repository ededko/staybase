
import SignOutButton from "@/components/auth/SignOutButton";

export default function Header({ userName, onMenuOpen }: { userName: string; onMenuOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuOpen} aria-label="Відкрити меню" className="rounded-lg border p-2 text-xl leading-none md:hidden">☰</button>
        <h2 className="truncate text-lg font-semibold sm:text-xl">StayBase CRM</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
