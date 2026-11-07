"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Check, AlertCircle, Bug, CheckSquare, Brain, Link2 } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { SmartCaptureOutput } from "@/lib/agent/prompts/capture";

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SmartCaptureModal({ isOpen, onClose, onSuccess }: SmartCaptureModalProps) {
  const [mode, setMode] = useState<"text" | "github">("text");
  const [rawText, setRawText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted candidate state
  const [candidate, setCandidate] = useState<SmartCaptureOutput | null>(null);

  if (!isOpen) return null;

  async function handleAnalyze() {
    if (mode === "github") {
      if (!githubUrl.trim()) return;
      setAnalyzing(true);
      setError(null);
      setCandidate(null);

      try {
        const res = await fetch("/api/agent/github-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubUrl: githubUrl.trim() }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to import GitHub issue");
        }

        setGithubUrl("");
        onClose();
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setAnalyzing(false);
      }
      return;
    }

    if (!rawText.trim()) return;

    setAnalyzing(true);
    setError(null);
    setCandidate(null);

    try {
      const res = await fetch("/api/agent/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawText, autoSave: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze input with AI");
      }

      setCandidate(data.candidate);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmSave() {
    if (!candidate) return;

    setSaving(true);
    setError(null);

    try {
      let endpoint = "/api/tasks";
      let body: Record<string, unknown> = {
        title: candidate.title,
        description: candidate.description,
        priority: candidate.priority,
      };

      if (candidate.entityType === "bug") {
        endpoint = "/api/bugs";
        body = {
          ...body,
          stackTrace: candidate.bugDetails?.stackTrace,
          reproSteps: candidate.bugDetails?.reproSteps,
          suspectedCause: candidate.bugDetails?.suspectedCause,
        };
      } else if (candidate.entityType === "learning") {
        endpoint = "/api/learnings";
        body = {
          title: candidate.title,
          content: candidate.description || candidate.title,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save item");
      }

      setRawText("");
      setCandidate(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to commit item to workspace");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Smart Capture (Gemini AI)</h2>
            <p className="text-xs text-slate-400">
              Paste stack traces, rough notes, or link a GitHub issue/PR to automatically structure it.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        {!candidate && (
          <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4 max-w-xs">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex-1 py-1 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                mode === "text"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Raw Text / Logs
            </button>
            <button
              type="button"
              onClick={() => setMode("github")}
              className={`flex-1 py-1 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === "github"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub URL</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!candidate ? (
            mode === "text" ? (
              /* Raw Text Input */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Raw Developer Input (Max 8,000 characters)
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste stack traces, error messages, terminal snippets, or rough thoughts here...

Example:
TypeError: Cannot read properties of undefined (reading 'userId')
    at handleRequest (/app/api/tasks/route.ts:42:15)
    Occurs when request session is expired or unauthenticated."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Treats pasted text as untrusted data</span>
                    <span>{rawText.length} / 8,000</span>
                  </div>
                </div>
              </div>
            ) : (
              /* GitHub URL Input */
              <div className="space-y-3 py-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub Issue or Pull Request URL
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo/issues/123"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    The agent fetches the issue title, description, and labels, generates a clean task or bug, and establishes a live link.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Structured Candidate Preview */
            <div className="space-y-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {candidate.entityType === "task" && <CheckSquare className="w-4 h-4 text-indigo-400" />}
                  {candidate.entityType === "bug" && <Bug className="w-4 h-4 text-amber-400" />}
                  {candidate.entityType === "learning" && <Brain className="w-4 h-4 text-emerald-400" />}

                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Classified as {candidate.entityType}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCandidate(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Edit Input
                </button>
              </div>

              {/* Editable Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={candidate.title}
                  onChange={(e) => setCandidate({ ...candidate, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Editable Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {candidate.entityType === "learning" ? "Note Content" : "Description"}
                </label>
                <textarea
                  rows={3}
                  value={candidate.description}
                  onChange={(e) => setCandidate({ ...candidate, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Priority & Tags */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={candidate.priority}
                    onChange={(e) => setCandidate({ ...candidate, priority: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {candidate.tags && candidate.tags.length > 0 && (
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Suggested Tags</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {candidate.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bug Details Preview */}
              {candidate.entityType === "bug" && candidate.bugDetails && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {candidate.bugDetails.suspectedCause && (
                    <div>
                      <span className="text-xs font-semibold text-amber-400 block mb-0.5">
                        Suspected Cause:
                      </span>
                      <p className="text-xs text-slate-300">{candidate.bugDetails.suspectedCause}</p>
                    </div>
                  )}

                  {candidate.bugDetails.stackTrace && (
                    <div>
                      <span className="text-xs font-semibold text-amber-400 block mb-0.5">
                        Extracted Stack Trace:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-28 whitespace-pre-wrap border border-slate-800">
                        {candidate.bugDetails.stackTrace}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          {!candidate ? (
            <button
              type="button"
              disabled={analyzing || (mode === "text" ? !rawText.trim() : !githubUrl.trim())}
              onClick={handleAnalyze}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{mode === "github" ? "Fetching & Summarizing..." : "Gemini Analyzing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{mode === "github" ? "Import from GitHub" : "Analyze & Structure"}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Workspace</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
