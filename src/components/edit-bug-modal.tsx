"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bug, CheckSquare, X, Loader2, FolderKanban, Calendar, ChevronDown } from "lucide-react";
import { formatBugId, formatTaskId } from "@/lib/identifiers";
import { DevActionsToolbar } from "@/components/common/dev-actions-toolbar";

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
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#131519] shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Edit Bug Report</h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 leading-none">
                {formatBugId(bug)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Update defect details, priority, target resolution, and stack traces.
            </p>
          </div>
        </div>

        <div className="mb-3.5">
          <DevActionsToolbar
            type="bug"
            idDisplay={formatBugId(bug)}
            title={title}
            description={description}
            stackTrace={stackTrace}
            suspectedCause={suspectedCause}
            reproSteps={reproSteps}
            projectName={projects.find((p) => p.id === projectId)?.name}
          />
        </div>

        {error && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Postgres connection timeout under load"
              className="w-full h-8 px-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context or notes..."
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>Project</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer appearance-none transition"
                >
                  <option value="" className="bg-slate-950 text-slate-200">No Project (General)</option>
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
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Priority</label>
              <div className="relative flex items-center">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer appearance-none transition"
                >
                  <option value="low" className="bg-slate-950 text-slate-200">Low</option>
                  <option value="medium" className="bg-slate-950 text-slate-200">Medium</option>
                  <option value="high" className="bg-slate-950 text-slate-200">High</option>
                  <option value="urgent" className="bg-slate-950 text-slate-200">Urgent</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Status</label>
              <div className="relative flex items-center">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer appearance-none transition"
                >
                  <option value="open" className="bg-slate-950 text-slate-200">Open</option>
                  <option value="confirmed" className="bg-slate-950 text-slate-200">Confirmed</option>
                  <option value="fixing" className="bg-slate-950 text-slate-200">Fixing</option>
                  <option value="resolved" className="bg-slate-950 text-slate-200">Resolved</option>
                  <option value="closed" className="bg-slate-950 text-slate-200">Closed</option>
                  <option value="wont_fix" className="bg-slate-950 text-slate-200">Won't Fix</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
              </div>
            </div>
          </div>

          {/* Associated Task Section */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
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
                className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer appearance-none transition"
              >
                <option value="" className="bg-slate-950 text-slate-200">No Associated Task (Standalone Bug)</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                    {formatTaskId(t)}: {t.title} ({t.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Due Date (Target Resolution)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Suspected Cause</label>
            <input
              type="text"
              value={suspectedCause}
              onChange={(e) => setSuspectedCause(e.target.value)}
              placeholder="Identified hypothesis or commit..."
              className="w-full h-8 px-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Reproduction Steps</label>
            <textarea
              rows={2}
              value={reproSteps}
              onChange={(e) => setReproSteps(e.target.value)}
              placeholder="1. Trigger action, 2. Observe crash..."
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Stack Trace / Error Output</label>
            <textarea
              rows={3}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder="Paste stack trace or error log here..."
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition leading-relaxed"
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
              disabled={loading}
              className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
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
