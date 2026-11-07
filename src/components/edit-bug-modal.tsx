"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bug, X, Loader2, FolderKanban, Calendar } from "lucide-react";

interface EditBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  bug: any | null;
  projects?: any[];
  onSuccess?: () => void;
}

export function EditBugModal({
  isOpen,
  onClose,
  bug,
  projects = [],
  onSuccess,
}: EditBugModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix">("open");
  const [projectId, setProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [reproSteps, setReproSteps] = useState("");
  const [suspectedCause, setSuspectedCause] = useState("");

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
    if (bug && isOpen) {
      setTitle(bug.title || "");
      setDescription(bug.description || "");
      setPriority(bug.priority || "medium");
      setStatus(bug.status || "open");
      setProjectId(bug.projectId || "");
      setStackTrace(bug.stackTrace || "");
      setReproSteps(bug.reproSteps || "");
      setSuspectedCause(bug.suspectedCause || "");

      const sDate = bug.startDate
        ? bug.startDate.includes("T")
          ? bug.startDate.split("T")[0]
          : bug.startDate.slice(0, 10)
        : "";
      const dDate = bug.dueDate
        ? bug.dueDate.includes("T")
          ? bug.dueDate.split("T")[0]
          : bug.dueDate.slice(0, 10)
        : "";

      setStartDate(sDate);
      setDueDate(dDate);
      setError(null);
    }
  }, [bug, isOpen]);

  if (!isOpen || !bug || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bugs/${bug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          projectId: projectId.trim() || null,
          startDate: startDate ? startDate : null,
          dueDate: dueDate ? dueDate : null,
          stackTrace: stackTrace.trim() || null,
          reproSteps: reproSteps.trim() || null,
          suspectedCause: suspectedCause.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message = data.error || "Failed to update bug";
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
      setError(err.message || "Failed to update bug");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Bug className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Edit Bug Report</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="confirmed">Confirmed</option>
                <option value="fixing">Fixing</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Due Date (Target Resolution)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Suspected Cause</label>
              <input
                type="text"
                value={suspectedCause}
                onChange={(e) => setSuspectedCause(e.target.value)}
                placeholder="Identified hypothesis or commit..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reproduction Steps</label>
              <input
                type="text"
                value={reproSteps}
                onChange={(e) => setReproSteps(e.target.value)}
                placeholder="1. Trigger action, 2. Observe crash..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Stack Trace / Logs</label>
              <textarea
                rows={3}
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="Error logs or trace..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
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
