"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  CheckSquare,
  Trash2,
  Calendar,
  Loader2,
  Filter,
  FolderKanban,
  AlertCircle,
  Clock,
  Pencil,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Bug,
} from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { EditTaskModal } from "@/components/edit-task-modal";
import { GitHubLinkBadge } from "@/components/github/github-link-badge";
import { MarkdownPreview, stripMarkdown } from "@/components/ui/markdown-preview";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/tokens";
import { formatTaskId, formatBugId } from "@/lib/identifiers";

function getDateStatus(dueDateStr?: string | null, status?: string) {
  if (!dueDateStr || status === "done" || status === "cancelled") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      type: "overdue" as const,
      label: `${Math.abs(diffDays)}d overdue`,
      badgeClass: "bg-danger-subtle text-red-300 border-danger/40 animate-pulse font-semibold",
    };
  }
  if (diffDays === 0) {
    return {
      type: "due_today" as const,
      label: "Due today",
      badgeClass: "bg-warning-subtle text-amber-300 border-warning/40 font-semibold",
    };
  }
  if (diffDays <= 2) {
    return {
      type: "due_soon" as const,
      label: `Due in ${diffDays}d`,
      badgeClass: "bg-warning-subtle text-amber-300 border-warning/30",
    };
  }
  return {
    type: "scheduled" as const,
    label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(true);

  function toggleExpand(id: string) {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (projectFilter !== "all") params.set("projectId", projectFilter);

      const url = params.toString() ? `/api/tasks?${params.toString()}` : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, projectFilter]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  // Filter & Sort tasks
  const displayedTasks = useMemo(() => {
    let list = [...tasks];

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      list = list.filter((t) => {
        if (!t.dueDate) return dateFilter === "unscheduled";
        if (dateFilter === "unscheduled") return false;

        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

        if (dateFilter === "overdue") {
          return diffDays < 0 && t.status !== "done" && t.status !== "cancelled";
        }
        if (dateFilter === "due_soon") {
          return diffDays >= 0 && diffDays <= 7 && t.status !== "done" && t.status !== "cancelled";
        }
        if (dateFilter === "scheduled") {
          return !!t.dueDate;
        }
        return true;
      });
    }

    // Sort
    const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    list.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "due_earliest") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      }
      // newest default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const active = list.filter((t) => t.status !== "done" && t.status !== "cancelled");
    const completed = list.filter((t) => t.status === "done" || t.status === "cancelled");

    return {
      all: list,
      active,
      completed,
    };
  }, [tasks, dateFilter, sortBy]);

  function renderTaskCard(task: any) {
    const dateStatus = getDateStatus(task.dueDate, task.status);
    const isExpanded = !!expandedTasks[task.id];

    return (
      <div
        key={task.id}
        id={`task-${task.id}`}
        className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition flex items-start justify-between gap-4 group"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/25 leading-none">
              {formatTaskId(task)}
            </span>

            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border leading-none ${
                PRIORITY_CONFIG[task.priority]?.badgeClass || PRIORITY_CONFIG.medium.badgeClass
              }`}
            >
              {task.priority}
            </span>

            {task.projectName && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/20 cursor-pointer leading-none hover:bg-primary/20 transition"
                onClick={() => setProjectFilter(task.projectId)}
                title="Filter by this project"
              >
                {task.projectName}
              </span>
            )}

            {/* Due Date & Overdue Indicators */}
            {dateStatus && (
              <span
                className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 leading-none ${dateStatus.badgeClass}`}
              >
                {dateStatus.type === "overdue" && (
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                {(dateStatus.type === "due_soon" || dateStatus.type === "due_today") && (
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                {dateStatus.type === "scheduled" && (
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                )}
                <span>{dateStatus.label}</span>
              </span>
            )}
          </div>

          <div
            onClick={() => setEditingTask(task)}
            className={`text-sm font-medium cursor-pointer hover:text-primary transition ${
              task.status === "done" ? "line-through text-slate-400" : "text-white"
            }`}
          >
            {task.title}
          </div>

          {/* Associated Bugs */}
          {task.associatedBugs && task.associatedBugs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Bug className="w-3 h-3 text-amber-400" />
                <span>
                  Bugs ({task.associatedBugs.filter((b: any) => b.status === "resolved" || b.status === "closed").length}/{task.associatedBugs.length} resolved):
                </span>
              </span>
              {task.associatedBugs.map((b: any) => {
                const isResolved = b.status === "resolved" || b.status === "closed";
                return (
                  <span
                    key={b.id}
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 leading-none ${
                      isResolved
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 line-through"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                    title={`${formatBugId(b)}: ${b.title} (${b.status})`}
                  >
                    {formatBugId(b)}
                  </span>
                );
              })}
            </div>
          )}

          {/* GitHub Link Badges */}
          {task.githubLinks && task.githubLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {task.githubLinks.map((link: any) => (
                <GitHubLinkBadge
                  key={link.id}
                  link={link}
                  onRefresh={(updated) => {
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === task.id
                          ? {
                              ...t,
                              githubLinks: (t.githubLinks || []).map((l: any) =>
                                l.id === updated.id ? updated : l
                              ),
                            }
                          : t
                      )
                    );
                  }}
                  onDelete={(deletedId) => {
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === task.id
                          ? {
                              ...t,
                              githubLinks: (t.githubLinks || []).filter(
                                (l: any) => l.id !== deletedId
                              ),
                            }
                          : t
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}

          {task.description && (
            <div className="pt-1">
              {isExpanded ? (
                <div className="pt-1 pb-1">
                  <MarkdownPreview content={task.description} />
                </div>
              ) : (
                <div className="text-xs text-slate-300 leading-relaxed font-normal line-clamp-2">
                  {stripMarkdown(task.description)}
                </div>
              )}
              {(task.description.length > 90 ||
                task.description.includes("\n") ||
                task.description.includes("\\n")) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(task.id);
                  }}
                  className="mt-1 text-[11px] font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      <span>Show full description</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status Selector, Edit, Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={task.status}
            onChange={(e) => updateStatus(task.id, e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={() => setEditingTask(task)}
            title="Edit task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => deleteTask(task.id)}
            title="Delete task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <span>Tasks</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Actionable development to-dos organized by priority, deadlines, and project.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-slate-800 bg-slate-900/60">
        {/* Project Filter */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition text-xs text-slate-300">
          <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="relative flex items-center">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs font-medium"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="relative flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs font-medium"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Statuses</option>
              <option value="todo" className="bg-slate-950 text-slate-200">To Do</option>
              <option value="in_progress" className="bg-slate-950 text-slate-200">In Progress</option>
              <option value="done" className="bg-slate-950 text-slate-200">Done</option>
              <option value="cancelled" className="bg-slate-950 text-slate-200">Cancelled</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Date / Deadline Filter */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="relative flex items-center">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs font-medium"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Deadlines</option>
              <option value="overdue" className="bg-slate-950 text-slate-200">🔴 Overdue Only</option>
              <option value="due_soon" className="bg-slate-950 text-slate-200">🟡 Due Soon (Next 7d)</option>
              <option value="scheduled" className="bg-slate-950 text-slate-200">Scheduled</option>
              <option value="unscheduled" className="bg-slate-950 text-slate-200">Unscheduled</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition text-xs text-slate-300 sm:ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs font-medium"
            >
              <option value="newest" className="bg-slate-950 text-slate-200">Sort: Newest First</option>
              <option value="oldest" className="bg-slate-950 text-slate-200">Sort: Oldest First</option>
              <option value="due_earliest" className="bg-slate-950 text-slate-200">Sort: Deadline (Earliest)</option>
              <option value="priority" className="bg-slate-950 text-slate-200">Sort: Priority (Highest)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none shrink-0" />
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : displayedTasks.all.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No tasks match criteria</h3>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter !== "all" || projectFilter !== "all" || dateFilter !== "all"
              ? "Try adjusting your filters to see more tasks."
              : "Capture your first task with the button above."}
          </p>
        </div>
      ) : statusFilter !== "all" ? (
        <div className="space-y-3">
          {displayedTasks.all.map(renderTaskCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                <span>Active Tasks ({displayedTasks.active.length})</span>
              </h2>
            </div>

            {displayedTasks.active.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No active tasks. Create a new task or review completed items below.
              </div>
            ) : (
              displayedTasks.active.map(renderTaskCard)
            )}
          </div>

          {/* Implemented / Completed / Rejected Section */}
          {displayedTasks.completed.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowCompleted((prev) => !prev)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs uppercase font-bold tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Completed & Resolved ({displayedTasks.completed.length})</span>
                </span>
                <div className="flex items-center gap-1 text-[11px] font-normal text-slate-400 lowercase">
                  <span>{showCompleted ? "hide" : "show"}</span>
                  {showCompleted ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {showCompleted && (
                <div className="space-y-3 opacity-85 hover:opacity-100 transition">
                  {displayedTasks.completed.map(renderTaskCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Capture Dialog (Locked to Task Mode on Tasks Page) */}
      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectFilter !== "all" ? projectFilter : null}
        defaultTab="task"
        lockTab={true}
        onSuccess={loadTasks}
      />

      {/* Edit Task Dialog */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        projects={projects}
        onSuccess={loadTasks}
      />
    </div>
  );
}
