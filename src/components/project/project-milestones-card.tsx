"use client";

import { useState } from "react";
import { Flag, Plus, Trash2, Calendar, CheckSquare, Square, Loader2 } from "lucide-react";

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  targetDate: string;
  isCompleted: boolean;
}

interface ProjectMilestonesCardProps {
  projectId: string;
  milestones: Milestone[];
  onRefresh?: () => void;
}

export function ProjectMilestonesCard({
  projectId,
  milestones = [],
  onRefresh,
}: ProjectMilestonesCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate,
        }),
      });

      if (res.ok) {
        setTitle("");
        setTargetDate("");
        setDescription("");
        setIsAdding(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to add milestone:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleMilestone(m: Milestone) {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !m.isCompleted }),
      });
      if (res.ok && onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
    }
  }

  async function deleteMilestone(id: string) {
    if (!confirm("Delete this milestone?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${id}`, {
        method: "DELETE",
      });
      if (res.ok && onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-warning" />
          <h3 className="text-xs font-semibold text-white">Project Milestones</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
            {milestones.filter((m) => m.isCompleted).length}/{milestones.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-primary hover:text-blue-400 flex items-center gap-1 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Add Milestone Form */}
      {isAdding && (
        <form
          onSubmit={handleAddMilestone}
          className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2.5"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Milestone title (e.g. 'Beta Testing Completed')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 rounded-lg bg-primary hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            >
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
        </form>
      )}

      {/* Milestone List */}
      {milestones.length === 0 ? (
        <p className="text-xs text-slate-400 py-1">
          No milestones defined. Set milestone deadlines to highlight targets on your timeline.
        </p>
      ) : (
        <div className="space-y-1.5">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3 text-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleMilestone(m)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {m.isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-success" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <div className="min-w-0">
                  <span
                    className={`font-medium truncate block ${
                      m.isCompleted ? "line-through text-slate-400" : "text-slate-200"
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{m.targetDate}</span>
                </span>

                <button
                  type="button"
                  onClick={() => deleteMilestone(m.id)}
                  title="Delete milestone"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
