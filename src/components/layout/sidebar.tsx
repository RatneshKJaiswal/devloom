"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DevLoomLogo } from "@/components/icons/devloom-logo";
import {
  LayoutDashboard,
  CheckSquare,
  Bug,
  Code2,
  FolderKanban,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Bugs", href: "/bugs", icon: Bug },
  { name: "Knowledge Base", href: "/learnings", icon: Code2 },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur flex-col shrink-0 sticky top-0 h-screen max-h-screen overflow-y-auto">
      {/* Brand */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
        <DevLoomLogo className="h-8 w-8" />
        <span className="font-semibold text-base tracking-tight text-white">DevLoom</span>
        <span className="ml-auto text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/20 leading-none">
          Beta
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-primary-subtle text-primary border border-primary/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
