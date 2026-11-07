"use client";

import { useState, useEffect } from "react";
import { Plus, Bug, Trash2, ChevronDown, ChevronUp, Loader2, Filter, FolderKanban } from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { PRIORITY_CONFIG, BUG_STATUS_CONFIG } from "@/lib/tokens";

export default function BugsPage() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedBugs, setExpandedBugs] = useState<Record<string, boolean>>({});

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
            Defects with stack traces, reproduction notes, and suspected root causes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
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

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Bug</span>
          </button>
        </div>
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <Bug className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No bugs recorded</h3>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "No bugs match the selected filters."
              : "Capture technical defects along with logs and repro steps."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => {
            const isExpanded = !!expandedBugs[bug.id];
            const hasTechnicalDetails =
              bug.stackTrace || bug.reproSteps || bug.suspectedCause;

            return (
              <div
                key={bug.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${
                          PRIORITY_CONFIG[bug.priority]?.badgeClass || PRIORITY_CONFIG.medium.badgeClass
                        }`}
                      >
                        {bug.priority}
                      </span>

                      {bug.projectName && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 cursor-pointer"
                          onClick={() => setProjectFilter(bug.projectId)}
                          title="Filter by this project"
                        >
                          {bug.projectName}
                        </span>
                      )}

                      <span
                        className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${
                          BUG_STATUS_CONFIG[bug.status]?.badgeClass || "text-slate-400 border-slate-700"
                        }`}
                      >
                        {BUG_STATUS_CONFIG[bug.status]?.label || bug.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white">
                      {bug.title}
                    </h3>

                    {bug.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {bug.description}
                      </p>
                    )}
                  </div>

                  {/* Status Dropdown & Delete */}
                  <div className="flex items-center gap-3 shrink-0">
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
                      onClick={() => deleteBug(bug.id)}
                      title="Delete bug"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Technical Context Accordion */}
                {hasTechnicalDetails && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => toggleExpand(bug.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide technical details</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View stack trace & context</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs">
                        {bug.suspectedCause && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">
                              Suspected Cause:
                            </span>
                            <p className="text-slate-400">{bug.suspectedCause}</p>
                          </div>
                        )}

                        {bug.reproSteps && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">
                              Reproduction Steps:
                            </span>
                            <p className="text-slate-400">{bug.reproSteps}</p>
                          </div>
                        )}

                        {bug.stackTrace && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">
                              Stack Trace:
                            </span>
                            <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-amber-200/90 overflow-x-auto whitespace-pre-wrap border border-slate-800">
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
          })}
        </div>
      )}

      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectFilter !== "all" ? projectFilter : null}
        onSuccess={loadBugs}
      />
    </div>
  );
}
