"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Bug, Brain, X, Loader2, FolderKanban } from "lucide-react";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProjectId?: string | null;
}

export function QuickCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId = null,
}: QuickCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<"task" | "bug" | "learning">("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [projects, setProjects] = useState<any[]>([]);

  // Bug fields
  const [stackTrace, setStackTrace] = useState("");
  const [reproSteps, setReproSteps] = useState("");
  const [suspectedCause, setSuspectedCause] = useState("");

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      fetch("/api/projects")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setProjects(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen, defaultProjectId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let endpoint = "/api/tasks";
      let body: Record<string, unknown> = {
        title,
        description,
        priority,
        projectId: projectId.trim() || undefined,
      };

      if (activeTab === "bug") {
        endpoint = "/api/bugs";
        body = {
          title,
          description,
          priority,
          projectId: projectId.trim() || undefined,
          stackTrace: stackTrace.trim() || undefined,
          reproSteps: reproSteps.trim() || undefined,
          suspectedCause: suspectedCause.trim() || undefined,
        };
      } else if (activeTab === "learning") {
        endpoint = "/api/learnings";
        body = {
          title,
          content: description,
          projectId: projectId.trim() || undefined,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create item");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStackTrace("");
      setReproSteps("");
      setSuspectedCause("");
      if (!defaultProjectId) setProjectId("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6 max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab("task")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "task"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bug")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "bug"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Bug</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("learning")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "learning"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Learning</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === "task"
                  ? "e.g. Implement refresh token rotation"
                  : activeTab === "bug"
                  ? "e.g. Postgres connection timeout under load"
                  : "e.g. Next.js middleware cannot use Node crypto/socket"
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {activeTab === "learning" ? "Note Content *" : "Description"}
            </label>
            <textarea
              required={activeTab === "learning"}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                activeTab === "learning"
                  ? "Explain the gotcha, command, or concept in your own words..."
                  : "Additional context or notes..."
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Project & Priority Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                <span>Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">No Project (General)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab !== "learning" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === "bug" && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stack Trace / Error Output
                </label>
                <textarea
                  rows={2}
                  value={stackTrace}
                  onChange={(e) => setStackTrace(e.target.value)}
                  placeholder="Paste stack trace or error log here..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reproduction Steps
                </label>
                <input
                  type="text"
                  value={reproSteps}
                  onChange={(e) => setReproSteps(e.target.value)}
                  placeholder="1. Trigger action, 2. Observe crash..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
