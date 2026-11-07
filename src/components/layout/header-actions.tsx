"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { SmartCaptureModal } from "@/components/smart-capture-dialog";
import { SearchModal } from "@/components/search-modal";

export function HeaderActions() {
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
    <>
      {/* Search Input Trigger */}
      <div className="flex items-center gap-2 max-w-md w-full">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full text-left"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <div className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-400 hover:border-slate-700 transition flex items-center justify-between cursor-pointer">
            <span>Search tasks, bugs, learnings...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Smart AI Capture Button */}
        <button
          type="button"
          onClick={() => setIsSmartCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-medium shadow-sm shadow-indigo-500/20 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Smart Capture</span>
        </button>

        {/* Manual Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
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
    </>
  );
}
