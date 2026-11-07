"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { SmartCaptureModal } from "@/components/smart-capture-dialog";
import { SearchModal } from "@/components/search-modal";

interface HeaderActionsProps {
  userProfile?: React.ReactNode;
}

export function HeaderActions({ userProfile }: HeaderActionsProps) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <div className="flex items-center justify-between gap-4 w-full">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-xs font-medium shadow-sm shadow-primary/20 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Smart Capture</span>
        </button>

        {/* Manual Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Add</span>
        </button>

        {userProfile}
      </div>

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <SmartCaptureModal
        isOpen={isSmartCaptureOpen}
        onClose={() => setIsSmartCaptureOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
