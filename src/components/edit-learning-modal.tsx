"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Code2, X, Loader2, FolderKanban, Zap, Layers, Terminal, ChevronDown } from "lucide-react";
import { MiniTextEditor } from "@/components/ui/mini-text-editor";
import {
  inferKnowledgeCategory,
  KnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
} from "@/lib/knowledge";

interface EditLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  learning: any | null;
  projects?: any[];
  onSuccess?: () => void;
}

export function EditLearningModal({
  isOpen,
  onClose,
  learning,
  projects = [],
  onSuccess,
}: EditLearningModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [category, setCategory] = useState<KnowledgeCategory>("gotcha");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (learning && isOpen) {
      setTitle(learning.title || "");
      setContent(learning.content || "");
      setProjectId(learning.projectId || "");
      setCategory(inferKnowledgeCategory(learning));
      setError(null);
    }
  }, [learning, isOpen]);

  if (!isOpen || !learning || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and note content are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Resolve or create category tag
      let tagIds = (learning.tags || []).map((t: any) => t.id).filter(Boolean);
      const categoryTagMap: Record<KnowledgeCategory, string> = {
        gotcha: "gotcha",
        pattern: "design-pattern",
        snippet: "cli-snippet",
      };
      const desiredTagName = categoryTagMap[category];

      // Create or find category tag if not present
      try {
        const tagRes = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: desiredTagName, color: "#4285F4" }),
        });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          if (tagData?.id && !tagIds.includes(tagData.id)) {
            // Remove previous category tags if changing
            tagIds = [...tagIds, tagData.id];
          }
        }
      } catch {}

      const res = await fetch(`/api/learnings/${learning.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          projectId: projectId.trim() || null,
          tagIds: tagIds.length > 0 ? tagIds : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message = data.error || "Failed to update knowledge entry";
        if (data.details) {
          const detailList = Object.entries(data.details)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join(" | ");
          message = `${message}: ${detailList}`;
        }
        throw new Error(message);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update knowledge entry");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#131519] shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Edit Knowledge Entry</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update technical gotchas, design patterns, or CLI snippets.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js 16 Middleware edge runtime limitations"
              className="w-full h-8 px-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Knowledge Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("gotcha")}
                className={`px-3 py-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                  category === "gotcha"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-xs"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Technical Gotcha</div>
                  <div className="text-[10px] text-slate-400">Bug & caveat fixes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory("pattern")}
                className={`px-3 py-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                  category === "pattern"
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold shadow-xs"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Design Pattern</div>
                  <div className="text-[10px] text-slate-400">Architecture & clean code</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory("snippet")}
                className={`px-3 py-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                  category === "snippet"
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold shadow-xs"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">CLI Snippet</div>
                  <div className="text-[10px] text-slate-400">Commands & one-liners</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <span>Project (Optional)</span>
            </label>
            <div className="relative flex items-center">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none transition"
              >
                <option value="" className="bg-slate-950 text-slate-200">No Project (General Knowledge)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Knowledge Content * (Markdown)
            </label>
            <MiniTextEditor
              value={content}
              onChange={setContent}
              placeholder="Paste terminal snippet, gotcha workaround, or design pattern explanation..."
              minHeight="min-h-[160px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800/80 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
