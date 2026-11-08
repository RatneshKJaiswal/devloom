"use client";

import { useState } from "react";
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
  BookText,
  Terminal,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Bugs", href: "/bugs", icon: Bug },
  { name: "Knowledge Base", href: "/learnings", icon: Code2 },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Documentation", href: "/docs", icon: BookText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const handleCopyInstall = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const installCmd = `curl -fsSL ${typeof window !== "undefined" ? window.location.origin : "https://dev-loom.vercel.app"}/install.sh | bash`;
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur flex-col shrink-0 sticky top-0 h-screen max-h-screen overflow-y-auto">
      {/* Brand */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
        <DevLoomLogo className="h-8 w-8" />
        <span className="font-semibold text-base tracking-tight text-white">DevLoom</span>
        <span
          title="Version 1.0 (Production Release)"
          className="ml-auto text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-primary-subtle text-primary border border-primary/20 leading-none"
        >
          v1.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

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

      {/* Try DevLoom CLI Banner (Website Themed) */}
      <div className="p-3 border-t border-slate-800/80 shrink-0">
        <div className="relative rounded-2xl border border-primary/25 bg-gradient-to-b from-slate-900/90 to-slate-950 p-3 shadow-lg shadow-black/40 overflow-hidden group hover:border-primary/45 transition">
          {/* Subtle ambient primary light */}
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />

          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-subtle border border-primary/30 text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">Try DevLoom CLI</span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
              v1.0
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
            Auto-detects git repos and syncs tasks & gotchas right from your shell.
          </p>

          {/* Quick install copy snippet - Click anywhere to copy, perfectly formatted */}
          <div
            onClick={() => handleCopyInstall()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopyInstall(); }}
            title="Click to copy install command"
            className="group/cmd flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-primary/50 text-slate-300 mb-2.5 cursor-pointer transition select-none"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-primary font-bold font-mono text-[11px] select-none shrink-0">$</span>
              <span className="font-mono text-[10.5px] tracking-tight text-slate-300 group-hover/cmd:text-white transition whitespace-nowrap overflow-hidden">
                curl -fsSL ... | bash
              </span>
            </div>
            <div className="p-1 rounded bg-slate-900 border border-slate-800 group-hover/cmd:border-primary/40 text-slate-400 group-hover/cmd:text-white transition shrink-0">
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Link to CLI Docs */}
          <Link
            href="/docs#cli"
            className="flex items-center justify-between w-full text-[11px] font-medium text-primary hover:text-primary-hover transition group/link"
          >
            <span>View CLI Setup & Commands</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
