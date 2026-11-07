"use client";

import { useState, useEffect } from "react";
import { GithubIcon } from "@/components/icons/github";
import { Search, X, Loader2, Check, Lock, Globe, Plus, AlertCircle } from "lucide-react";
import { GitHubRepository } from "@/lib/github/client";

interface GitHubRepoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProjectNames: string[];
}

export function GitHubRepoImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingProjectNames,
}: GitHubRepoImportModalProps) {
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetch("/api/github/repos")
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to load GitHub repositories");
          }
          setRepos(data.repos || []);
        })
        .catch((err) => {
          setError(err.message || "Failed to load GitHub repositories.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleImport(repo: GitHubRepository) {
    setImportingId(repo.id);
    setError(null);

    // Pick a deterministic color based on repo name
    const colors = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
    const charCodeSum = repo.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const selectedColor = colors[charCodeSum % colors.length];

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repo.name,
          description: repo.description || `Repository imported from GitHub: ${repo.fullName}`,
          color: selectedColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to import project");
    } finally {
      setImportingId(null);
    }
  }

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
            <GithubIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Import from GitHub Repositories</h2>
            <p className="text-xs text-slate-400">
              Select any of your repositories to track tasks, bugs, and learnings for it.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your repositories..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Repo List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="text-xs">Fetching repositories from GitHub...</span>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              {search.trim() ? "No repositories matching your search." : "No repositories found for your account."}
            </div>
          ) : (
            filteredRepos.map((repo) => {
              const alreadyImported = existingProjectNames.some(
                (name) => name.toLowerCase() === repo.name.toLowerCase()
              );
              const isImporting = importingId === repo.id;

              return (
                <div
                  key={repo.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/80 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {repo.name}
                      </span>
                      {repo.isPrivate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Public</span>
                        </span>
                      )}
                      {repo.language && (
                        <span className="text-[10px] font-medium text-slate-400">
                          &bull; {repo.language}
                        </span>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{repo.description}</p>
                    )}
                  </div>

                  {alreadyImported ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span>Imported</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={() => handleImport(repo)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      {isImporting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Import</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
