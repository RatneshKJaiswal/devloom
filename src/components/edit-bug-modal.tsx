"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bug, CheckSquare, X, Loader2, FolderKanban, Calendar, ChevronDown } from "lucide-react";
import { formatBugId, formatTaskId } from "@/lib/identifiers";

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

  // Associated task state
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [associatedTaskId, setAssociatedTaskId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Fetch available tasks
      fetch("/api/tasks")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setAvailableTasks(Array.isArray(data) ? data : []))
        .catch(() => {});
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

      // Initialize associated task
      const existingTaskId = bug.associatedTasks?.[0]?.id || "";
      setAssociatedTaskId(existingTaskId);
      setError(null);
    }
  }, [bug, isOpen]);

  if (!isOpen || !bug || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanProjectId = projectId.trim();
    const cleanTaskId = associatedTaskId.trim();

    try {
      const res = await fetch(`/api/bugs/${bug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          projectId: cleanProjectId && UUID_REGEX.test(cleanProjectId) ? cleanProjectId : null,
          startDate: startDate ? startDate : null,
          dueDate: dueDate ? dueDate : null,
          stackTrace: stackTrace.trim() || null,
          reproSteps: reproSteps.trim() || null,
          suspectedCause: suspectedCause.trim() || null,
          taskId: cleanTaskId && UUID_REGEX.test(cleanTaskId) ? cleanTaskId : null,
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
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#131519] shadow-2xl p-7 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Edit Bug Report</h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 leading-none">
                {formatBugId(bug)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Update defect details, priority, target resolution, and stack traces.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Postgres connection timeout under load"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context or notes..."
              className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>Project</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none transition"
                >
                  <option value="" className="bg-slate-950 text-slate-200">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Priority</label>
              <div className="relative flex items-center">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none transition"
                >
                  <option value="low" className="bg-slate-950 text-slate-200">Low</option>
                  <option value="medium" className="bg-slate-950 text-slate-200">Medium</option>
                  <option value="high" className="bg-slate-950 text-slate-200">High</option>
                  <option value="urgent" className="bg-slate-950 text-slate-200">Urgent</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Status</label>
              <div className="relative flex items-center">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none transition"
                >
                  <option value="open" className="bg-slate-950 text-slate-200">Open</option>
                  <option value="confirmed" className="bg-slate-950 text-slate-200">Confirmed</option>
                  <option value="fixing" className="bg-slate-950 text-slate-200">Fixing</option>
                  <option value="resolved" className="bg-slate-950 text-slate-200">Resolved</option>
                  <option value="closed" className="bg-slate-950 text-slate-200">Closed</option>
                  <option value="wont_fix" className="bg-slate-950 text-slate-200">Won't Fix</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
              </div>
            </div>
          </div>

          {/* Associated Task Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                <span>Associated Task</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Resolving this bug contributes to completing the task
              </span>
            </label>
            <div className="relative flex items-center">
              <select
                value={associatedTaskId}
                onChange={(e) => setAssociatedTaskId(e.target.value)}
                className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none transition"
              >
                <option value="" className="bg-slate-950 text-slate-200">No Associated Task (Standalone Bug)</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                    {formatTaskId(t)}: {t.title} ({t.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Due Date (Target Resolution)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Suspected Cause</label>
            <input
              type="text"
              value={suspectedCause}
              onChange={(e) => setSuspectedCause(e.target.value)}
              placeholder="Identified hypothesis or commit..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Reproduction Steps</label>
            <textarea
              rows={2}
              value={reproSteps}
              onChange={(e) => setReproSteps(e.target.value)}
              placeholder="1. Trigger action, 2. Observe crash..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Stack Trace / Error Output</label>
            <textarea
              rows={3}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder="Paste stack trace or error log here..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-amber-600/25 cursor-pointer disabled:opacity-50"
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
