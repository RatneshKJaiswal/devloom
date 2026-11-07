"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";

interface TokenItem {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function DeveloperTokensCard() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form State
  const [tokenName, setTokenName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(90);

  // Newly created token
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Load tokens
  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      const res = await fetch("/api/account/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/account/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName.trim(),
          expiresInDays: expiresInDays ? Number(expiresInDays) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create token");
      }

      const data = await res.json();
      setNewlyCreatedToken(data.token);
      setTokenName("");
      loadTokens();
    } catch (err: any) {
      alert(err.message || "Failed to create token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke this Personal Access Token? Any CLI or scripts using it will lose access immediately.")) {
      return;
    }

    try {
      const res = await fetch(`/api/account/tokens/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert("Failed to revoke token");
      }
    } catch (err) {
      console.error("Failed to revoke token:", err);
    }
  }

  function copyToClipboard(text: string, setCopiedState: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  }

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Developer Tokens & CLI Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authenticate the DevLoom CLI (`devloom`) and terminal shell functions without browser cookies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateDialog(true);
            setNewlyCreatedToken(null);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Token</span>
        </button>
      </div>

      {/* Cleartext Token Alert upon Creation */}
      {newlyCreatedToken && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Copy your Personal Access Token now</span>
          </div>
          <p className="text-[11px] text-slate-300">
            For security reasons, this token will never be displayed again. Store it securely or paste it into your CLI.
          </p>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-amber-300">
            <span className="truncate flex-1 select-all">{newlyCreatedToken}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(newlyCreatedToken, setCopiedToken)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              title="Copy Token"
            >
              {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* 1-Line Terminal Auto-Installer */}
          <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium">
              <span>⚡ 1-Line Terminal Install & Auto-Login:</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `curl -fsSL "${origin}/api/cli/install?token=${newlyCreatedToken}" | bash`,
                    setCopiedOneLiner
                  )
                }
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                {copiedOneLiner ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedOneLiner ? "Copied" : "Copy Command"}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
              curl -fsSL &quot;{origin}/api/cli/install?token={newlyCreatedToken}&quot; | bash
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal / Form */}
      {showCreateDialog && !newlyCreatedToken && (
        <form onSubmit={handleCreateToken} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Generate New Personal Access Token</span>
            <button
              type="button"
              onClick={() => setShowCreateDialog(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Token Name</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g. MacBook Pro Terminal, Cursor Agent"
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Expiration</label>
              <select
                value={expiresInDays === null ? "never" : expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value === "never" ? null : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days (Recommended)</option>
                <option value={180}>180 Days</option>
                <option value="never">No Expiration</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateDialog(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !tokenName.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>Generate Token</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Tokens Table */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-300">Active Personal Access Tokens</div>
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Loading tokens...</span>
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
            No Personal Access Tokens generated yet. Create one to use DevLoom CLI.
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
            {tokens.map((token) => (
              <div key={token.id} className="p-3 bg-slate-950/40 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{token.name}</span>
                    <span className="font-mono text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {token.tokenPrefix}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      Last used:{" "}
                      {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "Never"}
                    </span>
                    <span>•</span>
                    <span>
                      Expires:{" "}
                      {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevoke(token.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition cursor-pointer shrink-0"
                  title="Revoke Token"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DevLoom CLI Terminal Quickstart */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>DevLoom Terminal CLI Setup</span>
          </div>
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                `npm link\ndevloom login\nsource <(curl -s http://localhost:3000/devloom.sh)`,
                setCopiedSnippet
              )
            }
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? "Copied" : "Copy Setup"}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
          <div className="text-slate-500"># 1. Install CLI directly (No git repository clone required)</div>
          <div className="text-emerald-400">curl -fsSL &quot;{origin}/install.sh&quot; | bash</div>

          <div className="text-slate-500 pt-1"># (Or if developing locally from repository source)</div>
          <div className="text-slate-400">npm link</div>

          <div className="text-slate-500 pt-1"># 2. Authenticate CLI</div>
          <div className="text-emerald-400">devloom login</div>

          <div className="text-slate-500 pt-1"># 3. Use in any project or terminal window</div>
          <div className="text-slate-300">
            devloom task <span className="text-amber-300">&quot;Fix database connection pool&quot;</span> -p high
          </div>
          <div className="text-slate-300">
            devloom gotcha <span className="text-amber-300">&quot;Postgres connection timeout&quot;</span> -s <span className="text-amber-300">&quot;Set idle_timeout: 20&quot;</span>
          </div>
          <div className="text-slate-300">devloom standup</div>
        </div>
      </div>
    </div>
  );
}
