"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Failed to export data");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devloom-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error exporting data. Please try again.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
      alert("Error deleting account.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your account preferences, data backups, and privacy controls.
        </p>
      </div>

      {/* LLM & Privacy Disclosure */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-base font-semibold text-white">AI Agent & LLM Privacy</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          DevLoom connects to Google Gemini strictly to assist you with quick capture, code context, and recall questions.
          Only content you explicitly submit is sent to the LLM. Your data is isolated strictly to your account
          and never used to train public models.
        </p>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-white">Data Management & Portability</h2>
          <p className="text-sm text-slate-400 mt-1">
            Download a portable JSON backup of all your tasks, bugs, learnings, projects, and tags.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-primary" />
            )}
            <span>Export Complete Dataset (JSON)</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Permanently delete your account and all associated records. This action is irreversible.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                confirmDelete
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                  : "border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400"
              }`}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>
                {confirmDelete
                  ? "Click Again to Confirm Permanent Deletion"
                  : "Delete Account"}
              </span>
            </button>

            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
