"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Bug, Brain, BookOpen, X, Loader2, FolderKanban, Calendar, AlertCircle, Zap, Layers, Terminal, ChevronDown } from "lucide-react";
import { MiniTextEditor } from "@/components/ui/mini-text-editor";
import { formatTaskId } from "@/lib/identifiers";
import { KnowledgeCategory } from "@/lib/knowledge";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProjectId?: string | null;
  defaultTab?: "task" | "bug" | "learning";
  lockTab?: boolean;
}

export function QuickCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId = null,
  defaultTab = "task",
  lockTab = false,
}: QuickCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<"task" | "bug" | "learning">(defaultTab);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Bug fields & associated task
  const [stackTrace, setStackTrace] = useState("");
  const [reproSteps, setReproSteps] = useState("");
  const [suspectedCause, setSuspectedCause] = useState("");
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [associatedTaskId, setAssociatedTaskId] = useState<string>("");

  // State
  const [learningCategory, setLearningCategory] = useState<KnowledgeCategory>("gotcha");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      fetch("/api/projects")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setProjects(Array.isArray(data) ? data : []))
        .catch(() => {});

      fetch("/api/tasks")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setTasksList(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen, defaultProjectId]);

  // Debounced duplicate detection
  useEffect(() => {
    if (!title.trim() || title.trim().length < 5) {
      setDuplicateWarning(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/agent/duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            type: activeTab,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hasDuplicates && data.matches && data.matches.length > 0) {
            setDuplicateWarning(
              `Potential duplicate: "${data.matches[0].title}" (${data.matches[0].confidence} confidence)`
            );
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [title, activeTab, description]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let endpoint = "/api/tasks";
      let body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId.trim() || undefined,
        startDate: startDate ? startDate : undefined,
        dueDate: dueDate ? dueDate : undefined,
      };

      if (activeTab === "bug") {
        endpoint = "/api/bugs";
        body = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          projectId: projectId.trim() || undefined,
          taskId: associatedTaskId.trim() || undefined,
          startDate: startDate ? startDate : undefined,
          dueDate: dueDate ? dueDate : undefined,
          stackTrace: stackTrace.trim() || undefined,
          reproSteps: reproSteps.trim() || undefined,
          suspectedCause: suspectedCause.trim() || undefined,
        };
      } else if (activeTab === "learning") {
        endpoint = "/api/learnings";
        let tagIds: string[] = [];
        const catTagName =
          learningCategory === "pattern"
            ? "design-pattern"
            : learningCategory === "snippet"
            ? "cli-snippet"
            : "gotcha";
        try {
          const tagRes = await fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: catTagName, color: "#4285F4" }),
          });
          if (tagRes.ok) {
            const tagData = await tagRes.json();
            if (tagData?.id) tagIds.push(tagData.id);
          }
        } catch {}

        body = {
          title: title.trim(),
          content: description.trim() || title.trim(),
          projectId: projectId.trim() || undefined,
          tagIds: tagIds.length > 0 ? tagIds : undefined,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create item");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStartDate("");
      setDueDate("");
      setDuplicateWarning(null);
      setStackTrace("");
      setReproSteps("");
      setSuspectedCause("");
      if (!defaultProjectId) setProjectId("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
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

        {/* Tab switcher or locked single-mode header */}
        {!lockTab ? (
          <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-6 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab("task")}
              className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "task"
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bug")}
              className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "bug"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Bug</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("learning")}
              className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "learning"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Learning</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800/80">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeTab === "bug"
                ? "bg-amber-500/10 border border-amber-500/25 text-amber-400"
                : activeTab === "learning"
                ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                : "bg-primary-subtle border border-primary/25 text-primary"
            }`}>
              {activeTab === "bug" ? (
                <Bug className="w-5 h-5" />
              ) : activeTab === "learning" ? (
                <BookOpen className="w-5 h-5" />
              ) : (
                <CheckSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {activeTab === "bug" ? "Report New Bug" : activeTab === "learning" ? "Record Knowledge" : "Create New Task"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === "bug"
                  ? "Log defect details, priority, target resolution, and stack traces."
                  : activeTab === "learning"
                  ? "Document technical gotchas, design patterns, and CLI snippets."
                  : "Track tasks, estimated dates, and development phases."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === "task"
                  ? "e.g. Implement refresh token rotation"
                  : activeTab === "bug"
                  ? "e.g. Postgres connection timeout under load"
                  : "e.g. Next.js middleware cannot use Node crypto/socket"
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition"
            />
            {duplicateWarning && (
              <div className="mt-2 p-2.5 rounded-xl border border-warning/40 bg-warning-subtle text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}
          </div>

          {activeTab === "learning" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Knowledge Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLearningCategory("gotcha")}
                  className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    learningCategory === "gotcha"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-xs"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs">Technical Gotcha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLearningCategory("pattern")}
                  className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    learningCategory === "pattern"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold shadow-xs"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs">Design Pattern</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLearningCategory("snippet")}
                  className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    learningCategory === "snippet"
                      ? "bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold shadow-xs"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs">CLI Snippet</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>{activeTab === "learning" ? "Note Content *" : "Description"}</span>
              {activeTab === "learning" && (
                <span className="text-[11px] text-slate-400 font-normal">Mini Markdown Editor</span>
              )}
            </label>
            {activeTab === "learning" ? (
              <MiniTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Explain the gotcha, command, or concept in your own words..."
                minHeight="min-h-[160px]"
                required
              />
            ) : (
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional context or notes..."
                className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition leading-relaxed"
              />
            )}
          </div>

          {/* Project & Priority Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <span>Project</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer appearance-none transition"
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

            {activeTab !== "learning" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Priority
                </label>
                <div className="relative flex items-center">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer appearance-none transition"
                  >
                    <option value="low" className="bg-slate-950 text-slate-200">Low</option>
                    <option value="medium" className="bg-slate-950 text-slate-200">Medium</option>
                    <option value="high" className="bg-slate-950 text-slate-200">High</option>
                    <option value="urgent" className="bg-slate-950 text-slate-200">Urgent</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          {activeTab === "task" && (
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Due Date (Deadline)</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-primary cursor-pointer transition"
                />
              </div>
            </div>
          )}

          {activeTab === "bug" && (
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
          )}

          {activeTab === "bug" && (
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              {tasksList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Associated Task</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={associatedTaskId}
                      onChange={(e) => setAssociatedTaskId(e.target.value)}
                      className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none transition"
                    >
                      <option value="" className="bg-slate-950 text-slate-200">No Associated Task (Standalone Bug)</option>
                      {tasksList.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                          {formatTaskId(t)}: {t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Stack Trace / Error Output
                </label>
                <textarea
                  rows={3}
                  value={stackTrace}
                  onChange={(e) => setStackTrace(e.target.value)}
                  placeholder="Paste stack trace or error log here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Reproduction Steps
                </label>
                <input
                  type="text"
                  value={reproSteps}
                  onChange={(e) => setReproSteps(e.target.value)}
                  placeholder="1. Trigger action, 2. Observe crash..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-800/80 mt-6">
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
              className={`px-6 py-2.5 rounded-xl disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition cursor-pointer ${
                activeTab === "bug"
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
                  : activeTab === "learning"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                  : "bg-primary hover:bg-primary-hover shadow-primary/25"
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {activeTab === "bug"
                  ? "Create Bug Report"
                  : activeTab === "learning"
                  ? "Record Knowledge"
                  : "Create Task"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
