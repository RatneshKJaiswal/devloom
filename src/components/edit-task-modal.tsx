"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Bug, X, Loader2, FolderKanban, Calendar, Plus, Check, ChevronDown } from "lucide-react";
import { formatTaskId, formatBugId } from "@/lib/identifiers";
import { DevActionsToolbar } from "@/components/common/dev-actions-toolbar";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#131519] shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-primary-subtle border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Edit Task</h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary-subtle text-primary border border-primary/25 leading-none">
                {formatTaskId(task)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Update task details, priority, timeline, and associated bugs.
            </p>
          </div>
        </div>

        <div className="mb-3.5">
          <DevActionsToolbar
            type="task"
            idDisplay={formatTaskId(task)}
            title={title}
            description={description}
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
              placeholder="e.g. Implement refresh token rotation"
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
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
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
                  <option value="todo" className="bg-slate-950 text-slate-200">To Do</option>
                  <option value="in_progress" className="bg-slate-950 text-slate-200">In Progress</option>
                  <option value="done" className="bg-slate-950 text-slate-200">Done</option>
                  <option value="cancelled" className="bg-slate-950 text-slate-200">Cancelled</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
              </div>
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
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Due Date (Deadline)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-slate-600 cursor-pointer transition"
              />
            </div>
          </div>

          {/* Associated Bugs Section */}
          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-400" />
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
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 leading-none">
                          {formatBugId(b)}
                        </span>
                        <span className={`truncate text-slate-200 ${isResolved ? "line-through text-slate-400" : ""}`}>
                          {b.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border leading-none ${
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
                <div className="relative flex-1 flex items-center">
                  <select
                    value={selectedBugToAdd}
                    onChange={(e) => setSelectedBugToAdd(e.target.value)}
                    className="w-full h-8 px-2.5 pr-8 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none transition"
                  >
                    <option value="" className="bg-slate-950 text-slate-200">Select a bug to associate...</option>
                    {unlinkedBugs.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-950 text-slate-200">
                        {formatBugId(b)}: {b.title} ({b.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none shrink-0" />
                </div>
                <button
                  type="button"
                  onClick={handleAddBug}
                  disabled={!selectedBugToAdd}
                  className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Bug</span>
                </button>
              </div>
            )}
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
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
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
