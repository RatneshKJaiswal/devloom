"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Bug,
  Brain,
  FolderKanban,
  Settings,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Bugs", href: "/bugs", icon: Bug },
  { name: "Learnings", href: "/learnings", icon: Brain },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
          D
        </div>
        <span className="font-semibold text-base tracking-tight text-white">DevLoom</span>
        <span className="ml-auto text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
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
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Quick Status / Quota Indicator */}
      <div className="p-4 m-3 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini Agent</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Capture stack traces or notes with smart auto-tagging.
        </p>
      </div>
    </aside>
  );
}
