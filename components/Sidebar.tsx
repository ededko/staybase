
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  {
    name: "Dashboard",
    href: "/",
    icon: "🏠",
  },
  {
    name: "Хостели",
    href: "/hostels",
    icon: "🏢",
  },
  {
    name: "Кімнати",
    href: "#",
    icon: "🛏️",
  },
  {
    name: "Мешканці",
    href: "/residents",
    icon: "👤",
  },
  {
    name: "Платежі",
    href: "/payments",
    icon: "💳",
  },
  {
    name: "Команда",
    href: "/settings/team",
    icon: "👥",
  },
  {
    name: "Заселення",
    href: "/applications",
    icon: "📝",
  },
  {
    name: "Ремонти",
    href: "/maintenance",
    icon: "🛠️",
  },
  {
    name: "Якість",
    href: "/quality",
    icon: "⭐",
  },
];

export default function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar flex h-full w-72 flex-col text-white md:w-64">
      <div className="flex items-start justify-between border-b border-white/10 p-5 md:p-6">
        <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 font-black text-slate-950">S</span>
          <div><h1 className="text-xl font-bold tracking-tight">StayBase</h1><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Hostel CRM</p></div>
        </div>
        </div>
        {mobile && (
          <button onClick={onNavigate} aria-label="Закрити меню" className="rounded-xl p-2 text-2xl leading-none text-slate-300 hover:bg-white/10">×</button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {menu.map((item) => item.href === "#" ? (
          <div key={item.name} className="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600">
            <span>{item.icon}</span><span>{item.name}</span><span className="ml-auto text-xs">скоро</span>
          </div>
        ) : (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`sidebar-link mb-1 flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${pathname === item.href ? "is-active" : ""}`}
          >
            <span>{item.icon}</span>

            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
