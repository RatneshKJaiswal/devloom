"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, CheckSquare, Bug, Brain, Loader2 } from "lucide-react";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#131519] shadow-2xl overflow-hidden relative">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search across tasks, bugs, and learnings..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              Search by title, description, stack trace, or learning content.
            </div>
          )}

          {results.map((item) => {
            const isTask = item.type === "task";
            const isBug = item.type === "bug";
            const isLearning = item.type === "learning";

            const href = isTask
              ? `/tasks#task-${item.id}`
              : isBug
              ? `/bugs#bug-${item.id}`
              : `/learnings`;

            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={href}
                onClick={onClose}
                className="block p-3 rounded-xl hover:bg-slate-800/60 transition border border-transparent hover:border-slate-700/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  {isTask && <CheckSquare className="w-3.5 h-3.5 text-primary" />}
                  {isBug && <Bug className="w-3.5 h-3.5 text-warning" />}
                  {isLearning && <Brain className="w-3.5 h-3.5 text-success" />}

                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.type}
                  </span>

                  {item.projectName && (
                    <span className="text-[10px] text-slate-400">
                      &bull; {item.projectName}
                    </span>
                  )}
                  {item.status && (
                    <span className="text-[10px] text-slate-400">
                      &bull; {item.status}
                    </span>
                  )}
                </div>

                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {item.preview}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
