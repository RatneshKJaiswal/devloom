"use client";

import { useState } from "react";
import { Link2, Plus, Trash2, AlertCircle, ArrowRight, X, Loader2, Lock } from "lucide-react";
import type { DependencyWithDetails } from "@/lib/dal/dependencies";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface ProjectDependenciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  tasks: TaskItem[];
  dependencies: DependencyWithDetails[];
  onRefresh: () => void;
}

export function ProjectDependenciesModal({
  isOpen,
  onClose,
  projectId,
  tasks = [],
  dependencies = [],
  onRefresh,
}: ProjectDependenciesModalProps) {
  const [predecessorId, setPredecessorId] = useState("");
  const [successorId, setSuccessorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!predecessorId || !successorId) {
      setError("Please select both a predecessor and successor task");
      return;
    }

    if (predecessorId === successorId) {
      setError("A task cannot depend on itself");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predecessorId, successorId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create dependency");
      }

      setPredecessorId("");
      setSuccessorId("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(depId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/dependencies/${depId}`, {
        method: "DELETE",
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error("Failed to delete dependency:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-subtle text-primary border border-primary/20">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Task Dependencies</h3>
              <p className="text-xs text-slate-400">
                Finish-to-start constraints within this project
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl border border-danger/30 bg-danger-subtle text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Dependency Form */}
        <form onSubmit={handleCreate} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="text-xs font-semibold text-slate-300">Add New Dependency Link</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Predecessor Task (Must Finish First)
              </label>
              <select
                value={predecessorId}
                onChange={(e) => setPredecessorId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select predecessor...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Successor Task (Cannot Start Before)
              </label>
              <select
                value={successorId}
                onChange={(e) => setSuccessorId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select successor...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === predecessorId}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !predecessorId || !successorId}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Link Tasks</span>
            </button>
          </div>
        </form>

        {/* Existing Dependencies List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Existing Dependencies ({dependencies.length})</span>
          </div>

          {dependencies.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 text-center border border-dashed border-slate-800 rounded-xl">
              No dependencies linked yet. Link tasks above to prevent successors from starting before predecessors complete.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {dependencies.map((dep) => {
                const isBlocked = dep.predecessorStatus !== "done";

                return (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-slate-200 truncate max-w-[150px]">
                        {dep.predecessorTitle}
                      </span>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

                      <span className="font-medium text-slate-200 truncate max-w-[150px]">
                        {dep.successorTitle}
                      </span>

                      {isBlocked && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-danger/30 bg-danger-subtle text-red-300 flex items-center gap-1 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Blocked</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(dep.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                      title="Remove dependency"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
