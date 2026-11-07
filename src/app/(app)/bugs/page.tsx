"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Bug,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Filter,
  FolderKanban,
  Calendar,
  AlertCircle,
  Clock,
  Pencil,
  ArrowUpDown,
  CheckCheck,
  CheckSquare,
} from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { EditBugModal } from "@/components/edit-bug-modal";
import { GitHubLinkBadge } from "@/components/github/github-link-badge";
import { MarkdownPreview, stripMarkdown } from "@/components/ui/markdown-preview";
import { PRIORITY_CONFIG, BUG_STATUS_CONFIG } from "@/lib/tokens";
import { formatBugId, formatTaskId } from "@/lib/identifiers";

function getBugDateStatus(dueDateStr?: string | null, status?: string) {
  if (!dueDateStr || status === "resolved" || status === "closed" || status === "wont_fix") {
    return null;
  }

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
      label: "Target: Today",
      badgeClass: "bg-warning-subtle text-amber-300 border-warning/40 font-semibold",
    };
  }
  if (diffDays <= 2) {
    return {
      type: "due_soon" as const,
      label: `Target in ${diffDays}d`,
      badgeClass: "bg-warning-subtle text-amber-300 border-warning/30",
    };
  }
  return {
    type: "scheduled" as const,
    label: `Target ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  };
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<any | null>(null);
  const [expandedBugs, setExpandedBugs] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(true);

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

  async function loadBugs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (projectFilter !== "all") params.set("projectId", projectFilter);

      const url = params.toString() ? `/api/bugs?${params.toString()}` : "/api/bugs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBugs(data);
      }
    } catch (err) {
      console.error("Failed to load bugs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadBugs();
  }, [statusFilter, projectFilter]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/bugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBugs((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error("Failed to update bug status:", err);
    }
  }

  async function deleteBug(id: string) {
    if (!confirm("Are you sure you want to delete this bug report?")) return;
    try {
      const res = await fetch(`/api/bugs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBugs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete bug:", err);
    }
  }

  function toggleExpand(id: string) {
    setExpandedBugs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Filter & Sort bugs
  const displayedBugs = useMemo(() => {
    let list = [...bugs];

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      list = list.filter((b) => {
        if (!b.dueDate) return dateFilter === "unscheduled";
        if (dateFilter === "unscheduled") return false;

        const due = new Date(b.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

        if (dateFilter === "overdue") {
          return diffDays < 0 && b.status !== "resolved" && b.status !== "closed" && b.status !== "wont_fix";
        }
        if (dateFilter === "due_soon") {
          return diffDays >= 0 && diffDays <= 7 && b.status !== "resolved" && b.status !== "closed";
        }
        if (dateFilter === "scheduled") {
          return !!b.dueDate;
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const active = list.filter(
      (b) => b.status === "open" || b.status === "confirmed" || b.status === "fixing"
    );
    const completed = list.filter(
      (b) => b.status === "resolved" || b.status === "closed" || b.status === "wont_fix"
    );

    return {
      all: list,
      active,
      completed,
    };
  }, [bugs, dateFilter, sortBy]);

  function renderBugCard(bug: any) {
    const isExpanded = !!expandedBugs[bug.id];
    const hasTechnicalDetails = bug.stackTrace || bug.reproSteps || bug.suspectedCause;
    const dateStatus = getBugDateStatus(bug.dueDate, bug.status);

    return (
      <div
        key={bug.id}
        id={`bug-${bug.id}`}
        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition space-y-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 leading-none">
                {formatBugId(bug)}
              </span>

              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border leading-none ${
                  PRIORITY_CONFIG[bug.priority]?.badgeClass || PRIORITY_CONFIG.medium.badgeClass
                }`}
              >
                {bug.priority}
              </span>

              {bug.projectName && (
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 cursor-pointer leading-none hover:bg-slate-700 transition"
                  onClick={() => setProjectFilter(bug.projectId)}
                  title="Filter by this project"
                >
                  {bug.projectName}
                </span>
              )}

              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border leading-none ${
                  BUG_STATUS_CONFIG[bug.status]?.badgeClass || "text-slate-400 border-slate-700"
                }`}
              >
                {BUG_STATUS_CONFIG[bug.status]?.label || bug.status.replace("_", " ")}
              </span>

              {/* Due Date / Resolution Deadline Indicator */}
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

            <h3
              onClick={() => setEditingBug(bug)}
              className="text-base font-semibold text-white cursor-pointer hover:text-amber-400 transition"
            >
              {bug.title}
            </h3>

            {/* Linked Tasks */}
            {bug.associatedTasks && bug.associatedTasks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Linked Task:</span>
                </span>
                {bug.associatedTasks.map((t: any) => (
                  <span
                    key={t.id}
                    className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/25 leading-none"
                    title={`${formatTaskId(t)}: ${t.title}`}
                  >
                    {formatTaskId(t)}: {t.title}
                  </span>
                ))}
              </div>
            )}

            {/* GitHub Link Badges */}
            {bug.githubLinks && bug.githubLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {bug.githubLinks.map((link: any) => (
                  <GitHubLinkBadge
                    key={link.id}
                    link={link}
                    onRefresh={(updated) => {
                      setBugs((prev) =>
                        prev.map((b) =>
                          b.id === bug.id
                            ? {
                                ...b,
                                githubLinks: (b.githubLinks || []).map((l: any) =>
                                  l.id === updated.id ? updated : l
                                ),
                              }
                            : b
                        )
                      );
                    }}
                    onDelete={(deletedId) => {
                      setBugs((prev) =>
                        prev.map((b) =>
                          b.id === bug.id
                            ? {
                                ...b,
                                githubLinks: (b.githubLinks || []).filter(
                                  (l: any) => l.id !== deletedId
                                ),
                              }
                            : b
                        )
                      );
                    }}
                  />
                ))}
              </div>
            )}

            {bug.description && (
              <div className="pt-1">
                {isExpanded ? (
                  <div className="pt-1 pb-1">
                    <MarkdownPreview content={bug.description} />
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed font-normal line-clamp-2">
                    {stripMarkdown(bug.description)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Dropdown, Edit, Delete */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={bug.status}
              onChange={(e) => updateStatus(bug.id, e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="open">Open</option>
              <option value="confirmed">Confirmed</option>
              <option value="fixing">Fixing</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="wont_fix">Won't Fix</option>
            </select>

            <button
              type="button"
              onClick={() => setEditingBug(bug)}
              title="Edit bug"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => deleteBug(bug.id)}
              title="Delete bug"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technical Accordion Section */}
        {hasTechnicalDetails && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => toggleExpand(bug.id)}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Details & Logs</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>View Full Description & Logs</span>
                </>
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-slate-800 text-xs">
                {bug.suspectedCause && (
                  <div>
                    <span className="font-semibold text-slate-300 block mb-0.5">
                      Suspected Cause:
                    </span>
                    <p className="text-slate-400">{bug.suspectedCause}</p>
                  </div>
                )}

                {bug.reproSteps && (
                  <div>
                    <span className="font-semibold text-slate-300 block mb-0.5">
                      Reproduction Steps:
                    </span>
                    <p className="text-slate-400 leading-relaxed">{bug.reproSteps}</p>
                  </div>
                )}

                {bug.stackTrace && (
                  <div>
                    <span className="font-semibold text-slate-300 block mb-1">
                      Stack Trace / Error Output:
                    </span>
                    <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-amber-300/90 overflow-x-auto">
                      {bug.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-amber-400" />
            <span>Bug Tracker</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Defects with reproduction notes, stack traces, deadlines, and root cause analysis.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Bug</span>
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60">
        {/* Project Filter */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300">
          <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="confirmed">Confirmed</option>
            <option value="fixing">Fixing</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="wont_fix">Won't Fix</option>
          </select>
        </div>

        {/* Deadline Filter */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">🔴 Overdue Only</option>
            <option value="due_soon">🟡 Due Soon (Next 7d)</option>
            <option value="scheduled">Scheduled</option>
            <option value="unscheduled">Unscheduled</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 sm:ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="due_earliest">Sort: Deadline (Earliest)</option>
            <option value="priority">Sort: Priority (Highest)</option>
          </select>
        </div>
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : displayedBugs.all.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <Bug className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No bugs match criteria</h3>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter !== "all" || projectFilter !== "all" || dateFilter !== "all"
              ? "Try adjusting your filters to see more bugs."
              : "Capture technical defects along with logs and repro steps."}
          </p>
        </div>
      ) : statusFilter !== "all" ? (
        <div className="space-y-4">
          {displayedBugs.all.map(renderBugCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Defects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Defects ({displayedBugs.active.length})</span>
              </h2>
            </div>

            {displayedBugs.active.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No active bugs. All defects are resolved or closed!
              </div>
            ) : (
              displayedBugs.active.map(renderBugCard)
            )}
          </div>

          {/* Resolved & Closed Section */}
          {displayedBugs.completed.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowCompleted((prev) => !prev)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs uppercase font-bold tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Resolved & Closed ({displayedBugs.completed.length})</span>
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
                <div className="space-y-4 opacity-85 hover:opacity-100 transition">
                  {displayedBugs.completed.map(renderBugCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Capture Dialog (Locked to Bug Mode on Bug Page) */}
      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectFilter !== "all" ? projectFilter : null}
        defaultTab="bug"
        lockTab={true}
        onSuccess={loadBugs}
      />

      {/* Edit Bug Dialog */}
      <EditBugModal
        isOpen={!!editingBug}
        onClose={() => setEditingBug(null)}
        bug={editingBug}
        projects={projects}
        onSuccess={loadBugs}
      />
    </div>
  );
}
