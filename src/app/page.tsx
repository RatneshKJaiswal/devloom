import Link from "next/link";
import { CheckSquare, Bug, Brain, Sparkles, ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-[#090d16]/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            D
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">DevLoom</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI-Powered Engineering Knowledge & Task Hub</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight">
          Never lose a bug fix, command, or gotcha again.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl">
          DevLoom is your developer-first personal workspace for tracking{" "}
          <span className="text-indigo-400 font-medium">Tasks</span>,{" "}
          <span className="text-amber-400 font-medium">Bugs</span>, and{" "}
          <span className="text-emerald-400 font-medium">Learnings</span> in one place, with an AI agent that turns raw paste into structured records.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition group"
          >
            <GithubIcon className="w-5 h-5" />
            <span>Continue with GitHub</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Actionable Tasks</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Organize day-to-day engineering to-dos with projects, tags, priorities, and due dates. Clean, fast, zero ceremony.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Bug className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Technical Bug Tracker</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Capture stack traces, reproduction steps, suspected causes, and fix links without wrestling with Jira workflows.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Spaced Learning Review</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Prevent notes from becoming graveyards. Built-in Leitner-interval review schedules resurface knowledge before you forget it.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        DevLoom &copy; {new Date().getFullYear()} &bull; Strictly Isolated Personal Workspaces &bull;{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
