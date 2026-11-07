"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  User,
  Building,
  Briefcase,
  Mail,
  Check,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { DeveloperTokensCard } from "@/components/settings/developer-tokens-card";

export default function SettingsPage() {
  const router = useRouter();

  // Profile State
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  // Account Management State
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch current user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/account");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setImage(data.image || "");
          setOrganization(data.organization || "");
          setRole(data.role || "");
          setGithubUsername(data.githubUsername || null);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim() || null,
          organization: organization.trim() || null,
          role: role.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile");
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your personal developer profile, workspace preferences, and account data.
        </p>
      </div>

      {/* 1. User Profile Section */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>User Profile</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal identity, avatar, and engineering organization details.
            </p>
          </div>

          {githubUsername && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <GithubIcon className="w-3.5 h-3.5 text-white" />
              <span>@{githubUsername}</span>
            </div>
          )}
        </div>

        {profileLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading user profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* User Identity Display */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="relative group shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt={name || "User"}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-slate-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {name?.[0] || "U"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {name || "Developer"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {email || "Connected via GitHub"}
                </div>
                {role && (
                  <div className="mt-1 text-[11px] font-medium text-primary">
                    {role} {organization ? `at ${organization}` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    required
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full !pl-11 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full !pl-11 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Organization / Company
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI, Independent"
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full !pl-11 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Job Role / Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Staff Software Engineer"
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full !pl-11 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>
            </div>

            {profileError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>User profile updated successfully!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-2 shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Developer Tokens & CLI Suite */}
      <DeveloperTokensCard />

      {/* 3. AI Agent & LLM Privacy Disclosure */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-base font-semibold text-white">AI Agent & LLM Privacy</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          DevLoom connects to AI models strictly to assist you with quick capture, code context, and recall questions.
          Only content you explicitly submit is sent to the LLM. Your data is isolated strictly to your account
          and never used to train public models.
        </p>
      </div>

      {/* 3. Data Management & Danger Zone */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-white">Data Portability</h2>
          <p className="text-xs text-slate-400 mt-1">
            Download a complete portable JSON export of your tasks, bugs, learnings, and project records.
          </p>
        </div>

        <div>
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
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently delete your account and all associated workspace records. This cannot be undone.
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
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
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
