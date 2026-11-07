"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Bug, X, Loader2, FolderKanban, Calendar, Plus, Check } from "lucide-react";
import { formatTaskId, formatBugId } from "@/lib/identifiers";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any | null;
  projects?: any[];
  onSuccess?: () => void;
}

export function EditTaskModal({
  isOpen,
  onClose,
  task,
  projects = [],
  onSuccess,
}: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done" | "cancelled">("todo");
  const [projectId, setProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Associated bugs state
  const [availableBugs, setAvailableBugs] = useState<any[]>([]);
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>([]);
  const [selectedBugToAdd, setSelectedBugToAdd] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Fetch available bugs
      fetch("/api/bugs")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setAvailableBugs(Array.isArray(data) ? data : []))
        .catch(() => {});
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "todo");
      setProjectId(task.projectId || "");

      const sDate = task.startDate
        ? task.startDate.includes("T")
          ? task.startDate.split("T")[0]
          : task.startDate.slice(0, 10)
        : "";
      const dDate = task.dueDate
        ? task.dueDate.includes("T")
          ? task.dueDate.split("T")[0]
          : task.dueDate.slice(0, 10)
        : "";

      setStartDate(sDate);
      setDueDate(dDate);
      setSelectedBugIds(task.associatedBugs?.map((b: any) => b.id) || []);
      setSelectedBugToAdd("");
      setError(null);
    }
  }, [task, isOpen]);

  if (!isOpen || !task || !mounted) return null;

  function handleAddBug() {
    if (!selectedBugToAdd || selectedBugIds.includes(selectedBugToAdd)) return;
    setSelectedBugIds([...selectedBugIds, selectedBugToAdd]);
    setSelectedBugToAdd("");
  }

  function handleRemoveBug(bugId: string) {
    setSelectedBugIds(selectedBugIds.filter((id) => id !== bugId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanProjectId = projectId.trim();

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
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
          bugIds: selectedBugIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message = data.error || "Failed to update task";
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
      setError(err.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  }

  // Find bug objects for selected IDs
  const linkedBugs = selectedBugIds
    .map((id) => availableBugs.find((b) => b.id === id) || task.associatedBugs?.find((b: any) => b.id === id))
    .filter(Boolean);

  const unlinkedBugs = availableBugs.filter((b) => !selectedBugIds.includes(b.id));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-white">Edit Task</h2>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/25">
            {formatTaskId(task)}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <span>Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Due Date (Deadline)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Associated Bugs Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-400" />
                <span>Associated Bugs ({linkedBugs.length})</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Resolving all bugs marks task Done
              </span>
            </div>

            {/* List of currently associated bugs */}
            {linkedBugs.length > 0 ? (
              <div className="space-y-1.5">
                {linkedBugs.map((b: any) => {
                  const isResolved = b.status === "resolved" || b.status === "closed";
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                          {formatBugId(b)}
                        </span>
                        <span className={`truncate text-slate-200 ${isResolved ? "line-through text-slate-400" : ""}`}>
                          {b.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                            isResolved
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {b.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBug(b.id)}
                          title="Unlink this bug"
                          className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No bugs currently linked to this task.</p>
            )}

            {/* Selector to add/link bugs */}
            {unlinkedBugs.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedBugToAdd}
                  onChange={(e) => setSelectedBugToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Select a bug to associate...</option>
                  {unlinkedBugs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBugId(b)}: {b.title} ({b.status})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddBug}
                  disabled={!selectedBugToAdd}
                  className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Bug</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
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
