"use client";

import { useState } from "react";
import { GithubIcon } from "@/components/icons/github";
import { RefreshCw, Unlink, ExternalLink, Loader2 } from "lucide-react";

export interface GitHubLinkItem {
  id: string;
  url: string;
  linkType: "issue" | "pull_request" | "file";
  repoOwner: string;
  repoName: string;
  issueOrPrNumber?: number | null;
  filePath?: string | null;
  cachedTitle?: string | null;
  cachedState?: string | null;
}

interface GitHubLinkBadgeProps {
  link: GitHubLinkItem;
  onRefresh?: (updated: GitHubLinkItem) => void;
  onDelete?: (id: string) => void;
}

export function GitHubLinkBadge({ link, onRefresh, onDelete }: GitHubLinkBadgeProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/links/github/${link.id}/refresh`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        if (onRefresh) onRefresh(updated);
      }
    } catch (err) {
      console.error("Failed to refresh GitHub link:", err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Unlink this GitHub item?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/links/github/${link.id}`, { method: "DELETE" });
      if (res.ok) {
        if (onDelete) onDelete(link.id);
      }
    } catch (err) {
      console.error("Failed to delete GitHub link:", err);
    } finally {
      setDeleting(false);
    }
  }

  const state = link.cachedState || "open";
  const stateColor =
    state === "merged"
      ? "bg-purple-950/60 text-purple-300 border-purple-500/30"
      : state === "closed"
      ? "bg-red-950/60 text-red-300 border-red-500/30"
      : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";

  const displayText =
    link.linkType === "file"
      ? `${link.repoName}/${link.filePath}`
      : `${link.repoOwner}/${link.repoName}#${link.issueOrPrNumber}`;

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/70 text-xs text-slate-300 hover:border-slate-700 transition">
      <GithubIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />

      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${stateColor}`}>
        {state}
      </span>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.cachedTitle || displayText}
        className="font-medium text-slate-200 hover:text-white flex items-center gap-1 max-w-[220px] truncate"
      >
        <span>{displayText}</span>
        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
      </a>

      {/* Refresh & Unlink Actions */}
      <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-1">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Sync latest GitHub status"
          className="p-1 rounded text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          {refreshing ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Unlink GitHub item"
          className="p-1 rounded text-slate-500 hover:text-red-400 transition cursor-pointer"
        >
          <Unlink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
