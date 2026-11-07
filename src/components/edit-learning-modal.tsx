"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Brain, X, Loader2, FolderKanban, Sparkles } from "lucide-react";
import { MiniTextEditor } from "@/components/ui/mini-text-editor";

interface EditLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  learning: any | null;
  projects?: any[];
  onSuccess?: () => void;
}

const BOX_OPTIONS = [
  { value: 1, label: "Box 1 • Daily (1 day review interval)" },
  { value: 2, label: "Box 2 • 3 Days (short retention)" },
  { value: 3, label: "Box 3 • Weekly (7 days review interval)" },
  { value: 4, label: "Box 4 • Bi-weekly (14 days reinforcement)" },
  { value: 5, label: "Box 5 • Mastered (30 days long-term retention)" },
];

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
  const [reviewBox, setReviewBox] = useState<number>(1);
  const [reviewStatus, setReviewStatus] = useState<"new" | "learning" | "learned" | "mastered">("new");

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
      setReviewBox(learning.reviewBox || 1);
      setReviewStatus(learning.reviewStatus || "new");
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
      const res = await fetch(`/api/learnings/${learning.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          projectId: projectId.trim() || null,
          reviewBox: Number(reviewBox),
          reviewStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message = data.error || "Failed to update learning note";
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
      setError(err.message || "Failed to update learning");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#16181d] shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-success-subtle border border-success/20 flex items-center justify-center text-success">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Edit Knowledge Note</h2>
            <p className="text-xs text-slate-400">
              Update technical takeaways, code snippets, or Leitner retention stages.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js 16 Middleware edge runtime limitations"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">No Project (General)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Leitner Box (Spaced Review)
              </label>
              <select
                value={reviewBox}
                onChange={(e) => {
                  const b = Number(e.target.value);
                  setReviewBox(b);
                  if (b === 5) setReviewStatus("mastered");
                  else if (b >= 4) setReviewStatus("learned");
                  else if (b >= 2) setReviewStatus("learning");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {BOX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Retention Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="new">New Note</option>
                <option value="learning">In Practice</option>
                <option value="learned">Retained</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Note Content * (Markdown)
            </label>
            <MiniTextEditor
              value={content}
              onChange={setContent}
              placeholder="Document the architectural pattern, fix details, or shell command..."
              minHeight="min-h-[160px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
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
