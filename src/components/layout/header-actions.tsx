"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  Menu,
  X,
  LayoutDashboard,
  CheckSquare,
  Bug,
  Brain,
  FolderKanban,
  Settings,
} from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import clsx from "clsx";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { SmartCaptureModal } from "@/components/smart-capture-dialog";
import { SearchModal } from "@/components/search-modal";

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Bugs", href: "/bugs", icon: Bug },
  { name: "Learnings", href: "/learnings", icon: Brain },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface HeaderActionsProps {
  userProfile?: React.ReactNode;
}

export function HeaderActions({ userProfile }: HeaderActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      {/* Mobile Drawer Toggle */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left: Search Input */}
      <div className="flex-1 max-w-md min-w-0">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full text-left"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <div className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 hover:border-slate-700 transition flex items-center justify-between cursor-pointer">
            <span className="truncate">Search tasks, bugs, learnings...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 shrink-0">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Cluster: AI Smart Capture + Quick Add + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Smart AI Capture Button */}
        <button
          type="button"
          onClick={() => setIsSmartCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm shadow-primary/20 transition cursor-pointer"
        >
          <AIIcon className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Smart Capture</span>
        </button>

        {/* Manual Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{pathname?.startsWith("/bugs") ? "Add Bug" : "Add"}</span>
        </button>

        {userProfile}
      </div>

      {/* Mobile Navigation Drawer */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 flex flex-col h-screen h-dvh z-10 shadow-2xl">
            {/* Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-md shadow-primary/20">
                  D
                </div>
                <span className="font-semibold text-base text-white">DevLoom</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition",
                      isActive
                        ? "bg-primary-subtle text-primary border border-primary/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    )}
                  >
                    <Icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>,
        document.body
      )}

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultTab={pathname?.startsWith("/bugs") ? "bug" : undefined}
        lockTab={pathname?.startsWith("/bugs")}
        onSuccess={() => router.refresh()}
      />

      <SmartCaptureModal
        isOpen={isSmartCaptureOpen}
        onClose={() => setIsSmartCaptureOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
