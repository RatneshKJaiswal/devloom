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
    <div className="inline-flex max-w-full items-center justify-between gap-2 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/80 text-xs text-slate-300 hover:border-slate-700 transition shadow-xs group/badge">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <GithubIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        <span
          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${stateColor}`}
        >
          {state}
        </span>

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.cachedTitle ? `${link.cachedTitle} (${displayText})` : displayText}
          className="min-w-0 flex-1 flex items-center gap-1 font-medium text-slate-200 hover:text-white group/link transition"
        >
          <span className="truncate">{displayText}</span>
          <ExternalLink className="w-3 h-3 text-slate-500 group-hover/link:text-slate-300 shrink-0" />
        </a>
      </div>

      {/* Refresh & Unlink Actions - Guaranteed shrink-0 to prevent overflow */}
      <div className="flex items-center gap-0.5 border-l border-slate-800/90 pl-1.5 shrink-0">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Sync latest GitHub status"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
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
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin text-red-400" />
          ) : (
            <Unlink className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}
