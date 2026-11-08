"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Download, Loader2, FileText, RefreshCw } from "lucide-react";

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Array<{ id: string; name: string }>;
  initialProjectId?: string;
}

export function ReleaseNotesModal({
  isOpen,
  onClose,
  projects = [],
  initialProjectId,
}: ReleaseNotesModalProps) {
  const [version, setVersion] = useState("1.0.0");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [stats, setStats] = useState<{
    featuresCount: number;
    fixesCount: number;
    maintenanceCount: number;
    totalItems: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      handleGenerate();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: version.trim() || "1.0.0",
          projectId: selectedProjectId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarkdown(data.markdown);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to generate release notes:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CHANGELOG-${version}.md`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#121316] shadow-2xl p-5 sm:p-6 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Draft Release Notes & Changelog
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregate closed tasks and resolved defects into formatted Markdown notes.
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Release Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.2.0"
              className="w-full h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Scope Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Stats Pill Badges */}
        {stats && (
          <div className="flex items-center gap-2 mb-3 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-800 text-blue-300">
              {stats.featuresCount} Features
            </span>
            <span className="px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800 text-red-300">
              {stats.fixesCount} Fixes
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              {stats.maintenanceCount} Chores
            </span>
          </div>
        )}

        {/* Markdown Output Preview */}
        <div className="flex-1 min-h-[220px] max-h-[360px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap select-all">
          {loading ? (
            <div className="h-full flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Aggregating release items...</span>
            </div>
          ) : (
            markdown || "No items to display"
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">Keep a Changelog standard format</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!markdown}
              className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!markdown}
              className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Notes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
