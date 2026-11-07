"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FolderKanban,
  Trash2,
  Loader2,
  X,
  CheckSquare,
  Bug,
  Brain,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { GitHubRepoImportModal } from "@/components/github/github-repo-import-modal";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { ProjectSDLCBar } from "@/components/project/project-sdlc-bar";
import { ProjectMilestonesCard } from "@/components/project/project-milestones-card";
import { ProjectTimelineView } from "@/components/project/project-timeline-view";
import { SDLC_PHASE_CONFIG } from "@/lib/tokens";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGitHubImportOpen, setIsGitHubImportOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "bugs" | "learnings" | "timeline">("tasks");
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Form state for manual project creation
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjectDetails(projectId: string) {
    setSelectedProjectId(projectId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetails(data);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      setName("");
      setDescription("");
      setIsModalOpen(false);
      await loadProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Are you sure you want to delete this project? Items linked to it will remain.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
          setProjectDetails(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>Projects & Repositories</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track tasks, bugs, and learnings grouped by repository or project workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Import from GitHub Button */}
          <button
            type="button"
            onClick={() => setIsGitHubImportOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <GithubIcon className="w-3.5 h-3.5 text-slate-300" />
            <span>Import from GitHub</span>
          </button>

          {/* New Project Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <FolderKanban className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No projects yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Connect your GitHub repositories with one click or create custom project workspaces.
          </p>
          <button
            type="button"
            onClick={() => setIsGitHubImportOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Connect GitHub Repos</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isSelected = selectedProjectId === p.id;
            const taskCount = p.counts?.tasks || 0;
            const bugCount = p.counts?.bugs || 0;
            const learningCount = p.counts?.learnings || 0;

            return (
              <div
                key={p.id}
                onClick={() => loadProjectDetails(p.id)}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 cursor-pointer text-left ${
                  isSelected
                    ? "border-indigo-500/80 bg-slate-900 shadow-lg shadow-indigo-500/10"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700/80 hover:bg-slate-900/70"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || "#6366F1" }}
                      />
                      <h3 className="text-base font-semibold text-white truncate max-w-[200px]">
                        {p.name}
                      </h3>
                      {p.currentPhase && (
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                            SDLC_PHASE_CONFIG[p.currentPhase as keyof typeof SDLC_PHASE_CONFIG]?.badgeClass || "border-slate-700 text-slate-300"
                          }`}
                        >
                          {p.currentPhase}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(p.id);
                      }}
                      title="Delete project"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Connected Entity Counters */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1" title="Active Tasks">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{taskCount}</span>
                    </span>
                    <span className="flex items-center gap-1" title="Open Bugs">
                      <Bug className="w-3.5 h-3.5 text-amber-400" />
                      <span>{bugCount}</span>
                    </span>
                    <span className="flex items-center gap-1" title="Learnings">
                      <Brain className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{learningCount}</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-indigo-400 flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Project Deep-Dive Workspace */}
      {selectedProjectId && (
        <div className="p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: projectDetails?.project?.color || "#6366F1" }}
              />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {projectDetails?.project?.name || "Project Details"}
                </h2>
                <p className="text-xs text-slate-400">
                  {projectDetails?.project?.description || "All items tracked under this project."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item to this Project</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(null);
                  setProjectDetails(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loadingDetails ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project SDLC Tracking Bar */}
              <ProjectSDLCBar
                projectId={selectedProjectId}
                currentPhase={projectDetails?.project?.currentPhase || "planning"}
                phaseHistory={projectDetails?.phaseHistory || []}
                onPhaseChange={() => {
                  loadProjectDetails(selectedProjectId);
                  loadProjects();
                }}
              />

              {/* Project Milestones */}
              <ProjectMilestonesCard
                projectId={selectedProjectId}
                milestones={projectDetails?.milestones || []}
                onRefresh={() => loadProjectDetails(selectedProjectId)}
              />

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 max-w-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    activeTab === "tasks"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks ({projectDetails?.tasks?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    activeTab === "timeline"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bugs")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    activeTab === "bugs"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Bugs ({projectDetails?.bugs?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("learnings")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    activeTab === "learnings"
                      ? "bg-success text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Learnings ({projectDetails?.learnings?.length || 0})</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "timeline" && (
                <ProjectTimelineView
                  project={projectDetails.project}
                  tasks={projectDetails.tasks || []}
                  milestones={projectDetails.milestones || []}
                  dependencies={projectDetails.dependencies || []}
                  onRefresh={() => loadProjectDetails(selectedProjectId)}
                />
              )}

              {activeTab === "tasks" && (
                <div className="space-y-2">
                  {(!projectDetails?.tasks || projectDetails.tasks.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No tasks in this project yet. Click "Add Item to this Project" above.
                    </div>
                  ) : (
                    projectDetails.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-white">{task.title}</span>
                          {task.description && (
                            <p className="text-slate-400 text-[11px] line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {task.priority}
                          </span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20">
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "bugs" && (
                <div className="space-y-2">
                  {(!projectDetails?.bugs || projectDetails.bugs.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No bugs recorded in this project yet.
                    </div>
                  ) : (
                    projectDetails.bugs.map((bug: any) => (
                      <div
                        key={bug.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-white">{bug.title}</span>
                          {bug.description && (
                            <p className="text-slate-400 text-[11px] line-clamp-1">{bug.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {bug.priority}
                          </span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
                            {bug.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "learnings" && (
                <div className="space-y-2">
                  {(!projectDetails?.learnings || projectDetails.learnings.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No learnings recorded under this project yet.
                    </div>
                  ) : (
                    projectDetails.learnings.map((learning: any) => (
                      <div
                        key={learning.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-white">{learning.title}</span>
                          <p className="text-slate-400 text-[11px] line-clamp-1">{learning.content}</p>
                        </div>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                          Box {learning.reviewBox}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-white mb-4">Create New Project</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. backend-service"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{color}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GitHub Repos Import Modal */}
      <GitHubRepoImportModal
        isOpen={isGitHubImportOpen}
        onClose={() => setIsGitHubImportOpen(false)}
        onSuccess={() => {
          setIsGitHubImportOpen(false);
          loadProjects();
        }}
        existingProjectNames={projects.map((p) => p.name)}
      />

      {/* Quick capture scoped to project if selected */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultProjectId={selectedProjectId}
        onSuccess={() => {
          if (selectedProjectId) loadProjectDetails(selectedProjectId);
          loadProjects();
        }}
      />
    </div>
  );
}
