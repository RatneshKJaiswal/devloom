import Link from "next/link";
import {
  CheckSquare,
  Bug,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FolderKanban,
  Calendar,
  Lock,
  GitPullRequest,
  Terminal,
  Zap,
  Layers,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { DevLoomLogo } from "@/components/icons/devloom-logo";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0d0e12] text-slate-100 selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/90 bg-[#121316]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <DevLoomLogo className="h-8 w-8 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">DevLoom</span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-primary bg-primary-subtle border border-primary/25">
              v1.0
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#preview" className="hover:text-white transition">
            Workspace Preview
          </a>
          <a href="#security" className="hover:text-white transition">
            Architecture & Privacy
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login?mode=signin"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/login?mode=login"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition shadow-sm shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Log In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            The personal engineering workspace for developers who ship.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Unify task tracking, software defect triage, and critical technical gotchas into one unified interface. Integrated with GitHub, SDLC milestones, and developer workflows.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 items-center justify-center">
            <Link
              href="/login?mode=signin"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 transition group cursor-pointer"
            >
              <GithubIcon className="w-4 h-4 text-white" />
              <span>Sign In with GitHub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/login?mode=login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Log In to Workspace</span>
            </Link>
          </div>

          {/* Security & Reliability Checklist */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Single-Tenant Isolation</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>AES-256-GCM Encrypted Tokens</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
              <span>Zero Public Model Training</span>
            </span>
          </div>
        </div>

        {/* High-Fidelity Interactive Product Preview */}
        <div id="preview" className="mt-14 w-full rounded-2xl border border-slate-800 bg-[#121316] shadow-2xl overflow-hidden">
          {/* Mock Window Titlebar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">devloom / workspace / main</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Live Engine
              </span>
            </div>
          </div>

          {/* Mock App Body */}
          <div className="p-6 space-y-6">
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Tasks (14)</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900 text-slate-400 text-xs font-medium flex items-center gap-1.5 border border-slate-800">
                  <Bug className="w-3.5 h-3.5 text-amber-400" />
                  <span>Defects (3)</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900 text-slate-400 text-xs font-medium flex items-center gap-1.5 border border-slate-800">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Knowledge (28)</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <FolderKanban className="w-3.5 h-3.5 text-primary" />
                <span>project: payment-gateway-v2</span>
              </div>
            </div>

            {/* Three Mock Live Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Task Item */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold text-primary bg-primary-subtle border border-primary/25 leading-none">
                    TSK-108
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 leading-none">
                    High
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">
                  Refactor PostgreSQL connection pool timeouts
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due in 2 days</span>
                </div>
              </div>

              {/* Bug Item */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 leading-none">
                    BUG-042
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 leading-none">
                    Urgent
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">
                  WebSocket reconnection dropped on worker reload
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <GitPullRequest className="w-3 h-3" />
                  <span>Linked to PR #142</span>
                </div>
              </div>

              {/* Knowledge Note */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 leading-none">
                    GOTCHA
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 leading-none">
                    Next.js
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  React 19 Server Action Serialization Boundary
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  #react #nextjs #gotchas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#121316] hover:border-slate-700 transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Actionable Tasks</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize day-to-day engineering to-dos with projects, tags, priorities, and deadlines. Built for speed with sub-second keyboard capture and zero ceremony.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#121316] hover:border-slate-700 transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-warning-subtle border border-warning/20 flex items-center justify-center text-warning">
              <Bug className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Software Defect Triage</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture stack traces, reproduction steps, suspected causes, and fix references without wrestling with enterprise issue trackers.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#121316] hover:border-slate-700 transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Developer Knowledge Base</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Repository for technical gotchas, architectural design patterns, and CLI snippets. Formatted with Markdown and instant modal reading.
            </p>
          </div>
        </div>

        {/* Architecture & Privacy Section */}
        <div id="security" className="mt-20 p-8 rounded-2xl border border-slate-800 bg-[#121316] w-full text-left space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-base font-semibold text-white">Engineered for Data Privacy & Security</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            DevLoom enforces PostgreSQL Row-Level Security (RLS) ensuring strict isolation across personal workspaces. All GitHub OAuth access tokens are encrypted with AES-256-GCM before storage. We request only read permissions and never use developer data to train public models.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/90 text-center text-xs text-slate-500 bg-[#121316]">
        DevLoom &bull; Personal Engineering Workspace &bull;{" "}
        <Link href="/privacy" className="hover:underline text-slate-400">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
