
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
    name: "Заявки",
    href: "#",
    icon: "📝",
  },
  {
    name: "Відгуки",
    href: "#",
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
    <aside className="flex h-full w-72 flex-col bg-slate-900 text-white md:w-64">
      <div className="flex items-start justify-between border-b border-slate-800 p-5 md:p-6">
        <div>
        <h1 className="text-2xl font-bold">
          StayBase
        </h1>

        <p className="text-slate-400">
          CRM
        </p>
        </div>
        {mobile && (
          <button onClick={onNavigate} aria-label="Закрити меню" className="rounded-lg p-2 text-2xl leading-none text-slate-300 hover:bg-slate-800">×</button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {menu.map((item) => item.href === "#" ? (
          <div key={item.name} className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500">
            <span>{item.icon}</span><span>{item.name}</span><span className="ml-auto text-xs">скоро</span>
          </div>
        ) : (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-800 ${pathname === item.href ? "bg-slate-800" : ""}`}
          >
            <span>{item.icon}</span>

            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
