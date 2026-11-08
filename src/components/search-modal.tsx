"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  CheckSquare,
  Bug,
  Code2,
  FolderKanban,
  Settings,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import clsx from "clsx";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: () => void;
  onOpenSmartCapture?: () => void;
}

interface PaletteAction {
  id: string;
  category: "Navigation" | "Quick Action" | "Search Result";
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: any;
  action: () => void;
}

const STATIC_NAVIGATION = [
  { title: "Dashboard & Standup", href: "/dashboard", icon: Calendar, category: "Navigation" as const },
  { title: "Tasks (List, Kanban & Gantt)", href: "/tasks", icon: CheckSquare, category: "Navigation" as const },
  { title: "Bug Tracker & Defect Log", href: "/bugs", icon: Bug, category: "Navigation" as const },
  { title: "Knowledge Base (Leitner Gotchas)", href: "/learnings", icon: Code2, category: "Navigation" as const },
  { title: "Projects & SDLC Timeline", href: "/projects", icon: FolderKanban, category: "Navigation" as const },
  { title: "Developer Settings & CLI Tokens", href: "/settings", icon: Settings, category: "Navigation" as const },
];

export function SearchModal({
  isOpen,
  onClose,
  onOpenQuickCapture,
  onOpenSmartCapture,
}: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Live search debounced
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Command palette search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Build the complete list of displayed palette actions
  const actions: PaletteAction[] = [];

  const lowerQuery = query.toLowerCase().trim();

  // 1. Quick Actions (if query matches or query is empty)
  const quickActions: PaletteAction[] = [
    {
      id: "qa-smart-capture",
      category: "Quick Action",
      title: "Smart AI Capture",
      subtitle: "Parse unstructured text or GitHub issue URLs into tasks & bugs",
      badge: "AI",
      badgeColor: "bg-purple-950/80 text-purple-300 border-purple-800",
      icon: AIIcon,
      action: () => {
        onClose();
        if (onOpenSmartCapture) onOpenSmartCapture();
      },
    },
    {
      id: "qa-quick-task",
      category: "Quick Action",
      title: "Create New Task",
      subtitle: "Add an item to the backlog with priority and milestone dates",
      icon: Plus,
      action: () => {
        onClose();
        if (onOpenQuickCapture) {
          onOpenQuickCapture();
        } else {
          router.push("/tasks");
        }
      },
    },
    {
      id: "qa-quick-bug",
      category: "Quick Action",
      title: "Report Defect / Bug",
      subtitle: "Log reproduction steps, stack trace, and target resolution",
      icon: Bug,
      action: () => {
        onClose();
        if (onOpenQuickCapture) {
          onOpenQuickCapture();
        } else {
          router.push("/bugs");
        }
      },
    },
  ];

  for (const qa of quickActions) {
    if (!lowerQuery || qa.title.toLowerCase().includes(lowerQuery) || qa.subtitle?.toLowerCase().includes(lowerQuery)) {
      actions.push(qa);
    }
  }

  // 2. Search Results
  for (const item of searchResults) {
    let icon = CheckSquare;
    let badge = "Task";
    let badgeColor = "bg-blue-950/80 text-blue-300 border-blue-800";
    let targetUrl = `/tasks?selected=${item.id}`;

    if (item.type === "bug") {
      icon = Bug;
      badge = item.bugNumber ? `BUG-${item.bugNumber}` : "Bug";
      badgeColor = "bg-red-950/80 text-red-300 border-red-800";
      targetUrl = `/bugs?selected=${item.id}`;
    } else if (item.type === "learning") {
      icon = Code2;
      badge = "Gotcha";
      badgeColor = "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      targetUrl = `/learnings?selected=${item.id}`;
    } else {
      badge = item.taskNumber ? `TSK-${item.taskNumber}` : "Task";
    }

    actions.push({
      id: `search-${item.id}`,
      category: "Search Result",
      title: item.title,
      subtitle: item.projectName ? `${item.projectName} • ${item.preview}` : item.preview,
      badge,
      badgeColor,
      icon,
      action: () => {
        onClose();
        router.push(targetUrl);
      },
    });
  }

  // 3. Navigation Items
  for (const nav of STATIC_NAVIGATION) {
    if (!lowerQuery || nav.title.toLowerCase().includes(lowerQuery)) {
      actions.push({
        id: `nav-${nav.href}`,
        category: "Navigation",
        title: nav.title,
        icon: nav.icon,
        action: () => {
          onClose();
          router.push(nav.href);
        },
      });
    }
  }

  // Arrow key and enter navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < actions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : actions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (actions[selectedIndex]) {
        actions[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#121316] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Omnibar Input */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center gap-3 bg-[#131519]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks, bugs, gotchas or type a command..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results / Commands List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1 divide-y divide-slate-800/40">
          {actions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching commands, tasks, or records found for &quot;{query}&quot;.
            </div>
          ) : (
            actions.map((act, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = act.icon;

              return (
                <div
                  key={act.id}
                  data-index={idx}
                  onClick={act.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={clsx(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer transition select-none",
                    isSelected
                      ? "bg-slate-800/90 text-white"
                      : "text-slate-300 hover:bg-slate-800/40"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        "p-1.5 rounded-lg shrink-0",
                        isSelected ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{act.title}</span>
                        {act.badge && (
                          <span
                            className={clsx(
                              "font-mono text-[10px] px-1.5 py-0.2 rounded border shrink-0",
                              act.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                            )}
                          >
                            {act.badge}
                          </span>
                        )}
                      </div>
                      {act.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {act.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <span className="hidden sm:inline">{act.category}</span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-800 bg-[#0d0e12] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px]">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px]">↵</kbd> to select
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] text-slate-400">DevLoom Omnibar</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
