import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-12 px-4 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to DevLoom</span>
      </Link>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy & LLM Disclosure</h1>
        </div>

        <p className="text-sm text-slate-400">
          Last updated: November 2026
        </p>

        <section className="space-y-3 pt-4">
          <h2 className="text-xl font-semibold text-white">1. Data Isolation & Ownership</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            DevLoom is designed with strict multi-tenant boundaries. Every task, bug, learning, project, and tag belongs
            exclusively to your account. All queries are scoped strictly to your authenticated GitHub account. No other user
            can view, search, or mutate your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. What Data is Sent to the LLM Provider</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            DevLoom uses AI models to power smart features (Smart Capture, GitHub link analysis, duplicate detection, and daily standup generation).
            Only the specific text you submit for smart capture or workspace summary generation is sent to the AI processing service.
            We do not share your full workspace or cross-user records.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Third-Party GitHub OAuth Tokens</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            GitHub OAuth tokens are stored encrypted at rest using AES-256-GCM encryption. We only request minimum read-only permissions
            necessary to link issues, pull requests, and commit files.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Account Deletion and Data Export</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            You retain 100% ownership of your engineering data. You can export your entire dataset in JSON format at any time or permanently delete
            your account and all associated records with one click in Settings.
          </p>
        </section>
      </div>
    </div>
  );
}
