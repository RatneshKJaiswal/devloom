"use client";

import { useState } from "react";
import { Link2, Loader2, Check } from "lucide-react";
import { GitHubLinkItem } from "./github-link-badge";

interface GitHubLinkInputProps {
  entityType: "task" | "bug" | "learning";
  entityId: string;
  onLinkAdded: (newLink: GitHubLinkItem) => void;
}

export function GitHubLinkInput({ entityType, entityId, onLinkAdded }: GitHubLinkInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/links/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link GitHub item");
      }

      setUrl("");
      setIsOpen(false);
      onLinkAdded(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
      >
        <Link2 className="w-3 h-3" />
        <span>Link GitHub</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleAddLink} className="inline-flex items-center gap-1.5">
      <input
        type="url"
        required
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/owner/repo/issues/123"
        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary w-64"
      />

      <button
        type="submit"
        disabled={loading}
        className="px-2 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium disabled:opacity-50 transition cursor-pointer shadow-sm shadow-primary/20"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setError(null);
        }}
        className="text-[11px] text-slate-400 hover:text-white px-1"
      >
        Cancel
      </button>

      {error && <span className="text-[11px] text-red-400 ml-1">{error}</span>}
    </form>
  );
}
